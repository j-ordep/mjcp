# MJCP Mobile - Runbook de aplicacao remota no Supabase

Data de consolidacao: 2026-04-27 (America/Sao_Paulo)

> Este arquivo organiza o que precisa ser aplicado no projeto Supabase remoto para alinhar o ambiente com o estado atual do repositorio.
> Fonte primaria: `supabase/migrations/*.sql`.

---

## 1. Objetivo desta rodada

Aplicar no Supabase remoto as migrations locais pendentes que fecham o fluxo principal de escalas e trocas:

1. `20260412000111_fix_schedule_rls_recursion.sql`
2. `20260412000112_reset_assignment_confirmation_on_swap_request.sql`
3. `20260412000110_add_swap_request_notifications.sql`
4. `20260413000113_restrict_member_assignment_status_updates.sql`
5. `20260413000114_add_schedule_assignment_status_index.sql`
6. `20260423000115_align_schedule_read_only_with_event_start_time.sql`
7. `20260423000116_simplify_event_read_policy.sql`
8. `20260426000117_prevent_duplicate_member_schedule_assignments.sql`
9. `20260427000118_add_event_category.sql`
10. `20260428000119_add_private_event_audiences.sql`
11. `20260509000123_add_event_management_permission.sql`
12. `20260511000124_add_profile_event_management_permission_rpc.sql`

---

## 2. O que cada migration faz

### `20260412000110_add_swap_request_notifications.sql`

- adiciona funcoes de notificacao para swap:
  - `notify_swap_request_created`
  - `notify_swap_request_accepted`
  - `notify_swap_request_cancelled`
- cria trigger `swap_requests_notify_created`
- redefine as funcoes:
  - `accept_swap_request`
  - `cancel_own_swap_request`
- impacto funcional:
  - lideres e membros elegiveis passam a receber notificacoes ao abrir troca
  - solicitante e lideres recebem notificacao ao aceite
  - lideres recebem notificacao ao cancelamento

### `20260412000111_fix_schedule_rls_recursion.sql`

- remove policies `FOR ALL` que causavam recursao indireta em `schedules` e `schedule_assignments`
- recria policies separadas para `INSERT`, `UPDATE` e `DELETE`
- impacto funcional:
  - corrige erro estrutural de RLS
  - mantem visibilidade por `SELECT` separada da janela de editabilidade

### `20260412000112_reset_assignment_confirmation_on_swap_request.sql`

- cria a funcao `reset_assignment_confirmation_on_swap_request`
- cria trigger `swap_requests_reset_assignment_confirmation`
- impacto funcional:
  - ao abrir uma troca, o assignment volta imediatamente para `pending`
  - evita que um assignment permaneça confirmado enquanto esta em troca

### `20260413000113_restrict_member_assignment_status_updates.sql`

- substitui a policy do proprio membro por uma versao com restricao temporal
- impacto funcional:
  - membro so pode atualizar o proprio assignment antes de `start_at`
  - protege o backend contra bypass do bloqueio ja existente na UI

### `20260413000114_add_schedule_assignment_status_index.sql`

- cria o indice:
  - `schedule_assignments_user_status_idx`
- impacto funcional:
  - melhora consultas comuns de participacao, confirmacao e swaps

---

### `20260423000115_align_schedule_read_only_with_event_start_time.sql`

- alinha policies e funcoes do dominio de escala ao instante exato de inicio do evento
- impacto funcional:
  - admin/leader so podem criar, editar ou excluir `events`, `schedules` e `schedule_assignments` antes de `start_at`
  - o proprio membro so pode atualizar o assignment antes de `start_at`
  - criacao, aceite e cancelamento de swap passam a bloquear exatamente em `start_at`

### `20260423000116_simplify_event_read_policy.sql`

- simplifica a leitura de eventos para nao depender de escala, ministerio ou participacao
- impacto funcional:
  - eventos continuam informativos e iguais para todos os usuarios autenticados
  - evita recursao residual entre policies de `events` e `schedules`

