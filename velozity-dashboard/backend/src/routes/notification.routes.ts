import { Router } from "express";
import { listNotifications, markRead, markAllRead } from "../controllers/notification.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(listNotifications));
router.patch("/:id/read", asyncHandler(markRead));
router.patch("/read-all", asyncHandler(markAllRead));

export default router;
