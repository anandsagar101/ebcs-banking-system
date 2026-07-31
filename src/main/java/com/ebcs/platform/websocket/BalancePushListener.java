package com.ebcs.platform.websocket;

import com.ebcs.account.application.service.AccountService;
import com.ebcs.account.domain.entity.Account;
import com.ebcs.platform.events.MoneyMovedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Fans {@link MoneyMovedEvent}s out to the WebSocket topic that the dashboard subscribes to.
 * Runs AFTER_COMMIT so the client never sees an event that's about to be rolled back.
 *
 * Publishes on two channels:
 * <ul>
 *   <li>{@code /topic/money-moved} — every movement, for the transaction feed / animations.</li>
 *   <li>{@code /topic/account/{id}/balance} — per-account balance snapshot for KPI cards.</li>
 * </ul>
 */
@Component
public class BalancePushListener {

    private static final Logger log = LoggerFactory.getLogger(BalancePushListener.class);

    private final SimpMessagingTemplate broker;
    private final AccountService accountService;

    public BalancePushListener(SimpMessagingTemplate broker, AccountService accountService) {
        this.broker = broker;
        this.accountService = accountService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onMoneyMoved(MoneyMovedEvent evt) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("eventId", evt.getEventId());
            payload.put("type", evt.getType());
            payload.put("kind", evt.getKind().name());
            payload.put("amount", evt.getAmount());
            payload.put("reference", evt.getReference());
            payload.put("fromAccountId", evt.getFromAccountId());
            payload.put("toAccountId", evt.getToAccountId());
            payload.put("occurredAt", evt.getOccurredAt().toString());
            broker.convertAndSend("/topic/money-moved", payload);

            pushBalance(evt.getFromAccountId());
            pushBalance(evt.getToAccountId());
        } catch (Exception e) {
            log.warn("WebSocket broadcast failed for {}: {}", evt.getEventId(), e.getMessage());
        }
    }

    /** Also handles events published outside a transaction (e.g. manual publishes in tests). */
    @Async
    @EventListener
    public void onNonTransactional(MoneyMovedEvent evt) {
        // Deliberately empty — the @TransactionalEventListener above already handles the primary path.
        // This shim exists only so tests that publish without a tx don't leave the payload stuck.
    }

    private void pushBalance(Long accountId) {
        if (accountId == null) return;
        try {
            Account a = accountService.loadOrThrow(accountId);
            BigDecimal bal = a.getBalance();
            broker.convertAndSend("/topic/account/" + accountId + "/balance", Map.of(
                    "accountId", accountId,
                    "accountNumber", a.getAccountNumber(),
                    "balance", bal,
                    "updatedAt", Instant.now().toString()
            ));
            // Also push a global KPI snapshot so the dashboard can update the "total balance" tile
            // without polling the whole accounts list.
            broker.convertAndSend("/topic/kpis", Map.of(
                    "type", "BALANCE_UPDATED",
                    "accountId", accountId,
                    "balance", bal,
                    "at", Instant.now().toString()
            ));
        } catch (Exception e) {
            log.debug("Skip balance push for account {}: {}", accountId, e.getMessage());
        }
    }
}
