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
- O fluxo de criacao de escala foi separado da montagem da equipe:
  - `CreateScheduleScreen` cria o contexto da escala
  - `EditScheduleScreen` faz a montagem da equipe e operacao da escala
  - `ScheduleScreen` funciona como hub principal do dominio de escalas
- Ao tocar em uma escala a partir de `ScheduleScreen`, admin, lider e membro agora abrem a mesma tela `EditScheduleScreen`:
  - admin/lider entram em modo gerencial
  - membro entra em modo de acompanhamento da propria participacao, sem acoes administrativas
- O fluxo de troca ja existe do banco ate a UI:
  - criar solicitacao
  - cancelar solicitacao propria
  - aceitar troca como primeira pessoa elegivel
  - acompanhar trocas em `SwapRequestsScreen`

### PENDENTE DE DEFINICAO

- Estrategia final de notificacoes operacionais do fluxo de escalas e trocas
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
  - impedir criacao/aceite/cancelamento no dia do evento ou depois dele

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
  - visao do evento; se o usuario estiver escalado, mostra acoes e equipe
- `src/screens/app/SwapRequestsScreen.tsx`
  - acompanhamento de trocas disponiveis e proprias
- `src/screens/app/ManageMinistryMembersScreen.tsx`
  - base operacional para membership e capabilities

---

## Observacoes importantes

- A verdade atual do dominio esta nas migrations e no service layer.
- `docs/TASKS.md` e `docs/ROADMAP.md` servem como mapa de trabalho, nao como fonte primaria.
- A UX do modal de adicionar membro foi alinhada ao padrao do modal central de troca; o fluxo nao usa mais visual de bottom sheet nesse ponto.
- O backend de notificacoes de swap foi preparado em migration nova e depende de aplicacao no projeto Supabase para produzir notificacoes reais.
- Nao colocar observacoes, `notes` ou `note` em nenhum lugar da escala.
- O acesso primario ao fluxo de trocas deve sair de `ScheduleScreen`, nao da Home.
- A confirmacao de presenca e a solicitacao/cancelamento de troca nao usam mais alerts nativos de sucesso; o feedback principal agora e o proprio estado da interface.
- O banco continua persistindo enums em ingles por compatibilidade de schema, mas a UI deve exibir status em pt-BR.
- Existem duas migrations novas locais que precisam ser aplicadas no Supabase remoto para alinhar o ambiente:
  - `20260412000111_fix_schedule_rls_recursion.sql`
  - `20260412000112_reset_assignment_confirmation_on_swap_request.sql`
