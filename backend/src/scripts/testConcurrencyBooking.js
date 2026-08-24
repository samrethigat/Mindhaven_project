import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import DoctorDailyBooking from "../models/DoctorDailyBooking.js";
import {
  reserveDoctorSlotAtomic,
  releaseDoctorSlotAtomic,
  getDoctorAvailabilityDetails,
  MAX_DAILY_LIMIT,
} from "../services/appointmentConcurrencyService.js";

async function runConcurrencyTests() {
  console.log("================================================================");
  console.log("🧪 STARTING DOCTOR APPOINTMENT CONCURRENCY & LIMIT TEST SUITE");
  console.log("================================================================\n");

  await connectDB();

  // Ensure unique indexes are built
  await Appointment.init();
  await DoctorDailyBooking.init();

  const testDateStr = "2026-08-25";

  // 1. Setup or find Test Doctor
  let counselor = await User.findOne({ email: "test-concurrency-doctor@mindhaven.test" });
  if (!counselor) {
    counselor = await User.create({
      fullName: "Dr. Concurrency Specialist",
      email: "test-concurrency-doctor@mindhaven.test",
      password: "TestPassword@123",
      role: "counselor",
      qualification: "M.D. Concurrency & Psychiatry",
      specialization: "Clinical Psychology",
      experience: 15,
      hospital: "General Testing Hospital",
      isActive: true,
      isDeleted: false,
      availability: {
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        timeSlots: ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
      },
    });
  }

  // 2. Setup Test Patients
  const patients = [];
  for (let i = 1; i <= 15; i++) {
    const email = `test-patient-${i}@mindhaven.test`;
    let p = await User.findOne({ email });
    if (!p) {
      p = await User.create({
        fullName: `Test Patient ${i}`,
        email,
        password: "TestPassword@123",
        role: "candidate",
        isActive: true,
      });
    }
    patients.push(p);
  }

  // Clean previous test data
  await Appointment.deleteMany({ counselor: counselor._id, dateStr: testDateStr });
  await DoctorDailyBooking.deleteMany({ counselor: counselor._id, dateStr: testDateStr });

  console.log(`✅ Test Counselor initialized: ${counselor.fullName} (${counselor._id})`);
  console.log(`✅ ${patients.length} Test Patients initialized.`);
  console.log(`✅ Cleaned test database for target date: ${testDateStr}\n`);

  // =========================================================================
  // TEST 1: 10 Simultaneous Requests for the EXACT SAME Time Slot (15:00)
  // =========================================================================
  console.log("----------------------------------------------------------------");
  console.log("📌 TEST 1: 10 Simultaneous Booking Requests for Same Slot (15:00)");
  console.log("----------------------------------------------------------------");

  const slotTime = "15:00";
  const test1Promises = patients.slice(0, 10).map(async (patient, idx) => {
    const appointmentObjectId = new mongoose.Types.ObjectId();
    const appointmentCustomId = `TEST-APT-1-${idx}-${Date.now()}`;

    // Concurrency-safe atomic reservation
    const reserveResult = await reserveDoctorSlotAtomic({
      counselorId: counselor._id,
      dateStr: testDateStr,
      time: slotTime,
      patientId: patient._id,
      appointmentObjectId,
      appointmentCustomId,
    });

    if (!reserveResult.ok) {
      return { success: false, patient: patient.fullName, error: reserveResult.error, reason: reserveResult.reason };
    }

    // If reservation succeeded, save appointment document
    try {
      const appt = await Appointment.create({
        _id: appointmentObjectId,
        appointmentId: appointmentCustomId,
        candidate: patient._id,
        patient: patient._id,
        counselor: counselor._id,
        counselorName: counselor.fullName,
        counselorEmail: counselor.email,
        patientName: patient.fullName,
        patientEmail: patient.email,
        date: new Date(`${testDateStr}T12:00:00.000Z`),
        dateStr: testDateStr,
        time: slotTime,
        activeSlotKey: `${counselor._id.toString()}_${testDateStr}_${slotTime}`,
        status: "pending",
      });
      return { success: true, patient: patient.fullName, appointmentId: appt.appointmentId };
    } catch (err) {
      await releaseDoctorSlotAtomic({
        counselorId: counselor._id,
        dateStr: testDateStr,
        time: slotTime,
        appointmentId: appointmentObjectId,
      });
      return { success: false, patient: patient.fullName, error: err.message };
    }
  });

  const test1Results = await Promise.all(test1Promises);
  const test1Successes = test1Results.filter((r) => r.success);
  const test1Failures = test1Results.filter((r) => !r.success);

  console.log(`Results: ${test1Successes.length} Succeeded, ${test1Failures.length} Failed`);
  test1Results.forEach((r, i) => {
    if (r.success) {
      console.log(`  🟢 Patient ${i + 1}: SUCCEEDED (Booking ID: ${r.appointmentId})`);
    } else {
      console.log(`  🔴 Patient ${i + 1}: REJECTED SAFELY (${r.error})`);
    }
  });

  const appointmentsInDb = await Appointment.find({
    counselor: counselor._id,
    dateStr: testDateStr,
    time: slotTime,
    status: "pending",
  });

  if (test1Successes.length === 1 && test1Failures.length === 9 && appointmentsInDb.length === 1) {
    console.log("✅ TEST 1 PASSED: Exactly 1 appointment created for 15:00 slot; all 9 duplicate attempts rejected!\n");
  } else {
    console.error("❌ TEST 1 FAILED: Unexpected appointment count or concurrency leak!\n");
    process.exit(1);
  }

  // =========================================================================
  // TEST 2: 10 Simultaneous Requests to Exceed Doctor Daily Limit of 5
  // =========================================================================
  console.log("----------------------------------------------------------------");
  console.log("📌 TEST 2: 10 Simultaneous Requests Attempting to Exceed Daily Limit (Max 5)");
  console.log("----------------------------------------------------------------");
  console.log(`Current doctor active appointments: ${appointmentsInDb.length}/5`);
  console.log("10 patients will now concurrently attempt to book 10 different available slots.");

  const differentSlots = ["09:00", "10:00", "11:00", "12:00", "14:00", "16:00", "17:00", "18:00", "09:00", "10:00"];

  const test2Promises = patients.slice(1, 11).map(async (patient, idx) => {
    const slot = differentSlots[idx];
    const appointmentObjectId = new mongoose.Types.ObjectId();
    const appointmentCustomId = `TEST-APT-2-${idx}-${Date.now()}`;

    const reserveResult = await reserveDoctorSlotAtomic({
      counselorId: counselor._id,
      dateStr: testDateStr,
      time: slot,
      patientId: patient._id,
      appointmentObjectId,
      appointmentCustomId,
    });

    if (!reserveResult.ok) {
      return { success: false, patient: patient.fullName, slot, error: reserveResult.error, reason: reserveResult.reason };
    }

    try {
      const appt = await Appointment.create({
        _id: appointmentObjectId,
        appointmentId: appointmentCustomId,
        candidate: patient._id,
        patient: patient._id,
        counselor: counselor._id,
        counselorName: counselor.fullName,
        counselorEmail: counselor.email,
        patientName: patient.fullName,
        patientEmail: patient.email,
        date: new Date(`${testDateStr}T12:00:00.000Z`),
        dateStr: testDateStr,
        time: slot,
        activeSlotKey: `${counselor._id.toString()}_${testDateStr}_${slot}`,
        status: "pending",
      });
      return { success: true, patient: patient.fullName, slot, appointmentId: appt.appointmentId };
    } catch (err) {
      await releaseDoctorSlotAtomic({
        counselorId: counselor._id,
        dateStr: testDateStr,
        time: slot,
        appointmentId: appointmentObjectId,
      });
      return { success: false, patient: patient.fullName, slot, error: err.message };
    }
  });

  const test2Results = await Promise.all(test2Promises);
  const test2Successes = test2Results.filter((r) => r.success);
  const test2Failures = test2Results.filter((r) => !r.success);

  console.log(`Results: ${test2Successes.length} Succeeded, ${test2Failures.length} Failed (Limit Reached)`);
  test2Results.forEach((r, i) => {
    if (r.success) {
      console.log(`  🟢 Patient ${i + 2} (${r.slot}): SUCCEEDED (Booking ID: ${r.appointmentId})`);
    } else {
      console.log(`  🔴 Patient ${i + 2} (${r.slot}): REJECTED SAFELY (${r.error})`);
    }
  });

  const totalActiveAppts = await Appointment.countDocuments({
    counselor: counselor._id,
    dateStr: testDateStr,
    status: { $in: ["pending", "accepted", "confirmed", "rescheduled"] },
  });

  const trackerDoc = await DoctorDailyBooking.findOne({ counselor: counselor._id, dateStr: testDateStr });
  console.log(`\n📊 Total Active Appointments in DB for ${testDateStr}: ${totalActiveAppts}`);
  console.log(`📊 Tracker activeCount: ${trackerDoc?.activeCount}/5`);

  if (totalActiveAppts === 5 && trackerDoc?.activeCount === 5) {
    console.log("✅ TEST 2 PASSED: Strict 5-daily-appointment limit enforced under concurrent load!\n");
  } else {
    console.error(`❌ TEST 2 FAILED: Expected exactly 5 appointments, got ${totalActiveAppts}!\n`);
    process.exit(1);
  }

  // =========================================================================
  // TEST 3: Availability Verification (Doctor Must Show Fully Booked)
  // =========================================================================
  console.log("----------------------------------------------------------------");
  console.log("📌 TEST 3: Doctor Availability Status Verification");
  console.log("----------------------------------------------------------------");

  const availability = await getDoctorAvailabilityDetails(counselor._id, testDateStr);
  console.log(`Doctor Status: ${availability.statusMessage}`);
  console.log(`isFullyBooked: ${availability.isFullyBooked}`);
  console.log(`Available Slots: ${availability.availableSlots.length} slots`);
  console.log(`Booked Slots: ${availability.bookedSlots.join(", ")}`);

  if (availability.isFullyBooked && availability.availableSlots.length === 0 && availability.activeCount === 5) {
    console.log("✅ TEST 3 PASSED: Doctor dynamically marked as Fully Booked with 0 available slots.\n");
  } else {
    console.error("❌ TEST 3 FAILED: Availability state does not reflect fully booked status!\n");
    process.exit(1);
  }

  // =========================================================================
  // TEST 4: Cancellation & Slot Re-opening
  // =========================================================================
  console.log("----------------------------------------------------------------");
  console.log("📌 TEST 4: Appointment Cancellation and Slot Release");
  console.log("----------------------------------------------------------------");

  const apptToCancel = await Appointment.findOne({ counselor: counselor._id, dateStr: testDateStr, time: "15:00" });
  console.log(`Cancelling appointment for 15:00 (ID: ${apptToCancel.appointmentId})...`);

  apptToCancel.status = "cancelled";
  apptToCancel.activeSlotKey = null;
  await apptToCancel.save();

  await releaseDoctorSlotAtomic({
    counselorId: counselor._id,
    dateStr: testDateStr,
    time: "15:00",
    appointmentId: apptToCancel._id,
  });

  const availAfterCancel = await getDoctorAvailabilityDetails(counselor._id, testDateStr);
  console.log(`Capacity after cancellation: ${availAfterCancel.activeCount}/5 (isFullyBooked: ${availAfterCancel.isFullyBooked})`);
  console.log(`Is 15:00 slot free again? ${availAfterCancel.availableSlots.includes("15:00") ? "YES 🟢" : "NO 🔴"}`);

  if (availAfterCancel.activeCount === 4 && !availAfterCancel.isFullyBooked && availAfterCancel.availableSlots.includes("15:00")) {
    console.log("✅ TEST 4 PASSED: Cancellation immediately freed the slot and reduced daily count to 4.\n");
  } else {
    console.error("❌ TEST 4 FAILED: Slot or capacity was not freed on cancellation!\n");
    process.exit(1);
  }

  // =========================================================================
  // TEST 5: Booking the Freed Slot Back to 5
  // =========================================================================
  console.log("----------------------------------------------------------------");
  console.log("📌 TEST 5: Booking Freed Slot by New Patient");
  console.log("----------------------------------------------------------------");

  const newPatient = patients[14];
  const newApptObjectId = new mongoose.Types.ObjectId();
  const newApptCustomId = `TEST-APT-5-FREED-${Date.now()}`;

  const rebookResult = await reserveDoctorSlotAtomic({
    counselorId: counselor._id,
    dateStr: testDateStr,
    time: "15:00",
    patientId: newPatient._id,
    appointmentObjectId: newApptObjectId,
    appointmentCustomId: newApptCustomId,
  });

  if (rebookResult.ok) {
    await Appointment.create({
      _id: newApptObjectId,
      appointmentId: newApptCustomId,
      candidate: newPatient._id,
      patient: newPatient._id,
      counselor: counselor._id,
      counselorName: counselor.fullName,
      counselorEmail: counselor.email,
      patientName: newPatient.fullName,
      patientEmail: newPatient.email,
      date: new Date(`${testDateStr}T12:00:00.000Z`),
      dateStr: testDateStr,
      time: "15:00",
      activeSlotKey: `${counselor._id.toString()}_${testDateStr}_15:00`,
      status: "pending",
    });
    console.log(`✅ Successfully re-booked 15:00 slot for ${newPatient.fullName} (Booking ID: ${newApptCustomId})`);
  } else {
    console.error(`❌ TEST 5 FAILED: Could not rebook freed slot: ${rebookResult.error}`);
    process.exit(1);
  }

  const finalAvail = await getDoctorAvailabilityDetails(counselor._id, testDateStr);
  if (finalAvail.activeCount === 5 && finalAvail.isFullyBooked) {
    console.log("✅ TEST 5 PASSED: Doctor reached 5 appointments again and is Fully Booked.\n");
  } else {
    console.error("❌ TEST 5 FAILED: Doctor capacity incorrect after rebooking!\n");
    process.exit(1);
  }

  // =========================================================================
  // TEST 6: Next Day Availability (Independent Daily Quota)
  // =========================================================================
  console.log("----------------------------------------------------------------");
  console.log("📌 TEST 6: Doctor Availability on Next Day (2026-08-26)");
  console.log("----------------------------------------------------------------");

  const nextDayStr = "2026-08-26";
  const nextDayAvail = await getDoctorAvailabilityDetails(counselor._id, nextDayStr);
  console.log(`Next day (${nextDayStr}) activeCount: ${nextDayAvail.activeCount}/5`);
  console.log(`Next day isFullyBooked: ${nextDayAvail.isFullyBooked}`);
  console.log(`Next day availableSlots: ${nextDayAvail.availableSlots.length} slots available`);

  if (nextDayAvail.activeCount === 0 && !nextDayAvail.isFullyBooked && nextDayAvail.availableSlots.length > 0) {
    console.log("✅ TEST 6 PASSED: Doctor has fresh full capacity on next day (per-doctor per-day limit works independently).\n");
  } else {
    console.error("❌ TEST 6 FAILED: Next day capacity was affected by previous day!\n");
    process.exit(1);
  }

  // Cleanup test records
  await Appointment.deleteMany({ counselor: counselor._id });
  await DoctorDailyBooking.deleteMany({ counselor: counselor._id });
  await User.deleteMany({ email: { $regex: /test-.*@mindhaven\.test/ } });

  console.log("================================================================");
  console.log("🎉 ALL CONCURRENCY & DAILY LIMIT TESTS PASSED SUCCESSFULLY! (6/6)");
  console.log("================================================================\n");

  process.exit(0);
}

runConcurrencyTests().catch((err) => {
  console.error("❌ Test suite encountered an unhandled error:", err);
  process.exit(1);
});
