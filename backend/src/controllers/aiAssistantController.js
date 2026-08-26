import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import AiMessage from "../models/AiMessage.js";
import Memory from "../models/Memory.js";
import User from "../models/User.js";
import { generateAiResponse } from "../services/aiService.js";

async function getSafeUserId(req) {
  let userId = req.user?._id;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    const dbUser = (await User.findOne({ role: "candidate", isActive: true })) || (await User.findOne({ isActive: true }));
    userId = dbUser?._id;
  }
  return userId;
}

/**
 * POST /api/ai/chat
 * Handles multi-turn chat with context, user memory, and actions
 */
export async function handleAiChat(req, res) {
  try {
    const { conversationId, message } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const userId = await getSafeUserId(req);
    let conversation = null;

    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conversation = await Conversation.findOne({ _id: conversationId, user: userId });
    }

    if (!conversation) {
      // Auto-generate title from first few words of message
      const snippet = message.trim().slice(0, 30);
      const title = snippet.length < message.trim().length ? `${snippet}...` : snippet;
      conversation = await Conversation.create({
        user: userId,
        title: title || "புதிய உரையாடல்",
      });
    }

    // 1. Fetch user's saved memories
    const userMemories = await Memory.find({ user: userId }).limit(30);

    // 2. Fetch recent conversation history
    const history = await AiMessage.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .limit(20);

    // 3. Save User Message
    const userMessage = await AiMessage.create({
      conversation: conversation._id,
      user: userId,
      role: "user",
      content: message.trim(),
    });

    // 4. Generate AI Response
    const aiResult = await generateAiResponse({
      user: req.user,
      message: message.trim(),
      conversationHistory: history,
      userMemories,
    });

    // 5. Save Assistant Message
    const assistantMessage = await AiMessage.create({
      conversation: conversation._id,
      user: userId,
      role: "assistant",
      content: aiResult.reply,
      action: aiResult.action,
      language: aiResult.language || "ta",
    });

    // 6. Update conversation timestamp
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.json({
      conversation,
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error("AI Chat error:", error);
    res.status(500).json({ error: "மன்னிக்கவும் 😔 AI பதிலளிப்பதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்." });
  }
}

/**
 * POST /api/ai/chat/regenerate
 * Re-runs inference on the last user message in the active thread
 */
export async function regenerateResponse(req, res) {
  try {
    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID is required" });
    }

    const userId = await getSafeUserId(req);
    const conversation = await Conversation.findOne({ _id: conversationId, user: userId });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await AiMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 });
    if (messages.length === 0) {
      return res.status(400).json({ error: "No messages in conversation to regenerate" });
    }

    // Identify last user message
    let lastUserMsg = null;
    let historyForInference = [];

    // If last message was assistant, remove it
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "assistant") {
      await AiMessage.findByIdAndDelete(lastMsg._id);
      const remaining = messages.slice(0, messages.length - 1);
      lastUserMsg = remaining[remaining.length - 1];
      historyForInference = remaining.slice(0, remaining.length - 1);
    } else {
      lastUserMsg = lastMsg;
      historyForInference = messages.slice(0, messages.length - 1);
    }

    if (!lastUserMsg || lastUserMsg.role !== "user") {
      return res.status(400).json({ error: "No user message found to regenerate" });
    }

    const userMemories = await Memory.find({ user: userId }).limit(30);

    const aiResult = await generateAiResponse({
      user: req.user,
      message: lastUserMsg.content,
      conversationHistory: historyForInference,
      userMemories,
    });

    const newAssistantMessage = await AiMessage.create({
      conversation: conversation._id,
      user: userId,
      role: "assistant",
      content: aiResult.reply,
      action: aiResult.action,
      language: aiResult.language || "ta",
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.json({
      assistantMessage: newAssistantMessage,
    });
  } catch (error) {
    console.error("AI Regenerate error:", error);
    res.status(500).json({ error: "Failed to regenerate response" });
  }
}

/**
 * GET /api/ai/conversations
 */
export async function getConversations(req, res) {
  try {
    const userId = await getSafeUserId(req);
    const { search } = req.query;
    let query = { user: userId };

    if (search && String(search).trim()) {
      const q = String(search).trim();
      const matchingMessages = await AiMessage.find({
        user: userId,
        content: { $regex: q, $options: "i" },
      }).distinct("conversation");

      query = {
        user: userId,
        $or: [
          { title: { $regex: q, $options: "i" } },
          { _id: { $in: matchingMessages } },
        ],
      };
    }

    const conversations = await Conversation.find(query)
      .sort({ pinned: -1, lastMessageAt: -1 })
      .limit(50);

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/ai/conversations
 */
export async function createConversation(req, res) {
  try {
    const userId = await getSafeUserId(req);
    const { title } = req.body;
    const conversation = await Conversation.create({
      user: userId,
      title: title || "புதிய உரையாடல்",
    });
    res.status(201).json({ conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/ai/conversations/:id
 */
export async function getConversationMessages(req, res) {
  try {
    const userId = await getSafeUserId(req);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: userId,
    });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await AiMessage.find({ conversation: conversation._id }).sort({
      createdAt: 1,
    });

    res.json({ conversation, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/ai/conversations/:id
 */
export async function updateConversation(req, res) {
  try {
    const userId = await getSafeUserId(req);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const { title, pinned } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (pinned !== undefined) updates.pinned = pinned;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      updates,
      { new: true }
    );
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/ai/conversations/:id
 */
export async function deleteConversation(req, res) {
  try {
    const userId = await getSafeUserId(req);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    await AiMessage.deleteMany({ conversation: conversation._id });
    res.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/ai/conversations/:id/clear
 */
export async function clearConversationMessages(req, res) {
  try {
    const userId = await getSafeUserId(req);
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: userId,
    });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    await AiMessage.deleteMany({ conversation: conversation._id });
    res.json({ message: "Messages cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * User Memory Handlers
 */
export async function getMemories(req, res) {
  try {
    const userId = await getSafeUserId(req);
    const memories = await Memory.find({ user: userId }).sort({ createdAt: -1 });
    res.json({ memories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function addMemory(req, res) {
  try {
    const userId = await getSafeUserId(req);
    const { key, value, category } = req.body;
    if (!key || !value) {
      return res.status(400).json({ error: "Key and value are required" });
    }
    const memory = await Memory.create({
      user: userId,
      key,
      value,
      category: category || "general",
      source: "user_specified",
    });
    res.status(201).json({ memory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteMemory(req, res) {
  try {
    const userId = await getSafeUserId(req);
    await Memory.findOneAndDelete({ _id: req.params.id, user: userId });
    res.json({ message: "Memory removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function clearAllMemories(req, res) {
  try {
    const userId = await getSafeUserId(req);
    await Memory.deleteMany({ user: userId });
    res.json({ message: "All memories cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
