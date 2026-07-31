package com.ebcs.notification.provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Default logging push provider. Swap for FCM/APNs without touching callers. */
@Component
public class LoggingPushProvider implements NotificationProvider {
    private static final Logger log = LoggerFactory.getLogger(LoggingPushProvider.class);
    private final boolean enabled;
    public LoggingPushProvider(@Value("${notifications.push.enabled:true}") boolean enabled) {
        this.enabled = enabled;
    }
    @Override public String channel() { return "PUSH"; }
    @Override public boolean send(NotificationMessage m) {
        if (!enabled) { log.debug("[PUSH disabled] to={}", m.getRecipient()); return false; }
        log.info("[PUSH] to={} title='{}' body='{}'", m.getRecipient(), m.getSubject(), m.getBody());
        return true;
    }
}
