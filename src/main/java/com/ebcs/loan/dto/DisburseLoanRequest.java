package com.ebcs.loan.dto;

import jakarta.validation.constraints.NotNull;

public record DisburseLoanRequest(@NotNull Long accountId) {}
