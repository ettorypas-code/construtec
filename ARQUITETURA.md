# CONSTRUTEC — Arquitetura do Produto

> Sistema operacional pessoal para prestação de serviços de construção civil.
> **CAPTAR → VENDER → EXECUTAR → DOCUMENTAR → COBRAR → FIDELIZAR**

---

## 1. Visão geral

O Construtec não é um cadastro de clientes. É um **fluxo de trabalho executável**: cada
tela existe para mover um trabalho de um estágio para o próximo, e cada estágio deixa
para trás um artefato reutilizável (lead → proposta → vistoria → relatório → cobrança).

Três decisões definem o produto:

**a) Mono-usuário primeiro, multi-tenant depois.** Não existe `tenantId` espalhado pelo
schema. Existe um `User` com papel (`ADMIN`, `CLIENT`, `ARCHITECT`) e um registro
singleton `CompanySettings`. Quando fizer sentido virar SaaS, a migração é adicionar
`organizationId` nas tabelas raiz e um filtro na camada de repositório — que já é o
único ponto que fala com o banco.

**b) O celular é o cliente primário do módulo de vistoria.** Esse módulo foi desenhado
para ser usado de pé, dentro de um apartamento, com uma mão. Todo o resto do sistema é
responsivo; a vistoria é *mobile-first de verdade*: sem formulário longo, sem navegação
aninhada, botões de 56px, câmera nativa e upload que começa antes de você terminar de
escrever.

**c) Guarda de terminologia legal embutida no domínio.** O sistema nunca gera um
documento chamado "laudo técnico" sem que exista um responsável técnico habilitado
configurado. Isso não é um aviso na UI — é uma regra no serviço de geração de documentos
(`lib/compliance/`), que decide o título, o rodapé e o disclaimer do PDF a partir do
cadastro do profissional. Ver seção 9.4.

---

## 2. Arquitetura

Aplicação Next.js única (App Router) rodando em três "superfícies" dentro do mesmo
deploy:

```
┌─────────────────────────────────────────────────────────────────┐
│  SUPERFÍCIES                                                     │
│                                                                  │
│  (public)          (app)                    (portal)             │
│  Landing pages     Painel administrativo    Portal cliente/      │
│  SEO + captação    Uso interno (ADMIN)      arquiteto (futuro)   │
│  Sem auth          Sessão obrigatória       Sessão + escopo      │
│                                                                  │
│  + /p/[token]  → páginas públicas por token (proposta, relatório)│
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│  APLICAÇÃO (Server Actions + Route Handlers)                     │
│                                                                  │
│  actions/     validação Zod → autorização → serviço → revalidate │
│  api/         apenas onde precisa de HTTP real:                  │
│               upload de arquivo, stream de PDF, webhooks         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│  DOMÍNIO (lib/)                                                  │
│                                                                  │
│  services/    regra de negócio, orquestração, emite eventos      │
│  repositories/ único ponto que toca o Prisma                     │
│  compliance/  guarda de terminologia e habilitação profissional  │
│  pricing/     custo direto, perdas, BDI, margem, preço de venda  │
│  pdf/         documentos como componentes React                  │
│  automation/  event bus + regras QUANDO/FAZER                    │
│  ai/          adapter de IA (sempre sugestivo, nunca decisório)  │
│  storage/     adapter de arquivos (disco local ↔ S3/Supabase)    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│  INFRA                                                           │
│  Prisma → SQLite (dev) / PostgreSQL (produção)                   │
│  Storage → disco local (dev) / S3 compatível (produção)          │
└──────────────────────────────────────────────────────────────────┘
```

### Fluxo de uma escrita

Toda mutação passa pelo mesmo caminho, sem exceção:

```
Componente cliente
  → Server Action
      1. schema.parse(input)         ← Zod, falha vira erro de campo na UI
      2. requireUser(role)           ← sessão + papel
      3. service.doThing(user, dto)  ← regra de negócio
           ├─ repository.*           ← Prisma
           └─ events.emit(...)       ← dispara automações
      4. revalidatePath(...)
      5. return { ok } | { error }   ← nunca lança para o cliente
```

O retorno é sempre um `ActionResult<T>` discriminado. O componente não precisa de
try/catch; ele lê `result.ok`.

### Por que Server Actions e não uma API REST

