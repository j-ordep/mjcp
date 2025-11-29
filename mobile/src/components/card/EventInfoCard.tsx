import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Divider } from "react-native-paper";
import { ChevronLeft, MapPin, Calendar, Clock, Users, CheckCircle2, Circle } from "lucide-react-native";
import CardButton from "../../components/button/CardButton";
import MemberCard from "../../components/card/MemberCard";

interface EventInfoCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  department: string;
  role: string;
  description: string;
}

// com {} esta recebendo/acessando uma propriedade pertencente a um objeto
// sem {} acessa um objeto inteiro
export default function EventInfoCard(props: EventInfoCardProps) {
  return (
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
          <Text style={{ fontWeight: "bold", fontSize: 20, marginBottom: 12 }}>{props.title}</Text>
          <View style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Calendar size={18} color="#888" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 15 }}>{props.date}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Clock size={18} color="#888" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 15 }}>{props.time}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <MapPin size={18} color="#888" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 15 }}>{props.location}</Text>
            </View>
          </View>
          <Divider style={{ marginVertical: 12 }} />
          <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>Seu Departamento</Text>
          <Text style={{ fontSize: 15, marginBottom: 8 }}>{props.department}</Text>
          <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>Sua Função</Text>
          <Text style={{ fontSize: 15, marginBottom: 8 }}>{props.role}</Text>
          <Divider style={{ marginVertical: 12 }} />
          <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>Descrição</Text>
          <Text style={{ fontSize: 15, color: "#444" }}>{props.description}</Text>
        </View>
  )
}