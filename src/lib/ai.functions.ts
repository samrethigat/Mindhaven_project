import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MODEL = "google/gemini-3.6-flash";

const chatInput = z.object({
  message: z.string().trim().min(1).max(2000),
  typingSpeed: z.number().optional(),
  faceEmotion: z.string().max(40).optional(),
  voiceEmotion: z.string().max(40).optional(),
});

export const sendCompanionMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => chatInput.parse(input))
  .handler(async ({ data, context }) => {
    const { gatewayChat } = await import("./ai-gateway.server");
    const { buildCompanionSystemPrompt, classifyRisk } = await import("./companion.server");
    const { supabase, userId } = context;

    const [{ data: history }, { data: student }, { data: assessment }] = await Promise.all([
      supabase
        .from("chat_messages")
        .select("role, content")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(24),
      supabase.from("students").select("full_name, college").eq("user_id", userId).maybeSingle(),
      supabase
        .from("assessments")
        .select("risk, scores, wellbeing_score")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const ordered = (history ?? []).slice().reverse();

    const risk = await classifyRisk({
      message: data.message,
      recent: ordered.map((m) => `${m.role}: ${m.content}`).join("\n"),
      baseline: assessment?.risk ?? "level_1",
      faceEmotion: data.faceEmotion,
      voiceEmotion: data.voiceEmotion,
      typingSpeed: data.typingSpeed,
    });

    const reply = await gatewayChat({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: buildCompanionSystemPrompt({
            name: student?.full_name?.split(" ")[0] ?? "friend",
            college: student?.college ?? null,
            risk: risk.risk,
            emotion: risk.emotion,
          }),
        },
        ...ordered.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: data.message },
      ],
      maxCompletionTokens: 700,
    });

    const answer = reply.trim() || "I'm here with you. Tell me a little more? 💙";

    await supabase.from("chat_messages").insert([
      { user_id: userId, role: "user", content: data.message, emotion: risk.emotion },
      { user_id: userId, role: "assistant", content: answer },
    ]);

    await supabase.from("emotion_analyses").insert({
      user_id: userId,
      source: "combined",
      emotion: risk.emotion,
      confidence: risk.confidence,
      distress_score: risk.distress,
      risk: risk.risk,
      details: {
        face: data.faceEmotion ?? null,
        voice: data.voiceEmotion ?? null,
        typing_speed: data.typingSpeed ?? null,
        reasoning: risk.reasoning,
      } as never,
    });

    let emergency: { alertId: string; appointmentId: string | null } | null = null;
    if (risk.risk === "level_3") {
      const { raiseEmergency } = await import("./emergency.server");
      const { detectEmergency } = await import("./emergency-detection");
      const signal = detectEmergency({
        scores: (assessment?.scores ?? null) as never,
        risk: risk.risk,
        distress: risk.distress,
        emotion: risk.emotion,
      });
      const result = await raiseEmergency({
        studentUserId: userId,
        summary: risk.reasoning,
        source: "chat",
        report: { emotion: risk.emotion, distress: risk.distress, message: data.message },
        reason: signal.reasons.join(", ") || "Severe distress detected in conversation",
        mentalStatus: signal.mentalStatus,
        aiScore: signal.aiScore,
      });
      emergency = { alertId: result.alertId, appointmentId: result.appointmentId };
    }

    return { answer, risk: risk.risk, emotion: risk.emotion, distress: risk.distress, emergency };
  });

export const getCompanionHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const analyzeJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid(), content: z.string().min(1).max(6000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { gatewayChat } = await import("./ai-gateway.server");
    const raw = await gatewayChat({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            'You are a sentiment analyser for student journals. Reply with JSON only: {"sentiment":"positive|neutral|negative","score":-1..1,"summary":"one supportive sentence"}',
        },
        { role: "user", content: data.content },
      ],
      responseFormat: { type: "json_object" },
      maxCompletionTokens: 200,
    });

    let parsed: { sentiment?: string; score?: number; summary?: string } = {};
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      parsed = { sentiment: "neutral", score: 0, summary: "Thanks for writing this down." };
    }

    await context.supabase
      .from("journal_entries")
      .update({ sentiment: parsed.sentiment ?? "neutral", sentiment_score: parsed.score ?? 0 })
      .eq("id", data.id)
      .eq("user_id", context.userId);

    return {
      sentiment: parsed.sentiment ?? "neutral",
      score: parsed.score ?? 0,
      summary: parsed.summary ?? "Thanks for writing this down.",
    };
  });

export const analyzeFaceSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ imageDataUrl: z.string().min(50) }).parse(input))
  .handler(async ({ data, context }) => {
    const { gatewayChat } = await import("./ai-gateway.server");
    const raw = await gatewayChat({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            'Classify the facial expression of the person. Reply with JSON only: {"emotion":"happy|neutral|sad|angry|fearful|tired|distressed","confidence":0..1,"distress":0..100}',
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Classify this face." },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
      responseFormat: { type: "json_object" },
      maxCompletionTokens: 120,
    });

    let parsed: { emotion?: string; confidence?: number; distress?: number } = {};
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      parsed = { emotion: "neutral", confidence: 0.4, distress: 20 };
    }

    const emotion = parsed.emotion ?? "neutral";
    const distress = Math.max(0, Math.min(100, parsed.distress ?? 20));

    await context.supabase.from("emotion_analyses").insert({
      user_id: context.userId,
      source: "face",
      emotion,
      confidence: parsed.confidence ?? 0.5,
      distress_score: distress,
      risk: distress >= 70 ? "level_3" : distress >= 45 ? "level_2" : "level_1",
      details: {} as never,
    });

    return { emotion, confidence: parsed.confidence ?? 0.5, distress };
  });