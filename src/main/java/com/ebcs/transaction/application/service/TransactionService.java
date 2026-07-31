package com.ebcs.transaction.application.service;

import com.ebcs.account.application.service.AccountService;
import com.ebcs.account.domain.entity.Account;
import com.ebcs.account.domain.entity.AccountStatus;
import com.ebcs.ledger.application.service.LedgerService;
import com.ebcs.ledger.domain.entity.EntryType;
import com.ebcs.platform.audit.application.service.AuditService;
import com.ebcs.platform.events.MoneyMovedEvent;
import com.ebcs.shared.exception.BusinessException;
import com.ebcs.shared.exception.ResourceNotFoundException;
import com.ebcs.transaction.domain.entity.Transaction;
import com.ebcs.transaction.domain.entity.TransactionStatus;
import com.ebcs.transaction.domain.entity.TransactionType;
import com.ebcs.transaction.dto.*;
import com.ebcs.transaction.repository.TransactionRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class TransactionService {

    private final TransactionRepository txRepo;
    private final AccountService accountService;
    private final LedgerService ledgerService;
    private final AuditService audit;
    private final ApplicationEventPublisher events;

    public TransactionService(TransactionRepository txRepo, AccountService accountService,
                              LedgerService ledgerService, AuditService audit,
                              ApplicationEventPublisher events) {
        this.txRepo = txRepo;
        this.accountService = accountService;
        this.ledgerService = ledgerService;
        this.audit = audit;
        this.events = events;
    }

    @Transactional
    public TransactionResponse deposit(DepositRequest req) {
        Account acc = accountService.lockForUpdate(req.accountId());
        ensureActive(acc);
        acc.setBalance(acc.getBalance().add(req.amount()));

        Transaction tx = persistTx(TransactionType.DEPOSIT, null, acc.getId(), req.amount(), req.description());
        ledgerService.record(tx.getReference(), acc.getId(), EntryType.CREDIT,
                req.amount(), acc.getBalance(), tx.getDescription());
        audit.record("DEPOSIT", "account:" + acc.getId(), req.amount().toPlainString());
        events.publishEvent(new MoneyMovedEvent(MoneyMovedEvent.Kind.DEPOSIT, null, acc.getId(), req.amount(), tx.getReference()));
        return toResp(tx);
    }

    @Transactional
    public TransactionResponse withdraw(WithdrawRequest req) {
        Account acc = accountService.lockForUpdate(req.accountId());
        ensureActive(acc);
        if (acc.getBalance().compareTo(req.amount()) < 0)
            throw new BusinessException("Insufficient balance");
        acc.setBalance(acc.getBalance().subtract(req.amount()));

        Transaction tx = persistTx(TransactionType.WITHDRAWAL, acc.getId(), null, req.amount(), req.description());
        ledgerService.record(tx.getReference(), acc.getId(), EntryType.DEBIT,
                req.amount(), acc.getBalance(), tx.getDescription());
        audit.record("WITHDRAWAL", "account:" + acc.getId(), req.amount().toPlainString());
        events.publishEvent(new MoneyMovedEvent(MoneyMovedEvent.Kind.WITHDRAWAL, acc.getId(), null, req.amount(), tx.getReference()));
        return toResp(tx);
    }

    @Transactional
    public TransactionResponse transfer(TransferRequest req) {
        if (req.fromAccountId().equals(req.toAccountId()))
            throw new BusinessException("Cannot transfer to same account");

        // Order locks by id to avoid deadlocks
        Long firstId = Math.min(req.fromAccountId(), req.toAccountId());
        Long secondId = Math.max(req.fromAccountId(), req.toAccountId());
        Account first = accountService.lockForUpdate(firstId);
        Account second = accountService.lockForUpdate(secondId);
        Account from = first.getId().equals(req.fromAccountId()) ? first : second;
        Account to = first.getId().equals(req.toAccountId()) ? first : second;

        ensureActive(from); ensureActive(to);
        if (from.getBalance().compareTo(req.amount()) < 0)
            throw new BusinessException("Insufficient balance");

        from.setBalance(from.getBalance().subtract(req.amount()));
        to.setBalance(to.getBalance().add(req.amount()));

        Transaction tx = persistTx(TransactionType.TRANSFER, from.getId(), to.getId(), req.amount(), req.description());
        ledgerService.record(tx.getReference(), from.getId(), EntryType.DEBIT, req.amount(), from.getBalance(), tx.getDescription());
        ledgerService.record(tx.getReference(), to.getId(), EntryType.CREDIT, req.amount(), to.getBalance(), tx.getDescription());
        audit.record("TRANSFER", "tx:" + tx.getReference(),
                from.getId() + "->" + to.getId() + " " + req.amount().toPlainString());
        events.publishEvent(new MoneyMovedEvent(MoneyMovedEvent.Kind.TRANSFER, from.getId(), to.getId(), req.amount(), tx.getReference()));
        return toResp(tx);
    }

    @Transactional
    public TransactionResponse reverse(String reference) {
        Transaction original = txRepo.findByReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + reference));
        if (original.getStatus() == TransactionStatus.REVERSED)
            throw new BusinessException("Already reversed");

        // Reverse balances and ledger
        if (original.getTxType() == TransactionType.DEPOSIT) {
            Account acc = accountService.lockForUpdate(original.getToAccountId());
            if (acc.getBalance().compareTo(original.getAmount()) < 0)
                throw new BusinessException("Cannot reverse: insufficient balance");
            acc.setBalance(acc.getBalance().subtract(original.getAmount()));
            Transaction tx = persistTx(TransactionType.REVERSAL, acc.getId(), null, original.getAmount(),
                    "Reversal of " + reference);
            ledgerService.record(tx.getReference(), acc.getId(), EntryType.DEBIT,
                    original.getAmount(), acc.getBalance(), tx.getDescription());
            original.setStatus(TransactionStatus.REVERSED);
            return toResp(tx);
        } else if (original.getTxType() == TransactionType.WITHDRAWAL) {
            Account acc = accountService.lockForUpdate(original.getFromAccountId());
            acc.setBalance(acc.getBalance().add(original.getAmount()));
            Transaction tx = persistTx(TransactionType.REVERSAL, null, acc.getId(), original.getAmount(),
                    "Reversal of " + reference);
            ledgerService.record(tx.getReference(), acc.getId(), EntryType.CREDIT,
                    original.getAmount(), acc.getBalance(), tx.getDescription());
            original.setStatus(TransactionStatus.REVERSED);
            return toResp(tx);
        } else if (original.getTxType() == TransactionType.TRANSFER) {
            // Swap direction
            TransferRequest rev = new TransferRequest(original.getToAccountId(), original.getFromAccountId(),
                    original.getAmount(), "Reversal of " + reference);
            TransactionResponse resp = transfer(rev);
            original.setStatus(TransactionStatus.REVERSED);
            return resp;
        }
        throw new BusinessException("Cannot reverse this transaction type");
    }

    public List<TransactionResponse> list() { return txRepo.findAll().stream().map(this::toResp).toList(); }

    public TransactionResponse get(String reference) {
        return toResp(txRepo.findByReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + reference)));
    }

    private Transaction persistTx(TransactionType type, Long fromId, Long toId, BigDecimal amount, String description) {
        Transaction tx = new Transaction();
        tx.setReference("TX-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());
        tx.setFromAccountId(fromId);
        tx.setToAccountId(toId);
        tx.setTxType(type);
        tx.setAmount(amount);
        tx.setStatus(TransactionStatus.COMPLETED);
        tx.setDescription(description);
        return txRepo.save(tx);
    }

    private void ensureActive(Account acc) {
        if (acc.getStatus() != AccountStatus.ACTIVE)
            throw new BusinessException("Account not active: " + acc.getAccountNumber());
    }

    private TransactionResponse toResp(Transaction t) {
        return new TransactionResponse(t.getId(), t.getReference(), t.getFromAccountId(),
                t.getToAccountId(), t.getTxType(), t.getAmount(), t.getStatus(),
                t.getDescription(), t.getCreatedAt());
    }
}
