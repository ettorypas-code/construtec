/**
 * Diagnóstico da configuração do Supabase.
 *
 * Roda antes da migração e diz exatamente o que está errado, em português, em
 * vez de deixar o Prisma cuspir um erro de driver. Cada verificação existe
 * porque é um erro que acontece de verdade na primeira configuração.
 *
 *   npx tsx scripts/verificar-supabase.ts
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

/** `detail` só aparece quando o item falha, salvo se marcado como `info`. */
type Check = { ok: boolean; label: string; detail?: string; info?: boolean };

const checks: Check[] = [];

function add(ok: boolean, label: string, detail?: string, info = false) {
  checks.push({ ok, label, detail, info });
}

function verificarUrls() {
  const url = process.env.DATABASE_URL ?? "";
  const direct = process.env.DIRECT_URL ?? "";

  if (!url) {
    add(false, "DATABASE_URL definida", "Está vazia no .env");
    return;
  }
  add(true, "DATABASE_URL definida");

  if (url.includes("SEU_REF") || url.includes("SENHA")) {
    add(false, "DATABASE_URL preenchida", "Ainda está com o texto de exemplo");
  } else {
    add(true, "DATABASE_URL preenchida");
  }

  // O erro nº 1: usar a conexão direta (5432) como DATABASE_URL. Funciona no
  // começo e depois esgota o limite de conexões da aplicação.
  add(
    url.includes(":6543"),
    "DATABASE_URL usa o pooler (porta 6543)",
    url.includes(":5432")
      ? "Está com a porta 5432 (conexão direta). Use a string do Transaction pooler."
      : undefined,
  );

  add(
    url.includes("pgbouncer=true"),
    "DATABASE_URL tem ?pgbouncer=true",
    "Acrescente ?pgbouncer=true&connection_limit=1 ao fim da string.",
  );

  if (!direct) {
    add(false, "DIRECT_URL definida", "As migrações falham sem ela");
  } else {
    add(true, "DIRECT_URL definida");
    // O erro nº 2: apontar DIRECT_URL para o pooler. A migração falha no meio.
    add(
      direct.includes(":5432"),
      "DIRECT_URL usa conexão direta (porta 5432)",
      direct.includes(":6543")
        ? "Está com a porta 6543 (pooler). Use a string do Direct connection."
        : undefined,
    );
  }

  add(
    url !== direct,
    "As duas URLs são diferentes",
    url === direct ? "Você colou a mesma string nas duas." : undefined,
  );
}

async function verificarBanco() {
  const db = new PrismaClient();
  try {
    await db.$queryRaw`SELECT 1`;
    add(true, "Conexão com o banco");

    const tabelas = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    const total = Number(tabelas[0]?.count ?? 0);
    add(
      true,
      `Tabelas no banco: ${total}`,
      total === 0 ? "Banco vazio — rode: npm run db:deploy" : undefined,
      true,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    let dica = message.split("\n")[0];

    if (message.includes("password authentication failed")) {
      dica = "Senha incorreta. É a senha definida na criação do projeto Supabase.";
    } else if (message.includes("ENOTFOUND") || message.includes("getaddrinfo")) {
      dica = "Host não encontrado. Confira se copiou a string inteira.";
    } else if (message.includes("Tenant or user not found")) {
      dica = "Usuário inválido. No pooler ele é 'postgres.SEU_REF', não só 'postgres'.";
    }

    add(false, "Conexão com o banco", dica);
  } finally {
    await db.$disconnect();
  }
}

async function verificarStorage() {
  const driver = process.env.STORAGE_DRIVER?.trim() || "local";

  if (driver === "local") {
    add(true, "Armazenamento: disco local (desenvolvimento)");
    return;
  }

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "construtec";

  if (!url || !key) {
    add(false, "Credenciais do Supabase Storage", "Faltam SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
    return;
  }
  add(true, "Credenciais do Supabase Storage");

  try {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await client.storage.listBuckets();

    if (error) {
      add(false, "Acesso ao Storage", error.message);
      return;
    }

    const encontrado = data?.find((b) => b.name === bucket);
    if (!encontrado) {
      add(false, `Bucket "${bucket}" existe`, `Buckets encontrados: ${data?.map((b) => b.name).join(", ") || "nenhum"}`);
      return;
    }

    add(true, `Bucket "${bucket}" existe`);
    // Bucket público exporia foto do interior de imóvel de cliente por URL.
    add(
      !encontrado.public,
      `Bucket "${bucket}" é privado`,
      encontrado.public
        ? "ATENÇÃO: está público. Qualquer pessoa com o link vê as fotos dos clientes."
        : undefined,
    );
  } catch (error) {
    add(false, "Acesso ao Storage", error instanceof Error ? error.message : String(error));
  }
}

function verificarChaves() {
  const session = process.env.SESSION_SECRET ?? "";
  add(
    session.length >= 32 && !session.startsWith("dev-only"),
    "SESSION_SECRET forte",
    session.startsWith("dev-only")
      ? "Ainda é a chave de desenvolvimento. Troque antes de publicar."
      : session.length < 32
        ? "Precisa ter pelo menos 32 caracteres."
        : undefined,
  );
}

async function main() {
  console.log("\nVerificando configuração…\n");

  verificarUrls();
  verificarChaves();
  await verificarBanco();
  await verificarStorage();

  for (const check of checks) {
    console.log(`${check.ok ? "  ok  " : "  --  "} ${check.label}`);
    if (check.detail && (!check.ok || check.info)) {
      console.log(`         ${check.detail}`);
    }
  }

  const falhas = checks.filter((c) => !c.ok).length;
  console.log(
    falhas === 0
      ? "\nTudo certo. Próximo passo: npm run db:deploy && npm run db:seed\n"
      : `\n${falhas} ${falhas === 1 ? "item precisa" : "itens precisam"} de ajuste.\n`,
  );

  process.exitCode = falhas === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
