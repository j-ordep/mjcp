# MJCP Mobile - Next Steps Plan

Data de consolidacao: 2026-04-14 (America/Sao_Paulo)

> Este documento consolida o contexto operacional do app e o plano da proxima rodada.
> A fonte primaria continua sendo `supabase/migrations/*.sql` e `src/`.
> `docs/TASKS.md` permanece como backlog vivo; este arquivo organiza prioridade, contexto e sequencia de execucao.

---

## 1. Visao geral do app

O `MJCP Mobile` e um app de gestao de igreja e ministerios com foco em:

- eventos da igreja
- escalas por ministerio
- membros e capabilities
- confirmacao de presenca
- trocas de assignment
- indisponibilidades
- reservas de sala
- musicas e setlists

### Dominio principal atual

O dominio mais maduro hoje e `escala`.

- `evento` e superficie informativa
- eventos publicos sao visiveis para todos os usuarios autenticados
- eventos privados sao visiveis para:
  - `admin`
  - usuarios com `profiles.can_manage_events = true`
  - audiencia selecionada em `event_audiences`, quando houver
- `escala` e o fluxo operacional de quem participa de ministerio e funcao
- a regra de dados `schedule belongs to event` continua valida
- a experiencia do usuario deve deixar claro quando ele esta em `Eventos` e quando esta em `Escalas`

---

## 2. Estado real por dominio

### Autenticacao e estrutura base

**Confirmado no codigo**

- autenticacao Supabase existe de forma parcial, mas funcional para o fluxo principal
- stores Zustand existem para auth, eventos, ministerios e escalas
- o service layer concentra a maior parte da orquestracao do dominio principal
- RLS e migrations do Supabase sao a base de integridade e permissao

### Eventos

**Confirmado no codigo**

- `EventsScreen` e tela informativa
- `EventDetailsScreen` e tela informativa
- ambas agora reutilizam o mesmo contrato canonico de apresentacao informativa (`toInformationalEventViewModel`) para card e detalhe
- `EventsScreen` lista proximos eventos e historico real
- `Proximos` e `Anteriores` agora classificam pelo fim efetivo do evento (`end_at`, com fallback em `start_at`) e mantem ordenacao por `start_at`
- criacao e edicao de evento agora usam permissao granular global:
  - `admin`
  - usuarios com `profiles.can_manage_events = true`
- a concessao/revogacao dessa permissao agora pode ser feita por `admin` no app; o SQL manual continua como fallback operacional
- eventos possuem categoria informativa simples em `events.category`, com valores em portugues
- eventos podem ser publicos ou privados; quando privados, a visibilidade fica restrita a `event_audiences`
- no MVP atual, `event_audiences` tambem representa a lista de convite/convocacao do evento
- reuniao continua sendo `evento`, sem entidade propria
- `EBD` continua coberta por `ensino`, sem categoria separada nesta fase
- a edicao de evento reidrata o estado canonico do backend por `eventId`, incluindo a audiencia privada selecionada
- o payload de edicao aberto a partir de `EventDetailsScreen` agora e saneado por whitelist, mantendo o dominio de evento puramente informativo
- admins tambem podem ser adicionados explicitamente na audiencia de eventos privados, preservando a lista de destinatarios escolhidos para evolucoes futuras como notificacoes
- a UI de eventos segue o tema claro minimalista do app: preto, branco e cinzas
- salas entraram no fluxo de forma opcional e controlada:
  - `CreateEventScreen` permite vincular uma sala quando houver uma unica data
  - `RoomsScreen` cria reservas independentes reais
  - `RoomsScreen` agora mostra agenda diaria por sala com reservas do dia, badge `Evento` e resumo simples de escalas vinculadas
  - o vinculo estrutural usa `room_reservations.event_id` opcional, e nao `events.room_id`
  - `location` textual continua existindo em paralelo
  - os nomes de sala continuam vindo de `rooms` no banco, nao de mock local
  - o catalogo padrao foi normalizado com migration segura para:
    - `Sala 1`
    - `Sala 2`
    - `Sala 3`
    - `Sala 4`
    - `Casa de Missoes`
    - `Templo`
  - a UI nao exibe mais lotacao/capacidade, embora `capacity` ainda exista no schema
- mesmo para `admin`, detalhe de evento continua informativo; escalas vinculadas seguem concentradas em `ScheduleScreen` / `EditScheduleScreen`

**PENDENTE DE DEFINICAO**

- definir metadados extras do detalhe de evento, como link de transmissao/video
- revisar UX final de evento + sala em uso real no app, agora que integracao opcional ja existe

**Direcao validada**

- evento nao deve exibir confirmar presenca, pedir troca, status de participacao ou equipe escalada
- qualquer diferenca por permissao em eventos deve ficar restrita a criar e editar

### Escalas

**Confirmado no codigo**

