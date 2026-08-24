import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from "../controllers/notificationController.js";

const router = Router();

router.use(protect);

router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.post("/read-all", markAllRead);
router.post("/:id/read", markRead);

export default router;
