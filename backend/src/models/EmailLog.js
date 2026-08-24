import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    type: { type: String, default: "" },
    subject: { type: String, default: "" },
    sentAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["sent", "failed", "queued"],
      default: "queued",
    },
    attempts: { type: Number, default: 0 },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("EmailLog", emailLogSchema);
