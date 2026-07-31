package com.ebcs.security.session.controller;

import com.ebcs.security.session.application.service.SessionService;
import com.ebcs.security.session.domain.entity.LoginHistory;
import com.ebcs.security.session.domain.entity.UserDevice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/security")
public class SessionController {

    private final SessionService service;

    public SessionController(SessionService service) { this.service = service; }

    @GetMapping("/login-history")
    public Page<LoginHistory> history(Authentication auth,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return service.history(auth.getName(), PageRequest.of(page, Math.min(size, 100)));
    }

    @GetMapping("/devices")
    public List<UserDevice> devices(Authentication auth) { return service.devices(auth.getName()); }

    @PostMapping("/devices/{id}/trust")
    public void trust(@PathVariable Long id) { service.trust(id, true); }

    @PostMapping("/devices/{id}/revoke")
    public void revoke(@PathVariable Long id) { service.revoke(id); }
}
