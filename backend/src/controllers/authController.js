import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
} from "../utils/token.js";
import { sendEmail } from "../services/emailService.js";

const cookieOptions = () => ({
  httpOnly: true,
  // In production the frontend and backend live on different origins, so the
  // refresh cookie must be sent cross-site: SameSite=None + Secure=true.
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, cookieOptions());
}

const commonValidations = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

/**
 * Register - role must be 'patient' or 'counselor'.
 * Cross-role duplicate emails are prevented via unique index; we also check and
 * direct the user to the correct portal on login.
 */
export async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  let role = req.body.role;
  if (role === "patient") role = "candidate";
  if (role !== "candidate" && role !== "counselor" && role !== "parent") {
    return res.status(400).json({ error: "Invalid role" });
  }

  const existing = await User.findOne({ email: req.body.email.toLowerCase() });
  if (existing) {
    const existingRole = existing.role === "patient" ? "candidate" : existing.role;
    if (existingRole !== role) {
      const roleNames = { counselor: "Counselor", candidate: "Candidate", parent: "Parent" };
      const correctName = roleNames[existingRole] || existingRole;
      return res.status(400).json({
        error: `An account with this email already exists as a ${correctName}. Please use ${correctName} login.`,
      });
    }
    return res.status(400).json({ error: "An account with this email already exists." });
  }

  const common = {
    email: req.body.email.toLowerCase(),
    password: req.body.password,
    phone: req.body.phone || "",
    photo: req.body.photo || "",
  };

  let userData;
  if (role === "candidate") {
    userData = {
      ...common,
      role: "candidate",
      fullName: req.body.fullName,
      dob: req.body.dob || null,
      age: req.body.age || null,
      gender: req.body.gender || "",
      college: req.body.college || "",
      department: req.body.department || "",
      year: req.body.year || "",
      registerNumber: req.body.registerNumber || "",
      parentName: req.body.parentName || "",
      parentPhone: req.body.parentPhone || "",
      bestFriendName: req.body.bestFriendName || "",
      bestFriendPhone: req.body.bestFriendPhone || "",
      emergencyContact: req.body.emergencyContact || "",
      bloodGroup: req.body.bloodGroup || "",
      address: req.body.address || "",
      city: req.body.city || "",
      state: req.body.state || "",
      country: req.body.country || "",
      pinCode: req.body.pinCode || "",
      emergencyContacts: Array.isArray(req.body.emergencyContacts) ? req.body.emergencyContacts : [],
      permissions: req.body.permissions || {},
    };
  } else if (role === "parent") {
    userData = {
      ...common,
      role: "parent",
      fullName: req.body.fullName,
      occupation: req.body.occupation || "",
      relationshipToStudent: req.body.relationshipToStudent || "Parent",
      alternatePhone: req.body.alternatePhone || "",
      address: req.body.address || "",
      city: req.body.city || "",
      state: req.body.state || "",
      country: req.body.country || "",
    };
  } else {
    userData = {
      ...common,
      role: "counselor",
      qualification: req.body.qualification || "",
      specialization: req.body.specialization || "",
      experience: req.body.experience || 0,
      hospital: req.body.hospital || "",
      clinic: req.body.clinic || "",
      licenseNumber: req.body.licenseNumber || "",
      languages: Array.isArray(req.body.languages) ? req.body.languages : [],
      district: req.body.district || "",
      city: req.body.city || "",
      state: req.body.state || "",
      address: req.body.address || "",
      consultationFee: req.body.consultationFee || 0,
      consultationType: req.body.consultationType || "both",
      about: req.body.about || "",
    };
  }

  const user = await User.create(userData);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();
  setRefreshCookie(res, refreshToken);

  res.status(201).json({
    message: "Registration successful",
    role: user.role === "patient" ? "candidate" : user.role,
    user: user.toPublicJSON(),
    accessToken,
  });
}

/**
 * Login - enforces portal/role matching.
 */
export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, portal } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (!user.isActive || user.isDeleted) {
    return res.status(403).json({ error: "This account has been deactivated." });
  }

  // Cross-portal login blocking
  const userRole = user.role === "patient" ? "candidate" : user.role;
  const requestedRole = portal === "counselor" ? "counselor" : portal === "parent" ? "parent" : "candidate";

  if (userRole !== requestedRole) {
    const roleNames = { counselor: "Counselor", candidate: "Candidate", parent: "Parent" };
    const correctPortal = roleNames[userRole] || userRole;
    return res.status(403).json({
      error: `This account belongs to a ${correctPortal}. Please use ${correctPortal} Login.`,
      role: userRole,
    });
  }

  if (req.body.refreshToken) {
    const isRefreshValid = await User.findOne({
      refreshToken: req.body.refreshToken,
    });
    if (!isRefreshValid) {
      return res.status(401).json({ error: "Session expired, please login again." });
    }
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();
  setRefreshCookie(res, refreshToken);

  res.json({
    message: "Login successful",
    role: user.role,
    user: user.toPublicJSON(),
    accessToken,
  });
}

export async function refreshAccessToken(req, res) {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  try {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId).select("+refreshToken");
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    const accessToken = generateAccessToken(user);
    res.json({ accessToken, user: user.toPublicJSON() });
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
}

export async function logout(req, res) {
  if (req.user) {
    req.user.refreshToken = null;
    await req.user.save();
  }
  res.clearCookie("refreshToken", cookieOptions());
  res.json({ message: "Logged out successfully" });
}

export async function forgotPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  if (!user) {
    // Do not reveal whether email exists
    return res.json({ message: "If that email exists, a reset link has been sent." });
  }

  const frontendUrl = req.body.redirectBase || process.env.FRONTEND_URL || "http://localhost:5173";
  const resetToken = generateResetToken(user);
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&role=${user.role}`;

  await sendEmail({
    recipientId: user._id,
    to: user.email,
    type: "password_reset",
    subject: "Reset Your Password - Mental Health Support System",
    html: `
      <h2>Hello,</h2>
      <p>You requested to reset your password.</p>
      <p>Click the link below to set a new password. This link is valid for 15 minutes.</p>
      <a href="${resetUrl}">Reset Password</a>
    `,
  });

  res.json({ message: "If that email exists, a reset link has been sent." });
}

export async function resetPassword(req, res) {
  const { token, email, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("+password");
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });
    if (user.email !== email.toLowerCase()) {
      return res.status(400).json({ error: "Email does not match token" });
    }
    user.password = newPassword;
    user.refreshToken = null;
    await user.save();
    res.json({ message: "Password reset successfully. Please login." });
  } catch {
    return res.status(400).json({ error: "Invalid or expired token" });
  }
}

/**
 * PUT /api/auth/language
 * Update user's preferred language
 */
export async function updateLanguage(req, res) {
  try {
    const { language } = req.body;
    if (!language || typeof language !== "string") {
      return res.status(400).json({ error: "Valid language code is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferredLanguage: language.trim().toLowerCase() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Language updated successfully",
      preferredLanguage: user.preferredLanguage,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const authValidation = {
  registerPatient: [
    body("fullName").notEmpty().withMessage("Full name required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  registerParent: [
    body("fullName").notEmpty().withMessage("Full name required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  registerCounselor: [
    body("qualification").notEmpty().withMessage("Qualification required"),
    body("licenseNumber").notEmpty().withMessage("License number required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  login: [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  forgotPassword: [body("email").isEmail().withMessage("Valid email required")],
};

