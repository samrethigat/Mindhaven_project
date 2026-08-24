import { ALL_MUSIC_TRACKS, POPULAR_ARTISTS } from "./musicController.js";
import { ALL_VIDEOS } from "./videoController.js";
import { ALL_MEMES } from "./memeController.js";
import Conversation from "../models/Conversation.js";
import AiMessage from "../models/AiMessage.js";
import MediaFavorite from "../models/MediaFavorite.js";

/**
 * GET /api/search/global?q=...
 */
export async function handleGlobalSearch(req, res) {
  try {
    const query = String(req.query.q || "").toLowerCase().trim();
    if (!query) {
      return res.json({
        tracks: [],
        artists: [],
        videos: [],
        memes: [],
        conversations: [],
      });
    }

    // 1. Filter Artists
    const artists = POPULAR_ARTISTS.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        (a.genre && a.genre.toLowerCase().includes(query))
    ).slice(0, 5);

    // 2. Filter Music Tracks
    const tracks = ALL_MUSIC_TRACKS.filter((t) => {
      const tagsStr = Array.isArray(t.tags) ? t.tags.join(" ") : String(t.tags || "");
      return (
        t.title.toLowerCase().includes(query) ||
        t.artist.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        tagsStr.toLowerCase().includes(query)
      );
    }).slice(0, 10);

    // 3. Filter Videos
    const videos = ALL_VIDEOS.filter((v) => {
      const tagsStr = Array.isArray(v.tags) ? v.tags.join(" ") : String(v.tags || "");
      return (
        v.title.toLowerCase().includes(query) ||
        v.speaker.toLowerCase().includes(query) ||
        v.category.toLowerCase().includes(query) ||
        tagsStr.toLowerCase().includes(query)
      );
    }).slice(0, 10);

    // 4. Filter Memes
    const memes = ALL_MEMES.filter((m) => {
      const tagsStr = Array.isArray(m.tags) ? m.tags.join(" ") : String(m.tags || "");
      return (
        m.title.toLowerCase().includes(query) ||
        m.caption.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query) ||
        tagsStr.toLowerCase().includes(query)
      );
    }).slice(0, 10);

    // 5. Filter User Conversations
    const matchingMessages = await AiMessage.find({
      user: req.user._id,
      content: { $regex: query, $options: "i" },
    }).distinct("conversation");

    const conversations = await Conversation.find({
      user: req.user._id,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { _id: { $in: matchingMessages } },
      ],
    })
      .sort({ lastMessageAt: -1 })
      .limit(6);

    // 6. Enrich tracks and videos with user's favorite status
    const favorites = await MediaFavorite.find({ user: req.user._id });
    const favMusic = new Set(favorites.filter((f) => f.mediaType === "music").map((f) => f.mediaId));
    const favVideo = new Set(favorites.filter((f) => f.mediaType === "video").map((f) => f.mediaId));
    const favMeme = new Set(favorites.filter((f) => f.mediaType === "meme").map((f) => f.mediaId));

    res.json({
      query,
      artists,
      tracks: tracks.map((t) => ({ ...t, isFavorite: favMusic.has(t.id) })),
      videos: videos.map((v) => ({ ...v, isFavorite: favVideo.has(v.id) })),
      memes: memes.map((m) => ({ ...m, isLiked: favMeme.has(m.id) })),
      conversations,
    });
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({ error: error.message });
  }
}
