# Event Core Phase 2 Implementation Plan

Status de execucao: concluido em 2026-05-04.

Resumo do que fechou:
- evento privado sem audiencia explicita agora e valido e fica visivel apenas para `admin`
- `room_reservations.event_id` virou vinculo estrutural opcional entre evento e sala
- RPC atomica `save_event_with_optional_room_reservation` salva evento + audiencia + reserva opcional
- `CreateEventScreen` ganhou selecao opcional de sala para data unica com disponibilidade real
- `RoomsScreen` deixou de ser mock e passou a criar reservas independentes reais
- reconciliacao de sala em edicao ficou protegida contra race condition e limpeza indevida ao mudar/voltar janela

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir evento privado sem audiência explícita, integrar reserva opcional de sala ao fluxo de evento sem conflitos de horário e substituir o mock de `RoomsScreen` por reservas reais e simples.

**Architecture:** Manter `events` como entidade central e `room_reservations` como recurso opcional separado. A visibilidade continua sendo determinada por `is_public` + `event_audiences`, enquanto a sala entra por `room_reservations.event_id` opcional e por uma camada própria de service. Quando o evento escolher sala, a gravação de evento + audiência + reserva deve ser atômica via RPC, para não deixar evento salvo sem a reserva caso exista conflito.

**Tech Stack:** React Native, TypeScript, Zustand, Supabase, Postgres/RLS, `node:test`

---

## Assumptions fechadas para esta fase

- `reunião` continua sendo apenas uma categoria/tag; não existe entidade `meeting`.
- Evento privado **pode** ficar sem membros selecionados; nesse caso ele fica visível apenas para `admin`.
- Quando um evento usa sala, a janela da reserva reaproveita o mesmo `start_at` / `end_at` do evento nesta fase.
- `RoomsScreen` passa a criar reservas independentes de evento (`event_id = null`).
- O schema **não** deve forçar `1 evento = 1 sala`; o vínculo continua sendo `0..N` por `room_reservations.event_id`, mesmo que a UI desta fase escolha apenas uma sala por vez.
- Conflito de horário de sala deve bloquear a gravação; nunca sobrescrever reserva existente.

---

## File Map

- Create: `supabase/migrations/20260502000120_link_room_reservations_to_events.sql`
  - Adicionar `event_id` opcional e `category` em `room_reservations`, com policies mínimas para admin e função RPC atômica para evento + reserva.
- Modify: `src/types/database.types.ts`
  - Refletir `room_reservations.event_id` e `room_reservations.category`.
- Modify: `src/types/models.ts`
  - Atualizar `RoomReservation` para incluir `event_id` e `category`.
- Create: `tests/roomReservationModel.test.ts`
  - Garantir por tipagem o contrato novo de `RoomReservation`.
- Modify: `src/utils/eventAudience.ts`
  - Remover a regra que exige audiência obrigatória em evento privado.
- Modify: `src/services/eventService.ts`
  - Permitir evento privado sem audiência e expor novos entrypoints para salvar evento com sala opcional via RPC.
- Create: `src/services/roomReservationService.ts`
  - Centralizar listagem de salas por janela, criação simples de reserva e leitura da reserva ligada a um evento.
- Create: `supabase/migrations/20260504000121_add_save_event_with_optional_room_reservation_rpc.sql`
  - Encapsular em SQL a gravação atômica de evento + audiência + reserva opcional de sala.
- Modify: `src/stores/useEventStore.ts`
  - Adicionar ações dedicadas para criação/edição de evento com sala opcional, sem quebrar o batch atual sem sala.
- Modify: `src/screens/app/CreateEventScreen.tsx`
  - Remover bloqueio de audiência vazia, carregar disponibilidade de salas, permitir seleção opcional de sala e usar o fluxo atômico quando houver sala.
- Modify: `src/screens/app/RoomsScreen.tsx`
  - Trocar mock estático por listagem real + reserva simples de sala com `title`, `category`, `date`, `start/end`.
- Modify: `src/components/card/RoomCard.tsx`
  - Exibir dados reais da reserva ocupante (título/categoria/horário) e manter CTA de reserva.
