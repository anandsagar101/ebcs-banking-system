package com.ebcs.notification.provider;

/** Common contract for email / SMS / push adapters. */
public interface NotificationProvider {
    /** @return true if sent, false if provider silently dropped (still recorded). */
    boolean send(NotificationMessage message);
    String channel();
}
