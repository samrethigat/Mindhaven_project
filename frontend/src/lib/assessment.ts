export type Domain =
  | "stress"
  | "depression"
  | "anxiety"
  | "loneliness"
  | "sleep"
  | "self_esteem"
  | "academic"
  | "social"
  | "suicidal";

export type Question = { id: string; domain: Domain; text: string; reverse?: boolean };

export const DOMAIN_LABEL: Record<Domain, string> = {
  stress: "Stress",
  depression: "Depression",
  anxiety: "Anxiety",
  loneliness: "Loneliness",
  sleep: "Sleep",
  self_esteem: "Self esteem",
  academic: "Academic pressure",
  social: "Social behaviour",
  suicidal: "Suicidal risk",
};

/** 0 = Never … 4 = Almost always */
export const SCALE = ["Never", "Rarely", "Sometimes", "Often", "Almost always"];

export const QUESTIONS: Question[] = [
  { id: "q1", domain: "stress", text: "I feel overwhelmed by the things I have to do." },
  { id: "q2", domain: "stress", text: "Small problems make me lose my temper quickly." },
  { id: "q3", domain: "stress", text: "I find it hard to relax even when I have free time." },
  { id: "q4", domain: "stress", text: "I feel physically tense (headache, tight chest, stomach aches)." },
  { id: "q5", domain: "stress", text: "I feel in control of the important things in my life.", reverse: true },
  { id: "q6", domain: "depression", text: "I feel low, empty or hopeless." },
  { id: "q7", domain: "depression", text: "Things I used to enjoy no longer interest me." },
  { id: "q8", domain: "depression", text: "I feel tired and without energy most of the day." },
  { id: "q9", domain: "depression", text: "I feel like a burden to the people around me." },
  { id: "q10", domain: "depression", text: "I look forward to the days ahead.", reverse: true },
  { id: "q11", domain: "anxiety", text: "I worry about many different things at once." },
  { id: "q12", domain: "anxiety", text: "I feel nervous, restless or on edge." },
  { id: "q13", domain: "anxiety", text: "My heart races or I feel breathless without physical effort." },
  { id: "q14", domain: "anxiety", text: "I avoid situations because they make me anxious." },
  { id: "q15", domain: "anxiety", text: "I can calm myself down when I get worried.", reverse: true },
  { id: "q16", domain: "loneliness", text: "I feel alone even when other people are around." },
  { id: "q17", domain: "loneliness", text: "I feel there is nobody I can really talk to." },
  { id: "q18", domain: "loneliness", text: "I feel left out by my classmates or friends." },
  { id: "q19", domain: "loneliness", text: "I have people I can rely on when things go wrong.", reverse: true },
  { id: "q20", domain: "sleep", text: "I have trouble falling asleep or staying asleep." },
  { id: "q21", domain: "sleep", text: "I wake up feeling unrefreshed." },
  { id: "q22", domain: "sleep", text: "I use my phone late into the night instead of sleeping." },
  { id: "q23", domain: "sleep", text: "I sleep well and wake up on time.", reverse: true },
  { id: "q24", domain: "self_esteem", text: "I feel I am not good enough compared to others." },
  { id: "q25", domain: "self_esteem", text: "I criticise myself harshly when I make mistakes." },
  { id: "q26", domain: "self_esteem", text: "I am satisfied with who I am.", reverse: true },
  { id: "q27", domain: "self_esteem", text: "I believe I can handle the challenges in my life.", reverse: true },
  { id: "q28", domain: "academic", text: "I feel pressure from exams, marks or placements." },
  { id: "q29", domain: "academic", text: "I am afraid of disappointing my parents with my results." },
  { id: "q30", domain: "academic", text: "I struggle to concentrate on my studies." },
  { id: "q31", domain: "academic", text: "I have skipped classes because I could not cope." },
  { id: "q32", domain: "academic", text: "I feel able to manage my academic workload.", reverse: true },
  { id: "q33", domain: "social", text: "I have withdrawn from friends and family recently." },
  { id: "q34", domain: "social", text: "I find it difficult to start conversations with people." },
  { id: "q35", domain: "social", text: "I prefer to stay in my room rather than meet anyone." },
  { id: "q36", domain: "social", text: "I enjoy spending time with other people.", reverse: true },
  { id: "q37", domain: "suicidal", text: "I have thoughts that life is not worth living." },
  { id: "q38", domain: "suicidal", text: "I have thought about hurting myself." },
  { id: "q39", domain: "suicidal", text: "I have made a plan to end my life." },
  { id: "q40", domain: "suicidal", text: "I feel hopeful about my future.", reverse: true },
];