- Modify: `package.json`
  - Incluir os novos testes unitários.
- Modify: `tests/eventAudience.test.ts`
  - Atualizar a semântica da audiência privada para aceitar vazio.
- Modify: `tests/eventService.test.ts`
  - Cobrir evento privado sem audiência e o fluxo de evento com sala opcional.
- Create: `tests/roomReservationService.test.ts`
  - Cobrir disponibilidade, reserva independente e mensagem amigável de conflito.
- Modify: `docs/CONTEXT.md`
- Modify: `docs/NEXT_STEPS_PLAN.md`
- Modify: `docs/TASKS.md`
  - Registrar o fechamento da Fase 2 e o início da integração simples de salas.

---

### Task 1: Relaxar a obrigatoriedade de audiência em evento privado

**Files:**
- Modify: `src/utils/eventAudience.ts`
- Modify: `src/services/eventService.ts`
- Modify: `src/screens/app/CreateEventScreen.tsx`
- Modify: `tests/eventAudience.test.ts`
- Modify: `tests/eventService.test.ts`

- [ ] **Step 1: Escrever os testes vermelhos da nova regra**

```ts
test("normalizeAudienceUserIds returns an empty array when no member is selected", () => {
  assert.deepEqual(normalizeAudienceUserIds([" ", "", "   "]), []);
});

test("createEvent allows a private event without selected members", { concurrency: false }, async () => {
  const { calls, supabaseMock } = createEventAudienceMock({
    eventResponses: [{ data: { id: "event-1", title: "Reunião interna" } }],
  });
  const { createEvent } = loadServiceModule<EventService>(
    "../src/services/eventService",
    supabaseMock,
  );

  const result = await withFixedDate("2026-04-24T10:00:00.000Z", () =>
    createEvent({
      title: "Reunião interna",
      is_public: false,
      visible_to_user_ids: [" ", ""],
      start_at: "2026-04-24T22:00:00.000Z",
    }),
  );

  assert.equal(result.error, null);
  assert.equal(calls.audienceInserts.length, 0);
});
```

- [ ] **Step 2: Rodar os testes para confirmar a falha**

Run: `npm run test:build && node .tests-dist/tests/eventAudience.test.js && node .tests-dist/tests/eventService.test.js`

Expected: FAIL porque o código atual ainda lança `Selecione pelo menos um membro para evento privado.`

- [ ] **Step 3: Implementar a correção mínima**

```ts
// src/utils/eventAudience.ts
export function normalizeAudienceUserIds(userIds: string[] | undefined) {
  return Array.from(
    new Set((userIds ?? []).map((userId) => userId.trim()).filter(Boolean)),
  );
}
```

```ts
// src/services/eventService.ts
const visibleUserIds = normalizeAudienceUserIds(eventData.visible_to_user_ids);
const isPublic = eventData.is_public !== false;

// não bloquear mais privado sem audiência; RLS já deixa admin como fallback

if (!isPublic) {
  await syncEventAudience(data.id, false, visibleUserIds);
}
```

```ts
// src/screens/app/CreateEventScreen.tsx
if (!isPublic && selectedAudience.length === 0) {
  // remover Alert de bloqueio
}

<Text style={{ fontSize: 13, color: "#6b7280", lineHeight: 18, marginBottom: 20 }}>
  {isPublic
    ? "Todos os membros autenticados visualizam este evento."
    : selectedAudience.length === 0
      ? "Sem membros selecionados, apenas administradores visualizam este evento."
      : "Administradores e membros selecionados visualizam este evento."}
</Text>
```

- [ ] **Step 4: Rodar os testes e o typecheck**

