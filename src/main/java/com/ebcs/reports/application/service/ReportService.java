package com.ebcs.reports.application.service;

import com.ebcs.account.repository.AccountRepository;
import com.ebcs.customer.domain.entity.Customer;
import com.ebcs.customer.repository.CustomerRepository;
import com.ebcs.deposit.repository.FixedDepositRepository;
import com.ebcs.deposit.repository.RecurringDepositRepository;
import com.ebcs.loan.domain.entity.Loan;
import com.ebcs.loan.repository.LoanRepository;
import com.ebcs.transaction.domain.entity.Transaction;
import com.ebcs.transaction.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ReportService {

    private final CustomerRepository customers;
    private final AccountRepository accounts;
    private final TransactionRepository transactions;
    private final LoanRepository loans;
    private final FixedDepositRepository fds;
    private final RecurringDepositRepository rds;

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("yyyy-MM");

    public ReportService(CustomerRepository c, AccountRepository a, TransactionRepository t,
                         LoanRepository l, FixedDepositRepository f, RecurringDepositRepository r) {
        this.customers = c; this.accounts = a; this.transactions = t; this.loans = l; this.fds = f; this.rds = r;
    }

    public Map<String, Object> customerGrowth(int months) {
        List<Customer> all = customers.findAll();
        Map<String, Integer> monthly = new TreeMap<>();
        LocalDate start = LocalDate.now().minusMonths(months);
        for (int i = 0; i <= months; i++) monthly.put(start.plusMonths(i).format(MONTH), 0);
        for (Customer c : all) {
            String k = c.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().format(MONTH);
            monthly.merge(k, 1, Integer::sum);
        }
        int running = 0;
        List<Map<String, Object>> series = new ArrayList<>();
        for (Map.Entry<String, Integer> e : monthly.entrySet()) {
            running += e.getValue();
            series.add(Map.of("month", e.getKey(), "new", e.getValue(), "total", running));
        }
        return Map.of("series", series, "totalCustomers", all.size());
    }

    public Map<String, Object> transactionAnalytics(int days) {
        Instant start = Instant.now().minusSeconds(days * 86400L);
        List<Transaction> tx = transactions.findAll().stream()
                .filter(t -> t.getCreatedAt().isAfter(start)).toList();
        Map<String, Map<String, BigDecimal>> byDay = new TreeMap<>();
        for (int i = 0; i < days; i++) {
            String k = LocalDate.now().minusDays(days - 1 - i).format(DAY);
            byDay.put(k, new LinkedHashMap<>(Map.of("DEPOSIT", BigDecimal.ZERO, "WITHDRAWAL", BigDecimal.ZERO, "TRANSFER", BigDecimal.ZERO)));
        }
        for (Transaction t : tx) {
            String k = t.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().format(DAY);
            byDay.computeIfPresent(k, (kk, v) -> {
                String key = t.getTxType().name().equals("IMPS") ? "TRANSFER" : t.getTxType().name();
                v.merge(key, t.getAmount(), BigDecimal::add);
                return v;
            });
        }
        List<Map<String, Object>> series = new ArrayList<>();
        byDay.forEach((day, map) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("day", day);
            map.forEach(row::put);
            series.add(row);
        });
        BigDecimal totalVolume = tx.stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of("series", series, "totalCount", tx.size(), "totalVolume", totalVolume);
    }

    public Map<String, Object> depositsSummary() {
        long fdCount = fds.count();
        long rdCount = rds.count();
        BigDecimal fdPrincipal = fds.findAll().stream().map(x -> x.getPrincipal()).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal rdInstallments = rds.findAll().stream().map(x -> x.getInstallmentAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of(
                "fdCount", fdCount, "rdCount", rdCount,
                "fdTotalPrincipal", fdPrincipal, "rdTotalInstallments", rdInstallments
        );
    }

    public Map<String, Object> loansSummary() {
        List<Loan> all = loans.findAll();
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (String s : List.of("APPLIED", "APPROVED", "DISBURSED", "SETTLED", "REJECTED"))
            byStatus.put(s, all.stream().filter(l -> l.getStatus().name().equals(s)).count());
        BigDecimal disbursed = all.stream()
                .filter(l -> l.getStatus().name().equals("DISBURSED") || l.getStatus().name().equals("SETTLED"))
                .map(Loan::getPrincipal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal outstanding = all.stream()
                .filter(l -> l.getStatus().name().equals("DISBURSED"))
                .map(Loan::getPrincipal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of("byStatus", byStatus, "totalDisbursed", disbursed, "outstanding", outstanding);
    }

    public Map<String, Object> revenueEstimate(int months) {
        List<Loan> all = loans.findAll().stream()
                .filter(l -> l.getStatus().name().equals("DISBURSED") || l.getStatus().name().equals("SETTLED"))
                .toList();
        Map<String, BigDecimal> monthly = new TreeMap<>();
        LocalDate start = LocalDate.now().minusMonths(months);
        for (int i = 0; i <= months; i++) monthly.put(start.plusMonths(i).format(MONTH), BigDecimal.ZERO);
        for (Loan l : all) {
            BigDecimal interest = l.getPrincipal()
                    .multiply(l.getInterestRate())
                    .multiply(new BigDecimal(l.getTermMonths()))
                    .divide(new BigDecimal("1200"), 2, java.math.RoundingMode.HALF_UP);
            String k = l.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().format(MONTH);
            monthly.merge(k, interest, BigDecimal::add);
        }
        List<Map<String, Object>> series = new ArrayList<>();
        monthly.forEach((k, v) -> series.add(Map.of("month", k, "estimatedInterest", v)));
        BigDecimal total = monthly.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of("series", series, "totalEstimated", total);
    }

    public Map<String, Object> overview() {
        return Map.of(
                "customers", customers.count(),
                "accounts", accounts.count(),
                "transactions", transactions.count(),
                "loans", loans.count(),
                "totalBalance", accounts.findAll().stream().map(a -> a.getBalance()).reduce(BigDecimal.ZERO, BigDecimal::add)
        );
    }
}
