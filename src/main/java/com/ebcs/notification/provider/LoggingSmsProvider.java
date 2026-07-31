package com.ebcs.notification.provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Default logging SMS provider. Swap for Twilio/SNS without touching callers. */
@Component
public class LoggingSmsProvider implements NotificationProvider {
    private static final Logger log = LoggerFactory.getLogger(LoggingSmsProvider.class);
    private final boolean enabled;
    public LoggingSmsProvider(@Value("${notifications.sms.enabled:true}") boolean enabled) {
        this.enabled = enabled;
    }
    @Override public String channel() { return "SMS"; }
    @Override public boolean send(NotificationMessage m) {
        if (!enabled) { log.debug("[SMS disabled] to={}", m.getRecipient()); return false; }
        log.info("[SMS] to={} body='{}'", m.getRecipient(), m.getBody());
        return true;
    }
}
