import { Router } from "express";
import { protect } from "../middleware/auth.js";
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

router.use(protect);

router.get("/list", getVideos);
router.get("/recommendations", getVideoRecommendations);
router.post("/history", recordVideoHistory);
router.get("/history", getVideoHistory);
router.delete("/history", clearVideoHistory);
router.delete("/history/:id", deleteVideoHistoryItem);
router.post("/favorites", toggleVideoFavorite);
router.get("/favorites", getVideoFavorites);

export default router;
