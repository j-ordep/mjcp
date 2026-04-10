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
import type { SwapCandidateOption } from "../../services/scheduleService";

export interface SwapAssignmentOption {
  id: string;
  role_name: string;
}

interface RequestSwapModalProps {
  visible: boolean;
  title?: string;
  assignments: SwapAssignmentOption[];
  candidates?: SwapCandidateOption[];
  selectedAssignmentId: string | null;
  reason: string;
  isSaving: boolean;
  onClose: () => void;
  onSelectAssignment: (assignmentId: string) => void;
  onChangeReason: (value: string) => void;
  onSubmit: () => void;
}

export default function RequestSwapModal({
  visible,
  title,
  assignments,
  candidates = [],
  selectedAssignmentId,
  reason,
  isSaving,
  onClose,
  onSelectAssignment,
  onChangeReason,
  onSubmit,
}: RequestSwapModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
                    Solicitar troca
                  </Text>
                  <Text style={{ color: "#6b7280" }}>
                    {title ?? "Escolha a funcao e registre o motivo da troca."}
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
                <Text style={{ fontWeight: "700", marginBottom: 10 }}>
                  Minha funcao nesta escala
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                  {assignments.map((assignment) => {
                    const selected = selectedAssignmentId === assignment.id;
                    return (
                      <TouchableOpacity
                        key={assignment.id}
                        onPress={() => onSelectAssignment(assignment.id)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 999,
                          backgroundColor: selected ? "#111827" : "#f3f4f6",
                        }}
                      >
                        <Text style={{ color: selected ? "#fff" : "#111827", fontWeight: "600" }}>
                          {assignment.role_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

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
                  <Text style={{ fontWeight: "700", marginBottom: 6 }}>
                    Pessoas elegiveis para receber a solicitacao
                  </Text>
                  <Text style={{ color: "#6b7280", marginBottom: candidates.length > 0 ? 10 : 0 }}>
                    Mesmo ministerio e mesma funcao/capability.
                  </Text>

                  {candidates.length === 0 ? (
                    <Text style={{ color: "#6b7280" }}>
                      Nenhuma pessoa elegivel encontrada no momento.
                    </Text>
                  ) : (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {candidates.map((candidate) => (
                        <View
                          key={candidate.user_id}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 999,
                            backgroundColor: "#fff",
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                          }}
                        >
                          <Text style={{ color: "#111827", fontWeight: "600" }}>
                            {candidate.full_name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <TextInput
                  mode="outlined"
                  label="Motivo da troca (opcional)"
                  value={reason}
                  onChangeText={onChangeReason}
                  multiline
                  numberOfLines={4}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  blurOnSubmit
                  style={{ backgroundColor: "#fff" }}
                  activeOutlineColor="#111827"
                  outlineColor="#d1d5db"
                />
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
                  disabled={!selectedAssignmentId}
                >
                  Enviar solicitacao
                </DefaultButton>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
