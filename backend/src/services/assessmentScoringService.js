/**
 * Psychology & Student Well-Being Assessment Scoring Engine
 *
 * 40-Question Evidence-Based Mindset & Screening Tool
 * NOTE: This is a well-being/mindset screening tool, NOT a medical diagnosis.
 */

export const REVERSE_SCORED_QUESTIONS = new Set([
  2, 3, 6, 7, 9, 10, 11, 12, 13, 14, 16, 18, 19, 22, 27, 28, 30, 32, 34,
]);

export const ASSESSMENT_QUESTIONS = [
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

export const CATEGORY_METADATA = {
  emotional: {
    id: "emotional",
    title: "Emotional Well-Being",
    tamilTitle: "உணர்ச்சி நல்வாழ்வு",
    description: "Ability to recognize, understand, and navigate daily emotions calmly.",
    questions: [1, 2, 3, 4, 5, 6, 7, 8],
  },
  academic: {
    id: "academic",
    title: "Academic Stress Management",
    tamilTitle: "கல்வி மன அழுத்த மேலாண்மை",
    description: "Management of study expectations, exam stress, and coursework workload.",
    questions: [9, 10, 11, 12, 13, 14, 15, 16],
  },
  selfConfidence: {
    id: "selfConfidence",
    title: "Self-Confidence & Self-Esteem",
    tamilTitle: "சுயநம்பிக்கை & சுயமரியாதை",
    description: "Belief in your abilities, willingness to learn from mistakes, and positive self-worth.",
    questions: [17, 18, 19, 20, 21, 22, 23, 24],
  },
  social: {
    id: "social",
    title: "Social & Relationship Well-Being",
    tamilTitle: "சமூக & நட்பு உறவுகள்",
    description: "Feeling connected, finding trusted people to talk to, and healthy communication.",
    questions: [25, 26, 27, 28, 29, 30, 31, 32],
  },
  coping: {
    id: "coping",
    title: "Coping, Resilience & Future Mindset",
    tamilTitle: "சவால்களை எதிர்கொள்ளும் திறன் & எதிர்கால நம்பிக்கை",
    description: "Adapting to unexpected setbacks, maintaining balance, and optimism.",
    questions: [33, 34, 35, 36, 37, 38, 39, 40],
  },
};

/**
 * Score answer value taking reverse-scoring into account.
 * 1 (Never) -> 5 (Almost Always)
 */
export function getScoredValue(questionNumber, rawValue) {
  const num = parseInt(questionNumber, 10);
  const raw = parseInt(rawValue, 10);

  if (isNaN(raw) || raw < 1 || raw > 5) {
    throw new Error(`Invalid response value ${rawValue} for question ${questionNumber}. Must be 1-5.`);
  }

  if (REVERSE_SCORED_QUESTIONS.has(num)) {
    // 1 -> 5, 2 -> 4, 3 -> 3, 4 -> 2, 5 -> 1
    return 6 - raw;
  }
  return raw;
}

/**
 * Categorize a percentage into the 4 well-being ranges:
 * 80–100% = Strong / Healthy Range
 * 60–79% = Moderate / Needs Attention
 * 40–59% = Needs Improvement
 * Below 40% = Higher Support Recommended
 */
export function getCategoryLevel(percentage) {
  if (percentage >= 80) return "Strong / Healthy Range";
  if (percentage >= 60) return "Moderate / Needs Attention";
  if (percentage >= 40) return "Needs Improvement";
  return "Higher Support Recommended";
}

/**
 * Compute full 40-question assessment scores, categories, and mindset profile.
 */
export function calculateAssessmentScores(rawAnswers) {
  // Normalize answer keys to numbers 1..40
  const normalizedAnswers = {};
  for (let i = 1; i <= 40; i++) {
    const val = rawAnswers[i] ?? rawAnswers[`q${i}`] ?? rawAnswers[String(i)];
    if (val === undefined || val === null) {
      throw new Error(`Missing answer for Question ${i}`);
    }
    const parsedVal = parseInt(val, 10);
    if (isNaN(parsedVal) || parsedVal < 1 || parsedVal > 5) {
      throw new Error(`Invalid value for Question ${i}: ${val}. Must be between 1 and 5.`);
    }
    normalizedAnswers[`q${i}`] = parsedVal;
  }

  // Calculate scores per category
  const categoryScores = {};
  let overallScore = 0;

  for (const [catKey, catMeta] of Object.entries(CATEGORY_METADATA)) {
    let catRawTotal = 0;
    for (const qNum of catMeta.questions) {
      const rawVal = normalizedAnswers[`q${qNum}`];
      const scoredVal = getScoredValue(qNum, rawVal);
      catRawTotal += scoredVal;
    }

    // Min raw is 8 (all 1s), max is 40 (all 5s)
    const percentage = Math.round(((catRawTotal - 8) / (40 - 8)) * 100);
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    const level = getCategoryLevel(clampedPercentage);

    categoryScores[catKey] = {
      score: catRawTotal,
      percentage: clampedPercentage,
      level,
    };

    overallScore += catRawTotal;
  }

  // Overall calculations (min 40, max 200)
  const overallPercentage = Math.max(0, Math.min(100, Math.round(((overallScore - 40) / (200 - 40)) * 100)));

  // Identify strongest and weakest categories
  const sortedCategories = Object.entries(categoryScores).sort(
    (a, b) => b[1].percentage - a[1].percentage
  );

  const strongestCategoryKey = sortedCategories[0][0];
  const weakestCategoryKey = sortedCategories[sortedCategories.length - 1][0];

  const strongestCategory = CATEGORY_METADATA[strongestCategoryKey].title;
  const weakestCategory = CATEGORY_METADATA[weakestCategoryKey].title;

  // Determine Mindset Profile dynamically
  const mindsetProfile = determineMindsetProfile({
    overallPercentage,
    categoryScores,
    weakestCategoryKey,
    strongestCategoryKey,
  });

  // Generate Strengths, Focus Areas, and Recommendations
  const { strengths, areasToFocus, recommendations, summary } = generateRuleBasedInsights({
    categoryScores,
    overallPercentage,
    mindsetProfile,
    strongestCategoryKey,
    weakestCategoryKey,
  });

  // Indicators Map
  const indicators = {
    emotional: categoryScores.emotional.level,
    academic: categoryScores.academic.level,
    selfConfidence: categoryScores.selfConfidence.level,
    social: categoryScores.social.level,
    coping: categoryScores.coping.level,
  };

  return {
    answers: normalizedAnswers,
    categoryScores,
    overallScore,
    overallPercentage,
    mindsetProfile,
    strongestCategory,
    weakestCategory,
    indicators,
    strengths,
    areasToFocus,
    recommendations,
    summary,
    // Legacy support
    scores: {
      stress: 100 - categoryScores.academic.percentage,
      depression: 100 - categoryScores.emotional.percentage,
      anxiety: 100 - categoryScores.coping.percentage,
      self_esteem: categoryScores.selfConfidence.percentage,
      academic: categoryScores.academic.percentage,
      social: categoryScores.social.percentage,
    },
    totalScore: overallScore,
    wellbeingScore: overallPercentage,
    risk: overallPercentage >= 70 ? "level_1" : overallPercentage >= 45 ? "level_2" : "level_3",
  };
}

/**
 * Determine Mindset Profile based on scores
 */
function determineMindsetProfile({ overallPercentage, categoryScores, weakestCategoryKey }) {
  const { emotional, academic, selfConfidence, social, coping } = categoryScores;

  if (overallPercentage >= 82 && coping.percentage >= 80) {
    return "Balanced & Resilient";
  }
  if (overallPercentage >= 75 && selfConfidence.percentage >= 70) {
    return "Growth-Oriented";
  }
  if (academic.percentage < 55 && academic.percentage <= emotional.percentage) {
    return "Academically Pressured";
  }
  if (selfConfidence.percentage < 55) {
    return "Self-Confidence Building";
  }
  if (social.percentage < 55 && social.percentage <= academic.percentage) {
    return "Socially Disconnected";
  }
  if (emotional.percentage < 50) {
    return "Emotionally Overwhelmed";
  }
  if (overallPercentage < 45) {
    return "Needs Additional Support";
  }
  if (coping.percentage >= 65) {
    return "Growth-Oriented";
  }
  return "Balanced & Resilient";
}

/**
 * Deterministic Rule-Based Insights (Used directly or as guaranteed fallback)
 */
function generateRuleBasedInsights({
  categoryScores,
  overallPercentage,
  mindsetProfile,
  strongestCategoryKey,
  weakestCategoryKey,
}) {
  const strengths = [];
  const areasToFocus = [];
  const recommendations = [];

  // 1. Determine Strengths
  if (categoryScores.coping.percentage >= 65) {
    strengths.push("Strong adaptive coping and recovery ability when facing challenges");
  }
  if (categoryScores.emotional.percentage >= 65) {
    strengths.push("Good emotional awareness and positive baseline outlook");
  }
  if (categoryScores.selfConfidence.percentage >= 65) {
    strengths.push("Healthy self-belief and willingness to learn from mistakes");
  }
  if (categoryScores.social.percentage >= 65) {
    strengths.push("Positive social connectivity and trust in friends/peers");
  }
  if (categoryScores.academic.percentage >= 65) {
    strengths.push("Effective academic pacing and study stress balance");
  }

  // Ensure at least 2 strengths
  if (strengths.length < 2) {
    strengths.push(`Relatively strongest in ${CATEGORY_METADATA[strongestCategoryKey].title}`);
    strengths.push("Active willingness to self-reflect and build healthy habits");
  }

  // 2. Determine Areas to Focus
  if (categoryScores.academic.percentage < 70) {
    areasToFocus.push("Academic workload planning and exam stress regulation");
  }
  if (categoryScores.emotional.percentage < 70) {
    areasToFocus.push("Managing sudden emotional shifts and daily overwhelm");
  }
  if (categoryScores.selfConfidence.percentage < 70) {
    areasToFocus.push("Building self-compassion and reducing comparison with others");
  }
  if (categoryScores.social.percentage < 70) {
    areasToFocus.push("Reaching out to trusted peers and expressing feelings comfortably");
  }
  if (categoryScores.coping.percentage < 70) {
    areasToFocus.push("Developing regular stress relief habits and structured breaks");
  }

  // Ensure at least 1 focus area
  if (areasToFocus.length === 0) {
    areasToFocus.push("Maintaining current balanced study-rest-personal routine");
  }

  // 3. Generate Practical Personalized Recommendations
  if (categoryScores.academic.percentage < 65) {
    recommendations.push("Break large academic assignments into 25-minute focused blocks (Pomodoro method).");
    recommendations.push("Schedule proactive breaks before feeling mentally exhausted after long study sessions.");
  }
  if (categoryScores.emotional.percentage < 65) {
    recommendations.push("Practice 5-minute deep breathing or mindfulness when feeling emotionally overwhelmed.");
    recommendations.push("Take note of daily positive moments to build emotional stability.");
  }
  if (categoryScores.selfConfidence.percentage < 65) {
    recommendations.push("Acknowledge personal progress each day instead of comparing yourself to peers.");
    recommendations.push("View mistakes as natural milestones in learning new skills.");
  }
  if (categoryScores.social.percentage < 65) {
    recommendations.push("Connect with at least one trusted friend, mentor, or family member when stressed.");
    recommendations.push("Participate in low-pressure group activities or student club discussions.");
  }
  if (categoryScores.coping.percentage < 65) {
    recommendations.push("Incorporate relaxing activities like music, light walking, or hobbies into your daily schedule.");
    recommendations.push("Maintain a consistent sleep routine to restore mental clarity.");
  }

  // Default recommendations if high score
  if (recommendations.length < 3) {
    recommendations.push("Continue your positive daily routine and maintain balance between study and relaxation.");
    recommendations.push("Share positive mindset strategies with peers and celebrate your academic achievements.");
    recommendations.push("Check in regularly on your well-being goals to sustain long-term resilience.");
  }

  const summary = `Your assessment indicates relatively strong ${CATEGORY_METADATA[strongestCategoryKey].title.toLowerCase()} (${categoryScores[strongestCategoryKey].percentage}%), while ${CATEGORY_METADATA[weakestCategoryKey].title.toLowerCase()} (${categoryScores[weakestCategoryKey].percentage}%) appears to be an area that may benefit from mindful attention and practical support.`;

  return {
    strengths: strengths.slice(0, 4),
    areasToFocus: areasToFocus.slice(0, 3),
    recommendations: recommendations.slice(0, 4),
    summary,
  };
}

/**
 * Optional AI Enhancement via Gemini / OpenAI
 * Strict Rule: Scores are NEVER invented by AI.
 */
export async function enhanceWithAiAnalysis(assessmentData) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return assessmentData;
  }

  const prompt = `You are a supportive, ethical student wellness and psychology coach.
A college student completed a 40-question Psychology & Well-Being Screening Assessment.
Here are the backend-calculated scores (DO NOT change or re-calculate scores):
- Overall Well-Being: ${assessmentData.overallPercentage}%
- Emotional Well-Being: ${assessmentData.categoryScores.emotional.percentage}% (${assessmentData.categoryScores.emotional.level})
- Academic Stress Management: ${assessmentData.categoryScores.academic.percentage}% (${assessmentData.categoryScores.academic.level})
- Self-Confidence & Self-Esteem: ${assessmentData.categoryScores.selfConfidence.percentage}% (${assessmentData.categoryScores.selfConfidence.level})
- Social & Relationship Well-Being: ${assessmentData.categoryScores.social.percentage}% (${assessmentData.categoryScores.social.level})
- Coping, Resilience & Mindset: ${assessmentData.categoryScores.coping.percentage}% (${assessmentData.categoryScores.coping.level})
- Strongest Category: ${assessmentData.strongestCategory}
- Area Needing Most Attention: ${assessmentData.weakestCategory}
- Mindset Profile: ${assessmentData.mindsetProfile}

SAFETY GUIDELINES:
1. This is a wellness/mindset screening tool, NOT a medical diagnosis.
2. NEVER say "You have depression", "You have anxiety", or name medical mental disorders.
3. Provide encouraging, supportive, non-judgmental, practical student-focused suggestions.

Return ONLY a valid JSON object matching this schema:
{
  "summary": "2-3 supportive sentences explaining the results constructively",
  "strengths": ["3 positive bullet points highlighting their highest-scoring areas"],
  "areasToFocus": ["2-3 constructive bullet points on areas needing attention"],
  "recommendations": ["3-4 practical, actionable daily wellness and study habits"]
}`;

  try {
    let rawText = "";
    if (process.env.GEMINI_API_KEY) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });
      const data = await res.json();
      rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    if (rawText) {
      const parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());
      if (parsed.summary && Array.isArray(parsed.strengths) && Array.isArray(parsed.recommendations)) {
        return {
          ...assessmentData,
          summary: parsed.summary,
          strengths: parsed.strengths.slice(0, 4),
          areasToFocus: parsed.areasToFocus?.slice(0, 3) || assessmentData.areasToFocus,
          recommendations: parsed.recommendations.slice(0, 4),
        };
      }
    }
  } catch (err) {
    console.warn("AI Assessment enhancement skipped, using rule-based analysis:", err.message);
  }

  return assessmentData;
}

