package com.ebcs.security.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/** Simple in-memory token bucket keyed by IP+path. Suitable for single-instance deployments;
 *  swap with a Redis/Bucket4j implementation for horizontal scale. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

    private final int maxPerMinute;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public RateLimitFilter(@Value("${security.ratelimit.auth.per-minute:20}") int maxPerMinute) {
        this.maxPerMinute = maxPerMinute;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register")) {
            String key = clientIp(request) + "|" + path;
            Bucket b = buckets.computeIfAbsent(key, k -> new Bucket());
            if (!b.tryAcquire(maxPerMinute)) {
                response.setStatus(429);
                response.setHeader("Retry-After", "60");
                response.setContentType("application/json");
                response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Try again in a minute.\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    static String clientIp(HttpServletRequest r) {
        String xff = r.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return r.getRemoteAddr();
    }

    static class Bucket {
        AtomicInteger count = new AtomicInteger();
        volatile long windowStart = System.currentTimeMillis();
        boolean tryAcquire(int max) {
            long now = System.currentTimeMillis();
            if (now - windowStart >= 60_000) {
                synchronized (this) {
                    if (now - windowStart >= 60_000) { windowStart = now; count.set(0); }
                }
            }
            return count.incrementAndGet() <= max;
        }
    }
}
