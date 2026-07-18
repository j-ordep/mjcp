# MJCP Mobile - Plano para POC usavel

Data: 2026-05-12 (America/Sao_Paulo)

Status de execucao desta rodada:

- Bloco A: concluido no repo local
- Bloco B: concluido no repo local
- Bloco C: concluido no repo local
- Bloco D: checkpoint de revisao e documentacao concluido nesta sessao
- pendencia operacional remota restante desta rodada:
  - aplicar `20260512000125_allow_event_managers_to_manage_event_setlists.sql`

## 1. Objetivo

Transformar o app em uma POC usavel de ponta a ponta, sem perseguir perfeicao agora.

Direcao desta rodada:

- fechar o que ja esta mais perto de funcionar
- manter `eventos` e `escalas` estaveis
- integrar apenas o necessario para que `salas`, `reservas`, `bloqueio de datas` e `musicas` deixem de ser cascas ou mocks
- evitar reestruturacao grande e abstracoes desnecessarias

## 2. Diagnostico atual

### Confirmado no codigo

- `eventos` ja esta em estado usavel como superficie informativa, com criacao/edicao, permissao granular e sala opcional
- `escalas` ja esta em estado usavel como fluxo operacional principal
- `salas` e `reservas` ja possuem:
  - schema
  - RLS basica
  - validacao real de conflito por horario no banco
  - `RoomsScreen` funcional para reserva simples
  - agenda diaria por sala
  - vinculo opcional com evento por `room_reservations.event_id`
- `blocked_dates` ja possui:
  - schema
  - RLS
  - warning real no fluxo de adicionar membro na escala
- `songs` e `event_setlists` ja possuem schema, seed e policies de leitura/escrita

### Parcialmente pronto

- `RoomsScreen` funciona para consulta e reserva simples, mas ainda nao fecha o ciclo operacional completo de reserva
- `BlockDatesScreen` existe, mas ainda e so UI local sem persistencia
- integracao de `blocked_dates` com escala existe apenas como warning soft no fluxo de adicionar assignment
- `MusicScreen` existe, mas ainda usa dados mockados e `alert`
- `songs` e `event_setlists` ainda nao possuem service layer e fluxo real de produto no app

### Falta para a POC ficar usavel

- fechar ciclo minimo de `salas` e `reservas`
- fechar fluxo real de `bloqueio de datas`
- trocar mocks de `musicas` por fluxo real simples
- fazer uma rodada final de revisao dos fluxos principais com foco em usabilidade, regressao e docs operacionais

## 3. Guardrails desta rodada

- nao reabrir o dominio de `eventos`
- nao reabrir o dominio de `escalas`, exceto o necessario para integrar melhor `blocked_dates`
- nao criar uma arquitetura nova para `musicas`
- nao introduzir nova entidade de produto sem necessidade
- nao vazar `.env`, credenciais, dados reais ou ids sensiveis

## 4. Blocos de entrega

### Bloco A - Salas e reservas POC funcional

**Objetivo**

Fechar o fluxo minimo de salas e reservas para uso real no app:

- consultar disponibilidade
- criar reserva simples
- ver agenda do dia por sala
- visualizar reservas ligadas a evento
- cancelar/encerrar a propria reserva quando aplicavel

**Arquivos/areas provaveis**

- `src/screens/app/RoomsScreen.tsx`
- `src/components/card/RoomCard.tsx`
- `src/services/roomReservationService.ts`
- `src/utils/roomAgenda.ts`
- `src/utils/roomAvailability.ts`
- `tests/roomReservationService.test.ts`
- `tests/roomCardAgenda.test.ts`
- `docs/SUPABASE_REMOTE_RUNBOOK.md`

**Riscos**

- o fluxo atual de evento+sala suporta na pratica uma reserva ativa por evento
- qualquer mudanca no cancelamento pode bater em RLS ou em reservas ligadas a evento
- risco de duplicar informacao entre "conflito atual" e "agenda diaria"

**Criterios de conclusao**

- usuario consegue criar reserva simples sem evento
- usuario consegue ver agenda diaria por sala
- usuario entende quando a reserva veio de evento
- conflito continua bloqueando no banco e na UX
- existe pelo menos um caminho minimo para encerrar/cancelar reserva simples sem quebrar reserva vinculada a evento

**O que nao deve ser mexido**

- regras de permissao de `eventos`
- fluxo principal de `CreateEventScreen`, salvo pequenos ajustes de integracao
- modelo de `escala`

### Bloco B - Bloqueio de datas real e integrado a escala

**Objetivo**

Transformar `blocked_dates` em fluxo real de usuario, mantendo a regra atual de warning soft no dominio de escala.

**Arquivos/areas provaveis**

