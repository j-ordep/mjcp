# MJCP Mobile - Tarefas e Melhorias (Backlog)

Data: 2026-04-05 (America/Sao_Paulo)

Objetivo imediato: sair do prototipo e fechar o fluxo principal de "Criacao de Escalas" com regra:
- Admin pode criar/gerenciar tudo
- Lider so cria/gerencia escalas da(s) sua(s) area(s)/ministerio(s)
- Lider tambem pode se auto-escalar no proprio ministerio, desde que respeite as mesmas validacoes de membro/funcao da escala
- Membro apenas visualiza e interage com o que for dele (confirmar/trocar)
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

- [x] Permitir que lider gerencie ministry_members e ministry_member_roles apenas do proprio ministerio
  - Necessario para tela separada de gestao de membros/capacidades
  - Admin continua com acesso total

- [x] Endurecer integridade de `schedule_assignments` (evitar dados inconsistentes)
  - Garantir que `role_id` pertence ao mesmo `ministry_id` da `schedule`
  - Garantir que `user_id` pertence ao ministerio (existe `ministry_members` para aquele usuario)
  - Implementar via:
    - constraint com trigger/funcao (se necessario), ou
    - mover criacao de assignment para uma unica RPC (recomendado) que valida tudo no servidor

- [ ] Validacoes de data no banco
  - [ ] `events`: `end_at` deve ser > `start_at` quando `end_at` nao for nulo
  - [ ] `room_reservations`: `end_at > start_at`
  - Regra de produto confirmada em 2026-04-05:
    - `events.start_at` e obrigatorio
    - nao permitir criar evento com `start_at` no passado
    - se o usuario nao informar `end_at`, o sistema deve preencher automaticamente `start_at + 3 horas`

- [ ] Indices para performance basica
  - [ ] `schedule_assignments (user_id, status)`
  - [ ] `schedules (event_id, ministry_id)` (ja existe UNIQUE, mas pode precisar index explicito dependendo do Postgres/plano)
  - [ ] `events (start_at)` ja existe; avaliar `events (end_at)`

---

## P0 (Critico) - Fluxo de Criacao de Escalas (Produto)

Decisao atualizada em 2026-04-07:
- separar claramente `criacao da escala` de `montagem da equipe`
- `CreateScheduleScreen` deve cuidar apenas do Step 1: contexto da escala
- a montagem da equipe deixa de acontecer na mesma tela da criacao
- depois de salvar a escala, o usuario volta para `MySchedulesScreen`
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
  - `MySchedulesScreen` continua como ponto de entrada da operacao
  - CTA `Criar Escala` abre apenas o Step 1
  - ao salvar, voltar para a lista de escalas
  - ao tocar em uma escala, abrir nova tela/modal de `Editar Escala`
  - evitar misturar criacao + membros na mesma superficie

- [x] Criar tela de `Editar Escala`
  - editar dados basicos da escala
  - gerenciar equipe da escala
  - adicionar/remover assignments
  - respeitar permissao por ministerio

- [x] Revisar `MySchedulesScreen` para servir melhor como hub operacional de escalas
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
    - Criar/editar `schedules` (1 por (event_id, ministry_id))
    - Adicionar `schedule_assignments` (membro + funcao/role)
    - Mostrar warnings (nao bloquear) para:
      - membro bloqueou data (`blocked_dates`)
      - conflito com outro ministerio no mesmo horario (soft conflict)

- [x] Implementar service de "criar escala" com validacoes
  - Arquivo: `src/services/scheduleService.ts`
  - Sugestao de funcoes:
    - `createSchedule({ eventId, ministryId, notes? })`
    - `upsertScheduleAssignment({ scheduleId, userId, roleId })`
    - `removeScheduleAssignment(assignmentId)`
    - `checkBlockedDates(userId, dateRange)`
    - `checkConflicts(userId, eventId)`
  - Observacao: hoje existe leitura (`getUpcomingUserSchedules`, `getUpcomingAllSchedules`, `getAssignmentsByEvent`), mas nao existe escrita.

- [x] Fechar regra "lider de uma area cria escala para a area dele"
  - Backend (RLS/RPC) deve ser a fonte de verdade (nao depender do app para bloquear).
  - Frontend apenas esconde o botao se nao tiver permissao.
  - Regra complementar confirmada:
    - lider pode atribuir a si mesmo uma funcao no proprio ministerio
    - isso nao cria permissao extra fora do ministerio dele
    - continua valendo a regra de integridade: `user_id` precisa pertencer ao ministerio e `role_id` precisa pertencer ao mesmo ministerio da `schedule`

