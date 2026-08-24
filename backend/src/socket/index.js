import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Appointment from "../models/Appointment.js";
import { createNotification } from "../services/notificationService.js";
import { socketCorsOrigins } from "../config/cors.js";

/**
 * Validate that a user is a participant of the given appointment
 * (patient or counselor) and that the appointment is not cancelled/rejected.
 * Returns null on success or an error message.
 */
async function authorizeAppointmentParticipant(appointmentId, userId) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return "Appointment not found";
  const isCandidate = (appointment.candidate && appointment.candidate.equals(userId)) || (appointment.patient && appointment.patient.equals(userId));
  const isCounselor = appointment.counselor.equals(userId);
  if (!isCandidate && !isCounselor) return "Unauthorized";
  if (appointment.status === "cancelled" || appointment.status === "rejected") {
    return "Cannot access cancelled/rejected appointment";
  }
  return null;
}

let ioInstance = null;

export function getIO() {
  return ioInstance;
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: socketCorsOrigins(),
      credentials: true,
      methods: ["GET", "POST"],
    },
  });
  ioInstance = io;

  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive || user.isDeleted) return next(new Error("Unauthorized"));
      socket.user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    socket.join(`user_${userId}`);
    console.log(`🔌 Socket connected: user ${userId}`);

    socket.on("presence:online", async () => {
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("presence:changed", { userId, isOnline: true });
    });

    socket.on("presence:offline", async () => {
      await User.findByIdAndUpdate(userId, { isOnline: false });
      io.emit("presence:changed", { userId, isOnline: false });
    });

    socket.on("chat:send", async (payload, callback) => {
      try {
        const { appointmentId, content, type } = payload;
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return callback?.({ error: "Appointment not found" });

        const isCandidate = (appointment.candidate && appointment.candidate.equals(userId)) || (appointment.patient && appointment.patient.equals(userId));
        const isCounselor = appointment.counselor.equals(userId);
        if (!isCandidate && !isCounselor) return callback?.({ error: "Unauthorized" });
        if (appointment.status === "cancelled" || appointment.status === "rejected") {
          return callback?.({ error: "Cannot chat on cancelled/rejected appointment" });
        }

        const receiverId = isCandidate ? appointment.counselor : (appointment.candidate || appointment.patient);
        const message = await Message.create({
          appointment: appointment._id,
          sender: userId,
          receiver: receiverId,
          type: type || "text",
          content,
        });

        io.to(`user_${receiverId}`).emit("message:new", message);
        callback?.({ message });

        await createNotification({
          recipient: receiverId,
          type: "new_message",
          title: socket.user.role === "counselor" ? "New Message from Counselor" : "New Message from Candidate",
          message: content.slice(0, 120),
          relatedAppointment: appointment._id,
          relatedChat: message._id,
        });
      } catch (error) {
        callback?.({ error: error.message });
      }
    });

    socket.on("message:read", async ({ appointmentId }) => {
      await Message.updateMany(
        { appointment: appointmentId, receiver: userId, readBy: { $nin: [userId] } },
        { $push: { readBy: userId } }
      );
    });

    socket.on("call:answer", ({ receiverId, accepted }) => {
      io.to(`user_${receiverId}`).emit("call:answered", { accepted, from: userId });
    });

    /* ---------- Typing indicator ---------- */
    socket.on("chat:typing", async ({ appointmentId, typing }) => {
      try {
        const err = await authorizeAppointmentParticipant(appointmentId, userId);
        if (err) return;
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return;
        const isCandidate = (appointment.candidate && appointment.candidate.equals(userId)) || (appointment.patient && appointment.patient.equals(userId));
        const receiverId = isCandidate ? appointment.counselor : (appointment.candidate || appointment.patient);
        io.to(`user_${receiverId}`).emit("chat:typing", {
          appointmentId,
          userId,
          typing: !!typing,
        });
      } catch {
        /* ignore */
      }
    });

    /* ---------- WebRTC consultation signaling (scoped to appointment) ---------- */
    // Joining a consultation room for an appointment the user belongs to.
    socket.on("consultation:join", async ({ appointmentId }, callback) => {
      try {
        const err = await authorizeAppointmentParticipant(appointmentId, userId);
        if (err) {
          return callback?.({ error: err });
        }
        const appointment = await Appointment.findById(appointmentId);
        // Only allow video consultation for confirmed/accepted/rescheduled online appointments.
        if (appointment.consultationType !== "online") {
          return callback?.({ error: "This is an offline consultation" });
        }
        if (appointment.status !== "confirmed" && appointment.status !== "accepted" && appointment.status !== "rescheduled") {
          return callback?.({ error: "Consultation is only available for confirmed appointments" });
        }
        const room = `consultation_${appointment._id}`;
        socket.join(room);
        const peers = io.sockets.adapter.rooms.get(room);
        const peerCount = peers ? peers.size : 1;
        const isCandidate = (appointment.candidate && appointment.candidate.equals(userId)) || (appointment.patient && appointment.patient.equals(userId));
        const otherId = isCandidate ? appointment.counselor : (appointment.candidate || appointment.patient);
        // Notify the other participant (over their user room).
        io.to(`user_${otherId}`).emit("consultation:peer-joined", {
          appointmentId: appointment._id,
          userId,
        });
        callback?.({
          room,
          appointment,
          peerCount,
        });
      } catch (error) {
        callback?.({ error: error.message });
      }
    });

    socket.on("consultation:leave", async ({ appointmentId }, callback) => {
      try {
        const err = await authorizeAppointmentParticipant(appointmentId, userId);
        if (!err) {
          const appointment = await Appointment.findById(appointmentId);
          if (appointment) {
            const room = `consultation_${appointment._id}`;
            socket.leave(room);
          }
        }
        callback?.();
      } catch {
        callback?.();
      }
    });

    socket.on("consultation:signal", async ({ appointmentId, to, data }, callback) => {
      try {
        const err = await authorizeAppointmentParticipant(appointmentId, userId);
        if (err) return callback?.({ error: err });
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return;
        // Only relay to the other participant of this appointment.
        const isCandidate = (appointment.candidate && appointment.candidate.equals(userId)) || (appointment.patient && appointment.patient.equals(userId));
        const otherId = isCandidate ? appointment.counselor : (appointment.candidate || appointment.patient);
        if (to && to !== otherId) return callback?.({ error: "Unauthorized" });
        const room = `consultation_${appointment._id}`;
        socket.to(room).emit("consultation:signal", {
          from: userId,
          data,
        });
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ error: error.message });
      }
    });

    /* ---------- Presence / disconnect ---------- */
    socket.on("disconnect", async () => {
      await User.findByIdAndUpdate(userId, { isOnline: false });
      io.emit("presence:changed", { userId, isOnline: false });
      console.log(`🔌 Socket disconnected: user ${userId}`);
    });
  });

  return io;
}
