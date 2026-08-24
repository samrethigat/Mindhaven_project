import mongoose from "mongoose";

const aiMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    action: {
      type: {
        type: String, // e.g. "PLAY_MUSIC", "SEARCH_VIDEO", "SHOW_MEMES", "CHANGE_THEME", "USER_PROFILE", "NAVIGATE"
        default: null,
      },
      payload: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },
    language: {
      type: String,
      default: "ta", // "ta", "tanglish", "en"
    },
  },
  { timestamps: true }
);

aiMessageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model("AiMessage", aiMessageSchema);
