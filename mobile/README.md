# MJCP Mobile

Aplicativo interno para organizar o serviço das equipes da igreja.
Comportamento atual em [CONTEXT](docs/CONTEXT.md); ajustes do cliente em [TASKS](docs/TASKS.md).
Regras do produto e trabalho da API ficam na [documentação do backend](../api/README.md).

## Executar

Use Node.js 22 e npm. Na pasta `mobile`:

```sh
npm ci
```

Copie `.env.example` para `.env` e configure somente credenciais públicas:

```env
EXPO_PUBLIC_SUPABASE_URL=https://******.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=******
```

O login continua usando Supabase. O banco remoto recebeu o schema da API, com planos mensais
e ocorrências por data, sem eventos. As demais telas e services antigos ainda dependem dos contratos
anteriores e precisam ser adaptados para HTTP; não estão integrados ao banco novo.
A view de compatibilidade `profiles` mantém a leitura do próprio perfil para o login.
Para a prévia mensal, o cliente também pode ler os próprios vínculos e ministérios;
admin consulta todos os ministérios. Não há permissão de escrita, gravação de planos
ou publicação. Os demais dados estão protegidos contra acesso direto do cliente;
as regras serão executadas no Fastify. O estado e os limites dessa transição ficam
em [CONTEXT](docs/CONTEXT.md).
Credenciais administrativas e do banco ficam fora do aplicativo e do repositório.

```sh
npm start
```

Também existem `npm run android`, `npm run ios` e `npm run web`; simulador iOS exige macOS.
O Expo Go e a versão web aguardam a restauração da sessão e mostram o login quando não há
sessão válida, tanto em desenvolvimento quanto em produção. Após entrar, abrem em Escalas;
ao sair da conta, retornam ao login.
As versões estão em [package.json](package.json). Sem configuração válida, o app mostra erro.

Em **Escalas → Criar escala**, admin e líderes podem experimentar a montagem mensal:
escolher o ministério (fixo quando há uma única opção), navegar até o mês desejado,
marcar datas ou dias da semana e abrir a prévia de ocorrências com horário opcional.
Essa prévia permanece apenas na tela e é descartada ao sair. A listagem e a edição
antigas continuam pendentes de adaptação; a prévia não depende delas nem da API.

No Expo Go, confira compatibilidade e a rede do celular/computador.
Tente `npx expo start --go --clear`. Para conectar por túnel com Bun instalado:

```sh
bunx expo start --tunnel
```

`@expo/ngrok` está nas dependências de desenvolvimento e é instalado por `npm ci`.
O túnel exige internet no computador e no celular; use o QR Code exibido pelo Expo.

## Componentes de interface

