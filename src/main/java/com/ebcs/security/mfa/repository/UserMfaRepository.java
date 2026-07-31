package com.ebcs.security.mfa.repository;

import com.ebcs.security.mfa.domain.entity.UserMfa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserMfaRepository extends JpaRepository<UserMfa, Long> {
    Optional<UserMfa> findByUsername(String username);
}
