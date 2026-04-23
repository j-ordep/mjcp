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

### Implementado parcialmente

- `EventDetailsScreen` ainda precisa ser reduzida para um papel puramente informativo, sem equipe, status, confirmacao ou troca
- a UX basica entre `ScheduleScreen` e `EditScheduleScreen` segue como centro do fluxo operacional de escala
- `EditScheduleScreen` agora tambem serve como tela unificada da escala para membro:
  - o membro abre a mesma tela que admin/lider a partir de `ScheduleScreen`
  - as acoes administrativas ficam ocultas quando ele nao pode gerenciar a escala
- Edicao de dados basicos da escala nao deve expor observacoes, `notes` ou `note`; trocar evento ou ministerio nao esta exposto
- Tipagem de banco existe em `src/types/database.types.ts`, mas ainda merece revisao de cobertura
- Suite de testes unitarios existe, mas hoje cobre principalmente utils e mapeamentos, nao o service layer principal

### Ainda pendente

- Aplicar no Supabase remoto a migration que conecta notificacoes operacionais de swap
- Aplicar no Supabase remoto as migrations locais de hotfix:
  - `20260412000111_fix_schedule_rls_recursion.sql`
  - `20260412000112_reset_assignment_confirmation_on_swap_request.sql`
- Pull-to-refresh e estados de loading/error mais consistentes
- Refinar o caso de multiplas escalas do mesmo usuario no mesmo evento
- Cobertura de testes do `scheduleService` e `ministryService`
- Fluxo de declinio de assignment, caso o produto confirme essa necessidade

---

## P0 - Fluxo principal de escalas

- [x] Criar escala por `(evento, ministerio)` com validacao de editabilidade
- [x] Separar criacao da escala da montagem da equipe
- [x] Abrir tela dedicada para editar escala
- [x] Adicionar membro na escala com validacao de capability e warnings de conflito/indisponibilidade
- [x] Remover membro da escala com confirmacao explicita
- [x] Excluir escala com confirmacao explicita
- [ ] Fechar revisao final do comportamento de historico/somente leitura no dia do evento ou depois dele em todos os fluxos

---

## P1 - Interacoes do membro

- [x] Confirmar presenca em `ScheduleScreen`
- [x] Confirmar presenca em `EditScheduleScreen`
- [ ] Remover confirmacao de presenca de `EventDetailsScreen`
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
- [ ] `EventDetailsScreen` como tela apenas informativa do evento
- [ ] `EventsScreen` sempre igual para todos os usuarios, sem botoes operacionais de escala
- [ ] Consolidar um shape/payload de backend somente informativo para cards e detalhes de evento

---

## P1 - Qualidade e arquitetura

- [x] Service layer para regras do dominio principal
- [x] RLS para admin, leader e member no fluxo de escalas
- [x] Migrations para endurecimento de integridade e fluxo de swap
- [~] Tipagem do banco presente, mas ainda passivel de revisao
- [~] Testes automatizados iniciais existentes
- [ ] Cobrir `scheduleService` com testes
- [ ] Cobrir `ministryService` com testes

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

1. Fechar a separacao visual e funcional entre evento informativo e escala operacional.
2. Reduzir `EventDetailsScreen` para detalhes do evento sem acoes de escala.
3. Padronizar UX do usuario escalado entre `ScheduleScreen` e `EditScheduleScreen`.
4. Implementar notificacoes in-app do fluxo de trocas e escalas, com geracao no backend e inbox real no app.
