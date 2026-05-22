# MJCP Mobile - Tarefas e Melhorias (Backlog)

Data: 2026-04-05 (America/Sao_Paulo)

Referencia rapida:
- plano consolidado da proxima rodada: `docs/NEXT_STEPS_PLAN.md`
- plano da rodada para transformar o app em POC usavel: `docs/POC_USABLE_PLAN.md`
- plano consolidado do core de eventos: `docs/EVENT_CORE_PLAN.md`
- plano tecnico da fase 1 do core de eventos: `docs/EVENT_CORE_PHASE1_IMPLEMENTATION_PLAN.md`
- plano tecnico da fase 2 do core de eventos: `docs/EVENT_CORE_PHASE2_IMPLEMENTATION_PLAN.md`
- plano pequeno da agenda diaria de salas: `docs/ROOMS_SCREEN_DAY_AGENDA_PLAN.md`
- referencia da mudanca de read-only para bloqueio em `start_at`: `docs/SCHEDULE_READ_ONLY_BY_HOUR_PLAN.md`
- ideia futura de cadastro de visitante: `docs/VISITOR_REGISTRATION_IDEA.md`
- ideia futura de fluxo de escola biblica: `docs/BIBLE_SCHOOL_IDEA.md`
- historico documental e registros de rodadas: `docs/history/README.md`
- aplicacao remota no Supabase: `docs/SUPABASE_REMOTE_RUNBOOK.md`

Objetivo imediato: sair do prototipo e fechar o fluxo principal de "Criacao de Escalas" com regra:
- Admin pode criar/gerenciar tudo
- Lider so cria/gerencia escalas da(s) sua(s) area(s)/ministerio(s)
- Lider tambem pode se auto-escalar no proprio ministerio, desde que respeite as mesmas validacoes de membro/funcao da escala
- Membro apenas visualiza e interage com o que for dele (confirmar/trocar)
- Eventos sao apenas informativos; a operacao de escala nao deve depender da tela de evento
- Datas nao podem ficar em branco em formularios; quando nao houver valor inicial, o padrao deve ser a data/hora atual do sistema no momento da criacao/carregamento do formulario, ja selecionada no campo

Atualizacao de hygiene/POC (2026-05-15):
- [x] Remover fallbacks externos de avatar do fluxo de perfil/home
- [x] Remover CTA enganoso de troca de foto no perfil
- [x] Remover acoes placeholder do menu de perfil (`Compartilhar perfil`, `Configuracoes de Notificacao`)
- [x] Trocar o bloco mockado de atividades recentes por um resumo real e explicito da POC no perfil
- [x] Formatar telefone no perfil para leitura humana
- [x] Resetar `CalendarModal` ao reabrir apos cancelamento
- [x] Travar `BlockDatesScreen` durante salvamento
- [x] Tornar a troca completa da setlist atomica via RPC (`20260515000126_add_replace_event_setlist_rpc.sql`)
- [ ] Padronizar mensagens de erro para nao expor texto bruto do Supabase diretamente em alerts
- [x] Limpar strings com mojibake/encoding quebrado nas telas e services mais visiveis
  - Atualizacao em 2026-05-20:
    - varredura local cobriu `src`, `tests`, `docs` e `supabase`
    - strings corrompidas restantes foram normalizadas em testes/documentacao e na tela de gestao de membros
- [~] Adicionar guardrails explicitos para `.env` publico incompleto (`EXPO_PUBLIC_SUPABASE_*`, `EXPO_PUBLIC_YOUTUBE_API_KEY`)
  - ja fechado parcialmente para `EXPO_PUBLIC_YOUTUBE_API_KEY`: `YoutubeCarousel` ignora placeholders publicos e nao faz fetch inutil sem chave real
  - ainda falta endurecer validacoes/feedback para `EXPO_PUBLIC_SUPABASE_*` e outros pontos criticos de bootstrap

---

## P0 (Critico) - Permissoes e Integridade

- [x] Ajustar RLS de `blocked_dates` para lider/admin verem indisponibilidades do seu ministerio
  - Problema: policy atual "Leaders and admin can view blocked dates" usa apenas `is_admin()` em `supabase/migrations/20260312000100_create_rls_policies.sql`
  - Definir regra desejada:
    - Lider pode ver `blocked_dates` apenas de membros do(s) ministerio(s) onde ele e lider
    - Admin pode ver tudo

- [x] Revisar policies duplicadas e conflitos de RLS
  - Hoje existe "Admin can manage schedules/assignments" em `20260312000100_create_rls_policies.sql`
  - E existe "Leaders can manage schedules/assignments" em `20260312000103_add_leader_policies.sql`
  - Garantir que:
    - Admin continua com acesso total
    - Lider tem acesso somente por ministerio (via `is_ministry_leader(...)`)
    - Membro nao consegue inserir/alterar `schedules` ou `schedule_assignments` de outros
  - Atualizacao em 2026-04-12:
    - hotfix adicional registrado em `20260412000111_fix_schedule_rls_recursion.sql`
    - a janela temporal de editabilidade em `schedules` e `schedule_assignments` deve valer apenas para `INSERT` / `UPDATE` / `DELETE`, nunca para `SELECT`

