import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "புதிய உரையாடல்", // "New Conversation" in Tamil
      trim: true,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    summary: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ user: 1, lastMessageAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