- `ScheduleScreen` e o hub operacional
- `CreateScheduleScreen` cria apenas o contexto da escala
- `EditScheduleScreen` concentra equipe, contexto e participacao do usuario
- leader/admin gerenciam escalas do proprio ministerio
- member atua apenas no que e dele
- o filtro `Proximas` ordena escalas pela `data do evento` em ordem crescente
- o filtro `Anteriores` ordena escalas pela `data do evento` em ordem decrescente, mantendo a escala que aconteceu mais recentemente no topo do historico
- o backend agora bloqueia novo assignment duplicado do mesmo membro na mesma escala

**Pontos ainda para evoluir**

- confirmar no Supabase remoto que as migrations mais recentes de `start_at`, leitura informativa de eventos e bloqueio de duplicidade em escala foram aplicadas
- ampliar cobertura de testes do service layer

### Trocas

**Confirmado no codigo**

- existe criacao de swap, cancelamento da propria solicitacao e aceite pela primeira pessoa elegivel
- o lider nao aprova swap; ele apenas acompanha e pode agir manualmente na escala se necessario
- `SwapRequestsScreen` ja lista trocas disponiveis e proprias

**Pendente operacional**

- aplicar no projeto Supabase remoto as migrations locais que fecham o fluxo e as notificacoes operacionais

### Notificacoes

**Confirmado no codigo**

- o app ja consome a inbox real via tabela `notifications`
- existe `notificationService` para listar e marcar como lida
- ja existe migration local para gerar notificacoes de swap no backend

**Pendente**

- aplicar migrations remotas
- fechar copy final e comportamento complementar de notificacoes
- evoluir notificacoes para:
  - usuarios escolhidos em eventos privados
  - usuarios adicionados a uma escala

### Salas, musicas e setlists

**Confirmado no repo**

- `RoomsScreen` ja funciona com:
  - disponibilidade por janela
  - agenda diaria por sala
  - reserva avulsa real
  - cancelamento da propria reserva avulsa ativa
- `BlockDatesScreen` ja persiste indisponibilidades reais do usuario em `blocked_dates`
- a integracao com escala continua warning-only e reaproveita `getAssignmentWarningsForSchedule`
- `MusicScreen` deixou de usar arrays mockados:
  - carrega catalogo real de `songs`
  - mostra o setlist real do proximo evento via `event_setlists`
  - permite edicao simples do setlist do proximo evento para quem gerencia eventos
  - a troca completa da setlist agora passa por RPC transacional no banco, evitando perda parcial em falha entre delete e insert
- pendencia operacional remota desta frente:
  - aplicar `20260515000126_add_replace_event_setlist_rpc.sql`

### Perfil e hygiene

**Confirmado no codigo**

- `HeaderPrimary`, `HomeScreen`, `ProfileScreen` e `EditProfileScreen` nao dependem mais de geradores externos de avatar
- o app usa apenas `avatar_url` real ou iniciais locais derivadas de `profile.full_name`
- o perfil parou de exibir CTA enganoso de troca de foto
- `BottomSheetMenu` nao expoe mais acoes fake de compartilhar perfil ou configurar notificacoes
- `ProfileScreen` trocou o bloco mockado de atividades recentes por um resumo simples da POC com dados reais
- `ProfileScreen` mostra telefone formatado para leitura humana
- `CalendarModal` reseta a selecao temporaria ao abrir novamente
- `BlockDatesScreen` trava interacoes durante `isSaving`, evitando alteracoes perdidas logo antes de fechar
- `YoutubeCarousel` ja ignora placeholders publicos de `EXPO_PUBLIC_YOUTUBE_API_KEY`, evitando fetch inutil sem chave real

---

## 3. Proximos passos por prioridade

## P0 - Fechar o fluxo de escalas

- [x] Revisar historico e somente leitura em todos os pontos centrais do fluxo de escala
  - `ScheduleScreen`, `EditScheduleScreen` e `scheduleService` agora usam a mesma regra baseada em `start_at`
  - a UX gerencial passou a sinalizar e bloquear alteracoes exatamente em `start_at` ou depois
- [x] Validar que toda acao operacional continue fora do dominio de evento
  - `EventsScreen` e `EventDetailsScreen` seguem como superficies informativas, sem confirmar/trocar/status/equipe
- [~] Cobrir `scheduleService` com testes unitarios
  - ja coberto nesta rodada:
    - bloqueio de criacao em `start_at` ou depois
    - criacao/upsert quando o evento ainda e editavel
    - bloqueio de remocao de assignment em read-only
  - ainda falta ampliar para cards, warnings e regras adicionais do service layer
- [~] Cobrir `ministryService` com testes unitarios nos mapeamentos e filtros principais
  - ja coberto nesta rodada:
    - remocao de membro com exclusao previa de assignments
    - persistencia de capabilities com lista vazia e com payload real
  - ainda falta ampliar para outros fluxos do service

