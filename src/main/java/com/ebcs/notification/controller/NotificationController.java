package com.ebcs.notification.controller;

import com.ebcs.notification.application.service.NotificationService;
import com.ebcs.notification.domain.entity.Notification;
import com.ebcs.notification.domain.entity.NotificationPreference;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) { this.service = service; }

    @GetMapping
    public Page<Notification> list(Authentication auth,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        return service.listFor(auth.getName(), PageRequest.of(page, Math.min(size, 100)));
    }

    @GetMapping("/unread-count")
    public long unread(Authentication auth) { return service.unreadCount(auth.getName()); }

    @PostMapping("/{id}/read")
    public void markRead(@PathVariable Long id) { service.markRead(id); }

    @GetMapping("/preferences")
    public NotificationPreference getPreferences(Authentication auth) {
        return service.getPreference(auth.getName());
    }

    @PutMapping("/preferences")
    public NotificationPreference updatePreferences(Authentication auth, @RequestBody PrefRequest req) {
        return service.upsertPreference(auth.getName(), req.email, req.sms, req.push);
    }

    public static class PrefRequest {
        @NotNull public Boolean email;
        @NotNull public Boolean sms;
        @NotNull public Boolean push;
    }
}
