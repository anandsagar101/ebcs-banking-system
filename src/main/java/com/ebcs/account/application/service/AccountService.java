package com.ebcs.account.application.service;

import com.ebcs.account.domain.entity.Account;
import com.ebcs.account.domain.entity.AccountStatus;
import com.ebcs.account.dto.AccountResponse;
import com.ebcs.account.dto.OpenAccountRequest;
import com.ebcs.account.repository.AccountRepository;
import com.ebcs.customer.application.service.CustomerService;
import com.ebcs.platform.audit.application.service.AuditService;
import com.ebcs.platform.events.AccountOpenedEvent;
import com.ebcs.product.application.service.ProductService;
import com.ebcs.shared.exception.ResourceNotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class AccountService {

    private final AccountRepository repo;
    private final CustomerService customerService;
    private final ProductService productService;
    private final AuditService audit;
    private final ApplicationEventPublisher events;

    public AccountService(AccountRepository repo, CustomerService customerService,
                          ProductService productService, AuditService audit,
                          ApplicationEventPublisher events) {
        this.repo = repo; this.customerService = customerService;
        this.productService = productService; this.audit = audit; this.events = events;
    }

    public List<AccountResponse> list() { return repo.findAll().stream().map(this::toResp).toList(); }

    public AccountResponse get(Long id) { return toResp(loadOrThrow(id)); }

    public List<AccountResponse> listByCustomer(Long customerId) {
        return repo.findByCustomerId(customerId).stream().map(this::toResp).toList();
    }

    @Transactional
    public AccountResponse open(OpenAccountRequest req) {
        customerService.loadOrThrow(req.customerId());
        productService.loadOrThrow(req.productId());
        Account a = new Account();
        a.setCustomerId(req.customerId());
        a.setProductId(req.productId());
        a.setAccountNumber(generateAccountNumber());
        a.setBalance(BigDecimal.ZERO);
        a.setStatus(AccountStatus.ACTIVE);
        a = repo.save(a);
        audit.record("ACCOUNT_OPENED", "account:" + a.getId(), a.getAccountNumber());
        events.publishEvent(new AccountOpenedEvent(a.getId(), a.getCustomerId(), a.getAccountNumber()));
        return toResp(a);
    }

    public Account loadOrThrow(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Account not found: " + id));
    }

    public Account lockForUpdate(Long id) {
        return repo.findByIdForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Account not found: " + id));
    }

    private String generateAccountNumber() {
        long n = ThreadLocalRandom.current().nextLong(10_000_000_000L, 99_999_999_999L);
        return String.valueOf(n);
    }

    public AccountResponse toResp(Account a) {
        return new AccountResponse(a.getId(), a.getAccountNumber(), a.getCustomerId(),
                a.getProductId(), a.getStatus(), a.getBalance(), a.getDailyLimit(), a.getCreatedAt());
    }
}
