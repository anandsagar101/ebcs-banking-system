package com.ebcs.deposit.application.service;

import com.ebcs.account.application.service.AccountService;
import com.ebcs.deposit.domain.entity.FixedDeposit;
import com.ebcs.deposit.domain.entity.RecurringDeposit;
import com.ebcs.deposit.dto.*;
import com.ebcs.deposit.repository.FixedDepositRepository;
import com.ebcs.deposit.repository.RecurringDepositRepository;
import com.ebcs.shared.exception.ResourceNotFoundException;
import com.ebcs.transaction.application.service.TransactionService;
import com.ebcs.transaction.dto.WithdrawRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class DepositService {

    private final FixedDepositRepository fdRepo;
    private final RecurringDepositRepository rdRepo;
    private final AccountService accountService;
    private final TransactionService transactionService;

    public DepositService(FixedDepositRepository fdRepo, RecurringDepositRepository rdRepo,
                          AccountService accountService, TransactionService transactionService) {
        this.fdRepo = fdRepo; this.rdRepo = rdRepo;
        this.accountService = accountService; this.transactionService = transactionService;
    }

    @Transactional
    public FixedDepositResponse bookFd(BookFdRequest req) {
        accountService.loadOrThrow(req.accountId());
        // Debit account for FD principal
        transactionService.withdraw(new WithdrawRequest(req.accountId(), req.principal(), "FD Booking"));

        FixedDeposit fd = new FixedDeposit();
        fd.setAccountId(req.accountId());
        fd.setPrincipal(req.principal());
        fd.setInterestRate(req.interestRate());
        fd.setTermMonths(req.termMonths());
        fd.setStartDate(LocalDate.now());
        fd.setMaturityDate(LocalDate.now().plusMonths(req.termMonths()));
        fd = fdRepo.save(fd);
        return toFdResp(fd);
    }

    @Transactional
    public RecurringDepositResponse bookRd(BookRdRequest req) {
        accountService.loadOrThrow(req.accountId());
        RecurringDeposit rd = new RecurringDeposit();
        rd.setAccountId(req.accountId());
        rd.setInstallmentAmount(req.installmentAmount());
        rd.setInterestRate(req.interestRate());
        rd.setTermMonths(req.termMonths());
        rd.setStartDate(LocalDate.now());
        rd = rdRepo.save(rd);
        return toRdResp(rd);
    }

    public FixedDepositResponse getFd(Long id) {
        return toFdResp(fdRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FD not found: " + id)));
    }

    public RecurringDepositResponse getRd(Long id) {
        return toRdResp(rdRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RD not found: " + id)));
    }

    public List<FixedDepositResponse> listFd() { return fdRepo.findAll().stream().map(this::toFdResp).toList(); }
    public List<RecurringDepositResponse> listRd() { return rdRepo.findAll().stream().map(this::toRdResp).toList(); }

    private FixedDepositResponse toFdResp(FixedDeposit f) {
        return new FixedDepositResponse(f.getId(), f.getAccountId(), f.getPrincipal(),
                f.getInterestRate(), f.getTermMonths(), f.getStartDate(),
                f.getMaturityDate(), f.getStatus());
    }
    private RecurringDepositResponse toRdResp(RecurringDeposit r) {
        return new RecurringDepositResponse(r.getId(), r.getAccountId(), r.getInstallmentAmount(),
                r.getInterestRate(), r.getTermMonths(), r.getStartDate(), r.getStatus());
    }
}