Run: `npm run test:build && node .tests-dist/tests/eventAudience.test.js && node .tests-dist/tests/eventService.test.js && npx tsc --noEmit`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/eventAudience.ts src/services/eventService.ts src/screens/app/CreateEventScreen.tsx tests/eventAudience.test.ts tests/eventService.test.ts
git commit -m "feat(events): allow private events without explicit audience"
```

---

### Task 2: Preparar schema e contrato de reserva de sala vinculada a evento

**Files:**
- Create: `supabase/migrations/20260502000120_link_room_reservations_to_events.sql`
- Modify: `src/types/database.types.ts`
- Modify: `src/types/models.ts`
- Create: `tests/roomReservationModel.test.ts`

- [ ] **Step 1: Escrever o teste vermelho do contrato de tipos**

```ts
test("RoomReservation model tracks linked event and category", () => {
  const reservation: RoomReservation = {
    id: "reservation-1",
    room_id: "room-1",
    event_id: "event-1",
    reserved_by: "user-1",
    start_at: "2026-05-02T19:00:00.000Z",
    end_at: "2026-05-02T21:00:00.000Z",
    purpose: "Reunião do louvor",
    category: "reunião",
    status: "active",
    created_at: "2026-05-01T10:00:00.000Z",
  };

  assert.equal(reservation.event_id, "event-1");
  assert.equal(reservation.category, "reunião");
});
```

- [ ] **Step 2: Rodar o teste para confirmar a falha**

Run: `npm run test:build && node .tests-dist/tests/roomReservationModel.test.js`

Expected: FAIL de tipagem porque `RoomReservation` e `database.types.ts` ainda não conhecem `event_id` nem `category`

- [ ] **Step 3: Implementar a migration e os tipos**

```sql
ALTER TABLE public.room_reservations
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'geral';

ALTER TABLE public.room_reservations
  DROP CONSTRAINT IF EXISTS room_reservations_category_check;

ALTER TABLE public.room_reservations
  ADD CONSTRAINT room_reservations_category_check
  CHECK (
    category IN (
      'geral',
      'culto',
      'ensino',
      'jovens',
      'oração',
      'reunião',
      'especial'
    )
  );

CREATE INDEX IF NOT EXISTS room_reservations_event_id_idx
  ON public.room_reservations(event_id);

DROP POLICY IF EXISTS "Admin can manage room reservations" ON public.room_reservations;

CREATE POLICY "Admin can manage room reservations"
  ON public.room_reservations
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
```

```ts
// src/types/models.ts
export interface RoomReservation {
  id: string
  room_id: string
  event_id: string | null
  reserved_by: string
  start_at: string
  end_at: string
  purpose: string | null
  category: EventCategory
  status: 'active' | 'cancelled'
  created_at: string
}
```

- [ ] **Step 4: Rodar typecheck e revisão da migration**

Run: `npm run test:build && node .tests-dist/tests/roomReservationModel.test.js && npx tsc --noEmit`

Expected: PASS

Run: `Get-Content supabase/migrations/20260502000120_link_room_reservations_to_events.sql`

Expected: a migration mostra `event_id`, `category` e policy de admin sem introduzir `events.room_id`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260502000120_link_room_reservations_to_events.sql src/types/database.types.ts src/types/models.ts tests/roomReservationModel.test.ts
git commit -m "feat(rooms): link reservations to events optionally"
```

---

### Task 3: Criar o service de salas e a gravação atômica de evento com sala

**Files:**
- Create: `supabase/migrations/20260504000121_add_save_event_with_optional_room_reservation_rpc.sql`
- Create: `src/services/roomReservationService.ts`
- Modify: `src/services/eventService.ts`
- Create: `tests/roomReservationService.test.ts`
- Modify: `tests/eventService.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Escrever os testes vermelhos de disponibilidade e conflito**

```ts
type RoomReservationService = typeof import("../src/services/roomReservationService");
type MockResponse = { data?: unknown; error?: { message: string } | null };

function createRoomsWindowMock(config: {
  rooms: unknown[];
  reservations: unknown[];
}) {
  const roomBuilder: any = {
    select: () => roomBuilder,
    order: () => roomBuilder,
    then: (onfulfilled: (value: { data: unknown; error: null }) => unknown) =>
      Promise.resolve({ data: config.rooms, error: null }).then(onfulfilled),
  };

  const reservationBuilder: any = {
    select: () => reservationBuilder,
    eq: () => reservationBuilder,
    lt: () => reservationBuilder,
    gt: () => reservationBuilder,
    then: (onfulfilled: (value: { data: unknown; error: null }) => unknown) =>
      Promise.resolve({ data: config.reservations, error: null }).then(onfulfilled),
  };

  return {
    supabaseMock: {
      from: (table: string) => {
        if (table === "rooms") return roomBuilder;
        if (table === "room_reservations") return reservationBuilder;
        throw new Error(`Unexpected table: ${table}`);
      },
    },
  };
}

