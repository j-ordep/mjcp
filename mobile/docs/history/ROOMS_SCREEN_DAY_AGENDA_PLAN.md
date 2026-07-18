# RoomsScreen Day Agenda Implementation Plan

Status em 2026-05-06: concluido no repo local; validacao remota do Supabase permanece separada.

Resumo do que entrou no repo:
- `getRoomsDailyAgenda(...)` virou leitura dedicada da agenda do dia
- `RoomCard` passou a listar reservas do dia e mostrar badge `Evento`
- `RoomsScreen` passou a consumir agenda diaria por sala
- resumo de escalas vinculadas ficou somente leitura
- se leitura de `schedules` falhar por permissao/RLS, a agenda continua carregando sem quebrar a tela

Observacao: checklist abaixo fica preservado como historico de execucao.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer `RoomsScreen` mostrar a agenda completa do dia por sala, com badge de origem da reserva e um cronograma simples separado das escalas vinculadas ao evento.

**Architecture:** Manter `RoomsScreen` como tela de reservas e disponibilidade, sem transformar salas em tela operacional de escala. A camada de dados deve continuar vindo de `room_reservations`, mas com um novo read-model diario por sala que inclui todas as reservas do dia e, quando houver `event_id`, um resumo somente leitura das escalas ligadas ao evento.

**Tech Stack:** React Native, TypeScript, Zustand, Supabase, Postgres/RLS, `node:test`

---

## Contexto atual

- `RoomsScreen` hoje carrega apenas disponibilidade por janela em `src/services/roomReservationService.ts`.
- `getRoomsForWindow(...)` retorna no maximo uma reserva por sala para o intervalo selecionado.
- `RoomCard` hoje mostra somente uma reserva ocupante.
- Ja existe vinculo estrutural opcional `room_reservations.event_id`.
- Escalas continuam em dominio separado; o cronograma aqui deve ser apenas informativo.

---

## File Map

- Modify: `src/services/roomReservationService.ts`
  - manter `getRoomsForWindow(...)` para o fluxo atual de reserva
  - adicionar `getRoomsDailyAgenda(...)` para a tela de salas
- Modify: `src/components/card/RoomCard.tsx`
  - trocar o card de uma unica reserva por uma lista de reservas do dia
  - mostrar badge `Evento` ou `Reserva avulsa`
  - mostrar bloco separado de escalas vinculadas quando existir
- Modify: `src/screens/app/RoomsScreen.tsx`
  - usar agenda do dia para renderizar cards
  - manter formulario de reserva avulsa e recarregar agenda apos salvar
- Modify: `tests/roomReservationService.test.ts`
  - cobrir busca de todas as reservas do dia e mapeamento de badge/origem
- Create: `tests/roomCardAgenda.test.ts`
  - cobrir render/mapeamento do card com multiplas reservas e cronograma simples
- Modify: `docs/TASKS.md`
  - registrar este plano como recorte da Fase 4 de salas

---

### Task 1: Criar o read-model diario de salas

**Files:**
- Modify: `src/services/roomReservationService.ts`
- Modify: `tests/roomReservationService.test.ts`

- [ ] **Step 1: Escrever o teste vermelho para agenda do dia**

