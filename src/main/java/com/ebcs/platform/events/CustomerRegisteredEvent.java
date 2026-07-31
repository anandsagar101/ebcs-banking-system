package com.ebcs.platform.events;

public class CustomerRegisteredEvent extends DomainEvent {
    private final Long customerId;
    private final String email;
    private final String phone;
    private final String fullName;

    public CustomerRegisteredEvent(Long customerId, String email, String phone, String fullName) {
        this.customerId = customerId; this.email = email; this.phone = phone; this.fullName = fullName;
    }
    public Long getCustomerId() { return customerId; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getFullName() { return fullName; }
    @Override public String getType() { return "CUSTOMER_REGISTERED"; }
}
