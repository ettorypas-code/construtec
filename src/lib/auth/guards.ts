import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { UserRole } from "@/domain/enums";
import { readSession } from "./session";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

/**
 * Usuário da requisição atual, ou `null`.
 *
 * `cache()` deduplica a leitura dentro de um mesmo render: um layout, três
 * páginas e cinco componentes podem chamar isto sem gerar cinco consultas.
 *
 * O cookie carrega o papel, mas quem manda é o banco: um usuário desativado ou
 * removido perde o acesso na hora, sem esperar o token expirar.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await readSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, active: true },
  });

  if (!user || !user.active) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  };
});

/** Exige sessão válida. Redireciona para o login quando não há. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Exige sessão válida com um dos papéis informados. */
export async function requireRole(...roles: UserRole[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

export function requireAdmin(): Promise<CurrentUser> {
  return requireRole(UserRole.ADMIN);
}
