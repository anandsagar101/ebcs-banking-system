package com.ebcs.security.mfa.controller;

import com.ebcs.security.mfa.application.service.TotpService;
import com.ebcs.shared.exception.BusinessException;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/security/mfa")
public class MfaController {

    private final TotpService totp;
    private final String issuer;

    public MfaController(TotpService totp, @Value("${security.mfa.issuer:EBCS}") String issuer) {
        this.totp = totp; this.issuer = issuer;
    }

    @GetMapping("/status")
    public Map<String, Object> status(Authentication auth) {
        return Map.of("username", auth.getName(), "enabled", totp.isEnabled(auth.getName()));
    }

    @PostMapping("/enroll")
    public Map<String, String> enroll(Authentication auth) {
        String secret = totp.beginEnrollment(auth.getName());
        return Map.of("secret", secret, "otpauthUrl", totp.otpauthUrl(auth.getName(), secret, issuer));
    }

    @PostMapping("/verify")
    public Map<String, Object> verify(Authentication auth, @RequestBody VerifyRequest req) {
        boolean ok = totp.verifyAndEnable(auth.getName(), req.code);
        if (!ok) throw new BusinessException("Invalid MFA code");
        return Map.of("enabled", true);
    }

    @DeleteMapping
    public Map<String, Object> disable(Authentication auth) {
        totp.disable(auth.getName());
        return Map.of("enabled", false);
    }

    public static class VerifyRequest {
        @NotBlank public String code;
    }
}
