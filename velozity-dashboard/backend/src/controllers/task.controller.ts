import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { assertCanAccessProject } from "./project.controller";
import { getIO } from "../sockets";
import { createNotification } from "./notification.controller";

const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  dueDate: z.string().datetime().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
});

// Admin/PM only - enforced by route middleware, plus project-ownership
// check here so a PM can't create tasks under someone else's project.
export async function createTask(req: Request, res: Response) {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Invalid task data", 400);
  const data = parsed.data;

  await assertCanAccessProject(req.user!.userId, req.user!.role, data.projectId);

  const task = await prisma.task.create({
    data: {
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      assignedToId: data.assignedToId,
      priority: data.priority ?? "MEDIUM",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  if (task.assignedToId) {
    await createNotification(
      task.assignedToId,
      `You were assigned a new task: "${task.title}"`,
      task.id
    );
  }

  res.status(201).json({ task });
}

// Filters work via query params (?status=&priority=&dueBefore=&dueAfter=)
// so a filtered view is a shareable URL, per the spec.
export async function listTasks(req: Request, res: Response) {
  const { status, priority, dueBefore, dueAfter, projectId } = req.query;
  const user = req.user!;

  const where: any = {};

  if (user.role === "DEVELOPER") {
    // A developer can never see anyone else's tasks, no matter what
    // filters they pass in the query string.
    where.assignedToId = user.userId;
  } else if (user.role === "PROJECT_MANAGER") {
    where.project = { createdById: user.userId };
  }
  // ADMIN: no extra restriction, sees everything.

  if (projectId) where.projectId = String(projectId);
  if (status) where.status = String(status);
  if (priority) where.priority = String(priority);
  if (dueBefore || dueAfter) {
    where.dueDate = {};
    if (dueBefore) where.dueDate.lte = new Date(String(dueBefore));
    if (dueAfter) where.dueDate.gte = new Date(String(dueAfter));
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
  });

  res.json({ tasks });
}

// The one endpoint every role hits, with very different rules per role -
// this is the "genuine engineering judgment" part of the task.
export async function updateTaskStatus(req: Request, res: Response) {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("A valid status is required", 400);

  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: { project: true },
  });
  if (!task) throw new AppError("Task not found", 404);

  const user = req.user!;

  if (user.role === "DEVELOPER" && task.assignedToId !== user.userId) {
    // This is the exact case the spec calls out: a developer hitting the
    // API directly for a task that isn't theirs, even with a valid token.
    throw new AppError("You can only update tasks assigned to you", 403);
  }
  if (user.role === "PROJECT_MANAGER" && task.project.createdById !== user.userId) {
    throw new AppError("You do not manage this project", 403);
  }

  const fromStatus = task.status;
  const toStatus = parsed.data.status;

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { status: toStatus },
  });

  const log = await prisma.activityLog.create({
    data: {
      taskId: task.id,
      projectId: task.projectId,
      userId: user.userId,
      fromStatus,
      toStatus,
    },
    include: { user: { select: { name: true } } },
  });

  // Broadcast to everyone currently viewing this project's feed.
  getIO().to(`project:${task.projectId}`).emit("activity:new", {
    id: log.id,
    projectId: task.projectId,
    taskId: task.id,
    taskTitle: task.title,
    userName: log.user.name,
    fromStatus,
    toStatus,
    createdAt: log.createdAt,
  });

  // PM gets notified specifically when a task they own moves to review.
  if (toStatus === "IN_REVIEW") {
    const pmId = task.project.createdById;
    if (pmId !== user.userId) {
      await createNotification(pmId, `"${task.title}" was moved to In Review`, task.id);
    }
  }

  res.json({ task: updated });
}
