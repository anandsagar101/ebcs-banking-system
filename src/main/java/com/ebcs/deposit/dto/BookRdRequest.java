package com.ebcs.deposit.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record BookRdRequest(@NotNull Long accountId, @NotNull @Positive BigDecimal installmentAmount,
                            @NotNull @Positive BigDecimal interestRate,
                            @NotNull @Positive Integer termMonths) {}
