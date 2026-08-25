/**
 * Psychology & Student Well-Being Assessment Definitions & Utilities
 *
 * 40-Question Evidence-Based Mindset & Screening Tool
 * NOTE: This is a well-being/mindset screening tool, NOT a medical diagnosis.
 */

export interface Question {
  id: number;
  qId: string;
  category: "emotional" | "academic" | "selfConfidence" | "social" | "coping";
  text: string;
  reverse: boolean;
}

export interface CategoryScore {
  score: number;
  percentage: number;
  level: "Strong / Healthy Range" | "Moderate / Needs Attention" | "Needs Improvement" | "Higher Support Recommended" | string;
}

export interface AssessmentResult {
  _id?: string;
  student?: string;
  answers: Record<string, number>;
  categoryScores: {
    emotional: CategoryScore;
    academic: CategoryScore;
    selfConfidence: CategoryScore;
    social: CategoryScore;
    coping: CategoryScore;
  };
  overallScore: number; // 40 - 200
  overallPercentage: number; // 0 - 100%
  mindsetProfile: string;
  strongestCategory?: string;
  weakestCategory?: string;
  strengths: string[];
  areasToFocus: string[];
  recommendations: string[];
  summary?: string;
  completedAt?: string;
  createdAt?: string;
}

export const RESPONSE_SCALE = [
  { value: 1, label: "Never", tamilLabel: "ஒருபோதும் இல்லை", description: "Not at all in daily life" },
  { value: 2, label: "Rarely", tamilLabel: "அரிதாக", description: "Only on rare occasions" },
  { value: 3, label: "Sometimes", tamilLabel: "சில நேரங்களில்", description: "Occasionally or about half the time" },
  { value: 4, label: "Often", tamilLabel: "அடிக்கடி", description: "Frequently in regular routine" },
  { value: 5, label: "Almost Always", tamilLabel: "கிட்டத்தட்ட எப்போதும்", description: "Consistently almost every day" },
];

export const CATEGORIES = {
  emotional: {
    id: "emotional",
    title: "Emotional Well-Being",
    tamilTitle: "உணர்ச்சி நல்வாழ்வு",
    icon: "Heart",
    color: "rose",
    questions: [1, 2, 3, 4, 5, 6, 7, 8],
    description: "Daily emotional stability, mood balance, and emotional self-awareness.",
  },
  academic: {
    id: "academic",
    title: "Academic Stress Management",
    tamilTitle: "கல்வி மன அழுத்த மேலாண்மை",
    icon: "GraduationCap",
    color: "indigo",
    questions: [9, 10, 11, 12, 13, 14, 15, 16],
    description: "Handling coursework, exam deadlines, and study pressure effectively.",
  },
  selfConfidence: {
    id: "selfConfidence",
    title: "Self-Confidence & Self-Esteem",
    tamilTitle: "சுயநம்பிக்கை & சுயமரியாதை",
    icon: "Sparkles",
    color: "amber",
    questions: [17, 18, 19, 20, 21, 22, 23, 24],
    description: "Self-belief, willingness to learn from mistakes, and personal worth.",
  },
  social: {
    id: "social",
    title: "Social & Relationship Well-Being",
    tamilTitle: "சமூக & நட்பு உறவுகள்",
    icon: "Users",
    color: "teal",
    questions: [25, 26, 27, 28, 29, 30, 31, 32],
    description: "Feeling connected, trusted friendships, and comfortable communication.",
  },
  coping: {
    id: "coping",
    title: "Coping, Resilience & Mindset",
    tamilTitle: "சவால்களை எதிர்கொள்ளும் திறன் & எதிர்கால நம்பிக்கை",
    icon: "Shield",
    color: "emerald",
    questions: [33, 34, 35, 36, 37, 38, 39, 40],
    description: "Recovery from setbacks, healthy stress habits, and optimistic mindset.",
  },
};

export const REVERSE_SCORED_QUESTIONS = [
  2, 3, 6, 7, 9, 10, 11, 12, 13, 14, 16, 18, 19, 22, 27, 28, 30, 32, 34,
];

