package com.ebcs.administration.application.service;

import com.ebcs.administration.domain.entity.AppUser;
import com.ebcs.administration.dto.UserResponse;
import com.ebcs.administration.repository.AppUserRepository;
import com.ebcs.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final AppUserRepository repo;

    public UserService(AppUserRepository repo) { this.repo = repo; }

    public List<UserResponse> listAll() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    public UserResponse get(Long id) {
        AppUser u = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return toResponse(u);
    }

    private UserResponse toResponse(AppUser u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getEmail(), u.isEnabled(),
                u.getRoles().stream().map(r -> r.getName()).collect(Collectors.toSet()),
                u.getCreatedAt());
    }
}
