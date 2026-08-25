# Construtec

Sistema operacional para prestação de serviços de construção civil:
**captar → vender → executar → documentar → cobrar → fidelizar**, sem planilha externa.

A arquitetura completa, com as decisões técnicas e o que ficou para cada fase, está em
[ARQUITETURA.md](./ARQUITETURA.md).

---

## Começar

O projeto usa **PostgreSQL** em desenvolvimento e em produção. Crie um projeto
gratuito no [Supabase](https://supabase.com) para o ambiente local e aponte o
`.env` para ele — os detalhes estão em [DEPLOY.md](./DEPLOY.md).

Um comando por linha. **No Windows PowerShell, `&&` não encadeia comandos** — se
precisar de uma linha só, separe com `;`.

```powershell
cd "C:\Users\ettor\OneDrive\Área de Trabalho\App autonomo\construtec"
```

```powershell
npm install
```

```powershell
Copy-Item .env.example .env
```

Edite o `.env` com a `DATABASE_URL` e a `DIRECT_URL` do seu Supabase de
desenvolvimento, depois:

```powershell
npm run db:migrate
```

```powershell
npm run db:seed
```

```powershell
npm run dev
```

Acesso inicial: `admin@construtec.local` / `construtec123`
(definidos em `.env`, trocados no primeiro uso real).

O site público fica em `/` e o painel em `/dashboard`.

---

## Publicar

Passo a passo completo em **[DEPLOY.md](./DEPLOY.md)** — Supabase, GitHub e
Vercel, no plano gratuito.

## O que está pronto

| Módulo | O que faz |
|---|---|
| **Site público** | Home + 4 landings de serviço com SEO, FAQ em JSON-LD, sitemap e robots |
| **Captação** | Formulário público → lead no CRM, com consentimento LGPD registrado |
| **CRM** | Funil de 9 estágios, histórico de contatos, conversão em cliente, painel de conversão |
| **Clientes e imóveis** | Cadastro, busca, imóveis por empreendimento/torre/unidade |
| **Vistoria** | Checklist por modelo, avaliação em 5 níveis (Novo → Péssimo), foto por item, inclusão de item em campo, ocorrências por gravidade |
| **Relatório PDF** | Capa, resumo por gravidade, ocorrências com foto, estado de cada item com registro fotográfico, pendências, assinatura |
| **Orçamento** | Contexto da obra, quantitativos com material/mão de obra/equipamento, perdas, BDI, margem |
| **Propostas** | Itens (ou importados do orçamento), PDF, link público de aceite, ciclo de status |
| **Agenda e tarefas** | Visões dia/semana/mês, tarefas manuais e automáticas |
| **Financeiro** | Recebimentos e despesas por mês, baixa, atrasos, lucro estimado |
| **Automações** | 6 regras QUANDO → FAZER, ligáveis pela tela de configurações |
| **Resumo diário** | Bloco no painel com o dia inteiro, pronto para copiar; agendável às 7h |
| **Catálogo** | 12 serviços com faixa de preço por metragem e adicionais avulsos |
| **IA** | Opcional. Sugere descrição de ocorrência, follow-up e escopo — sempre como rascunho |
| **Conformidade legal** | Guarda de terminologia: o documento emitido depende da habilitação cadastrada |

### O fluxo principal funciona ponta a ponta

```
Visitante na landing → lead → tarefa automática de contato → proposta
  → PDF + link público → cliente aceita → cliente criado + recebimento previsto
  → vistoria com checklist → estado e foto de cada item + ocorrências
  → relatório em PDF → baixa do recebimento
```

**Fotos são comprimidas no celular antes de subir** (1600px, JPEG 82%): uma foto
de 3 MB vira ~250 KB. É o que faz o upload acompanhar a digitação no 4G de
dentro do prédio, e o que multiplica por dez quantas vistorias cabem no plano
gratuito de armazenamento.

---

## O diferencial: conhecimento de obra virando processo

O que o sistema já "sabe", carregado pelo seed e editável em `prisma/seed-data/`:

- **8 serviços** no catálogo, cada um com nível de restrição, exigência de ART/RRT e
  texto legal próprio;
- **3 modelos de checklist** — o de apartamento tem 11 ambientes e 131 itens;
- **45 problemas recorrentes** com descrição pronta e gravidade sugerida, o que reduz o
  registro de uma ocorrência a três toques.

---

## Conformidade profissional

O sistema **não emite** documento que dependa de habilitação que você não cadastrou.

Sem registro em conselho configurado, `laudo técnico`, `parecer técnico` e
`laudo de inspeção predial` nem aparecem como opção — e um serviço restrito é
bloqueado no catálogo com a explicação do motivo. Ao preencher CREA/CAU em
**Configurações**, esses tipos são liberados automaticamente.

A regra vive em [`src/lib/compliance/`](./src/lib/compliance/index.ts), não na interface:
a geração de PDF pergunta a ela qual título e qual aviso legal usar. O aviso é gravado
junto com o documento, então um relatório já entregue não muda de sentido se a
configuração mudar depois.

---

## O que ficou de fora (e por quê)

Deixado para as próximas fases, de propósito — está tudo em ARQUITETURA.md §8:

- **Obras / fiscalização de reforma.** O schema já tem `Project`, `Stage`, `Visit` e
  `Measurement`; falta a interface. Fase 2.
- **Funcionamento offline.** Hoje há resiliência a sinal ruim (upload por foto com
  reenvio, formulário que não perde conteúdo em falha), mas **não** funcionamento sem
  conexão. É o item de maior custo do módulo e não estava na Fase 1. Ver decisão D8.
- **Portal do cliente e do arquiteto.** `User.role` já prevê `CLIENT` e `ARCHITECT`.
  Fase 3.
- **WhatsApp, Google Calendar, assinatura eletrônica, pagamento online.** Fase 4.
- **Multi-tenant / SaaS.** Fase 5, e só depois que a operação estiver pagando as contas.

---

## Comandos

Rode a partir da pasta `construtec`, um por linha.

```powershell
npm run dev          # desenvolvimento
npm run build        # build de produção (roda as migrações antes)
npm run typecheck    # tsc --noEmit
npm run db:migrate   # cria e aplica migração em desenvolvimento
npm run db:deploy    # aplica migrações pendentes (produção)
npm run db:seed      # popula catálogo e biblioteca (idempotente)
npm run db:studio    # inspeção visual do banco
```

`npx tsx scripts/peek.ts task lead` inspeciona tabelas rapidamente em desenvolvimento.

---

## Notas de segurança

- Senha com bcrypt (custo 12); sessão em JWT assinado, em cookie `httpOnly` + `sameSite=lax`.
- Toda server action valida com Zod **e** verifica sessão e papel — a proteção de rota no
  proxy é triagem, não fronteira de segurança.
- Fotos de vistoria são servidas por rota autenticada (`/api/arquivos/...`), nunca de
  `public/`. A chave de storage é validada contra travessia de diretório.
- Exclusão de cliente é recusada quando há registro financeiro ou contratual, com a
  explicação — obrigação legal de guarda prevalece sobre o pedido de exclusão.
- Nenhuma chave secreta chega ao browser: só variáveis `NEXT_PUBLIC_`, e nenhuma delas é
  credencial.
