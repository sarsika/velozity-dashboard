import { PrismaClient, TaskStatus, Priority } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const PASSWORD = "Password123!";

async function main() {
  console.log("Clearing existing data...");
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  console.log("Creating users...");
  const admin = await prisma.user.create({
    data: { name: "Aarav Admin", email: "admin@velozity.test", passwordHash, role: "ADMIN" },
  });

  const pm1 = await prisma.user.create({
    data: { name: "Priya PM", email: "priya.pm@velozity.test", passwordHash, role: "PROJECT_MANAGER" },
  });
  const pm2 = await prisma.user.create({
    data: { name: "Karthik PM", email: "karthik.pm@velozity.test", passwordHash, role: "PROJECT_MANAGER" },
  });

  const dev1 = await prisma.user.create({
    data: { name: "Ravi Dev", email: "ravi.dev@velozity.test", passwordHash, role: "DEVELOPER" },
  });
  const dev2 = await prisma.user.create({
    data: { name: "Meena Dev", email: "meena.dev@velozity.test", passwordHash, role: "DEVELOPER" },
  });
  const dev3 = await prisma.user.create({
    data: { name: "Suresh Dev", email: "suresh.dev@velozity.test", passwordHash, role: "DEVELOPER" },
  });
  const dev4 = await prisma.user.create({
    data: { name: "Divya Dev", email: "divya.dev@velozity.test", passwordHash, role: "DEVELOPER" },
  });

  console.log("Creating projects...");
  const project1 = await prisma.project.create({
    data: { name: "Retail Analytics Portal", clientName: "Nova Retail Co.", createdById: pm1.id },
  });
  const project2 = await prisma.project.create({
    data: { name: "HealthTrack Mobile App", clientName: "Wellness Partners", createdById: pm1.id },
  });
  const project3 = await prisma.project.create({
    data: { name: "Logistics Tracker", clientName: "SwiftShip Inc.", createdById: pm2.id },
  });

  const daysFromNow = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

  console.log("Creating tasks...");

  const project1Tasks = await Promise.all([
    prisma.task.create({
      data: {
        projectId: project1.id, title: "Design dashboard wireframes",
        assignedToId: dev1.id, status: TaskStatus.DONE, priority: Priority.MEDIUM,
        dueDate: daysFromNow(-10),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project1.id, title: "Build sales chart component",
        assignedToId: dev1.id, status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH,
        dueDate: daysFromNow(3),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project1.id, title: "Set up authentication",
        assignedToId: dev2.id, status: TaskStatus.IN_REVIEW, priority: Priority.CRITICAL,
        dueDate: daysFromNow(1),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project1.id, title: "Fix CSV export bug",
        assignedToId: dev2.id, status: TaskStatus.TODO, priority: Priority.LOW,
        // overdue #1
        dueDate: daysFromNow(-3),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project1.id, title: "Write API documentation",
        assignedToId: dev1.id, status: TaskStatus.TODO, priority: Priority.MEDIUM,
        dueDate: daysFromNow(5),
      },
    }),
  ]);

  const project2Tasks = await Promise.all([
    prisma.task.create({
      data: {
        projectId: project2.id, title: "Implement step tracker screen",
        assignedToId: dev3.id, status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH,
        dueDate: daysFromNow(2),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project2.id, title: "Push notification integration",
        assignedToId: dev3.id, status: TaskStatus.TODO, priority: Priority.MEDIUM,
        dueDate: daysFromNow(7),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project2.id, title: "Fix crash on Android 14",
        assignedToId: dev4.id, status: TaskStatus.TODO, priority: Priority.CRITICAL,
        // overdue #2
        dueDate: daysFromNow(-1),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project2.id, title: "App store listing copy",
        assignedToId: dev4.id, status: TaskStatus.DONE, priority: Priority.LOW,
        dueDate: daysFromNow(-15),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project2.id, title: "Accessibility audit",
        assignedToId: dev3.id, status: TaskStatus.IN_REVIEW, priority: Priority.MEDIUM,
        dueDate: daysFromNow(4),
      },
    }),
  ]);

  const project3Tasks = await Promise.all([
    prisma.task.create({
      data: {
        projectId: project3.id, title: "Real-time GPS map view",
        assignedToId: dev2.id, status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH,
        dueDate: daysFromNow(6),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project3.id, title: "Driver assignment logic",
        assignedToId: dev1.id, status: TaskStatus.TODO, priority: Priority.HIGH,
        dueDate: daysFromNow(8),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project3.id, title: "Route optimisation service",
        assignedToId: dev4.id, status: TaskStatus.TODO, priority: Priority.CRITICAL,
        dueDate: daysFromNow(10),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project3.id, title: "Warehouse inventory sync",
        assignedToId: dev2.id, status: TaskStatus.DONE, priority: Priority.MEDIUM,
        dueDate: daysFromNow(-5),
      },
    }),
    prisma.task.create({
      data: {
        projectId: project3.id, title: "SMS delivery alerts",
        assignedToId: dev1.id, status: TaskStatus.IN_REVIEW, priority: Priority.MEDIUM,
        dueDate: daysFromNow(3),
      },
    }),
  ]);
  await prisma.task.updateMany({
    where: { id: { in: [project1Tasks[3].id, project2Tasks[2].id] } },
    data: { isOverdue: true },
  });

  console.log("Creating activity log entries so the feed isn't empty...");
  await prisma.activityLog.createMany({
    data: [
      { taskId: project1Tasks[0].id, projectId: project1.id, userId: dev1.id, fromStatus: TaskStatus.IN_PROGRESS, toStatus: TaskStatus.DONE },
      { taskId: project1Tasks[2].id, projectId: project1.id, userId: dev2.id, fromStatus: TaskStatus.IN_PROGRESS, toStatus: TaskStatus.IN_REVIEW },
      { taskId: project2Tasks[4].id, projectId: project2.id, userId: dev3.id, fromStatus: TaskStatus.IN_PROGRESS, toStatus: TaskStatus.IN_REVIEW },
      { taskId: project2Tasks[3].id, projectId: project2.id, userId: dev4.id, fromStatus: TaskStatus.IN_PROGRESS, toStatus: TaskStatus.DONE },
      { taskId: project3Tasks[4].id, projectId: project3.id, userId: dev1.id, fromStatus: TaskStatus.IN_PROGRESS, toStatus: TaskStatus.IN_REVIEW },
      { taskId: project3Tasks[3].id, projectId: project3.id, userId: dev2.id, fromStatus: TaskStatus.IN_PROGRESS, toStatus: TaskStatus.DONE },
    ],
  });

  console.log("\nSeed complete. Login with any of these (password: Password123!):");
  console.log(`  Admin:            ${admin.email}`);
  console.log(`  Project Manager:  ${pm1.email}`);
  console.log(`  Project Manager:  ${pm2.email}`);
  console.log(`  Developer:        ${dev1.email}`);
  console.log(`  Developer:        ${dev2.email}`);
  console.log(`  Developer:        ${dev3.email}`);
  console.log(`  Developer:        ${dev4.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
