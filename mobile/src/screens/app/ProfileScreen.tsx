import { ChevronLeft, MoreVertical } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Avatar, Divider, IconButton, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import ActivityCard from "../../components/card/ActivityCard";

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
      icon: "music",
      title: "Você destacou Salmos 23:1",
      subtitle: "NVI",
      content: "O Senhor é o meu pastor; nada me faltará...",
      timestamp: "5d",
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f6fa" }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
      }}>
        <IconButton icon={() => <ChevronLeft size={24} />} onPress={() => navigation.goBack()} />
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>Perfil</Text>
        <IconButton icon={() => <MoreVertical size={24} />} onPress={() => setShowMenu(true)} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Perfil */}
        <View style={{ alignItems: "center", marginTop: 32 }}>
          <Avatar.Image
            size={110}
            source={{ uri: "https://images.unsplash.com/photo-1531299983330-093763e1d963?auto=format&fit=facearea&w=256&h=256&facepad=2" }}
            style={{ marginBottom: 12 }}
          />
          <Text style={{ fontSize: 22, fontWeight: "bold", marginTop: 8 }}>Maria Silva Santos</Text>
        </View>

        {/* Email e Telefone */}
        <View style={{ marginTop: 24, marginHorizontal: 24 }}>
          <View style={{ paddingVertical: 12 }}>
            <Text style={{ color: "#888", marginBottom: 2 }}>Email</Text>
            <Text style={{ fontSize: 15, marginBottom: 0 }}>maria.santos@email.com</Text>
            <Divider style={{ marginTop: 10, marginBottom: 0 }} />
          </View>
          <View style={{ paddingVertical: 12 }}>
            <Text style={{ color: "#888", marginBottom: 2 }}>Telefone</Text>
            <Text style={{ fontSize: 15, marginBottom: 0 }}>(11) 98765-4321</Text>
            <Divider style={{ marginTop: 10, marginBottom: 0 }} />
          </View>
        </View>

        {/* Cards de Atividades Recentes */}
        <View style={{ marginTop: 28 }}>
          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 20, marginLeft: 20 }}>Atividades Recentes</Text>
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
    </SafeAreaView>
  );
}