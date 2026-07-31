package com.ebcs.reports.controller;

import com.ebcs.reports.application.service.ReportService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService service;

    public ReportController(ReportService service) { this.service = service; }

    @GetMapping("/overview") public Map<String, Object> overview() { return service.overview(); }
    @GetMapping("/customers/growth") public Map<String, Object> growth(@RequestParam(defaultValue = "6") int months) { return service.customerGrowth(months); }
    @GetMapping("/transactions/analytics") public Map<String, Object> tx(@RequestParam(defaultValue = "14") int days) { return service.transactionAnalytics(days); }
    @GetMapping("/deposits") public Map<String, Object> deposits() { return service.depositsSummary(); }
    @GetMapping("/loans") public Map<String, Object> loans() { return service.loansSummary(); }
    @GetMapping("/revenue") public Map<String, Object> revenue(@RequestParam(defaultValue = "6") int months) { return service.revenueEstimate(months); }
}
