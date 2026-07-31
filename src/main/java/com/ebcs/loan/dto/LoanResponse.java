package com.ebcs.loan.dto;

import com.ebcs.loan.domain.entity.LoanStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record LoanResponse(Long id, Long customerId, Long productId, BigDecimal principal,
                           BigDecimal interestRate, Integer termMonths, Long disbursementAccountId,
                           LoanStatus status, Instant createdAt) {}