Textos, campos e controles de formulário ficam em `src/components/ui`, com código local
adaptado do [React Native Reusables](https://reactnativereusables.com/) e licença MIT preservada.
Use `Text`, `Input`, `Textarea`, `SelectField`, `Button`, `Checkbox`, `Switch` e `Separator`.
`Input` aceita rótulo, erro, ajuda e ícones; `containerStyle` controla espaçamento externo,
`fieldClassName` aplica fundo/borda à caixa (sem pintar o rótulo) e `style` estiliza o campo nativo.
Buscas usam placeholder e ícone em `left`, sem outra caixa externa. Refs e callbacks nativos
continuam disponíveis.

Tokens visuais ficam em `global.css` e `tailwind.config.js`, mantendo NativeWind 4.
`src/theme/colors.ts` fornece a mesma paleta para estilos nativos, ícones, Paper e navegação.
Use tokens semânticos (`bg-background`, `bg-card`, `text-foreground`, `bg-primary`,
`text-muted-foreground`, `border-border`) em vez de cores por tela. A identidade é verde floresta,
com cartões brancos e fundo claro; erros, avisos e confirmações mantêm suas cores próprias.
`Card` padroniza superfícies e `Badge` apresenta metadados/situações. Reutilize-os quando houver
esse papel visual, mantendo ações e estado no componente do fluxo. `DefaultButton` mantém a
API existente sobre `Button`; ambos permitem rótulos em múltiplas linhas e altura mínima de toque.
Seletores em modais nativos precisam de um PortalHost local e ajuste de posicionamento;
`RoomReservationModal` contém o exemplo. Buscas e seleções múltiplas mantêm seus componentes.
Paper permanece nos cartões, avatares, chips e modal de notificações ainda utilizados.

## Validar alterações

```sh
npx tsc --noEmit
npm test
```

Se a saída `.tests-dist` estiver bloqueada por permissões, use uma pasta nova dentro de `.expo`
(ignorada pelo Git), sem alterar permissões dos arquivos:

```sh
node node_modules/typescript/bin/tsc -p tsconfig.test.json --outDir .expo/verification-tests
node --test .expo/verification-tests/tests/*.test.js
```

Os testes de coordenação de telas não renderizam componentes nativos. No celular, confira
login e troca de conta, Minhas/Gerenciadas, criação/montagem/confirmação, trocas e histórico,
notificações, indisponibilidade, repertório, reservas, Equipe e Perfil/logout. Repita os fluxos
com rede lenta, erro e retorno à tela; confira teclado, cabeçalhos e modais.
Os testes de repertório ainda cobrem o código antigo por evento; não comprovam integração com o schema mensal.
Falhas parciais de edição de integrante/capabilities exigem conferir o estado relido antes de repetir.

Os testes Node usam mocks e dados fictícios. Também confira os fluxos afetados no celular
e as permissões no banco. Compilar ou passar testes locais não confirma o ambiente remoto.

## Operação do banco atual

As migrations locais registram a evolução do schema. A migration
`20261116031253_align_api_daily_schema` foi aplicada ao remoto em 2026-11-16 e alinha
as tabelas ao schema da API. Ela mantém contas e catálogos e reinicia o histórico de teste
de eventos, escalas, trocas e avisos, com autorização do responsável.
Com Supabase CLI instalado, selecione o ambiente correto:

```sh
supabase login
supabase link --project-ref YOUR_SUPABASE_PROJECT_REF
supabase migration list
supabase db push --dry-run
```

Revise a lista antes de `supabase db push`. `--dry-run` lista o que seria aplicado sem aplicar,
conforme a [referência do CLI](https://supabase.com/docs/reference/cli/supabase-db-push).
Não use reset remoto nem reparo de histórico automaticamente. Preserve migrations já aplicadas.

`npm test` não executa operações no banco. As regras de escalas e sua autorização devem
ser verificadas nos testes da API, com dados fictícios, após implementar cada operação.
O acesso direto do cliente ao domínio novo permanece fechado durante essa integração.

Para conferir histórico e integridade sem exportar dados pessoais:

```sql
select version from supabase_migrations.schema_migrations order by version;

select conname, convalidated from pg_constraint
where conrelid in ('public.schedule_occurrences'::regclass, 'public.room_reservations'::regclass)
  and conname in ('occurrences_ministry_date_unique', 'room_reservations_end_after_start');

select count(*) from public.room_reservations where end_at <= start_at;
select count(*) from (
  select ministry_id, date from public.schedule_occurrences
  group by ministry_id, date having count(*) > 1
) duplicates;
```

Constraints `NOT VALID` protegem novas escritas, mas dados antigos precisam de saneamento
antes de `VALIDATE CONSTRAINT`. Registre pendências de migração no [TASK do backend](../api/docs/TASK.md),
sem tokens, identificadores internos ou payloads reais.

## Manter a documentação

CONTEXT descreve o cliente atual; TASKS é o backlog do mobile.
As regras do produto ficam em [REGRAS_DE_NEGOCIO](../api/docs/REGRAS_DE_NEGOCIO.md).
Banco, API e migração ficam no [TASK do backend](../api/docs/TASK.md).
[AGENTS](AGENTS.md) contém as orientações de trabalho.
Atualize esses documentos existentes e remova tarefas concluídas; evite novos planos Markdown.
