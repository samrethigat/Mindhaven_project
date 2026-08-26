import { Router } from "express";
import { protect, optionalAuth } from "../middleware/auth.js";
import {
  getVideos,
  getVideoRecommendations,
  recordVideoHistory,
  getVideoHistory,
  clearVideoHistory,
  deleteVideoHistoryItem,
  toggleVideoFavorite,
  getVideoFavorites,
} from "../controllers/videoController.js";

const router = Router();

// Public / optional auth catalogue routes
router.get("/", optionalAuth, getVideos);
router.get("/list", optionalAuth, getVideos);
router.get("/recommendations", optionalAuth, getVideoRecommendations);

// Protected user history and favorites
router.post("/history", protect, recordVideoHistory);
router.get("/history", protect, getVideoHistory);
router.delete("/history", protect, clearVideoHistory);
router.delete("/history/:id", protect, deleteVideoHistoryItem);
router.post("/favorites", protect, toggleVideoFavorite);
router.get("/favorites", protect, getVideoFavorites);

export default router;
