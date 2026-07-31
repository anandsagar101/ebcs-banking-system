package com.ebcs.integration.upi;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class UpiAdapter {
    private static final Logger log = LoggerFactory.getLogger(UpiAdapter.class);
    public String initiate(String fromVpa, String toVpa, BigDecimal amount) {
        String ref = "UPI-" + System.currentTimeMillis();
        log.info("[UPI] {} -> {} amount={} ref={}", fromVpa, toVpa, amount, ref);
        return ref;
    }
}
