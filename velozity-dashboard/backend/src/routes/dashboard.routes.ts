import { Router } from "express";
import { adminDashboard, pmDashboard, developerDashboard } from "../controllers/dashboard.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(requireAuth);

router.get("/admin", requireRole("ADMIN"), asyncHandler(adminDashboard));
router.get("/pm", requireRole("PROJECT_MANAGER"), asyncHandler(pmDashboard));
router.get("/developer", requireRole("DEVELOPER"), asyncHandler(developerDashboard));

export default router;
