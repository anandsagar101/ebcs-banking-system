package com.ebcs.notification.provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

/**
 * Fallback logging email provider — only registered when {@code resend.api-key} is blank/missing.
 * In production the {@link ResendEmailProvider} takes over for the {@code EMAIL} channel.
 */
@Component
@ConditionalOnExpression("T(org.springframework.util.StringUtils).isEmpty('${resend.api-key:}'.trim())")
public class LoggingEmailProvider implements NotificationProvider {
    private static final Logger log = LoggerFactory.getLogger(LoggingEmailProvider.class);

    private final boolean enabled;
    public LoggingEmailProvider(@Value("${notifications.email.enabled:true}") boolean enabled) {
        this.enabled = enabled;
    }

    @Override public String channel() { return "EMAIL"; }

    @Override
    public boolean send(NotificationMessage m) {
        if (!enabled) { log.debug("[EMAIL disabled] to={} subject={}", m.getRecipient(), m.getSubject()); return false; }
        log.info("[EMAIL] to={} subject='{}' body='{}'", m.getRecipient(), m.getSubject(), m.getBody());
        return true;
    }
}
