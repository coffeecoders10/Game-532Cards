import { io } from "socket.io-client";
import { SOCKET_PATH, SOCKET_URL, roomIdFor } from "./config";
import { type Wire, parseWire } from "./protocol";

export interface RoomHandlers {
  onConnect(): void;
  onDisconnect(): void;
  /** Everyone currently in the room, as reported by the service. */
  onStatus(users: string[]): void;
  onWire(wire: Wire): void;
}

export interface RoomLink {
  send(wire: Wire): void;
  /** Leaves the room and drops the connection. */
  close(): void;
}

/** Opens a connection to the room; swappable so the sessions can be tested without a network. */
export type RoomConnector = (handlers: RoomHandlers) => RoomLink;

/**
 * Follows docs/sop-socket.md: websocket transport only, handlers registered before `join`,
 * and `join` re-sent on every (re)connect. The socket "username" is our per-tab player id.
 */
export function socketConnector(code: string, userId: string): RoomConnector {
  const room_id = roomIdFor(code);
  return (handlers) => {
    const socket = io(SOCKET_URL, {
      path: SOCKET_PATH,
      transports: ["websocket"],
      forceNew: true,
    });

    socket.on("status", (payload: { users?: unknown }) => {
      if (Array.isArray(payload?.users)) handlers.onStatus(payload.users.filter((u) => typeof u === "string"));
    });
    socket.on("message", (payload: { username?: string; socket_data?: unknown }) => {
      if (payload?.username === userId) return; // our own echo
      let data = payload?.socket_data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      const wire = parseWire(data);
      if (wire) handlers.onWire(wire);
    });
    socket.on("connect", () => {
      socket.emit("join", { username: userId, room_id });
      handlers.onConnect();
    });
    socket.on("disconnect", () => handlers.onDisconnect());

    return {
      send(wire) {
        socket.emit("message", { username: userId, room_id, socket_data: JSON.stringify(wire) });
      },
      close() {
        if (socket.connected) socket.emit("leave", { username: userId, room_id });
        socket.disconnect();
      },
    };
  };
}
