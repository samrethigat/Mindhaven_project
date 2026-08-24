import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { sendEmail } from "../services/emailService.js";
import { createNotification } from "../services/notificationService.js";
import { layout, appointmentTable, actionButton } from "../services/emailTemplates.js";
import { getIO } from "../socket/index.js";
import {
  MAX_DAILY_LIMIT,
  DEFAULT_TIME_SLOTS,
  normalizeDateStr,
  parseLocalDateStr,
  isDoctorWorkingDay,
  reserveDoctorSlotAtomic,
  releaseDoctorSlotAtomic,
  getDoctorAvailabilityDetails,
} from "../services/appointmentConcurrencyService.js";

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
 * PATIENT / CANDIDATE books an appointment.
 * Executes full 12-step validation pipeline with strict database-level concurrency protection
 * and atomic enforcement of the 5-daily-appointment limit per doctor.
 */
export async function bookAppointment(req, res) {
  try {
    // 1. Validate patient authentication & role
    const userRole = req.user.role === "patient" ? "candidate" : req.user.role;
    if (userRole !== "candidate") {
      return res.status(403).json({ error: "Unauthorized Access" });
    }

    const { counselorId, date, time, consultationType, reason, additionalNotes } = req.body;

    // 2. Validate input fields
    if (!counselorId || !date || !time) {
      return res.status(400).json({ error: "counselorId, date and time are required" });
    }

    // 3. Validate doctor existence and status
    const counselor = await User.findById(counselorId);
    if (!counselor || counselor.role !== "counselor" || !counselor.isActive || counselor.isDeleted) {
      return res.status(404).json({ error: "Counselor not found or unavailable" });
    }

    // 4. Validate appointment date (parse and normalize)
    const dateStr = parseLocalDateStr(date) || normalizeDateStr(date);
    if (!dateStr || dateStr.length !== 10) {
      return res.status(400).json({ error: "Invalid appointment date format (YYYY-MM-DD required)" });
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (dateStr < todayStr) {
      return res.status(400).json({ error: "Cannot book appointments in the past" });
    }

    const [year, month, dayNum] = dateStr.split("-").map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, dayNum, 12, 0, 0));

    // 5. Check doctor's working schedule (day of week)
    const configuredDays = counselor.availability?.days || [];
    if (!isDoctorWorkingDay(configuredDays, dateStr)) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayOfWeek = dayNames[new Date(year, month - 1, dayNum).getDay()];
      return res.status(400).json({ error: `Doctor is not available for appointments on ${dayOfWeek}` });
    }

    // 6. Check doctor's working time slots
    const allowedSlots =
      Array.isArray(counselor.availability?.timeSlots) && counselor.availability.timeSlots.length > 0
        ? counselor.availability.timeSlots
        : DEFAULT_TIME_SLOTS;

    if (!allowedSlots.includes(time)) {
      return res.status(400).json({ error: "Selected time slot is not offered by this doctor" });
    }

    // 7. Generate identifiers
    const candidate = req.user;
    const patient = candidate;
    const appointmentObjectId = new mongoose.Types.ObjectId();
    const appointmentCustomId = generateAppointmentId(counselorId, candidate._id.toString());

    // 8. Atomic Concurrency-Safe Slot & Daily Capacity Reservation
    // Atomic check: activeCount < 5 AND slot time not booked.
    const reserveResult = await reserveDoctorSlotAtomic({
      counselorId: counselor._id,
      dateStr,
      time,
      patientId: candidate._id,
      appointmentObjectId,
      appointmentCustomId,
    });

    if (!reserveResult.ok) {
      return res.status(reserveResult.code || 409).json({
        error: reserveResult.error,
        reason: reserveResult.reason,
      });
    }

    // 9. Create the appointment record atomically in MongoDB
    let appointment;
    try {
      appointment = await Appointment.create({
        _id: appointmentObjectId,
        appointmentId: appointmentCustomId,
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
        date: targetDate,
        dateStr,
        time,
        activeSlotKey: `${counselor._id.toString()}_${dateStr}_${time}`,
        consultationType: consultationType || "online",
        reason: reason || "",
        additionalNotes: additionalNotes || "",
        bookingTime: new Date(),
        status: "pending",
      });
    } catch (createErr) {
      // Revert the atomic tracker reservation if appointment document creation failed
      await releaseDoctorSlotAtomic({
        counselorId: counselor._id,
        dateStr,
        time,
        appointmentId: appointmentObjectId,
      });

      if (createErr.code === 11000) {
        return res.status(409).json({
          error: "This slot was just booked by another patient. Please select another available time.",
          reason: "SLOT_OCCUPIED",
        });
      }
      throw createErr;
    }

    // 10. Real-Time Socket.IO Broadcast to all connected clients & rooms
    const io = getIO();
    if (io) {
      io.emit("appointment:availability-changed", {
        counselorId: counselor._id.toString(),
        dateStr,
        time,
      });
      io.to(`user_${counselor._id.toString()}`).emit("appointment:new", appointment);
    }

    // 11. Async Notifications and Emails (failures never block booking)
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

    sendEmail({
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
    }).catch((err) => console.error("Counselor email error:", err.message));

    sendEmail({
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
    }).catch((err) => console.error("Patient email error:", err.message));

    createNotification({
      recipient: counselor._id,
      type: "new_appointment_request",
      title: "🔔 New Appointment Request",
      message: `${appointment.patientName} requested an appointment for ${fmtDate(appointment.date)} at ${fmtTime(appointment.time)}.`,
      relatedAppointment: appointment._id,
    }).catch(() => {});

    createNotification({
      recipient: patient._id,
      type: "appointment_submitted",
      title: "📅 Appointment Request Submitted",
      message: `Your appointment request with Dr. ${appointment.counselorName} has been submitted successfully. Status: Pending`,
      relatedAppointment: appointment._id,
    }).catch(() => {});

    // 12. Return Success Response
    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.error("bookAppointment error:", error);
    return res.status(500).json({ error: error.message || "An unexpected error occurred while booking" });
  }
}

