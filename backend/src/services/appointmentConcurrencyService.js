import mongoose from "mongoose";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import DoctorDailyBooking from "../models/DoctorDailyBooking.js";

export const MAX_DAILY_LIMIT = 5;
export const ACTIVE_APPOINTMENT_STATUSES = ["pending", "accepted", "confirmed", "rescheduled"];
export const DEFAULT_TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

const DAY_NAMES_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Normalize any valid date representation (Date, ISO string, "YYYY-MM-DD") to "YYYY-MM-DD".
 */
export function normalizeDateStr(input) {
  if (!input) return "";
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    return input.trim();
  }
  const d = new Date(input);
  if (isNaN(d.getTime())) return "";
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format local date string if input represents a local date picker value.
 */
export function parseLocalDateStr(input) {
  if (!input) return "";
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  }
  const d = new Date(input);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Checks if doctor is working on the target date according to configured availability days.
 * Handles full names ("Monday"), short names ("Mon"), and case-insensitivity.
 * If doctor hasn't configured days, defaults to working (available all standard days).
 */
export function isDoctorWorkingDay(configuredDays, dateStr) {
  if (!Array.isArray(configuredDays) || configuredDays.length === 0) {
    return true; // No restriction configured -> all days available
  }
  const [year, month, day] = dateStr.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day);
  const dayIndex = targetDate.getDay();
  const longName = DAY_NAMES_LONG[dayIndex].toLowerCase();
  const shortName = DAY_NAMES_SHORT[dayIndex].toLowerCase();

  return configuredDays.some((d) => {
    const clean = String(d).trim().toLowerCase();
    return clean === longName || clean === shortName || clean.startsWith(shortName);
  });
}

/**
 * Reconciles the DoctorDailyBooking document directly from the Appointment source of truth.
 */