- [x] Permitir que lider gerencie ministry_members e ministry_member_roles apenas do proprio ministerio
  - Necessario para tela separada de gestao de membros/capacidades
  - Admin continua com acesso total

- [x] Endurecer integridade de `schedule_assignments` (evitar dados inconsistentes)
  - Garantir que `role_id` pertence ao mesmo `ministry_id` da `schedule`
  - Garantir que `user_id` pertence ao ministerio (existe `ministry_members` para aquele usuario)
  - Implementar via:
    - constraint com trigger/funcao (se necessario), ou
    - mover criacao de assignment para uma unica RPC (recomendado) que valida tudo no servidor

- [x] Restringir confirmacao do proprio assignment no backend para antes de `start_at`
  - Problema:
    - o app ja bloqueava a acao no client, mas a policy de UPDATE do proprio assignment ainda podia ser usada fora do fluxo visual
  - Atualizacao em 2026-04-13:
    - nova migration local `20260413000113_restrict_member_assignment_status_updates.sql`
    - a policy do proprio membro agora exige que o evento ainda esteja antes de `start_at`
  - Pendencia operacional:
    - aplicar no Supabase remoto a migration que alinhou a janela final de read-only em `start_at`

- [~] Validacoes de data no banco
  - [x] `events`: `end_at` deve ser > `start_at` quando `end_at` nao for nulo
  - [x] `room_reservations`: `end_at > start_at`
  - Atualizacao em 2026-05-20:
    - migration local `20260520000127_add_temporal_integrity_constraints.sql` adiciona constraints `NOT VALID`, protegendo novas escritas sem bloquear deploy por dados historicos
    - pendente operacional: validar/limpar dados historicos e executar `VALIDATE CONSTRAINT` no Supabase remoto
  - Regra de produto confirmada em 2026-04-05:
    - `events.start_at` e obrigatorio
    - nao permitir criar evento com `start_at` no passado
    - se o usuario nao informar `end_at`, o sistema deve preencher automaticamente `start_at + 3 horas`

- [ ] Indices para performance basica
  - [x] `schedule_assignments (user_id, status)`
    - Atualizacao em 2026-04-13:
      - nova migration local `20260413000114_add_schedule_assignment_status_index.sql`
    - Pendencia operacional:
      - aplicar a migration nova no Supabase remoto
  - [ ] `schedules (event_id, ministry_id)` (ja existe UNIQUE, mas pode precisar index explicito dependendo do Postgres/plano)
  - [ ] `events (start_at)` ja existe; avaliar `events (end_at)`

---

## P0 (Critico) - Fluxo de Criacao de Escalas (Produto)

Decisao atualizada em 2026-04-07:
- separar claramente `criacao da escala` de `montagem da equipe`
- `CreateScheduleScreen` deve cuidar apenas do Step 1: contexto da escala
- a montagem da equipe deixa de acontecer na mesma tela da criacao
- depois de salvar a escala, o usuario volta para `ScheduleScreen`
  - atualizado: depois de salvar a escala, o usuario volta para `ScheduleScreen`
- ao tocar em um card de escala, abrir uma nova tela de `Editar Escala`
- essa nova tela concentra:
  - edicao dos dados da escala
  - montagem da equipe
  - adicao/remocao de membros
- `EventDetailsScreen` nao deve ser reutilizada para esse fluxo administrativo
- regra de permissao mantida:
  - admin gerencia tudo
  - lider gerencia apenas escalas do proprio ministerio
  - membro apenas visualiza e confirma a propria participacao

- [x] Refatorar o fluxo para separar criacao de escala e montagem da equipe
  - `ScheduleScreen` continua como ponto de entrada da operacao
  - CTA `Criar Escala` abre apenas o Step 1
  - ao salvar, voltar para a lista de escalas
  - ao tocar em uma escala, abrir nova tela/modal de `Editar Escala`
  - evitar misturar criacao + membros na mesma superficie

- [x] Criar tela de `Editar Escala`
  - status atual confirmado no codigo:
    - gerenciar equipe da escala
    - adicionar assignments
    - remover assignments
    - respeitar permissao por ministerio
    - excluir escala com confirmacao explicita do usuario
  - Regra explicita:
    - nao colocar observacoes, `notes` ou `note` em nenhum lugar da escala
  - pendente para fechar o escopo originalmente desejado:
    - permitir alterar evento e/ou ministerio, caso esse passe a ser um requisito de produto

- [x] Revisar `ScheduleScreen` para servir melhor como hub operacional de escalas
  - lista de cards de escala
  - acao de criar escala
  - acao de abrir escala existente
  - diferenciar acoes de admin/lider vs membro

