import { Router } from "express";
import { protect, optionalAuth } from "../middleware/auth.js";
import {
  getTracks,
  getArtists,
  getArtistDetails,
  getRecommendations,
  recordMusicHistory,
  getMusicHistory,
  clearMusicHistory,
  deleteMusicHistoryItem,
  toggleFavorite,
  getFavorites,
  getPlaylists,
  createPlaylist,
  addTrackToPlaylist,
} from "../controllers/musicController.js";

const router = Router();

// Public / optional auth catalogue routes
router.get("/tracks", optionalAuth, getTracks);
router.get("/artists", optionalAuth, getArtists);
router.get("/artists/:id", optionalAuth, getArtistDetails);
router.get("/recommendations", optionalAuth, getRecommendations);
router.get("/playlists", optionalAuth, getPlaylists);

// Protected user-specific history and playlist actions
router.post("/history", protect, recordMusicHistory);
router.get("/history", protect, getMusicHistory);
router.delete("/history", protect, clearMusicHistory);
router.delete("/history/:id", protect, deleteMusicHistoryItem);
router.post("/favorites", protect, toggleFavorite);
router.get("/favorites", protect, getFavorites);
router.post("/playlists", protect, createPlaylist);
router.post("/playlists/:id/add", protect, addTrackToPlaylist);

export default router;
