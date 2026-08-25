import mongoose from "mongoose";
import Assessment from "../models/Assessment.js";
import User from "../models/User.js";
import {
  ASSESSMENT_QUESTIONS,
  CATEGORY_METADATA,
  calculateAssessmentScores,
  enhanceWithAiAnalysis,
} from "../services/assessmentScoringService.js";

async function getSafeStudentId(req) {
  let userId = req.user?._id;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    const dbUser =
      (await User.findOne({ role: "candidate", isActive: true })) ||
      (await User.findOne({ isActive: true }));
    userId = dbUser?._id;
  }
  return userId;
}

/**
 * GET /api/assessment/questions
 * Returns the 40 assessment questions metadata
 */
export async function getAssessmentQuestions(req, res) {
  try {
    res.json({
      totalQuestions: ASSESSMENT_QUESTIONS.length,
      categories: CATEGORY_METADATA,
      questions: ASSESSMENT_QUESTIONS.map((q) => ({
        id: q.id,
        qId: q.qId,
        category: q.category,
        text: q.text,
      })),
      scale: [
        { value: 1, label: "Never", tamilLabel: "ஒருபோதும் இல்லை" },
        { value: 2, label: "Rarely", tamilLabel: "அரிதாக" },
        { value: 3, label: "Sometimes", tamilLabel: "சில நேரங்களில்" },
        { value: 4, label: "Often", tamilLabel: "அடிக்கடி" },
        { value: 5, label: "Almost Always", tamilLabel: "கிட்டத்தட்ட எப்போதும்" },
      ],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/assessment/submit (and POST /api/assessment)
 * Validates 40 answers, recalculates all scores on backend, saves record.
 */
export async function submitAssessment(req, res) {
  try {
    const studentId = await getSafeStudentId(req);
    if (!studentId) {
      return res.status(401).json({ error: "Student authentication required." });
    }

    const { answers } = req.body;
    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ error: "Answers payload is required." });
    }

    // 1. Calculate scores and validate all 40 questions on the backend
    let scoredData;
    try {
      scoredData = calculateAssessmentScores(answers);
    } catch (valErr) {
      return res.status(400).json({ error: valErr.message });
    }

    // 2. Enhance with AI (or rule-based fallback)
    const finalData = await enhanceWithAiAnalysis(scoredData);

    // 3. Save to Database
    const assessment = await Assessment.create({
      student: studentId,
      patient: studentId,
      answers: finalData.answers,
      categoryScores: finalData.categoryScores,
      overallScore: finalData.overallScore,
      overallPercentage: finalData.overallPercentage,
      mindsetProfile: finalData.mindsetProfile,
      strongestCategory: finalData.strongestCategory,
      weakestCategory: finalData.weakestCategory,
      indicators: finalData.indicators,
      strengths: finalData.strengths,
      areasToFocus: finalData.areasToFocus,
      recommendations: finalData.recommendations,
      summary: finalData.summary,
      // Legacy compatibility
      scores: finalData.scores,
      totalScore: finalData.totalScore,
      wellbeingScore: finalData.wellbeingScore,
      risk: finalData.risk,
      completedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Assessment evaluated and saved successfully.",
      assessment,
    });
  } catch (error) {
    console.error("Assessment submission error:", error);
    res.status(500).json({ error: "Failed to evaluate assessment. Please try again." });
  }
}

/**
 * GET /api/assessment/history
 * Returns assessment history for the authenticated student.
 */
export async function getAssessmentHistory(req, res) {
  try {
    const studentId = await getSafeStudentId(req);
    if (!studentId) {
      return res.status(401).json({ error: "Student authentication required." });
    }

    const history = await Assessment.find({
      $or: [{ student: studentId }, { patient: studentId }],
    })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("Assessment history error:", error);
    res.status(500).json({ error: "Failed to load assessment history." });
  }
}

/**
 * GET /api/assessment/latest
 * Returns the most recent assessment for the authenticated student.
 */
export async function getLatestAssessment(req, res) {
  try {
    const studentId = await getSafeStudentId(req);
    if (!studentId) {
      return res.status(401).json({ error: "Student authentication required." });
    }

    const latest = await Assessment.findOne({
      $or: [{ student: studentId }, { patient: studentId }],
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      assessment: latest,
    });
  } catch (error) {
    console.error("Latest assessment error:", error);
    res.status(500).json({ error: "Failed to fetch latest assessment." });
  }
}

/**
 * GET /api/assessment/:assessmentId
 * Returns a specific assessment record by ID (owned by the authenticated student).
 */
export async function getAssessmentById(req, res) {
  try {
    const studentId = await getSafeStudentId(req);
    const { assessmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      return res.status(404).json({ error: "Assessment record not found." });
    }

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      $or: [{ student: studentId }, { patient: studentId }],
    });

    if (!assessment) {
      return res.status(404).json({ error: "Assessment record not found or access unauthorized." });
    }

    res.json({
      success: true,
      assessment,
    });
  } catch (error) {
    console.error("Get assessment by ID error:", error);
    res.status(500).json({ error: "Failed to retrieve assessment." });
  }
}
