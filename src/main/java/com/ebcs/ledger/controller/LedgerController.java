package com.ebcs.ledger.controller;

import com.ebcs.ledger.application.service.LedgerService;
import com.ebcs.ledger.dto.LedgerEntryResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ledger")
public class LedgerController {

    private final LedgerService service;

    public LedgerController(LedgerService service) { this.service = service; }

    @GetMapping("/account/{accountId}")
    public List<LedgerEntryResponse> byAccount(@PathVariable Long accountId) {
        return service.byAccount(accountId);
    }

    @GetMapping("/transaction/{ref}")
    public List<LedgerEntryResponse> byTx(@PathVariable String ref) {
        return service.byTransaction(ref);
    }
}
