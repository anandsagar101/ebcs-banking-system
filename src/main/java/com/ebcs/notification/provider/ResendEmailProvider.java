package com.ebcs.notification.provider;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Real transactional email provider backed by Resend (https://resend.com).
 * <p>
 * Registered as the EMAIL {@link NotificationProvider} whenever {@code resend.api-key} is set.
 * The fallback {@link LoggingEmailProvider} covers the empty-key case, so there is never a
 * conflict on the {@code EMAIL} channel key.
 */
@Component
@ConditionalOnExpression("!T(org.springframework.util.StringUtils).isEmpty('${resend.api-key:}'.trim())")
public class ResendEmailProvider implements NotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailProvider.class);
    private static final String ENDPOINT = "https://api.resend.com/emails";

    private final String apiKey;
    private final String senderEmail;
    private final boolean enabled;
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    public ResendEmailProvider(@Value("${resend.api-key:}") String apiKey,
                               @Value("${resend.sender-email:onboarding@resend.dev}") String senderEmail,
                               @Value("${notifications.email.enabled:true}") boolean enabled) {
        this.apiKey = apiKey;
        this.senderEmail = senderEmail;
        this.enabled = enabled;
    }

    @Override public String channel() { return "EMAIL"; }

    @Override
    public boolean send(NotificationMessage m) {
        if (!enabled) {
            log.debug("[EMAIL disabled] to={} subject={}", m.getRecipient(), m.getSubject());
            return false;
        }
        if (apiKey == null || apiKey.isBlank()) {
            // No key configured — fall back to log-only behaviour so dev still works.
            log.info("[EMAIL log-only, no RESEND key] to={} subject='{}' body='{}'",
                    m.getRecipient(), m.getSubject(), m.getBody());
            return true;
        }
        try {
            String payload = mapper.writeValueAsString(Map.of(
                    "from", senderEmail,
                    "to", new String[]{ m.getRecipient() },
                    "subject", m.getSubject() == null ? "(no subject)" : m.getSubject(),
                    "html", toHtml(m.getBody()),
                    "text", m.getBody()
            ));
            HttpRequest req = HttpRequest.newBuilder(URI.create(ENDPOINT))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
                log.info("[EMAIL sent via Resend] to={} status={} id={}",
                        m.getRecipient(), resp.statusCode(), snippet(resp.body()));
                return true;
            }
            log.error("[EMAIL Resend failed] status={} body={}", resp.statusCode(), resp.body());
            return false;
        } catch (JsonProcessingException e) {
            log.error("[EMAIL Resend payload error]", e);
            return false;
        } catch (Exception e) {
            log.error("[EMAIL Resend transport error] {}", e.getMessage());
            return false;
        }
    }

    private static String snippet(String body) {
        if (body == null) return "";
        return body.length() > 120 ? body.substring(0, 120) + "…" : body;
    }

    /** Very small text->html converter — preserves line breaks so plain-text bodies still look right. */
    static String toHtml(String body) {
        if (body == null) return "";
        String escaped = body
                .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\n", "<br>");
        return "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"
                + "font-size:15px;line-height:1.55;color:#0f172a;max-width:560px;margin:0 auto;"
                + "padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;\">"
                + escaped
                + "</div>";
    }
}
