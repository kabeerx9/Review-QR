import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

// Turbopack dev can initialize Prisma before envs are visible to the client runtime.
// Load the project env eagerly so DATABASE_URL is present for auth/API routes.
if (!process.env.DATABASE_URL) {
  loadEnvConfig(process.cwd());
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