A aplicação tem um único consumidor (o próprio front) no MVP. Uma API REST completa
seria uma camada de tradução sem cliente que a justifique. Quando existir app mobile
nativo ou integração WhatsApp, os **services** já estão isolados — expor `/api/v1/*`
sobre eles é mecânico. Route Handlers ficam reservados para o que Server Action não
faz bem: upload multipart, stream binário de PDF e webhooks de terceiros.

---

## 3. Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server Components reduzem JS no celular, que é onde o app dói |
| Linguagem | TypeScript `strict` | Contrato de tipos do banco até a UI |
| UI | React 19 + Tailwind CSS v4 | Tokens em CSS custom properties, sem runtime de tema |
| Componentes | Próprios, sobre Radix-free primitives | Sem biblioteca pesada; o design precisa ter identidade |
| Ícones | lucide-react | Leve, tree-shakeable, traço técnico |
| ORM | Prisma 6 | Tipagem end-to-end e migrações versionadas |
| Banco | SQLite (dev) → PostgreSQL (prod) | Ver decisão D2 |
| Validação | Zod 4 | Um schema serve para form, action e tipo TS |
| Auth | `jose` (JWT) + `bcryptjs`, próprio | Ver decisão D3 |
| PDF | `@react-pdf/renderer` | Roda serverless, PDF é componente React versionável |
| Storage | Adapter próprio | Disco em dev, S3/Supabase em prod, mesma interface |
| IA | `@anthropic-ai/sdk` (opcional) | Desligada sem `ANTHROPIC_API_KEY`; nunca bloqueia o fluxo |
| Datas | `date-fns` + `pt-BR` | Sem Moment, sem fuso implícito |
| Deploy | Vercel + Supabase (ou VPS + Docker) | Custo zero para começar |

---

## 4. Estrutura de diretórios

```
construtec/
├─ prisma/
│  ├─ schema.prisma              modelo de dados completo
│  ├─ seed.ts                    admin, catálogo, checklists, biblioteca
│  └─ seed-data/                 conteúdo do domínio (não é código)
│     ├─ service-catalog.ts      serviços + regras legais (ART/RRT)
│     ├─ checklists.ts           ambientes e itens por tipo de imóvel
│     └─ finding-library.ts      problemas comuns por categoria
│
├─ public/                       estáticos, og-images
├─ storage/                      uploads em dev (fora do git)
│
└─ src/
   ├─ app/
   │  ├─ (public)/               landing pages, SEO, captação
   │  │  ├─ page.tsx             home
   │  │  ├─ [slug]/              as 4 landings de serviço (conteúdo em content/)
   │  │  ├─ privacidade/
   │  │  └─ actions.ts           captação pública de lead
   │  ├─ (auth)/login/
   │  ├─ (app)/                  painel administrativo (sessão obrigatória)
   │  │  ├─ layout.tsx           shell: nav desktop + tab bar mobile
   │  │  ├─ page.tsx             dashboard
   │  │  ├─ crm/                 pipeline, lead, conversão
   │  │  ├─ clientes/            clientes e imóveis
   │  │  ├─ vistorias/           lista, criação e execução mobile
   │  │  ├─ propostas/           builder + PDF
   │  │  ├─ orcamentos/          quantitativos, BDI, preço
   │  │  ├─ obras/               fiscalização, etapas, medições
   │  │  ├─ agenda/              dia / semana / mês
   │  │  ├─ financeiro/          receitas, despesas, painel
   │  │  ├─ biblioteca/          checklists, problemas, serviços
   │  │  └─ configuracoes/       empresa, habilitação, automações
   │  ├─ p/[token]/              proposta e relatório por link público
   │  └─ api/
   │     ├─ upload/              multipart → storage adapter
   │     ├─ relatorios/[id]/pdf/ stream do PDF
   │     └─ propostas/[id]/pdf/
   │
   ├─ components/
   │  ├─ ui/                     Button, Input, Select, Card, Badge, Sheet,
   │  │                          Dialog, Toast, Tabs, EmptyState, ErrorState,
   │  │                          Skeleton, Money, DateText
   │  ├─ layout/                 AppShell, TopBar, SideNav, MobileTabBar
   │  ├─ crm/  inspection/  proposal/  finance/  calendar/
   │  └─ marketing/              seções reutilizáveis das landings
   │
   ├─ lib/
   │  ├─ db.ts                   PrismaClient singleton
   │  ├─ auth/                   session.ts, password.ts, guards.ts
   │  ├─ actions/                helpers: ActionResult, action()
   │  ├─ repositories/           acesso a dados por agregado
   │  ├─ services/               regra de negócio por módulo
   │  ├─ compliance/             terminologia e habilitação profissional
   │  ├─ pricing/                custos, perdas, BDI, margem
   │  ├─ pdf/                    documentos e primitivas de layout
   │  ├─ automation/             events.ts, engine.ts, handlers.ts
   │  ├─ ai/                     provider.ts, prompts, log de interações
   │  ├─ storage/                index.ts, local.ts, s3.ts
   │  ├─ validation/             schemas Zod por módulo
   │  └─ utils/                  cn, money, dates, slug, format
   │
   ├─ content/
   │  └─ landings.ts             texto das landings (dados, não JSX)
   │
   ├─ domain/                    tipos e constantes do domínio, sem I/O
   │  ├─ enums.ts                status, severidades, papéis, unidades
   │  └─ labels.ts               rótulos pt-BR de cada enum
   │
   └─ proxy.ts                   proteção de rotas (o `middleware` do Next 15)
```

