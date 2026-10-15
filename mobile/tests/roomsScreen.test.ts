import test from "node:test";
import assert from "node:assert/strict";
import { mountScreen, deferred } from "./screenTestHelpers";

const room = { id: "room-example", name: "Sala exemplo", agenda: [] };

test("confirming the current room date preserves its loaded agenda", async () => {
  let reads = 0;
  const screen = mountScreen("src/screens/app/RoomsScreen.tsx", {
    useAuthStore: { useAuthStore: Object.assign(() => ({ session: { user: { id: "user-example" } }, sessionRevision: 1 }), { getState: () => ({ sessionRevision: 1 }) }) },
    roomReservationService: { getRoomsDailyAgenda: async () => { reads++; return { data: [room], error: null }; } },
  });
  await screen.flush();
  const calendar = screen.findAll("CalendarModal")[0];
  calendar.props.onConfirm({ date: calendar.props.initialDate });
  await screen.flush();
  assert.equal(reads, 1);
  assert.equal(screen.findAll("RoomCard").length, 1);
  screen.cleanup();
});

test("rapid room date changes ignore the delayed previous agenda", async () => {
  const old = deferred<any>();
  let reads = 0;
  const screen = mountScreen("src/screens/app/RoomsScreen.tsx", {
    useAuthStore: { useAuthStore: Object.assign(() => ({ session: { user: { id: "user-example" } }, sessionRevision: 1 }), { getState: () => ({ sessionRevision: 1 }) }) },
    roomReservationService: { getRoomsDailyAgenda: () => ++reads === 1 ? old.promise : Promise.resolve({ data: [{ ...room, name: "Nova agenda" }], error: null }) },
  });
  await screen.flush();
  screen.findAll("CalendarModal")[0].props.onConfirm({ date: "2099-12-01" });
  await screen.flush();
  old.resolve({ data: [{ ...room, name: "Agenda anterior" }], error: null });
  await screen.flush();
  assert.equal(screen.findAll("RoomCard")[0].props.name, "Nova agenda");
  screen.cleanup();
});
