import { X } from "lucide-react-native";
import {
  Alert,
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
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  getMinistryMembersOptions,
  getMinistryRolesOptions,
  getAssignmentWarningsForSchedule,
  upsertScheduleAssignmentValidated,
  type MinistryMemberOption,
  type MinistryRoleOption,
  type ScheduleDetails,
} from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import {
  buildAssignmentWarningsMessage,
  isEventDateEditable,
} from "../../utils/scheduleRules";

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
  details: ScheduleDetails;
  assignedMemberIds: string[];
  onClose: () => void;
  onChanged: () => Promise<void>;
  canManage: () => boolean;
}

export default function AssignmentPickerModal({
  visible,
  details,
  assignedMemberIds,
  onClose,
  onChanged,
  canManage,
}: AssignmentPickerModalProps) {
  const { sessionRevision } = useAuthStore();
  const [members, setMembers] = useState<MinistryMemberOption[]>([]);
  const [roles, setRoles] = useState<MinistryRoleOption[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const revision = useRef(0);
  const focused = useRef(false);
  const eventTitle = details.event.title;
  const ministryName = details.ministry.name;
  const hasCurrentManagementPermission = canManage;
  const captureVisit = () => {
    const visit = revision.current;
    return () =>
      focused.current &&
      visit === revision.current &&
      sessionRevision === useAuthStore.getState().sessionRevision;
  };

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      const request = ++revision.current;
      setIsSaving(false);
      if (visible && hasCurrentManagementPermission()) {
        setIsLoadingOptions(true);
        setLoadError(null);
        void Promise.all([
          getMinistryMembersOptions(details.ministry_id),
          getMinistryRolesOptions(details.ministry_id),
        ]).then(([people, functions]) => {
          if (
            !focused.current ||
            request !== revision.current ||
            sessionRevision !== useAuthStore.getState().sessionRevision
          )
            return;
          setIsLoadingOptions(false);
          if (people.error || functions.error) {
            setMembers([]);
            setRoles([]);
            setLoadError(people.error ?? functions.error);
            return;
          }
          setMembers(people.data ?? []);
          setRoles(functions.data ?? []);
        });
      }
      return () => {
        focused.current = false;
        ++revision.current;
      };
    }, [visible, details.ministry_id, sessionRevision]),
  );

  const selectedMember = members.find(
    (member) => member.user_id === selectedMemberId,
  );
  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const selectedMemberName = selectedMember?.full_name;
  const selectedRoleName = selectedRole?.name;
  const selectedMemberCapabilityRoleIds =
    selectedMember?.capability_role_ids ?? [];
  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    return members.filter(
      (member) => !query || member.full_name.toLowerCase().includes(query),
    );
  }, [members, memberSearch]);
  const onSearchChange = setMemberSearch;
  const onSelectMember = setSelectedMemberId;
  const onSelectRole = setSelectedRoleId;
  const discardObsoleteWrite = async (
    current: () => boolean,
    error: string | null,
  ) => {
    if (current()) return false;
    if (!error && sessionRevision === useAuthStore.getState().sessionRevision)
      await onChanged();
    return true;
  };

  const handleAddAssignment = async () => {
    if (isSaving || isLoadingOptions || loadError) return;
    if (!hasCurrentManagementPermission()) {
      Alert.alert(
        "Sem permissao",
        "Somente admin ou lider deste ministerio pode editar a equipe.",
      );
      return;
    }

    if (details && !isEventDateEditable(details.event.start_at)) {
      Alert.alert(
        "Escala somente leitura",
        "Nao e mais possivel alterar a equipe no horario do evento ou depois dele.",
      );
      return;
    }

    if (!details || !selectedMemberId || !selectedRoleId) {
      Alert.alert(
        "Campos obrigatorios",
        "Selecione membro e funcao para adicionar.",
      );
      return;
    }

    if (
      selectedMember &&
      !selectedMember.capability_role_ids.includes(selectedRoleId)
    ) {
      Alert.alert(
        "Capability obrigatoria",
        "O usuario nao possui capability para a funcao selecionada.",
      );
      return;
    }

    const current = captureVisit();
    if (!current()) return;
    const warningsResult = await getAssignmentWarningsForSchedule({
      scheduleId: details.id,
      userId: selectedMemberId,
    });

    if (!current()) return;
    if (warningsResult.error) {
      Alert.alert(
        "Nao foi possivel validar avisos",
        "Tente novamente em alguns instantes.",
      );
      return;
    }

    const warnings = warningsResult.data ?? [];

    const doInsert = async () => {
      if (!current() || !hasCurrentManagementPermission()) return;
      if (!isEventDateEditable(details.event.start_at)) {
        Alert.alert("Escala somente leitura", "O evento já começou.");
        return;
      }
      setIsSaving(true);
      const { error } = await upsertScheduleAssignmentValidated({
        scheduleId: details.id,
        userId: selectedMemberId,
        roleId: selectedRoleId,
        status: "pending",
      });
      if (await discardObsoleteWrite(current, error)) return;
      setIsSaving(false);

      if (error) {
        Alert.alert(
          "Nao foi possivel adicionar na escala",
          "O membro nao foi adicionado. Tente novamente em alguns instantes.",
        );
        return;
      }

      await onChanged();
      setSelectedMemberId(null);
      setSelectedRoleId(null);
      setMemberSearch("");
      onClose();
    };

    if (warnings.length > 0) {
      Alert.alert(
        "Aviso",
        `${buildAssignmentWarningsMessage(warnings)}\n\nDeseja escalar mesmo assim?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Escalar mesmo assim", onPress: () => void doInsert() },
        ],
      );
      return;
    }

    await doInsert();
  };

  const onSubmit = handleAddAssignment;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
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
                  <Text
                    style={{ fontWeight: "700", fontSize: 20, marginBottom: 4 }}
                  >
                    Adicionar membro
                  </Text>
                  <Text style={{ color: "#6b7280" }}>
                    Escolha a pessoa do ministerio e a funcao que ela vai
                    cumprir nesta escala.
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
                keyboardDismissMode={
                  Platform.OS === "ios" ? "interactive" : "on-drag"
                }
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
                  <Text
                    style={{ color: "#6b7280", fontSize: 12, marginBottom: 6 }}
                  >
                    Escala ativa
                  </Text>
                  <Text
                    style={{
                      color: "#111827",
                      fontWeight: "700",
                      fontSize: 16,
                      marginBottom: 4,
                    }}
                  >
                    {eventTitle ?? "Evento selecionado"}
                  </Text>
                  <Text style={{ color: "#6b7280" }}>
                    {ministryName ?? "Ministerio selecionado"}
                  </Text>
                </View>

                {isLoadingOptions ? (
                  <Text>Carregando membros e funções...</Text>
                ) : null}
                {loadError ? (
                  <Text style={{ color: "#991b1b", marginBottom: 12 }}>
                    {loadError}
                  </Text>
                ) : null}
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

                <Text style={{ fontWeight: "700", marginBottom: 10 }}>
                  Membros do ministerio
                </Text>
                <View style={{ marginBottom: 18 }}>
                  {filteredMembers.length === 0 ? (
                    <Text style={{ color: "#888" }}>
                      Nenhum membro encontrado.
                    </Text>
                  ) : (
                    filteredMembers.map((member) => {
                      const selected = selectedMemberId === member.user_id;
                      const isAlreadyAssigned = assignedMemberIds.includes(
                        member.user_id,
                      );
                      return (
                        <TouchableOpacity
                          key={member.user_id}
                          onPress={() => {
                            if (isAlreadyAssigned) return;
                            onSelectMember(member.user_id);
                          }}
                          activeOpacity={isAlreadyAssigned ? 1 : 0.85}
                          disabled={isAlreadyAssigned}
                          style={{
                            borderWidth: 1.5,
                            borderColor: selected
                              ? "#111827"
                              : isAlreadyAssigned
                                ? "#d1d5db"
                                : "#e5e7eb",
                            borderRadius: 16,
                            padding: 12,
                            marginBottom: 10,
                            backgroundColor: selected
                              ? "#f9fafb"
                              : isAlreadyAssigned
                                ? "#f3f4f6"
                                : "#fff",
                            flexDirection: "row",
                            alignItems: "center",
                            opacity: isAlreadyAssigned ? 0.55 : 1,
                          }}
                        >
                          <View
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 21,
                              backgroundColor: isAlreadyAssigned
                                ? "#9ca3af"
                                : "#111827",
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
                            <Text style={{ fontWeight: "700" }}>
                              {member.full_name}
                            </Text>
                            <Text style={{ color: "#6b7280", fontSize: 13 }}>
                              Toque para selecionar
                            </Text>
                          </View>
                          {isAlreadyAssigned ? (
                            <View
                              style={{
                                backgroundColor: "#e5e7eb",
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#374151",
                                  fontWeight: "600",
                                  fontSize: 12,
                                }}
                              >
                                Ja escalado
                              </Text>
                            </View>
                          ) : selected ? (
                            <View
                              style={{
                                backgroundColor: "#111827",
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#fff",
                                  fontWeight: "600",
                                  fontSize: 12,
                                }}
                              >
                                Ativo
                              </Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>

                <Text style={{ fontWeight: "700", marginBottom: 10 }}>
                  Funcoes
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 10,
                    marginBottom: 18,
                  }}
                >
                  {roles.length === 0 ? (
                    <Text style={{ color: "#888" }}>
                      Nenhuma funcao no ministerio.
                    </Text>
                  ) : (
                    roles.map((role) => {
                      const selected = selectedRoleId === role.id;
                      const enabled =
                        !selectedMemberId ||
                        selectedMemberCapabilityRoleIds.includes(role.id);

                      return (
                        <TouchableOpacity
                          key={role.id}
                          onPress={() => enabled && onSelectRole(role.id)}
                          activeOpacity={enabled ? 0.85 : 1}
                          style={{
                            backgroundColor: selected
                              ? "#111827"
                              : enabled
                                ? "#f3f4f6"
                                : "#e5e7eb",
                            borderRadius: 999,
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            opacity: enabled ? 1 : 0.65,
                          }}
                        >
                          <Text
                            style={{
                              color: selected ? "#fff" : "#111827",
                              fontWeight: "600",
                            }}
                          >
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
                  <Text style={{ fontWeight: "700", marginBottom: 6 }}>
                    Selecionado
                  </Text>
                  <Text
                    style={{
                      color: "#111827",
                      fontWeight: "600",
                      marginBottom: 4,
                    }}
                  >
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
                  disabled={
                    isLoadingOptions ||
                    !!loadError ||
                    !selectedMemberId ||
                    !selectedRoleId
                  }
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
