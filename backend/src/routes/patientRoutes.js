import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

router.use(protect, authorize("patient", "candidate"));

// Get / update my patient profile
router.get("/me", async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ user: user.toPublicJSON() });
});

router.put("/me", async (req, res) => {
  const allowed = [
    "fullName", "dob", "age", "gender", "college", "department", "year",
    "registerNumber", "phone", "parentName", "parentPhone", "bestFriendName",
    "bestFriendPhone", "emergencyContact", "bloodGroup", "address", "city",
    "state", "country", "pinCode", "photo", "emergencyContacts", "permissions",
  ];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json({ message: "Profile updated", user: user.toPublicJSON() });
});

router.put("/permissions", async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { permissions: { ...req.user.permissions, ...req.body.permissions } },
    { new: true }
  );
  res.json({ message: "Permissions updated", user: user.toPublicJSON() });
});

/**
 * Store the patient's location for nearby-counselor recommendations.
 * SECURITY: only city/state are stored — never precise coordinates —
 * and only what is genuinely needed for the counselor search.
 */
router.put("/location", async (req, res) => {
  const { city, state, country } = req.body;
  const updates = {};
  if (city !== undefined && typeof city === "string") updates.city = city.slice(0, 100);
  if (state !== undefined && typeof state === "string") updates.state = state.slice(0, 100);
  if (country !== undefined && typeof country === "string") updates.country = country.slice(0, 100);

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json({ message: "Location updated", user: user.toPublicJSON() });
});

router.put("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new password required" });
  }
  const user = await User.findById(req.user._id).select("+password");
  const ok = await user.comparePassword(currentPassword);
  if (!ok) return res.status(400).json({ error: "Current password is incorrect" });
  user.password = newPassword;
  await user.save();
  res.json({ message: "Password changed successfully" });
});

export default router;
