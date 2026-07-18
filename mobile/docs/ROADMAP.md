# MJCP Mobile - Roadmap de Features

Data de reconciliacao: 2026-06-14 (America/Sao_Paulo)

> Este roadmap foi reconciliado com o estado atual do codigo em `src/` e das migrations em `supabase/migrations/`.
> Quando houver divergencia entre este arquivo e o codigo, codigo + migrations continuam sendo a verdade atual.

---

## Estado Atual

### Ja implementado no codigo

- Autenticacao Supabase parcial, com `authService`, `useAuthStore` e fluxo autenticado no app
- Bootstrap com guardrails amigaveis para `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Store global com Zustand para auth, eventos, ministerios e escalas
- Criacao de escala separada da montagem da equipe
- Tela dedicada de editar escala
- Adicao e remocao de membros na escala
- Confirmacao de presenca do proprio usuario
- Solicitacao de troca, cancelamento da propria troca e aceite pela primeira pessoa elegivel
- Tela dedicada para acompanhar trocas (`SwapRequestsScreen`)
- Gestao de membros do ministerio e capabilities
- Integridade e RLS para lider/admin no dominio principal de escalas
- `EventDetailsScreen` reduzida para papel informativo, sem equipe, status, confirmacao ou troca
- `EventsScreen` usa cards informativos sem acoes operacionais de escala
- `EventsScreen` lista eventos futuros e historico real
- Eventos possuem categoria informativa em portugues e visual minimalista preto/branco
- Edicao de evento hidrata dados canonicos do backend e reaplica corretamente a audiencia privada no formulario
- `EventDetailsScreen` saneia o payload de edicao por whitelist, evitando reintroduzir campos operacionais no fluxo de eventos
- `CreateEventScreen` usa um helper compartilhado para converter data/hora local em UTC ISO e reidrata a data editada no fuso local
- Backend bloqueia novo assignment duplicado do mesmo membro na mesma escala
- `MusicDetailsScreen` abre a partir do catalogo e do proximo setlist, com link externo amigavel quando `lyrics_url` existir

### Implementado parcialmente

- a UX basica entre `ScheduleScreen` e `EditScheduleScreen` segue como centro do fluxo operacional de escala
- `EditScheduleScreen` agora tambem serve como tela unificada da escala para membro:
  - o membro abre a mesma tela que admin/lider a partir de `ScheduleScreen`
  - as acoes administrativas ficam ocultas quando ele nao pode gerenciar a escala
- Edicao de dados basicos da escala nao deve expor observacoes, `notes` ou `note`; trocar evento ou ministerio nao esta exposto
- Tipagem de banco existe em `src/types/database.types.ts`, mas ainda merece revisao de cobertura
- Suite de testes unitarios existe e ja cobre utils, mapeamentos e partes relevantes dos services de escalas, ministerios e eventos

### Ainda pendente

- Validar constraints `NOT VALID` e dados historicos remanescentes no Supabase remoto
- Pull-to-refresh e estados de loading/error mais consistentes
- Validar em uso real a permissao granular de eventos e a nova UI admin de grant/revoke
- Ampliar cobertura de testes do `scheduleService`, `ministryService` e `eventService`
- Aplicar o mesmo contrato compartilhado de datas em outros formularios que ainda fujam do fluxo principal
- Fluxo de declinio de assignment, caso o produto confirme essa necessidade
- [x] Integrar salas e reservas ao fluxo basico real do app
  - `RoomsScreen` deixou de ser mock e agora cria reservas independentes reais
  - `RoomsScreen` agora tambem mostra agenda diaria por sala com reservas do dia, badge `Evento` e resumo simples das escalas vinculadas
  - `CreateEventScreen` permite sala opcional para evento com data unica
  - vinculo estrutural adotado: `room_reservations.event_id`
  - `events.room_id` continua fora do modelo
  - catalogo padrao de salas segue vindo do banco e foi normalizado para:
    - `Sala 1`
    - `Sala 2`
    - `Sala 3`
    - `Sala 4`
    - `Casa de Missoes`
    - `Templo`
  - lotacao/capacidade deixou de aparecer na UI

---

## P0 - Fluxo principal de escalas

- [x] Criar escala por `(evento, ministerio)` com validacao de editabilidade
- [x] Separar criacao da escala da montagem da equipe
- [x] Abrir tela dedicada para editar escala
- [x] Adicionar membro na escala com validacao de capability e warnings de conflito/indisponibilidade
- [x] Remover membro da escala com confirmacao explicita
- [x] Excluir escala com confirmacao explicita
- [x] Fechar revisao final do comportamento de historico/somente leitura em `start_at` ou depois dele nos fluxos centrais

---

## P1 - Interacoes do membro

- [x] Confirmar presenca em `ScheduleScreen`
- [x] Confirmar presenca em `EditScheduleScreen`
- [x] Remover confirmacao de presenca de `EventDetailsScreen`
- [x] Padronizar bloqueios e desabilitacoes dessas acoes entre as tres telas
- [x] Remover alerts nativos de sucesso de confirmacao e troca
- [x] Abrir a tela nova de escala tambem para membro, com modo somente leitura administrativa

- [x] Criar solicitacao de troca
- [x] Cancelar solicitacao de troca propria
- [x] Aceitar troca como membro elegivel
- [x] Listar trocas disponiveis e trocas proprias
- [x] Ao solicitar troca, resetar assignment confirmado para `pending`
- [~] Conectar notificacoes e revisar UX final do fluxo

---

## P1 - Modos de visualizacao de evento e escala

- [x] `ScheduleScreen` como hub operacional de escalas
- [x] `EditScheduleScreen` mistura contexto de gestor e, quando aplicavel, bloco "Minha participacao"
- [x] `EventDetailsScreen` como tela apenas informativa do evento
- [x] `EventsScreen` sempre igual para todos os usuarios, sem botoes operacionais de escala
- [x] `EventsScreen` com `Proximos` e `Anteriores` baseado em `start_at`
- [x] `EventsScreen` e `EventDetailsScreen` com categoria informativa e UI claro minimalista
- [x] Edicao de evento reidratada pelo backend, sem depender apenas de payload de navegacao
- [x] Consolidar um shape/payload de backend somente informativo para cards e detalhes de evento

---

## P1 - Qualidade e arquitetura

- [x] Service layer para regras do dominio principal
- [x] RLS para admin, leader e member no fluxo de escalas
- [x] Migrations para endurecimento de integridade e fluxo de swap
- [~] Tipagem do banco presente, mas ainda passivel de revisao
- [~] Testes automatizados iniciais existentes
- [~] Cobrir `scheduleService` com testes
- [~] Cobrir `ministryService` com testes
- [~] Cobrir `eventService` com testes

---

## P2 - Notificacoes

- [x] Notificar novo assignment criado
- [x] Notificar criacao de swap request
- [x] Notificar membros elegiveis para assumir troca
- [x] Notificar lider responsavel pela escala
- [x] Notificar quando a troca for assumida
- [x] Notificar quando a troca for cancelada
  - Estado atual confirmado no codigo:
    - backend de `swap_request` e `schedule.assigned` ja esta operacional no remoto
    - `NotificationsModal` agora consome a inbox real no app
  - Pendencia real:
    - estender a inbox para evento privado e reserva de sala
    - decidir push externo em rodada futura

---

## P2 - Outras frentes do produto

- [x] Queries reais de disponibilidade de salas
- [x] Tela de musica individual
- [x] Setlist por evento
  - entregue em modo simples no `MusicScreen`, focado no proximo evento
- [ ] Padronizacao de loading/error/empty states
- [ ] Definir estrategia de historico/retencao de escalas antigas

---

## Higiene documental

- [x] Arquivar planos faseados e snapshots que ja nao orientam a execucao atual
- [~] Manter a raiz de `docs/` restrita a estado vivo e referencia operacional direta

---

## Proximos passos sugeridos

1. Padronizar loading/error/empty states nas telas mais visiveis (`Home`, `Rooms`, `Music`, `Profile`, `SwapRequests`).
2. Expandir o contrato compartilhado de datas para os formularios restantes fora do fluxo principal.
3. Validar constraints `NOT VALID` e checks manuais de dados historicos no Supabase remoto.
4. Estender a inbox atual para evento privado e reserva de sala.
5. Revisar se `EVENT_CORE_PLAN.md` continua vivo na raiz ou deve migrar para `docs/history/`.
6. Ampliar cobertura de testes dos services principais antes de abrir novas frentes grandes.
