# MJCP Mobile

Aplicativo interno para organizar o serviço das equipes da igreja.
Objetivo e regras em [CONTEXT](docs/CONTEXT.md); próximos passos em [TASKS](docs/TASKS.md).

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

O app usa Supabase diretamente. Escalas é a entrada, com Minhas e Gerenciadas;
Salas e Músicas ficam nas abas. Equipe aparece para administradores ou líderes com vínculo confirmado.
Perfil e notificações ficam no cabeçalho. Confirmação e troca são feitas no detalhe da escala.
Eventos de apoio ficam no Perfil de quem pode gerenciar eventos. Eles ainda fornecem data,
horário e repertório compartilhado; criar escala exige selecionar um evento futuro existente.
Credenciais administrativas e do banco ficam fora do aplicativo e do repositório.

```sh
npm start
```

Também existem `npm run android`, `npm run ios` e `npm run web`; simulador iOS exige macOS.
As versões estão em [package.json](package.json). Sem configuração válida, o app mostra erro.
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
O repertório exige permissão de gestão de eventos para editar e fica somente leitura no início.
Falhas parciais de edição de integrante/capabilities exigem conferir o estado relido antes de repetir.

Os testes Node usam mocks e dados fictícios. Também confira os fluxos afetados no celular
e as permissões no banco. Compilar ou passar testes locais não confirma o ambiente remoto.

## Operação do banco atual

Esta seção vale enquanto o cliente usa Supabase. As migrations locais são a referência
do schema; este guia não confirma que estejam aplicadas no remoto.
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

Validação de autorização no banco exige um ambiente de testes preparado e dados fictícios;
`npm test` não executa operações no banco. Confira liderança fora do próprio ministério, confirmação, dois aceites de troca
concorrentes, bloqueio no horário de início, histórico, conflito de sala e notificações/logout.
Enquanto eventos existirem, valide audiência privada, edição de sala e repertório.

Para conferir histórico e integridade sem exportar dados pessoais:

```sql
select version from supabase_migrations.schema_migrations order by version;

select conname, convalidated from pg_constraint
where conrelid in ('public.events'::regclass, 'public.room_reservations'::regclass)
  and conname in ('events_end_after_start_check', 'room_reservations_end_after_start_check');

select count(*) from public.events where end_at is not null and end_at <= start_at;
select count(*) from public.room_reservations where end_at <= start_at;
select count(*) from (
  select schedule_id, user_id from public.schedule_assignments
  group by schedule_id, user_id having count(*) > 1
) duplicates;
```

Constraints `NOT VALID` protegem novas escritas, mas dados antigos precisam de saneamento
antes de `VALIDATE CONSTRAINT`. Registre verificações e pendências somente em TASKS,
sem tokens, identificadores internos ou payloads reais.

## Manter a documentação

CONTEXT reúne produto, regras e tecnologia; TASKS é o único backlog.
[AGENTS](AGENTS.md) contém as orientações de trabalho.
Atualize esses documentos existentes e remova tarefas concluídas; evite novos planos Markdown.
