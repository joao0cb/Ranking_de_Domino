# Ranking de Dominó

Placar e ranking de partidas de dominó, com interface pública de leitura e painel administrativo
escondido para cadastrar pessoas, partidas e contas.

- **Ranking de pessoas**: partidas jogadas, vitórias, derrotas, empates, % de vitórias, saldo e média de pontos, sequência atual, melhor dupla e última partida.
- **Ranking de duplas**: cada combinação de dois jogadores (a dupla não é fixa — a mesma pessoa pode jogar com parceiros diferentes, e os números são recalculados a partir das partidas).
- **Partidas**: lista das partidas com placar, com filtro por jogador.
- **Painel restrito** em `/acesso` (login) e `/admin` (cadastros e exclusões).

Tudo é calculado na hora a partir das partidas registradas: adicionar ou excluir uma partida atualiza
os dois rankings automaticamente.

## Stack

- Next.js 16 (App Router, Server Actions) + TypeScript
- Tailwind CSS 4
- Postgres (funciona com Neon, Supabase, Vercel Postgres ou qualquer Postgres)
- Sessão do painel em cookie assinado (HMAC) e senhas com `scrypt`

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # e preencha DATABASE_URL e SESSION_SECRET
npm run dev
```

As tabelas são criadas automaticamente na primeira requisição (`CREATE TABLE IF NOT EXISTS`),
então não existe passo de migração.

Verificar a conexão com o banco:

```bash
npm run db:check
```

## Variáveis de ambiente

| Variável | Obrigatória | Para que serve |
| --- | --- | --- |
| `DATABASE_URL` | sim | String de conexão do Postgres. No Neon use a **pooled connection string**. |
| `SESSION_SECRET` | recomendada | Segredo que assina o cookie de sessão. Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | não | Criam o primeiro usuário do painel automaticamente, se ainda não houver nenhuma conta. |
| `APP_TIMEZONE` | não | Fuso usado só para sugerir a data/hora no formulário (padrão `America/Sao_Paulo`). |

## Deploy na Vercel

1. **Banco de dados (Neon)** — no painel da Vercel, abra o projeto → **Storage** → **Create Database** →
   **Neon** (plano gratuito serve). Isso adiciona a variável `DATABASE_URL` ao projeto automaticamente.
   Se preferir outro provedor, crie um Postgres e cadastre `DATABASE_URL` manualmente em
   **Settings → Environment Variables**.
2. **Projeto** — em [vercel.com/new](https://vercel.com/new), importe este repositório do GitHub.
   A Vercel detecta Next.js sozinha; não precisa mudar build command nem output.
3. **Variáveis** — confirme `DATABASE_URL` e adicione `SESSION_SECRET` (valor aleatório longo) em
   **Settings → Environment Variables** (Production e Preview). Opcionalmente `ADMIN_USERNAME` e
   `ADMIN_PASSWORD` para já nascer com login pronto.
4. **Deploy** — clique em Deploy. As tabelas são criadas no primeiro acesso ao site.
5. **Primeiro acesso** — abra `https://SEU-PROJETO.vercel.app/acesso/primeiro-acesso` e crie a conta
   administrativa. Essa página só funciona enquanto não existir nenhuma conta; depois ela é desativada.
   (Se você definiu `ADMIN_USERNAME`/`ADMIN_PASSWORD`, entre direto por `/acesso`.)

Para publicar uma nova versão, basta dar push na branch conectada — a Vercel faz o deploy.

## Formas de acesso ao painel

- `/acesso` — login (não aparece em nenhum menu público).
- `/acesso/primeiro-acesso` — criação da primeira conta, só enquanto não houver nenhuma.
- `/admin` — painel; redireciona para `/acesso` se não estiver logado.

Dentro do painel é possível criar outras contas, excluir contas (mantendo ao menos uma e sem excluir
a própria) e trocar a própria senha. O site público continua somente leitura para todo mundo.

## Regras de dados

- Pessoa: só o nome; o `id` (UUID) é gerado pelo banco e o nome é único (sem diferenciar maiúsculas).
- Partida: duas duplas (2 pessoas em cada), placar das duas duplas e data/hora. Empate é permitido.
- Dupla: não é uma entidade fixa, é derivada das partidas — cada combinação de dois jogadores que já
  jogou junto aparece no ranking de duplas, com vitórias, derrotas, empates, % e saldo.
- Excluir uma pessoa que já tem partidas é bloqueado com uma mensagem; exclua as partidas antes
  (a exclusão de uma partida remove apenas os vínculos daquela partida).

## Estrutura

```
src/app/page.tsx                 rankings (pessoas + duplas)
src/app/pessoas/                 lista de pessoas e página individual
src/app/partidas/                lista de partidas com filtro por jogador
src/app/acesso/                  login + primeiro acesso (ocultos)
src/app/admin/                   painel + server actions de cadastro/exclusão
src/lib/db.ts                    pool Postgres + criação do schema
src/lib/stats.ts                 cálculo dos rankings e estatísticas
src/lib/session.ts               cookie de sessão assinado
```
