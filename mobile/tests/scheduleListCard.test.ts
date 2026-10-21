import test from "node:test";
import assert from "node:assert/strict";
import { mountScreen, textContent } from "./screenTestHelpers";

process.env.TZ = "America/Sao_Paulo";

const props = {
  eventTitle: "Encontro comunitário de exemplo",
  startAt: "2031-01-01T01:30:00Z",
  ministryName: "Ministério de exemplo",
  participationLabel: "Pendente",
  roleLabel: "Voz e instrumento de exemplo",
  eventLocation: "Sala de exemplo",
  onPress() {},
};

function mount(overrides: Record<string, unknown> = {}) {
  return mountScreen("src/components/schedule/ScheduleListCard.tsx", {
    "lucide-react-native": { ChevronRight: "ChevronRight" },
  }, {}, { ...props, ...overrides });
}

function content(screen: ReturnType<typeof mount>) {
  return screen.findAll("Text").map(textContent).join(" ");
}

test("schedule list card presents local date, year and time across a UTC year boundary", () => {
  const screen = mount();
  assert.match(content(screen), /Ter, 31 de dez\./i);
  assert.match(content(screen), /2030/);
  assert.match(content(screen), /22:30/);
  assert.doesNotMatch(content(screen), /2031|01:30/);
  assert.match(screen.findAll("TouchableOpacity")[0].props.accessibilityLabel, /31\/12\/2030 • 22:30/);
});

test("schedule list card preserves full event, ministry, participation, role and location labels", () => {
  const eventTitle = "Encontro de exemplo com um título longo para leitura em fontes ampliadas";
  const ministryName = "Ministério de exemplo com um nome extenso e múltiplas equipes";
  const roleLabel = "Voz de exemplo, Instrumento de exemplo, Apoio de exemplo";
  const screen = mount({ eventTitle, ministryName, roleLabel });
  for (const label of [eventTitle, ministryName, roleLabel, props.participationLabel, props.eventLocation]) {
    assert.ok(content(screen).includes(label));
  }
  assert.ok(screen.findAll("Text").every((node) => node.props.numberOfLines == null && node.props.allowFontScaling !== false));
  assert.equal(screen.findAll("Text").find((node) => textContent(node) === ministryName)!.props.accessibilityRole, "header");
});

test("schedule list card has a single accessible navigation action and forwards each press once", () => {
  let calls = 0;
  const screen = mount({ onPress: () => { calls++; } });
  const buttons = screen.findAll("TouchableOpacity");
  assert.equal(buttons.length, 1);
  assert.equal(screen.findAll("Pressable").length, 0);
  assert.equal(buttons[0].props.accessibilityRole, "button");
  assert.match(buttons[0].props.accessibilityLabel, /Abrir escala Encontro comunitário de exemplo, Ministério de exemplo/);
  assert.match(buttons[0].props.accessibilityLabel, /Pendente/);
  assert.equal(screen.findAll("ChevronRight").length, 1);
  buttons[0].props.onPress();
  assert.equal(calls, 1);
  assert.doesNotMatch(content(screen), /Confirmar|Trocar|Disponível/);
});

test("schedule list card distinguishes the featured forest card and preserves the actual status label", () => {
  const regular = mount({ featured: false, participationLabel: "Sem participacao" });
  const featured = mount({ featured: true, participationLabel: "Sem participacao" });
  assert.match(regular.findAll("TouchableOpacity")[0].props.className, /bg-card/);
  assert.match(featured.findAll("TouchableOpacity")[0].props.className, /bg-primary/);
  assert.match(content(featured), /Sem participacao/);
  assert.doesNotMatch(content(featured), /Confirmado|Disponível|Próxima escala/);
});

test("participation tones distinguish pending, confirmed and declined without upgrading mixed or absent participation", () => {
  for (const [participationLabel, background] of [
    ["Pendente", "bg-warning-muted"],
    ["Confirmado", "bg-success-muted"],
    ["Recusado", "bg-destructive-muted"],
    ["Sem participacao", "bg-secondary"],
    ["Parcialmente confirmado", "bg-secondary"],
    ["Trocado", "bg-secondary"],
  ]) {
    for (const featured of [false, true]) {
      const screen = mount({ participationLabel, featured });
      const pill = screen.findAll("Text").find((node) => textContent(node) === participationLabel)!;
      assert.ok(pill.props.className.includes(background), `${participationLabel} tone, featured=${featured}`);
    }
  }
});

test("schedule list card describes an empty role without inventing participation and omits an absent location", () => {
  const screen = mount({ roleLabel: "  ", eventLocation: null, participationLabel: "Sem participacao" });
  assert.match(content(screen), /Consultar equipe/);
  assert.doesNotMatch(content(screen), /undefined|null|Local:/);
  assert.match(screen.findAll("TouchableOpacity")[0].props.accessibilityLabel, /Consultar equipe/);
});
