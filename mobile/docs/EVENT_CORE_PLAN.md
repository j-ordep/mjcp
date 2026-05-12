# Evento como Core - Plano Consolidado

Data de consolidacao: 2026-05-04 (America/Sao_Paulo)

> Este documento consolida a direcao de produto e modelagem para tratar `Evento` como o nucleo do app, sem criar uma entidade separada para `Reuniao`.
> A fonte primaria continua sendo `supabase/migrations/*.sql` e `src/`.
> `docs/TASKS.md` continua como backlog vivo; este arquivo organiza a direcao e a ordem recomendada das proximas fases.

---

## 1. Decisao central

`Evento` e a entidade principal do calendario.

Tudo o que hoje chamamos de:

- culto
- reuniao
- aula
- EBD
- aviso informativo

continua sendo `evento`.

O comportamento vem da composicao do evento com outros modulos, e nao da criacao de uma nova entidade para cada caso.

---

## 2. Modelo conceitual validado

### Entidades principais

- `events`
  - acontecimento no calendario
- `event_audiences`
  - membros autorizados a visualizar um evento privado
- `schedules`
  - camada operacional opcional vinculada a um evento
- `schedule_assignments`
  - membros e funcoes que servirao em uma escala
- `rooms`
  - recurso fisico
- `room_reservations`
  - bloqueio de uso de sala em um intervalo de tempo

### Regra de ouro

- `escala` nao representa participantes de reuniao
- `escala` representa servico/funcao
- `audiencia privada` representa quem pode ver e foi convocado para um evento privado

---

## 3. Regras de dominio confirmadas

### Evento publico

- qualquer membro autenticado pode visualizar
- nao precisa de audiencia explicita

### Evento privado

- apenas usuarios escolhidos explicitamente podem visualizar
- no MVP, visibilidade e `convite` sao a mesma coisa
- adicionar/remover pessoas da audiencia do evento e o unico modo de controlar quem ve a reuniao privada
- se nao houver audiencia explicita, o evento privado fica visivel para:
  - `admin`
  - usuarios com `profiles.can_manage_events = true`

### Reuniao

- continua sendo `evento`
- normalmente usa categoria `reuniao`
- pode ser publica ou privada
- pode ter membros selecionados
- normalmente nao usa escala

### Culto

- continua sendo `evento`
- pode ser apenas informativo
- pode ter uma ou varias escalas vinculadas

### Aula / EBD

- continua sendo `evento`
- `EBD` continua coberta por `ensino`
- pode ter escala
- pode ou nao usar salas
- pode concentrar varias escalas vinculadas ao mesmo evento principal

### Escala

- sempre pertence a um evento
- define quem vai servir e em qual funcao
- nao deve ser usada para representar `quem participa da reuniao`

---

## 4. Decisao sobre salas

### O que fica no modelo atual

- criacao de evento continua com `location` textual
- escolher sala nao e obrigatorio na tela de eventos
- reservas independentes continuam existindo pela tela de salas
- o vinculo estrutural adotado e `room_reservations.event_id` opcional
- `events.room_id` continua fora do modelo

### Catalogo padrao atual

Os nomes de sala continuam vindo do banco (`rooms`), nao de mock local.

Catalogo padrao documentado:

- `Sala 1`
- `Sala 2`
- `Sala 3`
- `Sala 4`
- `Casa de Missoes`
- `Templo`

Normalizacao segura aplicada por migration:

- `20260504000122_normalize_room_catalog.sql`

Ela:

- renomeia salas legadas conhecidas
- insere faltantes
- nao apaga salas extras/customizadas existentes

### Observacao de UX

- `capacity` continua no schema
- a UI nao exibe mais lotacao/capacidade no card nem no seletor de sala

---

## 5. O que ja esta fechado no produto

- `EventsScreen` e `EventDetailsScreen` sao superficies informativas
- `EventsScreen` e `EventDetailsScreen` reutilizam um shape canonico compartilhado para apresentacao informativa
- `Escalas` continua sendo o fluxo operacional
- evento privado usa `event_audiences`
- no MVP atual, `event_audiences` representa convite + visibilidade
- edicao de evento reidrata a audiencia privada corretamente
- reuniao privada nao precisa de entidade propria
- mesmo para `admin`, `EventDetailsScreen` permanece informativa
- usuario escalado nao e a mesma coisa que usuario convidado para reuniao
- evento com sala usa reserva opcional real, sem sobrescrever conflito de horario
- `RoomsScreen` deixou de ser mock e cria reservas independentes reais
- a permissao granular de eventos foi fechada por flag global em `profiles.can_manage_events`, separada de `admin`

### Fase 5 - Permissao granular para gestao de eventos

Objetivo: liberar criacao/edicao global de eventos para usuarios autorizados, sem promover acesso total de `admin`.

Status em 2026-05-09: concluida no repo local.

- `profiles.can_manage_events` passa a ser a flag explicita de gestao de eventos
- a helper SQL `public.can_manage_events()` unifica `admin` + flag no backend
- policies de escrita de `events` passam a aceitar gestores de evento, mantendo a janela de editabilidade antes de `start_at`
- leitura de eventos privados passa a incluir gestores de evento, alem de `admin` e audiencia explicita
- leitura e mutacao de `event_audiences` passam a aceitar gestores de evento; escrita continua limitada a eventos ainda editaveis
- a RPC `save_event_with_optional_room_reservation` passa a aceitar gestores de evento
- o app usa gating derivado por capacidade em vez de checks locais hardcoded de `admin`
- nao existe painel administrativo no app para grant/revoke; nesta fase isso continua manual no Supabase

