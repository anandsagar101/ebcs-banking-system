package com.ebcs.ledger.dto;

import com.ebcs.ledger.domain.entity.EntryType;

import java.math.BigDecimal;
import java.time.Instant;

public record LedgerEntryResponse(Long id, String transactionRef, Long accountId, EntryType entryType,
                                  BigDecimal amount, BigDecimal balanceAfter, String description,
                                  Instant createdAt) {}
