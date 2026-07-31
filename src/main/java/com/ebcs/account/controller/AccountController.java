package com.ebcs.account.controller;

import com.ebcs.account.application.service.AccountService;
import com.ebcs.account.dto.AccountResponse;
import com.ebcs.account.dto.OpenAccountRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService service;

    public AccountController(AccountService service) { this.service = service; }

    @GetMapping
    public List<AccountResponse> list() { return service.list(); }

    @GetMapping("/{id}")
    public AccountResponse get(@PathVariable Long id) { return service.get(id); }

    @GetMapping("/customer/{customerId}")
    public List<AccountResponse> byCustomer(@PathVariable Long customerId) {
        return service.listByCustomer(customerId);
    }

    @GetMapping("/{id}/balance")
    public BigDecimal balance(@PathVariable Long id) { return service.get(id).balance(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse open(@Valid @RequestBody OpenAccountRequest req) { return service.open(req); }
}
