import { DefaultTheme } from "@react-navigation/native";
import { MD3LightTheme } from "react-native-paper";
import { colors } from "./colors";

// Paper remains in use for avatars, chips and notifications.
export const lightTheme = {
  ...MD3LightTheme,
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.primaryForeground,
    primaryContainer: colors.secondary,
    onPrimaryContainer: colors.secondaryForeground,
    secondary: colors.secondaryForeground,
    onSecondary: colors.primaryForeground,
    secondaryContainer: colors.secondary,
    onSecondaryContainer: colors.secondaryForeground,
    tertiary: colors.success,
    onTertiary: colors.primaryForeground,
    tertiaryContainer: colors.successMuted,
    onTertiaryContainer: colors.success,
    error: colors.destructive,
    onError: colors.primaryForeground,
    errorContainer: colors.destructiveMuted,
    onErrorContainer: colors.destructive,
    background: colors.background,
    onBackground: colors.foreground,
    surface: colors.surface,
    onSurface: colors.foreground,
    surfaceVariant: colors.muted,
    onSurfaceVariant: colors.mutedForeground,
    surfaceDisabled: colors.disabled,
    onSurfaceDisabled: colors.mutedForeground,
    inverseSurface: colors.primary,
    inverseOnSurface: colors.primaryForeground,
    inversePrimary: colors.inverseMuted,
    outline: colors.input,
    outlineVariant: colors.border,
    backdrop: colors.overlay,
    shadow: colors.shadow,
    elevation: {
      level0: "transparent",
      level1: colors.surface,
      level2: colors.surface,
      level3: colors.surface,
      level4: colors.surface,
      level5: colors.surface,
    },
  },
};

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.foreground,
    border: colors.border,
    notification: colors.primary,
  },
};
