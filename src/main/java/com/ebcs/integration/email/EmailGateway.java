package com.ebcs.integration.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class EmailGateway {
    private static final Logger log = LoggerFactory.getLogger(EmailGateway.class);
    public void send(String to, String subject, String body) {
        log.info("[EMAIL] to={} subject={}", to, subject);
    }
}
