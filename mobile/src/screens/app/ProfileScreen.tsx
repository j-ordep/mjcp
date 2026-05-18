import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { ShieldCheck } from "lucide-react-native";
import { Avatar, Divider, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileHeader from "../../components/Header/ProfileHeader";
import BottomSheetMenu from "../../components/utils/BottomSheetMenu";
import { signOut } from "../../services/authService";
import { useAuthStore } from "../../stores/useAuthStore";
import { useMinistryStore } from "../../stores/useMinistryStore";
import {
  formatProfilePhone,
  getProfileAvatarUri,
  getProfileInitials,
} from "../../utils/profileAvatar";

export default function ProfileScreen({ navigation }) {
  const [showMenu, setShowMenu] = useState(false);
  const { profile } = useAuthStore();
  const { userMinistries, isLoadingMinistries, fetchUserMinistries } =
    useMinistryStore();

  useEffect(() => {
    fetchUserMinistries();
  }, [fetchUserMinistries]);

  const avatarUri = getProfileAvatarUri(profile?.avatar_url);

  function handleBack() {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Home");
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <ProfileHeader onBack={handleBack} onMenu={() => setShowMenu(true)} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 2 }}
      >
        <View className="items-center mt-3">
          {avatarUri ? (
            <Avatar.Image
              size={110}
              source={{
                uri: avatarUri,
              }}
              style={{ marginBottom: 12 }}
            />
          ) : (
            <Avatar.Text
              size={110}
              label={getProfileInitials(profile?.full_name)}
              color="#111111"
              style={{ marginBottom: 12, backgroundColor: "#f3f4f6" }}
            />
          )}
          <Text style={{ fontSize: 22, fontWeight: "bold", marginTop: 8 }}>
            {profile?.full_name || "Carregando..."}
          </Text>
          <Text style={{ marginTop: 2, color: "#666" }}>
            {profile?.role === "admin"
              ? "Administrador"
              : profile?.role === "leader"
                ? "Líder"
                : "Membro"}
          </Text>
        </View>

        <View className="mt-8 px-6">
          <View className="py-3">
            <Text style={{ color: "#888", marginBottom: 2 }}>Email</Text>
            <Text style={{ fontSize: 15, marginBottom: 0 }}>
              {profile?.email || "Nenhum email"}
            </Text>
            <Divider style={{ marginTop: 10, marginBottom: 0 }} />
          </View>
          <View className="py-3">
            <Text style={{ color: "#888", marginBottom: 2 }}>Telefone</Text>
            <Text style={{ fontSize: 15, marginBottom: 0 }}>
              {formatProfilePhone(profile?.phone)}
            </Text>
            <Divider style={{ marginTop: 10, marginBottom: 0 }} />
          </View>
        </View>

        {profile?.role === "admin" ? (
          <View className="mt-8 px-6">
            <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 12 }}>
              Administracao
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("ManageEventPermissions")}
              style={{
                borderRadius: 24,
                padding: 18,
                borderWidth: 1,
                borderColor: "#eef2f7",
                backgroundColor: "#fff",
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: "#111827",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <ShieldCheck size={20} color="#fff" />
              </View>
              <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 4 }}>
                Permissoes globais de eventos
              </Text>
              <Text style={{ color: "#6b7280", lineHeight: 20 }}>
                Gerencie quem pode criar, editar e excluir eventos em todo o app.
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View className="mt-8 px-6">
          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 12 }}>
            Meus Ministérios
          </Text>
          {isLoadingMinistries ? (
            <ActivityIndicator size="small" color="#000" />
          ) : userMinistries.length === 0 ? (
            <Text style={{ color: "#888" }}>
              Você ainda não faz parte de nenhum ministério.
            </Text>
          ) : (
            userMinistries.map((ministry) => (
              <View
                key={ministry.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f3f4f6",
                }}
              >
                <View>
                  <Text style={{ fontWeight: "bold" }}>{ministry.name}</Text>
                  <Text style={{ fontSize: 12, color: "#888" }}>
                    Desde {new Date(ministry.joined_at).toLocaleDateString("pt-BR")}
                  </Text>
                </View>
                {ministry.is_leader ? (
                  <View
                    style={{
                      backgroundColor: "#000",
                      borderRadius: 4,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: "bold",
                      }}
                    >
                      LÍDER
                    </Text>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View className="mt-8 mb-10 px-6">
          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 12 }}>
            Resumo
          </Text>
          <View
            style={{
              borderRadius: 24,
              padding: 18,
              borderWidth: 1,
              borderColor: "#eef2f7",
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 6 }}>
              Dados reais do seu perfil
            </Text>
            <Text style={{ color: "#6b7280", lineHeight: 20, marginBottom: 12 }}>
              Esta tela mostra apenas informações reais do app. Histórico detalhado
              de atividades ainda não entrou na POC.
            </Text>
            <Text style={{ color: "#111827", fontSize: 14 }}>
              Ministérios vinculados: {userMinistries.length}
            </Text>
          </View>
        </View>
      </ScrollView>
      <BottomSheetMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onEdit={() => navigation.navigate("EditProfile")}
        onLogout={async () => {
          const { error } = await signOut();
          if (error) {
            Alert.alert("Erro ao sair", error);
          }
        }}
      />
    </SafeAreaView>
  );
}
