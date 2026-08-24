import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  getVideos,
  getVideoRecommendations,
  recordVideoHistory,
  getVideoHistory,
  toggleVideoFavorite,
  getVideoFavorites,
} from "../controllers/videoController.js";

const router = Router();

router.use(protect);

router.get("/list", getVideos);
router.get("/recommendations", getVideoRecommendations);
router.post("/history", recordVideoHistory);
router.get("/history", getVideoHistory);
router.post("/favorites", toggleVideoFavorite);
router.get("/favorites", getVideoFavorites);

export default router;