Regra de dependência, de fora para dentro:
`app/ → components/ → lib/services/ → lib/repositories/ → prisma`.
`domain/` não importa nada. Nenhum componente importa Prisma diretamente.

---

## 5. Modelo de dados

### 5.1 Mapa dos agregados

```
                    ┌──────────┐
                    │   User   │ ADMIN | CLIENT | ARCHITECT
                    └────┬─────┘
                         │
  ┌──────────┐      ┌────┴─────┐      ┌──────────┐
  │   Lead   │─────▶│  Client  │◀─────│ Partner  │ arquiteto | empreiteiro
  └────┬─────┘      └────┬─────┘      └──────────┘
       │                 │
  LeadActivity      ┌────┴──────┬──────────────┐
                    │           │              │
              ┌─────▼────┐ ┌────▼─────┐  ┌─────▼──────┐
              │ Property │ │ Proposal │  │  Payment   │
              └─────┬────┘ └────┬─────┘  └────────────┘
                    │           │
        ┌───────────┴───┐  ProposalItem
        │               │
  ┌─────▼──────┐  ┌─────▼─────┐
  │ Inspection │  │  Project  │ (obra)
  └─────┬──────┘  └─────┬─────┘
        │               ├── Stage ── Measurement
   InspectionRoom       ├── Visit
        ├── InspectionItem (checklist)
        └── Finding ── MediaAsset
                │
             Report
```

### 5.2 Entidades

**Identidade e configuração**
- `User` — email, passwordHash, name, role, phone, active
- `CompanySettings` (singleton) — dados da empresa, logo, BDI padrão, validade padrão
  de proposta, **e o bloco de habilitação profissional**: `professionalTitle`,
  `councilType` (CREA/CAU/nenhum), `councilNumber`, `canIssueArt`. É esse bloco que
  alimenta a guarda de terminologia.
- `ActivityLog` — ator, ação, entidade, metadados, IP. Alimenta a timeline do dashboard
  e serve de trilha de acesso para LGPD.

**Comercial**
- `Lead` — nome, telefone, whatsapp, email, origem, serviço desejado, valor potencial,
  status no pipeline, próximo contato, motivo de perda, `clientId` quando convertido
- `LeadActivity` — histórico de contatos (tipo, canal, resumo, data)
- `Client` — pessoa física/jurídica, documento, contatos, endereço, consentimento LGPD
- `Partner` — arquiteto, empreiteiro ou fornecedor; pode ter `User` vinculado
- `Proposal` / `ProposalItem` — escopo, prazo, condições, exclusões, validade, status,
  token público, timestamps de envio/visualização/decisão
- `Contract` — vínculo com proposta, valor, assinatura, arquivo

**Catálogo e bibliotecas configuráveis**
- `ServiceType` — código, nome, categoria, descrição, preço base,
  `requiresTechnicalResponsible`, `requiresArtRrt`, `restrictionLevel`, `legalNotes`,
  `defaultDocumentKind`
- `ChecklistTemplate` → `ChecklistTemplateRoom` → `ChecklistTemplateItem`
- `FindingLibrary` — problema comum: categoria, título, descrição padrão, gravidade
  sugerida. É o que transforma experiência de obra em velocidade de digitação.

