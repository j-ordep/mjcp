# MJCP Mobile - Contexto do Projeto

Data de reconciliacao: 2026-04-10 (America/Sao_Paulo)

## O que e

Aplicativo mobile para gestao de igreja/ministerio com foco em:

- eventos
- escalas
- membros e capabilities por ministerio
- confirmacao de presenca
- trocas de assignment
- indisponibilidades
- reservas de sala

O dominio principal hoje e o fluxo de escalas.

---

## Stack tecnologica

| Tecnologia | Versao | Uso |
| --- | --- | --- |
| React Native | 0.81.5 | App mobile |
| Expo | ~54.0.30 | Toolchain e build |
| TypeScript | ~5.9.2 | Tipagem |
| React Navigation | 7.x | Stack + tabs |
| Zustand | 5.x | Estado global |
| Supabase JS | 2.99.3 | Auth, banco e RLS |
| React Native Paper | 5.14.5 | Componentes visuais |
| NativeWind | 4.2.1 | Estilizacao |
| Lucide React Native | 0.554.0 | Icones |

---

## Estado atual do codigo

### Confirmado no codigo

- O app nao esta mais em estado de UI puramente mockada para o dominio principal.
- Existe autenticacao Supabase parcial no projeto.
- Existe integracao real com Supabase para eventos, ministerios, membros, escalas, assignments e trocas.
- O app agora possui leitura real da inbox de notificacoes pela tabela `notifications`:
  - `NotificationsModal` deixou de ser mockado
  - existe `notificationService` para listar e marcar notificacoes como lidas
- O fluxo de criacao de escala foi separado da montagem da equipe:
  - `CreateScheduleScreen` cria o contexto da escala
  - `EditScheduleScreen` faz a montagem da equipe e operacao da escala
  - `ScheduleScreen` funciona como hub principal do dominio de escalas
- `EventsScreen` e `EventDetailsScreen` sao somente informativas; presenca, troca e equipe escalada ficam no fluxo de escala
- `EventsScreen` mostra proximos eventos e historico real, seguindo a ordenacao por `start_at`
- Ao tocar em uma escala a partir de `ScheduleScreen`, admin, lider e membro agora abrem a mesma tela `EditScheduleScreen`:
  - admin/lider entram em modo gerencial
  - membro entra em modo de acompanhamento da propria participacao, sem acoes administrativas
- O fluxo de troca ja existe do banco ate a UI:
  - criar solicitacao
  - cancelar solicitacao propria
  - aceitar troca como primeira pessoa elegivel
  - acompanhar trocas em `SwapRequestsScreen`
- A janela de read-only do dominio de escala agora bloqueia exatamente em `start_at`, nao no dia inteiro do evento:
  - antes de `start_at`, mutacoes seguem as permissoes do papel
  - em `start_at` ou depois, confirmacao, trocas e alteracoes operacionais ficam bloqueadas

### PENDENTE DE DEFINICAO

- Estrategia final de notificacoes operacionais do fluxo de escalas e trocas
- Estrategia futura de retencao/limpeza de escalas antigas

### INFORMACAO INSUFICIENTE

- Estrategia oficial de testes automatizados em execucao no CI

---

## Fluxo principal atual

### Escalas

1. Lider/admin cria uma escala para um `(evento, ministerio)`.
2. Depois disso, a equipe e montada na tela de editar escala.
3. O lider adiciona membros respeitando:
   - membership no ministerio
   - capability da role
   - warnings de conflito/indisponibilidade
   - regra de no maximo um assignment por membro na mesma escala
4. O proprio usuario pode confirmar sua participacao.
5. O proprio usuario pode solicitar troca do proprio assignment.
6. Outra pessoa elegivel pode aceitar a troca.

### Trocas

O modelo atual e:

- o lider nao aprova a troca
- a primeira pessoa elegivel que aceitar assume o assignment
- no banco ja existem regras para:
  - evitar mais de uma solicitacao pendente invalida
  - garantir elegibilidade
  - impedir criacao/aceite/cancelamento em `start_at` ou depois

---

## Papeis

### `admin`

- gerencia tudo

### `leader`

- gerencia escalas, assignments e membros do proprio ministerio

### `member`

- interage apenas com o que e dele, especialmente:
  - confirmar presenca
  - solicitar troca
  - cancelar a propria troca
  - aceitar troca quando elegivel

---

## Telas principais do dominio de escalas

- `src/screens/app/CreateScheduleScreen.tsx`
  - cria o contexto da escala
- `src/screens/app/EditScheduleScreen.tsx`
  - operacao da escala, equipe, contexto e participacao do proprio usuario
- `src/screens/app/ScheduleScreen.tsx`
  - hub operacional de escalas e participacoes
- `src/screens/app/EventDetailsScreen.tsx`
  - visao informativa do evento; nao deve concentrar acoes de escala
- `src/screens/app/EventsScreen.tsx`
  - listagem informativa de eventos, com proximos e anteriores, igual para todos os usuarios
- `src/screens/app/SwapRequestsScreen.tsx`
  - acompanhamento de trocas disponiveis e proprias
- `src/screens/app/ManageMinistryMembersScreen.tsx`
  - base operacional para membership e capabilities

---

## Observacoes importantes

- A verdade atual do dominio esta nas migrations e no service layer.
- `docs/TASKS.md` e `docs/ROADMAP.md` servem como mapa de trabalho, nao como fonte primaria.
- A UX do modal de adicionar membro foi alinhada ao padrao do modal central de troca; o fluxo nao usa mais visual de bottom sheet nesse ponto.
- O backend de notificacoes de swap foi preparado em migration nova e depende de aplicacao no projeto Supabase para produzir notificacoes reais.
- Nao colocar observacoes, `notes` ou `note` em nenhum lugar da escala.
- O acesso primario ao fluxo de trocas deve sair de `ScheduleScreen`, nao da Home.
- A confirmacao de presenca e a solicitacao/cancelamento de troca nao usam mais alerts nativos de sucesso; o feedback principal agora e o proprio estado da interface.
- Eventos permanecem apenas como superficie informativa; qualquer acao operacional fica restrita ao dominio de escala.
- Eventos possuem `category` informativa em portugues para badge visual minimalista; isso nao altera escala, participacao ou permissao.
- O banco continua persistindo enums em ingles por compatibilidade de schema, mas a UI deve exibir status em pt-BR.
- As migrations mais recentes a confirmar/aplicar no Supabase remoto incluem:
  - `20260423000115_align_schedule_read_only_with_event_start_time.sql`
  - `20260423000116_simplify_event_read_policy.sql`
  - `20260426000117_prevent_duplicate_member_schedule_assignments.sql`
  - `20260427000118_add_event_category.sql`
