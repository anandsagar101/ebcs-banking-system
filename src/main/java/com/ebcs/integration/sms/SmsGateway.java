package com.ebcs.integration.sms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SmsGateway {
    private static final Logger log = LoggerFactory.getLogger(SmsGateway.class);
    public void send(String phone, String message) {
        log.info("[SMS] to={} message={}", phone, message);
    }
}
