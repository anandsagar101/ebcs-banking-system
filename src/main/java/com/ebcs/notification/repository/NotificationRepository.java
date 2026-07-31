package com.ebcs.notification.repository;

import com.ebcs.notification.domain.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByRecipientOrderByCreatedAtDesc(String recipient, Pageable pageable);
    long countByRecipientAndReadAtIsNull(String recipient);
}
