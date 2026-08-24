import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getMyProfile,
  updateMyProfile,
  updateAvailability,
  toggleOnlineStatus,
  getMyPatients,
  getPatientDetail,
  changePassword,
  deleteMyAccount,
  getAvailableCounselors,
  getCounselorPublic,
} from "../controllers/counselorController.js";

const router = Router();

// Public: list available counselors
router.get("/available", getAvailableCounselors);
router.get("/public/:id", getCounselorPublic);

// Protected — counselor only
router.use(protect, authorize("counselor"));

router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.put("/availability", updateAvailability);
router.patch("/online", toggleOnlineStatus);
router.get("/patients", getMyPatients);
router.get("/candidates", getMyPatients);
router.get("/patients/:patientId", getPatientDetail);
router.get("/candidates/:patientId", getPatientDetail);
router.put("/change-password", changePassword);
router.delete("/me", deleteMyAccount);

export default router;
