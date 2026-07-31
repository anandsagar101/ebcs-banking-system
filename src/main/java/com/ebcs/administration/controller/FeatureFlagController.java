package com.ebcs.administration.controller;

import com.ebcs.administration.domain.entity.FeatureFlag;
import com.ebcs.administration.repository.FeatureFlagRepository;
import com.ebcs.shared.exception.ResourceNotFoundException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/admin/feature-flags")
public class FeatureFlagController {

    private final FeatureFlagRepository repo;

    public FeatureFlagController(FeatureFlagRepository repo) { this.repo = repo; }

    @GetMapping
    public List<FeatureFlag> list() { return repo.findAll(); }

    @PutMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public FeatureFlag toggle(@PathVariable String key, @RequestParam boolean enabled) {
        FeatureFlag f = repo.findByKey(key).orElseThrow(() -> new ResourceNotFoundException("Flag not found: " + key));
        f.setEnabled(enabled); f.setUpdatedAt(Instant.now());
        return repo.save(f);
    }
}
