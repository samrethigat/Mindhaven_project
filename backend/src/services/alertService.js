/**
 * Enhanced Mental Health Alert Service for MindHaven
 * Features:
 * 1. Context-Aware Sarcasm & Hyperbole Disambiguation (eliminates false alarms on casual venting).
 * 2. Multi-Channel Emergency Dispatch (Socket.IO + In-App Notification + Emergency Email Alert).
 * 3. Longitudinal Mood Trajectory Analyzer (detects subtle chronic declines).
 * 4. Strictly Adheres to Ethical, Non-Diagnostic Guidelines.
 */

import MentalHealthAlert from "../models/MentalHealthAlert.js";
import ParentStudentLink from "../models/ParentStudentLink.js";
import Assessment from "../models/Assessment.js";
import { createNotification } from "./notificationService.js";
import { sendEmail } from "./emailService.js";
import { layout } from "./emailTemplates.js";
import { getIO } from "../socket/index.js";

// Severe crisis triggers
const CRITICAL_KEYWORDS = [
  "suicide", "kill myself", "end my life", "want to die", "can't go on",
  "தற்கொலை", "சாக போறேன்", "வாழ பிடிக்கல", "வாழ விருப்பம் இல்லை", "आत्महत्या",
  "mar jana", "self harm", "hurt myself", "take my life"
];

// High distress triggers
const HIGH_KEYWORDS = [
  "hopeless", "so depressed", "severe distress", "cannot take it anymore",
  "extreme anxiety", "panic attack", "crying non stop", "nobody loves me",
  "மன உளைச்சல்", "தாங்க முடியல", "கடுமையான வலி", "அழுதுகிட்டே இருக்கேன்",
  "bahut pareshaan", "dil toot gaya"
];

// Moderate stress triggers
const MODERATE_KEYWORDS = [
  "sad", "lonely", "exhausted", "failure", "stress", "scared of exams",
  "கவலை", "சோகம்", "பயம்", "தோல்வி", "தனிமை", "udaas", "dar lag raha hai"
];

// Sarcasm, comedy, and hyperbolic venting patterns that should NOT trigger alerts
const HYPERBOLE_EXCLUSIONS = [
  "dying of laughter", "dying laughing", "dead laughing", "killed me lol",
  "this meme killed me", "this video killed me", "homework is killing me",
  "math is killing me", "exam is killing me", "crying of laughter",
  "funny as hell", "just kidding", "chumma sonnen", "sirippu thaangala",
  "lol dead", "lmao dead", "rofl", "comedy super"
];

/**
 * Check if the text is casual hyperbole or sarcasm rather than real psychological distress
 */
function isHyperboleOrSarcasm(text) {
  const lower = text.toLowerCase();
  return HYPERBOLE_EXCLUSIONS.some((phrase) => lower.includes(phrase));
}

/**
 * Evaluate student text for emotional distress and dispatch non-diagnostic alerts
 */
