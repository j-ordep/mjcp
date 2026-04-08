import { CalendarDays } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "react-native-paper";
import type { Ministry } from "../../types/models";
import type { UserMinistry } from "../../services/ministryService";
import type { Event } from "../../types/models";
import DefaultButton from "../button/DefaultButton";
import ScheduleSummaryCard from "./ScheduleSummaryCard";

type ManageableMinistry = Ministry | UserMinistry;

interface ScheduleContextSectionProps {
  events: Event[];
  ministries: ManageableMinistry[];
  selectedEventId: string | null;
  selectedMinistryId: string | null;
  selectedEvent?: Event;
  selectedMinistry?: ManageableMinistry;
  notes: string;
  isLoadingMinistries: boolean;
  isLoadingSchedule: boolean;
  scheduleId: string | null;
  onSelectEvent: (eventId: string) => void;
  onSelectMinistry: (ministryId: string) => void;
  onChangeNotes: (value: string) => void;
  onSubmit: () => void;
  formatDateTime: (value: string) => string;
}

export default function ScheduleContextSection({
  events,
  ministries,
  selectedEventId,
  selectedMinistryId,
  selectedEvent,
  selectedMinistry,
  notes,
  isLoadingMinistries,
  isLoadingSchedule,
  scheduleId,
  onSelectEvent,
  onSelectMinistry,
  onChangeNotes,
  onSubmit,
  formatDateTime,
}: ScheduleContextSectionProps) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 18,
        marginBottom: 18,
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
            backgroundColor: "#111827",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>1</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 17 }}>Contexto da escala</Text>
          <Text style={{ color: "#6b7280" }}>
            Escolha o evento e o ministerio antes de escalar pessoas.
          </Text>
        </View>
      </View>

      <Text style={{ fontWeight: "600", marginBottom: 10 }}>Evento</Text>
      <View style={{ marginBottom: 18 }}>
        {events.length === 0 ? (
          <Text style={{ color: "#888" }}>Nenhum evento futuro encontrado.</Text>
        ) : (
          events.map((event) => {
            const selected = selectedEventId === event.id;
            return (
              <TouchableOpacity
                key={event.id}
                onPress={() => onSelectEvent(event.id)}
                activeOpacity={0.85}
                style={{
                  borderWidth: 1.5,
                  borderColor: selected ? "#111827" : "#e5e7eb",
                  borderRadius: 18,
                  padding: 14,
                  marginBottom: 10,
                  backgroundColor: selected ? "#f9fafb" : "#fff",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", marginBottom: 4, fontSize: 15 }}>
                      {event.title}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <CalendarDays size={14} color="#6b7280" />
                      <Text style={{ color: "#6b7280", fontSize: 13, marginLeft: 6 }}>
                        {formatDateTime(event.start_at)}
                      </Text>
                    </View>
                  </View>
                  {selected ? (
                    <View
                      style={{
                        alignSelf: "flex-start",
                        backgroundColor: "#111827",
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 999,
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                        Selecionado
                      </Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <Text style={{ fontWeight: "600", marginBottom: 10 }}>Ministerio</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
        {isLoadingMinistries ? (
          <Text style={{ color: "#888" }}>Carregando ministerios...</Text>
        ) : ministries.length === 0 ? (
          <Text style={{ color: "#888" }}>Nenhum ministerio disponivel para criacao.</Text>
        ) : (
          ministries.map((ministry) => {
            const selected = selectedMinistryId === ministry.id;
            return (
              <TouchableOpacity
                key={ministry.id}
                onPress={() => onSelectMinistry(ministry.id)}
                activeOpacity={0.85}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: selected ? "#111827" : "#f3f4f6",
                }}
              >
                <Text style={{ color: selected ? "#fff" : "#111827", fontWeight: "600" }}>
                  {ministry.name}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <TextInput
        mode="outlined"
        label="Observacoes da escala (opcional)"
        value={notes}
        onChangeText={onChangeNotes}
        multiline
        numberOfLines={4}
        style={{ marginBottom: 18, backgroundColor: "#fff" }}
        activeOutlineColor="#111827"
        outlineColor="#d1d5db"
      />

      {selectedEvent || selectedMinistry ? (
        <ScheduleSummaryCard
          eventTitle={selectedEvent?.title}
          eventDate={selectedEvent ? formatDateTime(selectedEvent.start_at) : null}
          ministryName={selectedMinistry?.name}
          notes={notes || null}
        />
      ) : null}

      <DefaultButton onPress={onSubmit} isLoading={isLoadingSchedule}>
        {scheduleId ? "Atualizar contexto da escala" : "Criar escala"}
      </DefaultButton>
    </View>
  );
}
