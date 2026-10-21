import test from "node:test";
import assert from "node:assert/strict";
import { mountScreen, textContent } from "./screenTestHelpers";

test("input preserves native props/ref, announces errors and forwards focus callbacks", async () => {
  let focus = 0, blur = 0;
  const changes: string[] = [];
  const ref = { current: null };
  const props = { label: "Telefone exemplo", value: "123", ref, keyboardType: "phone-pad",
    secureTextEntry: true, error: "Erro exemplo", onChangeText: (value: string) => changes.push(value),
    onFocus: () => { focus++; }, onBlur: () => { blur++; } };
  const view = mountScreen("src/components/ui/input.tsx", {}, {}, props, "Input");
  await view.flush();
  const field = view.findAll("NativeTextInput")[0];
  assert.equal(field.props.value, "123");
  assert.equal(field.props.ref, ref);
  assert.equal(field.props.keyboardType, "phone-pad");
  assert.equal(field.props.secureTextEntry, true);
  assert.equal(field.props.accessibilityLabel, "Telefone exemplo");
  assert.equal(view.findAll("Text").some((node) => textContent(node) === "Erro exemplo"), true);
  field.props.onChangeText("456");
  field.props.onFocus({});
  await view.flush();
  view.findAll("NativeTextInput")[0].props.onBlur({});
  await view.flush();
  assert.deepEqual(changes, ["456"]);
  assert.equal(focus, 1);
  assert.equal(blur, 1);
  view.cleanup();
});

test("input readonly and multiline preserve masks, blur normalization and adornments", async () => {
  const right = { type: "ExampleAdornment", props: {} };
  const view = mountScreen("src/components/ui/input.tsx", {}, {}, {
    label: "Horário exemplo", value: "09:00", editable: false, multiline: true, numberOfLines: 4, right,
  }, "Input");
  await view.flush();
  const field = view.findAll("NativeTextInput")[0];
  assert.equal(field.props.editable, false);
  assert.equal(field.props.multiline, true);
  assert.equal(field.props.numberOfLines, 4);
  assert.equal(view.findAll("ExampleAdornment").length, 1);
  view.cleanup();
});

test("input keeps its field appearance separate from label and outer spacing", async () => {
  const view = mountScreen("src/components/ui/input.tsx", {}, {}, {
    label: "Busca exemplo", placeholder: "Buscar", value: "",
    containerStyle: { marginBottom: 12 }, fieldClassName: "bg-muted border-border",
  }, "Input");
  await view.flush();
  const outer = view.findAll("View")[0];
  const frame = view.findAll("View")[1];
  assert.deepEqual(JSON.parse(JSON.stringify(outer.props.style)), { marginBottom: 12 });
  assert.match(frame.props.className, /bg-muted/);
  assert.doesNotMatch(outer.props.className, /bg-muted/);
  const native = view.findAll("NativeTextInput")[0];
  assert.equal(native.props.underlineColorAndroid, "transparent");
  assert.equal(native.props.textAlignVertical, "center");
  view.cleanup();
});

test("single-line and readonly date inputs use a centered native text box without font padding", async () => {
  for (const editable of [true, false]) {
    const view = mountScreen("src/components/ui/input.tsx", {}, {}, {
      label: "Data exemplo", value: "12/10/2030", editable, style: { color: "#111827" },
    }, "Input");
    await view.flush();
    const native = view.findAll("NativeTextInput")[0];
    assert.equal(native.props.textAlignVertical, "center");
    assert.equal(native.props.style[0].includeFontPadding, false);
    assert.equal(native.props.style[0].paddingVertical, 0);
    assert.equal(native.props.style[1].color, "#111827");
    const result = await require("postcss")([
      require("tailwindcss")({ content: [{ raw: `<input class="${native.props.className}" />` }],
        corePlugins: { preflight: false } }),
    ]).process("@tailwind utilities;", { from: undefined });
    assert.match(result.css, /height: 3rem/);
    assert.doesNotMatch(result.css, /line-height:/);
    view.cleanup();
  }
});

test("select forwards only enabled known options and preserves modal portal positioning", async () => {
  const changes: string[] = [];
  const primitives = { Select: "Select", SelectContent: "SelectContent", SelectItem: "SelectItem",
    SelectTrigger: "SelectTrigger", SelectValue: "SelectValue" };
  let disabled = false;
  const props = { label: "Ministério exemplo", value: "one" as string | null,
    options: [{ value: "one", label: "Um" }, { value: "two", label: "Dois", disabled: true }],
    onValueChange: (value: string) => changes.push(value), portalHost: "example-modal", sideOffset: -24,
    get disabled() { return disabled; } };
  const view = mountScreen("src/components/ui/select-field.tsx", { select: primitives }, {}, props, "SelectField");
  await view.flush();
  const select = view.findAll("Select")[0];
  assert.equal(select.props.value.label, "Um");
  select.props.onValueChange(undefined);
  select.props.onValueChange({ value: "unknown", label: "Unknown" });
  select.props.onValueChange({ value: "two", label: "Dois" });
  select.props.onValueChange({ value: "one", label: "Um" });
  assert.deepEqual(changes, ["one"]);
  props.value = null;
  view.rerender();
  await view.flush();
  assert.equal(view.findAll("Select")[0].props.value.value, "");
  props.value = "removed";
  view.rerender();
  await view.flush();
  assert.equal(view.findAll("Select")[0].props.value.value, "");
  assert.equal(view.findAll("SelectContent")[0].props.portalHost, "example-modal");
  assert.equal(view.findAll("SelectContent")[0].props.sideOffset, -24);
  disabled = true;
  view.rerender();
  await view.flush();
  assert.equal(view.findAll("SelectTrigger")[0].props.disabled, true);
  assert.equal(view.findAll("SelectValue")[0].props.numberOfLines, 1);
  assert.match(view.findAll("SelectValue")[0].props.className, /flex-1/);
  view.findAll("Select")[0].props.onValueChange({ value: "one", label: "Um" });
  assert.deepEqual(changes, ["one"]);
  view.cleanup();
});

test("primary button allows a long label to wrap without a fixed height", async () => {
  const view = mountScreen("src/components/button/DefaultButton.tsx", {}, {}, {
    children: "Uma ação com descrição extensa para um dispositivo estreito",
    onPress() {},
  });
  await view.flush();
  assert.match(view.findAll("Button")[0].props.className, /h-auto/);
  assert.match(view.findAll("Text")[0].props.className, /shrink/);
  view.cleanup();
});

test("default text does not impose a line height on existing explicit font sizes", async () => {
  const view = mountScreen("src/components/ui/text.tsx", {
    "@rn-primitives/slot": { Slot: "Slot" },
  }, {}, { children: "Legenda exemplo", style: { fontSize: 12 } }, "Text");
  await view.flush();
  const text = view.findAll("Text")[0];
  const result = await require("postcss")([
    require("tailwindcss")({ content: [{ raw: `<p class="${text.props.className}" />` }],
      corePlugins: { preflight: false } }),
  ]).process("@tailwind utilities;", { from: undefined });
  assert.match(result.css, /font-size: 1rem/);
  assert.doesNotMatch(result.css, /line-height:/);
  assert.equal(text.props.style.fontSize, 12);
  view.cleanup();
});
