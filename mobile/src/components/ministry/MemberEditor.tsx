import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import DefaultButton from "../button/DefaultButton";
import {
  addUserToMinistry,
  getManageableMinistries,
  removeUserFromMinistry,
  saveMinistryMemberCapabilities,
  updateMinistryMemberLeaderStatus,
  type MinistryMemberWithCapabilities,
  type SearchableUser,
} from "../../services/ministryService";
import type { MinistryRoleOption } from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import { useMinistryStore } from "../../stores/useMinistryStore";

type Props = {
  member: MinistryMemberWithCapabilities | null;
  user: SearchableUser | null;
  ministryId: string;
  roles: MinistryRoleOption[];
  disabled: boolean;
  scopeError: string | null;
  canOperate: () => boolean;
  onReload: () => Promise<MinistryMemberWithCapabilities[] | null>;
  onClose: () => void;
  onBusyChange: (busy: boolean) => void;
};

export default function MemberEditor({
  member,
  user,
  ministryId,
  roles,
  disabled,
  scopeError,
  canOperate,
  onReload,
  onClose,
  onBusyChange,
}: Props) {
  const { session, profile, sessionRevision } = useAuthStore();
  const { fetchUserMinistries } = useMinistryStore();
  const userId = session?.user.id;
  const isAdmin = profile?.role === "admin";
  const [selectedMember, setSelectedMember] = useState(member);
  const [selectedUser, setSelectedUser] = useState(user);
  const [selectedRoleIds, setSelectedRoleIds] = useState(
    member?.capability_role_ids ?? [],
  );
  const [isLeader, setIsLeader] = useState(member?.is_leader ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const busy = useRef(false);
  const focused = useRef(false);
  const focusRevision = useRef(0);
  const isCurrentSession = useCallback(
    () =>
      focused.current &&
      useAuthStore.getState().sessionRevision === sessionRevision,
    [sessionRevision],
  );
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      focusRevision.current++;
      return () => {
        focused.current = false;
        focusRevision.current++;
      };
    }, [userId, isAdmin, sessionRevision]),
  );
  const closeEditor = () => {
    if (!busy.current) onClose();
  };

  const reconcileEditor = (
    people: MinistryMemberWithCapabilities[] | null,
    targetUserId: string,
  ) => {
    if (!people) return;
    const persisted = people.find((member) => member.user_id === targetUserId);
    if (persisted) {
      setSelectedMember(persisted);
      setSelectedUser(null);
      setSelectedRoleIds(persisted.capability_role_ids);
      setIsLeader(persisted.is_leader);
    }
  };

  const handleSaveMember = async () => {
    if (
      !isCurrentSession() ||
      !canOperate() ||
      busy.current ||
      disabled ||
      (!selectedUser && !selectedMember)
    )
      return;
    const targetUserId = selectedUser?.id ?? selectedMember!.user_id;
    const visit = focusRevision.current;
    const currentVisit = () =>
      isCurrentSession() && visit === focusRevision.current;
    busy.current = true;
    setIsSaving(true);
    onBusyChange(true);
    setEditorError(null);
    let written = false;
    try {
      // Revalidate the management scope before the first write. RLS still protects every operation.
      const scope = await getManageableMinistries({ userId: userId!, isAdmin });
      if (!currentVisit()) return;
      if (
        scope.error ||
        !scope.data?.some((ministry) => ministry.id === ministryId)
      ) {
        await onReload();
        throw new Error("Escopo de gestão indisponível.");
      }
      let memberId = selectedMember?.id ?? null;
      if (selectedUser) {
        const added = await addUserToMinistry({
          ministryId,
          userId: targetUserId,
          isLeader,
        });
        if (added.error || !added.data)
          throw new Error(
            added.error ??
              "Nao foi possivel adicionar o usuario ao ministerio.",
          );
        memberId = added.data.id;
      } else {
        const leader = await updateMinistryMemberLeaderStatus(
          memberId!,
          isLeader,
        );
        if (leader.error) throw new Error(leader.error);
      }
      written = true;
      if (!currentVisit()) return;
      const capabilities = await saveMinistryMemberCapabilities(
        memberId!,
        selectedRoleIds,
      );
      if (capabilities.error) throw new Error(capabilities.error);
      if (!currentVisit()) return;
      const people = await onReload();
      await fetchUserMinistries(true);
      if (!currentVisit()) return;
      if (!people && canOperate()) {
        setEditorError(
          "Alterações salvas, mas não foi possível reler o integrante. Tente atualizar antes de editar novamente.",
        );
        return;
      }
      onClose();
      Alert.alert(
        "Sucesso",
        selectedUser
          ? "Usuario adicionado ao ministerio."
          : "Membro atualizado com sucesso.",
      );
    } catch {
      if (!currentVisit()) return;
      const people = await onReload();
      await fetchUserMinistries(true);
      if (!currentVisit()) return;
      reconcileEditor(people, targetUserId);
      setEditorError(
        "Algumas alterações podem ter sido gravadas. Confira o estado relido antes de tentar novamente.",
      );
      Alert.alert(
        "Nao foi possivel salvar o membro",
        "Algumas alterações podem ter sido gravadas. Confira o estado relido antes de tentar novamente.",
      );
    } finally {
      busy.current = false;
      onBusyChange(false);
      if (isCurrentSession()) setIsSaving(false);
      if (written && isCurrentSession() && visit !== focusRevision.current) {
        const people = await onReload();
        await fetchUserMinistries(true);
        if (isCurrentSession()) {
          reconcileEditor(people, targetUserId);
          setEditorError(
            "Algumas alterações podem ter sido gravadas. Confira o estado relido antes de tentar novamente.",
          );
        }
      }
    }
  };

  const handleRemoveMember = () => {
    if (!selectedMember || !isCurrentSession() || !canOperate() || busy.current)
      return;
    const member = selectedMember;
    const visit = focusRevision.current;
    Alert.alert(
      "Remover do ministerio",
      "Deseja remover este membro do ministerio? Suas atribuições futuras neste ministério serão removidas e o histórico será preservado.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            if (
              !isCurrentSession() ||
              !canOperate() ||
              busy.current ||
              ministryId !== member.ministry_id ||
              visit !== focusRevision.current
            )
              return;
            busy.current = true;
            setIsSaving(true);
            onBusyChange(true);
            try {
              const result = await removeUserFromMinistry(member.id);
              if (!isCurrentSession()) return;
              if (result.error) {
                if (visit === focusRevision.current) {
                  Alert.alert(
                    "Nao foi possivel remover o membro",
                    "Tente novamente em alguns instantes.",
                  );
                }
                return;
              }
              await onReload();
              await fetchUserMinistries(true);
              if (!isCurrentSession()) return;
              onClose();
              if (visit === focusRevision.current)
                Alert.alert("Sucesso", "Membro removido do ministerio.");
            } finally {
              busy.current = false;
              onBusyChange(false);
              if (isCurrentSession()) setIsSaving(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(17,24,39,0.45)",
        justifyContent: "flex-end",
      }}
    >
      <SafeAreaView
        edges={["bottom"]}
        style={{
          backgroundColor: "#fff",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 20,
          maxHeight: "88%",
        }}
      >
        <ScrollView>
          <Text style={{ fontWeight: "700", fontSize: 20, marginBottom: 12 }}>
            {selectedUser
              ? `Adicionar ${selectedUser.full_name}`
              : selectedMember?.full_name}
          </Text>
          {editorError || scopeError ? (
            <Text style={{ color: "#991b1b", marginBottom: 12 }}>
              {editorError ?? scopeError}
            </Text>
          ) : null}
          <TouchableOpacity
            disabled={isSaving || disabled}
            onPress={() => setIsLeader((value) => !value)}
            style={{ paddingVertical: 16 }}
          >
            <Text>
              {isLeader
                ? "Este usuário será líder deste ministério"
                : "Marcar como líder deste ministério"}
            </Text>
          </TouchableOpacity>
          <Text style={{ fontWeight: "700", marginBottom: 10 }}>Funções</Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 18,
            }}
          >
            {roles.map((role) => (
              <TouchableOpacity
                key={role.id}
                disabled={isSaving || disabled}
                onPress={() =>
                  setSelectedRoleIds((current) =>
                    current.includes(role.id)
                      ? current.filter((id) => id !== role.id)
                      : [...current, role.id],
                  )
                }
                style={{
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: selectedRoleIds.includes(role.id)
                    ? "#111827"
                    : "#f3f4f6",
                }}
              >
                <Text
                  style={{
                    color: selectedRoleIds.includes(role.id)
                      ? "#fff"
                      : "#111827",
                  }}
                >
                  {role.name}
                </Text>
              </TouchableOpacity>
            ))}
            {roles.length === 0 ? (
              <Text>Nenhuma função cadastrada neste ministério.</Text>
            ) : null}
          </View>
          {selectedMember ? (
            <DefaultButton
              variant="destructive"
              disabled={!canOperate() || isSaving || disabled}
              onPress={handleRemoveMember}
            >
              Remover do ministério
            </DefaultButton>
          ) : null}
          <View style={{ marginTop: 12 }}>
            <DefaultButton
              disabled={!canOperate() || disabled}
              isLoading={isSaving}
              onPress={handleSaveMember}
            >
              {selectedUser ? "Adicionar ao ministério" : "Salvar alterações"}
            </DefaultButton>
          </View>
          <TouchableOpacity
            disabled={isSaving}
            onPress={closeEditor}
            style={{ paddingVertical: 16 }}
          >
            <Text style={{ textAlign: "center" }}>Fechar</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
