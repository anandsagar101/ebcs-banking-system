package com.ebcs.deposit.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record BookFdRequest(@NotNull Long accountId, @NotNull @Positive BigDecimal principal,
                            @NotNull @Positive BigDecimal interestRate,
                            @NotNull @Positive Integer termMonths) {}
