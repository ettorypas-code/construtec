/**
 * Troca o e-mail e a senha de um usuário.
 *
 * A senha é digitada aqui no terminal e não aparece na tela, no histórico do
 * shell nem em nenhum arquivo — vai direto para o bcrypt. É por isso que este
 * script existe em vez de uma variável de ambiente.
 *
 *   npx tsx scripts/trocar-senha.ts
 *
 * Enquanto não existir tela de troca de senha no app (Fase 2), este é o
 * caminho oficial.
 */

import { createInterface } from "node:readline";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const BCRYPT_ROUNDS = 12;
const MIN_LENGTH = 10;

function perguntar(pergunta: string, oculto = false): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  if (!oculto) {
    return new Promise((resolve) => rl.question(pergunta, (resposta) => {
      rl.close();
      resolve(resposta.trim());
    }));
  }

  // Sem eco: silencia `stdout.write` enquanto a senha é digitada, para que o
  // terminal não mostre nada. Restaura antes de devolver.
  return new Promise((resolve) => {
    const original = process.stdout.write.bind(process.stdout);
    let silenciado = false;

    process.stdout.write = ((chunk: string | Uint8Array, ...args: unknown[]) =>
      silenciado
        ? true
        : original(chunk as string, ...(args as []))) as typeof process.stdout.write;

    rl.question(pergunta, (resposta) => {
      silenciado = false;
      process.stdout.write = original;
      rl.close();
      original("\n");
      resolve(resposta.trim());
    });

    silenciado = true;
  });
}

async function main() {
  const usuarios = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true },
  });

  if (usuarios.length === 0) {
    console.log("Nenhum usuário no banco. Rode `npm run db:seed` primeiro.");
    return;
  }

  console.log("\nUsuários cadastrados:");
  for (const usuario of usuarios) {
    console.log(`  ${usuario.email}  (${usuario.name})`);
  }
  console.log("");

  const alvo = await perguntar("E-mail do usuário a alterar: ");
  const usuario = usuarios.find((u) => u.email === alvo.toLowerCase());

  if (!usuario) {
    console.log(`\nUsuário "${alvo}" não encontrado.`);
    process.exitCode = 1;
    return;
  }

  const novoEmail = await perguntar(`Novo e-mail (Enter mantém ${usuario.email}): `);
  const senha = await perguntar("Nova senha (não aparece na tela): ", true);
  const confirmacao = await perguntar("Repita a senha: ", true);

  if (senha !== confirmacao) {
    console.log("\nAs senhas não conferem. Nada foi alterado.");
    process.exitCode = 1;
    return;
  }

  if (senha.length < MIN_LENGTH) {
    console.log(`\nA senha precisa ter pelo menos ${MIN_LENGTH} caracteres. Nada foi alterado.`);
    process.exitCode = 1;
    return;
  }

  const email = (novoEmail || usuario.email).toLowerCase();

  if (email !== usuario.email) {
    const jaExiste = await db.user.findUnique({ where: { email } });
    if (jaExiste) {
      console.log(`\nJá existe usuário com o e-mail ${email}. Nada foi alterado.`);
      process.exitCode = 1;
      return;
    }
  }

  await db.user.update({
    where: { id: usuario.id },
    data: { email, passwordHash: await bcrypt.hash(senha, BCRYPT_ROUNDS) },
  });

  console.log(`\nPronto. Entre com ${email} e a senha nova.\n`);
}

main()
  .catch((erro) => {
    console.error("Falhou:", erro instanceof Error ? erro.message : erro);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
