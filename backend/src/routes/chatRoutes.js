import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  getMyConversations,
  getMessages,
  sendMessage,
  getConversationWithUser,
} from "../controllers/chatController.js";

const router = Router();

router.use(protect);

router.get("/", getMyConversations);
router.get("/with/:otherId", getConversationWithUser);
router.get("/appointment/:appointmentId", getMessages);
router.post("/", sendMessage);

export default router;
