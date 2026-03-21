import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { Avatar, Divider, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import ActivityCard from "../../components/card/ActivityCard";
import ProfileHeader from "../../components/Header/ProfileHeader";
import BottomSheetMenu from "../../components/utils/BottomSheetMenu";
import { signOut } from "../../services/authService";
import { useAuthStore } from "../../stores/useAuthStore";
import { useMinistryStore } from "../../stores/useMinistryStore";

export default function ProfileScreen({ navigation }) {
  const [showMenu, setShowMenu] = useState(false);
  const { profile } = useAuthStore();
  const { userMinistries, isLoadingMinistries, fetchUserMinistries } =
    useMinistryStore();

  useEffect(() => {
    fetchUserMinistries();
  }, []);

  const activities = [
    {
      icon: "calendar",
      title: "Escala - Culto Dominical",
      subtitle: "Louvor e Adoração",
      content: "Ministério de Música • Domingo, 19h • Participantes: 8 membros",
      timestamp: "2d",
    },
    {
      icon: "calendar",
      title: "Escala - Culto Dominical",
      subtitle: "Louvor e Adoração",
      content: "Ministério de Música • Domingo, 19h • Participantes: 8 membros",
      timestamp: "7d",
    },
    {
      icon: "calendar",
      title: "Escala - Culto Dominical",
      subtitle: "Louvor e Adoração",
      content: "Ministério de Música • Domingo, 19h • Participantes: 8 membros",
      timestamp: "10d",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <ProfileHeader
        onBack={() => navigation.goBack()}
        onMenu={() => setShowMenu(true)}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 2 }}
      >
        {/* Perfil */}
        <View className="items-center mt-3">
          <Avatar.Image
            size={110}
            source={{
              uri:
                profile?.avatar_url ||
                "https://ui-avatars.com/api/?name=" +
                  (profile?.full_name || ""),
            }}
            style={{ marginBottom: 12 }}
          />
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

        {/* Email e Telefone */}
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
              {profile?.phone || "Não informado"}
            </Text>
            <Divider style={{ marginTop: 10, marginBottom: 0 }} />
          </View>
        </View>

        {/* Meus Ministérios */}
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
            userMinistries.map((m) => (
              <View
                key={m.id}
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
                  <Text style={{ fontWeight: "bold" }}>{m.name}</Text>
                  <Text style={{ fontSize: 12, color: "#888" }}>
                    Desde {new Date(m.joined_at).toLocaleDateString("pt-BR")}
                  </Text>
                </View>
                {m.is_leader && (
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
                )}
              </View>
            ))
          )}
        </View>

        {/* Cards de Atividades Recentes (Mock por enquanto) */}
        <View className="mt-8 mb-10">
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 16,
              marginBottom: 10,
              marginLeft: 20,
            }}
          >
            Atividades Recentes
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
          >
            {activities.map((activity, idx) => (
              <ActivityCard key={idx} {...activity} />
            ))}
          </ScrollView>
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
