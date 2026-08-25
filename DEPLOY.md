# Publicar o Construtec

Guia único, do zero ao ar. Custo: **R$ 0** nos planos gratuitos.

O que você precisa: contas no **GitHub**, **Supabase** e **Vercel**.

---

## 1. Supabase — banco e arquivos

### 1.1 Criar o projeto

[supabase.com](https://supabase.com) → **New project**

- Nome: `construtec`
- **Database Password**: gere uma forte e **guarde agora**. Ela não aparece de novo.
- Region: **South America (São Paulo)** — o banco perto de você é o que mantém
  a vistoria fluida no celular.

Leva uns dois minutos para provisionar.

### 1.2 Pegar as duas URLs do banco

**Project Settings → Database → Connection string**

Você precisa de duas, e elas são diferentes de propósito:

| Variável | Qual copiar | Porta | Para quê |
|---|---|---|---|
| `DATABASE_URL` | **Transaction pooler** | 6543 | a aplicação |
| `DIRECT_URL` | **Session pooler** | 5432 | as migrações |

**As duas são do pooler.** Em ambas, troque `[YOUR-PASSWORD]` pela senha do
passo 1.1.

> São duas porque o *transaction pooler* não suporta os comandos que uma
> migração precisa executar.
>
> **Não use a "Direct connection"** (`db.xxx.supabase.co`) em `DIRECT_URL`. Ela
> tem apenas registro DNS `AAAA` — existe só em IPv6 — e a Vercel é IPv4. O
> build falha com `P1001: Can't reach database server`. Da sua máquina pode
> funcionar, se o seu provedor tiver IPv6, o que torna o erro especialmente
> traiçoeiro: passa no teste local e quebra no deploy.

Na `DATABASE_URL`, mantenha no fim: `?pgbouncer=true&connection_limit=1`

### 1.2.1 Conferir antes de seguir

Cole as duas no `.env` e rode:

```powershell
npx tsx scripts/verificar-supabase.ts
```

Ele testa a conexão de verdade e diz em português o que está errado — senha
incorreta, porta trocada, string cortada. Só siga quando estiver tudo `ok`.

### 1.3 Criar o bucket de arquivos

**Storage → New bucket**

- Nome: `construtec`
- **Public bucket: DESMARCADO.**

Isso não é detalhe. Marcar como público deixaria as fotos do interior do imóvel
de qualquer cliente acessíveis por URL para quem tivesse o link. O sistema serve
as fotos pela rota `/api/arquivos/...`, que exige sessão.

### 1.4 Pegar as chaves da API

**Project Settings → API**

- `SUPABASE_URL` = **Project URL**
- `SUPABASE_SERVICE_ROLE_KEY` = chave **service_role** (não a `anon`)

A `service_role` ignora as regras de acesso do Supabase — por isso ela só existe
no servidor, nunca no navegador.

---

## 2. Chaves secretas

Para gerar novas, rode três vezes e guarde cada resultado:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Um valor para cada: `SESSION_SECRET`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`,
`CRON_SECRET`.

> São só bytes aleatórios, não credenciais de nenhum serviço. Se alguma vazar,
> gere outra e troque na Vercel: o efeito é derrubar as sessões abertas.

---

## 3. GitHub — subir o código

Crie um repositório **privado** chamado `construtec` em
[github.com/new](https://github.com/new), **sem** marcar README, .gitignore ou
licença.

Depois, na pasta do projeto, um comando por linha:

```powershell
git remote add origin https://github.com/SEU_USUARIO/construtec.git
```

```powershell
git branch -M main
```

```powershell
git push -u origin main
```

> O `.env` **não** vai junto — está no `.gitignore`. As credenciais vivem só na
> Vercel. Confira com `git ls-files | Select-String ".env"`: deve aparecer
> apenas `.env.example`.

---

## 4. Vercel — publicar

[vercel.com/new](https://vercel.com/new) → **Import** o repositório `construtec`.

Antes de clicar em Deploy, abra **Environment Variables** e cadastre:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | pooler, porta 6543 (passo 1.2) |
| `DIRECT_URL` | **session pooler**, porta 5432 (passo 1.2) |
| `SESSION_SECRET` | primeira chave do passo 2 |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | segunda chave do passo 2 |
| `CRON_SECRET` | terceira chave do passo 2 |
| `NEXT_PUBLIC_APP_URL` | `https://construtec.vercel.app` (ajuste depois se usar domínio) |
| `STORAGE_DRIVER` | `supabase` |
| `SUPABASE_URL` | passo 1.4 |
| `SUPABASE_SERVICE_ROLE_KEY` | passo 1.4 |
| `SUPABASE_STORAGE_BUCKET` | `construtec` |
| `SEED_ADMIN_EMAIL` | seu e-mail |
| `SEED_ADMIN_PASSWORD` | uma senha forte, sua |

Opcional: `ANTHROPIC_API_KEY` libera os botões de sugestão. Sem ela, tudo
funciona igual e os botões não aparecem.

Clique em **Deploy**. O build roda `prisma migrate deploy` sozinho e cria as 36
tabelas no Supabase.

> Se o build falhar, o erro quase sempre é de conexão. Rode
> `npx tsx scripts/verificar-supabase.ts` com as mesmas URLs no `.env` local —
> ele aponta a causa direto.

---

## 5. Popular o catálogo

As tabelas nascem vazias. Para carregar catálogo de serviços, faixas de preço,
modelos de checklist, biblioteca de problemas e o seu usuário, rode uma vez a
partir do seu computador, apontando para o banco de produção.

Crie um arquivo `.env.production.local` na pasta do projeto:

```
DATABASE_URL="<transaction pooler, 6543>"
DIRECT_URL="<session pooler, 5432>"
SEED_ADMIN_EMAIL="seu@email.com"
SEED_ADMIN_PASSWORD="sua-senha-forte"
```

E rode:

```powershell
npx dotenv -e .env.production.local -- npm run db:seed
```

Se o `dotenv` não estiver disponível, dá para fazer direto:

```powershell
$env:DATABASE_URL="<transaction pooler>"; $env:DIRECT_URL="<session pooler>"; npm run db:seed
```

> O seed é idempotente: pode rodar de novo sem duplicar nada.

Depois disso, **apague o `.env.production.local`** — ele tem a senha do banco.

---

## 6. Primeiro acesso

1. Abra `https://construtec.vercel.app/login`
2. Entre com o e-mail e a senha que você definiu
3. Vá em **Configurações** e preencha os dados da empresa — eles aparecem em
   toda proposta e relatório
4. **Instale no celular**: abra o site no Chrome do Android ou no Safari do
   iPhone → menu → *Adicionar à tela inicial*. Vira ícone e abre em tela cheia,
   que é como você vai usar durante a vistoria.

---

## 7. Resumo diário às 7h

Já está configurado em `vercel.json`:

```json
{ "path": "/api/resumo-diario", "schedule": "0 10 * * 1-5" }
```

`10:00 UTC` = **07:00 de Brasília**, de segunda a sexta. A Vercel agenda só em
UTC, então em horário de verão isso viraria 8h — ajuste a linha se for o caso.

A Vercel envia o `CRON_SECRET` automaticamente no cabeçalho. O resumo vira
notificação dentro do app; envio para WhatsApp depende da API oficial (Fase 4).

---

## Desenvolvimento depois disso

O projeto passou a usar PostgreSQL também em desenvolvimento (ver decisão D2 em
ARQUITETURA.md). Crie um **segundo projeto Supabase** chamado `construtec-dev`
e aponte o `.env` local para ele.

```powershell
npm run db:migrate
```

```powershell
npm run db:seed
```

```powershell
npm run dev
```

Nunca aponte o `.env` local para o banco de produção — `prisma migrate dev`
pode reconstruir o banco do zero.

---

## Limites do plano gratuito

| Recurso | Limite | Quanto dura |
|---|---|---|
| Banco Supabase | 500 MB | Anos. Texto ocupa quase nada. |
| Storage Supabase | 1 GB | ~50 vistorias, com a compressão de foto ativa |
| Projeto Supabase | pausa após 7 dias sem uso | Irrelevante se você usa toda semana |
| Vercel | 100 GB de banda | Muito acima do necessário |
| Vercel Cron | 1 execução/dia | Exatamente o que o resumo diário usa |

**O storage é o primeiro a apertar.** As fotos são comprimidas no celular antes
de subir (1600px, JPEG 82%), o que leva uma foto de 3 MB para ~250 KB — é o que
transforma 4 vistorias em 50. Quando chegar perto do limite, o plano pago do
Supabase custa US$ 25/mês e dá 100 GB.

---

## Domínio próprio

Registre em [registro.br](https://registro.br) (~R$ 40/ano) e, na Vercel, vá em
**Settings → Domains → Add**. Ela mostra os registros DNS para cadastrar. Depois
atualize `NEXT_PUBLIC_APP_URL` para o novo endereço — os links de proposta
enviados ao cliente dependem dela.