- [x] Revisar UX para evitar sobrecarga e overengineering
  - manter Step 1 simples e curto
  - mover toda complexidade operacional para a tela de edicao
  - evitar reusar telas com responsabilidade diferente so por conveniencia
  - priorizar clareza de permissao e fluxo sobre efeitos visuais
- [x] Implementar `CreateScheduleScreen` (hoje e placeholder)
  - Arquivo: `src/screens/app/CreateScheduleScreen.tsx`
  - Requisitos minimos (MVP):
    - Selecionar `evento` (futuro)
    - Selecionar `ministerio` permitido:
      - Admin: qualquer ministerio
      - Lider: apenas ministerios onde `ministry_members.is_leader = true`
    - Criar `schedules` (1 por (event_id, ministry_id))
    - Nao adicionar `schedule_assignments` nesta tela
    - Ao salvar, voltar para `ScheduleScreen`
    - Montagem da equipe acontece apenas na tela de `Editar Escala`
    - Mostrar warnings (nao bloquear) para:
      - nao se aplicam nesta tela apos a separacao do fluxo; warnings de indisponibilidade/conflito ficam na adicao de assignments na tela de edicao

- [x] Implementar service de "criar escala" com validacoes
  - Arquivo: `src/services/scheduleService.ts`
  - Funcoes hoje confirmadas no codigo:
    - `createSchedule({ eventId, ministryId })`
    - `upsertScheduleAssignment({ scheduleId, userId, roleId })`
    - `removeScheduleAssignment(assignmentId)`
    - `checkBlockedDates(userId, dateRange)`
    - `checkConflicts(userId, eventId)`
    - `getManageableScheduleCards(...)`
    - `getUserScheduleCards(...)`
    - `getScheduleDetails(scheduleId)`
  - Ja implementado no codigo:
    - `deleteSchedule(...)` com confirmacao explicita em `EditScheduleScreen`

- [x] Fechar regra "lider de uma area cria escala para a area dele"
  - Backend (RLS/RPC) deve ser a fonte de verdade (nao depender do app para bloquear).
  - Frontend apenas esconde o botao se nao tiver permissao.
  - Regra complementar confirmada:
    - lider pode atribuir a si mesmo uma funcao no proprio ministerio
    - isso nao cria permissao extra fora do ministerio dele
    - continua valendo a regra de integridade: `user_id` precisa pertencer ao ministerio e `role_id` precisa pertencer ao mesmo ministerio da `schedule`

---

## P1 (Alto) - Conectar Interacoes do Membro

- [x] Confirmar presenca (membro e lider escalado)
  - Estado atual confirmado no codigo:
    - `EditScheduleScreen` ja permite confirmar a propria participacao no nivel da `schedule`
    - `ScheduleScreen` ja permite confirmar a propria participacao quando o card possui `my_assignments`
    - a confirmacao acontece no nivel correto do dominio: `schedule_assignments`
  - Regras:
    - so o dono do assignment pode confirmar (policy ja existe para UPDATE own)
    - para a UX atual, confirmar a escala deve confirmar os assignments do proprio usuario naquela `schedule`
  - Ajuste de UX em 2026-04-12:
    - remover alerts nativos de sucesso apos confirmar presenca
    - o feedback principal passa a ser a atualizacao imediata do CTA e do status na propria tela

- [~] Solicitar troca (membro)
  - Decisao atualizada em 2026-04-10:
    - lider nao aprova swap
    - lider apenas recebe notificacao e pode agir manualmente na escala se quiser
    - a troca e validada pela primeira pessoa elegivel que aceitar
    - nao e prioridade manter historico forte da substituicao entre pessoas
    - o historico mais relevante fica nas notificacoes para acompanhamento do lider
    - pessoas elegiveis:
      - mesmo ministerio
      - mesma funcao/capability da solicitacao
    - em `start_at` ou depois, a escala vira historico e fica somente leitura
    - nesse estado nao pode:
      - criar swap
      - aceitar swap
      - alterar equipe
      - confirmar presenca
  - `swap_requests` ja existe no banco
  - Estado atual confirmado no codigo:
    - `ScheduleScreen` ja consegue abrir o fluxo minimo e criar `swap_requests`
    - `EditScheduleScreen` ja consegue abrir o fluxo minimo e criar `swap_requests`
    - `SwapRequestsScreen` ja lista trocas disponiveis e proprias, com aceite/cancelamento
    - o aceite da troca ja usa a regra de "primeira pessoa elegivel"
    - cancelamento de solicitacao propria ja esta implementado
  - Definir UX minima:
    - usuario escolhe a propria funcao/assignment e informa motivo opcional
    - se o usuario ja tiver uma solicitacao pendente naquela escala:
      - nao abrir novo pedido
      - oferecer cancelamento da solicitacao atual
    - nao permitir dois pedidos pendentes para a mesma escala pelo mesmo solicitante
    - modal deve ficar estavel em iOS/Android:
      - overlay independente da animacao do sheet
      - teclado nao pode cobrir conteudo
      - teclado deve fechar ao tocar fora / submeter / fluxo natural
    - validar e exibir corretamente pessoas elegiveis do mesmo ministerio e mesma funcao
    - permitir aceite pela primeira pessoa elegivel
    - garantir concorrencia segura no aceite ("first write wins")
  - Pendente nesta rodada:
    - remover/ajustar qualquer fluxo que trate lider como aprovador
  - Preparado no repo e pendente de aplicar no Supabase:
    - migration para impedir criacao/aceite/cancelamento de swap em `start_at` ou depois
    - migration para corrigir recursao de RLS entre `events` e `schedules`
    - migration para voltar assignment confirmado para `pending` quando a troca for aberta

