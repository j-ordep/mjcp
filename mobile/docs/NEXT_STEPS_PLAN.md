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

- `evento` e superficie informativa e comum a todos os usuarios
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
- `EventsScreen` lista proximos eventos e historico real
- `Proximos` ordena por `start_at` crescente
- `Anteriores` ordena por `start_at` decrescente
- criacao e edicao de evento ficam restritas a `admin` nesta fase
- eventos possuem categoria informativa simples em `events.category`, com valores em portugues
- eventos podem ser publicos ou privados; quando privados, a visibilidade passa por `event_audiences`
- a UI de eventos segue o tema claro minimalista do app: preto, branco e cinzas

**PENDENTE DE DEFINICAO**

- desenhar permissao granular futura para criacao/edicao de eventos sem promover todo usuario autorizado a `admin`
- definir metadados extras do detalhe de evento, como link de transmissao/video

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

### Salas, musicas e setlists

**Confirmado no repo**

- ha estrutura inicial no banco e telas no app
- esses modulos ainda nao sao o foco principal da rodada atual

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
   - migrations de notificacoes de swap, se ainda nao estiverem aplicadas no projeto remoto
2. Implementar validacoes de data ainda pendentes no banco:
   - `events.end_at > start_at` quando `end_at` existir
   - `room_reservations.end_at > start_at`
   - default de `end_at = start_at + 3h` quando o usuario nao informar termino
   - nao permitir criar evento com `start_at` no passado
3. Revisar indices basicos ainda faltantes conforme uso real das queries

## P1 - Consolidar dominio de eventos como informativo

1. Padronizar um payload/DTO informativo de evento para card e detalhe
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
4. Retomar salas, musicas e setlists apenas depois da estabilizacao do fluxo principal

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
2. fechar os itens restantes de `escala`
3. expandir testes unitarios do service layer
4. so depois entrar em `eventos`, `notificacoes` e demais modulos
