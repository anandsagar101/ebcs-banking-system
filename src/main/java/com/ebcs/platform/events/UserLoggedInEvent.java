package com.ebcs.platform.events;

/** Fired on successful authentication. */
public class UserLoggedInEvent extends DomainEvent {
    private final String username;
    private final String ipAddress;
    private final String userAgent;
    private final boolean success;

    public UserLoggedInEvent(String username, String ipAddress, String userAgent, boolean success) {
        this.username = username; this.ipAddress = ipAddress; this.userAgent = userAgent; this.success = success;
    }
    public String getUsername() { return username; }
    public String getIpAddress() { return ipAddress; }
    public String getUserAgent() { return userAgent; }
    public boolean isSuccess() { return success; }
    @Override public String getType() { return success ? "LOGIN_SUCCESS" : "LOGIN_FAILED"; }
}
