import { Router } from "express";
import { protect, optionalAuth } from "../middleware/auth.js";
import {
  getMemes,
  toggleMemeLike,
  getFavoriteMemes,
} from "../controllers/memeController.js";

const router = Router();

router.get("/", optionalAuth, getMemes);
router.get("/list", optionalAuth, getMemes);
router.post("/like", protect, toggleMemeLike);
router.get("/favorites", protect, getFavoriteMemes);

export default router;
