package com.ebcs.document.application.service;

import com.ebcs.administration.repository.FeatureFlagRepository;
import com.ebcs.document.domain.entity.Document;
import com.ebcs.document.repository.DocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

/**
 * OCR pipeline backed by the system-installed Tesseract binary. Runs asynchronously
 * so uploads stay snappy; results are persisted onto the {@code documents} row.
 *
 * <p>Trigger conditions: file must be an image AND the {@code documents.ocr.enabled}
 * feature flag must be true when the upload lands.
 */
@Service
public class OcrService {

    private static final Logger log = LoggerFactory.getLogger(OcrService.class);
    static final String FLAG_KEY = "documents.ocr.enabled";

    private final DocumentRepository docRepo;
    private final FeatureFlagRepository flagRepo;
    private final String tesseractBinary;
    private final int timeoutSeconds;
    private final int maxChars;

    public OcrService(DocumentRepository docRepo,
                      FeatureFlagRepository flagRepo,
                      @Value("${documents.ocr.binary:tesseract}") String tesseractBinary,
                      @Value("${documents.ocr.timeout-seconds:60}") int timeoutSeconds,
                      @Value("${documents.ocr.max-chars:20000}") int maxChars) {
        this.docRepo = docRepo;
        this.flagRepo = flagRepo;
        this.tesseractBinary = tesseractBinary;
        this.timeoutSeconds = timeoutSeconds;
        this.maxChars = maxChars;
    }

    /** Read the flag every call so an admin flipping it takes effect on the very next upload. */
    public boolean isEnabled() {
        return flagRepo.findByKey(FLAG_KEY).map(f -> f.isEnabled()).orElse(false);
    }

    public boolean shouldRun(Document d) {
        if (d == null || d.getContentType() == null) return false;
        // Tesseract handles images out of the box. PDFs need extra tooling (poppler etc.) —
        // skip them for now so a missing dep doesn't fail the whole upload.
        if (!d.getContentType().startsWith("image/")) return false;
        return isEnabled();
    }

    /** Fire-and-forget entry point invoked by DocumentService after a successful upload. */
    @Async
    public void processAsync(Long documentId) {
        try {
            process(documentId);
        } catch (Exception e) {
            log.error("OCR async pipeline failed for doc {}: {}", documentId, e.getMessage());
        }
    }

    /**
     * Kicks the OCR pipeline once the upload transaction has committed.
     * Runs on Spring's async executor so the HTTP thread returns immediately.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onDocumentUploaded(DocumentUploadedEvent evt) {
        try {
            process(evt.getDocumentId());
        } catch (Exception e) {
            log.error("OCR pipeline (event) failed for doc {}: {}", evt.getDocumentId(), e.getMessage());
        }
    }

    @Transactional
    public void process(Long documentId) {
        Document doc = docRepo.findById(documentId).orElse(null);
        if (doc == null) { log.warn("OCR: document {} vanished", documentId); return; }
        if (!shouldRun(doc)) {
            log.debug("OCR: skipping doc {} (flag off or unsupported type {})", documentId, doc.getContentType());
            return;
        }
        Path source = Path.of(doc.getStoragePath());
        if (!Files.exists(source)) {
            markFailure(doc, "Source file missing");
            return;
        }

        // Tesseract writes to <out>.txt so we hand it a stem, then read the .txt back.
        Path outStem;
        try {
            outStem = Files.createTempFile("ebcs-ocr-", "");
            Files.deleteIfExists(outStem);
        } catch (IOException e) {
            markFailure(doc, "Cannot create temp file: " + e.getMessage());
            return;
        }
        Path outText = Path.of(outStem.toString() + ".txt");

        try {
            ProcessBuilder pb = new ProcessBuilder(
                    tesseractBinary,
                    source.toAbsolutePath().toString(),
                    outStem.toString(),
                    "-l", "eng",
                    "--psm", "3"
            ).redirectErrorStream(true);
            Process p = pb.start();
            boolean done = p.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!done) {
                p.destroyForcibly();
                markFailure(doc, "OCR timed out after " + timeoutSeconds + "s");
                return;
            }
            if (p.exitValue() != 0) {
                String stderr = new String(p.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                markFailure(doc, "Tesseract exited " + p.exitValue() + ": " + snippet(stderr, 300));
                return;
            }
            String extracted = Files.exists(outText)
                    ? Files.readString(outText, StandardCharsets.UTF_8)
                    : "";
            String normalized = extracted.strip();
            if (normalized.length() > maxChars) normalized = normalized.substring(0, maxChars);
            doc.setOcrText(normalized);
            doc.setOcrStatus(normalized.isEmpty() ? "EMPTY" : "COMPLETED");
            doc.setOcrCompletedAt(java.time.Instant.now());
            doc.setOcrError(null);
            docRepo.save(doc);
            log.info("OCR completed for doc {} — {} chars", documentId, normalized.length());
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            markFailure(doc, "OCR failed: " + e.getMessage());
        } finally {
            try { Files.deleteIfExists(outText); } catch (IOException ignored) {}
        }
    }

    private void markFailure(Document d, String reason) {
        d.setOcrStatus("FAILED");
        d.setOcrError(snippet(reason, 480));
        d.setOcrCompletedAt(java.time.Instant.now());
        docRepo.save(d);
        log.warn("OCR failed for doc {}: {}", d.getId(), reason);
    }

    private static String snippet(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }
}
