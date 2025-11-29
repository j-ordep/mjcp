import { Users } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CardButton from "../../components/button/CardButton";
import EventInfoCard from "../../components/card/EventInfoCard";
import MemberCard from "../../components/card/MemberCard";
import TeamStatusCard from "../../components/card/TeamStatusCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";

export default function EventDetailsScreen({ navigation }) {
  const event = {
    title: 'Culto de Celebração',
    date: '24 Nov',
    time: '19:00',
    location: 'Auditório Principal',
    department: 'Ministério de Música',
    role: 'Tecladista',
    description: 'Culto especial de celebração com apresentação da banda completa.',
  };

  const members = [
    { id: 1, name: 'João Silva', role: 'Vocalista', photo: 'https://i.pravatar.cc/150?img=12', confirmed: true },
    { id: 2, name: 'Maria Santos', role: 'Backing Vocal', photo: 'https://i.pravatar.cc/150?img=45', confirmed: true },
    { id: 3, name: 'Pedro Costa', role: 'Guitarrista', photo: 'https://i.pravatar.cc/150?img=33', confirmed: false },
    { id: 4, name: 'Ana Paula', role: 'Baixista', photo: 'https://i.pravatar.cc/150?img=25', confirmed: true },
    { id: 5, name: 'Carlos Mendes', role: 'Tecladista', photo: 'https://i.pravatar.cc/150?img=68', confirmed: true },
    { id: 6, name: 'Juliana Alves', role: 'Baterista', photo: 'https://i.pravatar.cc/150?img=47', confirmed: false },
    { id: 7, name: 'Lucas Ferreira', role: 'Violão', photo: 'https://i.pravatar.cc/150?img=51', confirmed: true },
  ];

  const confirmedCount = members.filter((m) => m.confirmed).length;
  const totalCount = members.length;

  function handleConfirm() {
    alert("Presença confirmada!");
  }

  function handleRequestChange() {
    alert("Solicitar troca de escala");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <HeaderSecondary navigation={navigation} title={"Detalhes do Evento"} />

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Event Info Card */}
        <EventInfoCard {...event} />

        {/* Team Members Section */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>Equipe Escalada</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Users size={16} color="#888" style={{ marginRight: 4 }} />
              <Text style={{ color: "#888", fontSize: 14 }}>{confirmedCount}/{totalCount} confirmados</Text>
            </View>
          </View>

          {/* Confirmation Status Summary */}
          <TeamStatusCard confirmed={confirmedCount} pending={totalCount - confirmedCount} />

          {/* Members List */}
          <View style={{ gap: 10 }}>
            {members.map((member) => (
              <MemberCard key={member.id} {...member} />
            ))}
          </View>
        </View>

        {/* Buttons */}
        <View style={{
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#fff",
          flexDirection: "row",
          gap: 12,
        }}>
          <View style={{ flex: 1 }}>
            <CardButton variant="outline" onPress={handleRequestChange}>
              Preciso trocar
            </CardButton>
          </View>
          <View style={{ flex: 1 }}>
            <CardButton variant="primary" onPress={handleConfirm}>
              Confirmar presença
            </CardButton>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}