### `20260426000117_prevent_duplicate_member_schedule_assignments.sql`

- cria indice auxiliar por `(schedule_id, user_id)`
- cria trigger para impedir que o mesmo membro seja escalado mais de uma vez na mesma escala
- impacto funcional:
  - reforca no banco a regra ja sinalizada pela UI
  - bloqueia novas duplicidades sem apagar registros historicos existentes

### `20260427000118_add_event_category.sql`

- adiciona `events.category` com valores em portugues:
  - `geral`
  - `culto`
  - `ensino`
  - `jovens`
  - `oração`
  - `reunião`
  - `especial`
- impacto funcional:
  - permite badges informativos na tela de eventos e nos detalhes
  - nao altera permissao, escala, participacao ou regras de RLS

### `20260428000119_add_private_event_audiences.sql`

- cria a tabela `event_audiences`
- redefine a leitura de `events` para permitir:
  - eventos publicos para todos os usuarios autenticados
  - eventos privados apenas para `admin` e usuarios explicitamente vinculados
- impacto funcional:
  - `CreateEventScreen` pode escolher membros quando o evento nao e publico
  - a visibilidade deixa de depender de convencao de frontend e passa a ser garantida por RLS

### `20260509000123_add_event_management_permission.sql`

- adiciona `profiles.can_manage_events`
- cria a helper `public.can_manage_events()`
- atualiza policies de escrita de `events`
- atualiza policies de `event_audiences`
- redefine a leitura de eventos privados para incluir gestores de evento
- redefine a RPC `save_event_with_optional_room_reservation` para aceitar gestores de evento
- recria defensivamente `public.is_event_editable_before_start(...)` caso o remoto ainda nao tenha essa helper
- impacto funcional:
  - usuarios autorizados por flag podem criar/editar/excluir eventos sem virar `admin`
  - a permissao tambem cobre audiencia privada e reserva opcional de sala no mesmo fluxo
  - prepara o backend para diferenciar claramente `admin` de gestores globais de evento

### `20260511000124_add_profile_event_management_permission_rpc.sql`

- cria a RPC `set_profile_event_management_permission`
- cria trigger defensiva para impedir alteracao indevida de `profiles.can_manage_events`
- impacto funcional:
  - `admin` pode conceder/revogar a flag pelo app sem abrir SQL
  - usuarios comuns continuam sem poder elevar a propria permissao

## 3. Ordem recomendada de aplicacao

Aplicar exatamente nesta ordem:

1. `20260412000111_fix_schedule_rls_recursion.sql`
2. `20260412000112_reset_assignment_confirmation_on_swap_request.sql`
3. `20260412000110_add_swap_request_notifications.sql`
4. `20260413000113_restrict_member_assignment_status_updates.sql`
5. `20260413000114_add_schedule_assignment_status_index.sql`
6. `20260423000115_align_schedule_read_only_with_event_start_time.sql`
7. `20260423000116_simplify_event_read_policy.sql`
8. `20260426000117_prevent_duplicate_member_schedule_assignments.sql`
9. `20260427000118_add_event_category.sql`
10. `20260428000119_add_private_event_audiences.sql`
11. `20260509000123_add_event_management_permission.sql`
12. `20260511000124_add_profile_event_management_permission_rpc.sql`

### Motivo da ordem

- `20260412000111` corrige primeiro a base de permissao/RLS usada pelo dominio principal
- `20260412000112` completa o comportamento correto do swap no banco
- `20260412000110` redefine RPCs e trigger do fluxo de swap e fica mais seguro depois da base acima
- `20260413000113` endurece a confirmacao do proprio membro
- `20260413000114` e apenas performance e pode entrar por ultimo
- `20260423000115` faz o alinhamento final da janela de read-only para bloquear exatamente em `start_at`
- `20260428000119` deve entrar depois da simplificacao de leitura de eventos, porque especializa a visibilidade publica/privada do dominio
- `20260509000123` fecha a permissao granular de eventos por cima da modelagem ja consolidada de audiencia privada e sala opcional
- `20260511000124` fecha a operacao segura de grant/revoke da flag no proprio app

