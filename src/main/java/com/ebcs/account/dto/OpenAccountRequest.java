package com.ebcs.account.dto;

import jakarta.validation.constraints.NotNull;

public record OpenAccountRequest(@NotNull Long customerId, @NotNull Long productId) {}
