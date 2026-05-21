import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { Avatar, Switch, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, ShieldCheck } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import DefaultButton from "../../components/button/DefaultButton";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import {
  listProfilesForEventPermissionPage,
  setProfileEventManagementPermission,
  type EventPermissionProfile,
} from "../../services/profileService";
import { useAuthStore } from "../../stores/useAuthStore";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "ManageEventPermissions"
>;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getRoleLabel(role: EventPermissionProfile["role"]) {
  if (role === "admin") return "Administrador";
  if (role === "leader") return "Lider";
  return "Membro";
}

export default function ManageEventPermissionsScreen({ navigation }: Props) {
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === "admin";
  const requestIdRef = useRef(0);
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<EventPermissionProfile[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [savingProfileId, setSavingProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (isAdmin) return;

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Profile");
  }, [isAdmin, navigation, profile]);

  useEffect(() => {
    if (!isAdmin) return;

    const timer = setTimeout(() => {
      void loadProfiles(0, false);
    }, 250);

    return () => clearTimeout(timer);
  }, [isAdmin, search]);

  const loadProfiles = async (nextPage: number, append: boolean) => {
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    const { data, hasMore, error } = await listProfilesForEventPermissionPage({
      query: search,
      page: nextPage,
      pageSize: 10,
    });

    if (requestIdRef.current !== currentRequestId) {
      return;
    }

    if (append) {
      setIsLoadingMore(false);
    } else {
      setIsLoading(false);
    }

    if (error) {
      Alert.alert(
        "Nao foi possivel carregar os perfis",
        "Tente novamente em alguns instantes.",
      );
      return;
    }

    const nextProfiles = data ?? [];
    setProfiles((current) =>
      append ? [...current, ...nextProfiles] : nextProfiles,
    );
    setPage(nextPage);
    setHasMore(hasMore);
  };

  const handleTogglePermission = async (target: EventPermissionProfile) => {
    if (target.role === "admin" || target.id === profile?.id) {
      return;
    }

    setSavingProfileId(target.id);

    const nextValue = !target.can_manage_events;
    const { data, error } = await setProfileEventManagementPermission(
      target.id,
      nextValue,
    );

    setSavingProfileId(null);

    if (error) {
      Alert.alert(
        "Nao foi possivel atualizar a permissao",
        "Tente novamente em alguns instantes.",
      );
      return;
    }

    setProfiles((current) =>
      current.map((item) =>
        item.id === target.id
          ? {
              ...item,
              can_manage_events: data?.can_manage_events ?? nextValue,
            }
          : item,
      ),
    );
  };

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
        <HeaderSecondary
          title="Permissoes de eventos"
          onBack={() => navigation.goBack()}
        />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="small" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderSecondary
        title="Permissoes de eventos"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
      >
        <View
          style={{
            backgroundColor: "#111827",
            borderRadius: 24,
            padding: 20,
            marginBottom: 18,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "700",
              fontSize: 21,
              marginBottom: 6,
            }}
          >
            Gestao global de eventos
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.72)", lineHeight: 20 }}>
            Conceda ou remova acesso para criar, editar e excluir eventos,
            incluindo audiencia privada e reserva opcional de sala.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 24,
            padding: 18,
            borderWidth: 1,
            borderColor: "#eef2f7",
            marginBottom: 18,
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 17, marginBottom: 10 }}>
            Buscar perfis
          </Text>
          <TextInput
            mode="outlined"
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nome ou email"
            style={{ backgroundColor: "#fff" }}
            activeOutlineColor="#111827"
            outlineColor="#d1d5db"
            left={
              <TextInput.Icon
                icon={() => <Search size={18} color="#6b7280" />}
              />
            }
          />
        </View>

        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 24,
            padding: 18,
            borderWidth: 1,
            borderColor: "#eef2f7",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: "700", fontSize: 17 }}>
              Perfis cadastrados
            </Text>
            <Text style={{ color: "#6b7280" }}>
              {profiles.length} visiveis
            </Text>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 24 }}>
              <ActivityIndicator size="small" color="#000" />
            </View>
          ) : profiles.length === 0 ? (
            <View
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 18,
                padding: 16,
              }}
            >
              <Text style={{ fontWeight: "600", marginBottom: 4 }}>
                Nenhum perfil encontrado
              </Text>
              <Text style={{ color: "#6b7280" }}>
                Ajuste a busca para localizar outro usuario.
              </Text>
            </View>
          ) : (
            <>
              {profiles.map((item) => {
                const isCurrentUser = item.id === profile?.id;
                const isBuiltInAdmin = item.role === "admin";
                const isReadOnly = isCurrentUser || isBuiltInAdmin;
                const isSaving = savingProfileId === item.id;

                return (
                  <View
                    key={item.id}
                    style={{
                      borderWidth: 1,
                      borderColor: "#eef2f7",
                      borderRadius: 18,
                      padding: 14,
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      {item.avatar_url ? (
                        <Avatar.Image
                          size={42}
                          source={{ uri: item.avatar_url }}
                          style={{ marginRight: 12 }}
                        />
                      ) : (
                        <Avatar.Text
                          size={42}
                          label={getInitials(item.full_name)}
                          style={{ marginRight: 12, backgroundColor: "#111827" }}
                          color="#fff"
                        />
                      )}

                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={{ fontWeight: "700", marginBottom: 2 }}>
                          {item.full_name}
                        </Text>
                        <Text style={{ color: "#6b7280", fontSize: 13 }}>
                          {item.email || "Sem email cadastrado"}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 8,
                            marginTop: 10,
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: "#f3f4f6",
                              borderRadius: 999,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: "#111827",
                                fontWeight: "600",
                                fontSize: 12,
                              }}
                            >
                              {getRoleLabel(item.role)}
                            </Text>
                          </View>

                          {item.can_manage_events ? (
                            <View
                              style={{
                                backgroundColor: "#ecfdf5",
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#166534",
                                  fontWeight: "700",
                                  fontSize: 12,
                                }}
                              >
                                Pode gerenciar eventos
                              </Text>
                            </View>
                          ) : null}

                          {isCurrentUser ? (
                            <View
                              style={{
                                backgroundColor: "#eff6ff",
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#1d4ed8",
                                  fontWeight: "700",
                                  fontSize: 12,
                                }}
                              >
                                Seu perfil
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      <View style={{ alignItems: "center" }}>
                        {isSaving ? (
                          <ActivityIndicator size="small" color="#000" />
                        ) : (
                          <Switch
                            value={item.can_manage_events || isBuiltInAdmin}
                            onValueChange={() => handleTogglePermission(item)}
                            color="#000"
                            disabled={isReadOnly}
                          />
                        )}
                      </View>
                    </View>

                    <View
                      style={{
                        marginTop: 12,
                        borderRadius: 14,
                        padding: 12,
                        backgroundColor: isReadOnly ? "#f9fafb" : "#fafafa",
                        borderWidth: 1,
                        borderColor: "#f3f4f6",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <ShieldCheck size={16} color="#111827" />
                        <Text
                          style={{
                            marginLeft: 8,
                            fontWeight: "700",
                            color: "#111827",
                          }}
                        >
                          {isBuiltInAdmin
                            ? "Acesso total por ser administrador"
                            : item.can_manage_events
                              ? "Permissao global de eventos ativa"
                              : "Sem permissao global de eventos"}
                        </Text>
                      </View>
                      <Text style={{ color: "#6b7280", lineHeight: 18 }}>
                        {isCurrentUser
                          ? "Seu acesso global ja vem do papel de administrador."
                          : isBuiltInAdmin
                            ? "Administradores nao precisam dessa flag para acessar o fluxo."
                            : "Quando ativa, esta pessoa pode criar, editar e excluir eventos em todo o app."}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {hasMore ? (
                <View style={{ marginTop: 8 }}>
                  <DefaultButton
                    onPress={() => loadProfiles(page + 1, true)}
                    isLoading={isLoadingMore}
                  >
                    Carregar mais perfis
                  </DefaultButton>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
