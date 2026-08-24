import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import { sendEmail } from "../services/emailService.js";
import { createNotification } from "../services/notificationService.js";
import { layout, appointmentTable } from "../services/emailTemplates.js";
import {
  isDoctorWorkingDay,
  parseLocalDateStr,
  normalizeDateStr,
} from "../services/appointmentConcurrencyService.js";

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

export async function getMyProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateMyProfile(req, res) {
  try {
    const allowed = [
      "qualification", "experience", "hospital", "clinic", "phone", "licenseNumber",
      "languages", "district", "city", "state", "address", "specialization",
      "consultationFee", "photo", "fullName",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ message: "Profile updated", user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateAvailability(req, res) {
  try {
    const { days, timeSlots } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { availability: { days: days || [], timeSlots: timeSlots || [] } },
      { new: true }
    );
    res.json({ message: "Availability updated", user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function toggleOnlineStatus(req, res) {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isOnline: !req.user.isOnline },
      { new: true }
    );
    res.json({ isOnline: user.isOnline });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getMyPatients(req, res) {
  try {
    const appointments = await Appointment.find({ counselor: req.user._id })
      .populate("patient", "fullName email phone gender age photo college department year")
      .populate("candidate", "fullName email phone gender age photo college department year")
      .sort({ createdAt: -1 });
    const map = new Map();
    for (const a of appointments) {
      const p = a.candidate || a.patient;
      if (p && !map.has(p._id.toString())) {
        map.set(p._id.toString(), p);
      }
    }
    const list = Array.from(map.values());
    res.json({ patients: list, candidates: list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getPatientDetail(req, res) {
  try {
    const hasAppointment = await Appointment.exists({
      counselor: req.user._id,
      $or: [
        { patient: req.params.patientId },
        { candidate: req.params.patientId },
      ],
    });
    if (!hasAppointment) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    const patient = await User.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    const history = await Appointment.find({
      counselor: req.user._id,
      $or: [
        { patient: patient._id },
        { candidate: patient._id },
      ],
    }).sort({ date: 1 });
    res.json({ patient: patient.toPublicJSON(), candidate: patient.toPublicJSON(), history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password required" });
    }
    const user = await User.findById(req.user._id).select("+password");
    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(400).json({ error: "Current password is incorrect" });
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * COUNSELOR deletes own account.
 * Requires current password + "DELETE" confirmation.
 * Marks deleted, cancels future appointments, notifies affected patients,
 * sends cancellation emails, clears availability, disables login.
 */
export async function deleteMyAccount(req, res) {
  try {
    const { password, confirmation } = req.body;
    if (confirmation !== "DELETE") {
      return res.status(400).json({ error: "Please type DELETE to confirm" });
    }
    const user = await User.findById(req.user._id).select("+password");
    const ok = await user.comparePassword(password || "");
    if (!ok) return res.status(400).json({ error: "Incorrect password" });

    // Mark as deleted/inactive
    user.isDeleted = true;
    user.isActive = false;
    user.isOnline = false;
    user.availability = { days: [], timeSlots: [] };
    user.refreshToken = null;
    await user.save();

    // Cancel future appointments
    const futureAppointments = await Appointment.find({
      counselor: user._id,
      date: { $gte: new Date() },
      status: { $in: ["pending", "confirmed", "rescheduled"] },
    });

    for (const appt of futureAppointments) {
      appt.status = "cancelled";
      await appt.save();

      await createNotification({
        recipient: appt.patient,
        type: "appointment_cancelled",
        title: "Your counselor is no longer available",
        message: `Your counselor is no longer available. Your appointment ${appt.appointmentId} (${fmtDate(appt.date)} at ${fmtTime(appt.time)}) has been cancelled. Please choose another counselor.`,
        relatedAppointment: appt._id,
      });

      await sendEmail({
        recipientId: appt.patient,
        to: appt.patientEmail,
        type: "counselor_deleted",
        subject: "Your counselor is no longer available",
        html: layout(
          "Appointment Cancelled",
          `<p>Hello ${appt.patientName},</p>
           <p>Your counselor is no longer available.</p>
           <p>Your appointment has been cancelled. Please choose another counselor.</p>
           ${appointmentTable({
             ...appt.toObject(),
             date: fmtDate(appt.date),
             time: fmtTime(appt.time),
             status: "Cancelled",
           })}`
        ),
      });
    }

    res.json({ message: "Your account has been permanently deactivated." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function getAvailableCounselors(req, res) {
  try {
    const { lat, lng, city, state, consultationType, specialization, date } = req.query;
    const targetDateStr = (date && (parseLocalDateStr(date) || normalizeDateStr(date))) || new Date().toISOString().split("T")[0];

    const filter = {
      role: "counselor",
      isActive: true,
      isDeleted: false,
      isVerifiedCounselor: { $ne: false },
    };

    if (consultationType && consultationType !== "all") {
      filter.$or = [{ consultationType: consultationType }, { consultationType: "both" }];
    }
    if (specialization && specialization !== "all") {
      filter.specialization = new RegExp(specialization, "i");
    }
    if (city) {
      filter.$or = filter.$or || [];
      filter.$or.push({ city: new RegExp(city, "i") }, { district: new RegExp(city, "i") });
    }
    if (state) {
      filter.state = new RegExp(state, "i");
    }

    const counselors = await User.find(filter).select(
      "fullName email phone qualification specialization experience hospital clinic photo rating consultationFee consultationType about isOnline languages district city state country location availability memberSince"
    );

    const counselorIds = counselors.map((c) => c._id);

    // Aggregate active appointments count for targetDateStr
    const activeCounts = await Appointment.aggregate([
      {
        $match: {
          counselor: { $in: counselorIds },
          dateStr: targetDateStr,
          status: { $in: ["pending", "accepted", "confirmed", "rescheduled"] },
        },
      },
      {
        $group: {
          _id: "$counselor",
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map();
    activeCounts.forEach((item) => {
      countMap.set(item._id.toString(), item.count);
    });

    let results = counselors.map((c) => {
      const obj = c.toObject();
      delete obj.password;
      delete obj.refreshToken;
      delete obj.resetPasswordToken;

      const activeCount = countMap.get(c._id.toString()) || 0;
      const configuredDays = c.availability?.days || [];
      const isWorkingDay = isDoctorWorkingDay(configuredDays, targetDateStr);
      const isFullyBooked = activeCount >= 5;

      obj.dateEvaluated = targetDateStr;
      obj.activeAppointmentsCount = activeCount;
      obj.maxDailyLimit = 5;
      obj.isWorkingDay = isWorkingDay;
      obj.isFullyBooked = isFullyBooked;
      obj.availableSlotsLeft = Math.max(0, 5 - activeCount);
      obj.isAvailableForBooking = isWorkingDay && !isFullyBooked;

      if (lat && lng && c.location && Array.isArray(c.location.coordinates) && (c.location.coordinates[0] !== 0 || c.location.coordinates[1] !== 0)) {
        const cLng = c.location.coordinates[0];
        const cLat = c.location.coordinates[1];
        obj.distanceKm = haversineDistance(parseFloat(lat), parseFloat(lng), cLat, cLng);
      } else {
        obj.distanceKm = null;
      }
      return obj;
    });

    if (lat && lng) {
      results.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    res.json({ counselors: results, targetDate: targetDateStr, maxDailyLimit: 5 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getCounselorPublic(req, res) {
  try {
    const counselor = await User.findOne({ role: "counselor", _id: req.params.id, isDeleted: false });
    if (!counselor) return res.status(404).json({ error: "Counselor not found" });
    const userObj = counselor.toPublicJSON();
    userObj.maxDailyLimit = 5;
    res.json({ counselor: userObj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getMyCandidates = getMyPatients;
export const getCandidateDetail = getPatientDetail;

