package com.ebcs.document.domain.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_type", nullable = false)
    private String ownerType;   // CUSTOMER / LOAN / ACCOUNT

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "doc_type", nullable = false)
    private String docType;

    @Column(nullable = false)
    private String filename;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "storage_path", nullable = false)
    private String storagePath;

    private String checksum;

    @Column(nullable = false)
    private int version = 1;

    @Column(name = "uploaded_by")
    private String uploadedBy;

    @Column(name = "ocr_text", columnDefinition = "text")
    private String ocrText;

    @Column(name = "ocr_status", nullable = false)
    private String ocrStatus = "NONE";

    @Column(name = "ocr_completed_at")
    private Instant ocrCompletedAt;

    @Column(name = "ocr_error", length = 500)
    private String ocrError;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public String getOwnerType() { return ownerType; }
    public void setOwnerType(String v) { this.ownerType = v; }
    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long v) { this.ownerId = v; }
    public String getDocType() { return docType; }
    public void setDocType(String v) { this.docType = v; }
    public String getFilename() { return filename; }
    public void setFilename(String v) { this.filename = v; }
    public String getContentType() { return contentType; }
    public void setContentType(String v) { this.contentType = v; }
    public long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(long v) { this.sizeBytes = v; }
    public String getStoragePath() { return storagePath; }
    public void setStoragePath(String v) { this.storagePath = v; }
    public String getChecksum() { return checksum; }
    public void setChecksum(String v) { this.checksum = v; }
    public int getVersion() { return version; }
    public void setVersion(int v) { this.version = v; }
    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String v) { this.uploadedBy = v; }
    public String getOcrText() { return ocrText; }
    public void setOcrText(String v) { this.ocrText = v; }
    public String getOcrStatus() { return ocrStatus; }
    public void setOcrStatus(String v) { this.ocrStatus = v; }
    public Instant getOcrCompletedAt() { return ocrCompletedAt; }
    public void setOcrCompletedAt(Instant v) { this.ocrCompletedAt = v; }
    public String getOcrError() { return ocrError; }
    public void setOcrError(String v) { this.ocrError = v; }
    public Instant getCreatedAt() { return createdAt; }
}
