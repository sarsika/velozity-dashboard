import { PrismaClient } from "@prisma/client";

// Reuse one client across the app instead of creating a new one per file -
// otherwise you exhaust the Postgres connection pool fast.
const prisma = new PrismaClient();

export default prisma;