---

## 6. Proximos passos recomendados

### Fase 1 - Fechar o contrato do core de eventos

Objetivo: consolidar o entendimento de que `Evento` e o nucleo e que `Reuniao` nao vira nova entidade.

Status em 2026-05-02: concluida e validada no repo local.

- docs e codigo deixam explicito que:
  - reuniao = evento
  - `EBD` continua coberta por `ensino`
  - `event_audiences` = convite + visibilidade no MVP
  - escala = servico, nao participacao
- `EventsScreen` e `EventDetailsScreen` consomem o mesmo shape canonico de apresentacao informativa
- nenhuma tabela nova de `participantes` foi introduzida nesta fase

### Fase 2 - Fechar reuniao como configuracao de evento

Objetivo: tratar reuniao como um uso do core de eventos.

Status em 2026-05-04: concluida no repo local.

- categoria `reuniao` continua sendo apenas tag semantica
- suporte a publico/privado continua no proprio `event`
- audiencia selecionada continua no proprio evento por `event_audiences`
- privado sem audiencia explicita agora e valido e fica visivel para:
  - `admin`
  - usuarios com `profiles.can_manage_events = true`
- nao existe exigencia de escala para reunioes
- notificacoes de eventos privados continuam explicitamente para fase futura
- a integracao opcional de sala ficou acoplada a `room_reservations.event_id`, sem criar `events.room_id`

### Fase 3 - Fechar eventos com multiplas escalas sem misturar dominios

Objetivo: suportar melhor casos como culto e EBD sem reabrir o acoplamento evento x escala.

Status em 2026-05-06: concluida no repo local.

- evento continua informativo
- escalas continuam operadas por `ScheduleScreen` / `EditScheduleScreen`
- um mesmo evento pode concentrar varias escalas de ministerios diferentes
- a UI de evento nao ganha botoes de confirmacao, troca ou status de participacao
- `EventDetailsScreen` continua informativa mesmo com multiplas escalas vinculadas ao evento
- o payload de edicao aberto a partir do detalhe agora passa por whitelist/sanitizacao
- testes unitarios blindam o contrato contra vazamento de campos operacionais para o dominio de eventos

### Fase 4 - Retomar salas como modulo proprio

Objetivo: integrar salas sem quebrar o core de eventos.

Status em 2026-05-06: concluida no repo local, com pendencia operacional remota.

- modelagem de `room_reservations.event_id` opcional ja foi fechada
- reserva sem evento ja funciona em `RoomsScreen`
- criacao/edicao de evento ja permite sala opcional para data unica
- `RoomsScreen` agora mostra agenda diaria por sala com:
  - todas as reservas ativas do dia
  - badge `Evento` para reservas ligadas a `event_id`
  - resumo simples somente leitura das escalas vinculadas
- a agenda diaria degrade com seguranca quando a leitura de `schedules` falha por permissao/RLS
- `location` textual continua no evento mesmo com reserva vinculada
- catalogo de salas segue vindo do banco e foi normalizado de forma segura para:
  - `Sala 1`
  - `Sala 2`
  - `Sala 3`
  - `Sala 4`
  - `Casa de Missoes`
  - `Templo`
- a UI nao mostra mais lotacao/capacidade, embora `capacity` siga no schema
- o trabalho restante desta fase e operacional:
  - aplicar/confirmar no Supabase remoto a migration `20260504000122_normalize_room_catalog.sql`
  - validar no banco o catalogo padrao e a agenda diaria com dados reais
  - decidir se salas extras/customizadas permanecem livres no catalogo ou se teremos gestao administrativa futura

---

## 7. Nao fazer agora

- nao criar tabela `meetings`
- nao criar tabela separada de `event_participants`
- nao colocar `room_id` diretamente em `events`
- nao obrigar sala no fluxo de criacao de evento
- nao reutilizar escala para representar convidados de reuniao

---

## 8. Pendencias de definicao

- painel administrativo futuro para grant/revoke de `profiles.can_manage_events`
- decidir se o detalhe do evento tera metadados extras futuros, como links, materiais ou transmissao
- decidir no futuro se salas extras/customizadas permanecem livres ou se havera gestao administrativa do catalogo

### Decisoes fechadas

- `EBD` continua coberta pela categoria `ensino`
- notificacoes para eventos privados ficam fora do escopo atual
- mesmo para `admin`, escalas vinculadas continuam no fluxo de escalas
- `EventDetailsScreen` permanece informativa e nao vira hub administrativo de escalas

---

## 9. Ordem pratica de execucao

1. consolidar a documentacao do core de eventos
2. concluir os pendentes operacionais remotos da Fase 4 em salas
3. validar no Supabase remoto a migration `20260509000123_add_event_management_permission.sql`
4. estabilizar testes e contrato do core
5. desenhar UI futura para grant/revoke de `profiles.can_manage_events`

---

## 10. Resumo executivo

O proximo modulo a ser fechado nao e `Reuniao` como entidade nova.

O proximo passo e fechar `Evento` como core composicional:

- evento pode ser informativo
- evento pode ser privado
- evento pode ter audiencia
- evento pode ter escalas
- evento pode ter reserva opcional de sala

Com isso, `Reuniao`, `Culto` e `EBD` viram apenas formas diferentes de usar o mesmo nucleo.
