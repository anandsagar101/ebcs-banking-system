package com.ebcs.loan.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record ApplyLoanRequest(@NotNull Long customerId, @NotNull Long productId,
                               @NotNull @Positive BigDecimal principal,
                               @NotNull @Positive BigDecimal interestRate,
                               @NotNull @Positive Integer termMonths) {}