export type Answers = Record<string, number>;
export type RiskLevel = "level_1" | "level_2" | "level_3";

export type AssessmentResult = {
  scores: Record<Domain, number>;
  totalScore: number;
  wellbeingScore: number;
  risk: RiskLevel;
  suicidalFlag: boolean;
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  level_1: "Level 1 — Temporary sadness / mild distress",
  level_2: "Level 2 — Moderate distress",
  level_3: "Level 3 — High distress / needs professional care",
};

function value(q: Question, raw: number) {
  return q.reverse ? 4 - raw : raw;
}

export function scoreAssessment(answers: Answers): AssessmentResult {
  const totals: Record<string, { sum: number; count: number }> = {};
  let total = 0;

  for (const q of QUESTIONS) {
    const raw = answers[q.id] ?? 0;
    const v = value(q, raw);
    total += v;
    const bucket = (totals[q.domain] ??= { sum: 0, count: 0 });
    bucket.sum += v;
    bucket.count += 1;
  }

  const scores = Object.fromEntries(
    Object.keys(DOMAIN_LABEL).map((d) => {
      const b = totals[d] ?? { sum: 0, count: 1 };
      return [d, Math.round((b.sum / (b.count * 4)) * 100)];
    }),
  ) as Record<Domain, number>;

  const maxTotal = QUESTIONS.length * 4;
  const distress = Math.round((total / maxTotal) * 100);
  const wellbeingScore = 100 - distress;

  const suicidalFlag =
    (answers["q38"] ?? 0) >= 2 || (answers["q39"] ?? 0) >= 1 || (answers["q37"] ?? 0) >= 3;

  let risk: RiskLevel = "level_1";
  if (suicidalFlag || distress >= 68 || scores.suicidal >= 55) risk = "level_3";
  else if (distress >= 45 || scores.depression >= 60) risk = "level_2";

  return { scores, totalScore: total, wellbeingScore, risk, suicidalFlag };
}

export function riskExplanation(risk: RiskLevel, suicidalFlag: boolean): string {
  if (suicidalFlag) {
    return "Your answers indicate thoughts about hurting yourself. You are not alone, and you deserve support right now. Please reach out to a licensed counselor or your local emergency service immediately.";
  }
  if (risk === "level_3") {
    return "Your answers point to a high level of distress that is affecting you significantly. Please reach out to a qualified counselor or your local emergency support as soon as possible.";
  }
  if (risk === "level_2") {
    return "Your answers suggest moderate distress that may be impacting your daily life. A counselor can help you understand and work through what you're feeling.";
  }
  return "Your answers suggest mild, temporary distress. Small, consistent self-care steps can make a big difference, and Mira is here whenever you need support.";
}

export function selfCareSuggestions(risk: RiskLevel): string[] {
  const base = [
    "Keep a small gratitude journal — three things each night.",
    "Move your body for 15 minutes; a walk counts.",
    "Stick to a regular sleep schedule.",
    "Limit scrolling before bed.",
  ];
  const moderate = [
    "Try a guided breathing or meditation session with Mira.",
    "Reach out to a trusted friend or family member.",
    "Book a session with a counselor to talk it through.",
  ];
  const severe = [
    "Prioritize speaking with a licensed counselor this week.",
    "Keep your emergency contacts reachable.",
    "Have a trusted person check in on you regularly.",
  ];
  if (risk === "level_3") return [...severe, ...base];
  if (risk === "level_2") return [...moderate, ...base];
  return base;
}

