import cron from "node-cron";
import prisma from "../config/db";

// node-cron over Bull here on purpose: this job has no job-specific data,
// no retries, and nothing to queue - it's a single sweep query on a
// timer. Bull needs Redis running just for this one job, which is more
// infra than the task justifies. If we later needed per-task delayed
// jobs (e.g. "notify 1 hour before due"), Bull would be the right call.
export function startOverdueChecker() {
  // Runs every 5 minutes. Marking overdue is a background sweep, not
  // something computed when a page happens to load.
  cron.schedule("*/5 * * * *", async () => {
    const now = new Date();

    const result = await prisma.task.updateMany({
      where: {
        dueDate: { lt: now },
        status: { not: "DONE" },
        isOverdue: false,
      },
      data: { isOverdue: true },
    });

    if (result.count > 0) {
      console.log(`[overdueChecker] flagged ${result.count} task(s) as overdue`);
    }
  });

  console.log("[overdueChecker] scheduled every 5 minutes");
}
