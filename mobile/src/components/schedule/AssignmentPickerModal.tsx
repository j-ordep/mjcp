import { CircleAlert, X } from "lucide-react-native";
import { Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import DefaultButton from "../button/DefaultButton";
import type { MinistryMemberOption, MinistryRoleOption } from "../../services/scheduleService";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

interface AssignmentPickerModalProps {
  visible: boolean;
  eventTitle?: string | null;
  ministryName?: string | null;
  memberSearch: string;
  filteredMembers: MinistryMemberOption[];
  roles: MinistryRoleOption[];
  selectedMemberId: string | null;
  selectedRoleId: string | null;
  selectedMemberName?: string | null;
  selectedRoleName?: string | null;
  selectedMemberCapabilityRoleIds: string[];
  isSaving: boolean;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onSelectMember: (memberId: string) => void;
  onSelectRole: (roleId: string) => void;
  onSubmit: () => void;
}

export default function AssignmentPickerModal({
  visible,
  eventTitle,
  ministryName,
  memberSearch,
  filteredMembers,
  roles,
  selectedMemberId,
  selectedRoleId,
  selectedMemberName,
  selectedRoleName,
  selectedMemberCapabilityRoleIds,
  isSaving,
  onClose,
  onSearchChange,
  onSelectMember,
  onSelectRole,
  onSubmit,
}: AssignmentPickerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(17,24,39,0.45)" }}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: "92%",
              minHeight: "70%",
            }}
          >
            <View style={{ alignItems: "center", paddingTop: 10, marginBottom: 12 }}>
              <View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb" }} />
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                marginBottom: 12,
              }}
            >
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ fontWeight: "700", fontSize: 20, marginBottom: 2 }}>
                  Adicionar membro
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#f3f4f6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 4,
                }}
              >
                <X size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {/* <View
                style={{
                  backgroundColor: "#111827",
                  borderRadius: 18,
                  padding: 14,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.64)", fontSize: 12, marginBottom: 6 }}>
                  Escala ativa
                </Text>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16, marginBottom: 4 }}>
                  {eventTitle ?? "Evento selecionado"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.76)" }}>
                  {ministryName ?? "Ministerio selecionado"}
                </Text>
              </View> */}

              <TextInput
                placeholder="Buscar membro..."
                value={memberSearch}
                onChangeText={onSearchChange}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: "#fff" }}
                activeOutlineColor="#111827"
                outlineColor="#d1d5db"
              />

              <Text style={{ fontWeight: "700", marginBottom: 10 }}>Membros do ministerio</Text>
              <View style={{ marginBottom: 18 }}>
                {filteredMembers.length === 0 ? (
                  <Text style={{ color: "#888" }}>Nenhum membro encontrado.</Text>
                ) : (
                  filteredMembers.map((member) => {
                    const selected = selectedMemberId === member.user_id;
                    return (
                      <TouchableOpacity
                        key={member.user_id}
                        onPress={() => onSelectMember(member.user_id)}
                        activeOpacity={0.85}
                        style={{
                          borderWidth: 1.5,
                          borderColor: selected ? "#111827" : "#e5e7eb",
                          borderRadius: 16,
                          padding: 12,
                          marginBottom: 10,
                          backgroundColor: selected ? "#f9fafb" : "#fff",
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor: "#111827",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <Text style={{ color: "#fff", fontWeight: "700" }}>
                            {getInitials(member.full_name)}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "700" }}>{member.full_name}</Text>
                          <Text style={{ color: "#6b7280", fontSize: 13 }}>Toque para selecionar</Text>
                        </View>
                        {selected ? (
                          <View
                            style={{
                              backgroundColor: "#111827",
                              borderRadius: 999,
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                            }}
                          >
                            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>Ativo</Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              <Text style={{ fontWeight: "700", marginBottom: 10 }}>Funções</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
                {roles.length === 0 ? (
                  <Text style={{ color: "#888" }}>Nenhuma função no ministerio.</Text>
                ) : (
                  roles.map((role) => {
                    const selected = selectedRoleId === role.id;
                    const enabled =
                      !selectedMemberId || selectedMemberCapabilityRoleIds.includes(role.id);
                    return (
                      <TouchableOpacity
                        key={role.id}
                        onPress={() => enabled && onSelectRole(role.id)}
                        activeOpacity={enabled ? 0.85 : 1}
                        style={{
                          backgroundColor: selected ? "#111827" : enabled ? "#f3f4f6" : "#e5e7eb",
                          borderRadius: 999,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          opacity: enabled ? 1 : 0.65,
                        }}
                      >
                        <Text style={{ color: selected ? "#fff" : "#111827", fontWeight: "600" }}>
                          {role.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

            </ScrollView>

            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 14,
                paddingBottom: 18,
                borderTopWidth: 1,
                borderTopColor: "#eef2f7",
              }}
            >
              {/* <View
                style={{
                  backgroundColor: "#111827",
                  borderRadius: 18,
                  padding: 14,
                  marginBottom: 14,
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.64)", fontSize: 12, marginBottom: 6 }}>
                  Selecionado
                </Text>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 4 }}>
                  {selectedMemberName ?? "Escolha um membro"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.76)" }}>
                  {selectedRoleName ?? "Escolha uma funcao"}
                </Text>
              </View> */}

              <DefaultButton onPress={onSubmit} isLoading={isSaving}>
                Adicionar na escala
              </DefaultButton>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}


