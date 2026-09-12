import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/db";
import { AppError } from "../middleware/errorHandler";

const createProjectSchema = z.object({
  name: z.string().min(1),
  clientName: z.string().min(1),
});

export async function createProject(req: Request, res: Response) {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("name and clientName are required", 400);

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      clientName: parsed.data.clientName,
      createdById: req.user!.userId,
    },
  });

  res.status(201).json({ project });
}

// Admin sees every project. A PM only ever sees projects they created -
// this filter happens here, server-side, not by hiding rows in the UI.
export async function listProjects(req: Request, res: Response) {
  const where = req.user!.role === "ADMIN" ? {} : { createdById: req.user!.userId };

  const projects = await prisma.project.findMany({
    where,
    include: {
      _count: { select: { tasks: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ projects });
}

// Shared helper: throws if a PM is trying to reach a project they don't own.
// Admin always passes. Used by every route that takes a :projectId.
export async function assertCanAccessProject(userId: string, role: string, projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError("Project not found", 404);

  if (role === "PROJECT_MANAGER" && project.createdById !== userId) {
    throw new AppError("You do not manage this project", 403);
  }
  return project;
}

export async function getProject(req: Request, res: Response) {
  const project = await assertCanAccessProject(
    req.user!.userId,
    req.user!.role,
    req.params.id
  );

  const tasks = await prisma.task.findMany({
    where: { projectId: project.id },
    include: { assignedTo: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  res.json({ project, tasks });
}
