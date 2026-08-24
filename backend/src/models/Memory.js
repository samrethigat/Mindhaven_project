import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["identity", "music", "interest", "language", "general", "preference"],
      default: "general",
    },
    source: {
      type: String,
      enum: ["auto_extracted", "user_specified", "profile"],
      default: "auto_extracted",
    },
  },
  { timestamps: true }
);

memorySchema.index({ user: 1, key: 1 });

export default mongoose.model("Memory", memorySchema);
