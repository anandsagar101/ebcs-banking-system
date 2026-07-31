package com.ebcs.platform.events;

import java.math.BigDecimal;

public class LoanDisbursedEvent extends DomainEvent {
    private final Long loanId;
    private final Long customerId;
    private final Long accountId;
    private final BigDecimal amount;

    public LoanDisbursedEvent(Long loanId, Long customerId, Long accountId, BigDecimal amount) {
        this.loanId = loanId; this.customerId = customerId; this.accountId = accountId; this.amount = amount;
    }
    public Long getLoanId() { return loanId; }
    public Long getCustomerId() { return customerId; }
    public Long getAccountId() { return accountId; }
    public BigDecimal getAmount() { return amount; }
    @Override public String getType() { return "LOAN_DISBURSED"; }
}
