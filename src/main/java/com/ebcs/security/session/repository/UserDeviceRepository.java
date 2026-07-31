package com.ebcs.security.session.repository;

import com.ebcs.security.session.domain.entity.UserDevice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserDeviceRepository extends JpaRepository<UserDevice, Long> {
    List<UserDevice> findByUsernameOrderByLastSeenAtDesc(String username);
    Optional<UserDevice> findByUsernameAndDeviceFingerprint(String username, String fingerprint);
}
