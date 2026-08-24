import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { handleGlobalSearch } from "../controllers/searchController.js";

const router = Router();

router.use(protect);

router.get("/global", handleGlobalSearch);

export default router;
