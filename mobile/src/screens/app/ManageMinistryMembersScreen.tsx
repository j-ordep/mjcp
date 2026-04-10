import { useEffect, useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Search, ShieldCheck, UserPlus, X } from "lucide-react-native";
import DefaultButton from "../../components/button/DefaultButton";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import {
  addUserToMinistry,
  getAllMinistries,
  getMinistryMembersDetailed,
  getUserMinistries,
  type MinistryMemberWithCapabilities,
  removeUserFromMinistry,
  saveMinistryMemberCapabilities,
  searchRegisteredUsers,
  type SearchableUser,
  updateMinistryMemberLeaderStatus,
  type UserMinistry,
} from "../../services/ministryService";
import { getMinistryRolesOptions, type MinistryRoleOption } from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import type { Ministry } from "../../types/models";

type ManageableMinistry = Ministry | UserMinistry;
type ManageMembersRoute = {
  key: string;
  name: "ManageMinistryMembers";
  params?: RootStackParamList["ManageMinistryMembers"];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ManageMinistryMembersScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ManageMembersRoute>();
  const { session, profile } = useAuthStore();
  const [ministries, setMinistries] = useState<ManageableMinistry[]>([]);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(route.params?.ministryId ?? null);
  const [members, setMembers] = useState<MinistryMemberWithCapabilities[]>([]);
  const [roles, setRoles] = useState<MinistryRoleOption[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchableUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchableUser | null>(null);
  const [selectedMember, setSelectedMember] = useState<MinistryMemberWithCapabilities | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isLeader, setIsLeader] = useState(false);
  const [isLoadingMinistries, setIsLoadingMinistries] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    void loadManageableMinistries();
  }, [session?.user?.id, profile?.role]);

  useEffect(() => {
    if (!selectedMinistryId) return;
    void loadMinistryData(selectedMinistryId);
  }, [selectedMinistryId]);

  useEffect(() => {
    if (!selectedMinistryId) return;

    const timer = setTimeout(() => {
      void runUserSearch(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search, selectedMinistryId, members]);

  const loadManageableMinistries = async () => {
    if (!session?.user?.id) return;

    setIsLoadingMinistries(true);
    try {
      if (isAdmin) {
        const { data, error } = await getAllMinistries();
        if (error) throw new Error(error);
        const next = data ?? [];
        setMinistries(next);
        if (!selectedMinistryId && next.length > 0) setSelectedMinistryId(next[0].id);
      } else {
        const { data, error } = await getUserMinistries(session.user.id);
        if (error) throw new Error(error);
        const next = (data ?? []).filter((ministry) => ministry.is_leader);
        setMinistries(next);
        if (!selectedMinistryId && next.length > 0) setSelectedMinistryId(next[0].id);
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message ?? "Nao foi possivel carregar ministerios.");
    } finally {
      setIsLoadingMinistries(false);
    }
  };

  const loadMinistryData = async (ministryId: string) => {
    setIsLoadingMembers(true);
    try {
      const [membersResult, rolesResult] = await Promise.all([
        getMinistryMembersDetailed(ministryId),
        getMinistryRolesOptions(ministryId),
      ]);

      if (membersResult.error) throw new Error(membersResult.error);
      if (rolesResult.error) throw new Error(rolesResult.error);

      setMembers(membersResult.data ?? []);
      setRoles(rolesResult.data ?? []);
    } catch (error: any) {
      Alert.alert("Erro", error.message ?? "Nao foi possivel carregar os membros do ministerio.");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const runUserSearch = async (value: string) => {
    setIsSearchingUsers(true);
    const { data, error } = await searchRegisteredUsers(value);
    setIsSearchingUsers(false);

    if (error) {
      Alert.alert("Erro", error);
      return;
    }

    const currentMemberIds = new Set(members.map((member) => member.user_id));
    setSearchResults((data ?? []).filter((user) => !currentMemberIds.has(user.id)));
  };

  const openCreateEditor = (user: SearchableUser) => {
    setSelectedUser(user);
    setSelectedMember(null);
    setSelectedRoleIds([]);
    setIsLeader(false);
    setShowEditor(true);
  };

  const openEditEditor = (member: MinistryMemberWithCapabilities) => {
    setSelectedMember(member);
    setSelectedUser(null);
    setSelectedRoleIds(member.capability_role_ids);
    setIsLeader(member.is_leader);
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setSelectedMember(null);
    setSelectedUser(null);
    setSelectedRoleIds([]);
    setIsLeader(false);
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId],
    );
  };

  const handleSaveMember = async () => {
    if (!selectedMinistryId) return;
    if (!selectedUser && !selectedMember) {
      Alert.alert("Selecione um usuario", "Escolha um usuario ou membro para configurar.");
      return;
    }

    setIsSaving(true);
    try {
      let memberId = selectedMember?.id ?? null;

      if (selectedUser) {
        const addResult = await addUserToMinistry({
          ministryId: selectedMinistryId,
          userId: selectedUser.id,
          isLeader,
        });

        if (addResult.error || !addResult.data) {
          throw new Error(addResult.error ?? "Nao foi possivel adicionar o usuario ao ministerio.");
        }

        memberId = addResult.data.id;
      } else if (selectedMember) {
        const leaderResult = await updateMinistryMemberLeaderStatus(selectedMember.id, isLeader);
        if (leaderResult.error) throw new Error(leaderResult.error);
      }

      if (!memberId) {
        throw new Error("Nao foi possivel identificar o membro do ministerio.");
      }

      const capabilityResult = await saveMinistryMemberCapabilities(memberId, selectedRoleIds);
      if (capabilityResult.error) throw new Error(capabilityResult.error);

      await loadMinistryData(selectedMinistryId);
      await runUserSearch(search);
      closeEditor();
      Alert.alert("Sucesso", selectedUser ? "Usuario adicionado ao ministerio." : "Membro atualizado com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro", error.message ?? "Nao foi possivel salvar o membro.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    Alert.alert(
      "Remover do ministerio",
      "Deseja remover este membro do ministerio? Se ele estiver em escalas deste ministerio, tambem sera removido delas.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            setIsSaving(true);
            const result = await removeUserFromMinistry(selectedMember.id);
            setIsSaving(false);

            if (result.error) {
              Alert.alert("Erro", result.error);
              return;
            }

            if (selectedMinistryId) {
              await loadMinistryData(selectedMinistryId);
              await runUserSearch(search);
            }
            closeEditor();
            Alert.alert("Sucesso", "Membro removido do ministerio.");
          },
        },
      ],
    );
  };

  const selectedMinistry = ministries.find((ministry) => ministry.id === selectedMinistryId);
  const editorTitle = selectedUser
    ? `Adicionar ${selectedUser.full_name}`
    : selectedMember?.full_name ?? "Configurar membro";

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      {navigation.canGoBack() ? (
        <HeaderSecondary title="Membros do Ministério" onBack={() => navigation.goBack()} />
      ) : (
        <View className="px-5 pt-5 pb-3">
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              textAlign: "center",
            }}
          >
            Membros do Ministério
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: "#111827", borderRadius: 24, padding: 20, marginBottom: 18 }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 21, marginBottom: 6 }}>
            Gestao de membros e funções
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.72)", lineHeight: 20 }}>
            Adicione usuarios ao ministerio, marque lideranca e configure as funcoes que cada pessoa pode exercer.
          </Text>
        </View>

        <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "#eef2f7", marginBottom: 18 }}>
          <Text style={{ fontWeight: "700", fontSize: 17, marginBottom: 10 }}>Ministerio</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {isLoadingMinistries ? (
              <Text style={{ color: "#888" }}>Carregando ministerios...</Text>
            ) : ministries.length === 0 ? (
              <Text style={{ color: "#888" }}>Nenhum ministerio gerenciavel encontrado.</Text>
            ) : (
              ministries.map((ministry) => {
                const selected = selectedMinistryId === ministry.id;
                return (
                  <TouchableOpacity
                    key={ministry.id}
                    onPress={() => setSelectedMinistryId(ministry.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 999,
                      backgroundColor: selected ? "#111827" : "#f3f4f6",
                    }}
                  >
                    <Text style={{ color: selected ? "#fff" : "#111827", fontWeight: "600" }}>{ministry.name}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "#eef2f7", marginBottom: 18 }}>
          <Text style={{ fontWeight: "700", fontSize: 17, marginBottom: 10 }}>Buscar usuarios cadastrados</Text>
          <TextInput
            mode="outlined"
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar"
            style={{ marginBottom: 14, backgroundColor: "#fff" }}
            activeOutlineColor="#111827"
            outlineColor="#d1d5db"
            left={<TextInput.Icon icon={() => <Search size={18} color="#6b7280" />} />}
          />
          {isSearchingUsers ? (
            <Text style={{ color: "#888" }}>Buscando usuarios...</Text>
          ) : searchResults.length === 0 ? (
            <Text style={{ color: "#6b7280" }}>
              {search.trim() ? "Nenhum usuario elegivel encontrado." : "Digite para buscar usuarios cadastrados que ainda nao estao neste ministerio."}
            </Text>
          ) : (
            searchResults.map((user) => (
              <TouchableOpacity
                key={user.id}
                onPress={() => openCreateEditor(user)}
                style={{
                  borderWidth: 1,
                  borderColor: "#eef2f7",
                  borderRadius: 18,
                  padding: 14,
                  marginBottom: 10,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#111827", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>{getInitials(user.full_name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700" }}>{user.full_name}</Text>
                </View>
                <UserPlus size={18} color="#111827" />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "#eef2f7" }}>
          <Text style={{ fontWeight: "700", fontSize: 17, marginBottom: 10 }}>
            Membros atuais {selectedMinistry ? `do ${selectedMinistry.name}` : ""}
          </Text>
          {isLoadingMembers ? (
            <Text style={{ color: "#888" }}>Carregando membros...</Text>
          ) : members.length === 0 ? (
            <View style={{ backgroundColor: "#f9fafb", borderRadius: 18, padding: 16 }}>
              <Text style={{ fontWeight: "600", marginBottom: 4 }}>Nenhum membro neste ministerio</Text>
              <Text style={{ color: "#6b7280" }}>
                Adicione usuarios acima para depois conseguir escal�-los na tela de cria��o de escala.
              </Text>
            </View>
          ) : (
            members.map((member) => (
              <TouchableOpacity
                key={member.id}
                onPress={() => openEditEditor(member)}
                style={{ borderWidth: 1, borderColor: "#eef2f7", borderRadius: 18, padding: 14, marginBottom: 10 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#111827", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>{getInitials(member.full_name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700" }}>{member.full_name}</Text>
                  </View>
                  {member.is_leader ? (
                    <View style={{ backgroundColor: "#ecfdf5", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ color: "#166534", fontWeight: "700", fontSize: 12 }}>Lider</Text>
                    </View>
                  ) : null}
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {member.capability_roles.length === 0 ? (
                    <Text style={{ color: "#6b7280" }}>Sem funções configuradas.</Text>
                  ) : (
                    member.capability_roles.map((role) => (
                      <View key={role.id} style={{ backgroundColor: "#f3f4f6", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                        <Text style={{ color: "#111827", fontWeight: "600", fontSize: 12 }}>{role.name}</Text>
                      </View>
                    ))
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {showEditor ? (
        <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(17,24,39,0.45)", justifyContent: "flex-end" }}>
          <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18, maxHeight: "88%" }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ fontWeight: "700", fontSize: 20, marginBottom: 4 }}>{editorTitle}</Text>
               
              </View>
              <TouchableOpacity onPress={closeEditor} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center", marginRight: 4 }}>
                <X size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}> */}
              <TouchableOpacity
                onPress={() => setIsLeader((current) => !current)}
                style={{ backgroundColor: isLeader ? "#ecfdf5" : "#f9fafb", borderRadius: 18, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: isLeader ? "#bbf7d0" : "#eef2f7" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ShieldCheck size={18} color={isLeader ? "#166534" : "#6b7280"} />
                  <Text style={{ marginLeft: 10, fontWeight: "700", color: isLeader ? "#166534" : "#111827" }}>
                    {isLeader ? "Este usuário será líder deste ministério" : "Marcar como líder deste ministério"}
                  </Text>
                </View>
              </TouchableOpacity>

              <Text style={{ fontWeight: "700", marginBottom: 10 }}>Funções</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
                {roles.length === 0 ? (
                  <Text style={{ color: "#888" }}>Nenhuma fun��o cadastrada neste minist�rio.</Text>
                ) : (
                  roles.map((role) => {
                    const selected = selectedRoleIds.includes(role.id);
                    return (
                      <TouchableOpacity
                        key={role.id}
                        onPress={() => toggleRole(role.id)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 999,
                          backgroundColor: selected ? "#111827" : "#f3f4f6",
                        }}
                      >
                        <Text style={{ color: selected ? "#fff" : "#111827", fontWeight: "600" }}>{role.name}</Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              {selectedMember ? (
                <TouchableOpacity onPress={handleRemoveMember} style={{ backgroundColor: "#fee2e2", borderRadius: 18, padding: 14, marginBottom: 14 }}>
                  <Text style={{ color: "#991b1b", fontWeight: "700", textAlign: "center" }}>Remover do ministério</Text>
                </TouchableOpacity>
              ) : null}
            {/* </ScrollView> */}

            <DefaultButton onPress={handleSaveMember} isLoading={isSaving}>
              {selectedUser ? "Adicionar ao ministério" : "Salvar alterações"}
            </DefaultButton>
          </SafeAreaView>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
