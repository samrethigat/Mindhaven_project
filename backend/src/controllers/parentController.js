import User from "../models/User.js";
import ParentStudentLink from "../models/ParentStudentLink.js";
import MentalHealthAlert from "../models/MentalHealthAlert.js";
import Appointment from "../models/Appointment.js";
import Notification from "../models/Notification.js";
import Assessment from "../models/Assessment.js";
import { createNotification } from "../services/notificationService.js";
import { sendEmail } from "../services/emailService.js";

/**
 * GET /api/parent/dashboard
 */
export async function getParentDashboard(req, res) {
  try {
    const parentId = req.user._id;

    // 1. Fetch all accepted student links
    const links = await ParentStudentLink.find({ parent: parentId, status: "accepted" })
      .populate(
        "student",
        "fullName email candidateId college department year phone photo gender age location preferredLanguage"
      );

    const studentSummaries = [];
    const permittedStudentIds = [];

    for (const link of links) {
      if (!link.student) continue;
      const s = link.student;
      permittedStudentIds.push(s._id);

      // Latest assessments / distress indicators
      const [latestAlerts, latestAssessment, latestAppointments] = await Promise.all([
        MentalHealthAlert.find({ student: s._id }).sort({ detectedAt: -1 }).limit(5),
        Assessment.findOne({ user: s._id }).sort({ createdAt: -1 }),
        link.privacySettings?.shareAppointments
          ? Appointment.find({ candidate: s._id, status: { $in: ["pending", "confirmed"] } })
              .populate("counselor", "fullName photo specialization hospital clinic phone")
              .sort({ date: 1 })
              .limit(3)
          : Promise.resolve([]),
      ]);

      // Calculate Well-being Status
      let wellbeingStatus = "Normal";
      let wellbeingBadgeColor = "emerald";

      const activeCritical = latestAlerts.find((a) => a.status === "active" && a.level === "CRITICAL");
      const activeHigh = latestAlerts.find((a) => a.status === "active" && a.level === "HIGH");
      const activeModerate = latestAlerts.find((a) => a.status === "active" && a.level === "MODERATE");

      if (activeCritical) {
        wellbeingStatus = "Urgent Support Recommended";
        wellbeingBadgeColor = "rose";
      } else if (activeHigh) {
        wellbeingStatus = "Professional Support Recommended";
        wellbeingBadgeColor = "amber";
      } else if (activeModerate) {
        wellbeingStatus = "Needs Attention";
        wellbeingBadgeColor = "yellow";
      }

      studentSummaries.push({
        student: {
          _id: s._id,
          fullName: s.fullName,
          email: s.email,
          candidateId: s.candidateId,
          college: s.college,
          department: s.department,
          year: s.year,
          photo: s.photo,
          gender: s.gender,
          age: s.age,
        },
        relationship: link.relationship,
        linkId: link._id,
        privacySettings: link.privacySettings,
        wellbeingStatus,
        wellbeingBadgeColor,
        activeAlertsCount: latestAlerts.filter((a) => a.status === "active").length,
        recentAlerts: link.privacySettings?.shareAlerts ? latestAlerts.slice(0, 3) : [],
        upcomingAppointments: latestAppointments,
        latestAssessmentScore: latestAssessment?.score || null,
      });
    }

    // 2. Fetch Parent Notifications
    const notifications = await Notification.find({ recipient: parentId })
      .sort({ createdAt: -1 })
      .limit(10);

    // 3. Fetch System Emergency Contacts
    const emergencyHotlines = [
      { name: "National Tele-MANAS Mental Health Helpline", phone: "14416 / 1800-891-4416", available: "24x7 Free" },
      { name: "KIRAN Mental Health Rehabilitation Helpline", phone: "1800-599-0019", available: "24x7 Multilingual" },
      { name: "Sneha India Crisis Support", phone: "+91 44 2464 0050", available: "24 Hours" },
      { name: "Campus Emergency Health Center", phone: "+91 94440 00000", available: "Emergency On-Duty" },
    ];

    res.json({
      parent: req.user.toPublicJSON(),
      students: studentSummaries,
      totalLinkedStudents: studentSummaries.length,
      notifications,
      emergencyHotlines,
    });
  } catch (error) {
    console.error("Parent dashboard error:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/parent/students
 */
export async function getLinkedStudents(req, res) {
  try {
    const links = await ParentStudentLink.find({ parent: req.user._id })
      .populate("student", "fullName email candidateId college department year phone photo gender age bloodGroup")
      .sort({ createdAt: -1 });

    res.json({ links });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/parent/link/request
 * Parent initiates link request to student
 */
export async function requestStudentLink(req, res) {
  try {
    const { studentEmail, studentId, relationship } = req.body;
    if (!studentEmail && !studentId) {
      return res.status(400).json({ error: "Student email or Candidate ID required" });
    }

    const query = { role: { $in: ["candidate", "patient"] }, isActive: true };
    if (studentEmail) query.email = studentEmail.toLowerCase().trim();
    if (studentId) query.$or = [{ candidateId: studentId.trim() }, { registerNumber: studentId.trim() }];

    const student = await User.findOne(query);
    if (!student) {
      return res.status(404).json({ error: "Student account not found with the provided details." });
    }

    const existingLink = await ParentStudentLink.findOne({
      parent: req.user._id,
      student: student._id,
    });

    if (existingLink) {
      if (existingLink.status === "accepted") {
        return res.status(400).json({ error: "You are already linked with this student." });
      }
      if (existingLink.status === "pending") {
        return res.status(400).json({ error: "A link request is already pending approval by the student." });
      }
      // Re-request if previously rejected or revoked
      existingLink.status = "pending";
      existingLink.relationship = relationship || existingLink.relationship;
      existingLink.requestedAt = new Date();
      existingLink.initiatedBy = "parent";
      await existingLink.save();

      await createNotification({
        recipient: student._id,
        type: "parent_link_request",
        title: "New Parent Link Request",
        message: `${req.user.fullName || "Your Parent"} (${relationship || "Parent"}) has requested to link with your student account.`,
      });

      return res.json({ message: "Link request sent to student successfully", link: existingLink });
    }

    const linkingCode = Math.floor(100000 + Math.random() * 900000).toString();

    const link = await ParentStudentLink.create({
      parent: req.user._id,
      student: student._id,
      relationship: relationship || req.user.relationshipToStudent || "Parent",
      status: "pending",
      verificationStatus: "pending",
      initiatedBy: "parent",
      linkingCode,
      requestedAt: new Date(),
    });

    // Notify Student
    await createNotification({
      recipient: student._id,
      type: "parent_link_request",
      title: "New Parent Link Request",
      message: `${req.user.fullName || "Your Parent"} (${relationship || "Parent"}) has requested to link with your student account.`,
    });

    res.status(201).json({ message: "Link request sent to student successfully", link });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/parent/alerts
 */
export async function getParentAlerts(req, res) {
  try {
    const links = await ParentStudentLink.find({
      parent: req.user._id,
      status: "accepted",
      "privacySettings.shareAlerts": true,
    });

    const studentIds = links.map((l) => l.student);
    const alerts = await MentalHealthAlert.find({ student: { $in: studentIds } })
      .populate("student", "fullName candidateId photo college department year")
      .sort({ detectedAt: -1 });

    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/parent/alerts/:id/acknowledge
 */
export async function acknowledgeAlert(req, res) {
  try {
    const alert = await MentalHealthAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: "Alert not found" });

    // Verify parent is linked to this student
    const link = await ParentStudentLink.findOne({
      parent: req.user._id,
      student: alert.student,
      status: "accepted",
    });

    if (!link) return res.status(403).json({ error: "Unauthorized access to alert" });

    alert.status = "acknowledged";
    alert.acknowledgedAt = new Date();
    await alert.save();

    res.json({ message: "Alert acknowledged", alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/parent/appointments
 */
export async function getParentAppointments(req, res) {
  try {
    const links = await ParentStudentLink.find({
      parent: req.user._id,
      status: "accepted",
      "privacySettings.shareAppointments": true,
    });

    const studentIds = links.map((l) => l.student);
    const appointments = await Appointment.find({ candidate: { $in: studentIds } })
      .populate("candidate", "fullName candidateId photo college department year")
      .populate("counselor", "fullName photo specialization hospital clinic phone consultationType consultationFee")
      .sort({ date: -1 });

    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/parent/profile
 */
export async function getParentProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/parent/profile
 */
export async function updateParentProfile(req, res) {
  try {
    const allowed = [
      "fullName", "phone", "alternatePhone", "occupation", "relationshipToStudent",
      "address", "city", "state", "country", "photo", "preferredLanguage",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ message: "Profile updated successfully", user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
