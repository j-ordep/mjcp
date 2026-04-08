import { ChevronRight, Plus } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import DefaultButton from "../button/DefaultButton";
import AssignmentListCard from "./AssignmentListCard";
import type { ScheduleAssignmentDetailed } from "../../services/scheduleService";

interface ScheduleTeamSectionProps {
  scheduleId: string | null;
  isLoadingAssignmentsContext: boolean;
  assignments: ScheduleAssignmentDetailed[];
  rolesCount: number;
  pendingCount: number;
  confirmedCount: number;
  onOpenAddMember: () => void;
  onOpenMemberManagement: () => void;
}

export default function ScheduleTeamSection({
  scheduleId,
  isLoadingAssignmentsContext,
  assignments,
  rolesCount,
  pendingCount,
  confirmedCount,
  onOpenAddMember,
  onOpenMemberManagement,
}: ScheduleTeamSectionProps) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: "#eef2f7",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: scheduleId ? "#111827" : "#e5e7eb",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
          }}
        >
          <Text style={{ color: scheduleId ? "#fff" : "#6b7280", fontWeight: "700", fontSize: 13 }}>
            2
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 17 }}>Montagem da equipe</Text>
          <Text style={{ color: "#6b7280" }}>
            Abra um fluxo separado para adicionar pessoas e definir suas funcoes.
          </Text>
        </View>
      </View>

      {isLoadingAssignmentsContext ? (
        <Text style={{ color: "#888" }}>Carregando membros e funcoes...</Text>
      ) : !scheduleId ? (
        <View
          style={{
            backgroundColor: "#f9fafb",
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: "#eef2f7",
          }}
        >
          <Text style={{ fontWeight: "600", marginBottom: 4 }}>
            Crie a escala para liberar a montagem da equipe
          </Text>
          <Text style={{ color: "#6b7280" }}>
            Depois disso voce podera abrir um modal para adicionar membro + funcao.
          </Text>
        </View>
      ) : (
        <>
          <View
            style={{
              backgroundColor: "#fff8eb",
              borderRadius: 18,
              padding: 14,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: "#fde68a",
            }}
          >
            <Text style={{ color: "#92400e", fontWeight: "700", marginBottom: 4 }}>
              Escala pronta para montagem
            </Text>
            <Text style={{ color: "#92400e" }}>
              O contexto ja foi criado. Agora monte a equipe sem perder o foco da tela principal.
            </Text>
          </View>

          <TouchableOpacity
            onPress={onOpenAddMember}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#111827",
              borderRadius: 20,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: "rgba(255,255,255,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Plus size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16, marginBottom: 4 }}>
                    Abrir fluxo de adicao
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.72)" }}>
                    Adicione membro + funcao em um modal dedicado.
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onOpenMemberManagement}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: 18,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#eef2f7",
            }}
          >
            <Text style={{ fontWeight: "700", marginBottom: 4 }}>Gerenciar membros do ministerio</Text>
            <Text style={{ color: "#6b7280" }}>
              Adicione usuarios ao ministerio e configure as capacidades deles antes de escalar.
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: "#f8fafc", borderRadius: 16, padding: 14 }}>
              <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Pessoas escaladas</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}>{assignments.length}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "#f8fafc", borderRadius: 16, padding: 14 }}>
              <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Funcoes disponiveis</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}>{rolesCount}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: "#fff7ed", borderRadius: 16, padding: 14 }}>
              <Text style={{ color: "#9a3412", fontSize: 12, marginBottom: 4 }}>Pendentes</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#9a3412" }}>{pendingCount}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "#ecfdf5", borderRadius: 16, padding: 14 }}>
              <Text style={{ color: "#166534", fontSize: 12, marginBottom: 4 }}>Confirmados</Text>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#166534" }}>{confirmedCount}</Text>
            </View>
          </View>

          <Text style={{ fontWeight: "700", fontSize: 15, marginBottom: 10 }}>Preview da equipe</Text>
          {assignments.length === 0 ? (
            <View
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor: "#eef2f7",
              }}
            >
              <Text style={{ fontWeight: "600", marginBottom: 4 }}>Nenhum membro escalado ainda</Text>
              <Text style={{ color: "#6b7280", marginBottom: 14 }}>
                O modal vai ajudar voce a adicionar membros com mais contexto e menos ruido visual.
              </Text>
              <DefaultButton onPress={onOpenAddMember}>Adicionar primeiro membro</DefaultButton>
            </View>
          ) : (
            assignments.map((assignment) => (
              <AssignmentListCard key={assignment.id} assignment={assignment} />
            ))
          )}
        </>
      )}
    </View>
  );
}

