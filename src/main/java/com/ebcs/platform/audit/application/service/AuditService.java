package com.ebcs.platform.audit.application.service;

import com.ebcs.platform.audit.domain.entity.AuditLog;
import com.ebcs.platform.audit.repository.AuditLogRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditLogRepository repo;

    public AuditService(AuditLogRepository repo) { this.repo = repo; }

    public void record(String action, String resource, String payload) {
        String actor = "system";
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a != null && a.getName() != null) actor = a.getName();
        repo.save(new AuditLog(actor, action, resource, payload));
    }
}
