import { Router } from "express";
import { createProject, listProjects, getProject } from "../controllers/project.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("ADMIN", "PROJECT_MANAGER"), asyncHandler(createProject));
router.get("/", requireRole("ADMIN", "PROJECT_MANAGER"), asyncHandler(listProjects));
router.get("/:id", requireRole("ADMIN", "PROJECT_MANAGER"), asyncHandler(getProject));

export default router;
