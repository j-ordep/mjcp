import { Calendar, Clock, MapPin } from "lucide-react-native";
import { View } from "react-native";
import { Divider, Text } from "react-native-paper";

interface EventInfoCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  department?: string;
  role?: string;
  description: string;
  isAssigned?: boolean;
}

export default function EventInfoCard({ 
  title, 
  date, 
  time, 
  location, 
  department, 
  role, 
  description,
  isAssigned = false
}: EventInfoCardProps) {
  return (
    <View style={{
      backgroundColor: "#fff",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#f3f4f6",
      padding: 20,
      marginBottom: 24,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    }}>
      <Text style={{ fontWeight: "bold", fontSize: 20, marginBottom: 12 }}>{title}</Text>
      <View style={{ marginBottom: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <Calendar size={18} color="#888" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 15 }}>{date}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <Clock size={18} color="#888" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 15 }}>{time}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <MapPin size={18} color="#888" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 15 }}>{location}</Text>
        </View>
      </View>
      
      {isAssigned && (
        <>
          <Divider style={{ marginVertical: 12 }} />
          <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>Escalado para:</Text>
          <Text style={{ fontSize: 15, marginBottom: 8, fontWeight: '500' }}>{department}</Text>
          <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>Função:</Text>
          <Text style={{ fontSize: 15, marginBottom: 8, fontWeight: '500' }}>{role}</Text>
        </>
      )}

      <Divider style={{ marginVertical: 12 }} />
      <Text style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>Descrição</Text>
      <Text style={{ fontSize: 15, color: "#444" }}>{description}</Text>
    </View>
  );
}
