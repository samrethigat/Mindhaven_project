/**
 * Entertainment Controller for MindHaven
 * Handles Spotify Music, YouTube Videos, Regional Memes, Recommendations, and Language Preferences
 */

import User from "../models/User.js";
import { getRecommendedContent, searchMultilingualEntertainment } from "../services/entertainmentService.js";
import { searchSpotifyTracks, getSpotifyPlaylists, getSpotifyRecommendations } from "../services/spotifyService.js";
import { searchYouTubeVideos, getYouTubeRecommendations } from "../services/youtubeService.js";
import { fetchDynamicMemes, getMemeRecommendations } from "../services/memeService.js";
import { getLanguageConfig, ENTERTAINMENT_LANGUAGES } from "../config/languageMappings.js";

/**
 * GET /api/entertainment/recommendations
 * Unified recommendation endpoint based on user's preferred language or query parameter
 */
export async function getRecommendations(req, res) {
  try {
    const lang = req.query.language || req.user?.preferredLanguage || "ta";
    const data = await getRecommendedContent(req.user?._id, lang);
    res.json(data);
  } catch (err) {
    console.error("Entertainment recommendations error:", err.message);
    const langConfig = getLanguageConfig(req.query.language || "ta");
    res.status(500).json({
      error: "Failed to load entertainment recommendations",
      language: langConfig.code,
      music: { latest: [], trending: [], popular: [], playlists: [] },
      videos: { trending: [], comedy: [], mindfulness: [], latest: [] },
      memes: { trending: [], latest: [] },
    });
  }
}

/**
 * GET /api/entertainment/search
 * Universal search across music, video, memes
 */
export async function universalSearch(req, res) {
  try {
    const { q = "", language } = req.query;
    const lang = language || req.user?.preferredLanguage || "ta";
    const results = await searchMultilingualEntertainment({
      query: q,
      language: lang,
      limit: parseInt(req.query.limit) || 12,
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Search failed", tracks: [], videos: [], memes: [] });
  }
}

/**
 * GET /api/entertainment/music/search & GET /api/music/tracks
 */
export async function getMusicTracks(req, res) {
  try {
    const { query = "", search = "", category = "all", language, page = 1, limit = 20 } = req.query;
    const lang = language || req.user?.preferredLanguage || "ta";
    const data = await searchSpotifyTracks({
      query: query || search,
      category,
      language: lang,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch music tracks", tracks: [] });
  }
}

/**
 * GET /api/entertainment/music/trending & GET /api/music/trending
 */
export async function getMusicTrending(req, res) {
  try {
    const lang = req.query.language || req.user?.preferredLanguage || "ta";
    const data = await searchSpotifyTracks({
      category: "trending",
      language: lang,
      limit: parseInt(req.query.limit) || 12,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trending music", tracks: [] });
  }
}

/**
 * GET /api/entertainment/music/playlists & GET /api/music/playlists
 */
export async function getMusicPlaylists(req, res) {
  try {
    const lang = req.query.language || req.user?.preferredLanguage || "ta";
    const data = await getSpotifyPlaylists({
      language: lang,
      limit: parseInt(req.query.limit) || 8,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch playlists", playlists: [] });
  }
}

/**
 * GET /api/entertainment/videos/search & GET /api/video/list
 */
export async function getVideoList(req, res) {
  try {
    const { query = "", search = "", category = "all", language, page = 1, limit = 20 } = req.query;
    const lang = language || req.user?.preferredLanguage || "ta";
    const data = await searchYouTubeVideos({
      query: query || search,
      category,
      language: lang,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch videos", videos: [] });
  }
}

/**
 * GET /api/entertainment/videos/trending & GET /api/video/trending
 */
export async function getVideoTrending(req, res) {
  try {
    const lang = req.query.language || req.user?.preferredLanguage || "ta";
    const data = await searchYouTubeVideos({
      category: "trending",
      language: lang,
      limit: parseInt(req.query.limit) || 12,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trending videos", videos: [] });
  }
}

/**
 * GET /api/entertainment/memes/trending & GET /api/memes/list
 */
export async function getMemesList(req, res) {
  try {
    const { search = "", category = "all", language, page = 1, limit = 20 } = req.query;
    const lang = language || req.user?.preferredLanguage || "ta";
    const data = await fetchDynamicMemes({
      category,
      search,
      language: lang,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch memes", memes: [] });
  }
}

/**
 * GET /api/user/language
 */
export async function getUserLanguage(req, res) {
  try {
    const user = req.user ? await User.findById(req.user._id).select("preferredLanguage") : null;
    const langCode = user?.preferredLanguage || "ta";
    const langConfig = getLanguageConfig(langCode);
    res.json({
      language: langCode,
      languageName: langConfig.name,
      nativeName: langConfig.nativeName,
      flag: langConfig.flag,
      allLanguages: Object.values(ENTERTAINMENT_LANGUAGES).map((l) => ({
        code: l.code,
        name: l.name,
        nativeName: l.nativeName,
        flag: l.flag,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch language preference" });
  }
}

/**
 * PUT /api/user/language
 */
export async function updateUserLanguage(req, res) {
  try {
    const { language } = req.body;
    if (!language) {
      return res.status(400).json({ error: "Language is required" });
    }

    const clean = language.trim().toLowerCase();
    const langConfig = getLanguageConfig(clean);

    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, { preferredLanguage: clean });
    }

    res.json({
      message: "Language preference updated successfully",
      language: clean,
      languageName: langConfig.name,
      nativeName: langConfig.nativeName,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update language preference" });
  }
}
