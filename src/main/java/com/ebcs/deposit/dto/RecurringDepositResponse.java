package com.ebcs.deposit.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringDepositResponse(Long id, Long accountId, BigDecimal installmentAmount,
                                       BigDecimal interestRate, Integer termMonths,
                                       LocalDate startDate, String status) {}