**Execução**
- `Property` — imóvel: tipo, empreendimento, torre, unidade, endereço, área
- `Inspection` — vistoria: cliente, imóvel, serviço, agendamento, status, `documentKind`
- `InspectionRoom` / `InspectionItem` — instância do checklist naquela vistoria
- `Finding` — ocorrência: ambiente, categoria, título, descrição, gravidade
  (CRITICA/ALTA/MEDIA/BAIXA), status (PENDENTE/CORRIGIDO/REPROVADO), localização
- `MediaAsset` — foto/vídeo com vínculo opcional a finding, vistoria, obra ou visita
- `Project` — obra: cliente, imóvel, arquiteto, tipo, status, área, datas, orçamento
- `Stage` — etapa: previsto %, executado %, valor, valor liberado, status
- `Visit` / `Measurement` — visita de fiscalização e medição por etapa
- `Report` — documento gerado: tipo, número, versão, arquivo, token público

**Orçamento**
- `Budget` — cabeçalho: obra/cliente, BDI padrão, status, totais em cache
- `BudgetItem` — código, descrição, unidade, quantidade, custos unitários de material /
  mão de obra / equipamento, % de perdas, BDI próprio, totais calculados

**Operação e finanças**
- `CalendarEvent` — tipo, início/fim, cliente, obra, vistoria, endereço, status
- `Task` — título, vencimento, prioridade, origem (manual ou automação), entidade ligada
- `Payment` — receita: cliente, origem, valor, vencimento, recebimento, forma
- `Expense` — despesa: categoria, fornecedor, valor, vencimento, pagamento, obra
- `Notification` — destinatário, título, link, leitura

**Plataforma**
- `AutomationRule` — gatilho, condições (JSON), ações (JSON), ativo
- `AIInteraction` — tipo, entrada resumida, modelo, tokens, saída, entidade,
  `acceptedByUser` — todo output de IA é registrado e precisa de validação humana

### 5.3 Convenções do schema

- **Dinheiro é `Int` em centavos.** Nunca `Float`. Existe `lib/utils/money.ts` com
  `toCents`, `fromCents`, `formatBRL` e as operações de rateio. Isso elimina a classe
  inteira de bugs de arredondamento em orçamento e BDI.
- **Sem `enum` nativo do Prisma.** Os enums vivem em `domain/enums.ts` como
  `as const` + tipo derivado, e o banco guarda `String`. Motivo: SQLite não suporta
  enum e eu quero o mesmo schema em dev e produção (decisão D2). Bônus: mudar um rótulo
  não exige migração.
- **Sem listas escalares.** Onde caberia `String[]`, uso tabela filha ou campo JSON
  serializado. Também por portabilidade SQLite/Postgres.
- **Soft delete só onde a LGPD exige rastro.** No resto, delete real com cascade.
- **`createdAt` / `updatedAt` em tudo.** Índices em toda FK e em campos de filtro
  frequente (`status`, `dueDate`, `scheduledAt`).

---

## 6. Fluxos principais

### 6.1 Fluxo do dinheiro (o caminho crítico do MVP)

```
Visitante na landing
   └─▶ formulário "Agendar vistoria"
          └─▶ Lead criado (status NOVO)
                 └─▶ automação: Task "Entrar em contato" para hoje
                        └─▶ contato registrado em LeadActivity
                               └─▶ Proposta gerada a partir do ServiceType
                                      └─▶ PDF + link público /p/[token]
                                             └─▶ automação: follow-up em 2 dias
                                                    └─▶ cliente aceita no link
                                                           └─▶ Lead→Client,
                                                               CalendarEvent,
                                                               Payment previsto
                                                                  └─▶ Vistoria
                                                                        └─▶ ...
```

### 6.2 Execução da vistoria (mobile)

O objetivo é **4 toques por ocorrência**. Fluxo real na tela:

```
Vistorias → [card da vistoria de hoje]
   │
   └─▶ Tela da vistoria: lista de ambientes com contador de ocorrências
          │
          └─▶ Ambiente (ex.: Cozinha)
                 ├── checklist do ambiente: item OK / NC / N.A. (um toque cada)
                 └── botão fixo grande: [+ Ocorrência]
                        │
                        └─▶ Folha (bottom sheet) em passo único:
                              1. CÂMERA abre direto (capture nativo)
                              2. Descrição — com sugestões da FindingLibrary
                                 filtradas pela categoria do ambiente
                              3. Gravidade — 4 botões grandes
                              4. [Salvar e continuar]  ← volta com a câmera pronta
```

