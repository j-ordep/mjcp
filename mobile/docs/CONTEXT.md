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
  - existe `useNotificationStore` como fonte de verdade da inbox no cliente
  - a Home exibe badge de nao lidas no sino
  - a inbox recebe `INSERT` e `UPDATE` em realtime filtrados por `user_id`
  - tocar em uma notificacao navega para `SwapRequests` ou `EditSchedule`, conforme o payload
- O fluxo de criacao de escala foi separado da montagem da equipe:
  - `CreateScheduleScreen` cria o contexto da escala
  - `EditScheduleScreen` faz a montagem da equipe e operacao da escala
  - `ScheduleScreen` funciona como hub principal do dominio de escalas
- `EventsScreen` e `EventDetailsScreen` sao somente informativas; presenca, troca e equipe escalada ficam no fluxo de escala
- `EventsScreen` e `EventDetailsScreen` agora consomem o mesmo contrato canonico de apresentacao informativa (`toInformationalEventViewModel`), evitando payload fragmentado entre lista e detalhe
- o payload usado para abrir a edicao de evento a partir de `EventDetailsScreen` agora passa por sanitizer/whitelist (`toEventEditorInitialData`), impedindo vazamento acidental de campos operacionais de escala para o fluxo de evento
- `EventsScreen` mostra proximos eventos e historico real; a classificacao entre atual/futuro e historico considera `end_at` quando existir, mantendo a ordenacao por `start_at`
- criacao e edicao de evento agora ficam disponiveis para:
  - `admin`
  - usuarios com `profiles.can_manage_events = true`
- `CreateEventScreen` agora reidrata a edicao de evento pelo backend via `eventId`, em vez de depender apenas dos dados passados pela navegacao
- a audiencia de eventos privados volta carregada corretamente ao editar o evento
- no MVP atual, `event_audiences` representa ao mesmo tempo visibilidade e lista de convite/convocacao do evento privado
- reuniao continua sendo um evento; nao existe entidade separada para esse caso
- `EBD` continua coberta pela categoria `ensino`
- mesmo para `admin`, o detalhe de evento permanece informativo; escalas vinculadas continuam no fluxo de escalas
- evento privado pode existir sem audiencia explicita; nesse caso ele fica visivel para:
  - `admin`
  - usuarios com `profiles.can_manage_events = true`
- `CreateEventScreen` agora permite vincular sala opcionalmente quando houver uma unica data, carregando disponibilidade real por janela
- a edicao de evento reidrata e preserva corretamente audiencia privada e reserva vinculada; limpeza automatica de sala por indisponibilidade temporaria nao remove a reserva sem intencao
- `RoomsScreen` deixou de ser mockado e agora cria reservas independentes reais em `room_reservations`
- `RoomsScreen` agora tambem mostra agenda diaria por sala:
  - todas as reservas ativas do dia
  - badge `Evento` quando a reserva veio de `room_reservations.event_id`
  - resumo simples somente leitura das escalas vinculadas ao evento
- `RoomsScreen` agora tambem permite cancelar a propria reserva avulsa ativa, sem tocar em reservas vinculadas a evento
- se a leitura de `schedules` falhar por permissao/RLS, a agenda diaria continua carregando e apenas omite o resumo de escalas
- o vinculo estrutural entre evento e sala nesta fase passa por `room_reservations.event_id`, sem introduzir `events.room_id`
- `save_event_with_optional_room_reservation` salva evento + audiencia + reserva opcional de forma atomica, bloqueando conflito de horario
- os nomes de sala continuam vindo do banco (`rooms`), nao de mock local
- o catalogo padrao de salas foi normalizado para:
  - `Sala 1`
  - `Sala 2`
  - `Sala 3`
  - `Sala 4`
  - `Casa de Missoes`
  - `Templo`
- a migration segura `20260504000122_normalize_room_catalog.sql` renomeia legado conhecido e insere faltantes sem apagar salas extras ja existentes
- a UI de salas deixou de exibir lotacao/capacidade; `capacity` continua no banco apenas como dado estrutural legado
- `BlockDatesScreen` deixou de ser placeholder e agora carrega/salva as indisponibilidades reais do usuario em `blocked_dates`
- `blocked_dates` continua como warning soft no fluxo de escala; nao virou bloqueio hard
- `MusicScreen` deixou de ser mock:
  - o catalogo agora vem de `songs`
  - o proximo setlist agora vem de `event_setlists`
  - usuarios com permissao de gerenciar eventos agora conseguem editar de forma simples o setlist do proximo evento
  - a troca completa do setlist agora acontece via RPC transacional `replace_event_setlist`, evitando apagar a setlist atual em caso de falha parcial
