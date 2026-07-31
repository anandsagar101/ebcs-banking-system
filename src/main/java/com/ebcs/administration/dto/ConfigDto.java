package com.ebcs.administration.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfigDto(@NotBlank String key, @NotBlank String value) {}
