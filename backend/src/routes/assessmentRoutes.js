import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  submitAssessment,
  getAssessmentHistory,
  getLatestAssessment,
  getAssessmentById,
  getAssessmentQuestions,
} from "../controllers/assessmentController.js";

const router = Router();

// Assessment questions metadata (public or protected)
router.get("/questions", getAssessmentQuestions);

// Protected routes (Student Authentication)
router.use(protect);

router.post("/", submitAssessment);
router.post("/submit", submitAssessment);
router.get("/history", getAssessmentHistory);
router.get("/latest", getLatestAssessment);
router.get("/:assessmentId", getAssessmentById);

export default router;
