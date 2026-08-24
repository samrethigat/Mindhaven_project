import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  handleAiChat,
  regenerateResponse,
  getConversations,
  createConversation,
  getConversationMessages,
  updateConversation,
  deleteConversation,
  clearConversationMessages,
  getMemories,
  addMemory,
  deleteMemory,
  clearAllMemories,
} from "../controllers/aiAssistantController.js";

const router = Router();

router.use(protect);

// Chat & Conversation Threads
router.post("/chat", handleAiChat);
router.post("/chat/regenerate", regenerateResponse);
router.get("/conversations", getConversations);
router.post("/conversations", createConversation);
router.get("/conversations/:id", getConversationMessages);
router.put("/conversations/:id", updateConversation);
router.delete("/conversations/:id", deleteConversation);
router.delete("/conversations/:id/clear", clearConversationMessages);

// Memory Management
router.get("/memories", getMemories);
router.post("/memories", addMemory);
router.delete("/memories/:id", deleteMemory);
router.delete("/memories", clearAllMemories);

export default router;
