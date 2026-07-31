package com.ebcs.loan.controller;

import com.ebcs.loan.application.service.LoanService;
import com.ebcs.loan.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanService service;

    public LoanController(LoanService service) { this.service = service; }

    @GetMapping public List<LoanResponse> list() { return service.list(); }
    @GetMapping("/{id}") public LoanResponse get(@PathVariable Long id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LoanResponse apply(@Valid @RequestBody ApplyLoanRequest req) { return service.apply(req); }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public LoanResponse approve(@PathVariable Long id) { return service.approve(id); }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public LoanResponse reject(@PathVariable Long id) { return service.reject(id); }

    @PostMapping("/{id}/disburse")
    @PreAuthorize("hasRole('ADMIN')")
    public LoanResponse disburse(@PathVariable Long id, @Valid @RequestBody DisburseLoanRequest req) {
        return service.disburse(id, req);
    }

    @PostMapping("/{id}/settle")
    public LoanResponse settle(@PathVariable Long id) { return service.settle(id); }

    @GetMapping("/{id}/schedule")
    public List<EmiScheduleResponse> schedule(@PathVariable Long id) { return service.schedule(id); }
}
