package com.ebcs.deposit.controller;

import com.ebcs.deposit.application.service.DepositService;
import com.ebcs.deposit.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deposits")
public class DepositController {

    private final DepositService service;

    public DepositController(DepositService service) { this.service = service; }

    @PostMapping("/fixed")
    @ResponseStatus(HttpStatus.CREATED)
    public FixedDepositResponse bookFd(@Valid @RequestBody BookFdRequest req) { return service.bookFd(req); }

    @PostMapping("/recurring")
    @ResponseStatus(HttpStatus.CREATED)
    public RecurringDepositResponse bookRd(@Valid @RequestBody BookRdRequest req) { return service.bookRd(req); }

    @GetMapping("/fixed") public List<FixedDepositResponse> listFd() { return service.listFd(); }
    @GetMapping("/recurring") public List<RecurringDepositResponse> listRd() { return service.listRd(); }
    @GetMapping("/fixed/{id}") public FixedDepositResponse getFd(@PathVariable Long id) { return service.getFd(id); }
    @GetMapping("/recurring/{id}") public RecurringDepositResponse getRd(@PathVariable Long id) { return service.getRd(id); }
}
