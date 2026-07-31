package com.ebcs.loan.application.service;

import com.ebcs.customer.application.service.CustomerService;
import com.ebcs.loan.domain.entity.Loan;
import com.ebcs.loan.domain.entity.LoanEmiSchedule;
import com.ebcs.loan.domain.entity.LoanStatus;
import com.ebcs.loan.dto.*;
import com.ebcs.loan.repository.LoanEmiScheduleRepository;
import com.ebcs.loan.repository.LoanRepository;
import com.ebcs.platform.events.LoanApprovedEvent;
import com.ebcs.platform.events.LoanDisbursedEvent;
import com.ebcs.product.application.service.ProductService;
import com.ebcs.shared.exception.BusinessException;
import com.ebcs.shared.exception.ResourceNotFoundException;
import com.ebcs.transaction.application.service.TransactionService;
import com.ebcs.transaction.dto.DepositRequest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class LoanService {

    private final LoanRepository repo;
    private final LoanEmiScheduleRepository emiRepo;
    private final CustomerService customerService;
    private final ProductService productService;
    private final TransactionService transactionService;
    private final ApplicationEventPublisher events;

    public LoanService(LoanRepository repo, LoanEmiScheduleRepository emiRepo,
                       CustomerService customerService, ProductService productService,
                       TransactionService transactionService, ApplicationEventPublisher events) {
        this.repo = repo; this.emiRepo = emiRepo;
        this.customerService = customerService; this.productService = productService;
        this.transactionService = transactionService; this.events = events;
    }

    @Transactional
    public LoanResponse apply(ApplyLoanRequest req) {
        customerService.loadOrThrow(req.customerId());
        productService.loadOrThrow(req.productId());
        Loan l = new Loan();
        l.setCustomerId(req.customerId());
        l.setProductId(req.productId());
        l.setPrincipal(req.principal());
        l.setInterestRate(req.interestRate());
        l.setTermMonths(req.termMonths());
        l.setStatus(LoanStatus.APPLIED);
        l = repo.save(l);
        return toResp(l);
    }

    @Transactional
    public LoanResponse approve(Long loanId) {
        Loan l = load(loanId);
        if (l.getStatus() != LoanStatus.APPLIED)
            throw new BusinessException("Loan not in APPLIED status");
        l.setStatus(LoanStatus.APPROVED);
        events.publishEvent(new LoanApprovedEvent(l.getId(), l.getCustomerId(), l.getPrincipal()));
        return toResp(l);
    }

    @Transactional
    public LoanResponse reject(Long loanId) {
        Loan l = load(loanId);
        l.setStatus(LoanStatus.REJECTED);
        return toResp(l);
    }

    @Transactional
    public LoanResponse disburse(Long loanId, DisburseLoanRequest req) {
        Loan l = load(loanId);
        if (l.getStatus() != LoanStatus.APPROVED)
            throw new BusinessException("Loan not approved");
        l.setDisbursementAccountId(req.accountId());
        l.setStatus(LoanStatus.DISBURSED);

        // Credit the disbursement account
        transactionService.deposit(new DepositRequest(req.accountId(), l.getPrincipal(), "Loan Disbursement"));
        events.publishEvent(new LoanDisbursedEvent(l.getId(), l.getCustomerId(), req.accountId(), l.getPrincipal()));

        // Build EMI schedule (flat interest split evenly across months)
        BigDecimal months = new BigDecimal(l.getTermMonths());
        BigDecimal totalInterest = l.getPrincipal()
                .multiply(l.getInterestRate())
                .multiply(months)
                .divide(new BigDecimal("1200"), 4, RoundingMode.HALF_UP);
        BigDecimal totalPayable = l.getPrincipal().add(totalInterest);
        BigDecimal emi = totalPayable.divide(months, 4, RoundingMode.HALF_UP);
        BigDecimal principalComp = l.getPrincipal().divide(months, 4, RoundingMode.HALF_UP);
        BigDecimal interestComp = totalInterest.divide(months, 4, RoundingMode.HALF_UP);

        LocalDate due = LocalDate.now();
        for (int i = 1; i <= l.getTermMonths(); i++) {
            due = due.plusMonths(1);
            LoanEmiSchedule s = new LoanEmiSchedule();
            s.setLoanId(l.getId());
            s.setInstallmentNo(i);
            s.setDueDate(due);
            s.setPrincipalComponent(principalComp);
            s.setInterestComponent(interestComp);
            s.setTotalAmount(emi);
            emiRepo.save(s);
        }
        return toResp(l);
    }

    @Transactional
    public LoanResponse settle(Long loanId) {
        Loan l = load(loanId);
        l.setStatus(LoanStatus.SETTLED);
        emiRepo.findByLoanIdOrderByInstallmentNoAsc(loanId).forEach(e -> { e.setPaid(true); emiRepo.save(e); });
        return toResp(l);
    }

    public LoanResponse get(Long id) { return toResp(load(id)); }

    public List<LoanResponse> list() { return repo.findAll().stream().map(this::toResp).toList(); }

    public List<EmiScheduleResponse> schedule(Long loanId) {
        return emiRepo.findByLoanIdOrderByInstallmentNoAsc(loanId).stream()
                .map(s -> new EmiScheduleResponse(s.getInstallmentNo(), s.getDueDate(),
                        s.getPrincipalComponent(), s.getInterestComponent(),
                        s.getTotalAmount(), s.isPaid())).toList();
    }

    private Loan load(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + id));
    }

    private LoanResponse toResp(Loan l) {
        return new LoanResponse(l.getId(), l.getCustomerId(), l.getProductId(), l.getPrincipal(),
                l.getInterestRate(), l.getTermMonths(), l.getDisbursementAccountId(),
                l.getStatus(), l.getCreatedAt());
    }
}
