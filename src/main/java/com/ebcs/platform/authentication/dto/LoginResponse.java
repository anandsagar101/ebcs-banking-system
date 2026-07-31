package com.ebcs.platform.authentication.dto;

import java.util.List;

/**
 * Response returned by /api/auth/login. When {@code mfaRequired} is true the client
 * must call /api/auth/mfa/login-verify with the {@code challengeToken} + the 6-digit
 * code before it receives an access token.
 */
public record LoginResponse(
        boolean mfaRequired,
        String challengeToken,
        long challengeExpiresInMs,
        String accessToken,
        String tokenType,
        long expiresInMs,
        String username,
        List<String> roles
) {
    public static LoginResponse challenge(String username, String challengeToken, long ttlMs) {
        return new LoginResponse(true, challengeToken, ttlMs, null, null, 0L, username, null);
    }
    public static LoginResponse ok(String accessToken, long expiresInMs, String username, List<String> roles) {
        return new LoginResponse(false, null, 0L, accessToken, "Bearer", expiresInMs, username, roles);
    }
}
