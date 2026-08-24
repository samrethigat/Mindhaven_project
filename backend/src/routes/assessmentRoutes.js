import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  submitAssessment,
  getAssessmentHistory,
  getLatestAssessment,
} from "../controllers/assessmentController.js";

const router = Router();

router.use(protect);

router.post("/", submitAssessment);
router.get("/history", getAssessmentHistory);
router.get("/latest", getLatestAssessment);

export default router;
