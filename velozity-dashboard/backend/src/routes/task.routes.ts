import { Router } from "express";
import { createTask, listTasks, updateTaskStatus } from "../controllers/task.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("ADMIN", "PROJECT_MANAGER"), asyncHandler(createTask));
// All three roles can list tasks - listTasks itself scopes the results per role.
router.get("/", asyncHandler(listTasks));
// All three roles can hit this - updateTaskStatus itself checks ownership.
router.patch("/:id/status", asyncHandler(updateTaskStatus));

export default router;