---

## P1 (Alto) - Conectar Interacoes do Membro

- [ ] Confirmar presenca (membro)
  - Onde esta o TODO:
    - `src/screens/app/MySchedulesScreen.tsx` (botao "Confirmar")
    - `src/screens/app/EventDetailsScreen.tsx` (botao "Confirmar presenca")
  - Implementar update em `schedule_assignments`:
    - `status = 'confirmed'`
    - `confirmed_at = now()`
  - Regras:
    - so o dono do assignment pode confirmar (policy ja existe para UPDATE own)

- [ ] Solicitar troca (membro)
  - Criar `swap_requests` (ja existe tabela)
  - Definir UX minima:
    - usuario informa "motivo" e opcionalmente "para quem" (to_user_id)
    - notificar lider/admin

---

## P1 (Alto) - "Modos" de Cards (Evento vs Escala)

Contexto: o mesmo evento deve aparecer "simples" para quem nao esta escalado e "completo" para quem esta.

Decisao registrada em 2026-04-05:
- Direcao preferida atual:
  - `EventsScreen` permanece como card informativo de eventos
  - botoes de acao (`Confirmar`, `Preciso trocar`) ficam apenas nos cards de escala do usuario (`MySchedulesScreen`) e/ou em `EventDetailsScreen` quando ele estiver escalado
  - motivo: separa descoberta de eventos de acao operacional sobre a escala, reduz ruido visual e evita duplicar a mesma acao em duas listas
- Alternativa mantida documentada para reavaliacao futura:
  - `EventsScreen` pode exibir card enriquecido com acoes quando `is_assigned = true`
  - nesse modelo, o mesmo card mistura informacao de evento e acao de escala no feed geral
  - essa opcao pode ser reconsiderada se houver evidencias de que os usuarios usam mais a lista geral de eventos do que `MySchedulesScreen`

- [ ] Padronizar payload do backend para renderizacao de cards
  - Em vez de logica fragmentada, criar DTO/shape:
    - `is_assigned`
    - `my_role`
    - `my_ministry`
    - `team_counts` (confirmed/pending) quando aplicavel
  - Mesmo na direcao preferida, esse payload continua util para enriquecer `EventsScreen` com estado "voce esta escalado" sem expor botoes de acao.

- [ ] Implementar EventCard simples vs completo em `EventsScreen`
  - Hoje `EventsScreen` usa `EventCard` com `showActions={false}`
  - Direcao preferida atual:
    - se `is_assigned = false`: card simples, apenas informativo
    - se `is_assigned = true`: card informativo enriquecido com `my_ministry` e `my_role`, sem botoes de acao
    - acoes continuam em `MySchedulesScreen` e `EventDetailsScreen`
  - Caminho alternativo documentado:
    - se `is_assigned = true`: card completo com `my_ministry`, `my_role` e botoes `Confirmar` / `Preciso trocar`
    - exigir cuidado para nao duplicar acoes ja presentes em `MySchedulesScreen` e `EventDetailsScreen`
    - exigir definicao clara de prioridade entre telas para evitar estados inconsistentes e refresh duplicado

---

## P1 (Alto) - Tipos e Qualidade de Codigo

- [ ] Gerar/atualizar `src/types/database.types.ts`
  - Observacao: arquivo atualmente esta vazio.
  - Beneficio: tipagem forte do Supabase e menos `any`.

- [ ] Tipar navegacao e params
  - Ex.: `EventDetailsScreen` recebe `route/naviation` sem tipos.
  - Consolidar em `RootStackParamList` e tipos do React Navigation.

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
  - swap request criado/atualizado
  - reserva de sala criada/cancelada
  - (opcional) confirmacao/declinio

- [ ] Integrar realtime para notificar (opcional)
  - `notifications` ja tem tabela + modal no app

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

---

## Checklist de Entregavel (Primeiro Fluxo Completo)

- [x] Admin cria evento (ja existe)
- [x] Lider/admin cria schedule para (evento, ministerio)
- [x] Lider/admin adiciona assignments (membro + role)
- [ ] Membro ve evento no modo "escalado"
- [ ] Membro confirma presenca
- [ ] (Opcional) Membro solicita troca

