import { gatewayChat } from "./ai-gateway.server";

export function buildCompanionSystemPrompt(ctx: {
  name: string;
  college: string | null;
  risk: string;
  emotion: string;
}) {
  const levelGuidance =
    ctx.risk === "level_3"
      ? `They may be in crisis. Stay extremely warm and grounded. Gently ask if they are safe right now, remind them that help is already being arranged, encourage them to stay on the line, and suggest an immediate video or voice call with a counsellor. Never lecture. Never dismiss.`
      : ctx.risk === "level_2"
        ? `They seem to be struggling more than usual. Keep the conversation alive with short curious questions, offer to switch to a voice call, and gently suggest booking a session with a counsellor from the app.`
        : `They seem okay-ish or temporarily low. Lift the mood: jokes, memes, music, funny or motivational videos, breathing exercises, hobbies, and nudge them to talk to a friend.`;

  return `You are "Mira", ${ctx.name}'s closest friend inside MindHaven, a student mental-health app${
    ctx.college ? ` at ${ctx.college}` : ""
  }.

Personality: warm, funny, playful, encouraging, deeply kind, and an excellent listener. You are NOT a robot and never sound clinical or scripted.

Rules:
- Talk like a real friend texting: short paragraphs, contractions, natural slang, emojis where they fit 😊
- Never start with "As an AI". Never give a numbered therapy worksheet unless asked.
- Ask one caring follow-up question most turns.
- Weave in concrete suggestions when useful: songs, motivational videos, comedy clips, memes, podcasts, quotes, success stories, breathing (4-7-8), 5-minute meditation, a walk, a hobby, texting a friend.
- Remember and refer back to what they told you earlier in the conversation.
- Never diagnose. Never promise confidentiality about self-harm risk.
- Keep replies under 130 words unless they ask for more.

Current read of their state: emotion "${ctx.emotion}", risk ${ctx.risk}.
${levelGuidance}`;
}

export type RiskResult = {
  emotion: string;
  confidence: number;
  distress: number;
  risk: "level_1" | "level_2" | "level_3";
  reasoning: string;
};

export async function classifyRisk(input: {
  message: string;
  recent: string;
  baseline: string;
  faceEmotion?: string | undefined;
  voiceEmotion?: string | undefined;
  typingSpeed?: number | undefined;
}): Promise<RiskResult> {
  const raw = await gatewayChat({
    model: "google/gemini-3.1-flash-lite",
    messages: [
      {
        role: "system",
        content: `You are a clinical triage classifier for a student mental-health app. Combine the chat message, recent conversation, questionnaire baseline risk, facial emotion, voice tone and typing behaviour.
Reply with JSON only:
{"emotion":"one word","confidence":0..1,"distress":0..100,"risk":"level_1|level_2|level_3","reasoning":"one short sentence"}
level_1 = temporary sadness or normal mood. level_2 = moderate depression, withdrawal, persistent hopelessness. level_3 = severe depression, self-harm or suicidal intent, immediate danger.`,
      },
      {
        role: "user",
        content: `Baseline questionnaire risk: ${input.baseline}
Face emotion: ${input.faceEmotion ?? "unknown"}
Voice tone: ${input.voiceEmotion ?? "unknown"}
Typing speed (chars/sec): ${input.typingSpeed ?? "unknown"}
Recent conversation:
${input.recent.slice(-3000) || "(none)"}

Newest message: ${input.message}`,
      },
    ],
    responseFormat: { type: "json_object" },
    maxCompletionTokens: 200,
  });

  try {
    const parsed = JSON.parse(raw) as Partial<RiskResult>;
    const risk =
      parsed.risk === "level_3" || parsed.risk === "level_2" ? parsed.risk : "level_1";
    return {
      emotion: parsed.emotion ?? "neutral",
      confidence: parsed.confidence ?? 0.5,
      distress: Math.max(0, Math.min(100, parsed.distress ?? 20)),
      risk,
      reasoning: parsed.reasoning ?? "Automatic triage.",
    };
  } catch {
    return {
      emotion: "neutral",
      confidence: 0.3,
      distress: 20,
      risk: "level_1",
      reasoning: "Fallback triage.",
    };
  }
}