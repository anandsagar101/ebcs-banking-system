package com.ebcs.platform.websocket;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP over WebSocket broker for live push channels (money movement, KPI deltas).
 * Endpoint is exposed at {@code /ws} — with SockJS fallback so clients behind strict proxies
 * still work. Broker topics live under {@code /topic/**}.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final String allowedOrigins;

    public WebSocketConfig(@Value("${security.cors.allowed-origins:*}") String allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = allowedOrigins.split(",");
        // Expose under /api/ws so k8s ingress (which routes /api/* to the backend) delivers it.
        registry.addEndpoint("/api/ws")
                .setAllowedOriginPatterns(origins)
                .withSockJS();
        // Native WebSocket endpoint (no SockJS wrapper) — some clients prefer it.
        registry.addEndpoint("/api/ws")
                .setAllowedOriginPatterns(origins);
    }
}