- o perfil deixou de depender de fallbacks externos de avatar:
  - `HeaderPrimary`, `ProfileScreen` e `EditProfileScreen` agora usam apenas `avatar_url` real ou iniciais locais
  - a edicao de perfil nao exibe mais CTA falso para trocar foto
- `BottomSheetMenu` deixou de expor acoes placeholder de compartilhar perfil e configuracoes de notificacao
- `ProfileScreen` trocou os cards mockados de atividade por um resumo simples com dados reais da POC
- `ProfileScreen` passou a formatar telefone de forma legivel no resumo do usuario
- `CalendarModal` volta a abrir sincronizado com a data real do formulario, sem reaproveitar selecao cancelada da abertura anterior
- `BlockDatesScreen` agora trava interacoes durante o salvamento para evitar perda silenciosa de alteracoes
- `YoutubeCarousel` ja ignora placeholders publicos de `EXPO_PUBLIC_YOUTUBE_API_KEY`, evitando requests inuteis enquanto o `.env` ainda nao estiver configurado
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

- Notificacoes de evento privado e reserva de sala ainda seguem fora do escopo atual
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
  - listagem informativa de eventos, com proximos e anteriores
  - eventos publicos aparecem para todos os usuarios autenticados
  - eventos privados aparecem para:
    - audiencia selecionada em `event_audiences`
    - `admin`
    - usuarios com `profiles.can_manage_events = true`
- `src/screens/app/SwapRequestsScreen.tsx`
  - acompanhamento de trocas disponiveis e proprias
- `src/screens/app/ManageMinistryMembersScreen.tsx`
  - base operacional para membership e capabilities

---

## Observacoes importantes

- A verdade atual do dominio esta nas migrations e no service layer.
- `docs/TASKS.md` e `docs/ROADMAP.md` servem como mapa de trabalho, nao como fonte primaria.
- A UX do modal de adicionar membro foi alinhada ao padrao do modal central de troca; o fluxo nao usa mais visual de bottom sheet nesse ponto.
- O backend de notificacoes de swap foi preparado em migration local e depende de aplicacao no projeto Supabase para produzir notificacoes reais.
- O backend de notificacao de `schedule.assigned` tambem foi preparado em migration local e depende da aplicacao remota para gerar a inbox completa.
- Nao colocar observacoes, `notes` ou `note` em nenhum lugar da escala.
- O acesso primario ao fluxo de trocas deve sair de `ScheduleScreen`, nao da Home.
- A confirmacao de presenca e a solicitacao/cancelamento de troca nao usam mais alerts nativos de sucesso; o feedback principal agora e o proprio estado da interface.
- Eventos permanecem apenas como superficie informativa; qualquer acao operacional fica restrita ao dominio de escala.
- Eventos possuem `category` informativa em portugues para badge visual minimalista; isso nao altera escala, participacao ou permissao.
- Escala representa servico/funcao; reunioes privadas usam audiencia do evento, e nao assignments, para definir quem participa.
- A permissao granular de eventos usa a flag `profiles.can_manage_events` e agora possui tela administrativa no app para grant/revoke por `admin`; o SQL manual no Supabase continua como fallback operacional.
- Notificacoes para eventos privados ficam como backlog futuro; o estado atual preserva `event_audiences` para suportar isso depois.
- `location` textual continua existindo em eventos; sala vinculada e opcional e nao substitui local livre.
- A direcao atual para salas e reservas passa a ser concreta nesta fase: usar `room_reservations.event_id` opcional em vez de `events.room_id`.
- Ao aplicar as migrations remotas de salas, conferir tambem a normalizacao do catalogo em `20260504000122_normalize_room_catalog.sql`.
- A migration remota adicional desta rodada e `20260512000125_allow_event_managers_to_manage_event_setlists.sql`, para liberar escrita de `event_setlists` a quem ja pode gerenciar eventos.
- A migration remota adicional da rodada atual e `20260515000126_add_replace_event_setlist_rpc.sql`, para tornar a troca completa da setlist atomica no banco.
- O banco continua persistindo enums em ingles por compatibilidade de schema, mas a UI deve exibir status em pt-BR.
- As migrations mais recentes a confirmar/aplicar no Supabase remoto incluem:
  - `20260423000115_align_schedule_read_only_with_event_start_time.sql`
  - `20260423000116_simplify_event_read_policy.sql`
  - `20260426000117_prevent_duplicate_member_schedule_assignments.sql`
  - `20260427000118_add_event_category.sql`
  - `20260512000125_allow_event_managers_to_manage_event_setlists.sql`
  - `20260515000126_add_replace_event_setlist_rpc.sql`
  - `20260522000128_add_schedule_assignment_notifications.sql`
