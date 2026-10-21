// Adapted from React Native Reusables (385834c). See RNR-LICENSE.txt.
import * as React from "react";
import { TextInput, View, type StyleProp, type ViewStyle } from "react-native";
import { cn } from "../../lib/utils";
import { Text } from "./text";
import { Label } from "./label";
import { colors } from "../../theme/colors";
export type InputProps = React.ComponentProps<typeof TextInput> &
  React.RefAttributes<TextInput> & {
    label?: string;
    error?: string | boolean;
    hint?: string;
    left?: React.ReactNode;
    right?: React.ReactNode;
    containerStyle?: StyleProp<ViewStyle>;
    fieldClassName?: string;
  };
function Input({
  label,
  error,
  hint,
  left,
  right,
  containerStyle,
  fieldClassName,
  className,
  onFocus,
  onBlur,
  accessibilityLabel,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = React.useState(false);
  const fieldId = React.useId();
  return (
    <View style={containerStyle} className="min-w-0 gap-2">
      {label ? <Label nativeID={`${fieldId}-label`}>{label}</Label> : null}
      <View
        className={cn(
          "flex-row items-center overflow-hidden rounded-xl border border-input bg-card",
          fieldClassName,
          error
            ? "border-destructive"
            : focused
              ? "border-ring"
              : undefined,
          props.editable === false && "opacity-60",
        )}
      >
        {left ? <View className="pl-3">{left}</View> : null}
        <TextInput
          {...props}
          accessibilityLabel={accessibilityLabel ?? label}
          aria-labelledby={label ? `${fieldId}-label` : undefined}
          aria-invalid={Boolean(error)}
          underlineColorAndroid={props.underlineColorAndroid ?? "transparent"}
          textAlignVertical={props.textAlignVertical ?? (props.multiline ? "top" : "center")}
          placeholderTextColor={props.placeholderTextColor ?? colors.mutedForeground}
          className={cn(
            "font-sans min-w-0 flex-1 px-3 text-[1rem] text-foreground",
            props.multiline ? "min-h-12 py-3" : "h-12 py-0",
            className,
          )}
          style={[
            // Android font padding and a forced lineHeight shift the visible baseline.
            { includeFontPadding: false, ...(props.multiline ? {} : { paddingVertical: 0 }) },
            style,
          ]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {right ? <View className="pr-3">{right}</View> : null}
      </View>
      {typeof error === "string" && error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="text-sm text-destructive"
        >
          {error}
        </Text>
      ) : hint ? (
        <Text className="text-sm text-muted-foreground">{hint}</Text>
      ) : null}
    </View>
  );
}
export { Input };
