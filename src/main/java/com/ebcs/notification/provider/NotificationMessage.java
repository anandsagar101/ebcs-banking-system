package com.ebcs.notification.provider;

public class NotificationMessage {
    private final String recipient;
    private final String subject;
    private final String body;
    private final String eventType;

    public NotificationMessage(String recipient, String subject, String body, String eventType) {
        this.recipient = recipient; this.subject = subject; this.body = body; this.eventType = eventType;
    }
    public String getRecipient() { return recipient; }
    public String getSubject() { return subject; }
    public String getBody() { return body; }
    public String getEventType() { return eventType; }
}