export async function reconcileDoctorDailyBooking(counselorId, dateStr) {
  const activeAppointments = await Appointment.find({
    counselor: counselorId,
    dateStr: dateStr,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
  }).select("time _id appointmentId patient status");

  const bookedSlots = activeAppointments.map((a) => ({
    time: a.time,
    appointment: a._id,
    appointmentId: a.appointmentId,
    patient: a.patient,
    status: a.status,
    bookedAt: new Date(),
  }));

  const activeCount = Math.min(bookedSlots.length, MAX_DAILY_LIMIT);

  const tracker = await DoctorDailyBooking.findOneAndUpdate(
    { counselor: counselorId, dateStr: dateStr },
    {
      $set: {
        activeCount: activeCount,
        maxLimit: MAX_DAILY_LIMIT,
        bookedSlots: bookedSlots,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return tracker;
}

/**
 * Concurrency-Safe Atomic Slot Reservation.
 * Guarantees that activeCount < 5 and slot is not occupied in a single atomic database operation.
 */
export async function reserveDoctorSlotAtomic({
  counselorId,
  dateStr,
  time,
  patientId,
  appointmentObjectId,
  appointmentCustomId,
}) {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 1. Attempt atomic increment and slot reservation
      const updatedTracker = await DoctorDailyBooking.findOneAndUpdate(
        {
          counselor: counselorId,
          dateStr: dateStr,
          activeCount: { $lt: MAX_DAILY_LIMIT },
          "bookedSlots.time": { $ne: time },
        },
        {
          $inc: { activeCount: 1 },
          $push: {
            bookedSlots: {
              time: time,
              appointment: appointmentObjectId,
              appointmentId: appointmentCustomId,
              patient: patientId,
              status: "pending",
              bookedAt: new Date(),
            },
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      if (updatedTracker) {
        return { ok: true, tracker: updatedTracker };
      }

      // 2. If update returned null, check why the atomic query condition failed
      const existing = await DoctorDailyBooking.findOne({ counselor: counselorId, dateStr: dateStr });
      if (existing) {
        if (existing.activeCount >= MAX_DAILY_LIMIT) {
          return {
            ok: false,
            code: 409,
            reason: "DAILY_LIMIT_REACHED",
            error: "Doctor is fully booked for this date. Please select another doctor or date.",
          };
        }
        if (existing.bookedSlots && existing.bookedSlots.some((s) => s.time === time)) {
          return {
            ok: false,
            code: 409,
            reason: "SLOT_OCCUPIED",
            error: "This slot was just booked by another patient. Please select another available time.",
          };
        }
      }

      // If document wasn't found or was out-of-sync, reconcile and retry
      await reconcileDoctorDailyBooking(counselorId, dateStr);
    } catch (err) {
      if (err.code === 11000) {
        // Upsert race condition; retry with existing document
        if (attempt === maxRetries) {
          return {
            ok: false,
            code: 409,
            reason: "CONCURRENCY_COLLISION",
            error: "This slot was just booked by another patient. Please select another available time.",
          };
        }
        continue;
      }
      throw err;
    }
  }

  return {
    ok: false,
    code: 409,
    reason: "BOOKING_FAILED",
    error: "Doctor is fully booked for this date or the slot is occupied.",
  };
}

/**
 * Concurrency-Safe Atomic Slot Release on Appointment Cancellation / Rejection.
 */
export async function releaseDoctorSlotAtomic({ counselorId, dateStr, time, appointmentId }) {
  try {
    const updated = await DoctorDailyBooking.findOneAndUpdate(
      {
        counselor: counselorId,
        dateStr: dateStr,
      },
      {
        $inc: { activeCount: -1 },
        $pull: {
          bookedSlots: {
            $or: [{ time: time }, { appointment: appointmentId }, { appointmentId: appointmentId }],
          },
        },
      },
      { new: true }
    );

    // Prevent negative activeCount if any skew occurred
    if (updated && updated.activeCount < 0) {
      await DoctorDailyBooking.updateOne(
        { _id: updated._id },
        { $set: { activeCount: Math.max(0, updated.bookedSlots.length) } }
      );
    }

    return updated;
  } catch (err) {
    console.error("releaseDoctorSlotAtomic error:", err);
    // Fallback: reconcile to ensure state matches Appointment collection
    return reconcileDoctorDailyBooking(counselorId, dateStr).catch(() => null);
  }
}

/**
 * Returns complete real-time slot availability, active count, and schedule details for a doctor on a specific date.
 */
export async function getDoctorAvailabilityDetails(counselorId, dateStr) {
  const counselor = await User.findOne({
    _id: counselorId,
    role: "counselor",
    isActive: true,
    isDeleted: false,
  });

  if (!counselor) {
    return { error: "Counselor not found or unavailable", notFound: true };
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day);
  const dayIndex = targetDate.getDay();
  const dayOfWeek = DAY_NAMES_LONG[dayIndex];

  const configuredDays = counselor.availability?.days || [];
  const isWorkingDay = isDoctorWorkingDay(configuredDays, dateStr);

  const configuredSlots =
    Array.isArray(counselor.availability?.timeSlots) && counselor.availability.timeSlots.length > 0
      ? counselor.availability.timeSlots
      : DEFAULT_TIME_SLOTS;

  // Query actual active appointments from database (source of truth)
  const activeAppointments = await Appointment.find({
    counselor: counselor._id,
    dateStr: dateStr,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
  }).select("time status appointmentId");

  const bookedSlots = activeAppointments.map((a) => a.time);
  const activeCount = activeAppointments.length;
  const isFullyBooked = activeCount >= MAX_DAILY_LIMIT;

  let availableSlots = [];
  if (isWorkingDay && !isFullyBooked) {
    availableSlots = configuredSlots.filter((slot) => !bookedSlots.includes(slot));
  }

  let statusMessage = "Available";
  if (!isWorkingDay) {
    statusMessage = `Doctor is not scheduled on ${dayOfWeek}`;
  } else if (isFullyBooked) {
    statusMessage = "Fully Booked (5/5 daily limit reached)";
  } else if (activeCount > 0) {
    statusMessage = `Available (${activeCount}/5 appointments booked)`;
  }

  return {
    counselorId: counselor._id.toString(),
    counselorName: counselor.fullName || counselor.email,
    date: dateStr,
    dayOfWeek,
    isWorkingDay,
    activeCount,
    maxDailyLimit: MAX_DAILY_LIMIT,
    isFullyBooked,
    isAvailable: isWorkingDay && !isFullyBooked && availableSlots.length > 0,
    allSlots: configuredSlots,
    bookedSlots,
    availableSlots,
    statusMessage,
  };
}
