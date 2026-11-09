# MJCP Backend

Backend em Fastify, TypeScript e PostgreSQL para o aplicativo MJCP.

- [Regras de negócio](docs/REGRAS_DE_NEGOCIO.md): referência única, organizada por fluxo.
- [Tarefas e estudo](docs/TASK.md): próximo fluxo da API, rotas propostas, aprendizado, definições e migração.
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

No WSL, dentro de `backend-node`, suba o PostgreSQL de desenvolvimento:

```sh
docker compose up -d --wait
docker compose ps
```

Configure `DATABASE_URL` com a porta publicada no Compose. O endereço local pode ser
`127.0.0.1`; a porta externa pode diferir da `5432` interna do container.
Os schemas ficam em `src/modules/**/schema.ts` e as migrations em `drizzle/`.
`drizzle.config.ts` configura a CLI; a conexão usada pela API é uma implementação separada.

Para gerar uma base inicial com Drizzle Kit 0.31, dentro de `backend-node`:

```sh
bunx drizzle-kit generate --name=initial_schema
bunx drizzle-kit generate --custom --name=room_reservations_no_overlap
cp src/modules/rooms/constraints.sql drizzle/0001_room_reservations_no_overlap.sql
```

O segundo arquivo precisa receber o SQL de [constraints.sql](src/modules/rooms/constraints.sql):
o construtor do Drizzle 0.44 não representa a exclusão que protege reservas sobrepostas.
Gerar uma migration customizada vazia sem copiar esse SQL não ativa a proteção.

Revise os arquivos gerados e aplique:

```sh
bunx drizzle-kit migrate
```

Para evoluir uma base já criada, altere o schema e gere uma nova migration:

```sh
bunx drizzle-kit generate --name=nome_da_mudanca
```

Versione SQL e metadados. Preserve migrations já aplicadas em bases mantidas.
Essa geração inicial exige banco vazio; remover só o container não apaga seu volume.
Criar a estrutura não transfere contas nem dados do Supabase; essa migração está em TASK.

## Conferir tipos

```sh
node node_modules/typescript/bin/tsc --noEmit
```

Não versione `.env`, credenciais, exports do banco nem dados reais.
