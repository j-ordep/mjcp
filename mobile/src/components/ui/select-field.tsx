import { View, type StyleProp, type ViewStyle } from "react-native";
import { Text } from "./text";
import { Label } from "./label";
import type { Ref } from "react";
import type { TriggerRef } from "@rn-primitives/select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export interface SelectFieldProps {
  label: string;
  value: string | null;
  options: readonly { value: string; label: string; disabled?: boolean }[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  portalHost?: string;
  sideOffset?: number;
  triggerRef?: Ref<TriggerRef>;
  onOpenChange?: (open: boolean) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export function SelectField({
  label,
  value,
  options,
  onValueChange,
  placeholder = "Selecione",
  disabled,
  error,
  portalHost,
  sideOffset,
  triggerRef,
  onOpenChange,
  containerStyle,
}: SelectFieldProps) {
  const selected = options.find((option) => option.value === value);
  return (
    <View style={containerStyle} className="gap-2">
      <Label>{label}</Label>
      <Select
        value={selected ?? { value: "", label: placeholder }}
        disabled={disabled}
        onOpenChange={onOpenChange}
        onValueChange={(option) => {
          if (
            option &&
            !disabled &&
            options.some(
              (item) => item.value === option.value && !item.disabled,
            )
          ) {
            onValueChange(option.value);
          }
        }}
      >
        <SelectTrigger
          ref={triggerRef}
          disabled={disabled}
          accessibilityLabel={label}
          className="h-auto min-h-12 w-full rounded-xl"
        >
          <SelectValue
            numberOfLines={1}
            ellipsizeMode="tail"
            placeholder={placeholder}
            className={
              selected ? "min-w-0 flex-1 text-base" : "min-w-0 flex-1 text-base text-muted-foreground"
            }
          />
        </SelectTrigger>
        <SelectContent
          portalHost={portalHost}
          sideOffset={sideOffset}
          className="max-h-80"
        >
          {options.map((option) => (
            <SelectItem key={option.value} {...option} />
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="text-sm text-destructive"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
