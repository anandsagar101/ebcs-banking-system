package com.ebcs.security.mfa.application.service;

import com.ebcs.security.mfa.domain.entity.UserMfa;
import com.ebcs.security.mfa.repository.UserMfaRepository;
import com.ebcs.shared.exception.BusinessException;
import org.apache.commons.codec.binary.Base32;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;

/** RFC 6238 TOTP (Google Authenticator compatible). 30s step, 6 digits, HmacSHA1. */
@Service
public class TotpService {

    private static final int TIME_STEP = 30;
    private static final int DIGITS = 6;
    private final SecureRandom random = new SecureRandom();
    private final Base32 base32 = new Base32();
    private final UserMfaRepository repo;

    public TotpService(UserMfaRepository repo) { this.repo = repo; }

    @Transactional
    public String beginEnrollment(String username) {
        byte[] seed = new byte[20];
        random.nextBytes(seed);
        String secret = base32.encodeToString(seed).replace("=", "");
        UserMfa mfa = repo.findByUsername(username).orElseGet(UserMfa::new);
        mfa.setUsername(username); mfa.setSecret(secret); mfa.setEnabled(false); mfa.setVerifiedAt(null);
        repo.save(mfa);
        return secret;
    }

    public String otpauthUrl(String username, String secret, String issuer) {
        String label = URLEncoder.encode(issuer + ":" + username, StandardCharsets.UTF_8);
        return "otpauth://totp/" + label
                + "?secret=" + secret
                + "&issuer=" + URLEncoder.encode(issuer, StandardCharsets.UTF_8)
                + "&digits=" + DIGITS + "&period=" + TIME_STEP;
    }

    @Transactional
    public boolean verifyAndEnable(String username, String code) {
        UserMfa mfa = repo.findByUsername(username).orElseThrow(() -> new BusinessException("MFA not enrolled"));
        if (!verifyCode(mfa.getSecret(), code)) return false;
        mfa.setEnabled(true); mfa.setVerifiedAt(Instant.now());
        repo.save(mfa);
        return true;
    }

    public boolean verify(String username, String code) {
        return repo.findByUsername(username)
                .filter(UserMfa::isEnabled)
                .map(m -> verifyCode(m.getSecret(), code))
                .orElse(false);
    }

    @Transactional
    public void disable(String username) { repo.findByUsername(username).ifPresent(repo::delete); }

    public boolean isEnabled(String username) {
        return repo.findByUsername(username).map(UserMfa::isEnabled).orElse(false);
    }

    boolean verifyCode(String secret, String code) {
        if (code == null || !code.matches("\\d{6}")) return false;
        long window = Instant.now().getEpochSecond() / TIME_STEP;
        for (int offset = -1; offset <= 1; offset++) {
            if (code.equals(generateCode(secret, window + offset))) return true;
        }
        return false;
    }

    String generateCode(String base32Secret, long counter) {
        try {
            byte[] key = base32.decode(base32Secret);
            byte[] data = new byte[8];
            for (int i = 7; i >= 0; i--) { data[i] = (byte) (counter & 0xff); counter >>= 8; }
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);
            int offset = hash[hash.length - 1] & 0xf;
            int binary = ((hash[offset] & 0x7f) << 24)
                       | ((hash[offset + 1] & 0xff) << 16)
                       | ((hash[offset + 2] & 0xff) << 8)
                       | (hash[offset + 3] & 0xff);
            int otp = binary % (int) Math.pow(10, DIGITS);
            return String.format("%0" + DIGITS + "d", otp);
        } catch (Exception e) { throw new IllegalStateException(e); }
    }
}
