package com.ebcs.platform.authentication;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;
    private final String issuer;

    public JwtService(@Value("${security.jwt.secret}") String secret,
                      @Value("${security.jwt.expiration-ms}") long expirationMs,
                      @Value("${security.jwt.issuer}") String issuer) {
        byte[] bytes;
        try {
            bytes = Decoders.BASE64.decode(secret);
            if (bytes.length < 32) throw new IllegalArgumentException("too short");
        } catch (Exception e) {
            bytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expirationMs = expirationMs;
        this.issuer = issuer;
    }

    public String generateToken(String username, List<String> roles) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .issuer(issuer)
                .subject(username)
                .claims(Map.of("roles", roles, "purpose", "access"))
                .issuedAt(now)
                .expiration(exp)
                .signWith(key)
                .compact();
    }

    /** Short-lived token used to bridge password-verified -> MFA-verified. */
    public String generatePurposeToken(String username, String purpose, long ttlMs) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + ttlMs);
        return Jwts.builder()
                .issuer(issuer)
                .subject(username)
                .claims(Map.of("purpose", purpose))
                .issuedAt(now)
                .expiration(exp)
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) throws JwtException {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    public String parseSubjectForPurpose(String token, String expectedPurpose) throws JwtException {
        Claims c = parse(token);
        Object p = c.get("purpose");
        if (p == null || !expectedPurpose.equals(p.toString()))
            throw new JwtException("Token purpose mismatch");
        return c.getSubject();
    }

    public long getExpirationMs() { return expirationMs; }
}
