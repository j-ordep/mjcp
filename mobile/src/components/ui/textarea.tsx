// Adapted from React Native Reusables (385834c). See RNR-LICENSE.txt.
import { cn } from "../../lib/utils";
import { Input, type InputProps } from "./input";
function Textarea({
  className,
  multiline = true,
  numberOfLines = 4,
  ...props
}: InputProps) {
  return (
    <Input
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      className={cn("min-h-28", className)}
      {...props}
    />
  );
}
export { Textarea };