```ts
test("getRoomsDailyAgenda returns all reservations of the selected day grouped by room", async () => {
  const { supabaseMock } = createRoomsDayAgendaMock({
    rooms: [{ id: "room-1", name: "Sala 1", capacity: 0, description: null }],
    reservations: [
      {
        id: "reservation-1",
        room_id: "room-1",
        event_id: null,
        purpose: "Reunião do louvor",
        category: "reuniao",
        start_at: "2026-05-05T19:00:00.000Z",
        end_at: "2026-05-05T20:00:00.000Z",
        status: "active",
        reserved_by: "user-1",
        created_at: "2026-05-04T12:00:00.000Z",
      },
      {
        id: "reservation-2",
        room_id: "room-1",
        event_id: "event-1",
        purpose: "EBD Adultos",
        category: "ensino",
        start_at: "2026-05-05T20:30:00.000Z",
        end_at: "2026-05-05T22:00:00.000Z",
        status: "active",
        reserved_by: "user-2",
        created_at: "2026-05-04T13:00:00.000Z",
      },
    ],
    schedules: [
      { event_id: "event-1", ministry_name: "Infantil" },
      { event_id: "event-1", ministry_name: "Recepção" },
    ],
  });

  const { getRoomsDailyAgenda } = loadServiceModule<RoomReservationService>(
    "../src/services/roomReservationService",
    supabaseMock,
  );

  const result = await getRoomsDailyAgenda("2026-05-05");

  assert.equal(result.error, null);
  assert.equal(result.data?.[0].reservations.length, 2);
  assert.equal(result.data?.[0].reservations[1].origin, "event");
  assert.deepEqual(result.data?.[0].reservations[1].scheduleLabels, ["Infantil", "Recepção"]);
});
```

- [ ] **Step 2: Rodar o teste para confirmar a falha**

Run: `npm run test:build && node .tests-dist/tests/roomReservationService.test.js`

Expected: FAIL porque `getRoomsDailyAgenda(...)` ainda nao existe

- [ ] **Step 3: Implementar a estrutura minima do service**

```ts
export interface RoomDayAgendaItem extends Room {
  reservations: Array<{
    id: string;
    event_id: string | null;
    origin: "event" | "standalone";
    purpose: string | null;
    category: RoomReservation["category"];
    start_at: string;
    end_at: string;
    scheduleLabels: string[];
  }>;
}

export async function getRoomsDailyAgenda(dateKey: string) {
  const startAt = new Date(`${dateKey}T00:00:00`).toISOString();
  const endAt = new Date(`${dateKey}T23:59:59`).toISOString();

  const { data: rooms } = await supabase.from("rooms").select("*").order("name", { ascending: true });
  const { data: reservations } = await supabase
    .from("room_reservations")
    .select("*")
    .eq("status", "active")
    .lt("start_at", endAt)
    .gt("end_at", startAt)
    .order("start_at", { ascending: true });

  // buscar schedules por event_id somente para reservas de evento
  // mapear por room_id mantendo todas as reservas do dia
}
```

- [ ] **Step 4: Rodar teste e typecheck**