function createRoomInsertMock(response: MockResponse) {
  const builder: any = {
    insert: () => builder,
    select: () => builder,
    single: async () => ({
      data: response.data ?? null,
      error: response.error ?? null,
    }),
  };

  return {
    supabaseMock: {
      from: (table: string) => {
        if (table !== "room_reservations") {
          throw new Error(`Unexpected table: ${table}`);
        }
        return builder;
      },
    },
  };
}

test("getRoomsForWindow returns room availability with the overlapping reservation summary", async () => {
  const { supabaseMock } = createRoomsWindowMock({
    rooms: [{ id: "room-1", name: "Sala 1", capacity: 20, description: null }],
    reservations: [{
      id: "reservation-1",
      room_id: "room-1",
      event_id: null,
      reserved_by: "user-1",
      start_at: "2026-05-02T19:00:00.000Z",
      end_at: "2026-05-02T21:00:00.000Z",
      purpose: "Reunião do louvor",
      category: "reunião",
      status: "active",
      created_at: "2026-05-01T10:00:00.000Z",
    }],
  });
  const { getRoomsForWindow } = loadServiceModule<RoomReservationService>(
    "../src/services/roomReservationService",
    supabaseMock,
  );

  const result = await getRoomsForWindow({
    startAt: "2026-05-02T19:30:00.000Z",
    endAt: "2026-05-02T20:30:00.000Z",
  });

  assert.equal(result.error, null);
  assert.equal(result.data?.[0].status, "occupied");
  assert.equal(result.data?.[0].reservation?.purpose, "Reunião do louvor");
});

test("createStandaloneRoomReservation maps overlap conflicts to a friendly message", async () => {
  const { supabaseMock } = createRoomInsertMock({
    error: { message: "conflicting key value violates exclusion constraint \"no_overlap\"" },
  });
  const { createStandaloneRoomReservation } = loadServiceModule<RoomReservationService>(
    "../src/services/roomReservationService",
    supabaseMock,
  );

  const result = await createStandaloneRoomReservation({
    roomId: "room-1",
    title: "Reunião do louvor",
    category: "reunião",
    startAt: "2026-05-02T19:00:00.000Z",
    endAt: "2026-05-02T21:00:00.000Z",
  });

  assert.equal(result.error, "Esta sala já está reservada para esse horário.");
});
```

- [ ] **Step 2: Rodar os testes para confirmar a falha**

Run: `npm run test:build && node .tests-dist/tests/roomReservationService.test.js`

Expected: FAIL com `Cannot find module '../src/services/roomReservationService'`

- [ ] **Step 3: Implementar o service e o save atômico do evento**

```ts
// src/services/roomReservationService.ts
export interface RoomAvailability {
  id: string;
  name: string;
  capacity: number;
  description: string | null;
  status: "available" | "occupied";
  reservation: RoomReservation | null;
}

export async function getRoomsForWindow(input: { startAt: string; endAt: string }) {
  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("*")
    .order("name", { ascending: true });

  if (roomsError) {
    return { data: null, error: roomsError.message };
  }

  const { data: reservations, error: reservationsError } = await supabase
    .from("room_reservations")
    .select("*")
    .eq("status", "active")
    .lt("start_at", input.endAt)
    .gt("end_at", input.startAt);

  if (reservationsError) {
    return { data: null, error: reservationsError.message };
  }

  return {
    data: (rooms ?? []).map((room) => {
      const reservation = (reservations ?? []).find((item) => item.room_id === room.id) ?? null;
      return {
        ...room,
        status: reservation ? "occupied" : "available",
        reservation,
      };
    }),
    error: null,
  };
}

