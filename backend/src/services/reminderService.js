import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { sendEmail } from "./emailService.js";
import { createNotification } from "./notificationService.js";
import { layout, appointmentTable } from "./emailTemplates.js";

export function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(t) {
  const [h, m] = String(t).split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hh = hour % 12 === 0 ? 12 : hour % 12;
  return `${hh}:${m || "00"} ${ampm}`;
}

/**
 * Runs daily. Finds confirmed appointments within the next 24-25h that have not
 * been reminded, emails both patient and counselor, creates in-app notifications.
 */
export async function sendAppointmentReminders() {
  const now = new Date();
  const to = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  const from = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcoming = await Appointment.find({
    status: { $in: ["confirmed", "rescheduled"] },
    reminderSent: false,
    date: { $gte: from, $lte: to },
  });

  let count = 0;
  for (const appt of upcoming) {
    const patient = await User.findById(appt.patient);
    const counselor = await User.findById(appt.counselor);
    if (!patient || !counselor) continue;

    const tableBody = appointmentTable({
      patientName: appt.patientName,
      patientEmail: appt.patientEmail,
      appointmentId: appt.appointmentId,
      date: fmtDate(appt.date),
      time: fmtTime(appt.time),
      consultationType: appt.consultationType,
      reason: appt.reason,
      status: appt.status,
    });

    await sendEmail({
      recipientId: patient._id,
      to: patient.email,
      type: "appointment_reminder",
      subject: "Appointment Reminder - Mental Health Support System",
      html: layout("Appointment Reminder", `<p>Hello ${appt.patientName},</p><p>This is a reminder for your upcoming appointment.</p>${tableBody}`),
    });

    await sendEmail({
      recipientId: counselor._id,
      to: counselor.email,
      type: "appointment_reminder",
      subject: "Appointment Reminder - Mental Health Support System",
      html: layout("Appointment Reminder", `<p>Hello Dr. ${appt.counselorName},</p><p>This is a reminder for your upcoming appointment.</p>${tableBody}`),
    });

    await createNotification({
      recipient: appt.patient,
      type: "appointment_reminder",
      title: "⏰ Appointment Reminder",
      message: `Reminder: Your appointment with Dr. ${appt.counselorName} is on ${fmtDate(appt.date)} at ${fmtTime(appt.time)}.`,
      relatedAppointment: appt._id,
    });

    await createNotification({
      recipient: appt.counselor,
      type: "appointment_reminder",
      title: "⏰ Appointment Reminder",
      message: `Reminder: You have an appointment with ${appt.patientName} on ${fmtDate(appt.date)} at ${fmtTime(appt.time)}.`,
      relatedAppointment: appt._id,
    });

    appt.reminderSent = true;
    await appt.save();
    count++;
  }

  console.log(`Reminder job: processed ${count} reminders.`);
  return count;
}

// Run every 6 hours
export function startReminderJob() {
  sendAppointmentReminders().catch((e) => console.error("Reminder job error:", e.message));
  setInterval(() => {
    sendAppointmentReminders().catch((e) => console.error("Reminder job error:", e.message));
  }, 6 * 60 * 60 * 1000);
}
