# Plano - Ajustar janela de read-only de dia para hora

Data: 2026-04-23 (America/Sao_Paulo)

## Objetivo

Trocar a regra atual de read-only baseada em `dia do evento` por uma regra baseada em `horario exato do evento`.

Regra alvo recomendada:

- antes de `event.start_at`: acoes permitidas conforme permissao do usuario
- em `event.start_at` ou depois: fluxo operacional da escala fica bloqueado

Isso deve valer de forma consistente para:

- confirmacao de presenca do proprio assignment
- criacao de swap
- aceite de swap
- cancelamento de swap
- gestao de equipe por `leader` / `admin`
- filtros `Proximas` e `Anteriores` na tela de escalas

---

## Contexto atual

Hoje o app e o banco ainda usam, em varios pontos, comparacoes por data-calendario:

- app:
  - `src/utils/scheduleRules.ts`
  - `src/services/scheduleService.ts`
  - `src/screens/app/ScheduleScreen.tsx`
  - `src/screens/app/EditScheduleScreen.tsx`
- banco:
  - `supabase/migrations/20260404000104_harden_rls_and_integrity.sql`
  - `supabase/migrations/20260412000110_add_swap_request_notifications.sql`
  - `supabase/migrations/20260412000111_fix_schedule_rls_recursion.sql`
  - `supabase/migrations/20260413000113_restrict_member_assignment_status_updates.sql`

Isso gera dois problemas:

1. o bloqueio acontece a meia-noite do dia do evento, e nao no horario real do evento
2. app e banco podem divergir quando fazem comparacao por data em fusos diferentes

---

## Decisao tecnica recomendada

Padrao unico:

- persistencia continua em UTC (`TIMESTAMPTZ` / ISO)
- comparacoes de bloqueio devem usar timestamp completo
- app compara `new Date(start_at).getTime()` com `Date.now()`
- banco compara `start_at <= now()` ou `start_at > now()`

Regra de seguranca:

- banco continua sendo fonte final de verdade
- UI apenas antecipa e comunica o bloqueio

---

## Impacto por camada

### 1. App / utilitarios

Arquivos principais:

- `src/utils/scheduleRules.ts`
- `tests/scheduleRules.test.ts`

Mudancas:

- substituir helpers baseados em inicio do dia por helpers baseados em timestamp exato
- manter filtro:
  - `current` = `start_at > now`
  - `past` = `start_at <= now`
- revisar nomes para evitar ambiguidade entre `event day` e `event time`

### 2. Service layer

Arquivos principais:

- `src/services/scheduleService.ts`
- `tests/scheduleService.test.ts`

Mudancas:

- `createScheduleValidated`
- `deleteSchedule`
- `removeScheduleAssignment`
- `confirmMyAssignmentsForSchedule`
- `validateScheduleAssignmentIntegrity`

Todos devem usar a nova regra por horario exato e mensagens coerentes com isso.

### 3. Telas

Arquivos principais:

- `src/screens/app/ScheduleScreen.tsx`
- `src/screens/app/EditScheduleScreen.tsx`
- `src/screens/app/SwapRequestsScreen.tsx`

Mudancas:

- CTA e hints devem dizer `ate o horario do evento`, nao mais `no dia do evento`
- escalas do mesmo dia, mas ainda futuras, devem continuar em `Proximas`
- ao passar do horario exato, migram para `Anteriores`

### 4. Banco / RLS / RPC

Arquivos principais:

- nova migration para policies de `events`, `schedules` e `schedule_assignments`
- nova migration para `accept_swap_request`
- nova migration para `cancel_own_swap_request`
- nova migration para `validate_swap_request_creation`
- possivelmente update do runbook em `docs/SUPABASE_REMOTE_RUNBOOK.md`

Mudancas:

- trocar `current_date` / `::date` por comparacao de timestamp
- alinhar `leader/admin` com mesma janela horaria
- alinhar membro com mesma janela horaria
- alinhar swap create/accept/cancel com mesma janela horaria

---

## Sequencia de execucao recomendada

### Fase 1 - Fechar regra de dominio

1. Confirmar regra final:
   - bloqueia exatamente em `start_at`
   - ou bloqueia apenas depois de `start_at`
2. Recomendacao:
   - considerar bloqueado em `start_at` ou depois

### Fase 2 - Ajustar banco primeiro

1. Criar migration nova para policies de `events`, `schedules`, `schedule_assignments`
2. Criar migration nova para RPCs/triggers de swap
3. Revisar impacto no Supabase remoto antes de aplicar
4. Atualizar `docs/SUPABASE_REMOTE_RUNBOOK.md`

### Fase 3 - Ajustar app

1. Refatorar `src/utils/scheduleRules.ts`
2. Aplicar nova regra em `scheduleService`
3. Ajustar telas e copies
4. Garantir que filtro `Proximas/Anteriores` siga horario exato

### Fase 4 - Testes

1. Cobrir helpers com casos antes/no/depois do horario
2. Cobrir `scheduleService` com casos antes/no/depois do horario
3. Cobrir transicao no mesmo dia:
   - evento hoje 20:00, agora 10:00 -> ainda `Proximas`
   - evento hoje 20:00, agora 20:00 -> bloqueado / `Anteriores`
   - evento hoje 20:00, agora 21:00 -> bloqueado / `Anteriores`

### Fase 5 - Documentacao

Atualizar depois da implementacao:

- `docs/ROADMAP.md`
- `docs/TASKS.md`
- `docs/CONTEXT.md`
- `docs/scheduling_model.md`
- `docs/SUPABASE_REMOTE_RUNBOOK.md`

---

## Riscos principais

### 1. Divergencia de timezone

Risco:

- app interpretar horario em timezone local
- banco comparar em UTC com resultado diferente

Mitigacao:

- salvar e ler `start_at` sempre como instante absoluto
- comparar timestamp completo
- evitar `::date`, `current_date` e truncamento para meia-noite

### 2. Regressao em historico

Risco:

- evento do mesmo dia sumir cedo demais de `Proximas`

Mitigacao:

- teste explicito para evento no mesmo dia, mas ainda futuro

### 3. Desalinhamento parcial

Risco:

- UI mudar para horario, mas banco continuar por dia

Mitigacao:

- executar banco primeiro
- so depois ajustar service/UI

---

## Criterios de aceite

- evento do mesmo dia continua em `Proximas` ate chegar `start_at`
- ao chegar `start_at`, escala entra em estado bloqueado
- confirmacao propria passa a falhar exatamente no horario do evento
- swap create/accept/cancel passa a falhar exatamente no horario do evento
- `leader/admin` deixam de editar equipe exatamente no horario do evento
- app e banco usam a mesma regra temporal
- testes cobrem antes/no/depois do horario

---

## Recomendacao final

Vale fazer.

Nao e mudanca gigante, mas deve ser tratada como ajuste de dominio completo, nao como patch visual.

Melhor ordem:

1. migration/RLS/RPC
2. service layer
3. telas
4. testes
5. docs
