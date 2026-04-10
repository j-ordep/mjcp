import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RefreshCcw } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import {
  acceptSwapRequest,
  cancelOwnSwapRequest,
  getVisibleSwapRequests,
  type SwapRequestReviewItem,
} from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import { formatDateTime } from "../../utils/formatDate";

type Filter = "available" | "mine";

export default function SwapRequestsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session } = useAuthStore();
  const [filter, setFilter] = useState<Filter>("mine");
  const [availableItems, setAvailableItems] = useState<SwapRequestReviewItem[]>([]);
  const [myItems, setMyItems] = useState<SwapRequestReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActingId, setIsActingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await getVisibleSwapRequests();

    if (error) {
      Alert.alert("Erro", error);
      setIsLoading(false);
      return;
    }

    const currentUserId = session?.user?.id;
    const all = data ?? [];

    const nextAvailableItems = all.filter(
      (item) =>
        item.from_assignment?.user_id !== currentUserId &&
        item.status === "pending",
    );

    setAvailableItems(nextAvailableItems);
    setMyItems(
      all.filter(
        (item) =>
          !(
            item.from_assignment?.user_id !== currentUserId &&
            item.status === "pending"
          ),
      ),
    );
    setIsLoading(false);
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests]),
  );

  const pendingAvailableCount = useMemo(() => availableItems.length, [availableItems]);
  const visibleItems = filter === "available" ? availableItems : myItems;

  const handleAccept = (item: SwapRequestReviewItem) => {
    Alert.alert(
      "Aceitar troca",
      "Deseja assumir esta escala? Se outra pessoa aceitar antes, esta solicitação deixará de ficar disponível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aceitar",
          onPress: async () => {
            setIsActingId(item.id);
            const { error } = await acceptSwapRequest(item.id);
            setIsActingId(null);

            if (error) {
              Alert.alert("Nao foi possivel aceitar", error);
              return;
            }

            await loadRequests();
            Alert.alert("Troca aceita", "Voce assumiu esta escala.");
          },
        },
      ],
    );
  };

  const handleCancel = (item: SwapRequestReviewItem) => {
    Alert.alert(
      "Cancelar solicitação",
      "Deseja cancelar esta solicitação de troca?",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Cancelar solicitação",
          style: "destructive",
          onPress: async () => {
            setIsActingId(item.id);
            const { error } = await cancelOwnSwapRequest(item.id);
            setIsActingId(null);

            if (error) {
              Alert.alert("Erro", error);
              return;
            }

            await loadRequests();
            Alert.alert("Solicitação cancelada", "Sua solicitação foi cancelada.");
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      {navigation.canGoBack() ? (
        <HeaderSecondary title="Trocas" onBack={() => navigation.goBack()} />
      ) : (
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
          <Text style={{ fontWeight: "700", fontSize: 20, textAlign: "center" }}>
            Trocas
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32, backgroundColor: "#f8fafc" }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 24,
            padding: 18,
            borderWidth: 1,
            borderColor: "#eef2f7",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 17, marginBottom: 6 }}>
            Fluxo de trocas
          </Text>
          <Text style={{ color: "#6b7280", marginBottom: 12 }}>
            A primeira pessoa elegível que aceitar assume a escala. O líder apenas acompanha e pode agir manualmente se quiser.
          </Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => setFilter("available")}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: filter === "available" ? "#111827" : "#f3f4f6",
              }}
            >
              <Text style={{ textAlign: "center", color: filter === "available" ? "#fff" : "#111827", fontWeight: "700" }}>
                Disponíveis
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilter("mine")}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: filter === "mine" ? "#111827" : "#f3f4f6",
              }}
            >
              <Text style={{ textAlign: "center", color: filter === "mine" ? "#fff" : "#111827", fontWeight: "700" }}>
                Minhas
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <RefreshCcw size={20} color="#6b7280" />
            <Text style={{ color: "#6b7280", marginTop: 10 }}>Carregando solicitações...</Text>
          </View>
        ) : visibleItems.length === 0 ? (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 18,
              borderWidth: 1,
              borderColor: "#eef2f7",
            }}
          >
            <Text style={{ fontWeight: "700", marginBottom: 4 }}>
              {filter === "available" ? "Nenhuma troca disponível" : "Nenhuma solicitação criada"}
            </Text>
            <Text style={{ color: "#6b7280" }}>
              {filter === "available"
                ? "Quando houver uma solicitação compatível com seu ministério e função, ela aparecerá aqui."
                : "As solicitações que você criar aparecerão aqui para acompanhamento."}
            </Text>
          </View>
        ) : (
          visibleItems.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: "#fff",
                borderRadius: 24,
                padding: 18,
                borderWidth: 1,
                borderColor: "#eef2f7",
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontWeight: "700", fontSize: 16 }}>
                  {item.from_assignment?.member_name ?? "Membro"}
                </Text>
                <View
                  style={{
                    backgroundColor:
                      item.status === "approved"
                        ? "#ecfdf5"
                        : item.status === "rejected"
                          ? "#fff1f2"
                          : item.status === "cancelled"
                            ? "#f3f4f6"
                            : "#fff7ed",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                  }}
                >
                  <Text
                    style={{
                      color:
                        item.status === "approved"
                          ? "#166534"
                          : item.status === "rejected"
                            ? "#be123c"
                            : item.status === "cancelled"
                              ? "#4b5563"
                              : "#9a3412",
                      fontWeight: "700",
                      textTransform: "capitalize",
                    }}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={{ color: "#111827", marginBottom: 4 }}>
                Evento: {item.from_assignment?.event_title ?? "Não informado"}
              </Text>
              <Text style={{ color: "#111827", marginBottom: 4 }}>
                Ministério: {item.from_assignment?.ministry_name ?? "Não informado"}
              </Text>
              <Text style={{ color: "#111827", marginBottom: 4 }}>
                Função: {item.from_assignment?.role_name ?? "Não informada"}
              </Text>
              <Text style={{ color: "#6b7280", marginBottom: 4 }}>
                Data: {item.from_assignment ? formatDateTime(item.from_assignment.event_start_at) : "Não informada"}
              </Text>
              <Text style={{ color: "#6b7280", marginBottom: 4 }}>
                Aceito por: {item.to_user?.full_name ?? "Ainda não aceito"}
              </Text>
              <Text style={{ color: "#6b7280", marginBottom: 8 }}>
                Criada em: {formatDateTime(item.created_at)}
              </Text>

              <View
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontWeight: "700", marginBottom: 4 }}>Motivo</Text>
                <Text style={{ color: "#4b5563" }}>
                  {item.reason?.trim() || "Sem motivo informado."}
                </Text>
              </View>

              {filter === "available" && item.status === "pending" ? (
                <TouchableOpacity
                  disabled={isActingId === item.id}
                  onPress={() => handleAccept(item)}
                  style={{
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: "#111827",
                    opacity: isActingId === item.id ? 0.6 : 1,
                  }}
                >
                  <Text style={{ textAlign: "center", color: "#fff", fontWeight: "700" }}>
                    Aceitar troca
                  </Text>
                </TouchableOpacity>
              ) : null}

              {filter === "mine" && item.status === "pending" ? (
                <TouchableOpacity
                  disabled={isActingId === item.id}
                  onPress={() => handleCancel(item)}
                  style={{
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: "#fff1f2",
                    opacity: isActingId === item.id ? 0.6 : 1,
                  }}
                >
                  <Text style={{ textAlign: "center", color: "#be123c", fontWeight: "700" }}>
                    Cancelar solicitação
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}

        {filter === "available" && pendingAvailableCount > 0 ? (
          <Text style={{ color: "#6b7280", textAlign: "center", marginTop: 4 }}>
            {pendingAvailableCount} solicitação(ões) disponível(is) para você no filtro atual.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
