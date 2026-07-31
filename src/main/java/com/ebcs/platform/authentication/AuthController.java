package com.ebcs.platform.authentication;

import com.ebcs.administration.domain.entity.AppUser;
import com.ebcs.administration.domain.entity.Role;
import com.ebcs.administration.repository.AppUserRepository;
import com.ebcs.administration.repository.RoleRepository;
import com.ebcs.platform.authentication.dto.AuthResponse;
import com.ebcs.platform.authentication.dto.LoginRequest;
import com.ebcs.platform.authentication.dto.LoginResponse;
import com.ebcs.platform.authentication.dto.RegisterRequest;
import com.ebcs.platform.events.UserLoggedInEvent;
import com.ebcs.security.mfa.application.service.TotpService;
import com.ebcs.security.passwordreset.application.service.PasswordResetService;
import com.ebcs.security.session.application.service.SessionService;
import com.ebcs.shared.exception.BusinessException;
import com.ebcs.shared.exception.ResourceNotFoundException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /** 5 minutes to complete MFA after password step. */
    static final long MFA_CHALLENGE_TTL_MS = 5 * 60 * 1000L;
    /** 15 minutes to complete /reset-password after OTP verification. */
    static final long PASSWORD_RESET_TOKEN_TTL_MS = 15 * 60 * 1000L;

    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final AppUserRepository userRepo;
    private final RoleRepository roleRepo;
    private final PasswordEncoder passwordEncoder;
    private final SessionService sessionService;
    private final ApplicationEventPublisher events;
    private final TotpService totp;
    private final PasswordResetService passwordReset;

    public AuthController(AuthenticationManager authManager, JwtService jwtService,
                          AppUserRepository userRepo, RoleRepository roleRepo,
                          PasswordEncoder passwordEncoder,
                          SessionService sessionService,
                          ApplicationEventPublisher events,
                          TotpService totp,
                          PasswordResetService passwordReset) {
        this.authManager = authManager;
        this.jwtService = jwtService;
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.passwordEncoder = passwordEncoder;
        this.sessionService = sessionService;
        this.events = events;
        this.totp = totp;
        this.passwordReset = passwordReset;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest http) {
        String ip = clientIp(http);
        String ua = http.getHeader("User-Agent");
        try {
            Authentication authentication = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.username(), req.password()));
            List<String> roles = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority).toList();

            // If the user has enrolled + verified MFA, do NOT hand out a session token yet —
            // return a short-lived challenge that must be exchanged for an access token via
            // /api/auth/mfa/login-verify. This is what actually blocks access.
            if (totp.isEnabled(req.username())) {
                String challenge = jwtService.generatePurposeToken(req.username(), "mfa-challenge", MFA_CHALLENGE_TTL_MS);
                sessionService.recordLogin(req.username(), false, ip, ua, "mfa_required");
                return LoginResponse.challenge(req.username(), challenge, MFA_CHALLENGE_TTL_MS);
            }

            String token = jwtService.generateToken(req.username(), roles);
            sessionService.recordLogin(req.username(), true, ip, ua, null);
            events.publishEvent(new UserLoggedInEvent(req.username(), ip, ua, true));
            return LoginResponse.ok(token, jwtService.getExpirationMs(), req.username(), roles);
        } catch (BadCredentialsException e) {
            sessionService.recordLogin(req.username(), false, ip, ua, "bad_credentials");
            events.publishEvent(new UserLoggedInEvent(req.username(), ip, ua, false));
            throw e;
        }
    }

    @PostMapping("/mfa/login-verify")
    public LoginResponse mfaLoginVerify(@Valid @RequestBody MfaLoginVerifyRequest req, HttpServletRequest http) {
        String username;
        try {
            username = jwtService.parseSubjectForPurpose(req.challengeToken, "mfa-challenge");
        } catch (JwtException e) {
            throw new BusinessException("Challenge expired. Please sign in again.");
        }
        if (!totp.verify(username, req.code)) {
            sessionService.recordLogin(username, false, clientIp(http), http.getHeader("User-Agent"), "mfa_invalid_code");
            throw new BusinessException("Invalid MFA code");
        }
        AppUser user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<String> roles = user.getRoles().stream().map(Role::getName).toList();
        String token = jwtService.generateToken(username, roles);
        sessionService.recordLogin(username, true, clientIp(http), http.getHeader("User-Agent"), "mfa_ok");
        events.publishEvent(new UserLoggedInEvent(username, clientIp(http), http.getHeader("User-Agent"), true));
        return LoginResponse.ok(token, jwtService.getExpirationMs(), username, roles);
    }

    @PostMapping("/register")
    @Transactional
    public AuthResponse register(@Valid @RequestBody RegisterRequest req, HttpServletRequest http) {
        if (userRepo.existsByUsername(req.username())) throw new BusinessException("Username taken");
        if (userRepo.existsByEmail(req.email())) throw new BusinessException("Email taken");

        Role userRole = roleRepo.findByName("ROLE_USER")
                .orElseGet(() -> roleRepo.save(new Role("ROLE_USER")));
        AppUser user = new AppUser();
        user.setUsername(req.username());
        user.setEmail(req.email());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);
        user.setEnabled(true);
        userRepo.save(user);

        List<String> roleNames = List.of(userRole.getName());
        String token = jwtService.generateToken(req.username(), roleNames);
        sessionService.recordLogin(req.username(), true, clientIp(http), http.getHeader("User-Agent"), null);
        return new AuthResponse(token, "Bearer", jwtService.getExpirationMs(), req.username(), roleNames);
    }

    @PostMapping("/change-password")
    @Transactional
    public void changePassword(@Valid @RequestBody ChangePasswordRequest req, Authentication auth) {
        AppUser user = userRepo.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!passwordEncoder.matches(req.currentPassword, user.getPasswordHash()))
            throw new BusinessException("Current password is incorrect");
        if (req.newPassword.length() < 6)
            throw new BusinessException("New password must be at least 6 characters");
        user.setPasswordHash(passwordEncoder.encode(req.newPassword));
        userRepo.save(user);
    }

    // ------------------------------------------------------------------
    // Password reset via email OTP (Resend)
    // ------------------------------------------------------------------

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@Valid @RequestBody EmailOnlyRequest req,
                                                              HttpServletRequest http) {
        long cooldown = passwordReset.initiate(req.email, clientIp(http));
        // Always return 200 with the cooldown so we don't leak whether the email is registered.
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "If the email is registered, a code was sent.",
                "cooldownSeconds", cooldown,
                "ttlSeconds", passwordReset.getTtlSeconds(),
                "maxAttempts", passwordReset.getMaxAttempts()
        ));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<Map<String, Object>> resendOtp(@Valid @RequestBody EmailOnlyRequest req,
                                                         HttpServletRequest http) {
        long cooldown = passwordReset.initiate(req.email, clientIp(http));
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "cooldownSeconds", cooldown,
                "ttlSeconds", passwordReset.getTtlSeconds()
        ));
    }

    @PostMapping("/verify-otp")
    public Map<String, Object> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        String username = passwordReset.verify(req.email, req.code);
        String resetToken = jwtService.generatePurposeToken(username, "password-reset", PASSWORD_RESET_TOKEN_TTL_MS);
        return Map.of(
                "ok", true,
                "resetToken", resetToken,
                "expiresInMs", PASSWORD_RESET_TOKEN_TTL_MS
        );
    }

    @PostMapping("/reset-password")
    public Map<String, Object> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        String username;
        try {
            username = jwtService.parseSubjectForPurpose(req.resetToken, "password-reset");
        } catch (JwtException e) {
            throw new BusinessException("Reset session expired. Please start over.");
        }
        passwordReset.applyNewPassword(username, req.newPassword);
        return Map.of("ok", true, "message", "Password updated. You can sign in with your new password.");
    }

    private String clientIp(HttpServletRequest r) {
        String xff = r.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return r.getRemoteAddr();
    }

    // ------------------------------------------------------------------
    // Request DTOs
    // ------------------------------------------------------------------

    public static class ChangePasswordRequest {
        @NotBlank public String currentPassword;
        @NotBlank @Size(min = 6, max = 100) public String newPassword;
    }

    public static class MfaLoginVerifyRequest {
        @NotBlank public String challengeToken;
        @NotBlank @Size(min = 6, max = 6) public String code;
    }

    public static class EmailOnlyRequest {
        @NotBlank @Email public String email;
    }

    public static class VerifyOtpRequest {
        @NotBlank @Email public String email;
        @NotBlank @Size(min = 6, max = 6) public String code;
    }

    public static class ResetPasswordRequest {
        @NotBlank public String resetToken;
        @NotBlank @Size(min = 6, max = 100) public String newPassword;
    }
}
