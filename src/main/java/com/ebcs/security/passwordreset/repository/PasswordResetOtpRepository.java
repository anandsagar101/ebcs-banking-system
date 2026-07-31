package com.ebcs.security.passwordreset.repository;

import com.ebcs.security.passwordreset.domain.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {
    Optional<PasswordResetOtp> findFirstByEmailOrderByCreatedAtDesc(String email);
    Optional<PasswordResetOtp> findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(String email);
}
