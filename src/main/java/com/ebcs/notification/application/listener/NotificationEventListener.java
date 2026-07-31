package com.ebcs.notification.application.listener;

import com.ebcs.customer.repository.CustomerRepository;
import com.ebcs.notification.application.service.NotificationService;
import com.ebcs.platform.events.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/** Fan-out of domain events into notifications across all configured channels. */
@Component
public class NotificationEventListener {
    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationService notifications;
    private final CustomerRepository customers;

    public NotificationEventListener(NotificationService notifications, CustomerRepository customers) {
        this.notifications = notifications; this.customers = customers;
    }

    @Async
    @EventListener
    public void onCustomerRegistered(CustomerRegisteredEvent e) {
        String body = "Welcome to EBCS, " + e.getFullName() + "! Your customer account #" + e.getCustomerId() + " is ready.";
        notifications.dispatch("EMAIL", e.getEmail(), "Welcome to EBCS", body, e.getType());
        if (e.getPhone() != null) notifications.dispatch("SMS", e.getPhone(), null, body, e.getType());
    }

    @Async
    @EventListener
    public void onAccountOpened(AccountOpenedEvent e) {
        customers.findById(e.getCustomerId()).ifPresent(c -> {
            String body = "New account " + e.getAccountNumber() + " has been opened.";
            notifications.dispatch("EMAIL", c.getEmail(), "Account opened", body, e.getType());
        });
    }

    @Async
    @EventListener
    public void onMoneyMoved(MoneyMovedEvent e) {
        String body = switch (e.getKind()) {
            case DEPOSIT -> "Deposit of " + e.getAmount() + " credited (" + e.getReference() + ")";
            case WITHDRAWAL -> "Withdrawal of " + e.getAmount() + " debited (" + e.getReference() + ")";
            case TRANSFER -> "Transfer of " + e.getAmount() + " from account #" + e.getFromAccountId() + " to account #" + e.getToAccountId();
            case IMPS -> "IMPS transfer of " + e.getAmount() + " processed";
            case REVERSAL -> "Transaction " + e.getReference() + " has been reversed";
        };
        // In a real system we'd resolve the account owner. For now, log broadcast.
        notifications.dispatch("PUSH", "broadcast", "Transaction alert", body, e.getType());
    }

    @Async
    @EventListener
    public void onLoanApproved(LoanApprovedEvent e) {
        customers.findById(e.getCustomerId()).ifPresent(c -> {
            String body = "Your loan of " + e.getPrincipal() + " has been approved.";
            notifications.dispatch("EMAIL", c.getEmail(), "Loan approved", body, e.getType());
            notifications.dispatch("SMS", c.getPhone(), null, body, e.getType());
        });
    }

    @Async
    @EventListener
    public void onLoanDisbursed(LoanDisbursedEvent e) {
        customers.findById(e.getCustomerId()).ifPresent(c -> {
            String body = "Loan of " + e.getAmount() + " disbursed to account #" + e.getAccountId();
            notifications.dispatch("EMAIL", c.getEmail(), "Loan disbursed", body, e.getType());
        });
    }
}
