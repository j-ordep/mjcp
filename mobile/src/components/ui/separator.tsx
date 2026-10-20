// Adapted from React Native Reusables (385834c). See RNR-LICENSE.txt.
import { View } from "react-native";
import { cn } from "../../lib/utils";

export function Separator({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn("h-px self-stretch shrink-0 bg-border", className)} {...props} />;
}
