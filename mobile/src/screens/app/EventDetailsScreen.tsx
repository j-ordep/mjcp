import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Divider } from "react-native-paper";
import { ChevronLeft, MapPin, Calendar, Clock, Users, CheckCircle2, Circle } from "lucide-react-native";
import CardButton from "../../components/button/CardButton";
import MemberCard from "../../components/card/MemberCard";

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
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}>
        <ChevronLeft size={24} onPress={() => navigation.goBack()} />
        <Text style={{ fontWeight: "bold", fontSize: 18, flex: 1, textAlign: "center", marginRight: 32 }}>Detalhes do Evento</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Event Info Card */}
        <View style={{
          backgroundColor: "#fff",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#f3f4f6",
          padding: 20,
          marginBottom: 24,
          shadowColor: "#000",
          shadowOpacity: 0.03,
          shadowRadius: 2,
          elevation: 1,
        }}>
          <Text style={{ fontWeight: "bold", fontSize: 20, marginBottom: 12 }}>{event.title}</Text>
          <View style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Calendar size={18} color="#888" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 15 }}>{event.date}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Clock size={18} color="#888" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 15 }}>{event.time}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <MapPin size={18} color="#888" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 15 }}>{event.location}</Text>
            </View>
          </View>
          <Divider style={{ marginVertical: 12 }} />
          <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>Seu Departamento</Text>
          <Text style={{ fontSize: 15, marginBottom: 8 }}>{event.department}</Text>
          <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>Sua Função</Text>
          <Text style={{ fontSize: 15, marginBottom: 8 }}>{event.role}</Text>
          <Divider style={{ marginVertical: 12 }} />
          <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>Descrição</Text>
          <Text style={{ fontSize: 15, color: "#444" }}>{event.description}</Text>
        </View>

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
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: "#eafcf3", borderRadius: 14, borderWidth: 1, borderColor: "#d1fae5", padding: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                <CheckCircle2 size={18} color="#22c55e" style={{ marginRight: 6 }} />
                <Text style={{ color: "#15803d", fontWeight: "bold", fontSize: 16 }}>{confirmedCount}</Text>
              </View>
              <Text style={{ color: "#22c55e", fontSize: 13 }}>Confirmados</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "#f6f6f6", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", padding: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                <Circle size={18} color="#888" style={{ marginRight: 6 }} />
                <Text style={{ color: "#444", fontWeight: "bold", fontSize: 16 }}>{totalCount - confirmedCount}</Text>
              </View>
              <Text style={{ color: "#888", fontSize: 13 }}>Pendentes</Text>
            </View>
          </View>
          {/* Members List */}
          <View style={{ gap: 10 }}>
            {members.map((member) => (
              <MemberCard key={member.id} {...member} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Action Buttons */}
      <View style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
        padding: 20,
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
    </SafeAreaView>
  );
}