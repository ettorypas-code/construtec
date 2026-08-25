import { timingSafeEqual } from "node:crypto";
import { getCurrentUser } from "@/lib/auth/guards";
import { getCompanySettings } from "@/lib/services/catalog";
import {
  buildDailyDigest,
  formatDigestText,
  recordDigestNotification,
} from "@/lib/services/daily-digest";

/**
 * Resumo do dia, para agendador externo.
 *
 * Aceita duas identidades: sessão do painel (você abrindo no navegador) ou o
 * token de `CRON_SECRET` no cabeçalho `Authorization: Bearer …`. Sem `CRON_SECRET`
 * definido, só a sessão vale — não existe endpoint aberto por padrão.
 *
 * Como agendar para as 7h:
 *
 *   Vercel — vercel.json:
 *     { "crons": [{ "path": "/api/resumo-diario", "schedule": "0 10 * * 1-5" }] }
 *     (10h UTC = 7h em Brasília; a Vercel só agenda em UTC)
 *
 *   Windows — Agendador de Tarefas, ação diária:
 *     powershell -Command "Invoke-RestMethod -Uri 'https://SEU-DOMINIO/api/resumo-diario'
 *       -Headers @{Authorization='Bearer SEU_TOKEN'}"
 *
 * O que ele faz: monta o resumo e grava como notificação no app. O envio para
 * WhatsApp ou e-mail depende de provedor e está na Fase 4 — hoje o texto vem na
 * resposta, pronto para ser encaminhado por quem chamou.
 */
export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const [digest, company] = await Promise.all([buildDailyDigest(), getCompanySettings()]);
  const text = formatDigestText(digest, company.name);
  const { created } = await recordDigestNotification(text);

  return Response.json({
    date: digest.date.toISOString(),
    notificationCreated: created,
    counts: {
      compromissos: digest.events.length,
      contatos: digest.contacts.length,
      tarefas: digest.tasks.length,
    },
    text,
  });
}

async function isAuthorized(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET?.trim();

  if (secret) {
    const header = request.headers.get("authorization") ?? "";
    const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (provided && safeEqual(provided, secret)) return true;
  }

  return Boolean(await getCurrentUser());
}

/** Comparação de tempo constante: `===` vazaria o token por tempo de resposta. */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
