import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, required: true, unique: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    candidateName: { type: String, default: "" },
    candidateEmail: { type: String, default: "" },
    candidatePhone: { type: String, default: "" },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true },
    patientPhone: { type: String, default: "" },
    counselor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    counselorName: { type: String, required: true },
    counselorEmail: { type: String, required: true },
    date: { type: Date, required: true },
    dateStr: { type: String, required: true },
    time: { type: String, required: true },
    activeSlotKey: { type: String, default: null },
    consultationType: { type: String, enum: ["online", "offline"], default: "online" },
    reason: { type: String, default: "" },
    additionalNotes: { type: String, default: "" },
    bookingTime: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "accepted", "confirmed", "rejected", "rescheduled", "cancelled", "completed", "no_show"],
      default: "pending",
    },
    rejectionReason: { type: String, default: "" },
    rescheduleHistory: {
      type: [
        {
          oldDate: Date,
          oldTime: String,
          newDate: Date,
          newTime: String,
          updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          reason: String,
          updatedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

appointmentSchema.pre("validate", function (next) {
  if (this.date && !this.dateStr) {
    this.dateStr = new Date(this.date).toISOString().split("T")[0];
  }
  if (this.candidate && !this.patient) {
    this.patient = this.candidate;
  }
  if (!this.candidate && this.patient) {
    this.candidate = this.patient;
  }
  if (this.candidateName && !this.patientName) {
    this.patientName = this.candidateName;
  } else if (this.patientName && !this.candidateName) {
    this.candidateName = this.patientName;
  }
  if (this.candidateEmail && !this.patientEmail) {
    this.patientEmail = this.candidateEmail;
  } else if (this.patientEmail && !this.candidateEmail) {
    this.candidateEmail = this.patientEmail;
  }
  if (this.candidatePhone && !this.patientPhone) {
    this.patientPhone = this.candidatePhone;
  } else if (this.patientPhone && !this.candidatePhone) {
    this.candidatePhone = this.patientPhone;
  }

  // Active appointments occupy the slot; cancelled / rejected release it
  const activeStatuses = ["pending", "accepted", "confirmed", "rescheduled"];
  if (activeStatuses.includes(this.status) && this.counselor && this.dateStr && this.time) {
    this.activeSlotKey = `${this.counselor.toString()}_${this.dateStr}_${this.time}`;
  } else {
    this.activeSlotKey = null;
  }

  next();
});

appointmentSchema.index({ candidate: 1, status: 1 });
appointmentSchema.index({ patient: 1, status: 1 });
appointmentSchema.index({ counselor: 1, status: 1 });
appointmentSchema.index({ counselor: 1, dateStr: 1, status: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index(
  { activeSlotKey: 1 },
  { unique: true, partialFilterExpression: { activeSlotKey: { $type: "string" } } }
);

export default mongoose.model("Appointment", appointmentSchema);