- [~] Revisar experiencia do usuario escalado
  - Lider escalado deve manter os dois contextos:
    - contexto de gerenciador da escala
    - contexto de participante da escala
  - `EditScheduleScreen` ja comecou a refletir isso com bloco de "Minha participacao"
  - Estado atual confirmado no codigo:
    - `ScheduleScreen` e `EditScheduleScreen` concentram confirmacao e troca
    - `ScheduleScreen` agora abre `EditScheduleScreen` tambem para membro
    - `EditScheduleScreen` esconde acoes administrativas quando o usuario nao pode gerenciar a escala
  - Direcao registrada em 2026-04-13:
    - `EventDetailsScreen` deve deixar de operar por escala e virar somente informativa
    - equipe escalada, status de participacao, confirmacao e troca ficam fora da superficie de evento
    - o caso de multiplas escalas do mesmo evento continua resolvido no dominio de escala, nao em evento
  - Atualizacao em 2026-04-14:
    - `ScheduleScreen`, `EditScheduleScreen` e `scheduleService` foram alinhados para tratar `start_at` como o marco de historico/somente leitura para as acoes ja bloqueadas por regra
    - a tela de edicao agora sinaliza explicitamente quando a escala esta somente leitura
    - a visao gerencial voltou a enxergar historico de escalas sem depender de filtro por horario exato
  - Atualizacao em 2026-04-23:
    - o filtro `Proximas` na tela de escalas deve ordenar por `data do evento` em ordem crescente
    - o filtro `Anteriores` na tela de escalas deve ordenar por `data do evento` em ordem decrescente, com a escala mais recente no topo
    - a ordenacao do historico deve seguir a data em que a escala aconteceu, e nao a data de criacao do registro

---

## P1 (Alto) - Separacao entre Evento e Escala

**Confirmado no codigo**
- `EventsScreen` ja renderiza card informativo com `showActions={false}` em `src/screens/app/EventsScreen.tsx`
- `EventsScreen` lista `Proximos` e `Anteriores`, carregando eventos futuros e historico real via `allEvents`
- `EventDetailsScreen` hoje esta informativa e expoe edicao para:
  - `admin`
  - usuarios com `profiles.can_manage_events = true`
- `EventsScreen` e `EventDetailsScreen` agora consomem o mesmo shape canonico de apresentacao informativa em `src/utils/eventPresentation.ts`
- `CreateEventScreen` ja cria e edita eventos usando `normalizeEventRange(...)` em `src/screens/app/CreateEventScreen.tsx` e `src/services/eventService.ts`
- `CreateEventScreen` agora diferencia evento publico e privado, permitindo selecionar membros por busca nominal quando `is_public = false`
- a edicao de evento agora reidrata o estado canonico pelo backend via `eventId`, reaplicando corretamente a audiencia privada no formulario
- a audiencia de evento privado ficou modelada em `event_audiences`, sem acoplar esse fluxo ao dominio de ministerios
- no MVP atual, `event_audiences` representa ao mesmo tempo convite e visibilidade
- admins tambem podem ser adicionados explicitamente na audiencia de eventos privados, mesmo ja tendo visibilidade ampliada por permissao; isso preserva o contexto da audiencia selecionada para evolucoes futuras, como notificacoes
- `events.category` foi modelado como coluna simples com valores em portugues, sem tabela propria nesta fase
- `EventsScreen` e `EventDetailsScreen` seguem visual minimalista preto/branco, com badge de categoria apenas informativo
- `events` no store continua reservado para proximos eventos usados por Home/criacao de escala
- `allEvents` no store alimenta a tela de eventos com futuros + historico
- evento privado, no MVP atual, usa `event_audiences` como lista de visibilidade e convite ao mesmo tempo
- reuniao continua sendo `evento`; ela nao deve virar entidade nova nem reutilizar `escala` para representar participantes
- `EBD` continua coberta por `ensino`, sem categoria propria nesta fase
- [x] Fechar Fase 2 do core de eventos
  - evento privado pode existir sem audiencia explicita; nesse caso fica visivel para:
    - `admin`
    - usuarios com `profiles.can_manage_events = true`
  - `event_audiences` continua representando convite + visibilidade no MVP
  - `room_reservations.event_id` passa a ser o vinculo estrutural opcional entre evento e sala
  - `save_event_with_optional_room_reservation` salva evento + audiencia + reserva opcional em transacao
  - `CreateEventScreen` agora permite sala opcional com disponibilidade real por janela para evento de data unica
  - `RoomsScreen` deixou de ser mock e passou a criar reservas independentes reais
  - a reconciliacao de sala em edicao protege contra limpeza indevida ao mudar e voltar janela/horario

