import { ScrollView, View } from "react-native";
import { Divider, Modal, Portal, Text } from "react-native-paper";
import DefaultButton from "../button/DefaultButton";

interface NotificationsModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const notifications = [
  {
    id: 1,
    title: "Novo evento disponível",
    description: "Você foi escalado para o Culto de Domingo às 10:00.",
    date: "25/11/2025",
  },
  {
    id: 2,
    title: "Confirmação pendente",
    description: "Confirme sua presença no Ensaio da Banda.",
    date: "24/11/2025",
  },
  {
    id: 3,
    title: "Mudança de horário",
    description: "A reunião de obreiros foi alterada para 19:30.",
    date: "23/11/2025",
  },
  {
    id: 4,
    title: "Mudança de horário",
    description: "A reunião de obreiros foi alterada para 19:30.",
    date: "23/11/2025",
  },
  {
    id: 5,
    title: "Mudança de horário",
    description: "A reunião de obreiros foi alterada para 19:30.",
    date: "23/11/2025",
  },
];

export default function NotificationsModal({ visible, onDismiss }: NotificationsModalProps) {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          margin: 32,
          backgroundColor: "#fff",
          borderRadius: 30,
          padding: 24,
          maxHeight: 500,
        }}
      >
        <Text variant="titleMedium" style={{ textAlign: "center", paddingBottom: 10 }}>Notificações</Text>
        {notifications.length === 0 ? (
          <Text>Nenhuma notificação no momento.</Text>
        ) : (
          <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
            {notifications.map((n, idx) => (
              <View
                key={n.id}
                style={{
                  backgroundColor: "#f3f4f6",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <Text style={{ fontWeight: "bold", marginBottom: 4 }}>{n.title}</Text>
                <Text style={{ color: "#2563eb", marginBottom: 2 }}>{n.date}</Text>
                <Text style={{ color: "#444" }}>{n.description}</Text>
                {idx < notifications.length - 1 && (
                  <Divider style={{ marginTop: 12 }} />
                )}
              </View>
            ))}
          </ScrollView>
        )}
        <View className="mt-2">
          <DefaultButton variant="primary" onPress={onDismiss}>Fechar</DefaultButton>
        </View>
        {/* <Button style={{ marginTop: 24 }} mode="contained" onPress={onDismiss}>Fechar</Button> */}
      </Modal>
    </Portal>
  );
}