Resiliência de conexão (implementado): a foto sobe assim que é escolhida, enquanto a
pessoa ainda digita a descrição — o tempo de espera acontece onde não atrapalha. Se um
upload falha, aquela foto ganha um botão "Reenviar" e as demais seguem; a ocorrência
salva com o que subiu. Se a gravação da ocorrência falha, a folha permanece aberta com
tudo preenchido e o erro aparece nela. **Nada de tela de erro no meio de uma vistoria,
e nada de digitação perdida.**

Offline real (Fase 2): fila em IndexedDB para trabalhar sem sinal nenhum. Ver D8.

### 6.3 Geração de documento

```
Vistoria concluída
   └─▶ service.reports.generate(inspectionId)
          ├─ compliance.resolveDocumentKind(serviceType, companySettings)
          │     └─ decide título, rodapé e disclaimer conforme habilitação
          ├─ monta o modelo de dados do relatório (agrupado por ambiente)
          ├─ renderiza com @react-pdf/renderer
          ├─ grava no storage e cria Report com token público
          └─ evento: report.generated → Task "Enviar relatório ao cliente"
```

### 6.4 Fiscalização de reforma

```
Obra → Etapas (previsto %, valor)
   └─▶ Visita: fotos + ocorrências + medição por etapa
          └─▶ executado % → valor liberado = valor da etapa × executado %
                 └─▶ Relatório de visita (PDF) + pendências viram Task
                        └─▶ liberação de pagamento ao empreiteiro
```

---

## 7. Módulos do MVP (Fase 1)

Ordem de construção. Cada linha é entregue funcionando ponta a ponta, com estados de
carregamento, vazio e erro, validação e responsividade, antes de começar a próxima.

| # | Módulo | Entrega | Gera dinheiro? |
|---|---|---|---|
| 1 | Fundação + design system | tokens, componentes, utils | infra |
| 2 | Banco + seed | schema, catálogo, checklists, biblioteca | infra |
| 3 | Autenticação | login, sessão, RBAC, proxy | infra |
| 4 | Shell + Dashboard | navegação, HOJE/NEGÓCIOS/OBRAS/FINANCEIRO | visibilidade |
| 5 | CRM + Clientes | pipeline, lead, conversão, funil | **sim** |
| 6 | Vistoria + fotos | fluxo mobile completo | **sim** |
| 7 | Relatório PDF | documento profissional entregável | **sim** |
| 8 | Orçamento + Proposta | cálculo, PDF, link público de aceite | **sim** |
| 9 | Agenda + Tarefas | dia/semana/mês, follow-ups | tempo |
| 10 | Financeiro | receitas, despesas, painel mensal | **sim** |
| 11 | Landing pages | captação com SEO + LGPD | **sim** |
| 12 | Automações + IA | motor de regras, adapter de IA | tempo |

Fora do MVP, propositalmente: obras/fiscalização completa, portal do cliente, portal do
arquiteto, WhatsApp, assinatura eletrônica, pagamentos online, multi-tenant.

---

## 8. Roadmap

**Fase 1 — Ferramenta interna (MVP).** Os 12 módulos acima. Critério de pronto: eu
consigo captar um lead, vender, executar uma vistoria no celular, entregar o PDF e
registrar o recebimento sem abrir uma planilha.

**Fase 2 — Operação de obra.** Módulo de fiscalização completo (etapas, medições,
liberação de pagamento a empreiteiro, relatório de visita), orçamento com composições
salvas e importação de base de preços.

**Fase 3 — Rede.** Portal do cliente ("Minha obra") e portal do arquiteto
("Minhas obras") sobre o mesmo `User.role` que já existe. Notificações por email.

**Fase 4 — Automação de canal.** WhatsApp Business API para captação e agendamento,
Google Calendar, assinatura eletrônica, pagamento online (Pix/cartão) no link da
proposta.

**Fase 5 — SaaS.** `organizationId`, planos, white-label. Só depois que a Fase 1 estiver
pagando as contas.

---

## 9. Decisões técnicas

