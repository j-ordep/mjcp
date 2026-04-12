import { X } from "lucide-react-native";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Text, TextInput } from "react-native-paper";
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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(15,23,42,0.45)",
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 24,
            }}
          >
            <Pressable
              onPress={onClose}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              }}
            />

            <View
              style={{
                width: "100%",
                maxWidth: 440,
                maxHeight: "86%",
                backgroundColor: "#fff",
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  paddingHorizontal: 18,
                  paddingTop: 16,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#eef2f7",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontWeight: "700", fontSize: 20, marginBottom: 4 }}>
                    Adicionar membro
                  </Text>
                  <Text style={{ color: "#6b7280" }}>
                    Escolha a pessoa do ministerio e a funcao que ela vai cumprir nesta escala.
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
                  }}
                >
                  <X size={18} color="#111827" />
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 18,
                  paddingTop: 16,
                  paddingBottom: 16,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: 18,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 6 }}>
                    Escala ativa
                  </Text>
                  <Text style={{ color: "#111827", fontWeight: "700", fontSize: 16, marginBottom: 4 }}>
                    {eventTitle ?? "Evento selecionado"}
                  </Text>
                  <Text style={{ color: "#6b7280" }}>
                    {ministryName ?? "Ministerio selecionado"}
                  </Text>
                </View>

                <TextInput
                  placeholder="Buscar membro..."
                  value={memberSearch}
                  onChangeText={onSearchChange}
                  mode="outlined"
                  style={{ marginBottom: 16, backgroundColor: "#fff" }}
                  activeOutlineColor="#111827"
                  outlineColor="#d1d5db"
                  returnKeyType="search"
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
                              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>
                                Ativo
                              </Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>

                <Text style={{ fontWeight: "700", marginBottom: 10 }}>Funcoes</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
                  {roles.length === 0 ? (
                    <Text style={{ color: "#888" }}>Nenhuma funcao no ministerio.</Text>
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

                <View
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: 18,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                  }}
                >
                  <Text style={{ fontWeight: "700", marginBottom: 6 }}>Selecionado</Text>
                  <Text style={{ color: "#111827", fontWeight: "600", marginBottom: 4 }}>
                    {selectedMemberName ?? "Escolha um membro"}
                  </Text>
                  <Text style={{ color: "#6b7280" }}>
                    {selectedRoleName ?? "Escolha uma funcao"}
                  </Text>
                </View>
              </ScrollView>

              <View
                style={{
                  paddingHorizontal: 18,
                  paddingTop: 12,
                  paddingBottom: 16,
                  borderTopWidth: 1,
                  borderTopColor: "#eef2f7",
                  backgroundColor: "#fff",
                }}
              >
                <DefaultButton
                  onPress={() => {
                    Keyboard.dismiss();
                    onSubmit();
                  }}
                  isLoading={isSaving}
                  disabled={!selectedMemberId || !selectedRoleId}
                >
                  Adicionar na escala
                </DefaultButton>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