- [x] Fechar permissao granular para criacao/edicao de eventos
  - regra atual implementada:
    - `admin` cria/edita eventos
    - usuarios com `profiles.can_manage_events = true` tambem criam/editam eventos globalmente
  - a audiencia privada e a reserva opcional de sala continuam dentro da mesma permissao
  - a concessao/revogacao da flag agora pode ser feita por `admin` no app; o SQL manual continua como fallback

- [x] Integrar salas ao fluxo basico de eventos sem criar `events.room_id`
  - direcao validada em 2026-04-30:
    - manter `location` textual em eventos
  - salas agora tambem funcionam como fluxo proprio por `RoomsScreen`
  - o vinculo estrutural adotado foi `room_reservations.event_id` opcional
  - nao modelar `events.room_id`, porque um evento pode precisar de zero, uma ou varias reservas
  - mesmo para `admin`, escalas vinculadas continuam no fluxo de escalas; `EventDetailsScreen` nao vira tela administrativa de escala
  - catalogo padrao de salas agora fica documentado como:
    - `Sala 1`
    - `Sala 2`
    - `Sala 3`
    - `Sala 4`
    - `Casa de Missoes`
    - `Templo`
  - os nomes continuam vindo do banco (`rooms`), nao de mock local
  - a migration segura `20260504000122_normalize_room_catalog.sql` renomeia legado conhecido e insere faltantes sem apagar salas extras
  - `capacity` continua no schema, mas a UI nao exibe mais lotacao no card nem no seletor de sala

- [x] Fechar Fase 3 do core de eventos
  - `EventDetailsScreen` continua informativa mesmo quando o evento tem varias escalas vinculadas
  - o payload de edicao aberto a partir do detalhe agora passa por whitelist/sanitizacao, evitando vazamento acidental de campos operacionais
  - teste unitario protege o contrato de nao-vazamento entre dominio de evento e dominio de escala

- [~] Fechar Fase 4 do core de eventos
  - fechado no repo local:
    - `RoomsScreen` agora mostra agenda diaria por sala
    - o card mostra todas as reservas do dia
    - reservas ligadas a evento recebem badge `Evento`
    - o card mostra resumo simples somente leitura das escalas vinculadas
    - se a leitura de `schedules` falhar por permissao/RLS, a agenda continua carregando sem quebrar a tela
  - pendente operacional:
    - confirmar no Supabase remoto a migration `20260504000122_normalize_room_catalog.sql`
    - validar no banco o catalogo padrao de salas:
      - `Sala 1`
      - `Sala 2`
      - `Sala 3`
      - `Sala 4`
      - `Casa de Missoes`
      - `Templo`
  - decidir futuramente se salas extras/customizadas permanecem livres ou se havera gestao administrativa dedicada

**PENDENTE DE DEFINICAO**
- se o detalhe do evento deve ganhar metadados extras no futuro, como link de transmissao/video
- estrategia futura de notificacoes para eventos privados fica registrada, mas fora do escopo atual:
  - usuarios selecionados explicitamente na audiencia devem poder ser notificados no futuro
  - isso deve reutilizar a audiencia salva em `event_audiences`, sem depender de inferencia por role ou ministerio

**INFORMACAO INSUFICIENTE**
- nao ha definicao fechada de anexos/metadados extras no detalhe do evento

Contexto: eventos sao informativos para todos; escala e o fluxo operacional de quem participa do ministerio/função.

- `EventsScreen` nao deve variar por assignment, papel, ministerio ou participacao.
- `EventDetailsScreen` tambem deve permanecer informativa e nao deve carregar equipe, status, confirmacao ou troca.

- [x] Padronizar payload informativo compartilhado para card e detalhe de evento
  - Confirmado no codigo:
    - `src/utils/eventPresentation.ts` expoe `toInformationalEventViewModel(...)`
    - `EventsScreen` e `EventDetailsScreen` reutilizam o mesmo shape canonico:
      - `title`
      - `category`
      - `startAt`
      - `endAt`
      - `location`
      - `description`
  - Resultado:
    - a superficie de evento continua somente informativa
    - lista e detalhe deixam de depender de mapeamentos fragmentados por tela