export const ASSESSMENT_QUESTIONS: Question[] = [
  // A. Emotional Well-Being (1-8)
  { id: 1, qId: "q1", category: "emotional", text: "How often do you feel generally positive about your day?", reverse: false },
  { id: 2, qId: "q2", category: "emotional", text: "How often do you experience sudden changes in your mood?", reverse: true },
  { id: 3, qId: "q3", category: "emotional", text: "How often do you feel emotionally overwhelmed?", reverse: true },
  { id: 4, qId: "q4", category: "emotional", text: "How often can you identify what is causing your emotions?", reverse: false },
  { id: 5, qId: "q5", category: "emotional", text: "How often do you feel emotionally balanced during normal daily activities?", reverse: false },
  { id: 6, qId: "q6", category: "emotional", text: "How often do you lose interest in activities that you normally enjoy?", reverse: true },
  { id: 7, qId: "q7", category: "emotional", text: "How often do you feel that your emotions are difficult to control?", reverse: true },
  { id: 8, qId: "q8", category: "emotional", text: "How often do you feel emotionally supported by people around you?", reverse: false },

  // B. Academic Pressure & Stress (9-16)
  { id: 9, qId: "q9", category: "academic", text: "How often do your academic responsibilities make you feel stressed?", reverse: true },
  { id: 10, qId: "q10", category: "academic", text: "How often do you worry excessively about exams or assignments?", reverse: true },
  { id: 11, qId: "q11", category: "academic", text: "How often do you feel pressure to meet academic expectations?", reverse: true },
  { id: 12, qId: "q12", category: "academic", text: "How often does academic stress affect your concentration?", reverse: true },
  { id: 13, qId: "q13", category: "academic", text: "How often do you postpone academic tasks because they feel overwhelming?", reverse: true },
  { id: 14, qId: "q14", category: "academic", text: "How often do you feel that you are unable to manage your academic workload?", reverse: true },
  { id: 15, qId: "q15", category: "academic", text: "How often do you feel confident about handling academic challenges?", reverse: false },
  { id: 16, qId: "q16", category: "academic", text: "How often do you feel mentally exhausted after studying?", reverse: true },

  // C. Self-Confidence & Self-Esteem (17-24)
  { id: 17, qId: "q17", category: "selfConfidence", text: "How often do you feel confident about your abilities?", reverse: false },
  { id: 18, qId: "q18", category: "selfConfidence", text: "How often do you compare yourself with other students?", reverse: true },
  { id: 19, qId: "q19", category: "selfConfidence", text: "How often do you doubt your own abilities?", reverse: true },
  { id: 20, qId: "q20", category: "selfConfidence", text: "How often are you comfortable making mistakes while learning?", reverse: false },
  { id: 21, qId: "q21", category: "selfConfidence", text: "How often do you recognize your own achievements?", reverse: false },
  { id: 22, qId: "q22", category: "selfConfidence", text: "How often do you feel that you are not good enough?", reverse: true },
  { id: 23, qId: "q23", category: "selfConfidence", text: "How often are you willing to try something even when you may fail?", reverse: false },
  { id: 24, qId: "q24", category: "selfConfidence", text: "How often do you believe that you can improve your skills through effort?", reverse: false },

  // D. Social & Relationship Well-Being (25-32)
  { id: 25, qId: "q25", category: "social", text: "How often do you feel comfortable talking to someone when you have a problem?", reverse: false },
  { id: 26, qId: "q26", category: "social", text: "How often do you feel connected with your friends or classmates?", reverse: false },
  { id: 27, qId: "q27", category: "social", text: "How often do you feel lonely even when other people are around?", reverse: true },
  { id: 28, qId: "q28", category: "social", text: "How often do you avoid social interactions because you feel uncomfortable?", reverse: true },
  { id: 29, qId: "q29", category: "social", text: "How often do you feel understood by people close to you?", reverse: false },
  { id: 30, qId: "q30", category: "social", text: "How often do you find it difficult to communicate your feelings?", reverse: true },
  { id: 31, qId: "q31", category: "social", text: "How often do you feel that you have someone you can trust?", reverse: false },
  { id: 32, qId: "q32", category: "social", text: "How often do conflicts with others affect your mood or concentration?", reverse: true },

  // E. Coping, Resilience & Mindset (33-40)
  { id: 33, qId: "q33", category: "coping", text: "How often are you able to recover after experiencing a difficult situation?", reverse: false },
  { id: 34, qId: "q34", category: "coping", text: "How often do you think about problems repeatedly without finding a solution?", reverse: true },
  { id: 35, qId: "q35", category: "coping", text: "How often do you use healthy activities to manage stress?", reverse: false },
  { id: 36, qId: "q36", category: "coping", text: "How often do you feel hopeful about your future?", reverse: false },
  { id: 37, qId: "q37", category: "coping", text: "How often do you adapt when your plans do not work out?", reverse: false },
  { id: 38, qId: "q38", category: "coping", text: "How often do you feel capable of handling unexpected challenges?", reverse: false },
  { id: 39, qId: "q39", category: "coping", text: "How often do you maintain a healthy balance between study, rest and personal activities?", reverse: false },
  { id: 40, qId: "q40", category: "coping", text: "How often do you believe that your current difficulties can improve with appropriate support?", reverse: false },
];