### D1 — Server Actions como camada de aplicação
**Alternativas:** REST completo, tRPC, Server Actions.
**Escolha:** Server Actions com um helper `action()` que padroniza validação,
autorização e formato de retorno.
**Por quê:** tRPC resolve um problema (contrato type-safe entre processos separados)
que aqui não existe. REST completo é uma camada de tradução sem consumidor externo no
MVP. Os services ficam isolados, então expor REST na Fase 4 é mecânico.

### D2 — PostgreSQL em desenvolvimento e em produção *(revisado)*
**Decisão original:** SQLite em dev, PostgreSQL em produção, schema único e
portável. O ganho era desenvolver sem depender de nada instalado; o custo
assumido, escrito na época, era que "SQLite não valida constraints que o
Postgres valida" — e que o build de produção rodaria contra Postgres antes de
qualquer deploy.

**Por que mudou:** na hora de publicar, esse custo deixa de ser teórico. Manter
dois bancos significa que todo erro de integridade só aparece depois do deploy,
no ambiente onde ele custa caro. E o benefício evaporou: o banco de produção é
gerenciado (Supabase), então não há nada para instalar de qualquer forma.

**Escolha atual:** PostgreSQL nos dois ambientes, com dois projetos Supabase
separados no plano gratuito — um de desenvolvimento e um de produção. Migrações
versionadas em `prisma/migrations/`, aplicadas por `prisma migrate deploy` no
build.

**O que continua valendo do schema original:** nada de `enum` nativo e nada de
lista escalar. Isso nasceu da restrição do SQLite, mas se sustenta sozinho:
renomear um rótulo de status deixa de exigir migração, e o vocabulário fica em
um único lugar (`domain/enums.ts`) em vez de duplicado entre código e banco.

**Custo assumido agora:** desenvolvimento exige internet, e cada consulta local
paga a latência da rede. Para um sistema de um operador, é irrelevante — e é
preferível a descobrir um erro de constraint em produção.

### D3 — Autenticação própria com `jose`, não Auth.js
**Alternativas:** Auth.js v5 (beta), Clerk/Supabase Auth, implementação própria.
**Escolha:** própria — JWT assinado (HS256) em cookie `httpOnly`, `secure`, `sameSite=lax`,
senha com bcrypt (custo 12), tudo confinado em `lib/auth/`.
**Por quê:** o MVP tem um usuário e login por email/senha. Auth.js v5 ainda é beta e traz
uma superfície de configuração maior que o problema. Clerk é excelente e custa dinheiro
recorrente antes do primeiro cliente. A implementação própria são ~150 linhas, é
leve no proxy (que verifica a assinatura sem tocar o banco) e não impede nada:
quando entrar OAuth ou magic link, `lib/auth/` é o único arquivo que muda.
**Limite explícito:** essa decisão vale enquanto for login por senha. Não vou reimplementar
OAuth à mão — nesse dia entra Auth.js.

### D4 — Dinheiro em centavos, `Int`
Ver 5.3. Ponto flutuante em orçamento com BDI e rateio de perdas produz divergência de
centavos que aparece na proposta impressa. `Int` elimina isso.

### D5 — `@react-pdf/renderer` para documentos
**Alternativas:** Puppeteer/Chromium headless, pdfmake, `@react-pdf/renderer`.
**Escolha:** `@react-pdf/renderer`.
**Por quê:** Puppeteer dá o melhor resultado visual, mas exige Chromium — inviável no
runtime serverless da Vercel sem gambiarra e caro em cold start. pdfmake usa uma DSL de
objeto que fica ilegível em documento com fotos e tabelas. `@react-pdf/renderer` mantém
o documento como componente React: versionável, testável, com o mesmo modelo mental do
resto do código.
**Limite:** não tem CSS completo (nada de grid, float). O layout dos documentos foi
desenhado em flexbox por causa disso.

### D6 — Guarda de terminologia como regra de domínio
Um dos requisitos do produto é não afirmar que posso emitir documento que dependa de
CREA/CAU/ART. Isso poderia ser um texto fixo no rodapé — e seria esquecido no primeiro
documento novo. Em vez disso, `lib/compliance/` recebe o `ServiceType` e o
`CompanySettings` e **devolve** o título permitido, o disclaimer obrigatório e se o
serviço está bloqueado. A geração de PDF não sabe escolher título sozinha; ela pergunta.
Se amanhã eu registrar CREA e marcar `canIssueArt`, os títulos mudam sozinhos.

