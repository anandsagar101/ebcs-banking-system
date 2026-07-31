package com.ebcs.administration.application.service;

import com.ebcs.administration.domain.entity.Configuration;
import com.ebcs.administration.dto.ConfigDto;
import com.ebcs.administration.repository.ConfigurationRepository;
import com.ebcs.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ConfigurationService {

    private final ConfigurationRepository repo;

    public ConfigurationService(ConfigurationRepository repo) { this.repo = repo; }

    public List<Configuration> list() { return repo.findAll(); }

    public Configuration get(String key) {
        return repo.findByKey(key).orElseThrow(() -> new ResourceNotFoundException("Config not found: " + key));
    }

    @Transactional
    public Configuration upsert(ConfigDto dto) {
        Configuration cfg = repo.findByKey(dto.key()).orElseGet(Configuration::new);
        cfg.setKey(dto.key());
        cfg.setValue(dto.value());
        return repo.save(cfg);
    }
}