export async function createStandaloneRoomReservation(input: {
  roomId: string;
  title: string;
  category: EventCategory;
  startAt: string;
  endAt: string;
}) {
  const { data, error } = await supabase
    .from("room_reservations")
    .insert([{
      room_id: input.roomId,
      event_id: null,
      purpose: input.title,
      category: input.category,
      start_at: input.startAt,
      end_at: input.endAt,
    }])
    .select()
    .single();

  if (error?.message?.includes("no_overlap")) {
    return { data: null, error: "Esta sala já está reservada para esse horário." };
  }

  return { data, error: error?.message ?? null };
}
```

```ts
// src/services/eventService.ts
export async function saveEventWithOptionalRoom(input: {
  eventId?: string;
  event: Partial<Event>;
  roomId?: string | null;
}) {
  const visibleUserIds = normalizeAudienceUserIds(input.event.visible_to_user_ids);

  const { data, error } = await supabase.rpc("save_event_with_optional_room_reservation", {
    p_event_id: input.eventId ?? null,
    p_title: input.event.title,
    p_category: normalizeEventCategory(input.event.category),
    p_description: input.event.description ?? null,
    p_location: input.event.location ?? null,
    p_start_at: input.event.start_at,
    p_end_at: input.event.end_at,
    p_is_public: input.event.is_public !== false,
    p_visible_user_ids: visibleUserIds,
    p_room_id: input.roomId ?? null,
  });

  if (error?.message?.includes("no_overlap")) {
    return { data: null, error: "Esta sala já está reservada para esse horário." };
  }

  return { data: data as Event, error: error?.message ?? null };
}
```

```json
// package.json
"test:unit": "npm run test:build && node .tests-dist/tests/eventDate.test.js && node .tests-dist/tests/eventCategory.test.js && node .tests-dist/tests/eventAudience.test.js && node .tests-dist/tests/roomReservationModel.test.js && node .tests-dist/tests/roomReservationService.test.js && node .tests-dist/tests/eventPresentation.test.js && node .tests-dist/tests/eventService.test.js && node .tests-dist/tests/eventFilters.test.js && node .tests-dist/tests/statusLabels.test.js && node .tests-dist/tests/formatDate.test.js && node .tests-dist/tests/scheduleParticipation.test.js && node .tests-dist/tests/scheduleRules.test.js && node .tests-dist/tests/ministryMappers.test.js && node .tests-dist/tests/scheduleCardMappers.test.js && node .tests-dist/tests/scheduleService.test.js && node .tests-dist/tests/ministryService.test.js && node .tests-dist/tests/profileService.test.js && node .tests-dist/tests/audienceResults.test.js"
```

- [ ] **Step 4: Rodar os testes e o typecheck**

Run: `npm run test:build && node .tests-dist/tests/roomReservationService.test.js && node .tests-dist/tests/eventService.test.js && npx tsc --noEmit`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260504000121_add_save_event_with_optional_room_reservation_rpc.sql src/services/roomReservationService.ts src/services/eventService.ts tests/roomReservationService.test.ts tests/eventService.test.ts package.json
git commit -m "feat(rooms): add reservation service and atomic event save"
```

---

### Task 4: Ligar a seleção opcional de sala no evento e ativar `RoomsScreen`

**Files:**
- Modify: `src/stores/useEventStore.ts`
- Modify: `src/screens/app/CreateEventScreen.tsx`
- Modify: `src/screens/app/RoomsScreen.tsx`
- Modify: `src/components/card/RoomCard.tsx`

- [ ] **Step 1: Declarar o novo contrato vermelho do store e da tela**

```ts
// src/stores/useEventStore.ts
createEventWithRoom: (
  eventData: Partial<Event>,
  roomId: string | null,
) => Promise<{ data: Event | null; error: string | null }>;

updateEventWithRoom: (
  eventId: string,
  updates: Partial<Event>,
  roomId: string | null,
) => Promise<{ data: Event | null; error: string | null }>;
```

Run: `npx tsc --noEmit`

Expected: FAIL porque a interface da store e as chamadas de `CreateEventScreen` passam a exigir métodos ainda não implementados

- [ ] **Step 2: Adicionar as ações do store para evento com sala opcional**

