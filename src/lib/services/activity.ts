import "server-only";

import { db } from "@/lib/db";

/**
 * Registro de atividade.
 *
 * Dois papéis: alimentar a timeline do dashboard e servir de trilha de acesso a
 * dados pessoais para a LGPD. Nunca deve derrubar a operação que o originou —
 * se o log falhar, a ação principal já aconteceu e o usuário não tem culpa.
 */
export async function logActivity(input: {
  userId?: string | null;
  action: string;
  summary: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        summary: input.summary,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (error) {
    console.error("[activity] falha ao registrar atividade", error);
  }
}

export type ActivityEntry = {
  id: string;
  summary: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: Date;
};

export async function recentActivity(limit = 12): Promise<ActivityEntry[]> {
  return db.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      summary: true,
      action: true,
      entityType: true,
      entityId: true,
      createdAt: true,
    },
  });
}
