import { PrismaClient } from "@prisma/client";

                                                                            
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | null | undefined };

export const prisma: PrismaClient | null =
  globalForPrisma.prisma ??
  (process.env.DATABASE_URL
    ? new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      })
    : null);

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
