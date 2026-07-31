package com.ebcs.administration.controller;

import com.ebcs.administration.application.service.ConfigurationService;
import com.ebcs.administration.domain.entity.Configuration;
import com.ebcs.administration.dto.ConfigDto;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/config")
@PreAuthorize("hasRole('ADMIN')")
public class ConfigurationController {

    private final ConfigurationService service;

    public ConfigurationController(ConfigurationService service) { this.service = service; }

    @GetMapping
    public List<Configuration> list() { return service.list(); }

    @GetMapping("/{key}")
    public Configuration get(@PathVariable String key) { return service.get(key); }

    @PutMapping
    public Configuration upsert(@Valid @RequestBody ConfigDto dto) { return service.upsert(dto); }
}
