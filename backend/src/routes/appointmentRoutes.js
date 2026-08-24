import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  bookAppointment,
  getDoctorSlotAvailability,
  getCounselorAppointments,
  getPatientAppointments,
  getCounselorDashboardStats,
  acceptAppointment,
  rejectAppointment,
  rescheduleAppointment,
  cancelAppointment,
  getAppointment,
} from "../controllers/appointmentController.js";

const router = Router();

// Public / Pre-auth or authenticated availability check
router.get("/availability", getDoctorSlotAvailability);
router.get("/counselor/:id/availability", getDoctorSlotAvailability);

router.use(protect);

// candidate / patient
router.post("/", bookAppointment);
router.get("/candidate", getPatientAppointments);
router.get("/patient", getPatientAppointments);

// counselor
router.get("/counselor", getCounselorAppointments);
router.get("/counselor/stats", getCounselorDashboardStats);

// shared
router.get("/:id", getAppointment);

// counselor / patient actions
router.post("/:id/accept", acceptAppointment);
router.post("/:id/reject", rejectAppointment);
router.post("/:id/reschedule", rescheduleAppointment);
router.post("/:id/cancel", cancelAppointment);

export default router;
