package com.ebcs.platform.events;

import java.time.Instant;
import java.util.UUID;

/** Base for all EBCS domain events. */
public abstract class DomainEvent {
    private final String eventId = UUID.randomUUID().toString();
    private final Instant occurredAt = Instant.now();

    public String getEventId() { return eventId; }
    public Instant getOccurredAt() { return occurredAt; }
    public abstract String getType();
}
