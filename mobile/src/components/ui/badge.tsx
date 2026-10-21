import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "../../lib/utils";
import { Text } from "./text";

const tones = {
  secondary: { surface: "border-transparent bg-secondary", text: "text-secondary-foreground" },
  success: { surface: "border-transparent bg-success-muted", text: "text-success" },
  warning: { surface: "border-transparent bg-warning-muted", text: "text-warning" },
  destructive: { surface: "border-transparent bg-destructive-muted", text: "text-destructive" },
  outline: { surface: "border-border bg-card", text: "text-muted-foreground" },
};

export function Badge({ children, variant = "secondary", className, ...props }: ViewProps & {
  children: ReactNode;
  variant?: keyof typeof tones;
}) {
  return (
    <View className={cn("self-start rounded-lg border px-2 py-1", tones[variant].surface, className)} {...props}>
      <Text className={cn("text-xs font-semibold", tones[variant].text)}>{children}</Text>
    </View>
  );
}
