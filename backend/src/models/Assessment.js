import mongoose from "mongoose";

/**
 * Stores a student's Psychology & Mindset Assessment record securely.
 * Linked to the authenticated student and private to their account.
 *
 * NOTE: This is a well-being and mindset screening tool, NOT a medical diagnosis.
 */
const assessmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Also keep 'patient' field populated for backwards compatibility with any existing queries
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Raw answers map: { "q1": 1..5, ..., "q40": 1..5 }
    answers: { type: mongoose.Schema.Types.Mixed, required: true },

    // Category breakdown
    categoryScores: {
      emotional: {
        score: { type: Number, required: true },
        percentage: { type: Number, required: true },
        level: { type: String, required: true },
      },
      academic: {
        score: { type: Number, required: true },
        percentage: { type: Number, required: true },
        level: { type: String, required: true },
      },
      selfConfidence: {
        score: { type: Number, required: true },
        percentage: { type: Number, required: true },
        level: { type: String, required: true },
      },
      social: {
        score: { type: Number, required: true },
        percentage: { type: Number, required: true },
        level: { type: String, required: true },
      },
      coping: {
        score: { type: Number, required: true },
        percentage: { type: Number, required: true },
        level: { type: String, required: true },
      },
    },

    // Overall metrics
    overallScore: { type: Number, required: true }, // Range: 40 - 200
    overallPercentage: { type: Number, required: true }, // Range: 0 - 100%

    // Mindset Profile & Insights
    mindsetProfile: { type: String, required: true },
    summary: { type: String, default: "" },
    strengths: [{ type: String }],
    areasToFocus: [{ type: String }],
    recommendations: [{ type: String }],

    // Strongest & Weakest categories
    strongestCategory: { type: String },
    weakestCategory: { type: String },

    // Indicators summary map
    indicators: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Legacy fields for backward compatibility
    scores: { type: mongoose.Schema.Types.Mixed, default: {} },
    totalScore: { type: Number, default: 0 },
    wellbeingScore: { type: Number, default: 0 },
    risk: { type: String, default: "level_1" },
    suicidalFlag: { type: Boolean, default: false },

    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

assessmentSchema.index({ student: 1, createdAt: -1 });
assessmentSchema.index({ patient: 1, createdAt: -1 });

// Ensure patient field is synced with student field
assessmentSchema.pre("save", function (next) {
  if (this.student && !this.patient) {
    this.patient = this.student;
  }
  next();
});

export default mongoose.model("Assessment", assessmentSchema);
