import mongoose from "mongoose";

const mediaHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mediaType: {
      type: String,
      enum: ["music", "video"],
      required: true,
    },
    mediaId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    artist: {
      type: String,
      default: "",
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    playedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

mediaHistorySchema.index({ user: 1, mediaType: 1, playedAt: -1 });

export default mongoose.model("MediaHistory", mediaHistorySchema);
