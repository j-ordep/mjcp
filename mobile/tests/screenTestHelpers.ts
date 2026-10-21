import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

// Exercise screen coordination and callbacks without a native renderer.
// Child components remain elements: this does not verify layout or device behavior.
export function mountScreen(filename: string, modules: Record<string, unknown>, params: unknown = {}, props: Record<string, unknown> = {}, exportName = "default") {
  const hooks: any[] = [];
  let cursor = 0, dirty = true, focused = true;
  let tree: any;
  let preventRemove: { enabled: boolean; callback: (data: any) => void };
  const effects: (() => void)[] = [];
  const same = (a: unknown[], b: unknown[]) => a?.length === b?.length && a.every((value, i) => Object.is(value, b[i]));
  const useMemo = (factory: () => unknown, deps: unknown[]) => {
    const index = cursor++;
    if (!hooks[index] || !same(hooks[index].deps, deps)) hooks[index] = { deps, value: factory() };
    return hooks[index].value;
  };
  const useEffect = (callback: () => any, deps: unknown[]) => {
    const index = cursor++;
    if (!hooks[index] || !same(hooks[index].deps, deps)) {
      const previous = hooks[index];
      hooks[index] = { deps };
      effects.push(() => { previous?.cleanup?.(); hooks[index].cleanup = callback(); });
    }
  };
  const navigation = { navigate() {}, goBack() {}, dispatch() {}, canGoBack: () => true };
  const alerts: any[][] = [];
  const mocks: Record<string, any> = {
    react: {
      ...require("react"), useEffect, useMemo,
      useContext: (context: any) => context._currentValue,
      useId: () => { const index = cursor++; return `test-field-${index}`; },
      useCallback: (fn: () => unknown, deps: unknown[]) => useMemo(() => fn, deps),
      useRef: (value: unknown) => { const index = cursor++; return hooks[index] ?? (hooks[index] = { current: value }); },
      useState: (initial: any) => {
        const index = cursor++;
        if (!hooks[index]) hooks[index] = { value: typeof initial === "function" ? initial() : initial };
        return [hooks[index].value, (next: any) => {
          const value = typeof next === "function" ? next(hooks[index].value) : next;
          if (!Object.is(value, hooks[index].value)) { hooks[index].value = value; dirty = true; }
        }];
      },
    },
    "@react-navigation/native": {
      useNavigation: () => navigation, useRoute: () => ({ key: "example-route", params, name: path.basename(filename, ".tsx") }),
      useFocusEffect: (callback: () => any) => useEffect(() => focused ? callback() : undefined, [callback, focused]),
      usePreventRemove: (enabled: boolean, callback: (data: any) => void) => { preventRemove = { enabled, callback }; },
    },
    "react-native": {
      View: "View", Text: "Text", TextInput: "NativeTextInput", TouchableOpacity: "TouchableOpacity", ScrollView: "ScrollView", FlatList: "FlatList",
      RefreshControl: "RefreshControl", ActivityIndicator: "ActivityIndicator", Modal: "Modal",
      KeyboardAvoidingView: "KeyboardAvoidingView", Pressable: "Pressable", TouchableWithoutFeedback: "TouchableWithoutFeedback",
      Platform: { OS: "android", select: (options: any) => options.android ?? options.native ?? options.default }, Keyboard: { dismiss() {} },
      Alert: { alert: (...args: any[]) => alerts.push(args) },
    },
    "react-native-paper": { Text: "Text", TextInput: "TextInput" },
    text: { Text: "Text" },
    input: { Input: "TextInput" },
    textarea: { Textarea: "TextInput" },
    label: { Label: "Label" },
    button: { Button: "Button" },
    checkbox: { Checkbox: "Checkbox" },
    switch: { Switch: "Switch" },
    "select-field": { SelectField: "SelectField" },
    "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
    "lucide-react-native": { Search: "Search", ShieldCheck: "ShieldCheck", UserPlus: "UserPlus", X: "X", Calendar: "Calendar" },
    ...modules,
  };
  const absolute = path.resolve(filename);
  const source = ts.transpileModule(readFileSync(absolute, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }, fileName: absolute,
  }).outputText;
  const module = { exports: {} as any };
  const customRequire = (name: string): unknown => {
    const mocked = mocks[name] ?? mocks[path.basename(name)];
    if (mocked) return mocked;
    if (name.includes("/components/") || (name.startsWith(".") &&
      path.resolve(path.dirname(absolute), name).startsWith(path.resolve("src/components") + path.sep))) {
      return { __esModule: true, default: path.basename(name) };
    }
    if (name.startsWith(".")) {
      const relative = path.relative(path.resolve("src"), path.resolve(path.dirname(absolute), name));
      return require(path.resolve(__dirname, "../src", relative));
    }
    return require(name);
  };
  vm.runInNewContext(source, { exports: module.exports, module, require: customRequire, setTimeout, clearTimeout, console }, { filename: absolute });
  const render = () => {
    cursor = 0; dirty = false; tree = module.exports[exportName]({ navigation, ...props });
    while (effects.length) effects.shift()!();
  };
  const flush = async () => {
    for (let i = 0; i < 30; i++) {
      if (dirty) render();
      await new Promise<void>((resolve) => setImmediate(resolve));
      if (!dirty && effects.length === 0) return;
    }
    throw new Error("Screen did not settle");
  };
  const findAll = (type: string): any[] => {
    const found: any[] = [];
    const visit = (node: any) => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) { node.forEach(visit); return; }
      if (node.type === type) found.push(node);
      visit(node.props?.children);
    };
    visit(tree);
    return found;
  };
  render();
  return {
    flush, findAll, navigation, alerts,
    get preventRemove() { return preventRemove!; },
    focus: (value: boolean) => { focused = value; dirty = true; },
    rerender: () => { dirty = true; },
    cleanup: () => hooks.forEach((hook) => hook?.cleanup?.()),
  };
}

export function textContent(node: any): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join(" ");
  return node && typeof node === "object" ? textContent(node.props?.children) : "";
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