/**
 * GET real-time doctor availability and time slot status for a specific date.
 */
export async function getDoctorSlotAvailability(req, res) {
  try {
    const counselorId = req.params.id || req.query.counselorId;
    const dateInput = req.query.date;

    if (!counselorId) {
      return res.status(400).json({ error: "counselorId is required" });
    }
    if (!dateInput) {
      return res.status(400).json({ error: "date query parameter (YYYY-MM-DD) is required" });
    }

    const dateStr = parseLocalDateStr(dateInput) || normalizeDateStr(dateInput);
    if (!dateStr || dateStr.length !== 10) {
      return res.status(400).json({ error: "Invalid date format (expected YYYY-MM-DD)" });
    }

    const availability = await getDoctorAvailabilityDetails(counselorId, dateStr);
    if (availability.notFound) {
      return res.status(404).json({ error: availability.error });
    }

    return res.json(availability);
  } catch (error) {
    console.error("getDoctorSlotAvailability error:", error);
    return res.status(500).json({ error: error.message });
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
    const todayStr = new Date().toISOString().split("T")[0];

    const [today, upcoming, pending, confirmed, completed, cancelled] = await Promise.all([
      Appointment.countDocuments({
        counselor: counselorId,
        dateStr: todayStr,
        status: { $in: ["pending", "accepted", "confirmed", "rescheduled"] },
      }),
      Appointment.countDocuments({
        counselor: counselorId,
        dateStr: { $gte: todayStr },
        status: { $in: ["pending", "accepted", "confirmed", "rescheduled"] },
      }),
      Appointment.countDocuments({ counselor: counselorId, status: "pending" }),
      Appointment.countDocuments({ counselor: counselorId, status: { $in: ["accepted", "confirmed"] } }),
      Appointment.countDocuments({ counselor: counselorId, status: "completed" }),
      Appointment.countDocuments({ counselor: counselorId, status: "cancelled" }),
    ]);

    res.json({ today, upcoming, pending, confirmed, completed, cancelled, maxDailyLimit: MAX_DAILY_LIMIT });
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
    appointment.activeSlotKey = `${appointment.counselor.toString()}_${appointment.dateStr}_${appointment.time}`;
    await appointment.save();

    const io = getIO();
    if (io) {
      io.emit("appointment:availability-changed", {
        counselorId: appointment.counselor.toString(),
        dateStr: appointment.dateStr,
        time: appointment.time,
      });
      io.to(`user_${appointment.patient.toString()}`).emit("appointment:updated", appointment);
    }

    sendEmail({
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
         ${actionButton(`${frontendBase()}/candidate/appointments`, "View My Appointments")}`
      ),
    }).catch(() => {});

    createNotification({
      recipient: appointment.patient,
      type: "appointment_confirmed",
      title: "✅ Appointment Confirmed",
      message: `Your appointment with Dr. ${appointment.counselorName} on ${fmtDate(appointment.date)} at ${fmtTime(appointment.time)} has been confirmed.`,
      relatedAppointment: appointment._id,
    }).catch(() => {});

    res.json({ message: "Appointment confirmed", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * COUNSELOR rejects an appointment -> rejected + release slot & capacity + notify/email patient.
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
    appointment.activeSlotKey = null;
    await appointment.save();

    // Atomically release slot & daily capacity
    await releaseDoctorSlotAtomic({
      counselorId: appointment.counselor,
      dateStr: appointment.dateStr,
      time: appointment.time,
      appointmentId: appointment._id,
    });

    const io = getIO();
    if (io) {
      io.emit("appointment:availability-changed", {
        counselorId: appointment.counselor.toString(),
        dateStr: appointment.dateStr,
        time: appointment.time,
      });
      io.to(`user_${appointment.patient.toString()}`).emit("appointment:updated", appointment);
    }

    sendEmail({
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
    }).catch(() => {});

    createNotification({
      recipient: appointment.patient,
      type: "appointment_rejected",
      title: "❌ Appointment Rejected",
      message: `Your appointment request with Dr. ${appointment.counselorName} was rejected.`,
      relatedAppointment: appointment._id,
    }).catch(() => {});

    res.json({ message: "Appointment rejected", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * COUNSELOR reschedules -> atomic check on new date & slot, release old slot, save history + notify/email patient.
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

    const newDateStr = parseLocalDateStr(newDate) || normalizeDateStr(newDate);
    if (!newDateStr) {
      return res.status(400).json({ error: "Invalid newDate format" });
    }

    const [year, month, dayNum] = newDateStr.split("-").map(Number);
    const newTargetDate = new Date(Date.UTC(year, month - 1, dayNum, 12, 0, 0));

    // Reserve new slot atomically
    const reserveResult = await reserveDoctorSlotAtomic({
      counselorId: appointment.counselor,
      dateStr: newDateStr,
      time: newTime,
      patientId: appointment.patient,
      appointmentObjectId: appointment._id,
      appointmentCustomId: appointment.appointmentId,
    });

    if (!reserveResult.ok) {
      return res.status(reserveResult.code || 409).json({
        error: reserveResult.error,
        reason: reserveResult.reason,
      });
    }

    // Release old slot atomically
    const oldDateStr = appointment.dateStr;
    const oldTime = appointment.time;
    await releaseDoctorSlotAtomic({
      counselorId: appointment.counselor,
      dateStr: oldDateStr,
      time: oldTime,
      appointmentId: appointment._id,
    });

    const oldDate = appointment.date;

    appointment.rescheduleHistory.push({
      oldDate,
      oldTime,
      newDate: newTargetDate,
      newTime,
      updatedBy: req.user._id,
      reason: reason || "",
    });

    appointment.date = newTargetDate;
    appointment.dateStr = newDateStr;
    appointment.time = newTime;
    appointment.activeSlotKey = `${appointment.counselor.toString()}_${newDateStr}_${newTime}`;
    appointment.status = "rescheduled";
    appointment.reminderSent = false;
    await appointment.save();

    const io = getIO();
    if (io) {
      io.emit("appointment:availability-changed", {
        counselorId: appointment.counselor.toString(),
        dateStr: oldDateStr,
      });
      io.emit("appointment:availability-changed", {
        counselorId: appointment.counselor.toString(),
        dateStr: newDateStr,
      });
      io.to(`user_${appointment.patient.toString()}`).emit("appointment:updated", appointment);
    }

    sendEmail({
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
    }).catch(() => {});

    createNotification({
      recipient: appointment.patient,
      type: "appointment_rescheduled",
      title: "🔄 Appointment Rescheduled",
      message: `Your appointment with Dr. ${appointment.counselorName} was rescheduled to ${fmtDate(appointment.date)} at ${fmtTime(appointment.time)}.`,
      relatedAppointment: appointment._id,
    }).catch(() => {});

    res.json({ message: "Appointment rescheduled successfully", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * PATIENT or COUNSELOR cancels appointment -> cancelled + release slot & capacity.
 */
export async function cancelAppointment(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    const isPatient =
      (appointment.patient && appointment.patient.equals(req.user._id)) ||
      (appointment.candidate && appointment.candidate.equals(req.user._id));
    const isCounselor = appointment.counselor && appointment.counselor.equals(req.user._id);

    if (!isPatient && !isCounselor) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }

    appointment.status = "cancelled";
    appointment.activeSlotKey = null;
    await appointment.save();

    // Atomically release slot & daily capacity
    await releaseDoctorSlotAtomic({
      counselorId: appointment.counselor,
      dateStr: appointment.dateStr,
      time: appointment.time,
      appointmentId: appointment._id,
    });

    const io = getIO();
    if (io) {
      io.emit("appointment:availability-changed", {
        counselorId: appointment.counselor.toString(),
        dateStr: appointment.dateStr,
        time: appointment.time,
      });
      io.to(`user_${appointment.patient.toString()}`).emit("appointment:updated", appointment);
      io.to(`user_${appointment.counselor.toString()}`).emit("appointment:updated", appointment);
    }

    const otherId = isPatient ? appointment.counselor : appointment.candidate || appointment.patient;
    createNotification({
      recipient: otherId,
      type: "appointment_cancelled",
      title: "Appointment Cancelled",
      message: `Appointment ${appointment.appointmentId} on ${fmtDate(appointment.date)} was cancelled.`,
      relatedAppointment: appointment._id,
    }).catch(() => {});

    res.json({ message: "Appointment cancelled successfully", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getAppointment(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    const isPatient =
      (appointment.patient && appointment.patient.equals(req.user._id)) ||
      (appointment.candidate && appointment.candidate.equals(req.user._id));
    const isCounselor = appointment.counselor && appointment.counselor.equals(req.user._id);
    if (!isPatient && !isCounselor) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