```ts
// src/stores/useEventStore.ts
createEventWithRoom: async (eventData, roomId) => {
  set({ isLoadingEvents: true, error: null });
  const { data, error } = await saveEventWithOptionalRoom({
    event: eventData,
    roomId,
  });
  if (error) {
    set({ error, isLoadingEvents: false });
    return { data: null, error };
  }

  const [{ data: freshEvents }, { data: freshAllEvents }] = await Promise.all([
    getUpcomingEvents(),
    getEvents(),
  ]);

  set({
    events: freshEvents || [],
    allEvents: freshAllEvents || [],
    isLoadingEvents: false,
    isLoadingAllEvents: false,
  });

  return { data, error: null };
},

updateEventWithRoom: async (eventId, updates, roomId) => {
  set({ isLoadingEvents: true, error: null });
  const { data, error } = await saveEventWithOptionalRoom({
    eventId,
    event: updates,
    roomId,
  });
  if (error) {
    set({ error, isLoadingEvents: false });
    return { data: null, error };
  }

  const [{ data: freshEvents }, { data: freshAllEvents }] = await Promise.all([
    getUpcomingEvents(),
    getEvents(),
  ]);

  set({
    events: freshEvents || [],
    allEvents: freshAllEvents || [],
    isLoadingEvents: false,
    isLoadingAllEvents: false,
  });

  return { data, error: null };
},
```

- [ ] **Step 3: Implementar o fluxo opcional de sala em `CreateEventScreen`**

```ts
// estado local novo
const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
const [availableRooms, setAvailableRooms] = useState<RoomAvailability[]>([]);
const [isLoadingRooms, setIsLoadingRooms] = useState(false);

const singleSelectedDate = Object.keys(selectedDays).length === 1 ? Object.keys(selectedDays)[0] : null;
const eventDate = singleSelectedDate ? createLocalDateTime(singleSelectedDate, time) : null;

useEffect(() => {
  if (!singleSelectedDate || !time.trim()) {
    setAvailableRooms([]);
    setSelectedRoomId(null);
    return;
  }

  const startAt = createLocalDateTime(singleSelectedDate, time);
  const endAt = getDefaultEndAt(startAt);

  void (async () => {
    setIsLoadingRooms(true);
    const result = await getRoomsForWindow({
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    });
    setAvailableRooms(result.data ?? []);
    setIsLoadingRooms(false);
  })();
}, [selectedDays, time]);
```

```tsx
{/* seção opcional de sala */}
<View style={{ marginBottom: 24 }}>
  <Text style={{ fontSize: 13, color: "#666", fontWeight: "bold", marginBottom: 8 }}>
    SALA (OPCIONAL)
  </Text>
  {!singleSelectedDate ? (
    <Text style={{ fontSize: 13, color: "#6b7280" }}>
      Selecione uma única data para reservar sala nesta fase.
    </Text>
  ) : (
    availableRooms.map((room) => (
      <Chip
        key={room.id}
        selected={selectedRoomId === room.id}
        disabled={room.status === "occupied" && selectedRoomId !== room.id}
        onPress={() => setSelectedRoomId(selectedRoomId === room.id ? null : room.id)}
      >
        {room.name}
      </Chip>
    ))
  )}
</View>
```

```ts
// handleSave
if (selectedRoomId) {
  const eventDate = createLocalDateTime(dates[0], `${hours}:${minutes}`);
  const payload = {
    title,
    category,
    description,
    location,
    start_at: eventDate.toISOString(),
    end_at: getDefaultEndAt(eventDate).toISOString(),
    is_public: isPublic,
    visible_to_user_ids: visibleToUserIds,
  };

  const result = isEdit && eventId
    ? await updateEventWithRoom(eventId, payload, selectedRoomId)
    : await createEventWithRoom(payload, selectedRoomId);

  if (result.error) {
    Alert.alert("Erro ao salvar evento", result.error);
    return;
  }

  navigation.goBack();
  return;
}
```

- [ ] **Step 4: Substituir o mock de `RoomsScreen` por reservas reais**

