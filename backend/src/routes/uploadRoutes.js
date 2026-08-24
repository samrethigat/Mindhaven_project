import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { uploadMiddleware, uploadFile } from "../controllers/uploadController.js";

const router = Router();

router.use(protect);
router.post("/", uploadMiddleware("file"), uploadFile);

export default router;
