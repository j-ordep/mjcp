import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Trash2 } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { SelectField } from "../../components/ui/select-field";
import { Text } from "../../components/ui/text";
import { getManageableMinistries } from "../../services/ministryService";
import { useAuthStore } from "../../stores/useAuthStore";
import { colors } from "../../theme/colors";
import type { Ministry } from "../../types/models";
import type { RootStackParamList } from "../../types/navigation";
import { getChurchDate, getMonthDays } from "../../utils/monthlySchedule";

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const weekdayNames = ["domingos", "segundas-feiras", "terças-feiras", "quartas-feiras", "quintas-feiras", "sextas-feiras", "sábados"];
const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
LocaleConfig.locales["pt-BR"] = {
  monthNames: months, monthNamesShort: months.map((month) => month.slice(0, 3)),
  dayNames: ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"],
  dayNamesShort: weekdays, today: "Hoje",
};
LocaleConfig.defaultLocale = "pt-BR";

export default function CreateScheduleScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, session, sessionRevision } = useAuthStore();
  const isAdmin = profile?.role === "admin";
  const today = getChurchDate();
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedRevision, setLoadedRevision] = useState<number | null>(null);
  const [occurrences, setOccurrences] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const requestRevision = useRef(0);
  const draftOwner = useRef({ sessionRevision, ministryId: null as string | null });

  const loadContext = useCallback(async () => {
    const request = ++requestRevision.current;
    const current = () => request === requestRevision.current && sessionRevision === useAuthStore.getState().sessionRevision;
    if (draftOwner.current.sessionRevision !== sessionRevision) {
      draftOwner.current = { sessionRevision, ministryId: null };
      setOccurrences({});
      setShowPreview(false);
      setSelectedMinistryId(null);
    }
    setIsLoading(true);
    setError(null);
    setLoadedRevision(null);
    try {
      if (!session?.user.id) return;
      const result = await getManageableMinistries({ userId: session.user.id, isAdmin });
      if (!current()) return;
      if (result.error) {
        setError("Tente novamente em alguns instantes.");
        setMinistries([]);
        return;
      }
      const available = (result.data ?? []).filter((ministry) => isAdmin || ("is_leader" in ministry && ministry.is_leader));
      const previousId = draftOwner.current.ministryId;
      const nextId = available.length === 1 ? available[0].id : available.some((ministry) => ministry.id === previousId) ? previousId : null;
      if (nextId !== previousId) {
        setOccurrences({});
        setShowPreview(false);
      }
      draftOwner.current.ministryId = nextId;
      setMinistries(available);
      setSelectedMinistryId(nextId);
      setLoadedRevision(sessionRevision);
    } catch {
      if (current()) setError("Tente novamente em alguns instantes.");
    } finally {
      if (current()) setIsLoading(false);
    }
  }, [session?.user.id, isAdmin, sessionRevision]);

  useFocusEffect(useCallback(() => {
    void loadContext();
    return () => { ++requestRevision.current; };
  }, [loadContext]));

  const days = useMemo(() => getMonthDays(month), [month]);
  const selectedMinistry = ministries.find((ministry) => ministry.id === selectedMinistryId);
  const selectedDays = days.filter((day) => day.date >= today && Object.hasOwn(occurrences, day.date));
  const markedDates = Object.fromEntries(selectedDays.map((day) => [day.date, {
    selected: true, selectedColor: colors.primary, selectedTextColor: colors.primaryForeground,
  }]));
  const canManage = loadedRevision === sessionRevision && !error && ministries.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <HeaderSecondary title="Criar escala mensal" onBack={() => navigation.goBack()} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        <View className="gap-1 rounded-xl border border-border bg-muted p-4">
          <Text className="text-sm font-semibold text-foreground">Prévia da escala mensal</Text>
          <Text className="text-sm text-muted-foreground">Esta prévia não é salva nem enviada à equipe. Ao sair desta tela, ela será descartada.</Text>
        </View>
        {isLoading ? <ActivityIndicator accessibilityLabel="Carregando ministérios" color={colors.primary} /> : error ? (
          <View className="gap-3">
            <Text className="text-sm text-destructive">Não foi possível carregar os ministérios. {error}</Text>
            <Button variant="outline" accessibilityLabel="Tentar novamente" onPress={() => void loadContext()}><Text>Tentar novamente</Text></Button>
          </View>
        ) : !canManage ? (
          <Text className="text-sm text-muted-foreground">{isAdmin ? "Nenhum ministério disponível para criar a escala." : "Sem permissão para criar escala. É preciso ser admin ou líder de um ministério."}</Text>
        ) : (
          <>
            <View className="gap-4 rounded-xl border border-border bg-card p-4">
              <Text className="text-lg font-semibold text-foreground">1. Ministério</Text>
              {ministries.length === 1 ? (
                <View testID="fixed-ministry" className="gap-1">
                  <Text className="font-semibold text-foreground">{selectedMinistry?.name}</Text>
                  <Text className="text-sm text-muted-foreground">Seu único ministério disponível já está selecionado.</Text>
                </View>
              ) : <SelectField label="Ministério" value={selectedMinistryId}
                options={ministries.map((ministry) => ({ value: ministry.id, label: ministry.name }))}
                onValueChange={(id) => {
                  if (id === selectedMinistryId || !ministries.some((ministry) => ministry.id === id)) return;
                  draftOwner.current.ministryId = id;
                  setSelectedMinistryId(id);
                  setOccurrences({});
                  setShowPreview(false);
                }} />}
            </View>
            {selectedMinistry ? (
              <>
                <View className="gap-3 rounded-xl border border-border bg-card p-4">
                  <Text className="text-lg font-semibold text-foreground">2. Dias do mês</Text>
                  <Text className="text-sm text-muted-foreground">Marque as datas ou selecione um dia da semana para agilizar. Toque novamente para remover uma exceção.</Text>
                  <Calendar current={`${month}-01`} minDate={today} hideExtraDays disableAllTouchEventsForDisabledDays
                    disableArrowLeft={month === today.slice(0, 7)}
                    markedDates={markedDates}
                    onMonthChange={({ dateString }) => {
                      const nextMonth = dateString.slice(0, 7);
                      if (nextMonth === month || nextMonth < today.slice(0, 7) || !getMonthDays(nextMonth).length) return;
                      setMonth(nextMonth);
                      setOccurrences({});
                      setShowPreview(false);
                    }}
                    onDayPress={({ dateString }) => {
                      if (dateString < today || !days.some((day) => day.date === dateString)) return;
                      setOccurrences((previous) => {
                        const next = { ...previous };
                        if (Object.hasOwn(next, dateString)) delete next[dateString];
                        else next[dateString] = "";
                        return next;
                      });
                    }}
                    theme={{ calendarBackground: colors.surface, dayTextColor: colors.foreground, monthTextColor: colors.foreground, arrowColor: colors.primary, todayTextColor: colors.primary }} />
                  <View className="flex-row flex-wrap gap-1">
                    {weekdays.map((label, weekday) => {
                      const candidates = days.filter((day) => day.weekday === weekday && day.date >= today);
                      const allSelected = candidates.length > 0 && candidates.every((day) => Object.hasOwn(occurrences, day.date));
                      return <Button key={label} variant={allSelected ? "default" : "outline"} size="sm"
                        disabled={!candidates.length} accessibilityLabel={`Selecionar ${weekdayNames[weekday]}`}
                        accessibilityState={{ selected: allSelected }}
                        onPress={() => setOccurrences((previous) => {
                          const next = { ...previous };
                          for (const day of candidates) {
                            if (allSelected) delete next[day.date];
                            else if (!Object.hasOwn(next, day.date)) next[day.date] = "";
                          }
                          return next;
                        })}><Text>{label}</Text></Button>;
                    })}
                  </View>
                  <Text className="text-xs text-muted-foreground">Mudar o mês ou ministério limpa os dias selecionados.</Text>
                  <Button accessibilityLabel="Ver prévia" disabled={!selectedDays.length} onPress={() => setShowPreview(true)}>
                    <Text>Ver prévia · {selectedDays.length} {selectedDays.length === 1 ? "dia" : "dias"}</Text>
                  </Button>
                </View>
                {showPreview ? (
                  <View className="gap-3">
                    <Text className="text-lg font-semibold text-foreground">3. Ocorrências de {months[Number(month.slice(5)) - 1]} de {month.slice(0, 4)}</Text>
                    <Text className="text-sm text-muted-foreground">{selectedMinistry.name} · {selectedDays.length} {selectedDays.length === 1 ? "ocorrência" : "ocorrências"}. Cada dia tem sua própria equipe. O horário é opcional.</Text>
                    {selectedDays.map((day) => (
                      <View key={day.date} className="gap-3 rounded-xl border border-border bg-card p-4">
                        <View className="flex-row items-center justify-between gap-2">
                          <Text className="flex-1 font-semibold capitalize text-foreground">{day.label}</Text>
                          <Button variant="ghost" size="icon" accessibilityLabel={`Remover ${day.label}`} onPress={() => setOccurrences((previous) => {
                            const next = { ...previous };
                            delete next[day.date];
                            return next;
                          })}><Trash2 size={18} color={colors.mutedForeground} /></Button>
                        </View>
                        <Input label="Horário (opcional)" accessibilityLabel={`Horário de ${day.date}`}
                          placeholder="HH:mm" maxLength={5} value={occurrences[day.date]}
                          autoCorrect={false} autoCapitalize="none"
                          error={!!occurrences[day.date] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(occurrences[day.date]) ? "Use HH:mm, como 19:30." : undefined}
                          onChangeText={(value) => setOccurrences((previous) => ({ ...previous, [day.date]: value }))} />
                        <Text className="text-sm text-muted-foreground">Equipe ainda não definida.</Text>
                      </View>
                    ))}
                    {!selectedDays.length ? <Text className="text-sm text-muted-foreground">Selecione ao menos um dia no calendário.</Text> : null}
                  </View>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
