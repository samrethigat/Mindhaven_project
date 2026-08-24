import type { Domain, RiskLevel } from "./assessment";

export type EmergencySignal = {
  reasons: string[];
  mentalStatus: string;
  aiScore: number;
  critical: boolean;
};

/**
 * Pure, shared detection of a critical mental-health state.
 * Conditions: high depression, high anxiety, suicide risk, self-harm risk,
 * emotional breakdown.
 */
export function detectEmergency(input: {
  scores?: Partial<Record<Domain, number>> | null;
  risk?: RiskLevel | string | null;
  suicidalFlag?: boolean;
  distress?: number | null;
  emotion?: string | null;
}): EmergencySignal {
  const s = input.scores ?? {};
  const reasons: string[] = [];

  if ((s.depression ?? 0) >= 65) reasons.push("High depression");
  if ((s.anxiety ?? 0) >= 65) reasons.push("High anxiety");
  if (input.suicidalFlag || (s.suicidal ?? 0) >= 50) reasons.push("Suicide risk");
  if ((s.suicidal ?? 0) >= 35 || (s.self_esteem ?? 0) >= 80) reasons.push("Self-harm risk");
  if ((input.distress ?? 0) >= 75 || input.emotion === "distressed") {
    reasons.push("Emotional breakdown");
  }
  if (input.risk === "level_3" && reasons.length === 0) reasons.push("Severe distress detected");

  const aiScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        input.distress ??
          Math.max(s.depression ?? 0, s.anxiety ?? 0, s.suicidal ?? 0, s.stress ?? 0),
      ),
    ),
  );

  const mentalStatus =
    aiScore >= 80 || reasons.includes("Suicide risk")
      ? "Critical — immediate intervention needed"
      : aiScore >= 60
        ? "Severe distress — unstable"
        : aiScore >= 40
          ? "Moderate distress — needs monitoring"
          : "Stable";

  return {
    reasons,
    mentalStatus,
    aiScore,
    critical: input.risk === "level_3" || reasons.length > 0,
  };
}

export const RISK_TONE = (score: number) =>
  score >= 80 ? "critical" : score >= 60 ? "severe" : score >= 40 ? "moderate" : "low";
