import { View, type ViewProps } from "react-native";
import { cn } from "../../lib/utils";

/** A surface only: callers keep their own content, interactions and state. */
export function Card({ className, ...props }: ViewProps) {
  return <View className={cn("rounded-2xl border border-border bg-card p-4", className)} {...props} />;
}
