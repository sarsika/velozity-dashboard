import { Request, Response } from "express";
import prisma from "../config/db";
import { getOnlineUserCount } from "../sockets";

export async function adminDashboard(_req: Request, res: Response) {
  const [totalProjects, totalTasks, overdueCount, byStatus] = await Promise.all([
    prisma.project.count(),
    prisma.task.count(),
    prisma.task.count({ where: { isOverdue: true } }),
    prisma.task.groupBy({ by: ["status"], _count: true }),
  ]);

  res.json({
    totalProjects,
    totalTasks,
    tasksByStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count })),
    overdueTaskCount: overdueCount,
    activeUsersOnline: getOnlineUserCount(),
  });
}

export async function pmDashboard(req: Request, res: Response) {
  const userId = req.user!.userId;

  const projects = await prisma.project.findMany({
    where: { createdById: userId },
    include: { _count: { select: { tasks: true } } },
  });

  const projectIds = projects.map((p: any) => p.id);

  const [byStatus, byPriority, upcomingDue] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      where: { projectId: { in: projectIds } },
      _count: true,
    }),
    prisma.task.groupBy({
      by: ["priority"],
      where: { projectId: { in: projectIds } },
      _count: true,
    }),
    prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
  ]);

  res.json({
    projectsSummary: projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      clientName: p.clientName,
      taskCount: p._count.tasks,
    })),
    tasksByStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count })),
    tasksByPriority: byPriority.map((p: any) => ({ priority: p.priority, count: p._count })),
    upcomingDueThisWeek: upcomingDue,
  });
}

export async function developerDashboard(req: Request, res: Response) {
  const userId = req.user!.userId;

  const tasks = await prisma.task.findMany({
    where: { assignedToId: userId },
    include: { project: { select: { name: true } } },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
  });

  res.json({ tasks });
}
