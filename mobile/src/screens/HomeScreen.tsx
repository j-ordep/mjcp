import { View, ScrollView } from "react-native";
import EventCard from "../components/EventCard";
import Header from "../components/Header";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-white px-4">
      
      <Header 
        title="Próximo evento"
        onNotificationPress={() => console.log('Notificações')}
        onAvatarPress={() => console.log('Perfil')}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 4 }}>
        <EventCard title="Ensaio da Banda" date="25/11/2025 18:00" onPress={() => {}} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" onPress={() => {}} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" onPress={() => {}} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" onPress={() => {}} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" onPress={() => {}} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" onPress={() => {}} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" onPress={() => {}} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" onPress={() => {}} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" onPress={() => {}} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" onPress={() => {}} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" onPress={() => {}} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" onPress={() => {}} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" onPress={() => {}} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" onPress={() => {}} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" onPress={() => {}} />
        <EventCard title="Reunião de Obreiros" date="26/11/2025 19:00" onPress={() => {}} />
      </ScrollView>

    </View>
  );
}