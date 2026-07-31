package com.ebcs.transaction.controller;

import com.ebcs.transaction.application.service.TransactionService;
import com.ebcs.transaction.dto.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService service;

    public TransactionController(TransactionService service) { this.service = service; }

    @PostMapping("/deposit")
    public TransactionResponse deposit(@Valid @RequestBody DepositRequest req) { return service.deposit(req); }

    @PostMapping("/withdraw")
    public TransactionResponse withdraw(@Valid @RequestBody WithdrawRequest req) { return service.withdraw(req); }

    @PostMapping("/transfer")
    public TransactionResponse transfer(@Valid @RequestBody TransferRequest req) { return service.transfer(req); }

    @PostMapping("/imps")
    public TransactionResponse imps(@Valid @RequestBody TransferRequest req) { return service.transfer(req); }

    @PostMapping("/reverse/{reference}")
    public TransactionResponse reverse(@PathVariable String reference) { return service.reverse(reference); }

    @GetMapping
    public List<TransactionResponse> list() { return service.list(); }

    @GetMapping("/{reference}")
    public TransactionResponse get(@PathVariable String reference) { return service.get(reference); }
}
