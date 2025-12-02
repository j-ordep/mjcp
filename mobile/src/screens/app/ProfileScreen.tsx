import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Avatar, Divider, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheetMenu from "../../components/utils/BottomSheetMenu";
import ActivityCard from "../../components/card/ActivityCard";
import ProfileHeader from "../../components/Header/ProfileHeader";

export default function ProfileScreen({ navigation }) {
  const [showMenu, setShowMenu] = useState(false);

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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <ProfileHeader onBack={() => navigation.goBack()} onMenu={() => setShowMenu(true)} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 2 }}>
        {/* Perfil */}
        <View className="items-center mt-3">
          <Avatar.Image
            size={110}
            source={{ uri: "https://images.unsplash.com/photo-1531299983330-093763e1d963?auto=format&fit=facearea&w=256&h=256&facepad=2" }}
            style={{ marginBottom: 12 }}
          />
          <Text style={{ fontSize: 22, fontWeight: "bold", marginTop: 8 }}>Nome da Silva</Text>
        </View>

        {/* Email e Telefone */}
        <View className="mt-8 px-6">
          <View className="py-3">
            <Text style={{ color: "#888", marginBottom: 2 }}>Email</Text>
            <Text style={{ fontSize: 15, marginBottom: 0 }}>maria.santos@email.com</Text>
            <Divider style={{ marginTop: 10, marginBottom: 0 }} />
          </View>
          <View className="py-3">
            <Text style={{ color: "#888", marginBottom: 2 }}>Telefone</Text>
            <Text style={{ fontSize: 15, marginBottom: 0 }}>(11) 98765-4321</Text>
            <Divider style={{ marginTop: 10, marginBottom: 0 }} />
          </View>
        </View>

        {/* Cards de Atividades Recentes */}
        <View className="mt-8">
          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 10, marginLeft: 20 }}>Atividades Recentes</Text>
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
        onLogout={() => {/* lógica de logout */ }}
      />
    </SafeAreaView>
  );
}