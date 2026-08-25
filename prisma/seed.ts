/**
 * Seed do Construtec.
 *
 * Idempotente: pode rodar quantas vezes for necessário. Popula o que é
 * conhecimento de domínio (catálogo, checklists, biblioteca de problemas,
 * automações) e cria o usuário administrador.
 *
 *   npm run db:seed     — popula sem apagar
 *   npm run db:reset    — recria o banco do zero e popula
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { serviceCatalog } from "./seed-data/service-catalog";
import { checklistTemplates } from "./seed-data/checklists";
import { findingLibrary } from "./seed-data/finding-library";
import { automationRules } from "./seed-data/automations";

const db = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@construtec.local").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "construtec123";
  const name = process.env.SEED_ADMIN_NAME ?? "Administrador";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  usuário administrador já existe (${email})`);
    return;
  }

  await db.user.create({
    data: {
      email,
      name,
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    },
  });
  console.log(`  usuário administrador criado: ${email}`);
}

async function seedCompanySettings() {
  await db.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Construtec",
      legalName: null,
      councilType: "NENHUM",
      canIssueArt: false,
      defaultBdiPercent: 25,
      defaultValidityDays: 15,
      defaultPaymentTerms: "50% na assinatura e 50% na entrega do relatório.",
      proposalFooterNotes:
        "Proposta válida pelo prazo indicado. Valores sujeitos a revisão após o vencimento.",
      reportFooterNotes:
        "Este documento registra as condições observadas na data da vistoria e destina-se " +
        "ao uso do contratante junto à construtora ou responsável pela execução.",
    },
  });
  console.log("  configurações da empresa prontas");
}

async function seedServices() {
  let tierCount = 0;

  for (const { priceTiers, ...service } of serviceCatalog) {
    const saved = await db.serviceType.upsert({
      where: { code: service.code },
      update: {
        name: service.name,
        category: service.category,
        shortPitch: service.shortPitch,
        description: service.description,
        basePriceCents: service.basePriceCents,
        priceNote: service.priceNote,
        restrictionLevel: service.restrictionLevel,
        requiresTechnicalResponsible: service.requiresTechnicalResponsible,
        requiresArtRrt: service.requiresArtRrt,
        legalNotes: service.legalNotes,
        defaultDocumentKind: service.defaultDocumentKind,
        isAddon: service.isAddon ?? false,
        sortOrder: service.sortOrder,
      },
      create: { ...service, isAddon: service.isAddon ?? false },
    });

    // As faixas são substituídas por inteiro: manter faixa antiga junto com a
    // nova produziria duas respostas para o mesmo m².
    await db.servicePriceTier.deleteMany({ where: { serviceTypeId: saved.id } });

    if (priceTiers?.length) {
      await db.servicePriceTier.createMany({
        data: priceTiers.map((tier, index) => ({
          serviceTypeId: saved.id,
          label: tier.label,
          maxAreaSqm: tier.maxAreaSqm,
          priceCents: tier.priceCents,
          note: tier.note ?? null,
          sortOrder: index,
        })),
      });
      tierCount += priceTiers.length;
    }
  }

  const addons = serviceCatalog.filter((service) => service.isAddon).length;
  console.log(
    `  ${serviceCatalog.length - addons} serviços + ${addons} adicionais, ${tierCount} faixas de preço`,
  );
}

async function seedChecklists() {
  for (const template of checklistTemplates) {
    const existing = await db.checklistTemplate.findFirst({ where: { name: template.name } });

    if (existing) {
      // Modelo já existe: os ambientes e itens são deixados como estão (podem ter
      // sido ajustados pelo usuário), mas a escala de avaliação é atualizada —
      // ela é configuração, não conteúdo.
      if (existing.ratingScale !== template.ratingScale) {
        await db.checklistTemplate.update({
          where: { id: existing.id },
          data: { ratingScale: template.ratingScale },
        });
      }
      continue;
    }

    const serviceType = template.serviceCode
      ? await db.serviceType.findUnique({ where: { code: template.serviceCode } })
      : null;

    await db.checklistTemplate.create({
      data: {
        name: template.name,
        propertyKind: template.propertyKind,
        description: template.description,
        isDefault: template.isDefault,
        ratingScale: template.ratingScale,
        serviceTypeId: serviceType?.id ?? null,
        rooms: {
          create: template.rooms.map((room, roomIndex) => ({
            name: room.name,
            sortOrder: roomIndex,
            items: {
              create: room.items.map((item, itemIndex) => ({
                label: item.label,
                category: item.category,
                sortOrder: itemIndex,
              })),
            },
          })),
        },
      },
    });
  }

  const roomCount = checklistTemplates.reduce((total, t) => total + t.rooms.length, 0);
  const itemCount = checklistTemplates.reduce(
    (total, t) => total + t.rooms.reduce((sum, room) => sum + room.items.length, 0),
    0,
  );
  console.log(
    `  ${checklistTemplates.length} modelos de checklist (${roomCount} ambientes, ${itemCount} itens)`,
  );
}

async function seedFindingLibrary() {
  for (const finding of findingLibrary) {
    const existing = await db.findingLibrary.findFirst({
      where: { title: finding.title, category: finding.category },
    });
    if (existing) continue;
    await db.findingLibrary.create({ data: finding });
  }
  console.log(`  ${findingLibrary.length} problemas na biblioteca`);
}

async function seedAutomations() {
  for (const rule of automationRules) {
    const existing = await db.automationRule.findFirst({ where: { name: rule.name } });
    if (existing) continue;
    await db.automationRule.create({
      data: {
        name: rule.name,
        trigger: rule.trigger,
        actions: JSON.stringify(rule.actions),
        enabled: true,
      },
    });
  }
  console.log(`  ${automationRules.length} automações instaladas`);
}

async function main() {
  console.log("Populando o Construtec…");
  await seedCompanySettings();
  await seedAdmin();
  await seedServices();
  await seedChecklists();
  await seedFindingLibrary();
  await seedAutomations();
  console.log("Pronto.");
}

main()
  .catch((error) => {
    console.error("Falha no seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
