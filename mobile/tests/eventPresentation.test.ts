import assert from "node:assert/strict";
import test from "node:test";
import {
  toEventEditorInitialData,
  toInformationalEventViewModel,
} from "../src/utils/eventPresentation";

test("toInformationalEventViewModel returns canonical data for event surfaces", () => {
  const event = {
    title: "ReuniÃ£o de obreiros",
    category: "reuni\u00e3o",
    description: null,
    location: null,
    start_at: "2026-05-01T19:00:00.000Z",
    end_at: "2026-05-01T21:00:00.000Z",
  };

  assert.deepEqual(toInformationalEventViewModel(event), {
    title: "ReuniÃ£o de obreiros",
    category: "reuni\u00e3o",
    startAt: "2026-05-01T19:00:00.000Z",
    endAt: "2026-05-01T21:00:00.000Z",
    location: "NÃ£o informado",
    description: "Sem descriÃ§Ã£o.",
  });
});

test("toInformationalEventViewModel applies fallbacks and normalizes missing end date", () => {
  const event = {
    title: "Culto especial",
    category: "ebd",
    description: "",
    location: "",
    start_at: "2026-05-04T19:30:00.000Z",
    end_at: undefined,
  };

  assert.deepEqual(toInformationalEventViewModel(event), {
    title: "Culto especial",
    category: "ensino",
    startAt: "2026-05-04T19:30:00.000Z",
    endAt: null,
    location: "NÃ£o informado",
    description: "Sem descriÃ§Ã£o.",
  });
});

test("toEventEditorInitialData strips schedule and confirmation fields from polluted event payloads", () => {
  const pollutedEvent = {
    id: "event-1",
    title: "Culto de jovens",
    category: "jovens",
    description: "Noite especial",
    location: "Templo sede",
    start_at: "2026-05-10T22:00:00.000Z",
    end_at: "2026-05-11T00:00:00.000Z",
    is_public: true,
    team: { confirmed: 4, pending: 1 },
    status: "confirmed",
    confirmLabel: "Confirmar",
    confirmDisabled: false,
    swapLabel: "Preciso trocar",
    swapDisabled: false,
    my_assignments: [
      {
        id: "assignment-1",
        role_id: "role-1",
        role_name: "Vocal",
        status: "confirmed",
      },
    ],
  };

  assert.deepEqual(toEventEditorInitialData(pollutedEvent), {
    title: "Culto de jovens",
    category: "jovens",
    description: "Noite especial",
    location: "Templo sede",
    start_at: "2026-05-10T22:00:00.000Z",
    end_at: "2026-05-11T00:00:00.000Z",
    is_public: true,
  });
});
