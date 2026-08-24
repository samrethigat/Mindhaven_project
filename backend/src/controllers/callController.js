import CallLog from "../models/CallLog.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";

/**
 * Initiate a call. Returns the phone number only to the two matched users.
 */
export async function startCall(req, res) {
  try {
    const { appointmentId } = req.body;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    const isPatient = (appointment.patient && appointment.patient.equals(req.user._id)) || (appointment.candidate && appointment.candidate.equals(req.user._id));
    const isCounselor = appointment.counselor && appointment.counselor.equals(req.user._id);
    if (!isPatient && !isCounselor) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }

    const receiverId = isPatient ? appointment.counselor : (appointment.candidate || appointment.patient);
    const receiver = await User.findById(receiverId);
    if (!receiver?.phone) {
      return res.status(400).json({ error: "The other party has no phone number registered." });
    }

    const callLog = await CallLog.create({
      caller: req.user._id,
      receiver: receiverId,
      appointment: appointment._id,
      status: "initiated",
    });

    await createNotification({
      recipient: receiverId,
      type: "call_notification",
      title: "📞 Call Initiated",
      message: `${req.user.fullName || req.user.email} is calling you for appointment ${appointment.appointmentId}.`,
      relatedAppointment: appointment._id,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`user_${receiverId}`).emit("call:incoming", {
        callLogId: callLog._id,
        callerName: req.user.fullName || req.user.email,
        appointmentId: appointment.appointmentId,
      });
    }

    res.json({
      callLog,
      tel: receiver.phone,
      receiverName: receiver.fullName || receiver.email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function endCall(req, res) {
  try {
    const callLog = await CallLog.findById(req.params.id);
    if (!callLog) return res.status(404).json({ error: "Call log not found" });
    callLog.endTime = new Date();
    callLog.duration = Math.max(0, Math.round((callLog.endTime - callLog.startTime) / 1000));
    callLog.status = "completed";
    await callLog.save();
    res.json({ callLog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getMyCallLogs(req, res) {
  try {
    const logs = await CallLog.find({ $or: [{ caller: req.user._id }, { receiver: req.user._id }] })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getMyPhone(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    const isPatient = (appointment.patient && appointment.patient.equals(req.user._id)) || (appointment.candidate && appointment.candidate.equals(req.user._id));
    const isCounselor = appointment.counselor && appointment.counselor.equals(req.user._id);
    if (!isPatient && !isCounselor) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    const otherId = isPatient ? appointment.counselor : (appointment.candidate || appointment.patient);
    const other = await User.findById(otherId);
    if (!other?.phone) return res.status(400).json({ error: "No phone number available" });
    res.json({ phone: other.phone });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
