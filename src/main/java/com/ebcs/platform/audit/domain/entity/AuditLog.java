package com.ebcs.platform.audit.domain.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String actor;

    @Column(nullable = false)
    private String action;

    private String resource;

    @Column(length = 2000)
    private String payload;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AuditLog() {}
    public AuditLog(String actor, String action, String resource, String payload) {
        this.actor = actor; this.action = action; this.resource = resource; this.payload = payload;
    }

    public Long getId() { return id; }
    public String getActor() { return actor; }
    public String getAction() { return action; }
    public String getResource() { return resource; }
    public String getPayload() { return payload; }
    public Instant getCreatedAt() { return createdAt; }
}