### Pre-requisito critico

Antes desta rodada, confirme no remoto que a migration `20260404000104_harden_rls_and_integrity.sql` ja foi aplicada.

Sem esse baseline, a `20260412000111_fix_schedule_rls_recursion.sql` pode nao corrigir o conjunto esperado de policies.

---

## 4. Comandos para rodar

### Pre-checks

Na raiz do projeto:

```powershell
supabase --version
supabase login
supabase link --project-ref YOUR_SUPABASE_PROJECT_REF
supabase migration list
```

### Aplicacao normal recomendada

```powershell
supabase db push
```

Se o projeto remoto estiver correto e as migrations listadas acima ainda nao estiverem aplicadas, esse comando deve resolver tudo de uma vez.

Observacao:
- o Supabase CLI aplica por timestamp
- a ordem manual acima serve como ordem logica de revisao e fallback
- se voce optar por aplicar uma a uma no SQL Editor, siga a ordem manual deste runbook

### Se quiser conferir o diff antes

```powershell
supabase db diff
```

Observacao:
- usar `db push` continua sendo o fluxo principal
- `db diff` aqui serve apenas para inspecao

---

## 5. Checklist antes de confirmar o push

Antes de confirmar a aplicacao:

- conferir que o projeto linkado e o correto:
  - `YOUR_SUPABASE_PROJECT_REF`
- conferir que `20260404000104_harden_rls_and_integrity.sql` ja esta aplicada no remoto
- conferir se o ambiente remoto ja possui a base anterior de swap:
  - `20260410000107_swap_request_acceptance_flow.sql`
  - `20260410000108_enforce_single_pending_swap_per_schedule.sql`
  - `20260410000109_enforce_swap_read_only_window.sql`
- conferir se ninguem esta alterando policies manualmente no Dashboard ao mesmo tempo

---

## 6. Validacoes apos aplicar

### 6.1 Conferir migrations aplicadas

```powershell
supabase migration list
```

### 6.2 Conferir funcoes e triggers principais

No SQL Editor:

```sql
select proname
from pg_proc
where proname in (
  'accept_swap_request',
  'cancel_own_swap_request',
  'notify_swap_request_created',
  'notify_swap_request_accepted',
  'notify_swap_request_cancelled',
  'reset_assignment_confirmation_on_swap_request'
);
```

```sql
select trigger_name
from information_schema.triggers
where event_object_table = 'swap_requests'
  and trigger_name in (
    'swap_requests_notify_created',
    'swap_requests_reset_assignment_confirmation'
  );
```

### 6.3 Conferir indice

```sql
select indexname
from pg_indexes
where tablename = 'schedule_assignments'
  and indexname = 'schedule_assignments_user_status_idx';
```

### 6.4 Conferir categoria de eventos

```sql
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'events'
  and column_name = 'category';
```

```sql
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.events'::regclass
  and conname = 'events_category_check';
```

### 6.5 Conferir permissao granular de eventos

```sql
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'can_manage_events';
```

```sql
select proname
from pg_proc
where proname in (
  'can_manage_events',
  'save_event_with_optional_room_reservation'
);
```

```sql
select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('events', 'event_audiences')
order by tablename, policyname;
```

### 6.6 Grant / revoke da flag

Listar perfis:

```sql
select id, full_name, email, role, can_manage_events
from public.profiles
order by full_name nulls last, email nulls last;
```

Conceder permissao:

```sql
update public.profiles
set can_manage_events = true
where id = '00000000-0000-0000-0000-000000000000';
```

Revogar permissao:

```sql
update public.profiles
set can_manage_events = false
where id = '00000000-0000-0000-0000-000000000000';
```

Observacoes:

- no app, `admin` agora pode usar a tela `Permissoes de eventos` para fazer grant/revoke sem SQL
- depois de grant/revoke, pedir novo bootstrap do app:
  - reiniciar o app, ou
  - sair e entrar novamente, para recarregar `profile`

