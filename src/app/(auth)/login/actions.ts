"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { publicFormAction } from "@/lib/actions/action";
import { BusinessError } from "@/lib/actions/result";
import { createSessionCookie, destroySessionCookie } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validation/auth";
import type { UserRole } from "@/domain/enums";
import { logActivity } from "@/lib/services/activity";

/**
 * A mensagem de erro é a mesma para e-mail inexistente e senha errada — não
 * entregar quais e-mails existem no sistema é o mínimo em uma tela de login
 * exposta publicamente.
 */
const INVALID_CREDENTIALS = "E-mail ou senha incorretos.";

export const loginAction = publicFormAction({
  schema: loginSchema,
  handler: async ({ email, password, redirectTo }) => {
    const user = await db.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      throw new BusinessError(INVALID_CREDENTIALS);
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      throw new BusinessError(INVALID_CREDENTIALS);
    }

    await createSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    });

    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logActivity({
      userId: user.id,
      action: "login",
      summary: `${user.name} entrou no sistema`,
    });

    redirect(safeRedirect(redirectTo));
  },
});

export async function logoutAction() {
  await destroySessionCookie();
  redirect("/login");
}

/** Só aceita caminho interno — bloqueia open redirect via ?redirect=. */
function safeRedirect(target: string | undefined): string {
  if (!target) return "/dashboard";
  if (!target.startsWith("/") || target.startsWith("//")) return "/dashboard";
  return target;
}
