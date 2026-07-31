package com.ebcs.loan.domain.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "loans")
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal principal;

    @Column(name = "interest_rate", nullable = false, precision = 6, scale = 3)
    private BigDecimal interestRate;

    @Column(name = "term_months", nullable = false)
    private Integer termMonths;

    @Column(name = "disbursement_account_id")
    private Long disbursementAccountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanStatus status = LoanStatus.APPLIED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long v) { this.customerId = v; }
    public Long getProductId() { return productId; }
    public void setProductId(Long v) { this.productId = v; }
    public BigDecimal getPrincipal() { return principal; }
    public void setPrincipal(BigDecimal v) { this.principal = v; }
    public BigDecimal getInterestRate() { return interestRate; }
    public void setInterestRate(BigDecimal v) { this.interestRate = v; }
    public Integer getTermMonths() { return termMonths; }
    public void setTermMonths(Integer v) { this.termMonths = v; }
    public Long getDisbursementAccountId() { return disbursementAccountId; }
    public void setDisbursementAccountId(Long v) { this.disbursementAccountId = v; }
    public LoanStatus getStatus() { return status; }
    public void setStatus(LoanStatus v) { this.status = v; }
    public Instant getCreatedAt() { return createdAt; }
}
