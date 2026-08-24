import mongoose from "mongoose";

/**
 * DoctorDailyBooking Schema
 * Tracks the daily active appointment count and reserved time slots for each doctor per date.
 * Serves as an atomic concurrency guard to ensure a doctor NEVER exceeds the maximum daily limit
 * (default: 5 valid appointments per day) and never has two active bookings for the same time slot.
 */
const doctorDailyBookingSchema = new mongoose.Schema(
  {
    counselor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dateStr: {
      type: String, // Normalized "YYYY-MM-DD"
      required: true,
      index: true,
    },
    activeCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    maxLimit: {
      type: Number,
      default: 5,
    },
    bookedSlots: [
      {
        time: { type: String, required: true },
        appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
        appointmentId: { type: String },
        patient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, default: "pending" },
        bookedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Enforce unique tracker per doctor + date combination
doctorDailyBookingSchema.index({ counselor: 1, dateStr: 1 }, { unique: true });

export default mongoose.model("DoctorDailyBooking", doctorDailyBookingSchema);
