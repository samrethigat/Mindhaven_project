import Appointment from "../models/Appointment.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { sendEmail } from "../services/emailService.js";
import { createNotification } from "../services/notificationService.js";
import { layout, actionButton } from "../services/emailTemplates.js";

const frontendBase = () => process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Only users who share an appointment can chat.
 */
async function getSharedAppointment(userId, otherId) {
  return Appointment.findOne({
    $or: [
      { patient: userId, counselor: otherId, status: { $nin: ["cancelled", "rejected"] } },
      { candidate: userId, counselor: otherId, status: { $nin: ["cancelled", "rejected"] } },
      { counselor: userId, patient: otherId, status: { $nin: ["cancelled", "rejected"] } },
      { counselor: userId, candidate: otherId, status: { $nin: ["cancelled", "rejected"] } },
    ],
  });
}

export async function getMyConversations(req, res) {
  try {
    const appointments = await Appointment.find({
      $or: [
        { patient: req.user._id, status: { $nin: ["cancelled", "rejected"] } },
        { candidate: req.user._id, status: { $nin: ["cancelled", "rejected"] } },
        { counselor: req.user._id, status: { $nin: ["cancelled", "rejected"] } },
      ],
    })
      .populate("patient", "fullName photo isOnline email")
      .populate("candidate", "fullName photo isOnline email")
      .populate("counselor", "fullName photo isOnline email")
      .sort({ updatedAt: -1 });

    const conversations = [];
    const seenAppts = new Set();

    for (const appt of appointments) {
      if (seenAppts.has(appt._id.toString())) continue;
      seenAppts.add(appt._id.toString());

      const candUser = appt.candidate || appt.patient;
      if (!candUser || !appt.counselor) continue;

      const isCounselor = req.user.role === "counselor";
      const otherId = isCounselor ? candUser._id.toString() : appt.counselor._id.toString();
      const other = isCounselor ? candUser : appt.counselor;

      const lastMessage = await Message.findOne({ appointment: appt._id }).sort({ createdAt: -1 });
      const unreadCount = await Message.countDocuments({
        appointment: appt._id,
        receiver: req.user._id,
        readBy: { $nin: [req.user._id.toString()] },
      });

      conversations.push({
        appointment: appt._id,
        appointmentId: appt.appointmentId,
        otherId,
        otherName: other.fullName || other.email,
        otherPhoto: other.photo || "",
        otherRole: other.role || (isCounselor ? "candidate" : "counselor"),
        status: appt.status,
        lastMessage: lastMessage?.content || "",
        lastMessageAt: lastMessage?.createdAt || appt.updatedAt,
        unreadCount,
      });
    }
    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getMessages(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    const isPatient = (appointment.patient && appointment.patient.equals(req.user._id)) || (appointment.candidate && appointment.candidate.equals(req.user._id));
    const isCounselor = appointment.counselor && appointment.counselor.equals(req.user._id);
    if (!isPatient && !isCounselor) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }

    const messages = await Message.find({ appointment: appointment._id })
      .sort({ createdAt: 1 })
      .limit(200);
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Send a text/emoji message via REST (image/pdf/voice use upload endpoint then socket).
 */
export async function sendMessage(req, res) {
  try {
    const { appointmentId, content, type } = req.body;
    const msgType = type || "text";
    if (!content) return res.status(400).json({ error: "Content required" });

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    const isPatient = (appointment.patient && appointment.patient.equals(req.user._id)) || (appointment.candidate && appointment.candidate.equals(req.user._id));
    const isCounselor = appointment.counselor && appointment.counselor.equals(req.user._id);
    if (!isPatient && !isCounselor) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    if (appointment.status === "cancelled" || appointment.status === "rejected") {
      return res.status(400).json({ error: "Cannot chat on a cancelled/rejected appointment" });
    }

    const receiverId = isPatient ? appointment.counselor : (appointment.candidate || appointment.patient);
    const receiver = await User.findById(receiverId);

    const message = await Message.create({
      appointment: appointment._id,
      sender: req.user._id,
      receiver: receiverId,
      type: msgType,
      content,
    });

    // Real-time emit if socket available
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${receiverId}`).emit("message:new", message);
      io.to(`user_${req.user._id}`).emit("message:sent", message);
    }

    // Notify receiver
    await createNotification({
      recipient: receiverId,
      type: "new_message",
      title: req.user.role === "counselor" ? "New Message from Counselor" : "New Message from Student",
      message: content.slice(0, 120),
      relatedAppointment: appointment._id,
      relatedChat: message._id,
    });

    // Email only when receiver is offline (not on socket)
    const ioAll = req.app.get("io");
    const receiverSockets = ioAll ? ioAll.sockets.adapter?.rooms?.get(`user_${receiverId}`) : undefined;
    const receiverOnlineAndInRoom = receiverSockets && receiverSockets.size > 0;

    if (!receiverOnlineAndInRoom) {
      const senderName = req.user.role === "counselor"
        ? (req.user.fullName || req.user.email)
        : (appointment.candidateName || appointment.patientName);
      await sendEmail({
        recipientId: receiverId,
        to: receiver?.email,
        type: "new_message",
        subject: req.user.role === "counselor"
          ? "New Message from Counselor - Mental Health Support System"
          : "New Message from Student - Mental Health Support System",
        html: layout(
          "New Message",
          `<p>Hello ${receiver?.fullName || receiver?.email},</p>
           <p>${senderName}: ${content.slice(0, 200)}</p>
           ${actionButton(`${frontendBase()}/${req.user.role === "counselor" ? "candidate" : "counselor"}/chats`, "View Chat")}`
        ),
      });
    }

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getConversationWithUser(req, res) {
  try {
    const appointment = await getSharedAppointment(req.user._id, req.params.otherId);
    if (!appointment) {
      return res.status(403).json({ error: "No active appointment with this user to chat with." });
    }
    const messages = await Message.find({ appointment: appointment._id }).sort({ createdAt: 1 });
    res.json({ appointment, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