- [x] Implementar `EventCard` apenas informativo em `EventsScreen`
  - Hoje `EventsScreen` usa `EventCard` com `showActions={false}`
  - Direcao preferida atual:
    - card sempre igual para todos os usuarios
    - nenhuma acao operacional de escala no card
    - eventuais melhorias devem ficar restritas a metadados do evento, nao a participation state
    - tema visual deve seguir o padrao claro minimalista do app, preto/branco/cinza, sem paleta alaranjada
  - Futuro desejado:
    - `EventDetailsScreen` exibe apenas local, data/hora, descricao e links/metadados do evento, como video do culto se houver

- [x] Fechar escopo da listagem de `Eventos`
  - Decisao:
    - a tela mostra eventos futuros e historico real
    - `Proximos` ordena por `start_at` crescente
    - `Anteriores` ordena por `start_at` decrescente

- [x] Alinhar `EventsScreen` com a fonte real de dados
  - `getEvents()` busca eventos sem filtro temporal para alimentar futuros + historico
  - `getUpcomingEvents()` continua existindo para Home e criacao de escala

- [x] Fechar fluxo funcional de edicao de evento
  - a tela de edicao nao depende mais apenas do payload de navegacao
  - o formulario reidrata o evento canonicamente por `eventId`
  - a audiencia privada volta carregada corretamente ao editar
  - isso prepara o fluxo para futuras extensoes, como integracao com salas, sem misturar esse modulo agora

- [~] Revisar UX de criacao/edicao de evento sem extrapolar escopo
  - ja ajustado:
    - `CreateEventScreen` nao usa mais alerts de sucesso
    - o chip de categoria selecionado nao desloca mais o texto
    - o formulario de evento privado permite selecionar/remover audiencia na propria tela
    - a edicao agora reaplica corretamente os membros ja vinculados ao evento privado
  - ainda vale revisar depois:
    - refinamentos visuais do seletor de audiencia em telas menores
    - copy final do fluxo privado/publico

- [x] Arquitetar permissao granular para criacao/edicao de eventos
  - implementado:
    - `profiles.can_manage_events` como flag global por usuario
    - helper backend `public.can_manage_events()`
    - gating de app derivado por capacidade, sem espalhar `role === "admin"`
  - fechado nesta rodada:
    - UI administrativa basica para grant/revoke da flag por `admin`

- [x] Consolidar `Evento` como core composicional do produto
  - Confirmado no codigo e na documentacao viva:
    - reuniao = evento
    - convite = audiencia privada em `event_audiences`
    - `event_audiences` tambem representa visibilidade no MVP
    - escala = servico/funcao, nunca lista de participantes
  - referencia consolidada: `docs/EVENT_CORE_PLAN.md`

- [x] Fechar reuniao como configuracao de evento, nao como modulo proprio
  - manter categoria `reunião`
  - manter publico/privado
  - manter audiencia selecionada no proprio evento
  - nao exigir escala para reunioes
  - `EBD` permanece coberta por `ensino`

## Decisao de fluxo registrada em 2026-04-12

- `ScheduleScreen` e o hub principal do dominio de escalas.
- O acesso principal a `SwapRequestsScreen` deve acontecer por um card de navegacao dentro de `ScheduleScreen`.
- O card da Home para trocas fica inativo nesta rodada e deixa de ser entrada primaria do fluxo.
    - exigir definicao clara de prioridade entre telas para evitar estados inconsistentes e refresh duplicado

---

## P1 (Alto) - Tipos e Qualidade de Codigo

- [ ] Gerar/atualizar `src/types/database.types.ts`
  - Observacao:
    - este item esta parcialmente desatualizado; o arquivo nao esta mais vazio
    - ainda assim, vale revisar cobertura e remover pontos frageis restantes
  - Beneficio: tipagem forte do Supabase e menos `any`.