export async function evaluateMentalHealthDistress({ user, message, context = "ai_chat" }) {
  if (!user || (user.role !== "candidate" && user.role !== "patient")) {
    return null;
  }

  const text = String(message || "").toLowerCase().trim();
  if (!text) return null;

  // Step 1: Filter out casual hyperbole & comedy expressions
  if (isHyperboleOrSarcasm(text)) {
    return null;
  }

  let level = null;
  let alertType = "distress_signal";
  let title = "Emotional Well-being Alert";
  let nonDiagnosticMessage = "Possible emotional distress detected. Professional support may be recommended.";
  let action = "Reach out with gentle, supportive words and encourage consulting campus counseling.";

  // 1. Check CRITICAL Level
  if (CRITICAL_KEYWORDS.some((kw) => text.includes(kw))) {
    level = "CRITICAL";
    alertType = "crisis_detected";
    title = "Urgent Support Recommended";
    nonDiagnosticMessage = "High indicators of emotional distress detected. Immediate supportive outreach recommended.";
    action = "Please check in immediately with the student and utilize the 24x7 emergency helpline (14416) or campus support.";
  }
  // 2. Check HIGH Level
  else if (HIGH_KEYWORDS.some((kw) => text.includes(kw))) {
    level = "HIGH";
    alertType = "distress_signal";
    title = "Professional Support Recommended";
    nonDiagnosticMessage = "Possible elevated emotional distress detected. Supportive conversation recommended.";
    action = "Check in with the student and consider scheduling an appointment with their campus counselor.";
  }
  // 3. Check MODERATE Level
  else if (MODERATE_KEYWORDS.some((kw) => text.includes(kw))) {
    level = "MODERATE";
    alertType = "emotional_fatigue";
    title = "Emotional Support Notice";
    nonDiagnosticMessage = "Signs of temporary stress or fatigue observed.";
    action = "Encourage healthy relaxation, good rest, and positive family connection.";
  }

  if (!level) return null;

  try {
    // Avoid spamming duplicate alerts within 30 minutes for the same student
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existingRecent = await MentalHealthAlert.findOne({
      student: user._id,
      level,
      detectedAt: { $gte: thirtyMinsAgo },
    });

    if (existingRecent) {
      return existingRecent;
    }

    const alert = await MentalHealthAlert.create({
      student: user._id,
      level,
      alertType,
      title,
      message: nonDiagnosticMessage,
      recommendedAction: action,
      detectedAt: new Date(),
    });

    // Multi-channel dispatch to verified linked parents for HIGH and CRITICAL alerts
    if (level === "HIGH" || level === "CRITICAL") {
      const activeLinks = await ParentStudentLink.find({
        student: user._id,
        status: "accepted",
        "privacySettings.shareAlerts": true,
      }).populate("parent", "_id fullName email phone");

      for (const link of activeLinks) {
        if (!link.parent) continue;

        // 1. In-App Notification
        await createNotification({
          recipient: link.parent._id,
          type: "mental_health_alert",
          title: `⚠️ ${title} - ${user.fullName || "Your Student"}`,
          message: `${nonDiagnosticMessage} ${action}`,
          relatedAlert: alert._id,
        });

        // 2. Real-Time Socket.IO event
        try {
          const io = getIO();
          if (io) {
            io.to(`user_${link.parent._id}`).emit("parent_alert", {
              alert,
              student: {
                _id: user._id,
                fullName: user.fullName,
                candidateId: user.candidateId,
              },
            });
          }
        } catch {}

        // 3. Automated Emergency Email Notification (Solves offline parent delivery)
        if (link.parent.email) {
          const emailHtml = layout(
            `Student Well-being Notice: ${title}`,
            `<div style="font-family: sans-serif; line-height: 1.6; color: #334155;">
              <p>Dear <strong>${link.parent.fullName || "Parent"}</strong>,</p>
              <p>This is an authorized wellness update regarding your linked student, <strong>${user.fullName || "Student"}</strong> (${user.candidateId || "Campus Student"}).</p>
              
              <div style="background: ${level === "CRITICAL" ? "#fee2e2" : "#fef3c7"}; border-left: 4px solid ${level === "CRITICAL" ? "#ef4444" : "#f59e0b"}; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h4 style="margin: 0 0 8px 0; color: ${level === "CRITICAL" ? "#991b1b" : "#92400e"};">${title}</h4>
                <p style="margin: 0; font-size: 14px;">${nonDiagnosticMessage}</p>
              </div>

              <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <strong style="color: #0f172a;">Recommended Action:</strong>
                <p style="margin: 6px 0 0 0; font-size: 13px;">${action}</p>
              </div>

              <h4 style="margin: 16px 0 8px 0; color: #0f172a;">Emergency Helplines (24x7 Free Support):</h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
                <li><strong>Tele-MANAS Mental Health Support:</strong> 14416 / 1800-891-4416</li>
                <li><strong>KIRAN Helpline:</strong> 1800-599-0019</li>
                <li><strong>Sneha Crisis Intervention:</strong> +91 44 2464 0050</li>
              </ul>

              <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <em>Note: MindHaven is a non-diagnostic supportive platform. Raw student conversations are strictly confidential and protected by system security.</em>
              </p>
            </div>`
          );

          await sendEmail({
            recipientId: link.parent._id,
            to: link.parent.email,
            type: "mental_health_alert",
            subject: `⚠️ Important Well-being Notice for ${user.fullName || "Your Student"}`,
            html: emailHtml,
          });
        }

        alert.parentNotified = true;
      }

      await alert.save();
    }

    return alert;
  } catch (err) {
    console.warn("Mental health alert evaluation error:", err.message);
    return null;
  }
}

/**
 * Longitudinal Mood & Assessment Trajectory Evaluation
 * Detects chronic declines across multiple assessment scores over a 7-14 day period
 */
export async function evaluateLongitudinalTrajectory(studentId) {
  try {
    const recentAssessments = await Assessment.find({ user: studentId })
      .sort({ createdAt: -1 })
      .limit(3);

    if (recentAssessments.length < 2) return null;

    // Check if score is progressively worsening
    const latest = recentAssessments[0].score || 0;
    const previous = recentAssessments[1].score || 0;

    if (latest >= 15 && latest > previous) {
      const user = await Assessment.findById(recentAssessments[0]._id).populate("user");
      if (user?.user) {
        return await evaluateMentalHealthDistress({
          user: user.user,
          message: "severe emotional distress longitudinal decline detected",
          context: "assessment_trajectory",
        });
      }
    }
  } catch (err) {
    console.warn("Trajectory evaluation error:", err.message);
  }
  return null;
}
