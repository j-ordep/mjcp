import { test } from "node:test";
import assert from "node:assert/strict";
import { mountScreen, textContent } from "./screenTestHelpers";

const selectMock = { "select-field": { SelectField: "SelectField" } };

test("schedule ministry select preserves loading, empty state and the scoped selection callback", async () => {
  const selections: string[] = [];
  const props = {
    events: [], ministries: [] as { id: string; name: string }[],
    selectedEventId: null, selectedMinistryId: null,
    isLoadingMinistries: true, isLoadingSchedule: false, scheduleId: null,
    onSelectEvent() {}, onSelectMinistry: (id: string) => selections.push(id),
    onSubmit() {}, formatDateTime: (value: string) => value,
  };
  const screen = mountScreen("src/components/schedule/ScheduleContextSection.tsx", selectMock, {}, props);
  await screen.flush();
  assert.equal(screen.findAll("SelectField").length, 0);
  assert.match(screen.findAll("Text").map(textContent).join(" "), /Carregando ministerios/);
  props.isLoadingMinistries = false;
  screen.rerender();
  await screen.flush();
  assert.match(screen.findAll("Text").map(textContent).join(" "), /Nenhum ministerio disponivel/);
  props.ministries = [{ id: "ministry-example", name: "Equipe exemplo" }];
  screen.rerender();
  await screen.flush();
  const select = screen.findAll("SelectField")[0];
  assert.deepEqual(JSON.parse(JSON.stringify(select.props.options)), [{ value: "ministry-example", label: "Equipe exemplo" }]);
  select.props.onValueChange("ministry-example");
  assert.deepEqual(selections, ["ministry-example"]);
  screen.cleanup();
});

test("reservation category select uses its modal portal and persists category with masked hours", async () => {
  const submitted: any[] = [];
  let closed = 0, dropdownClosed = 0;
  const screen = mountScreen("src/components/rooms/RoomReservationModal.tsx", {
    ...selectMock,
    "@rn-primitives/portal": {
      PortalHost: "PortalHost",
      useModalPortalRoot: () => ({ ref: { current: null }, onLayout() {}, style: { flex: 1 }, sideOffset: -20 }),
    },
  }, {}, {
    visible: true, roomName: "Sala exemplo", initialDate: "2030-01-01", isSaving: false,
    onClose() { closed++; }, onSubmit: (payload: any) => submitted.push(payload),
  });
  await screen.flush();
  const select = screen.findAll("SelectField")[0];
  assert.equal(select.props.portalHost, "room-reservation-select");
  assert.equal(select.props.sideOffset, -20);
  assert.equal(screen.findAll("PortalHost")[0].props.name, select.props.portalHost);
  select.props.triggerRef.current = { close: () => { dropdownClosed++; select.props.onOpenChange(false); } };
  select.props.onOpenChange(true);
  await screen.flush();
  screen.findAll("Modal")[0].props.onRequestClose();
  await screen.flush();
  assert.equal(dropdownClosed, 1);
  assert.equal(closed, 0);
  screen.findAll("Modal")[0].props.onRequestClose();
  assert.equal(closed, 1);
  select.props.onValueChange("invalid-category");
  await screen.flush();
  assert.equal(screen.findAll("SelectField")[0].props.value, "geral");
  select.props.onValueChange("culto");
  const fields = screen.findAll("TextInput");
  fields.find((field) => field.props.label === "Titulo da reserva")!.props.onChangeText("  Reserva exemplo  ");
  fields.find((field) => field.props.label === "Hora inicial")!.props.onChangeText("1030");
  fields.find((field) => field.props.label === "Hora final")!.props.onChangeText("1130");
  await screen.flush();
  assert.equal(screen.findAll("TextInput").find((field) => field.props.label === "Hora inicial")!.props.value, "10:30");
  screen.findAll("DefaultButton")[0].props.onPress();
  assert.equal(submitted.length, 1);
  assert.equal(submitted[0].title, "Reserva exemplo");
  assert.equal(submitted[0].category, "culto");
  assert.equal(new Date(submitted[0].endAt).getTime() - new Date(submitted[0].startAt).getTime(), 60 * 60 * 1000);
  screen.cleanup();
});
