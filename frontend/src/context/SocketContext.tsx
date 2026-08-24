import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

type SocketContextType = {
  socket: Socket | null;
  onlineUsers: Record<string, boolean>;
};

const SocketContext = createContext<SocketContextType>({ socket: null, onlineUsers: {} });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const s = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
    });

    s.on("connect", () => {
      s.emit("presence:online");
    });

    s.on("presence:changed", ({ userId, isOnline }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: isOnline }));
    });

    s.on("disconnect", () => {
      s.emit("presence:offline");
    });

    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
