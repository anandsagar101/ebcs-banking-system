package com.ebcs.security.passwordreset.application.service;

import com.ebcs.administration.domain.entity.AppUser;
import com.ebcs.administration.repository.AppUserRepository;
import com.ebcs.notification.application.service.NotificationService;
import com.ebcs.security.passwordreset.domain.entity.PasswordResetOtp;
import com.ebcs.security.passwordreset.repository.PasswordResetOtpRepository;
import com.ebcs.shared.exception.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/**
 * Manages email-based password reset with a 6-digit OTP.
 * <ul>
 *   <li>OTP is BCrypt-hashed before persistence — the raw code never lives in the DB.</li>
 *   <li>Expires in 5 minutes.</li>
 *   <li>Max 5 verification attempts before the OTP is locked.</li>
 *   <li>Resend cooldown of 60 seconds against the most recent unconsumed OTP.</li>
 *   <li>OTP is invalidated (consumed) on the first successful verification.</li>
 * </ul>
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private final AppUserRepository userRepo;
    private final PasswordResetOtpRepository otpRepo;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notifications;
    private final SecureRandom random = new SecureRandom();

    private final long ttlSeconds;
    private final long resendCooldownSeconds;
    private final int maxAttempts;
    private final String appName;

    public PasswordResetService(AppUserRepository userRepo,
                                PasswordResetOtpRepository otpRepo,
                                PasswordEncoder passwordEncoder,
                                NotificationService notifications,
                                @Value("${security.password-reset.ttl-seconds:300}") long ttlSeconds,
                                @Value("${security.password-reset.resend-cooldown-seconds:60}") long resendCooldownSeconds,
                                @Value("${security.password-reset.max-attempts:5}") int maxAttempts,
                                @Value("${security.password-reset.app-name:EBCS}") String appName) {
        this.userRepo = userRepo;
        this.otpRepo = otpRepo;
        this.passwordEncoder = passwordEncoder;
        this.notifications = notifications;
        this.ttlSeconds = ttlSeconds;
        this.resendCooldownSeconds = resendCooldownSeconds;
        this.maxAttempts = maxAttempts;
        this.appName = appName;
    }

    public long getTtlSeconds() { return ttlSeconds; }
    public long getResendCooldownSeconds() { return resendCooldownSeconds; }
    public int getMaxAttempts() { return maxAttempts; }

    /**
     * Initiate a password reset. Silent no-op if the email is not registered.
     * Returns the seconds until a resend is allowed (so the UI can start its countdown).
     */
    @Transactional
    public long initiate(String email, String ipAddress) {
        if (email == null || email.isBlank()) throw new BusinessException("Email is required");
        String normalized = email.trim().toLowerCase();

        // Enforce resend cooldown for the same email even if no user exists (prevents email-based enumeration timing).
        Optional<PasswordResetOtp> lastOpt = otpRepo.findFirstByEmailOrderByCreatedAtDesc(normalized);
        if (lastOpt.isPresent()) {
            long ageSeconds = Duration.between(lastOpt.get().getCreatedAt(), Instant.now()).getSeconds();
            if (ageSeconds < resendCooldownSeconds) {
                return resendCooldownSeconds - ageSeconds;
            }
        }

        Optional<AppUser> userOpt = userRepo.findByEmail(normalized);
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for unknown email {} — silent noop", normalized);
            return resendCooldownSeconds;
        }
        AppUser user = userOpt.get();

        String otp = generateOtp();
        PasswordResetOtp entity = new PasswordResetOtp();
        entity.setUsername(user.getUsername());
        entity.setEmail(normalized);
        entity.setOtpHash(passwordEncoder.encode(otp));
        entity.setExpiresAt(Instant.now().plusSeconds(ttlSeconds));
        entity.setMaxAttempts(maxAttempts);
        entity.setIpAddress(ipAddress);
        otpRepo.save(entity);

        sendOtpEmail(normalized, user.getUsername(), otp);
        log.info("Password reset OTP issued for {} (expires in {}s)", normalized, ttlSeconds);
        return resendCooldownSeconds;
    }

    /**
     * Verify the OTP entered by the user. Returns the resolved username on success so the
     * caller can mint a short-lived reset token; throws BusinessException on any failure.
     */
    @Transactional
    public String verify(String email, String otp) {
        if (email == null || otp == null) throw new BusinessException("Email and code are required");
        if (!otp.matches("\\d{6}")) throw new BusinessException("Invalid OTP format");
        String normalized = email.trim().toLowerCase();

        PasswordResetOtp entity = otpRepo.findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(normalized)
                .orElseThrow(() -> new BusinessException("No active reset code. Request a new one."));

        if (entity.isExpired()) {
            entity.setConsumed(true);
            entity.setConsumedAt(Instant.now());
            otpRepo.save(entity);
            throw new BusinessException("Code expired. Request a new one.");
        }
        if (entity.getAttempts() >= entity.getMaxAttempts()) {
            entity.setConsumed(true);
            entity.setConsumedAt(Instant.now());
            otpRepo.save(entity);
            throw new BusinessException("Too many attempts. Request a new code.");
        }

        entity.setAttempts(entity.getAttempts() + 1);
        boolean match = passwordEncoder.matches(otp, entity.getOtpHash());
        if (!match) {
            int remaining = Math.max(0, entity.getMaxAttempts() - entity.getAttempts());
            otpRepo.save(entity);
            if (remaining == 0) {
                throw new BusinessException("Too many attempts. Request a new code.");
            }
            throw new BusinessException("Incorrect code. " + remaining + " attempt(s) remaining.");
        }

        // Success — invalidate immediately.
        entity.setConsumed(true);
        entity.setConsumedAt(Instant.now());
        otpRepo.save(entity);
        return entity.getUsername();
    }

    /**
     * Finalise the password change using the username baked into the reset token.
     */
    @Transactional
    public void applyNewPassword(String username, String newPassword) {
        if (newPassword == null || newPassword.length() < 6)
            throw new BusinessException("Password must be at least 6 characters");
        AppUser user = userRepo.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        // Best-effort security notice; never blocks the flow.
        try {
            notifications.dispatch("EMAIL", user.getEmail(),
                    "Your " + appName + " password was changed",
                    "Hi " + user.getUsername() + ",\n\nYour password was just changed via the self-service reset flow. "
                            + "If this wasn't you, please contact support immediately.",
                    "PASSWORD_RESET_COMPLETED");
        } catch (Exception ignored) { /* logged inside NotificationService */ }
    }

    String generateOtp() {
        int code = random.nextInt(1_000_000);
        return String.format("%06d", code);
    }

    private void sendOtpEmail(String recipient, String username, String otp) {
        String subject = "Your " + appName + " password reset code";
        String body =
                "Hi " + username + ",\n\n"
                        + "Use the code below to reset your " + appName + " password. It expires in "
                        + (ttlSeconds / 60) + " minutes.\n\n"
                        + "    " + otp + "\n\n"
                        + "If you didn't request this, you can safely ignore this email — your password will not change.\n\n"
                        + "— " + appName + " Security";
        notifications.dispatch("EMAIL", recipient, subject, body, "PASSWORD_RESET_OTP");
    }
}
