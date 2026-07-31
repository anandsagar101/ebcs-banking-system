package com.ebcs.document.application.service;

import com.ebcs.platform.events.DomainEvent;

/** Published after a document row is committed. Consumers (e.g. OCR) subscribe AFTER_COMMIT. */
public class DocumentUploadedEvent extends DomainEvent {
    private final Long documentId;
    public DocumentUploadedEvent(Long documentId) { this.documentId = documentId; }
    public Long getDocumentId() { return documentId; }
    @Override public String getType() { return "DOCUMENT_UPLOADED"; }
}