```tsx
// src/screens/app/RoomsScreen.tsx
const [title, setTitle] = useState("");
const [category, setCategory] = useState<EventCategory>("geral");
const [endTime, setEndTime] = useState("21:00");
const [rooms, setRooms] = useState<RoomAvailability[]>([]);

const loadRooms = async () => {
  const startAt = createLocalDateTime(selectedDateISO, selectedTime);
  const endAt = createLocalDateTime(selectedDateISO, endTime);
  const result = await getRoomsForWindow({
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  });
  setRooms(result.data ?? []);
};

const handleReserve = async (roomId: string) => {
  const startAt = createLocalDateTime(selectedDateISO, selectedTime);
  const endAt = createLocalDateTime(selectedDateISO, endTime);

  const result = await createStandaloneRoomReservation({
    roomId,
    title: title.trim(),
    category,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  });

  if (result.error) {
    Alert.alert("Erro ao reservar sala", result.error);
    return;
  }

  await loadRooms();
};
```

- [ ] **Step 5: Rodar os testes e o typecheck**

Run: `npm test`

Expected: PASS

Run: `npx tsc --noEmit`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/stores/useEventStore.ts src/screens/app/CreateEventScreen.tsx src/screens/app/RoomsScreen.tsx src/components/card/RoomCard.tsx
git commit -m "feat(rooms): connect event flow and real room reservations"
```

---

### Task 5: Atualizar docs e validar o recorte da Fase 2

**Files:**
- Modify: `docs/CONTEXT.md`
- Modify: `docs/NEXT_STEPS_PLAN.md`
- Modify: `docs/TASKS.md`

- [ ] **Step 1: Atualizar a documentação viva**

```md
- evento privado pode existir sem audiência explícita; nesse caso fica visível apenas para `admin`
- `event_audiences` continua representando convite + visibilidade quando houver audiência selecionada
- `room_reservations.event_id` passa a ser o vínculo estrutural opcional entre evento e sala
- `RoomsScreen` deixa de ser mock e passa a criar reservas independentes de evento
- a seleção de sala no evento é opcional e respeita conflito de horário
```

- [ ] **Step 2: Rodar a validação final**

Run: `npm test`

Expected: PASS

Run: `npx tsc --noEmit`

Expected: PASS

- [ ] **Step 3: Revisar o diff do recorte**

Run: `git diff -- supabase/migrations/20260502000120_link_room_reservations_to_events.sql src/types/database.types.ts src/types/models.ts src/utils/eventAudience.ts src/services/eventService.ts src/services/roomReservationService.ts src/stores/useEventStore.ts src/screens/app/CreateEventScreen.tsx src/screens/app/RoomsScreen.tsx src/components/card/RoomCard.tsx tests/eventAudience.test.ts tests/eventService.test.ts tests/roomReservationService.test.ts docs/CONTEXT.md docs/NEXT_STEPS_PLAN.md docs/TASKS.md`

Expected: diff restrito a evento privado sem audiência obrigatória e reservas simples de sala, sem reabrir fluxo de escala

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260502000120_link_room_reservations_to_events.sql src/types/database.types.ts src/types/models.ts src/utils/eventAudience.ts src/services/eventService.ts src/services/roomReservationService.ts src/stores/useEventStore.ts src/screens/app/CreateEventScreen.tsx src/screens/app/RoomsScreen.tsx src/components/card/RoomCard.tsx tests/eventAudience.test.ts tests/eventService.test.ts tests/roomReservationService.test.ts docs/CONTEXT.md docs/NEXT_STEPS_PLAN.md docs/TASKS.md
git commit -m "feat(events): add optional room reservations to private event flow"
```

---

## Self-Review

- O plano mantém `reunião` como categoria, sem nova entidade.
- O plano não mistura `escala` com participantes de evento privado.
- O plano preserva `room_reservations` como entidade própria e permite reserva sem evento.
- O plano evita `events.room_id` e mantém o vínculo por `room_reservations.event_id`.
- O ponto mais sensível do recorte está explicitado: salvar evento com sala precisa ser atômico para não deixar evento salvo sem a reserva quando houver conflito.
