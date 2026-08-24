import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["text", "emoji", "image", "pdf", "voice"],
      default: "text",
    },
    content: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    readBy: { type: [String], default: [] },
  },
  { timestamps: true }
);

messageSchema.index({ appointment: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
