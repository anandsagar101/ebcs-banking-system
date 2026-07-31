package com.ebcs.security.session.repository;

import com.ebcs.security.session.domain.entity.LoginHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {
    Page<LoginHistory> findByUsernameOrderByCreatedAtDesc(String username, Pageable pageable);
    long countByUsernameAndSuccess(String username, boolean success);
}
