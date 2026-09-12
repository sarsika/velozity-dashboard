import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../services/token.service";

let io: Server;
const onlineUsers = new Map<string, number>();

export function initSockets(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });


  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error("No token");
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const { userId } = socket.data.user;

    onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);
    socket.join(`user:${userId}`);

    // Client asks to watch a specific project's feed after opening it.
    socket.on("project:watch", (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    socket.on("project:unwatch", (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on("disconnect", () => {
      const count = (onlineUsers.get(userId) || 1) - 1;
      if (count <= 0) onlineUsers.delete(userId);
      else onlineUsers.set(userId, count);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialised yet");
  return io;
}

export function getOnlineUserCount() {
  return onlineUsers.size;
}