- [~] Criar base inicial de testes automatizados
  - Estado atual:
    - `npm test` ja compila e executa testes unitarios leves sem depender de Jest
    - suite inicial cobre `src/utils/scheduleParticipation.ts`
    - cobertura ampliada para `src/utils/scheduleRules.ts` com regras de contagem, editabilidade, overlap e warnings
    - cobertura ampliada para mapeamentos de `ministry` e `schedule cards`, reduzindo risco nas transformacoes do service layer
    - cobertura ampliada para `src/utils/eventParticipation.ts`, protegendo o caso de multiplas escalas no mesmo evento
    - cobertura ampliada para cenarios restantes de status em `src/utils/scheduleParticipation.ts` (`Sem participacao`, `Confirmado`, `Parcialmente confirmado`, `Recusado`)
    - cobertura ampliada para `src/services/scheduleService.ts` com cenarios de:
      - bloqueio de criacao de escala em `start_at` ou depois
      - upsert de escala quando o evento ainda e editavel
      - bloqueio de remocao de assignment em read-only
      - rejeicao de membro ja escalado na mesma escala
    - cobertura ampliada para `src/services/ministryService.ts` com cenarios de:
      - remocao de membro com exclusao previa de assignments
      - persistencia de capabilities com lista vazia e com payload real
    - cobertura ampliada para `src/services/eventService.ts` com cenarios de:
      - busca de proximos eventos por `end_at` e ordenacao por `start_at`
      - busca geral de eventos para tela com futuros + historico
      - criacao com normalizacao de range e termino padrao
      - categoria padrao `geral` para eventos sem categoria explicita
      - atualizacao sem sobrescrever `start_at` ao alterar apenas `end_at`
    - cobertura ampliada para `src/services/musicService.ts` com cenarios de:
      - troca completa da setlist via RPC transacional `replace_event_setlist`
      - propagacao de erro da RPC sem reler setlist potencialmente stale
    - cobertura adicionada para `src/utils/eventCategory.ts` com categorias em portugues e fallback para `geral`
    - cobertura adicionada para `src/utils/profileAvatar.ts` com:
      - iniciais padrao para avatar local
      - filtro de `avatar_url` vazio/placeholders
      - formatacao de telefone para leitura humana
  - Proximos alvos naturais:
    - expandir `scheduleService` para warnings, cards e validacoes adicionais
    - expandir `ministryService` para fluxos restantes
    - expandir `eventService` conforme novos metadados de evento forem definidos
    - utilitarios de renderizacao/estado de escala

- [~] Tipar navegacao e params
  - Ex.: `EventDetailsScreen` recebe `route/naviation` sem tipos.
  - Consolidar em `RootStackParamList` e tipos do React Navigation.
  - Estado atual:
    - `EventDetailsScreen` ja usa props tipadas do navigator
    - `EventDetails` no navigator ja aceita payload menor do que `Event`, reduzindo casts frageis no fluxo de escalas

- [ ] Padronizar timezone e datas
  - Hoje eventos sao criados usando `new Date(...).toISOString()` (ok para TIMESTAMPTZ)
  - Definir padrao:
    - app assume fuso local da igreja
    - sempre salvar em UTC (ISO) e formatar no client
    - campos de data/hora nunca iniciam vazios; default visual e funcional deve usar a data/hora atual do sistema em runtime quando o usuario ainda nao selecionou valor
    - para eventos sem horario de termino informado, usar duracao padrao de `3 horas`
  - Atualizacao registrada em 2026-04-23:
    - a regra de read-only agora bloqueia exatamente em `start_at`
    - `start_at` deve ser tratado como instante absoluto no app e no banco
    - ver referencia de implementacao em `docs/SCHEDULE_READ_ONLY_BY_HOUR_PLAN.md`

---

## P2 (Medio) - Notificacoes

- [ ] Criar notificacao ao:
  - [x] novo assignment criado
    - notificacao direta ao usuario escalado quando entrar em uma escala
  - evento privado criado/atualizado para audiencia selecionada
    - usuarios escolhidos manualmente devem poder receber notificacao no futuro
  - [x] swap request criado/atualizado
  - [x] swap request criado para:
    - membros elegiveis do mesmo ministerio e mesma funcao
    - lider responsavel pela escala
  - [x] acompanhamento operacional do lider:
    - quando o pedido for criado
    - quando alguem assumir a troca
    - quando o pedido for cancelado
  - reserva de sala criada/cancelada
  - (opcional) confirmacao/declinio

  - Estado atual confirmado no codigo:
    - existe migration local para emitir notificacoes de swap no backend:
      - `created`
      - `accepted`
      - `cancelled`
    - existe migration local para emitir notificacao de `schedule.assigned` ao criar assignment
    - existe `notificationService` para:
      - listar notificacoes
      - marcar uma como lida
      - marcar todas como lidas
      - assinar notificacoes por realtime
    - `NotificationsModal` agora usa a tabela `notifications`
    - a Home agora mostra badge de nao lidas e reidrata a inbox por focus/modal
    - a navegacao contextual da inbox abre:
      - `SwapRequests`
      - `EditSchedule`

  - PENDENTE DE DEFINICAO:
    - copy final de titulo/corpo por tipo
    - se elegiveis devem receber notificacao de encerramento quando outra pessoa assumir a vaga

  - Pendencia operacional:
    - aplicar no Supabase remoto as migrations locais ainda pendentes:
      - `20260412000110_add_swap_request_notifications.sql`
      - `20260412000111_fix_schedule_rls_recursion.sql`
      - `20260412000112_reset_assignment_confirmation_on_swap_request.sql`
      - `20260522000128_add_schedule_assignment_notifications.sql`

- [x] Integrar realtime para inbox de notificacoes
  - `notifications` agora tem tabela, modal real, badge de nao lidas e assinatura Supabase Realtime por `user_id`

### Plano tecnico recomendado para notificacoes de swap

- Confirmado no codigo:
  - a tabela `notifications` ja existe no banco
  - o fluxo de swap ja identifica corretamente:
    - lideres do ministerio como interessados operacionais
    - membros elegiveis do mesmo ministerio e mesma funcao/capability
  - usuarios comuns nao devem inserir direto em `notifications`; a geracao precisa acontecer por mecanismo privilegiado no backend