## P1 - Banco, integridade e ambiente

1. Confirmar no Supabase remoto as migrations mais recentes:
   - `20260423000115_align_schedule_read_only_with_event_start_time.sql`
   - `20260423000116_simplify_event_read_policy.sql`
   - `20260426000117_prevent_duplicate_member_schedule_assignments.sql`
   - `20260427000118_add_event_category.sql`
   - `20260428000119_add_private_event_audiences.sql`
   - `20260509000123_add_event_management_permission.sql`
   - `20260511000124_add_profile_event_management_permission_rpc.sql`
   - `20260512000125_allow_event_managers_to_manage_event_setlists.sql`
   - `20260515000126_add_replace_event_setlist_rpc.sql`
   - migrations de notificacoes de swap, se ainda nao estiverem aplicadas no projeto remoto
2. Implementar validacoes de data ainda pendentes no banco:
   - `events.end_at > start_at` quando `end_at` existir
   - `room_reservations.end_at > start_at`
   - default de `end_at = start_at + 3h` quando o usuario nao informar termino
   - nao permitir criar evento com `start_at` no passado
3. Revisar indices basicos ainda faltantes conforme uso real das queries

## P1 - Consolidar dominio de eventos como informativo

1. Manter o contrato canonico informativo compartilhado entre card e detalhe, sem reintroduzir payload fragmentado por tela
2. Garantir que `EventsScreen` nao varie por assignment, participacao, ministerio ou papel
3. Manter `EventsScreen` com proximos eventos e historico real, sem acoes operacionais de escala
4. Manter em eventos apenas metadados de contexto como:
   - titulo
   - data/hora
   - local
   - descricao
   - links e anexos futuros, como video do culto

## P2 - Qualidade geral e modulos secundarios

1. Revisar `src/types/database.types.ts` para reduzir fragilidade de tipagem
2. Padronizar timezone e datas no app com persistencia em UTC e formatacao no client
3. Fechar loading, error e empty states nas telas principais
4. Validar em uso real a nova UI admin de grant/revoke de `profiles.can_manage_events`
5. Confirmar operacao remota da Fase 4 do core de eventos:
   - validar no Supabase remoto a migration `20260504000122_normalize_room_catalog.sql`
   - confirmar no banco o catalogo padrao de salas
   - validar o read-model diario de salas com dados reais
6. Depois retomar musicas e setlists; salas ja entraram no fluxo principal basico desta fase
7. Fechar guardrails restantes de bootstrap/config:
   - endurecer feedback para `.env` publico incompleto de `EXPO_PUBLIC_SUPABASE_*`
   - revisar mensagens de erro cruas e strings com mojibake nas telas/services mais visiveis

---

## 4. Dependencias, riscos e observacoes

### Dependencias externas

- aplicacao das migrations locais no ambiente Supabase remoto
- eventual validacao de comportamento em dados reais apos deploy das migrations
- runbook operacional consolidado em `docs/SUPABASE_REMOTE_RUNBOOK.md`

### Riscos principais

- divergencia entre o que esta documentado e o que ja mudou no codigo
- regras temporais ja alinhadas em `start_at` no repo local, mas ainda dependentes de aplicacao completa no ambiente remoto
- cobertura de testes ainda concentrada em utils e mapeadores, com pouco service layer

### Regras de trabalho para a proxima rodada

- tratar `src/` e `supabase/migrations` como fonte primaria
- manter `docs/TASKS.md` enxuto como backlog priorizado
- usar este arquivo como guia de retomada e sequencia de execucao
- nao recolocar prompts, rascunhos ou notas de rodada na raiz de `docs/`

---

## 5. Mapa atual da documentacao

### Documentacao viva na raiz de `docs/`

- `CONTEXT.md` - visao geral e estado atual do projeto
- `system_design.md` - arquitetura e principios tecnicos
- `scheduling_model.md` - regras de dominio de escalas, capabilities, assignments e trocas
- `ROADMAP.md` - direcao de produto por frentes
- `TASKS.md` - backlog operacional priorizado
- `NEXT_STEPS_PLAN.md` - plano consolidado da proxima rodada

### Historico em `docs/history/`

- registros de rodadas fechadas
- prompts e rascunhos antigos
- notas operacionais pontuais ja consolidadas

---

## 6. Primeiro passo da proxima execucao

Ao retomar o trabalho, iniciar por esta ordem:

1. revisar `docs/TASKS.md` e este arquivo
2. revisar `docs/EVENT_CORE_PHASE2_IMPLEMENTATION_PLAN.md`
3. validar remoto das migrations e catalogo de salas
4. definir a proxima fase de `eventos` a partir do uso real da permissao granular e da UX de salas
5. depois retomar `notificacoes` e demais modulos
