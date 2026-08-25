import { PrismaClient } from "@prisma/client";

/**
 * Singleton do Prisma. Em desenvolvimento o hot reload recria o módulo a cada
 * alteração; sem o cache global isso abriria uma conexão nova por reload até
 * estourar o limite do banco.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
