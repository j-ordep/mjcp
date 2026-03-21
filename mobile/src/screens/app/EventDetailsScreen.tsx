import { Edit, Info, Users } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import DefaultButton from "../../components/button/DefaultButton";
import EventInfoCard from "../../components/card/EventInfoCard";
import MemberCard from "../../components/card/MemberCard";
import TeamStatusCard from "../../components/card/TeamStatusCard";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import {
  AssignmentWithDetails,
  getAssignmentsByEvent,
} from "../../services/scheduleService";
import { useAuthStore } from "../../stores/useAuthStore";
import { formatDateShort, formatTime } from "../../utils/formatDate";

export default function EventDetailsScreen({ route, navigation }) {
  const { event } = route.params; // Recebe o objeto event completo da lista
  const { profile } = useAuthStore();

  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = profile?.role === "admin";

  // Verifica se o usuário logado está escalado neste evento
  // PostgREST retorna profiles como array; [0] pega o único perfil
  const myAssignment = assignments.find((a) => a.user_id === profile?.id);
  const isAssigned = !!myAssignment;
  const myRole = myAssignment?.ministry_roles?.[0]?.name;
  const myMinistry = myAssignment?.ministry_roles?.[0]?.ministries?.[0]?.name;

  useEffect(() => {
    fetchAssignments();
  }, [event.id]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    const { data, error } = await getAssignmentsByEvent(event.id);
    if (!error && data) {
      setAssignments(data);
    }
    setIsLoading(false);
  };

  const confirmedCount = assignments.filter(
    (a) => a.status === "confirmed",
  ).length;
  const totalCount = assignments.length;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["top", "left", "right"]}
    >
      <HeaderSecondary
        title="Detalhes"
        onBack={() => navigation.goBack()}
        rightIcon={isAdmin ? <Edit size={22} color="#000" /> : undefined}
        onRightPress={
          isAdmin
            ? () =>
                navigation.navigate("CreateEvent", {
                  mode: "edit",
                  eventId: event.id,
                  initialData: event,
                })
            : undefined
        }
      />

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <EventInfoCard
          title={event.title}
          date={formatDateShort(event.start_at)}
          time={formatTime(event.start_at)}
          location={event.location || "Não informado"}
          description={event.description || "Sem descrição."}
          isAssigned={isAssigned}
          department={myMinistry}
          role={myRole}
        />

        {isLoading ? (
          <ActivityIndicator
            size="small"
            color="#000"
            style={{ marginVertical: 20 }}
          />
        ) : assignments.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                Equipe Escalada
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Users size={16} color="#888" style={{ marginRight: 4 }} />
                <Text style={{ color: "#888", fontSize: 14 }}>
                  {confirmedCount}/{totalCount} confirmados
                </Text>
              </View>
            </View>

            <TeamStatusCard
              confirmed={confirmedCount}
              pending={totalCount - confirmedCount}
            />

            <View style={{ gap: 10, marginTop: 15 }}>
              {assignments.map((assignment) => (
                <MemberCard
                  key={assignment.id}
                  name={assignment.profiles?.[0]?.full_name || "Membro"}
                  role={assignment.ministry_roles?.[0]?.name || "Vaga"}
                  photo={assignment.profiles?.[0]?.avatar_url ?? undefined}
                  confirmed={assignment.status === "confirmed"}
                />
              ))}
            </View>
          </View>
        ) : (
          <View
            style={{
              padding: 20,
              alignItems: "center",
              backgroundColor: "#f9fafb",
              borderRadius: 16,
              marginBottom: 24,
            }}
          >
            <Info size={24} color="#666" style={{ marginBottom: 8 }} />
            <Text style={{ color: "#666", textAlign: "center" }}>
              Este evento ainda não possui uma equipe escalada.
            </Text>
          </View>
        )}

        {/* Action Buttons for Assigned Users */}
        {isAssigned && (
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <DefaultButton
                variant="outline"
                onPress={() =>
                  Alert.alert(
                    "Indisponível",
                    "Funcionalidade de troca em breve",
                  )
                }
              >
                Preciso trocar
              </DefaultButton>
            </View>
            <View style={{ flex: 1 }}>
              {/* TODO: integrar com scheduleService.confirmPresence(myAssignment.id) */}
              <DefaultButton
                variant="primary"
                onPress={() =>
                  Alert.alert(
                    "Em breve",
                    "Confirmação de presença será integrada em breve.",
                  )
                }
                isLoading={false}
              >
                Confirmar presença
              </DefaultButton>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
