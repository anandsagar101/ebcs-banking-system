package com.ebcs.document.application.service;

import com.ebcs.document.domain.entity.Document;
import com.ebcs.document.domain.entity.DocumentVersion;
import com.ebcs.document.repository.DocumentRepository;
import com.ebcs.document.repository.DocumentVersionRepository;
import com.ebcs.shared.exception.BusinessException;
import com.ebcs.shared.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class DocumentService {

    private final DocumentRepository repo;
    private final DocumentVersionRepository versions;
    private final OcrService ocrService;
    private final ApplicationEventPublisher events;
    private final Path storageRoot;
    private final long maxSize;

    public DocumentService(DocumentRepository repo,
                           DocumentVersionRepository versions,
                           OcrService ocrService,
                           ApplicationEventPublisher events,
                           @Value("${documents.storage-path:/tmp/ebcs-docs}") String storagePath,
                           @Value("${documents.max-size-bytes:10485760}") long maxSize) throws IOException {
        this.repo = repo; this.versions = versions;
        this.ocrService = ocrService;
        this.events = events;
        this.storageRoot = Paths.get(storagePath);
        Files.createDirectories(storageRoot);
        this.maxSize = maxSize;
    }

    @Transactional
    public Document upload(String ownerType, Long ownerId, String docType, MultipartFile file, String uploadedBy) throws IOException {
        if (file.isEmpty()) throw new BusinessException("Empty file");
        if (file.getSize() > maxSize) throw new BusinessException("File exceeds max size of " + maxSize + " bytes");
        String ct = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
        if (!ct.startsWith("image/") && !ct.equals("application/pdf"))
            throw new BusinessException("Only PDF or image files are allowed");

        String fname = UUID.randomUUID() + "-" + safe(file.getOriginalFilename());
        Path target = storageRoot.resolve(fname);
        Files.write(target, file.getBytes());
        String checksum = sha256(file.getBytes());

        Document existing = repo.findByOwnerTypeAndOwnerIdOrderByCreatedAtDesc(ownerType, ownerId).stream()
                .filter(d -> d.getDocType().equalsIgnoreCase(docType)).findFirst().orElse(null);

        if (existing != null) {
            DocumentVersion prior = new DocumentVersion();
            prior.setDocumentId(existing.getId());
            prior.setVersion(existing.getVersion());
            prior.setStoragePath(existing.getStoragePath());
            prior.setSizeBytes(existing.getSizeBytes());
            prior.setChecksum(existing.getChecksum());
            prior.setUploadedBy(existing.getUploadedBy());
            versions.save(prior);
            existing.setVersion(existing.getVersion() + 1);
            existing.setFilename(file.getOriginalFilename());
            existing.setContentType(ct);
            existing.setSizeBytes(file.getSize());
            existing.setStoragePath(target.toString());
            existing.setChecksum(checksum);
            existing.setUploadedBy(uploadedBy);
            Document saved = repo.save(existing);
            maybeQueueOcr(saved);
            return saved;
        }
        Document d = new Document();
        d.setOwnerType(ownerType); d.setOwnerId(ownerId); d.setDocType(docType);
        d.setFilename(file.getOriginalFilename()); d.setContentType(ct);
        d.setSizeBytes(file.getSize()); d.setStoragePath(target.toString());
        d.setChecksum(checksum); d.setUploadedBy(uploadedBy); d.setVersion(1);
        Document saved = repo.save(d);
        maybeQueueOcr(saved);
        return saved;
    }

    private void maybeQueueOcr(Document d) {
        // New content invalidates any prior OCR result — always clear the metadata so callers
        // don't see stale text from a previous version.
        d.setOcrText(null);
        d.setOcrError(null);
        d.setOcrCompletedAt(null);
        if (ocrService.shouldRun(d)) {
            d.setOcrStatus("QUEUED");
            repo.save(d);
            // Defer the actual OCR call until the outer @Transactional commits, otherwise the async
            // worker races the transaction and can't find the row.
            events.publishEvent(new DocumentUploadedEvent(d.getId()));
        } else {
            d.setOcrStatus("NONE");
            repo.save(d);
        }
    }

    public List<Document> listFor(String ownerType, Long ownerId) {
        return repo.findByOwnerTypeAndOwnerIdOrderByCreatedAtDesc(ownerType, ownerId);
    }

    public Document get(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
    }

    public List<DocumentVersion> history(Long id) {
        get(id);
        return versions.findByDocumentIdOrderByVersionDesc(id);
    }

    public Document save(Document d) { return repo.save(d); }

    public byte[] read(Long id) throws IOException {
        Document d = get(id);
        return Files.readAllBytes(Path.of(d.getStoragePath()));
    }

    private String safe(String name) {
        if (name == null) return "file";
        return name.replaceAll("[^A-Za-z0-9._-]", "_");
    }
    private String sha256(byte[] data) {
        try {
            byte[] h = MessageDigest.getInstance("SHA-256").digest(data);
            return HexFormat.of().formatHex(h);
        } catch (Exception e) { return null; }
    }
}
