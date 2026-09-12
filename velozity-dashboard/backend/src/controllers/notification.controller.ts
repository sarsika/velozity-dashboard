import { Request, Response } from "express";
import prisma from "../config/db";
import { getIO } from "../sockets";

// Used internally by task.controller - creates the DB row AND pushes a
// live update to that specific user so the badge count updates without
// a page refresh or polling.
export async function createNotification(userId: string, message: string, taskId?: string) {
  const notification = await prisma.notification.create({
    data: { userId, message, taskId },
  });

  getIO().to(`user:${userId}`).emit("notification:new", notification);

  return notification;
}

export async function listNotifications(req: Request, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ notifications });
}

export async function markRead(req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.userId },
    data: { isRead: true },
  });
  res.json({ message: "Marked as read" });
}

export async function markAllRead(req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, isRead: false },
    data: { isRead: true },
  });
  res.json({ message: "All marked as read" });
}
