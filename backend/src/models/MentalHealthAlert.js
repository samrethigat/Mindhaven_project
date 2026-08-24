import mongoose from "mongoose";

const mentalHealthAlertSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    level: {
      type: String,
      enum: ["LOW", "MODERATE", "HIGH", "CRITICAL"],
      required: true,
      default: "MODERATE",
    },
    alertType: {
      type: String,
      enum: ["sentiment_drop", "distress_signal", "crisis_detected", "prolonged_sadness", "emotional_fatigue"],
      default: "distress_signal",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      default: "Possible emotional distress detected. Professional support may be recommended.",
    },
    recommendedAction: {
      type: String,
      default: "Check in with the student with supportive words and consider connecting with their campus counselor.",
    },
    parentNotified: {
      type: Boolean,
      default: false,
    },
    counselorNotified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "acknowledged", "resolved"],
      default: "active",
    },
    detectedAt: {
      type: Date,
      default: Date.now,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

mentalHealthAlertSchema.index({ student: 1, detectedAt: -1 });

export default mongoose.model("MentalHealthAlert", mentalHealthAlertSchema);
