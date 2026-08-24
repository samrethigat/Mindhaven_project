import mongoose from "mongoose";

const mediaFavoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mediaType: {
      type: String,
      enum: ["music", "video", "meme"],
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
  },
  { timestamps: true }
);

mediaFavoriteSchema.index({ user: 1, mediaType: 1, mediaId: 1 }, { unique: true });

export default mongoose.model("MediaFavorite", mediaFavoriteSchema);
