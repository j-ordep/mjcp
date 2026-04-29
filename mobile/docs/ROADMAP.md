# MJCP Mobile - Roadmap de Features

Data de reconciliacao: 2026-04-10 (America/Sao_Paulo)

> Este roadmap foi reconciliado com o estado atual do codigo em `src/` e das migrations em `supabase/migrations/`.
> Quando houver divergencia entre este arquivo e o codigo, codigo + migrations continuam sendo a verdade atual.

---

## Estado Atual

### Ja implementado no codigo

- Autenticacao Supabase parcial, com `authService`, `useAuthStore` e fluxo autenticado no app
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
- Backend bloqueia novo assignment duplicado do mesmo membro na mesma escala

### Implementado parcialmente

- a UX basica entre `ScheduleScreen` e `EditScheduleScreen` segue como centro do fluxo operacional de escala
- `EditScheduleScreen` agora tambem serve como tela unificada da escala para membro:
  - o membro abre a mesma tela que admin/lider a partir de `ScheduleScreen`
  - as acoes administrativas ficam ocultas quando ele nao pode gerenciar a escala
- Edicao de dados basicos da escala nao deve expor observacoes, `notes` ou `note`; trocar evento ou ministerio nao esta exposto
- Tipagem de banco existe em `src/types/database.types.ts`, mas ainda merece revisao de cobertura
- Suite de testes unitarios existe e ja cobre utils, mapeamentos e partes relevantes dos services de escalas, ministerios e eventos

### Ainda pendente

- Confirmar no Supabase remoto o estado final das migrations mais recentes de `start_at`, simplificacao da leitura de eventos e categoria de eventos
- Aplicar/validar no Supabase remoto a migration que conecta notificacoes operacionais de swap, se ainda nao estiver aplicada
- Pull-to-refresh e estados de loading/error mais consistentes
- Arquitetar permissao granular futura para que pessoas especificas criem/editem eventos sem necessariamente virarem `admin`
- Ampliar cobertura de testes do `scheduleService`, `ministryService` e `eventService`
- Fluxo de declinio de assignment, caso o produto confirme essa necessidade

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
- [ ] Consolidar um shape/payload de backend somente informativo para cards e detalhes de evento

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

- [ ] Notificar novo assignment criado
- [~] Notificar criacao de swap request
- [~] Notificar membros elegiveis para assumir troca
- [~] Notificar lider responsavel pela escala
- [~] Notificar quando a troca for assumida
- [~] Notificar quando a troca for cancelada
  - Estado atual confirmado no codigo:
    - migration local preparada para gerar notificacoes de `swap_request` no backend
    - `NotificationsModal` agora consome a inbox real no app
  - Pendencia real:
    - aplicar a migration no projeto Supabase remoto
    - fechar badge/realtime/push em rodada futura

---

## P2 - Outras frentes do produto

- [ ] Queries reais de disponibilidade de salas
- [ ] Tela de musica individual
- [ ] Setlist por evento
- [ ] Padronizacao de loading/error/empty states
- [ ] Definir estrategia de historico/retencao de escalas antigas

---

## Proximos passos sugeridos

1. Validar no Supabase remoto as migrations mais recentes, incluindo bloqueio de duplicidade de membro na escala e categoria de eventos.
2. Revisar UX de criacao/edicao de eventos sem mudar a regra atual de permissao.
3. Arquitetar permissao granular futura para criacao/edicao de eventos.
4. Implementar notificacoes in-app do fluxo de trocas e escalas, com geracao no backend e inbox real no app.
