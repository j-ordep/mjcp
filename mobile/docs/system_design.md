# MJCP - System Design

Data de reconciliacao: 2026-04-10 (America/Sao_Paulo)

## Resumo

O app e um cliente React Native + Expo com Supabase como backend principal.
Hoje o dominio mais maduro e o de escalas.

## Estado atual por area

| Area | Estado atual |
| --- | --- |
| Navegacao | Implementada |
| Stores Zustand | Implementadas para auth, eventos, ministerios e escalas |
| Auth Supabase | Parcialmente integrada |
| Service layer | Implementado no dominio principal |
| Migrations | Presentes e sao a fonte primaria do modelo atual |
| RLS | Presente para o fluxo principal |
| Trocas | Implementadas de ponta a ponta no fluxo principal |
| Notificacoes operacionais | Parcialmente conectadas: inbox real no app e migration local para swap |

---

## Principios arquiteturais atuais

### 1. Fonte de verdade

- Estrutura, integridade e permissoes vivem nas migrations do Supabase.
- Regra de negocio de orquestracao vive principalmente em `src/services`.
- A UI nao deve ser a fonte de verdade de permissao.
- Em RLS, policies de leitura nao devem depender de outra relacao que dependa de volta da tabela original.
- Restricoes temporais de editabilidade devem ser aplicadas em operacoes mutaveis (`INSERT` / `UPDATE` / `DELETE`), nao em `SELECT`.

### 2. Banco de dados

O projeto nao segue mais uma regra absoluta de "banco sem regra de negocio".
O estado atual do repositorio mostra uma abordagem mista:

- service layer para a maior parte da orquestracao
- RLS para autorizacao
- triggers e funcoes SQL para integridade e fluxos sensiveis, especialmente em troca de assignment

Isso ja esta materializado nas migrations de endurecimento e no fluxo de swap.

### 3. UI

- `CreateScheduleScreen` e responsavel apenas por criar o contexto da escala.
- `EditScheduleScreen` concentra operacao da escala.
- `ScheduleScreen` funciona como hub operacional.
- `EventDetailsScreen` continua relevante para o membro escalado, mas nao e o centro administrativo do fluxo.

---

## Modelo atual do dominio principal

### Escalas

- `schedules` representa o bloco de escala de um ministerio dentro de um evento.
- Existe unicidade por `(event_id, ministry_id)`.
- `schedule_assignments` representa o que o membro fara naquele evento.

### Capabilities

- O que o membro sabe fazer vive em `ministry_member_roles`.
- O que ele fara em um evento vive em `schedule_assignments`.

### Trocas

O fluxo atual de troca e:

1. o dono do assignment cria `swap_requests`
2. o sistema identifica elegibilidade por mesmo ministerio e mesma role/capability
3. a primeira pessoa elegivel que aceitar assume a escala
4. pedidos concorrentes remanescentes sao cancelados

O banco ja participa ativamente desse fluxo via RPCs e validacoes.

---

## Componentes principais do app

### Screens

- `src/screens/app/CreateScheduleScreen.tsx`
- `src/screens/app/EditScheduleScreen.tsx`
- `src/screens/app/ScheduleScreen.tsx`
- `src/screens/app/EventDetailsScreen.tsx`
- `src/screens/app/SwapRequestsScreen.tsx`
- `src/screens/app/ManageMinistryMembersScreen.tsx`

### Services mais relevantes

- `src/services/scheduleService.ts`
- `src/services/ministryService.ts`
- `src/services/authService.ts`

### Stores mais relevantes

- `src/stores/useAuthStore.ts`
- `src/stores/useEventStore.ts`
- `src/stores/useMinistryStore.ts`
- `src/stores/useScheduleStore.ts`

---

## Permissoes de alto nivel

### `admin`

- acesso total ao dominio

### `leader`

- gerencia escalas, assignments e membros do proprio ministerio

### `member`

- visualiza e interage com o que e dele
- confirma sua participacao
- solicita/cancela sua troca
- aceita troca quando elegivel

---

## O que ainda falta fechar

- refinamento do caso de multiplas escalas do mesmo usuario no mesmo evento
- notificacoes operacionais
- cobertura de testes no service layer
- alinhamento final entre regra de historico/somente leitura e todos os pontos da UI

---

## Direcao recomendada para notificacoes

### Confirmado no codigo

- A tabela `notifications` e o RLS basico ja existem.
- O fluxo de swap ja possui regras de elegibilidade e concorrencia fechadas no backend.
- O app ainda nao produz nem consome notificacoes reais desse fluxo.

### Direcao arquitetural recomendada

- Gerar notificacoes no backend, nao no client:
  - trigger, RPC ou funcao `SECURITY DEFINER`
- Usar a tabela `notifications` existente como inbox in-app
- Comecar por notificacoes in-app antes de push externo

### Estado atual do recorte

- O app ja consome a inbox real em `NotificationsModal` via `notificationService`.
- O backend local ja possui migration nova para gerar notificacoes de swap:
  - na criacao do pedido
  - no aceite
  - no cancelamento
- Para valer no ambiente real, essa migration ainda precisa ser aplicada no projeto Supabase.

### Eventos minimos a emitir

- `swap_request.created`
  - destinatarios:
    - lider(es) do ministerio da escala
    - membros elegiveis da mesma funcao/capability
- `swap_request.accepted`
  - destinatarios:
    - solicitante original
    - lider(es) do ministerio
- `swap_request.cancelled`
  - destinatarios:
    - lider(es) do ministerio

### Estrutura de payload sugerida

- `type = 'swap_request'`
- `data` com:
  - `swap_request_id`
  - `schedule_id`
  - `event_id`
  - `ministry_id`
  - `role_id`
  - `assignment_id`
  - `actor_user_id`
  - `action`
