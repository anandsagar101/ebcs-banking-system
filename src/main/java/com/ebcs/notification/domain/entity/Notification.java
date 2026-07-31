package com.ebcs.notification.domain.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String recipient;

    @Column(nullable = false)
    private String channel;

    private String subject;

    @Column(nullable = false, length = 2000)
    private String body;

    @Column(name = "event_type")
    private String eventType;

    @Column(nullable = false)
    private String status = "SENT";

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Notification() {}
    public Notification(String recipient, String channel, String subject, String body, String eventType, String status) {
        this.recipient = recipient; this.channel = channel; this.subject = subject; this.body = body;
        this.eventType = eventType; this.status = status;
    }

    public Long getId() { return id; }
    public String getRecipient() { return recipient; }
    public String getChannel() { return channel; }
    public String getSubject() { return subject; }
    public String getBody() { return body; }
    public String getEventType() { return eventType; }
    public String getStatus() { return status; }
    public Instant getReadAt() { return readAt; }
    public void setReadAt(Instant readAt) { this.readAt = readAt; }
    public Instant getCreatedAt() { return createdAt; }
}
