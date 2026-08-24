import mongoose from "mongoose";

/**
 * Stores a patient's mental health assessment result securely.
 * Results are linked to the authenticated patient and are private.
 *
 * NOTE: this is a screening/support tool, NOT a medical diagnosis.
 */
const assessmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Domain scores as percentages (0-100)
    scores: { type: mongoose.Schema.Types.Mixed, default: {} },
    totalScore: { type: Number, default: 0 },
    wellbeingScore: { type: Number, default: 0 },
    risk: {
      type: String,
      enum: ["level_1", "level_2", "level_3"],
      default: "level_1",
    },
    suicidalFlag: { type: Boolean, default: false },
    // Raw answers map (questionId -> 0-4). Stored for the patient's own history.
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

assessmentSchema.index({ patient: 1, createdAt: -1 });

export default mongoose.model("Assessment", assessmentSchema);
