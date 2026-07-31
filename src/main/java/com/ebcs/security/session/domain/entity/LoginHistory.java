package com.ebcs.security.session.domain.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "login_history")
public class LoginHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private boolean success;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public LoginHistory() {}
    public LoginHistory(String username, boolean success, String ipAddress, String userAgent, String failureReason) {
        this.username = username; this.success = success; this.ipAddress = ipAddress;
        this.userAgent = userAgent; this.failureReason = failureReason;
    }
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public boolean isSuccess() { return success; }
    public String getIpAddress() { return ipAddress; }
    public String getUserAgent() { return userAgent; }
    public String getFailureReason() { return failureReason; }
    public Instant getCreatedAt() { return createdAt; }
}
