import mongoose from "mongoose";

/**
 * Stores Level 1 / Level 2 support interactions for a patient.
 * Records emotional check-ins, the detected level, which activity was used,
 * and the user's reported mood after the activity.
 */
const supportInteractionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["checkin", "activity", "mood"],
      required: true,
    },
    // For checkin: the detected level
    level: {
      type: String,
      enum: ["level_1", "level_2", "level_3", "none"],
      default: "none",
    },
    // For checkin: the user's raw check-in text / selected option
    checkInText: { type: String, default: "" },
    // For checkin: the classifier's emotion label
    emotion: { type: String, default: "" },
    // For activity: which activity was used
    activity: {
      type: String,
      enum: ["music", "meme", "joke", "story", "breathing", "meditation"],
      default: null,
    },
    // For mood: whether mood improved
    moodImproved: { type: Boolean, default: null },
    // Optional counselor reference (for level_2 booking intent)
    counselorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // Free-form notes
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

supportInteractionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("SupportInteraction", supportInteractionSchema);
