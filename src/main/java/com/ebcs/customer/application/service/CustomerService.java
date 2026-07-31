package com.ebcs.customer.application.service;

import com.ebcs.customer.domain.entity.Customer;
import com.ebcs.customer.domain.entity.KycStatus;
import com.ebcs.customer.dto.CreateCustomerRequest;
import com.ebcs.customer.dto.CustomerResponse;
import com.ebcs.customer.dto.UpdateCustomerRequest;
import com.ebcs.customer.mapper.CustomerMapper;
import com.ebcs.customer.repository.CustomerRepository;
import com.ebcs.platform.audit.application.service.AuditService;
import com.ebcs.platform.events.CustomerRegisteredEvent;
import com.ebcs.shared.exception.BusinessException;
import com.ebcs.shared.exception.ResourceNotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository repo;
    private final CustomerMapper mapper;
    private final AuditService audit;
    private final ApplicationEventPublisher events;

    public CustomerService(CustomerRepository repo, CustomerMapper mapper, AuditService audit,
                           ApplicationEventPublisher events) {
        this.repo = repo; this.mapper = mapper; this.audit = audit; this.events = events;
    }

    public List<CustomerResponse> list() {
        return repo.findAll().stream().map(mapper::toResponse).toList();
    }

    public CustomerResponse get(Long id) {
        return mapper.toResponse(loadOrThrow(id));
    }

    @Transactional
    public CustomerResponse create(CreateCustomerRequest req) {
        if (repo.existsByEmail(req.email())) throw new BusinessException("Email already registered");
        Customer c = new Customer();
        c.setFirstName(req.firstName());
        c.setLastName(req.lastName());
        c.setEmail(req.email());
        c.setPhone(req.phone());
        c.setKycStatus(KycStatus.PENDING);
        c = repo.save(c);
        audit.record("CUSTOMER_CREATED", "customer:" + c.getId(), req.email());
        events.publishEvent(new CustomerRegisteredEvent(c.getId(), c.getEmail(), c.getPhone(),
                c.getFirstName() + " " + c.getLastName()));
        return mapper.toResponse(c);
    }

    @Transactional
    public CustomerResponse update(Long id, UpdateCustomerRequest req) {
        Customer c = loadOrThrow(id);
        if (req.firstName() != null) c.setFirstName(req.firstName());
        if (req.lastName() != null) c.setLastName(req.lastName());
        if (req.email() != null) c.setEmail(req.email());
        if (req.phone() != null) c.setPhone(req.phone());
        audit.record("CUSTOMER_UPDATED", "customer:" + id, req.toString());
        return mapper.toResponse(c);
    }

    @Transactional
    public CustomerResponse updateKyc(Long id, KycStatus status) {
        Customer c = loadOrThrow(id);
        c.setKycStatus(status);
        audit.record("KYC_UPDATED", "customer:" + id, status.name());
        return mapper.toResponse(c);
    }

    public Customer loadOrThrow(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));
    }
}