---

## 7. Validacao funcional manual

Depois do `db push`, validar nesta ordem:

1. abrir uma troca a partir de um assignment confirmado
   - esperado:
     - `swap_requests` criado
     - assignment volta para `pending`
     - notificacoes de `created` geradas

2. cancelar a propria troca
   - esperado:
     - status da troca muda para `cancelled`
     - notificacao de `cancelled` para lideres

3. abrir nova troca e aceitar com usuario elegivel
   - esperado:
     - status da troca vira `approved`
     - `to_user_id` preenchido
     - assignment troca de dono
     - assignment permanece `pending`
     - notificacao de `accepted`

4. tentar abrir, cancelar ou aceitar em `start_at` ou depois
   - esperado:
     - operacao bloqueada no backend

5. tentar confirmar o proprio assignment em `start_at` ou depois
   - esperado:
     - operacao bloqueada no backend

6. autenticar como usuario com `can_manage_events = true` e sem role `admin`
   - esperado:
     - CTA de criar evento aparece
     - botao de editar evento aparece no detalhe
     - usuario consegue criar/editar evento publico
     - usuario consegue criar/editar evento privado
     - usuario consegue salvar audiencia privada e sala opcional
     - usuario nao precisa virar `admin` para isso

---

## 8. Principais riscos

### Risco 1 - RPC sobrescrita sem validacao funcional

- `20260412000110` redefine `accept_swap_request` e `cancel_own_swap_request`
- por isso a validacao manual do fluxo de troca e obrigatoria depois do push

### Risco 2 - baseline remoto inconsistente

- `20260412000111` pressupoe o estado deixado por `20260404000104`
- sem esse baseline, o conjunto final de policies pode ficar divergente do esperado

### Risco 3 - divergencia entre UI e ambiente remoto

- o app ja foi ajustado para varias regras de read-only
- se o banco remoto ainda nao estiver alinhado, o comportamento pode divergir entre ambientes

### Risco 4 - policies de RLS

- `20260412000111` mexe em policies centrais do dominio de escalas
- precisa validar pelo menos:
  - admin gerencia tudo
  - lider gerencia apenas o proprio ministerio
  - membro atua apenas no que e dele

### Risco 5 - regra temporal de lider/admin

- sem `20260423000115`, o remoto pode continuar com regras antigas baseadas no dia do evento
- isso cria assimetria com o estado atual do repo, que bloqueia exatamente em `start_at`
- por isso o alinhamento do remoto precisa incluir explicitamente a migration de `2026-04-23`

### Risco 6 - flag concedida mas app com profile stale

- a concessao de `can_manage_events` e manual nesta fase
- se o app nao recarregar o `profile`, a UI pode continuar escondendo os CTAs
- por isso a validacao manual precisa incluir refresh do app ou novo login

---

## 9. Se algo falhar

### Falha no `db push`

- nao sair corrigindo no Dashboard manualmente
- primeiro rodar:

```powershell
supabase migration list
```

- e capturar a mensagem exata de erro

### Falha funcional depois do push

Capturar:

- erro exato do app
- erro exato do SQL Editor, se houver
- resultado destas consultas:

```sql
select id, status, from_assignment_id, to_user_id, created_at, updated_at
from public.swap_requests
order by created_at desc
limit 20;
```

```sql
select id, user_id, role_id, status, confirmed_at
from public.schedule_assignments
order by created_at desc
limit 20;
```

---

## 10. O que ainda continua fora deste push

Este runbook nao cobre:

- validacoes de data ainda pendentes em `events` e `room_reservations`
- novos indices alem de `schedule_assignments (user_id, status)`
- melhorias de notificacao de copy/frequencia
- evolucoes futuras da UI administrativa para grant/revoke de `profiles.can_manage_events`
- proximas evolucoes de UI fora da tela informativa de eventos

Esses itens continuam no backlog e no `docs/NEXT_STEPS_PLAN.md`.
