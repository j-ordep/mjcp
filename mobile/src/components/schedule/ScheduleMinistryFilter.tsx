import { Text } from "../ui/text";
import { Check, SlidersHorizontal, X } from "lucide-react-native";
import { useState } from "react";
import { Keyboard, Modal, Pressable, ScrollView, TouchableOpacity, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import type { Ministry } from "../../types/models";

interface ScheduleMinistryFilterProps {
  ministries: Pick<Ministry, "id" | "name">[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function ScheduleMinistryFilter({
  ministries,
  selectedId,
  onSelect,
}: ScheduleMinistryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = ministries.find((ministry) => ministry.id === selectedId);
  const label = selected ? `Ministério: ${selected.name}` : "Filtrar ministério";

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: isOpen }}
        onPress={() => { Keyboard.dismiss(); setIsOpen(true); }}
        style={{
          flexShrink: 1, maxWidth: "100%", flexDirection: "row", alignItems: "center",
          gap: 6, padding: 10, borderRadius: 12, borderWidth: 1,
          borderColor: selected ? "#111827" : "#d1d5db", backgroundColor: "#fff",
        }}
      >
        <SlidersHorizontal size={17} color="#111827" />
        <Text numberOfLines={1} style={{ flexShrink: 1, color: "#111827", fontWeight: selected ? "600" : "400" }}>{label}</Text>
      </TouchableOpacity>
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.45)" }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar filtros"
            onPress={() => setIsOpen(false)}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <SafeAreaView
            edges={["bottom"]}
            accessibilityViewIsModal
            style={{
              maxHeight: "70%", backgroundColor: "#fff",
              borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16,
            }}
          >
            <View style={{ paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ flex: 1, fontSize: 20, fontWeight: "700", color: "#111827" }}>Filtrar ministério</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fechar filtros"
                onPress={() => setIsOpen(false)}
                style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "#f3f4f6" }}
              >
                <X size={20} color="#111827" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}>
              {[{ id: null, name: "Todos os ministérios" }, ...ministries].map((ministry) => {
                const isSelected = selectedId === ministry.id;
                return (
                  <TouchableOpacity
                    key={ministry.id ?? "all"}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={ministry.name}
                    onPress={() => { onSelect(ministry.id); setIsOpen(false); }}
                    style={{
                      minHeight: 52, padding: 14, borderRadius: 12,
                      backgroundColor: isSelected ? "#f3f4f6" : "#fff",
                      flexDirection: "row", alignItems: "center", gap: 12,
                    }}
                  >
                    <Text style={{ flex: 1, fontSize: 16, color: "#111827", fontWeight: isSelected ? "600" : "400" }}>{ministry.name}</Text>
                    {isSelected ? <Check size={20} color="#111827" /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}
