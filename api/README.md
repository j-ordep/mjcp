# MJCP Backend

Backend em Fastify, TypeScript e PostgreSQL para o aplicativo MJCP.

- [Regras de negócio](docs/REGRAS_DE_NEGOCIO.md): referência única, organizada por fluxo.
- [Tarefas e estudo](docs/TASK.md): próximo fluxo da API, rotas propostas, aprendizado, definições e migração.
- [Orientações de trabalho](AGENTS.md): tutoria, manutenção e segurança.

## Executar

Dentro de `api`, instale as dependências, configure `.env` a partir de
`.env.example` e execute:

```sh
bun install
bun run dev
```

O servidor usa a porta 3000 e registra `POST /ministries/:ministryId/schedule-plans`.
A composição conecta controller, service, repository e autorização por ministério.
A autenticação por sessão/token ainda está pendente: requisições válidas sem identidade
recebem `401`. A criação de ocorrências ainda não está disponível; o fluxo atual cria
um rascunho mensal vazio. Próximas entregas em TASK.

## Banco e migrations

No WSL, dentro de `api`, suba o PostgreSQL de desenvolvimento:

```sh
docker compose up -d --wait
docker compose ps
```

Configure `DATABASE_URL` com a porta publicada no Compose. O endereço local pode ser
`127.0.0.1`; a porta externa pode diferir da `5432` interna do container.
As definições do banco ficam em `src/modules/**/*.tables.ts` e as migrations em `drizzle/`.
`drizzle.config.ts` configura a CLI; a conexão usada pela API é uma implementação separada.

Os arquivos dos módulos recebem o nome do módulo como prefixo: `schedules.tables.ts`
define tabelas Drizzle e `schedules.schema.ts` define validações Zod e tipos inferidos.
O mesmo prefixo identifica controller, service, repository e rotas.

Para gerar uma base inicial com Drizzle Kit 0.31, dentro de `api`:

```sh
bunx drizzle-kit generate --name=initial_schema
bunx drizzle-kit generate --custom --name=room_reservations_no_overlap
cp src/modules/rooms/rooms.constraints.sql drizzle/0001_room_reservations_no_overlap.sql
```

O segundo arquivo precisa receber o SQL de [rooms.constraints.sql](src/modules/rooms/rooms.constraints.sql):
o construtor do Drizzle 0.44 não representa a exclusão que protege reservas sobrepostas.
Gerar uma migration customizada vazia sem copiar esse SQL não ativa a proteção.

Revise os arquivos gerados e aplique:

```sh
bunx drizzle-kit migrate
```

Para evoluir uma base já criada, altere as definições em `*.tables.ts` e gere uma nova migration:

```sh
bunx drizzle-kit generate --name=nome_da_mudanca
```

Versione SQL e metadados. Preserve migrations já aplicadas em bases mantidas.
Essa geração inicial exige banco vazio; remover só o container não apaga seu volume.
Criar a estrutura não transfere contas nem dados do Supabase; essa migração está em TASK.

A migration `0002_schedule_days.sql` substitui início/término da ocorrência por uma data
civil obrigatória e horário informativo opcional. As regras de conflito diário e limite
de edição pertencem ao service TypeScript e ainda serão implementadas nos fluxos de escrita.
O schema exportado da API também foi aplicado ao Supabase pela migration
`mobile/supabase/migrations/20261116031253_align_api_daily_schema.sql`. A API mantém sua
conexão configurada em `DATABASE_URL`; esse alinhamento não troca automaticamente seu banco.

## Teste de integração

Com as migrations aplicadas e o PostgreSQL de desenvolvimento disponível na
`DATABASE_URL` do `.env`, execute dentro de `api`:

```sh
bun test tests --timeout 15000
```

Os testes verificam criação, duplicidade, autorização de gestão e rollback com dados fictícios.
A identidade do autor é controlada apenas nos testes; a identificação real por sessão/token está em TASK.
Se o banco roda no WSL, mantenha a distribuição em execução durante o teste.

## Conferir tipos

```sh
node node_modules/typescript/bin/tsc --noEmit
```

Não versione `.env`, credenciais, exports do banco nem dados reais.
