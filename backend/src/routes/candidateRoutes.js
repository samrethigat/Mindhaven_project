import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getProfile,
  updateProfile,
  updatePermissions,
  updateLocation,
  changePassword,
  getParentLinks,
  approveParentLink,
  rejectParentLink,
  revokeParentLink,
  updateParentLinkPrivacy,
} from "../controllers/candidateController.js";

const router = Router();

router.use(protect, authorize("candidate", "patient"));

router.get("/me", getProfile);
router.put("/me", updateProfile);
router.put("/permissions", updatePermissions);
router.put("/location", updateLocation);
router.put("/change-password", changePassword);

// Parent Linking Routes
router.get("/parent-links", getParentLinks);
router.post("/parent-links/:id/approve", approveParentLink);
router.post("/parent-links/:id/reject", rejectParentLink);
router.post("/parent-links/:id/revoke", revokeParentLink);
router.put("/parent-links/:id/privacy", updateParentLinkPrivacy);

export default router;