export const ASSESSMENT_DISCLAIMER =
  "This assessment is designed to help you understand general patterns in your well-being, stress, coping and mindset. It is not a medical or psychological diagnosis. If you are experiencing significant emotional distress or feel unable to cope, consider speaking with a qualified mental-health professional or a trusted person.";

export function getLevelBadgeClass(level: string): { bg: string; text: string; border: string } {
  if (level.includes("Strong") || level.includes("Healthy")) {
    return { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" };
  }
  if (level.includes("Moderate") || level.includes("Attention")) {
    return { bg: "bg-blue-50 dark:bg-blue-950/60", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" };
  }
  if (level.includes("Improvement")) {
    return { bg: "bg-amber-50 dark:bg-amber-950/60", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" };
  }
  return { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" };
}

export function getScoreBarColor(percentage: number): string {
  if (percentage >= 80) return "bg-emerald-500";
  if (percentage >= 60) return "bg-blue-500";
  if (percentage >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

/** Local scoring helper for offline / instantaneous preview fallback */
export function scoreAssessmentLocally(answers: Record<string, number>): AssessmentResult {
  const categoryScores: any = {};
  let overallScore = 0;

  for (const [key, meta] of Object.entries(CATEGORIES)) {
    let catTotal = 0;
    for (const qNum of meta.questions) {
      const raw = answers[`q${qNum}`] || answers[qNum] || 3;
      const isRev = REVERSE_SCORED_QUESTIONS.includes(qNum);
      const scored = isRev ? 6 - raw : raw;
      catTotal += scored;
    }
    const percentage = Math.max(0, Math.min(100, Math.round(((catTotal - 8) / 32) * 100)));
    let level = "Higher Support Recommended";
    if (percentage >= 80) level = "Strong / Healthy Range";
    else if (percentage >= 60) level = "Moderate / Needs Attention";
    else if (percentage >= 40) level = "Needs Improvement";

    categoryScores[key] = { score: catTotal, percentage, level };
    overallScore += catTotal;
  }

  const overallPercentage = Math.max(0, Math.min(100, Math.round(((overallScore - 40) / 160) * 100)));
  const profile =
    overallPercentage >= 80
      ? "Balanced & Resilient"
      : categoryScores.academic.percentage < 55
      ? "Academically Pressured"
      : categoryScores.selfConfidence.percentage < 55
      ? "Self-Confidence Building"
      : categoryScores.social.percentage < 55
      ? "Socially Disconnected"
      : "Growth-Oriented";

  return {
    answers,
    categoryScores,
    overallScore,
    overallPercentage,
    mindsetProfile: profile,
    strengths: [
      "Adaptive coping and willingness to self-reflect",
      "Positive awareness of daily well-being patterns",
    ],
    areasToFocus: [
      "Balancing study workload and proactive rest intervals",
      "Reaching out to trusted peers when stress increases",
    ],
    recommendations: [
      "Break large study assignments into 25-minute focused blocks.",
      "Schedule relaxing mindfulness or music breaks between tasks.",
      "Talk with a trusted friend, counselor, or family member when feeling pressured.",
    ],
    summary: `Your assessment reflects an overall well-being score of ${overallPercentage}% with a ${profile} mindset profile.`,
    completedAt: new Date().toISOString(),
  };
}