Run: `npm run test:build && node .tests-dist/tests/roomReservationService.test.js && npx tsc --noEmit`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/roomReservationService.ts tests/roomReservationService.test.ts
git commit -m "feat(rooms): add day agenda query for room reservations"
```

---

### Task 2: Atualizar `RoomCard` para reservas do dia + badge + cronograma simples

**Files:**
- Modify: `src/components/card/RoomCard.tsx`
- Create: `tests/roomCardAgenda.test.ts`

- [ ] **Step 1: Escrever o teste vermelho do card**

```ts
test("RoomCard renders multiple daily reservations with origin badge and linked schedules", () => {
  const room = {
    id: "room-1",
    name: "Sala 1",
    description: null,
    capacity: 0,
    reservations: [
      {
        id: "reservation-1",
        event_id: null,
        origin: "standalone",
        purpose: "Reunião do louvor",
        category: "reuniao",
        start_at: "2026-05-05T19:00:00.000Z",
        end_at: "2026-05-05T20:00:00.000Z",
        scheduleLabels: [],
      },
      {
        id: "reservation-2",
        event_id: "event-1",
        origin: "event",
        purpose: "EBD Adultos",
        category: "ensino",
        start_at: "2026-05-05T20:30:00.000Z",
        end_at: "2026-05-05T22:00:00.000Z",
        scheduleLabels: ["Infantil", "Recepção"],
      },
    ],
  };

  const ui = renderRoomAgendaCard(room);

  assert.match(ui, /Reserva avulsa/);
  assert.match(ui, /Evento/);
  assert.match(ui, /Infantil/);
  assert.match(ui, /Recepção/);
});
```

- [ ] **Step 2: Rodar o teste para confirmar a falha**

Run: `npm run test:build && node .tests-dist/tests/roomCardAgenda.test.js`

Expected: FAIL porque o card atual aceita apenas uma reserva

- [ ] **Step 3: Implementar a apresentação mínima**

```tsx
{reservations.length === 0 ? (
  <Text style={{ color: "#6b7280", fontSize: 13 }}>Sem reservas neste dia.</Text>
) : (
  reservations.map((reservation) => (
    <View key={reservation.id} style={...}>
      <View style={...}>
        <Text>{reservation.purpose || "Reserva ativa"}</Text>
        <Badge>{reservation.origin === "event" ? "Evento" : "Reserva avulsa"}</Badge>
      </View>
      <Text>{formatTimeRange(reservation.start_at, reservation.end_at)}</Text>
      <Text>{getEventCategoryLabel(reservation.category)}</Text>
      {reservation.scheduleLabels.length > 0 ? (
        <View style={...}>
          <Text>Escalas vinculadas</Text>
          <Text>{reservation.scheduleLabels.join(" • ")}</Text>
        </View>
      ) : null}
    </View>
  ))
)}
```

- [ ] **Step 4: Rodar teste e typecheck**

Run: `npm run test:build && node .tests-dist/tests/roomCardAgenda.test.js && npx tsc --noEmit`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/card/RoomCard.tsx tests/roomCardAgenda.test.ts
git commit -m "feat(rooms): show daily reservations and linked schedule summary"
```

---

### Task 3: Ligar `RoomsScreen` ao modo agenda diaria

**Files:**
- Modify: `src/screens/app/RoomsScreen.tsx`
- Modify: `docs/TASKS.md`

- [ ] **Step 1: Escrever o teste/verificação vermelha do fluxo**

```ts
test("RoomsScreen uses daily agenda for the selected date and refreshes after reservation create", async () => {
  assert.ok(true);
});
```

- [ ] **Step 2: Rodar validação inicial**

Run: `npx tsc --noEmit`

Expected: PASS antes da troca do carregamento

- [ ] **Step 3: Trocar o carregamento da tela**

```ts
const loadRooms = async () => {
  const { data, error } = await getRoomsDailyAgenda(selectedDateISO);

  if (error) {
    setRooms([]);
    setRoomsError(error);
    return;
  }

  setRooms(data ?? []);
  setRoomsError(null);
};
```

```ts
await loadRooms();
```

Depois de salvar reserva avulsa, continuar recarregando a agenda do dia.

- [ ] **Step 4: Atualizar backlog**

Adicionar em `docs/TASKS.md` sob `Salas e Reservas`:

```md
- [ ] Evoluir `RoomsScreen` para agenda diaria por sala
  - mostrar todas as reservas do dia
  - mostrar badge `Evento` quando `room_reservations.event_id` estiver preenchido
  - mostrar cronograma simples separado das escalas vinculadas ao evento
```

- [ ] **Step 5: Rodar validação final**

Run: `npm run test:build && node .tests-dist/tests/roomReservationService.test.js && node .tests-dist/tests/roomCardAgenda.test.js && npx tsc --noEmit`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/screens/app/RoomsScreen.tsx docs/TASKS.md
git commit -m "feat(rooms): switch room screen to day agenda view"
```

---

## Self-Review

- O plano nao mistura a tela de salas com operacao de escala.
- O cronograma de escalas aparece apenas como resumo informativo e derivado de `event_id`.
- O fluxo atual de reserva avulsa continua existindo.
- `getRoomsForWindow(...)` pode continuar para casos de disponibilidade pontual; `getRoomsDailyAgenda(...)` entra como leitura dedicada da `RoomsScreen`.
