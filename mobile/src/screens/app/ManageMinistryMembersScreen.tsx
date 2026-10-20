import { Text } from "../../components/ui/text";
import { SelectField } from "../../components/ui/select-field";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MemberEditor from "../../components/ministry/MemberEditor";
import MemberSearch from "../../components/ministry/MemberSearch";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import type { RootStackParamList } from "../../types/navigation";
import {
  getManageableMinistries,
  getMinistryMembersDetailed,
  type MinistryMemberWithCapabilities,
  type SearchableUser,
} from "../../services/ministryService";
import {
  getMinistryRolesOptions,
  type MinistryRoleOption,
} from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import type { Ministry } from "../../types/models";
import { getProfileInitials } from "../../utils/profileAvatar";

type TeamRoute = {
  key: string;
  name: "ManageMinistryMembers" | "ManageMembers";
  params?: RootStackParamList["ManageMinistryMembers"];
};

export default function ManageMinistryMembersScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<TeamRoute>();
  const { session, profile, sessionRevision } = useAuthStore();
  const userId = session?.user.id;
  const isAdmin = profile?.role === "admin";
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(
    null,
  );
  const [members, setMembers] = useState<MinistryMemberWithCapabilities[]>([]);
  const [roles, setRoles] = useState<MinistryRoleOption[]>([]);
  const [isLoadingMinistries, setIsLoadingMinistries] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editor, setEditor] = useState<{
    member: MinistryMemberWithCapabilities | null;
    user: SearchableUser | null;
  } | null>(null);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const focused = useRef(false);
  const scopeRevision = useRef(0);
  const memberRevision = useRef(0);
  const selectedId = useRef<string | null>(null);
  const manageableIds = useRef<string[]>([]);
  const busy = useRef(false);
  const isCurrentSession = useCallback(
    () =>
      focused.current &&
      useAuthStore.getState().sessionRevision === sessionRevision,
    [sessionRevision],
  );
  const canOperate = () =>
    isCurrentSession() &&
    !!selectedId.current &&
    manageableIds.current.includes(selectedId.current);

  useEffect(() => {
    busy.current = false;
    setIsSaving(false);
    setEditor(null);
  }, [sessionRevision]);

  const loadMinistryData = useCallback(
    async (ministryId: string) => {
      if (!isCurrentSession() || !manageableIds.current.includes(ministryId))
        return null;
      const request = ++memberRevision.current;
      setIsLoadingMembers(true);
      setMemberError(null);
      const [people, functions] = await Promise.all([
        getMinistryMembersDetailed(ministryId),
        getMinistryRolesOptions(ministryId),
      ]);
      if (
        !isCurrentSession() ||
        request !== memberRevision.current ||
        selectedId.current !== ministryId
      )
        return null;
      setIsLoadingMembers(false);
      if (people.error || functions.error) {
        setMemberError(
          "Nao foi possivel carregar os membros. Tente novamente em alguns instantes.",
        );
        return null;
      }
      setMembers(people.data ?? []);
      setRoles(functions.data ?? []);
      return people.data ?? [];
    },
    [isCurrentSession],
  );

  const loadScope = useCallback(async () => {
    if (!isCurrentSession()) return null;
    const request = ++scopeRevision.current;
    memberRevision.current++;
    manageableIds.current = [];
    setIsLoadingMinistries(true);
    setScopeError(null);
    setMembers([]);
    setRoles([]);
    if (!userId) {
      setIsLoadingMinistries(false);
      return null;
    }
    const result = await getManageableMinistries({ userId, isAdmin });
    if (!isCurrentSession() || request !== scopeRevision.current) return null;
    setIsLoadingMinistries(false);
    if (result.error) {
      setMinistries([]);
      setScopeError(
        "Nao foi possivel carregar ministerios. Tente novamente em alguns instantes.",
      );
      setIsLoadingMembers(false);
      return null;
    }
    const next = result.data ?? [];
    manageableIds.current = next.map((ministry) => ministry.id);
    setMinistries(next);
    const candidate =
      selectedId.current ?? route.params?.ministryId ?? next[0]?.id ?? null;
    const ministryId =
      candidate && manageableIds.current.includes(candidate) ? candidate : null;
    if (candidate && !ministryId)
      setScopeError("Você não tem permissão para gerenciar este ministério.");
    selectedId.current = ministryId;
    setSelectedMinistryId(ministryId);
    if (!ministryId) {
      setEditor(null);
      setIsLoadingMembers(false);
      return null;
    }
    return loadMinistryData(ministryId);
  }, [
    userId,
    isAdmin,
    route.params?.ministryId,
    isCurrentSession,
    loadMinistryData,
  ]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void loadScope();
      return () => {
        focused.current = false;
        scopeRevision.current++;
        memberRevision.current++;
      };
    }, [loadScope]),
  );

  const chooseMinistry = (id: string) => {
    if (
      busy.current ||
      !isCurrentSession() ||
      !manageableIds.current.includes(id)
    )
      return;
    memberRevision.current++;
    selectedId.current = id;
    setSelectedMinistryId(id);
    setMembers([]);
    setRoles([]);
    setEditor(null);
    void loadMinistryData(id);
  };

  const openEditor = (
    member: MinistryMemberWithCapabilities | null,
    user: SearchableUser | null = null,
  ) => {
    if (!canOperate() || busy.current || memberError) return;
    setEditor({ member, user });
  };
  const handleEditorBusy = (value: boolean) => {
    if (useAuthStore.getState().sessionRevision !== sessionRevision) return;
    busy.current = value;
    setIsSaving(value);
  };
  const closeEditor = () => {
    if (useAuthStore.getState().sessionRevision === sessionRevision)
      setEditor(null);
  };

  const selectedMinistry = ministries.find(
    (ministry) => ministry.id === selectedMinistryId,
  );
  const isStackScreen = route.name === "ManageMinistryMembers";
  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={isStackScreen ? ["top", "left", "right"] : ["left", "right"]}
    >
      {isStackScreen ? (
        <HeaderSecondary title="Equipe" onBack={() => navigation.goBack()} />
      ) : null}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        {isLoadingMinistries ? (
          <>
            <Text style={{ fontWeight: "700", marginBottom: 12 }}>Ministério</Text>
            <Text>Carregando ministerios...</Text>
          </>
        ) : ministries.length > 0 ? (
          <SelectField
            label="Ministério"
            value={selectedMinistryId}
            options={ministries.map((ministry) => ({ value: ministry.id, label: ministry.name }))}
            disabled={isSaving}
            onValueChange={chooseMinistry}
            containerStyle={{ marginBottom: 18 }}
          />
        ) : (
          <View style={{ marginBottom: 18 }}>
            <Text style={{ fontWeight: "700", marginBottom: 12 }}>Ministério</Text>
            {!scopeError ? <Text>Nenhum ministerio gerenciavel encontrado.</Text> : null}
          </View>
        )}

        {scopeError ? (
          <Text style={{ color: "#991b1b", marginBottom: 12 }}>
            {scopeError}
          </Text>
        ) : null}
        <TouchableOpacity
          disabled={isSaving}
          onPress={() => void loadScope()}
          style={{ paddingVertical: 10 }}
        >
          <Text>Atualizar equipe</Text>
        </TouchableOpacity>
        {selectedMinistry ? (
          <>
            <Text
              style={{ fontWeight: "700", fontSize: 18, marginVertical: 12 }}
            >
              Integrantes de {selectedMinistry.name}
            </Text>
            {memberError ? (
              <Text style={{ color: "#991b1b" }}>{memberError}</Text>
            ) : isLoadingMembers ? (
              <Text>Carregando membros...</Text>
            ) : members.length === 0 ? (
              <Text>Nenhum integrante neste ministério.</Text>
            ) : (
              members.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  disabled={isSaving || isLoadingMinistries}
                  onPress={() => openEditor(member)}
                  style={{
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 18,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontWeight: "700" }}>
                    {getProfileInitials(member.full_name)} · {member.full_name}
                    {member.is_leader ? " · Líder" : ""}
                  </Text>
                  <Text style={{ color: "#6b7280", marginTop: 6 }}>
                    {member.capability_roles
                      .map((role) => role.name)
                      .join(", ") || "Sem funções configuradas."}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </>
        ) : null}
        {selectedMinistryId ? (
          <View style={{ display: selectedMinistry ? "flex" : "none" }}>
            <MemberSearch
              key={selectedMinistryId}
              ministryId={selectedMinistryId}
              members={members}
              disabled={
                isSaving ||
                isLoadingMinistries ||
                !!memberError ||
                !canOperate()
              }
              canOperate={canOperate}
              onSelect={(user) => openEditor(null, user)}
            />
          </View>
        ) : null}
      </ScrollView>
      {editor && selectedMinistryId ? (
        <MemberEditor
          key={`${sessionRevision}:${selectedMinistryId}:${editor.member?.id ?? editor.user?.id}`}
          member={editor.member}
          user={editor.user}
          ministryId={selectedMinistryId}
          roles={roles}
          disabled={isLoadingMinistries || !!memberError}
          scopeError={scopeError}
          canOperate={canOperate}
          onReload={loadScope}
          onClose={closeEditor}
          onBusyChange={handleEditorBusy}
        />
      ) : null}
    </SafeAreaView>
  );
}
