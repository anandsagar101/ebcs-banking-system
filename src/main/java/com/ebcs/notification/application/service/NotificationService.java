package com.ebcs.notification.application.service;

import com.ebcs.notification.domain.entity.Notification;
import com.ebcs.notification.domain.entity.NotificationPreference;
import com.ebcs.notification.provider.NotificationMessage;
import com.ebcs.notification.provider.NotificationProvider;
import com.ebcs.notification.repository.NotificationPreferenceRepository;
import com.ebcs.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final Map<String, NotificationProvider> providers;
    private final NotificationRepository repo;
    private final NotificationPreferenceRepository prefsRepo;

    public NotificationService(List<NotificationProvider> providerList,
                               NotificationRepository repo,
                               NotificationPreferenceRepository prefsRepo) {
        this.providers = providerList.stream().collect(java.util.stream.Collectors.toMap(NotificationProvider::channel, Function.identity()));
        this.repo = repo;
        this.prefsRepo = prefsRepo;
    }

    @Transactional
    public void dispatch(String channel, String recipient, String subject, String body, String eventType) {
        NotificationProvider p = providers.get(channel);
        String status = "SENT";
        if (p == null) { log.warn("No provider for channel {}", channel); status = "FAILED"; }
        else {
            try {
                boolean ok = p.send(new NotificationMessage(recipient, subject, body, eventType));
                if (!ok) status = "SKIPPED";
            } catch (Exception e) {
                log.error("Provider {} failed: {}", channel, e.getMessage());
                status = "FAILED";
            }
        }
        repo.save(new Notification(recipient, channel, subject, body, eventType, status));
    }

    public boolean channelAllowedFor(String username, String channel) {
        NotificationPreference pref = prefsRepo.findByUsername(username).orElse(null);
        if (pref == null) return true;
        return switch (channel) {
            case "EMAIL" -> pref.isEmailEnabled();
            case "SMS" -> pref.isSmsEnabled();
            case "PUSH" -> pref.isPushEnabled();
            default -> true;
        };
    }

    @Transactional
    public NotificationPreference upsertPreference(String username, boolean email, boolean sms, boolean push) {
        NotificationPreference p = prefsRepo.findByUsername(username).orElseGet(() -> new NotificationPreference(username));
        p.setEmailEnabled(email); p.setSmsEnabled(sms); p.setPushEnabled(push); p.setUpdatedAt(Instant.now());
        return prefsRepo.save(p);
    }

    public NotificationPreference getPreference(String username) {
        return prefsRepo.findByUsername(username).orElseGet(() -> new NotificationPreference(username));
    }

    public org.springframework.data.domain.Page<Notification> listFor(String recipient, org.springframework.data.domain.Pageable pageable) {
        return repo.findByRecipientOrderByCreatedAtDesc(recipient, pageable);
    }

    public long unreadCount(String recipient) { return repo.countByRecipientAndReadAtIsNull(recipient); }

    @Transactional
    public void markRead(Long id) {
        repo.findById(id).ifPresent(n -> { n.setReadAt(Instant.now()); repo.save(n); });
    }
}
