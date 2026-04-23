# MJCP Mobile - Tarefas e Melhorias (Backlog)

Data: 2026-04-05 (America/Sao_Paulo)

Referencia rapida:
- plano consolidado da proxima rodada: `docs/NEXT_STEPS_PLAN.md`
- historico documental e registros de rodadas: `docs/history/README.md`
- aplicacao remota no Supabase: `docs/SUPABASE_REMOTE_RUNBOOK.md`

Objetivo imediato: sair do prototipo e fechar o fluxo principal de "Criacao de Escalas" com regra:
- Admin pode criar/gerenciar tudo
- Lider so cria/gerencia escalas da(s) sua(s) area(s)/ministerio(s)
- Lider tambem pode se auto-escalar no proprio ministerio, desde que respeite as mesmas validacoes de membro/funcao da escala
- Membro apenas visualiza e interage com o que for dele (confirmar/trocar)
- Eventos sao apenas informativos; a operacao de escala nao deve depender da tela de evento
- Datas nao podem ficar em branco em formularios; quando nao houver valor inicial, o padrao deve ser a data/hora atual do sistema no momento da criacao/carregamento do formulario, ja selecionada no campo

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

- [x] Restringir confirmacao do proprio assignment no backend para antes do dia do evento
  - Problema:
    - o app ja bloqueava a acao no client, mas a policy de UPDATE do proprio assignment ainda podia ser usada fora do fluxo visual
  - Atualizacao em 2026-04-13:
    - nova migration local `20260413000113_restrict_member_assignment_status_updates.sql`
    - a policy do proprio membro agora exige que o evento ainda esteja antes do dia atual
  - Pendencia operacional:
    - aplicar a migration nova no Supabase remoto

- [ ] Validacoes de data no banco
  - [ ] `events`: `end_at` deve ser > `start_at` quando `end_at` nao for nulo
  - [ ] `room_reservations`: `end_at > start_at`
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
    - no dia do evento e depois dele, a escala vira historico e fica somente leitura
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
    - migration para impedir criacao/aceite/cancelamento de swap no dia do evento ou depois dele
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
    - `ScheduleScreen`, `EditScheduleScreen` e `scheduleService` foram alinhados para tratar o dia do evento como historico/somente leitura para as acoes ja bloqueadas por regra
    - a tela de edicao agora sinaliza explicitamente quando a escala esta somente leitura
    - a visao gerencial voltou a enxergar historico de escalas sem depender de filtro por horario exato
  - Atualizacao em 2026-04-23:
    - o filtro `Proximas` na tela de escalas deve ordenar por `data do evento` em ordem crescente
    - o filtro `Anteriores` na tela de escalas deve ordenar por `data do evento` em ordem decrescente, com a escala mais recente no topo
    - a ordenacao do historico deve seguir a data em que a escala aconteceu, e nao a data de criacao do registro

---

## P1 (Alto) - Separacao entre Evento e Escala

Contexto: eventos sao informativos para todos; escala e o fluxo operacional de quem participa do ministerio/função.

- `EventsScreen` nao deve variar por assignment, papel, ministerio ou participacao.
- `EventDetailsScreen` tambem deve permanecer informativa e nao deve carregar equipe, status, confirmacao ou troca.

- [ ] Padronizar payload do backend para renderizacao de cards
  - Em vez de logica fragmentada, criar DTO/shape:
    - `title`
    - `start_at`
    - `end_at`
    - `location`
    - `description`
    - `cover_image` ou metadado equivalente, se existir
  - Observacao:
    - a lista atual ainda mistura contexto de evento e escala em alguns pontos
    - consolidar um shape somente informativo ajuda a manter `EventsScreen` e a futura tela de detalhes de evento sem acao operacional

- [ ] Implementar `EventCard` apenas informativo em `EventsScreen`
  - Hoje `EventsScreen` usa `EventCard` com `showActions={false}`
  - Direcao preferida atual:
    - card sempre igual para todos os usuarios
    - nenhuma acao operacional de escala no card
    - eventuais melhorias devem ficar restritas a metadados do evento, nao a participation state
  - Futuro desejado:
    - `EventDetailsScreen` exibe apenas local, data/hora, descricao e links/metadados do evento, como video do culto se houver

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
      - bloqueio de criacao de escala no dia do evento
      - upsert de escala quando o evento ainda e editavel
      - bloqueio de remocao de assignment em read-only
    - cobertura ampliada para `src/services/ministryService.ts` com cenarios de:
      - remocao de membro com exclusao previa de assignments
      - persistencia de capabilities com lista vazia e com payload real
  - Proximos alvos naturais:
    - expandir `scheduleService` para warnings, cards e validacoes adicionais
    - expandir `ministryService` para fluxos restantes
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

---

## P2 (Medio) - Notificacoes

- [ ] Criar notificacao ao:
  - novo assignment criado
  - [~] swap request criado/atualizado
  - [~] swap request criado para:
    - membros elegiveis do mesmo ministerio e mesma funcao
    - lider responsavel pela escala
  - [~] acompanhamento operacional do lider:
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
    - existe `notificationService` para:
      - listar notificacoes
      - marcar uma como lida
      - marcar todas como lidas
    - `NotificationsModal` agora usa a tabela `notifications`

  - PENDENTE DE DEFINICAO:
    - copy final de titulo/corpo por tipo
    - se elegiveis devem receber notificacao de encerramento quando outra pessoa assumir a vaga

  - Pendencia operacional:
    - aplicar no Supabase remoto as migrations locais ainda pendentes:
      - `20260412000110_add_swap_request_notifications.sql`
      - `20260412000111_fix_schedule_rls_recursion.sql`
      - `20260412000112_reset_assignment_confirmation_on_swap_request.sql`

- [ ] Integrar realtime para notificar (opcional)
  - `notifications` ja tem tabela + modal real no app

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

- [ ] Implementar queries reais de disponibilidade
  - A tabela `room_reservations` ja tem exclusao de overlap via GiST.
  - App precisa listar disponibilidade por janela de horario.

---

## P2 (Medio) - Musicas e Setlists

- [ ] Implementar tela de musica individual (letra/cifra via URL)
- [ ] Implementar setlist por evento (`event_setlists` + ordenacao)

---

## P2/P3 - UX e Operacao

- [ ] Loading/error states consistentes em todas as telas
- [ ] Pull-to-refresh (Home, Events, MySchedules)
- [ ] Estados vazios com mensagem clara
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

