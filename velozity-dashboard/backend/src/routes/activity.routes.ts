import { Router } from "express";
import { getRecentActivity } from "../controllers/activity.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(getRecentActivity));

export default router;
