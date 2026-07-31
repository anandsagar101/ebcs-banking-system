package com.ebcs.account.dto;

import com.ebcs.account.domain.entity.AccountStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record AccountResponse(Long id, String accountNumber, Long customerId, Long productId,
                              AccountStatus status, BigDecimal balance, BigDecimal dailyLimit,
                              Instant createdAt) {}