- `src/screens/app/BlockDatesScreen.tsx`
- `src/services/blockedDateService.ts` ou extensao pequena em service existente
- `src/services/scheduleService.ts`
- `src/screens/app/EditScheduleScreen.tsx`
- `src/components/schedule/AssignmentPickerModal.tsx`
- `tests/scheduleService.test.ts`
- `docs/TASKS.md`

**Riscos**

- `blocked_dates` e por dia, nao por horario; existe risco de borda com timezone
- transformar warning em bloqueio hard quebraria regra ja validada no repo
- reabrir demais o fluxo de escala foge do objetivo desta rodada

**Criterios de conclusao**

- usuario consegue listar, criar e remover bloqueios reais
- `BlockDatesScreen` deixa de ser TODO
- warning de indisponibilidade continua aparecendo no fluxo de adicionar membro
- feedback visual de indisponibilidade fica mais claro sem reescrever o fluxo de escala

**O que nao deve ser mexido**

- logica de swap
- confirmacao de presenca
- estrutura base de `CreateScheduleScreen`
- regra de conflito de horario, salvo reaproveitar warning existente

### Bloco C - Musicas e setlist simples, mas real

**Objetivo**

Trocar a tela de musica mockada por um fluxo simples e usavel:

- catalogo real de musicas
- busca real
- leitura do proximo setlist
- edicao minima do setlist por usuario autorizado

**Arquivos/areas provaveis**

- `src/screens/app/MusicScreen.tsx`
- `src/services/musicService.ts`
- `src/navigation/AppNavigator.tsx` (se precisar de tela auxiliar simples)
- `src/stores/` apenas se o fluxo realmente pedir estado compartilhado
- `tests/musicService.test.ts`
- `docs/NEXT_STEPS_PLAN.md`

**Riscos**

- hoje o produto nao tem fluxo definido de setlist alem do schema
- policies atuais sugerem escrita por `admin`; ampliar permissao aqui sem necessidade pode misturar escopo
- existe risco de over-engineering se tentarmos criar editor complexo de musica, cifra ou playback

**Criterios de conclusao**

- `MusicScreen` deixa de depender de array mockado
- usuarios autenticados conseguem navegar no catalogo real
- proximo setlist carrega do banco quando existir
- usuario autorizado consegue montar ou editar um setlist simples para um evento

**O que nao deve ser mexido**

- dominio de `eventos` alem da leitura do proximo evento/setlist
- permissao global de eventos
- qualquer ideia de modulo completo de louvor, playback, cifra offline ou biblioteca avançada

### Bloco D - Revisao geral para POC usavel

**Objetivo**

Rodada final de estabilizacao para garantir que a POC esteja revisavel e usavel de ponta a ponta.

**Arquivos/areas provaveis**

- telas e services tocados nos blocos A, B e C
- `docs/CONTEXT.md`
- `docs/NEXT_STEPS_PLAN.md`
- `docs/TASKS.md`
- `docs/SUPABASE_REMOTE_RUNBOOK.md`
- testes unitarios relevantes

**Riscos**

- escopo crescer e virar redesign
- entrar em ajustes cosméticos demais e atrasar o fechamento da POC
- mexer sem querer em `eventos` e `escalas` alem do necessario

**Criterios de conclusao**

- happy path de `eventos`, `escalas`, `salas`, `reservas`, `blocked_dates` e `musicas` esta funcional
- runbook do Supabase reflete o que precisa existir no remoto
- docs de contexto e backlog ficam coerentes com o estado real do app
- testes cobrindo services principais das areas tocadas

**O que nao deve ser mexido**

- grandes refactors
- redesign completo das telas
- mudanca de dominio em `eventos` ou `escalas`

## 5. Ordem recomendada

1. **Bloco A - Salas e reservas**
   - ja esta mais perto de fechar
   - depende menos de decisao de produto
2. **Bloco B - Bloqueio de datas**
   - schema e warning ja existem; falta fechar o fluxo de usuario
3. **Bloco C - Musicas**
   - e o dominio menos maduro entre os alvos desta rodada
4. **Bloco D - Revisao geral**
   - consolidacao final da POC

## 6. Assumptions desta rodada

- `blocked_dates` continua como warning soft no fluxo de escala, nao como bloqueio hard
- a integracao de `blocked_dates` pertence ao fluxo de adicionar membro na escala, nao ao fluxo simples de criar a escala
- `musicas` entra como fluxo simples de catalogo + setlist, nao como modulo completo de louvor
- `salas` continuam com `rooms` e `room_reservations`; nao entra nova modelagem grande agora

## 7. PENDENTE DE DEFINICAO

- quem alem de `admin` deve editar `songs` e `event_setlists` na POC
- se reserva simples de sala deve ser aberta a qualquer autenticado ou restrita por papel futuramente

## 8. INFORMACAO INSUFICIENTE

- nao ha evidencia no repo de uma estrategia oficial de CI para esses fluxos secundarios
- nao ha evidencia de fluxo final de produto para biblioteca de musicas alem do schema existente
