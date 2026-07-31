package com.ebcs.administration.controller;

import com.ebcs.administration.application.service.UserService;
import com.ebcs.administration.dto.UserResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService service;

    public UserController(UserService service) { this.service = service; }

    @GetMapping
    public List<UserResponse> list() { return service.listAll(); }

    @GetMapping("/{id}")
    public UserResponse get(@PathVariable Long id) { return service.get(id); }
}
