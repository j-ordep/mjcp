import { colors } from "../../theme/colors";
import { Text } from "../../components/ui/text";
import { Input } from "../../components/ui/input";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { Avatar } from "react-native-paper";
import { Switch } from "../../components/ui/switch";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, ShieldCheck } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import DefaultButton from "../../components/button/DefaultButton";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import type { RootStackParamList } from "../../types/navigation";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [savingProfileId, setSavingProfileId] = useState<string | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);

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

  const loadProfiles = useCallback(async (
    nextPage: number,
    append: boolean,
    options?: { preserveProfilesOnError?: boolean; showLoading?: boolean },
  ) => {
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    const preserveProfilesOnError = options?.preserveProfilesOnError ?? false;
    const showLoading = options?.showLoading ?? !append;

    setScreenError(null);

    if (append) {
      setIsLoadingMore(true);
    } else if (showLoading) {
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
    } else if (showLoading) {
      setIsLoading(false);
    }

    if (error) {
      if (!append && !preserveProfilesOnError) {
        setProfiles([]);
      }
      setScreenError(error);
      return;
    }

    const nextProfiles = data ?? [];
    setProfiles((current) =>
      append ? [...current, ...nextProfiles] : nextProfiles,
    );
    setPage(nextPage);
    setHasMore(hasMore);
  }, [search]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadProfiles(0, false, {
        preserveProfilesOnError: true,
        showLoading: false,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [loadProfiles]);

  const handleTogglePermission = async (target: EventPermissionProfile) => {
    if (
      target.role === "admin" ||
      target.id === profile?.id ||
      savingProfileId !== null ||
      isRefreshing
    ) {
      return;
    }

    setScreenError(null);
    setSavingProfileId(target.id);

    const nextValue = !target.can_manage_events;
    const { data, error } = await setProfileEventManagementPermission(
      target.id,
      nextValue,
    );

    setSavingProfileId(null);

    if (error) {
      setScreenError(error);
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
      <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
        <HeaderSecondary
          title="Permissoes de eventos"
          onBack={() => navigation.goBack()}
        />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="small" color={colors.foreground} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <HeaderSecondary
        title="Permissoes de eventos"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void handleRefresh()}
          />
        }
      >
        <View
          style={{
            backgroundColor: colors.primary,
            borderRadius: 24,
            padding: 20,
            marginBottom: 18,
          }}
        >
          <Text
            style={{
              color: colors.primaryForeground,
              fontWeight: "700",
              fontSize: 21,
              marginBottom: 6,
            }}
          >
            Gestao global de eventos
          </Text>
          <Text style={{ color: colors.inverseMuted, lineHeight: 20 }}>
            Conceda ou remova acesso para criar, editar e excluir eventos,
            incluindo audiencia privada e reserva opcional de sala.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 18,
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 17, marginBottom: 10 }}>
            Buscar perfis
          </Text>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nome ou email"
            containerStyle={{ backgroundColor: colors.surface }}
            left={
              <Search size={18} color={colors.mutedForeground} />
            }
          />
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
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
            <Text style={{ color: colors.mutedForeground }}>
              {profiles.length} visiveis
            </Text>
          </View>

          {screenError ? (
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.destructiveBorder,
                backgroundColor: colors.destructiveMuted,
                padding: 16,
                marginBottom: 14,
              }}
            >
              <Text style={{ color: colors.destructive, lineHeight: 20, marginBottom: 12 }}>
                {screenError}
              </Text>
              <DefaultButton
                variant="outline"
                onPress={() => void loadProfiles(0, false)}
                disabled={isLoading || isLoadingMore || savingProfileId !== null}
              >
                Tentar novamente
              </DefaultButton>
            </View>
          ) : null}

          {isLoading ? (
            <View style={{ paddingVertical: 24 }}>
              <ActivityIndicator size="small" color={colors.foreground} />
            </View>
          ) : profiles.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.muted,
                borderRadius: 18,
                padding: 16,
              }}
            >
              <Text style={{ fontWeight: "600", marginBottom: 4 }}>
                Nenhum perfil encontrado
              </Text>
              <Text style={{ color: colors.mutedForeground }}>
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
                      borderColor: colors.border,
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
                          style={{ marginRight: 12, backgroundColor: colors.primary }}
                          color={colors.primaryForeground}
                        />
                      )}

                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={{ fontWeight: "700", marginBottom: 2 }}>
                          {item.full_name}
                        </Text>
                        <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
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
                              backgroundColor: colors.muted,
                              borderRadius: 999,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: colors.foreground,
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
                                backgroundColor: colors.successMuted,
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: colors.success,
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
                                backgroundColor: colors.secondary,
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: colors.primary,
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
                          <ActivityIndicator size="small" color={colors.foreground} />
                        ) : (
                          <Switch
                            checked={item.can_manage_events || isBuiltInAdmin}
                            onCheckedChange={() => handleTogglePermission(item)}
                            disabled={isReadOnly || savingProfileId !== null || isRefreshing}
                          />
                        )}
                      </View>
                    </View>

                    <View
                      style={{
                        marginTop: 12,
                        borderRadius: 14,
                        padding: 12,
                        backgroundColor: isReadOnly ? colors.muted : colors.muted,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <ShieldCheck size={16} color={colors.foreground} />
                        <Text
                          style={{
                            marginLeft: 8,
                            fontWeight: "700",
                            color: colors.foreground,
                          }}
                        >
                          {isBuiltInAdmin
                            ? "Acesso total por ser administrador"
                            : item.can_manage_events
                              ? "Permissao global de eventos ativa"
                              : "Sem permissao global de eventos"}
                        </Text>
                      </View>
                      <Text style={{ color: colors.mutedForeground, lineHeight: 18 }}>
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
                    onPress={() => void loadProfiles(page + 1, true)}
                    isLoading={isLoadingMore}
                    disabled={savingProfileId !== null || isRefreshing}
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
