import User from "../models/User.js";
import ParentStudentLink from "../models/ParentStudentLink.js";
import { createNotification } from "../services/notificationService.js";

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const allowed = [
      "fullName", "dob", "age", "gender", "college", "department", "year",
      "registerNumber", "phone", "parentName", "parentPhone", "bestFriendName",
      "bestFriendPhone", "emergencyContact", "bloodGroup", "address", "city",
      "state", "country", "pinCode", "photo", "emergencyContacts", "permissions",
      "preferredLanguage",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ message: "Profile updated", user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updatePermissions(req, res) {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { permissions: { ...req.user.permissions, ...req.body.permissions } },
      { new: true }
    );
    res.json({ message: "Permissions updated", user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateLocation(req, res) {
  try {
    const { city, state, country, lat, lng } = req.body;
    const updates = {};
    if (city !== undefined && typeof city === "string") updates.city = city.slice(0, 100);
    if (state !== undefined && typeof state === "string") updates.state = state.slice(0, 100);
    if (country !== undefined && typeof country === "string") updates.country = country.slice(0, 100);

    if (lat !== undefined && lng !== undefined) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      if (!isNaN(latitude) && !isNaN(longitude)) {
        updates.location = {
          type: "Point",
          coordinates: [longitude, latitude],
        };
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ message: "Location updated", user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function changePassword(req, res) {
  try {
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Parent Linking Handlers for Candidate
 */

export async function getParentLinks(req, res) {
  try {
    const links = await ParentStudentLink.find({ student: req.user._id })
      .populate("parent", "fullName email phone photo occupation relationshipToStudent")
      .sort({ createdAt: -1 });

    res.json({ links });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function approveParentLink(req, res) {
  try {
    const link = await ParentStudentLink.findOne({
      _id: req.params.id,
      student: req.user._id,
    });
    if (!link) return res.status(404).json({ error: "Link request not found" });

    link.status = "accepted";
    link.verificationStatus = "verified";
    link.approvedAt = new Date();
    link.linkedAt = new Date();
    await link.save();

    // Also update parent's students array
    await User.findByIdAndUpdate(link.parent, {
      $addToSet: { students: req.user._id },
    });

    await createNotification({
      recipient: link.parent,
      type: "parent_link_accepted",
      title: "Parent Link Approved",
      message: `${req.user.fullName || "Student"} has accepted your linking request. You can now view their well-being updates.`,
    });

    res.json({ message: "Parent link accepted successfully", link });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function rejectParentLink(req, res) {
  try {
    const link = await ParentStudentLink.findOne({
      _id: req.params.id,
      student: req.user._id,
    });
    if (!link) return res.status(404).json({ error: "Link request not found" });

    link.status = "rejected";
    await link.save();

    await createNotification({
      recipient: link.parent,
      type: "parent_link_rejected",
      title: "Parent Link Declined",
      message: `The student has declined your linking request.`,
    });

    res.json({ message: "Link request declined", link });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function revokeParentLink(req, res) {
  try {
    const link = await ParentStudentLink.findOne({
      _id: req.params.id,
      student: req.user._id,
    });
    if (!link) return res.status(404).json({ error: "Link not found" });

    link.status = "revoked";
    await link.save();

    await User.findByIdAndUpdate(link.parent, {
      $pull: { students: req.user._id },
    });

    res.json({ message: "Parent link revoked successfully", link });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateParentLinkPrivacy(req, res) {
  try {
    const link = await ParentStudentLink.findOne({
      _id: req.params.id,
      student: req.user._id,
    });
    if (!link) return res.status(404).json({ error: "Link not found" });

    const { shareAlerts, shareAppointments, shareGeneralWellbeing, shareCounselorInfo } = req.body;

    link.privacySettings = {
      ...link.privacySettings,
      ...(shareAlerts !== undefined ? { shareAlerts } : {}),
      ...(shareAppointments !== undefined ? { shareAppointments } : {}),
      ...(shareGeneralWellbeing !== undefined ? { shareGeneralWellbeing } : {}),
      ...(shareCounselorInfo !== undefined ? { shareCounselorInfo } : {}),
      sharePrivateChats: false, // strictly false
    };

    await link.save();
    res.json({ message: "Privacy settings updated", link });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
