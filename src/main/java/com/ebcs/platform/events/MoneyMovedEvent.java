package com.ebcs.platform.events;

import java.math.BigDecimal;

public class MoneyMovedEvent extends DomainEvent {
    public enum Kind { DEPOSIT, WITHDRAWAL, TRANSFER, REVERSAL, IMPS }

    private final Kind kind;
    private final Long fromAccountId;
    private final Long toAccountId;
    private final BigDecimal amount;
    private final String reference;

    public MoneyMovedEvent(Kind kind, Long fromAccountId, Long toAccountId, BigDecimal amount, String reference) {
        this.kind = kind; this.fromAccountId = fromAccountId; this.toAccountId = toAccountId;
        this.amount = amount; this.reference = reference;
    }
    public Kind getKind() { return kind; }
    public Long getFromAccountId() { return fromAccountId; }
    public Long getToAccountId() { return toAccountId; }
    public BigDecimal getAmount() { return amount; }
    public String getReference() { return reference; }
    @Override public String getType() { return "MONEY_" + kind.name(); }
}
