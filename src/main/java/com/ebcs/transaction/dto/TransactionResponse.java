package com.ebcs.transaction.dto;

import com.ebcs.transaction.domain.entity.TransactionStatus;
import com.ebcs.transaction.domain.entity.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;

public record TransactionResponse(Long id, String reference, Long fromAccountId, Long toAccountId,
                                  TransactionType txType, BigDecimal amount, TransactionStatus status,
                                  String description, Instant createdAt) {}
