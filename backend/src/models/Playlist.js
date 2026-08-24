import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    songs: [
      {
        id: String,
        title: String,
        artist: String,
        category: String,
        audioUrl: String,
        duration: String,
        coverUrl: String,
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

playlistSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Playlist", playlistSchema);
