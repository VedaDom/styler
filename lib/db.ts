import { PrismaClient } from "@prisma/client";

// Ensure a singleton Prisma client across hot reloads in Next.js dev
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = global as any as { prisma?: PrismaClient };

export const db: PrismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