- Implementacao recomendada por etapas:
  1. Criar funcao SQL `SECURITY DEFINER` para inserir notificacoes de forma segura.
  2. Padronizar `notifications.type = 'swap_request'` com `data` contendo:
     - `swap_request_id`
     - `schedule_id`
     - `event_id`
     - `ministry_id`
     - `role_id`
     - `assignment_id`
     - `actor_user_id`
     - `action` (`created`, `accepted`, `cancelled`)
  3. Disparar no backend ao criar swap:
     - para lider(es) do ministerio da escala
     - para membros elegiveis da mesma funcao/capability
  4. Disparar no backend ao aceitar swap:
     - para o solicitante
     - para lider(es) do ministerio
     - opcionalmente para elegiveis remanescentes, avisando que a vaga foi preenchida
  5. Disparar no backend ao cancelar swap:
     - para lider(es) do ministerio
     - opcionalmente para elegiveis impactados
  6. Substituir o mock de `NotificationsModal` por leitura real da tabela `notifications`, com ordenacao por `created_at desc`, marcacao de leitura e navegacao contextual

- PENDENTE DE DEFINICAO:
  - texto final de titulo/corpo por tipo de notificacao
  - se notificacoes de encerramento devem ir tambem para todos os elegiveis
  - se o lider recebe uma notificacao por swap ou agregacoes futuras

---

## P2 (Medio) - Salas e Reservas

- [x] Implementar queries reais de disponibilidade
  - A tabela `room_reservations` ja tem exclusao de overlap via GiST.
  - App precisa listar disponibilidade por janela de horario.
- [x] Evoluir `RoomsScreen` para agenda diaria por sala
  - mostrar todas as reservas do dia
  - mostrar badge `Evento` quando `room_reservations.event_id` estiver preenchido
  - mostrar cronograma simples separado das escalas vinculadas ao evento
- [x] Permitir cancelamento da propria reserva avulsa sem cancelar reserva vinculada a evento

---

## P2 (Medio) - Musicas e Setlists

- [ ] Implementar tela de musica individual (letra/cifra via URL)
- [x] Implementar setlist por evento (`event_setlists` + ordenacao)
  - entregue em modo simples no `MusicScreen`, focado no proximo evento
  - permissao de escrita alinhada por migration com `can_manage_events`

---

## P2 (Medio) - Escola Biblica

- [ ] Arquitetar o dominio de `escola biblica`
  - Referencia inicial: `docs/BIBLE_SCHOOL_IDEA.md`
  - Objetivo desta fase:
    - mapear o fluxo principal
    - definir se vira modulo proprio no app
    - definir como isso conversa com membros, escalas e presenca
  - Escopo funcional inicial a discutir:
    - turmas
    - professores
    - registro de presenca
    - escalas
    - paginas/listagens/detalhes
  - Ponto importante de UX:
    - decidir onde isso entra no app sem poluir o fluxo principal atual de eventos e escalas
    - avaliar se fica como area propria no menu/navegacao ou se entra dentro de um modulo administrativo
  - Nao implementar antes de fechar:
    - regras de permissao
    - modelo de dados
    - relacao com ministerios, membros e eventos
    - quem pode criar turma, lancar presenca e gerenciar professores

---

## P2/P3 - UX e Operacao

- [ ] Loading/error states consistentes em todas as telas
- [ ] Pull-to-refresh (Home, Events, MySchedules)
- [ ] Estados vazios com mensagem clara
- [ ] Arquitetar fluxo de `cadastro de visitante`
  - Referencia inicial: `docs/VISITOR_REGISTRATION_IDEA.md`
  - Objetivo nesta fase:
    - definir se o registro nasce como formulario no app
    - definir quais campos minimos entram no primeiro MVP
    - definir quem pode registrar visitante (`recepcao`, `admin`, `pastor`, lideres ou membros em geral)
  - Nao implementar antes de fechar:
    - regra de permissao
    - destino dos dados no produto
    - relacionamento com membro existente, convite e acompanhamento pastoral
- [ ] Definir estrategia futura de retencao/limpeza de escalas antigas
  - nao e prioridade agora
  - por enquanto permanecem como historico somente leitura

---

## Checklist de Entregavel (Primeiro Fluxo Completo)

- [x] Admin cria evento (ja existe)
- [x] Lider/admin cria schedule para (evento, ministerio)
- [x] Lider/admin adiciona assignments (membro + role)
- [x] Lider/admin remove assignments com confirmacao explicita do usuario
- [x] Lider/admin atualiza dados basicos da escala
- [x] Lider/admin exclui escala com confirmacao explicita do usuario
- [x] Membro ve evento apenas como informativo
- [x] Membro confirma presenca
- [~] (Opcional) Membro solicita troca

