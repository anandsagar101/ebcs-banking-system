package com.ebcs.customer.controller;

import com.ebcs.customer.application.service.CustomerService;
import com.ebcs.customer.domain.entity.KycStatus;
import com.ebcs.customer.dto.CreateCustomerRequest;
import com.ebcs.customer.dto.CustomerResponse;
import com.ebcs.customer.dto.UpdateCustomerRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService service;

    public CustomerController(CustomerService service) { this.service = service; }

    @GetMapping
    public List<CustomerResponse> list() { return service.list(); }

    @GetMapping("/{id}")
    public CustomerResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerResponse create(@Valid @RequestBody CreateCustomerRequest req) { return service.create(req); }

    @PutMapping("/{id}")
    public CustomerResponse update(@PathVariable Long id, @Valid @RequestBody UpdateCustomerRequest req) {
        return service.update(id, req);
    }

    @PutMapping("/{id}/kyc")
    @PreAuthorize("hasRole('ADMIN')")
    public CustomerResponse updateKyc(@PathVariable Long id, @RequestParam KycStatus status) {
        return service.updateKyc(id, status);
    }
}
