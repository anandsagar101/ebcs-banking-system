package com.ebcs.security.session.application.service;

import com.ebcs.security.session.domain.entity.LoginHistory;
import com.ebcs.security.session.domain.entity.UserDevice;
import com.ebcs.security.session.repository.LoginHistoryRepository;
import com.ebcs.security.session.repository.UserDeviceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

@Service
public class SessionService {

    private final LoginHistoryRepository historyRepo;
    private final UserDeviceRepository deviceRepo;

    public SessionService(LoginHistoryRepository h, UserDeviceRepository d) { this.historyRepo = h; this.deviceRepo = d; }

    @Transactional
    public void recordLogin(String username, boolean success, String ip, String userAgent, String failureReason) {
        historyRepo.save(new LoginHistory(username, success, ip, userAgent, failureReason));
        if (success) {
            String fp = fingerprint(userAgent, ip);
            UserDevice d = deviceRepo.findByUsernameAndDeviceFingerprint(username, fp).orElseGet(UserDevice::new);
            d.setUsername(username);
            d.setDeviceFingerprint(fp);
            d.setDeviceName(deriveDeviceName(userAgent));
            d.setUserAgent(userAgent);
            d.setIpAddress(ip);
            d.setLastSeenAt(Instant.now());
            deviceRepo.save(d);
        }
    }

    public Page<LoginHistory> history(String username, Pageable p) {
        return historyRepo.findByUsernameOrderByCreatedAtDesc(username, p);
    }

    public List<UserDevice> devices(String username) { return deviceRepo.findByUsernameOrderByLastSeenAtDesc(username); }

    @Transactional
    public void trust(Long deviceId, boolean trusted) {
        deviceRepo.findById(deviceId).ifPresent(d -> { d.setTrusted(trusted); deviceRepo.save(d); });
    }

    @Transactional
    public void revoke(Long deviceId) { deviceRepo.deleteById(deviceId); }

    static String fingerprint(String ua, String ip) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] out = md.digest(((ua == null ? "" : ua) + "|" + (ip == null ? "" : ip)).getBytes());
            return HexFormat.of().formatHex(out).substring(0, 32);
        } catch (Exception e) { return String.valueOf((ua + ip).hashCode()); }
    }

    static String deriveDeviceName(String ua) {
        if (ua == null) return "Unknown";
        String lc = ua.toLowerCase();
        if (lc.contains("iphone")) return "iPhone";
        if (lc.contains("ipad")) return "iPad";
        if (lc.contains("android")) return "Android device";
        if (lc.contains("mac")) return "macOS · " + browser(lc);
        if (lc.contains("windows")) return "Windows · " + browser(lc);
        if (lc.contains("linux")) return "Linux · " + browser(lc);
        return "Web";
    }
    static String browser(String lc) {
        if (lc.contains("edg")) return "Edge";
        if (lc.contains("chrome")) return "Chrome";
        if (lc.contains("firefox")) return "Firefox";
        if (lc.contains("safari")) return "Safari";
        return "Browser";
    }
}
