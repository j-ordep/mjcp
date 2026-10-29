# MJCP Backend

Backend em Fastify, TypeScript e PostgreSQL para o aplicativo MJCP.

- [Regras de negócio](docs/REGRAS_DE_NEGOCIO.md): referência única, organizada por fluxo.
- [Tarefas](docs/TASK.md): pendências, definições abertas, migração e futuras features.
- [Orientações de trabalho](AGENTS.md): tutoria, manutenção e segurança.

## Executar

Dentro de `backend-node`, instale as dependências, configure `.env` a partir de
`.env.example` e execute:

```sh
bun install
bun run dev
```

O servidor usa a porta 3000. As rotas `/events` ainda são exemplos em memória.
A persistência e os fluxos definitivos da API estão pendentes em TASK.

## Banco e migrations

Configure `DATABASE_URL` para o PostgreSQL novo de desenvolvimento.
Os schemas ficam em `src/modules/**/schema.ts` e as migrations em `drizzle/`.

Para aplicar as migrations existentes:

```sh
bunx drizzle-kit migrate
```

Depois de alterar um schema, gere e revise o SQL antes de aplicar:

```sh
bunx drizzle-kit generate --name=nome_da_mudanca
```

Para SQL que o construtor do Drizzle não representa, gere uma migration customizada:

```sh
bunx drizzle-kit generate --custom --name=nome_da_regra
```

`0001_room_reservations_no_overlap.sql` contém a proteção de concorrência das salas.
Versione o SQL e os metadados gerados. Preserve migrations já aplicadas.
Criar a estrutura não transfere contas nem dados do Supabase; essa migração está em TASK.

## Conferir tipos

```sh
node node_modules/typescript/bin/tsc --noEmit
```

Não versione `.env`, credenciais, exports do banco nem dados reais.
