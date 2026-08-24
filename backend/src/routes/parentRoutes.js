import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getParentDashboard,
  getLinkedStudents,
  requestStudentLink,
  getParentAlerts,
  acknowledgeAlert,
  getParentAppointments,
  getParentProfile,
  updateParentProfile,
} from "../controllers/parentController.js";

const router = Router();

router.use(protect, authorize("parent"));

router.get("/dashboard", getParentDashboard);
router.get("/students", getLinkedStudents);
router.post("/link/request", requestStudentLink);
router.get("/alerts", getParentAlerts);
router.post("/alerts/:id/acknowledge", acknowledgeAlert);
router.get("/appointments", getParentAppointments);
router.get("/profile", getParentProfile);
router.put("/profile", updateParentProfile);

export default router;
