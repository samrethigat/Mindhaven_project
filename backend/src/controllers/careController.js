import SupportInteraction from "../models/SupportInteraction.js";
import User from "../models/User.js";

/**
 * Rule-based emotion/level classifier for check-ins.
 * Maps the user's words to a triage level:
 *   - none       -> normal / positive, no intervention
 *   - level_1    -> temporary sadness / mild negative
 *   - level_2    -> moderate distress / withdrawal / persistent hopelessness
 *   - level_3    -> severe distress / self-harm / crisis (escalate)
 *
 * This mirrors the level taxonomy used across MindHaven.
 */
const LEVEL2_WORDS = [
  "hopeless", "worthless", "empty", "numb", "can't go on", "cant go on",
  "give up", "no point", "overwhelmed", "drowning", "trapped", "miserable",
  "so sad", "very sad", "crying", "depressed", "alone", "withdrawn",
  "can't cope", "cant cope", "stuck", "exhausted", "burned out", "burnout",
  "anxious", "panic", "desperate", "nobody cares", "no one cares",
];

const LEVEL3_WORDS = [
  "kill", "suicide", "suicidal", "end my life", "hurt myself", "self harm",
  "self-harm", "don't want to live", "dont want to live", "better off dead",
  "end it all", "harm myself",
];

const POSITIVE_WORDS = [
  "good", "great", "happy", "fine", "okay", "ok", "better", "excited",
  "grateful", "positive", "calm", "relaxed", "hopeful", "content", "thankful",
];

/**
 * Classify a check-in text into a level + emotion.
 */
export function classifyCheckIn(text) {
  const input = (text || "").toLowerCase().trim();
  if (!input) return { level: "none", emotion: "neutral" };

  // Level 3 takes highest priority
  if (LEVEL3_WORDS.some((w) => input.includes(w))) {
    return { level: "level_3", emotion: "distressed" };
  }

  // Count level_2 signals
  const l2Hits = LEVEL2_WORDS.filter((w) => input.includes(w)).length;
  // Count positive signals
  const posHits = POSITIVE_WORDS.filter((w) => input.includes(w)).length;

  if (l2Hits >= 2 || (l2Hits >= 1 && posHits === 0)) {
    return { level: "level_2", emotion: "sad" };
  }

  if (posHits > 0 && l2Hits === 0) {
    return { level: "none", emotion: "positive" };
  }

  // Mild negative or neutral -> level_1
  if (input.length > 0) {
    return { level: "level_1", emotion: "sad" };
  }

  return { level: "none", emotion: "neutral" };
}

/**
 * POST /api/care/checkin
 * Body: { text: string }
 * Records a check-in, classifies the level, and returns guidance.
 */
export async function checkIn(req, res) {
  try {
    const isStudent = req.user.role === "patient" || req.user.role === "candidate";
    if (!isStudent) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Check-in text is required" });
    }

    const { level, emotion } = classifyCheckIn(text);

    await SupportInteraction.create({
      user: req.user._id,
      type: "checkin",
      level,
      checkInText: text,
      emotion,
    });

    res.json({ level, emotion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/care/activity
 * Body: { activity: "music"|"meme"|"joke"|"story"|"breathing"|"meditation" }
 */
export async function recordActivity(req, res) {
  try {
    const isStudent = req.user.role === "patient" || req.user.role === "candidate";
    if (!isStudent) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    const { activity } = req.body;
    const allowed = ["music", "meme", "joke", "story", "breathing", "meditation"];
    if (!allowed.includes(activity)) {
      return res.status(400).json({ error: "Invalid activity" });
    }

    await SupportInteraction.create({
      user: req.user._id,
      type: "activity",
      activity,
    });

    res.json({ message: "Activity recorded", activity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/care/mood
 * Body: { moodImproved: boolean }
 */
export async function recordMood(req, res) {
  try {
    const isStudent = req.user.role === "patient" || req.user.role === "candidate";
    if (!isStudent) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    const { moodImproved } = req.body;
    if (typeof moodImproved !== "boolean") {
      return res.status(400).json({ error: "moodImproved must be a boolean" });
    }

    await SupportInteraction.create({
      user: req.user._id,
      type: "mood",
      moodImproved,
    });

    res.json({ message: "Mood recorded", moodImproved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/care/history
 * Returns the patient's recent support interaction history.
 */
export async function getHistory(req, res) {
  try {
    const isStudent = req.user.role === "patient" || req.user.role === "candidate";
    if (!isStudent) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    const history = await SupportInteraction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/care/counselors?city=...&state=...
 * Lists active counselors, optionally filtered by the patient's location.
 */
export async function getNearbyCounselors(req, res) {
  try {
    const isStudent = req.user.role === "patient" || req.user.role === "candidate";
    if (!isStudent) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    const { city, state } = req.query;
    const filter = { role: "counselor", isActive: true, isDeleted: false };

    if (city) {
      filter.$or = [
        { city: new RegExp(city, "i") },
        { district: new RegExp(city, "i") },
      ];
    }
    if (state) {
      filter.state = new RegExp(state, "i");
    }

    const counselors = await User.find(filter).select(
      "fullName email phone photo qualification specialization experience " +
        "hospital clinic consultationFee languages district city state availability isOnline rating"
    );

    res.json({ counselors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
