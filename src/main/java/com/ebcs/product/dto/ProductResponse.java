package com.ebcs.product.dto;

import com.ebcs.product.domain.entity.ProductType;

import java.math.BigDecimal;

public record ProductResponse(Long id, String code, String name, ProductType productType,
                              BigDecimal interestRate, boolean active) {}
