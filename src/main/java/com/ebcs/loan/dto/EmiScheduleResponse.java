package com.ebcs.loan.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EmiScheduleResponse(Integer installmentNo, LocalDate dueDate,
                                  BigDecimal principalComponent, BigDecimal interestComponent,
                                  BigDecimal totalAmount, boolean paid) {}
