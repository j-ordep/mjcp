import test from "node:test";
import assert from "node:assert/strict";
import { mountScreen } from "./screenTestHelpers";

const icons = { "lucide-react-native": {
  Check: "Check", SlidersHorizontal: "SlidersHorizontal", X: "X",
  ArrowLeftRight: "ArrowLeftRight", CalendarOff: "CalendarOff", Plus: "Plus",
} };

test("ministry filter selects immediately, clears and marks the current option", async () => {
  const selections: (string | null)[] = [];
  const props = { ministries: [{ id: "ministry-example", name: "Ministério exemplo" }], selectedId: null as string | null,
    onSelect: (id: string | null) => { selections.push(id); props.selectedId = id; } };
  const screen = mountScreen("src/components/schedule/ScheduleMinistryFilter.tsx", icons, {}, props);
  await screen.flush();
  assert.equal(screen.findAll("Modal")[0].props.visible, false);
  screen.findAll("TouchableOpacity")[0].props.onPress();
  await screen.flush();
  assert.equal(screen.findAll("Modal")[0].props.visible, true);
  screen.findAll("TouchableOpacity").find((node) => node.props.accessibilityLabel === "Ministério exemplo")!.props.onPress();
  screen.rerender();
  await screen.flush();
  assert.deepEqual(selections, ["ministry-example"]);
  assert.equal(screen.findAll("Modal")[0].props.visible, false);
  assert.equal(screen.findAll("TouchableOpacity")[0].props.accessibilityLabel, "Ministério: Ministério exemplo");
  assert.equal(screen.findAll("TouchableOpacity").find((node) => node.props.accessibilityLabel === "Ministério exemplo")!.props.accessibilityState.checked, true);
  screen.findAll("TouchableOpacity")[0].props.onPress();
  await screen.flush();
  screen.findAll("TouchableOpacity").find((node) => node.props.accessibilityLabel === "Todos os ministérios")!.props.onPress();
  screen.rerender();
  await screen.flush();
  assert.deepEqual(selections, ["ministry-example", null]);
  assert.equal(screen.findAll("Modal")[0].props.visible, false);
  assert.equal(screen.findAll("TouchableOpacity")[0].props.accessibilityLabel, "Filtrar ministério");
  screen.cleanup();
});

test("closing the ministry filter by back, backdrop or close button preserves selection", async () => {
  let selections = 0;
  const screen = mountScreen("src/components/schedule/ScheduleMinistryFilter.tsx", icons, {}, {
    ministries: [{ id: "ministry-example", name: "Ministério exemplo" }], selectedId: "ministry-example",
    onSelect: () => { selections++; },
  });
  await screen.flush();
  for (const close of [
    () => screen.findAll("Modal")[0].props.onRequestClose(),
    () => screen.findAll("Pressable")[0].props.onPress(),
    () => screen.findAll("TouchableOpacity").find((node) => node.props.accessibilityLabel === "Fechar filtros")!.props.onPress(),
  ]) {
    screen.findAll("TouchableOpacity")[0].props.onPress();
    await screen.flush();
    close();
    await screen.flush();
    assert.equal(screen.findAll("Modal")[0].props.visible, false);
    assert.equal(screen.findAll("TouchableOpacity")[0].props.accessibilityLabel, "Ministério: Ministério exemplo");
  }
  assert.equal(selections, 0);
  screen.cleanup();
});

test("compact schedule shortcuts preserve both destinations without duplicating creation", async () => {
  const calls: string[] = [];
  const props = { onOpenSwaps: () => calls.push("swaps"),
    onOpenBlockedDates: () => calls.push("blocked") };
  const screen = mountScreen("src/components/schedule/ScheduleActions.tsx", icons, {}, props);
  await screen.flush();
  assert.deepEqual(screen.findAll("TouchableOpacity").map((node) => node.props.accessibilityLabel), ["Trocas", "Indisponibilidades"]);
  screen.findAll("TouchableOpacity").forEach((node) => node.props.onPress());
  assert.deepEqual(calls, ["swaps", "blocked"]);
  screen.cleanup();
});
