package com.ebcs.deposit.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FixedDepositResponse(Long id, Long accountId, BigDecimal principal, BigDecimal interestRate,
                                   Integer termMonths, LocalDate startDate, LocalDate maturityDate, String status) {}
