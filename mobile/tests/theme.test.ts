import test from "node:test";
import assert from "node:assert/strict";
import { colors } from "../src/theme/colors";

function luminance(hex: string) {
  const channels = hex.slice(1).match(/../g)!.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

test("theme text pairs meet WCAG AA contrast for normal-size labels", () => {
  const pairs = [
    ["body", colors.foreground, colors.background],
    ["card", colors.foreground, colors.surface],
    ["caption", colors.mutedForeground, colors.surface],
    ["muted caption", colors.mutedForeground, colors.muted],
    ["primary action", colors.primaryForeground, colors.primary],
    ["pressed action", colors.primaryForeground, colors.primaryPressed],
    ["secondary action", colors.secondaryForeground, colors.secondary],
    ["inverse caption", colors.inverseMuted, colors.primary],
    ["success", colors.success, colors.successMuted],
    ["warning", colors.warning, colors.warningMuted],
    ["error", colors.destructive, colors.destructiveMuted],
    ["destructive action", colors.primaryForeground, colors.destructive],
  ];
  for (const [name, foreground, background] of pairs) {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    const contrast = (values[0] + 0.05) / (values[1] + 0.05);
    assert.ok(contrast >= 4.5, `${name}: ${contrast.toFixed(2)}:1 is below 4.5:1`);
  }
});
