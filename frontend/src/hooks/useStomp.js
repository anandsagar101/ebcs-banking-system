import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";

/**
 * Subscribe to a STOMP topic on the backend and invoke `onMessage` with parsed JSON payloads.
 *
 * @param {string[]} topics       - topic names, e.g. `["/topic/money-moved", "/topic/kpis"]`
 * @param {(msg: any, topic: string) => void} onMessage - handler called for every frame
 */
export default function useStomp(topics, onMessage) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    if (!topics || topics.length === 0) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BACKEND_URL}/api/ws`),
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        topics.forEach((topic) => {
          client.subscribe(topic, (frame) => {
            try {
              const payload = JSON.parse(frame.body);
              handlerRef.current?.(payload, topic);
            } catch (e) {
              handlerRef.current?.(frame.body, topic);
            }
          });
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });
    client.activate();
    clientRef.current = client;
    return () => { client.deactivate(); clientRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(topics)]);

  return { connected };
}
