import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  checkIn,
  recordActivity,
  recordMood,
  getHistory,
  getNearbyCounselors,
} from "../controllers/careController.js";

const router = Router();

// All care routes require authentication
router.use(protect);

router.post("/checkin", checkIn);
router.post("/activity", recordActivity);
router.post("/mood", recordMood);
router.get("/history", getHistory);
router.get("/counselors", getNearbyCounselors);

export default router;
