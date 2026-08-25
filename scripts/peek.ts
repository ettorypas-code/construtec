/**
 * Inspeção rápida do banco em desenvolvimento.
 *   npx tsx scripts/peek.ts task
 *   npx tsx scripts/peek.ts lead notification
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type Delegate = { findMany: (args?: unknown) => Promise<unknown[]> };

async function main() {
  const models = process.argv.slice(2);
  if (models.length === 0) {
    console.log("Informe ao menos um modelo. Ex.: npx tsx scripts/peek.ts task lead");
    return;
  }

  for (const model of models) {
    const delegate = (db as unknown as Record<string, Delegate>)[model];
    if (!delegate?.findMany) {
      console.log(`\n### ${model}: modelo desconhecido`);
      continue;
    }
    const rows = await delegate.findMany({ take: 20 });
    console.log(`\n### ${model} (${rows.length})`);
    console.dir(rows, { depth: 3 });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
