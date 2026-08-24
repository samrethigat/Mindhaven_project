import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { sendEmail } from "../services/emailService.js";
import { createNotification } from "../services/notificationService.js";
import { layout, appointmentTable, actionButton } from "../services/emailTemplates.js";

function generateAppointmentId(counselorId, patientId) {
  const ts = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `APT-${counselorId.slice(0, 4)}-${patientId.slice(0, 4)}-${ts}${suffix}`.toUpperCase();
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(t) {
  const [h, m] = String(t).split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hh = hour % 12 === 0 ? 12 : hour % 12;
  return `${hh}:${m || "00"} ${ampm}`;
}

const frontendBase = () => process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * PATIENT books an appointment.
 * Saves appointment + notifies counselor & patient + emails both.
 * Email failure never breaks booking.
 */
export async function bookAppointment(req, res) {
  try {
    const userRole = req.user.role === "patient" ? "candidate" : req.user.role;
    if (userRole !== "candidate") {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    const { counselorId, date, time, consultationType, reason, additionalNotes } = req.body;

    if (!counselorId || !date || !time) {
      return res.status(400).json({ error: "counselorId, date and time are required" });
    }

    const counselor = await User.findById(counselorId);
    if (!counselor || counselor.role !== "counselor" || !counselor.isActive || counselor.isDeleted) {
      return res.status(400).json({ error: "Counselor not available" });
    }

    const targetDate = new Date(date);

    // Double booking prevention check for counselor slot
    const existingSlot = await Appointment.findOne({
      counselor: counselor._id,
      date: {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lte: new Date(targetDate.setHours(23, 59, 59, 999)),
      },
      time,
      status: { $in: ["pending", "accepted", "confirmed", "rescheduled"] },
    });

    if (existingSlot) {
      return res.status(400).json({ error: "This time slot is already booked. Please choose another slot." });
    }

    const candidate = req.user;
    const patient = candidate;
    const appointmentId = generateAppointmentId(counselorId, candidate._id.toString());

    const appointment = await Appointment.create({
      appointmentId,
      candidate: candidate._id,
      candidateName: candidate.fullName || candidate.email,
      candidateEmail: candidate.email,
      candidatePhone: candidate.phone || "",
      patient: candidate._id,
      patientName: candidate.fullName || candidate.email,
      patientEmail: candidate.email,
      patientPhone: candidate.phone || "",
      counselor: counselor._id,
      counselorName: counselor.fullName || counselor.email,
      counselorEmail: counselor.email,
      date: new Date(date),
      time,
      consultationType: consultationType || "online",
      reason: reason || "",
      additionalNotes: additionalNotes || "",
      bookingTime: new Date(),
      status: "pending",
    });

    const apptView = {
      patientName: appointment.patientName,
      patientId: appointment.appointmentId,
      patientEmail: appointment.patientEmail,
      patientPhone: appointment.patientPhone,
      appointmentId: appointment.appointmentId,
      date: fmtDate(appointment.date),
      time: fmtTime(appointment.time),
      consultationType: appointment.consultationType,
      reason: appointment.reason,
      additionalNotes: appointment.additionalNotes,
      bookingTime: fmtDate(appointment.bookingTime),
      status: "Pending",
    };

    const viewUrl = `${frontendBase()}/counselor/appointment-requests`;

    // 1. Email to counselor
    await sendEmail({
      recipientId: counselor._id,
      to: counselor.email,
      type: "new_appointment_request",
      subject: "New Appointment Request - Mental Health Support System",
      html: layout(
        "New Appointment Request",
        `<p>Hello Dr. ${appointment.counselorName},</p>
         <p>You have received a new appointment request.</p>
         ${appointmentTable(apptView)}
         <p>Please login to your Counselor Dashboard to <strong>Accept</strong>, <strong>Reject</strong>, or <strong>Reschedule</strong> this appointment.</p>
         ${actionButton(viewUrl, "View Appointment")}`
      ),
    });

    // 2. Email to patient
    await sendEmail({
      recipientId: patient._id,
      to: patient.email,
      type: "appointment_submitted",
      subject: "Appointment Request Submitted - Mental Health Support System",
      html: layout(
        "Appointment Request Submitted",
        `<p>Hello ${appointment.patientName},</p>
         <p>Your appointment request has been successfully submitted to Dr. ${appointment.counselorName}.</p>
         ${appointmentTable(apptView)}
         <p>You will receive another notification when the counselor accepts or rejects the appointment.</p>`
      ),
    });

    // 3. Counselor notification
    await createNotification({
      recipient: counselor._id,
      type: "new_appointment_request",
      title: "🔔 New Appointment Request",
      message: `${appointment.patientName} requested an appointment for ${fmtDate(appointment.date)} at ${fmtTime(appointment.time)}.`,
      relatedAppointment: appointment._id,
    });

    // 4. Patient notification
    await createNotification({
      recipient: patient._id,
      type: "appointment_submitted",
      title: "📅 Appointment Request Submitted",
      message: `Your appointment request with Dr. ${appointment.counselorName} has been submitted successfully. Status: Pending`,
      relatedAppointment: appointment._id,
    });

    res.status(201).json({ message: "Appointment booked successfully", appointment });
  } catch (error) {
    console.error("bookAppointment error:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function getCounselorAppointments(req, res) {
  try {
    const appointments = await Appointment.find({ counselor: req.user._id })
      .populate("patient", "fullName email phone gender age photo")
      .sort({ date: 1 });
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getPatientAppointments(req, res) {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate("counselor", "fullName email qualification specialization photo hospital")
      .sort({ date: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getCounselorDashboardStats(req, res) {
  try {
    const counselorId = req.user._id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [today, upcoming, pending, confirmed, completed, cancelled] = await Promise.all([
      Appointment.countDocuments({ counselor: counselorId, date: { $gte: todayStart, $lte: todayEnd } }),
      Appointment.countDocuments({ counselor: counselorId, date: { $gte: todayStart }, status: { $in: ["pending", "confirmed"] } }),
      Appointment.countDocuments({ counselor: counselorId, status: "pending" }),
      Appointment.countDocuments({ counselor: counselorId, status: "confirmed" }),
      Appointment.countDocuments({ counselor: counselorId, status: "completed" }),
      Appointment.countDocuments({ counselor: counselorId, status: "cancelled" }),
    ]);

    res.json({ today, upcoming, pending, confirmed, completed, cancelled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * COUNSELOR accepts an appointment -> confirmed + notify/email patient.
 */
export async function acceptAppointment(req, res) {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      counselor: req.user._id,
    });
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    appointment.status = "confirmed";
    await appointment.save();

    await sendEmail({
      recipientId: appointment.patient,
      to: appointment.patientEmail,
      type: "appointment_confirmed",
      subject: "Appointment Confirmed - Mental Health Support System",
      html: layout(
        "Appointment Confirmed",
        `<p>Hello ${appointment.patientName},</p>
         <p>Your appointment with Dr. ${appointment.counselorName} has been <strong>confirmed</strong>.</p>
         ${appointmentTable({
           ...appointment.toObject(),
           date: fmtDate(appointment.date),
           time: fmtTime(appointment.time),
           status: "Confirmed",
         })}
         ${actionButton(`${frontendBase()}/patient/appointments`, "View My Appointments")}`
      ),
    });

    await createNotification({
      recipient: appointment.patient,
      type: "appointment_confirmed",
      title: "✅ Appointment Confirmed",
      message: `Your appointment with Dr. ${appointment.counselorName} on ${fmtDate(appointment.date)} at ${fmtTime(appointment.time)} has been confirmed.`,
      relatedAppointment: appointment._id,
    });

    res.json({ message: "Appointment confirmed", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * COUNSELOR rejects an appointment -> rejected + notify/email patient.
 */
export async function rejectAppointment(req, res) {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      counselor: req.user._id,
    });
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    const rejectionReason = req.body.reason || "";
    appointment.status = "rejected";
    appointment.rejectionReason = rejectionReason;
    await appointment.save();

    await sendEmail({
      recipientId: appointment.patient,
      to: appointment.patientEmail,
      type: "appointment_rejected",
      subject: "Appointment Request Rejected",
      html: layout(
        "Appointment Request Rejected",
        `<p>Hello ${appointment.patientName},</p>
         <p>Unfortunately, your appointment with Dr. ${appointment.counselorName} was <strong>rejected</strong>.</p>
         ${appointmentTable({
           ...appointment.toObject(),
           date: fmtDate(appointment.date),
           time: fmtTime(appointment.time),
           status: "Rejected",
         })}
         <p>Rejection Reason: ${rejectionReason || "Not provided"}</p>`
      ),
    });

    await createNotification({
      recipient: appointment.patient,
      type: "appointment_rejected",
      title: "❌ Appointment Rejected",
      message: `Your appointment request with Dr. ${appointment.counselorName} was rejected.`,
      relatedAppointment: appointment._id,
    });

    res.json({ message: "Appointment rejected", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * COUNSELOR reschedules -> save history + notify/email patient.
 */
export async function rescheduleAppointment(req, res) {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      counselor: req.user._id,
    });
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    const { newDate, newTime, reason } = req.body;
    if (!newDate || !newTime) {
      return res.status(400).json({ error: "newDate and newTime are required" });
    }

    const oldDate = appointment.date;
    const oldTime = appointment.time;

    appointment.rescheduleHistory.push({
      oldDate,
      oldTime,
      newDate: new Date(newDate),
      newTime,
      updatedBy: req.user._id,
      reason: reason || "",
    });
    appointment.date = new Date(newDate);
    appointment.time = newTime;
    appointment.status = "rescheduled";
    appointment.reminderSent = false;
    await appointment.save();

    await sendEmail({
      recipientId: appointment.patient,
      to: appointment.patientEmail,
      type: "appointment_rescheduled",
      subject: "Appointment Rescheduled",
      html: layout(
        "Appointment Rescheduled",
        `<p>Hello ${appointment.patientName},</p>
         <p>Your appointment with Dr. ${appointment.counselorName} has been <strong>rescheduled</strong>.</p>
         <p>Old: ${fmtDate(oldDate)} at ${fmtTime(oldTime)}</p>
         <p>New: ${fmtDate(appointment.date)} at ${fmtTime(appointment.time)}</p>
         <p>Reason: ${reason || "Not provided"}</p>`
      ),
    });

    await createNotification({
      recipient: appointment.patient,
      type: "appointment_rescheduled",
      title: "🔄 Appointment Rescheduled",
      message: `Your appointment with Dr. ${appointment.counselorName} was rescheduled to ${fmtDate(appointment.date)} at ${fmtTime(appointment.time)}.`,
      relatedAppointment: appointment._id,
    });

    res.json({ message: "Appointment rescheduled", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function cancelAppointment(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    const isPatient = (appointment.patient && appointment.patient.equals(req.user._id)) || (appointment.candidate && appointment.candidate.equals(req.user._id));
    const isCounselor = appointment.counselor && appointment.counselor.equals(req.user._id);
    if (!isPatient && !isCounselor) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    appointment.status = "cancelled";
    await appointment.save();

    const otherId = isPatient ? appointment.counselor : (appointment.candidate || appointment.patient);
    await createNotification({
      recipient: otherId,
      type: "appointment_cancelled",
      title: "Appointment Cancelled",
      message: `Appointment ${appointment.appointmentId} on ${fmtDate(appointment.date)} was cancelled.`,
      relatedAppointment: appointment._id,
    });

    res.json({ message: "Appointment cancelled", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getAppointment(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    const isPatient = (appointment.patient && appointment.patient.equals(req.user._id)) || (appointment.candidate && appointment.candidate.equals(req.user._id));
    const isCounselor = appointment.counselor && appointment.counselor.equals(req.user._id);
    if (!isPatient && !isCounselor) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
