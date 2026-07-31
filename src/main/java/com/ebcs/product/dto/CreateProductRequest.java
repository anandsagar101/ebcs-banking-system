package com.ebcs.product.dto;

import com.ebcs.product.domain.entity.ProductType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record CreateProductRequest(
        @NotBlank String code,
        @NotBlank String name,
        @NotNull ProductType productType,
        @NotNull @PositiveOrZero BigDecimal interestRate
) {}
