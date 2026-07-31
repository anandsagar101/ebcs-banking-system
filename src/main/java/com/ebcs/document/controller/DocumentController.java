package com.ebcs.document.controller;

import com.ebcs.document.application.service.DocumentService;
import com.ebcs.document.application.service.OcrService;
import com.ebcs.document.domain.entity.Document;
import com.ebcs.document.domain.entity.DocumentVersion;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService service;
    private final OcrService ocrService;

    public DocumentController(DocumentService service, OcrService ocrService) {
        this.service = service;
        this.ocrService = ocrService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Document upload(@RequestParam String ownerType,
                           @RequestParam Long ownerId,
                           @RequestParam String docType,
                           @RequestPart("file") MultipartFile file,
                           Authentication auth) throws IOException {
        return service.upload(ownerType, ownerId, docType, file, auth != null ? auth.getName() : "anonymous");
    }

    @GetMapping
    public List<Document> list(@RequestParam String ownerType, @RequestParam Long ownerId) {
        return service.listFor(ownerType, ownerId);
    }

    @GetMapping("/{id}")
    public Document get(@PathVariable Long id) { return service.get(id); }

    @GetMapping("/{id}/versions")
    public List<DocumentVersion> versions(@PathVariable Long id) { return service.history(id); }

    @GetMapping("/{id}/download")
    public ResponseEntity<ByteArrayResource> download(@PathVariable Long id) throws IOException {
        Document d = service.get(id);
        byte[] data = service.read(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + d.getFilename() + "\"")
                .contentType(MediaType.parseMediaType(d.getContentType()))
                .contentLength(data.length)
                .body(new ByteArrayResource(data));
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<ByteArrayResource> preview(@PathVariable Long id) throws IOException {
        Document d = service.get(id);
        byte[] data = service.read(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + d.getFilename() + "\"")
                .contentType(MediaType.parseMediaType(d.getContentType()))
                .contentLength(data.length)
                .body(new ByteArrayResource(data));
    }

    /**
     * Manually retry the OCR pipeline for a document (e.g. after enabling the flag).
     * Fires asynchronously and returns immediately with the queued status.
     */
    @PostMapping("/{id}/ocr")
    public Document runOcr(@PathVariable Long id) {
        Document d = service.get(id);
        if (!ocrService.shouldRun(d)) {
            d.setOcrStatus(ocrService.isEnabled() ? "SKIPPED" : "DISABLED");
            return d;
        }
        d.setOcrStatus("QUEUED");
        d.setOcrError(null);
        service.save(d);
        ocrService.processAsync(id);
        return d;
    }
}
