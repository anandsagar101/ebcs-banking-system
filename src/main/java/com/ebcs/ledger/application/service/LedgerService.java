package com.ebcs.ledger.application.service;

import com.ebcs.ledger.domain.entity.EntryType;
import com.ebcs.ledger.domain.entity.LedgerEntry;
import com.ebcs.ledger.dto.LedgerEntryResponse;
import com.ebcs.ledger.repository.LedgerEntryRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class LedgerService {

    private final LedgerEntryRepository repo;

    public LedgerService(LedgerEntryRepository repo) { this.repo = repo; }

    public LedgerEntry record(String txRef, Long accountId, EntryType type,
                              BigDecimal amount, BigDecimal balanceAfter, String description) {
        return repo.save(new LedgerEntry(txRef, accountId, type, amount, balanceAfter, description));
    }

    public List<LedgerEntryResponse> byAccount(Long accountId) {
        return repo.findByAccountIdOrderByCreatedAtDesc(accountId).stream().map(this::toResp).toList();
    }

    public List<LedgerEntryResponse> byTransaction(String txRef) {
        return repo.findByTransactionRef(txRef).stream().map(this::toResp).toList();
    }

    private LedgerEntryResponse toResp(LedgerEntry e) {
        return new LedgerEntryResponse(e.getId(), e.getTransactionRef(), e.getAccountId(),
                e.getEntryType(), e.getAmount(), e.getBalanceAfter(), e.getDescription(), e.getCreatedAt());
    }
}
