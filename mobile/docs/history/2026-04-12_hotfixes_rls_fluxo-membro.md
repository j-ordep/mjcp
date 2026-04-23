# Hotfixes de RLS e Fluxo do Membro

Data: 2026-04-12 (America/Sao_Paulo)

## Objetivo desta rodada

Fechar inconsistencias de backend e UX que apareceram depois da consolidacao do fluxo de escalas:

- recursao de RLS entre `events` e `schedules`
- membro ainda abrindo tela antiga ao tocar em uma escala
- feedback nativo excessivo em confirmacao e troca
- divergencia entre status persistidos no banco e labels exibidos na UI
- troca aberta apos confirmacao sem voltar o assignment para pendente

## O que foi implementado

- `ScheduleScreen` agora abre `EditScheduleScreen` para qualquer escala do usuario.
- `EditScheduleScreen` passou a suportar dois modos:
  - gerencial para `admin` e `leader` do ministerio
  - participacao para `member`, ocultando acoes administrativas
- o modal de adicionar membro foi mantido no padrao central, sem bottom sheet
- os tutoriais visuais do fluxo de escalas foram removidos para manter o MVP mais limpo
- alerts nativos de sucesso foram removidos em:
  - confirmacao de presenca
  - criacao de troca
  - cancelamento de troca
- os labels de status visiveis passaram a ser exibidos em pt-BR na UI

## Hotfixes de banco adicionados ao repo

### `20260412000111_fix_schedule_rls_recursion.sql`

Corrige a recursao indireta causada por policies `FOR ALL` em `schedules` e `schedule_assignments`.

Direcao aplicada:

- manter `SELECT` separado nas policies base de visibilidade
- restringir a janela temporal de editabilidade apenas para:
  - `INSERT`
  - `UPDATE`
  - `DELETE`

### `20260412000112_reset_assignment_confirmation_on_swap_request.sql`

Garante no backend que, ao abrir uma troca para um assignment proprio:

- o assignment volta para `pending`
- `confirmed_at` e limpo

Isso impede que o app mantenha um estado de confirmacao incoerente enquanto a troca esta pendente.

## Ajustes de UX confirmados

- pedir troca apos confirmar presenca deve remover a confirmacao imediatamente
- cancelar troca nao deve pedir confirmacao nativa
- confirmacao nativa fica reservada para operacoes destrutivas maiores:
  - excluir escala
  - remover membro da escala
  - remover membro do ministerio

## Pendencias operacionais

As migrations abaixo precisam ser aplicadas tambem no Supabase remoto para alinhar o ambiente:

- `20260412000111_fix_schedule_rls_recursion.sql`
- `20260412000112_reset_assignment_confirmation_on_swap_request.sql`
