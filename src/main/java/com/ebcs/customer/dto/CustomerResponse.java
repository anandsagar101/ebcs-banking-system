package com.ebcs.customer.dto;

import com.ebcs.customer.domain.entity.KycStatus;

import java.time.Instant;

public record CustomerResponse(Long id, String firstName, String lastName, String email,
                               String phone, KycStatus kycStatus, Instant createdAt) {}
