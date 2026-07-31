package com.ebcs.platform.events;

import java.math.BigDecimal;

public class LoanApprovedEvent extends DomainEvent {
    private final Long loanId;
    private final Long customerId;
    private final BigDecimal principal;

    public LoanApprovedEvent(Long loanId, Long customerId, BigDecimal principal) {
        this.loanId = loanId; this.customerId = customerId; this.principal = principal;
    }
    public Long getLoanId() { return loanId; }
    public Long getCustomerId() { return customerId; }
    public BigDecimal getPrincipal() { return principal; }
    @Override public String getType() { return "LOAN_APPROVED"; }
}
