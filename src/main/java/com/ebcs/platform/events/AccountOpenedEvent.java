package com.ebcs.platform.events;

public class AccountOpenedEvent extends DomainEvent {
    private final Long accountId;
    private final Long customerId;
    private final String accountNumber;

    public AccountOpenedEvent(Long accountId, Long customerId, String accountNumber) {
        this.accountId = accountId; this.customerId = customerId; this.accountNumber = accountNumber;
    }
    public Long getAccountId() { return accountId; }
    public Long getCustomerId() { return customerId; }
    public String getAccountNumber() { return accountNumber; }
    @Override public String getType() { return "ACCOUNT_OPENED"; }
}
