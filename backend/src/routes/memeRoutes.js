import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  getMemes,
  toggleMemeLike,
  getFavoriteMemes,
} from "../controllers/memeController.js";

const router = Router();

router.use(protect);

router.get("/list", getMemes);
router.post("/like", toggleMemeLike);
router.get("/favorites", getFavoriteMemes);

export default router;
