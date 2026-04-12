import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Divider, Modal, Portal, Text } from "react-native-paper";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from "../../services/notificationService";
import { formatDateTime } from "../../utils/formatDate";
import DefaultButton from "../button/DefaultButton";

interface NotificationsModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function NotificationsModal({
  visible,
  onDismiss,
}: NotificationsModalProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadNotifications = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await getNotifications();
    if (error) {
      setNotifications([]);
      setErrorMessage(error);
      setIsLoading(false);
      return;
    }

    setNotifications(data ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!visible) return;
    void loadNotifications();
  }, [visible]);

  const handleNotificationPress = async (notification: AppNotification) => {
    if (!notification.read) {
      const { error } = await markNotificationAsRead(notification.id);
      if (!error) {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, read: true } : item,
          ),
        );
      }
    }

    onDismiss();

    if (notification.type === "swap_request") {
      navigation.navigate("SwapRequests");
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllAsRead(true);

    const { error } = await markAllNotificationsAsRead();
    setIsMarkingAllAsRead(false);

    if (error) {
      setErrorMessage(error);
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  };

  const allRead =
    notifications.length > 0 && notifications.every((notification) => notification.read);

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
        <View style={{ marginBottom: 10 }}>
          <Text
            variant="titleMedium"
            style={{ textAlign: "center", paddingBottom: 4 }}
          >
            Notificacoes
          </Text>
          <TouchableOpacity
            disabled={isMarkingAllAsRead || allRead}
            onPress={() => void handleMarkAllAsRead()}
          >
            <Text style={{ textAlign: "center", color: "#2563eb", fontSize: 13 }}>
              {isMarkingAllAsRead ? "Marcando..." : "Marcar todas como lidas"}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <ActivityIndicator size="small" color="#000" />
          </View>
        ) : errorMessage ? (
          <View style={{ paddingVertical: 16 }}>
            <Text style={{ textAlign: "center", color: "#b91c1c", marginBottom: 12 }}>
              {errorMessage}
            </Text>
            <DefaultButton variant="outline" onPress={() => void loadNotifications()}>
              Tentar novamente
            </DefaultButton>
          </View>
        ) : notifications.length === 0 ? (
          <Text>Nenhuma notificacao no momento.</Text>
        ) : (
          <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
            {notifications.map((notification, idx) => (
              <TouchableOpacity
                activeOpacity={0.8}
                key={notification.id}
                onPress={() => void handleNotificationPress(notification)}
              >
                <View
                  style={{
                    backgroundColor: notification.read ? "#f3f4f6" : "#eff6ff",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: "#000",
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                    elevation: 1,
                    borderWidth: notification.read ? 0 : 1,
                    borderColor: notification.read ? "transparent" : "#bfdbfe",
                  }}
                >
                  <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                    {notification.title}
                  </Text>
                  <Text style={{ color: "#2563eb", marginBottom: 2 }}>
                    {formatDateTime(notification.created_at)}
                  </Text>
                  {notification.body ? (
                    <Text style={{ color: "#444" }}>{notification.body}</Text>
                  ) : null}
                  {!notification.read ? (
                    <Text style={{ color: "#1d4ed8", fontSize: 12, marginTop: 8 }}>
                      Toque para abrir
                    </Text>
                  ) : null}
                  {idx < notifications.length - 1 ? (
                    <Divider style={{ marginTop: 12 }} />
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View className="mt-2">
          <DefaultButton variant="primary" onPress={onDismiss}>
            Fechar
          </DefaultButton>
        </View>
      </Modal>
    </Portal>
  );
}
