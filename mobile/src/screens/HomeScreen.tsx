import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventCard from "../components/EventCard";
import Header from "../components/Header";

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 }}
      edges={['top', 'left', 'right']}
    >
      <Header
        title="Próximo evento"
        onNotificationPress={() => console.log('Notificações')}
        onAvatarPress={() => console.log('Perfil')}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 4 }}>
        <EventCard title="Ensaio da Banda" date="25/11/2025 18:00" role="Cantor" onPress={() => { }} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" role="Músico" onPress={() => { }} />
        <EventCard title="Culto de Celebração" date="27/11/2025 19:00" role="Tecladista" onPress={() => { }} />
        <EventCard title="Ensaio da Banda" date="25/11/2025 18:00" role="Cantor" onPress={() => { }} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" role="Músico" onPress={() => { }} />
        <EventCard title="Culto de Celebração" date="27/11/2025 19:00" role="Tecladista" onPress={() => { }} />
      </ScrollView>
    </SafeAreaView>
  );
}