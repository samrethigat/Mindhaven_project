import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  startCall,
  endCall,
  getMyCallLogs,
  getMyPhone,
} from "../controllers/callController.js";

const router = Router();

router.use(protect);

router.get("/", getMyCallLogs);
router.get("/phone/:appointmentId", getMyPhone);
router.post("/start", startCall);
router.post("/:id/end", endCall);

export default router;
