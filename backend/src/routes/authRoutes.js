import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  updateLanguage,
  getMe,
  authValidation,
} from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.post("/register/candidate", validate(authValidation.registerPatient), register);
router.post("/register/patient", validate(authValidation.registerPatient), register);
router.post("/register/parent", validate(authValidation.registerParent), register);
router.post("/register/counselor", validate(authValidation.registerCounselor), register);
router.post("/login", validate(authValidation.login), login);
router.post("/refresh", refreshAccessToken);
router.post("/forgot-password", validate(authValidation.forgotPassword), forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", protect, logout);
router.put("/language", protect, updateLanguage);
router.get("/me", protect, getMe);

export default router;
