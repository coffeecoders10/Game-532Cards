/** Connection settings for the shared Socket.IO room service (see docs/sop-socket.md). */
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "https://coffeecoders.cc/socket";
export const SOCKET_PATH = process.env.NEXT_PUBLIC_SOCKET_PATH ?? "/flask_api/socket.io";
