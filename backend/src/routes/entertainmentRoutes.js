/**
 * Entertainment & Multilingual Media Routes
 */

import { Router } from "express";
import {
  getRecommendations,
  universalSearch,
  getMusicTracks,
  getMusicTrending,
  getMusicPlaylists,
  getVideoList,
  getVideoTrending,
  getMemesList,
  getUserLanguage,
  updateUserLanguage,
} from "../controllers/entertainmentController.js";
import { optionalAuth, protect } from "../middleware/auth.js";

const router = Router();

// Recommendation & Universal Search (optional auth so public demos & authenticated users work)
router.get("/recommendations", optionalAuth, getRecommendations);
router.get("/search", optionalAuth, universalSearch);

// Music routes
router.get("/music/search", optionalAuth, getMusicTracks);
router.get("/music/tracks", optionalAuth, getMusicTracks);
router.get("/music/trending", optionalAuth, getMusicTrending);
router.get("/music/playlists", optionalAuth, getMusicPlaylists);

// Video routes
router.get("/videos/search", optionalAuth, getVideoList);
router.get("/videos/trending", optionalAuth, getVideoTrending);
router.get("/videos/list", optionalAuth, getVideoList);
router.get("/video/list", optionalAuth, getVideoList);
router.get("/video/trending", optionalAuth, getVideoTrending);

// Meme routes
router.get("/memes/trending", optionalAuth, getMemesList);
router.get("/memes/list", optionalAuth, getMemesList);
router.get("/memes/search", optionalAuth, getMemesList);

// User Language Preference routes
router.get("/user/language", optionalAuth, getUserLanguage);
router.put("/user/language", optionalAuth, updateUserLanguage);

export default router;
