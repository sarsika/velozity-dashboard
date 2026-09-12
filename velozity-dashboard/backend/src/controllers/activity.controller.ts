import { Request, Response } from "express";
import prisma from "../config/db";

// GET /api/activity?projectId=
// This is the "catch-up" fetch - always reads from Postgres, never from
// an in-memory buffer, so it works correctly even after a server restart.
export async function getRecentActivity(req: Request, res: Response) {
  const user = req.user!;
  const { projectId } = req.query;

  const where: any = {};

  if (user.role === "ADMIN") {
    // sees everything
  } else if (user.role === "PROJECT_MANAGER") {
    where.project = { createdById: user.userId };
  } else {
    // DEVELOPER: only activity on tasks assigned to them
    where.task = { assignedToId: user.userId };
  }

  if (projectId) where.projectId = String(projectId);

  const logs = await prisma.activityLog.findMany({
    where,
    include: {
      user: { select: { name: true } },
      task: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  res.json({
    activity: logs.map((log: (typeof logs)[number]) => ({
      id: log.id,
      projectId: log.projectId,
      taskTitle: log.task.title,
      userName: log.user.name,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      createdAt: log.createdAt,
    })),
  });
}