### D7 — IA sugestiva, nunca decisória, e sempre opcional
O adapter em `lib/ai/` retorna `null` quando não há `ANTHROPIC_API_KEY` — a UI
simplesmente não mostra o botão de sugestão, e nenhum fluxo quebra. Todo retorno é
gravado em `AIInteraction` e chega à tela como **rascunho editável** com o carimbo
"Sugestão automática — requer validação profissional". Nenhuma saída de IA é persistida
no domínio sem uma ação explícita do usuário.

### D9 — Sem `loading.tsx`: nenhuma fronteira de Suspense em rota
**Contexto:** o dashboard tinha `loading.tsx`, o que cria uma fronteira de
Suspense e faz a página ser transmitida em duas partes — esqueleto primeiro,
conteúdo depois.
**Problema observado:** em teste, o HTML chegava completo e correto ao
navegador (72 KB, com o script de resolução da fronteira), mas o DOM ficava
parado no esqueleto indefinidamente. Sem erro de console, sem requisição
falhando, `readyState: complete`. Removida a `loading.tsx`, tudo renderiza.
**Escolha:** nenhuma rota usa `loading.tsx`.
**Por quê:** não consegui determinar se a falha era do navegador de teste ou
algo que também atingiria um celular em campo — e essa incerteza é, por si só,
motivo suficiente. Uma fronteira que não resolve significa **dashboard em
branco para sempre**, na tela que é aberta toda manhã. O esqueleto compra ~300 ms
de percepção de velocidade; o risco é a página não aparecer. Troca ruim.
**Quando revisitar:** se alguma página passar de ~1 s de resposta, aí sim vale
reintroduzir Suspense — e testar a resolução da fronteira em dispositivo real
antes de manter.

### D8 — Offline por fila, não por banco replicado — **Fase 2, não entregue no MVP**
**Alternativas:** PouchDB/RxDB com sync bidirecional, service worker + fila própria.
**Escolha:** fila própria em IndexedDB só para o módulo de vistoria.
**Por quê:** sync bidirecional genérico traz resolução de conflito, que é o problema
difícil — e desnecessário aqui, porque uma vistoria tem um único autor e é
append-only. Uma fila de operações pendentes resolve o caso real (perder sinal dentro de
um prédio) com uma fração da complexidade.

**Estado atual, explicitamente:** o MVP **não** funciona sem conexão. O que existe hoje é
resiliência a falhas pontuais — upload por foto com reenvio individual, e formulário que
não perde o conteúdo quando a gravação falha (ver 6.2). Isso cobre sinal ruim, mas não
cobre subsolo sem sinal nenhum.

O offline não estava na Fase 1 da seção 7 e foi deixado de fora conscientemente: ele é o
item de maior custo do módulo e o único que exige uma segunda fonte de verdade no
cliente. Construí-lo antes de a operação estar rodando seria otimizar contra um problema
ainda não medido.

---

## 10. Plano de implementação

**Etapa 1 — Arquitetura.** Este documento.

**Etapa 2 — UX.** Navegação, inventário de páginas, componentes, e o desenho detalhado
do fluxo mobile de vistoria. Registrado em `UX.md`.

**Etapa 3 — Banco.** `schema.prisma` completo + seed com o catálogo de serviços (já com
as regras de ART/RRT), os checklists de apartamento novo e a biblioteca de problemas
comuns. Critério de pronto: `npm run db:reset` sobe um banco utilizável.

**Etapa 4 — MVP em 12 incrementos**, na ordem da seção 7. Regra de cada incremento:

1. schema Zod do módulo
2. repositório + serviço
3. server actions
4. telas (loading, vazio, erro, validação, responsivo)
5. `npm run typecheck` limpo
6. o módulo funciona ponta a ponta antes do próximo começar

O sistema fica utilizável em todos os pontos intermediários. Não existe commit em que a
aplicação não sobe.

---

## Configuração

```bash
cp .env.example .env      # ajuste SESSION_SECRET
npm install
npm run db:reset          # cria o banco e popula o catálogo
npm run dev
```

Variáveis de ambiente em `.env.example`. Nenhum segredo é exposto ao cliente: só
variáveis com prefixo `NEXT_PUBLIC_` cruzam para o browser, e nenhuma delas é chave.
