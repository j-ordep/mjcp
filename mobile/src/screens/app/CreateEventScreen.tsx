import { colors } from "../../theme/colors";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  TouchableOpacity as RNTouchableOpacity,
  View,
} from "react-native";
import { Chip } from "react-native-paper";
import { SelectField } from "../../components/ui/select-field";
import { Text } from "../../components/ui/text";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar as CalendarIcon, Clock, Sparkles } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import DefaultButton from "../../components/button/DefaultButton";
import type {
  CreateEventScreenProps,
  RootStackParamList,
} from "../../types/navigation";
import { getEventEditorData } from "../../services/eventService";
import { getLinkedReservationForEvent } from "../../services/roomReservationService";
import {
  getProfilesByIds,
  type SearchableProfile,
} from "../../services/profileService";
import { useAuthStore } from "../../stores/useAuthStore";
import { useEventStore } from "../../stores/useEventStore";
import {
  collapseCalendarSelectionToSingleDate,
  createCalendarSelectionMark,
  type CalendarSelectionMark,
  toggleCalendarDateSelection,
} from "../../utils/eventCalendarSelection";
import {
  buildUtcRangeFromLocalForm,
  formatLocalDateKey,
  formatTimeFromDate,
  getNow,
} from "../../utils/eventDate";
import {
  EVENT_CATEGORY_OPTIONS,
  type EventCategory,
  normalizeEventCategory,
} from "../../utils/eventCategory";
import { canManageEvents as canManageEventsForProfile } from "../../utils/eventPermissions";
import { getRoomIdForEditSave } from "../../utils/roomAvailability";
import type { Event } from "../../types/models";

import EventRoomSection, {
  type EventRoomSelection,
} from "../../components/events/EventRoomSection";
import EventAudienceSection from "../../components/events/EventAudienceSection";
import EventDateModal from "../../components/events/EventDateModal";

const PRESETS = [
  {
    id: "culto-familia",
    label: "Culto da Família",
    title: "Culto da Família",
    category: "culto" as EventCategory,
    time: "18:00",
    location: "Templo",
    description: "Culto da Família",
  },
  {
    id: "culto-jovens",
    label: "Culto Jovem",
    title: "Culto Jovem",
    category: "jovens" as EventCategory,
    time: "19:00",
    location: "Templo",
    description: "Culto jovem",
  },
  {
    id: "culto-cura-libertacao",
    label: "Culto de cura e libertação",
    title: "Culto de cura e libertação",
    category: "culto" as EventCategory,
    time: "19:30",
    location: "Templo",
    description: "Culto de cura e libertação",
  },
];

function getEventDateLabel(
  selectedDays: Record<string, CalendarSelectionMark>,
) {
  const dates = Object.keys(selectedDays);

  if (dates.length === 0) return "Selecione a data";

  if (dates.length === 1) {
    const [year, month, day] = dates[0].split("-");
    return `${day}/${month}/${year}`;
  }

  return `${dates.length} datas selecionadas`;
}

function scrollToAudienceSection(
  scrollViewRef: React.RefObject<ScrollView | null>,
  audienceSectionY: number,
) {
  setTimeout(() => {
    if (audienceSectionY > 0) {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, audienceSectionY - 24),
        animated: true,
      });
      return;
    }

    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, 120);
}

function isValidTimeValue(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());

  if (!match) {
    return false;
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function buildSingleEventWindow(dateKey: string, time: string) {
  const result = buildUtcRangeFromLocalForm({
    dateKey,
    startTime: time,
  });

  return result.data;
}

export default function CreateEventScreen({ route }: CreateEventScreenProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, sessionRevision } = useAuthStore();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const audienceSectionYRef = useRef(0);
  const params = route.params || {};
  const isEdit = params.mode === "edit";
  const eventId = params.eventId;
  const initialData = params.initialData;

  const {
    createBatchEvents,
    createEventWithRoom,
    updateEventWithRoom,
    isLoadingEvents,
  } = useEventStore();
  const canManageEvents = canManageEventsForProfile(profile);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<EventCategory>("geral");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState(() => formatTimeFromDate(getNow()));
  const [isPublic, setIsPublic] = useState(true);
  const [selectedAudience, setSelectedAudience] = useState<SearchableProfile[]>(
    [],
  );
  const [isHydratingEvent, setIsHydratingEvent] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [allowMultipleDates, setAllowMultipleDates] = useState(false);
  const [selectedDays, setSelectedDays] = useState<
    Record<string, CalendarSelectionMark>
  >(() => {
    const todayKey = formatLocalDateKey(getNow());
    return { [todayKey]: createCalendarSelectionMark() };
  });
  const [currentReservedRoomId, setCurrentReservedRoomId] = useState<
    string | null
  >(null);
  const [roomSelection, setRoomSelection] = useState<EventRoomSelection>({
    selectedRoomId: null,
    hasManualRoomSelectionChange: false,
    isRoomSelectionAutoCleared: false,
  });

  const selectedDateKeys = useMemo(
    () => Object.keys(selectedDays),
    [selectedDays],
  );
  const isMultipleDateSelectionEnabled = !isEdit && allowMultipleDates;
  const singleSelectedDateKey =
    selectedDateKeys.length === 1 ? selectedDateKeys[0] : null;
  const roomWindow = useMemo(
    () =>
      singleSelectedDateKey
        ? buildSingleEventWindow(singleSelectedDateKey, time)
        : null,
    [singleSelectedDateKey, time],
  );

  const applyEventToForm = (
    event: Pick<
      Event,
      | "title"
      | "category"
      | "description"
      | "location"
      | "is_public"
      | "start_at"
    >,
  ) => {
    setTitle(event.title);
    setCategory(normalizeEventCategory(event.category));
    setDescription(event.description || "");
    setLocation(event.location || "");
    setIsPublic(event.is_public !== false);

    const date = new Date(event.start_at);
    setTime(formatTimeFromDate(date));

    const dateKey = formatLocalDateKey(date);
    setAllowMultipleDates(false);
    setSelectedDays({ [dateKey]: createCalendarSelectionMark() });
  };

  useEffect(() => {
    if (profile && !canManageEvents) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("EventsScreen");
      }
    }
  }, [canManageEvents, navigation, profile]);

  useEffect(() => {
    if (!isEdit || !eventId) {
      setCurrentReservedRoomId(null);
      setRoomSelection({
        selectedRoomId: null,
        hasManualRoomSelectionChange: false,
        isRoomSelectionAutoCleared: false,
      });
      return;
    }

    let isMounted = true;

    if (initialData) {
      applyEventToForm(initialData);
    }

    setSelectedAudience([]);

    const hydrateEvent = async () => {
      setIsHydratingEvent(true);

      const [eventResult, linkedReservationResult] = await Promise.all([
        getEventEditorData(eventId),
        getLinkedReservationForEvent(eventId),
      ]);

      if (
        !isMounted ||
        sessionRevision !== useAuthStore.getState().sessionRevision
      ) {
        return;
      }

      if (eventResult.error || !eventResult.data) {
        Alert.alert("Erro", "Não foi possível carregar o evento para edição.");
        setIsHydratingEvent(false);
        return;
      }

      if (linkedReservationResult.error) {
        Alert.alert(
          "Erro",
          "Não foi possível carregar a sala vinculada a este evento.",
        );
        setIsHydratingEvent(false);
        return;
      }

      applyEventToForm(eventResult.data.event);

      const linkedRoomId = linkedReservationResult.data?.room_id ?? null;
      setCurrentReservedRoomId(linkedRoomId);
      setRoomSelection({
        selectedRoomId: linkedRoomId,
        hasManualRoomSelectionChange: false,
        isRoomSelectionAutoCleared: false,
      });

      if (eventResult.data.visible_to_user_ids.length === 0) {
        setSelectedAudience([]);
        setIsHydratingEvent(false);
        return;
      }

      const profilesResult = await getProfilesByIds(
        eventResult.data.visible_to_user_ids,
      );
      if (
        !isMounted ||
        sessionRevision !== useAuthStore.getState().sessionRevision
      ) {
        return;
      }

      if (profilesResult.error) {
        Alert.alert(
          "Erro",
          "Não foi possível carregar a lista de membros deste evento.",
        );
        setIsHydratingEvent(false);
        return;
      }

      setSelectedAudience(profilesResult.data ?? []);
      setIsHydratingEvent(false);
    };

    void hydrateEvent();

    return () => {
      isMounted = false;
    };
  }, [eventId, initialData, isEdit, sessionRevision]);

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setTime(preset.time);
    setLocation(preset.location);
    setDescription(preset.description);
  };

  const onDayPress = (day: { dateString: string }) => {
    setSelectedDays((current) =>
      toggleCalendarDateSelection({
        selectedDays: current,
        dateString: day.dateString,
        allowMultipleDates: isMultipleDateSelectionEnabled,
        isEdit,
      }),
    );
  };

  const handleToggleMultipleDates = () => {
    if (isEdit) return;

    setAllowMultipleDates((current) => {
      const nextValue = !current;

      if (!nextValue) {
        setSelectedDays((previousSelection) =>
          collapseCalendarSelectionToSingleDate(previousSelection),
        );
      }

      return nextValue;
    });
  };

  const handleTimeChange = (text: string) => {
    let clean = text.replace(/\D/g, "");
    if (clean.length > 4) clean = clean.substring(0, 4);

    let formatted = clean;
    if (clean.length > 2) {
      formatted = `${clean.substring(0, 2)}:${clean.substring(2)}`;
    }

    setTime(formatted);
  };

  const handleTimeBlur = () => {
    if (!time) return;

    let clean = time.replace(/\D/g, "");
    let hours = "19";
    let minutes = "00";

    if (clean.length <= 2) {
      hours = clean.padStart(2, "0");
    } else if (clean.length === 3) {
      hours = clean.substring(0, 1).padStart(2, "0");
      minutes = clean.substring(1).padStart(2, "0");
    } else if (clean.length >= 4) {
      hours = clean.substring(0, 2);
      minutes = clean.substring(2, 4);
    }

    const hoursNumber = parseInt(hours, 10);
    const minutesNumber = parseInt(minutes, 10);

    if (hoursNumber > 23) hours = "23";
    if (minutesNumber > 59) minutes = "59";

    setTime(`${hours}:${minutes}`);
  };

  const handleVisibilityChange = (nextIsPublic: boolean) => {
    setIsPublic(nextIsPublic);

    if (!nextIsPublic) {
      scrollToAudienceSection(scrollViewRef, audienceSectionYRef.current);
    }
  };

  const handleAudienceSectionLayout = (event: LayoutChangeEvent) => {
    audienceSectionYRef.current = event.nativeEvent.layout.y;
  };

  const handleSave = async () => {
    if (!canManageEvents) {
      Alert.alert(
        "Acesso negado",
        "Você não tem permissão para gerenciar eventos.",
      );
      return;
    }

    if (isEdit && !eventId) {
      Alert.alert("Erro", "Evento inválido para edição.");
      return;
    }

    if (!title.trim() || selectedDateKeys.length === 0 || !time.trim()) {
      Alert.alert("Erro", "Título, data e hora são obrigatórios.");
      return;
    }

    if (!isValidTimeValue(time)) {
      Alert.alert("Erro", "Informe uma hora válida no formato HH:MM.");
      return;
    }

    const eventFields = {
      title: title.trim(),
      category,
      description,
      location,
      is_public: isPublic,
      visible_to_user_ids: selectedAudience.map((profile) => profile.id),
    };

    if (selectedDateKeys.length === 1) {
      const dateKey = selectedDateKeys[0];
      const eventWindow = buildSingleEventWindow(dateKey, time);

      if (!eventWindow) {
        Alert.alert("Erro", "Não foi possível montar a data e hora do evento.");
        return;
      }

      const payload = {
        ...eventFields,
        start_at: eventWindow.startAt,
        end_at: eventWindow.endAt,
      };

      if (isEdit && eventId) {
        const roomIdForSave = getRoomIdForEditSave(roomSelection);
        const { error } = await updateEventWithRoom(
          eventId,
          payload,
          roomIdForSave,
        );

        if (error) {
          Alert.alert(
            "Erro ao atualizar",
            "Não foi possível atualizar o evento agora.",
          );
          return;
        }

        navigation.goBack();
        return;
      }

      const { error } = await createEventWithRoom(
        payload,
        roomSelection.selectedRoomId,
      );

      if (error) {
        Alert.alert(
          "Erro ao criar evento",
          "Não foi possível criar o evento agora.",
        );
        return;
      }

      navigation.goBack();
      return;
    }

    const eventsToCreate = selectedDateKeys.map((dateKey) => {
      const eventWindow = buildSingleEventWindow(dateKey, time);

      if (!eventWindow) {
        throw new Error("Não foi possível montar a data e hora do evento.");
      }

      return {
        ...eventFields,
        start_at: eventWindow.startAt,
        end_at: eventWindow.endAt,
      };
    });

    const { error } = await createBatchEvents(eventsToCreate);

    if (error) {
      Alert.alert(
        "Erro ao criar eventos",
        "Não foi possível criar os eventos agora.",
      );
      return;
    }

    navigation.goBack();
  };

  if (!canManageEvents) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <HeaderSecondary
        title={isEdit ? "Editar Evento" : "Novo Evento"}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: isPublic ? 280 : 180,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          pointerEvents={isHydratingEvent ? "none" : "auto"}
          scrollEnabled={!isHydratingEvent}
        >
          {isHydratingEvent ? (
            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                marginBottom: 16,
              }}
            >
              Carregando dados mais recentes do evento...
            </Text>
          ) : null}
          {!isEdit ? (
            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                  gap: 6,
                }}
              >
                <Sparkles size={16} color={colors.mutedForeground} />
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.mutedForeground,
                    fontWeight: "bold",
                  }}
                >
                  SUGESTÕES GERAIS
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {PRESETS.map((preset) => (
                  <Chip
                    key={preset.id}
                    onPress={() => applyPreset(preset)}
                    style={{ backgroundColor: colors.muted }}
                    textStyle={{ fontSize: 13 }}
                  >
                    {preset.label}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Input
            label="Título do evento"
            value={title}
            onChangeText={setTitle}
            containerStyle={{ marginBottom: 15 }}
          />

          <SelectField label="Categoria" value={category}
            options={EVENT_CATEGORY_OPTIONS}
            onValueChange={(value) => setCategory(normalizeEventCategory(value))}
            containerStyle={{ marginBottom: 15 }} />

          <Input
            label="Localização"
            value={location}
            onChangeText={setLocation}
            containerStyle={{ marginBottom: 15 }}
          />

          <RNTouchableOpacity
            style={{ marginBottom: 15 }}
            onPress={() => setShowCalendar(true)}
            activeOpacity={0.7}
          >
            <View pointerEvents="none">
              <Input
                label="Data do evento"
                value={getEventDateLabel(selectedDays)}
                editable={false}
                right={
                  <CalendarIcon size={20} color={colors.mutedForeground} />
                }
              />
            </View>
          </RNTouchableOpacity>

          <Input
            label="Hora"
            value={time}
            onChangeText={handleTimeChange}
            onBlur={handleTimeBlur}
            containerStyle={{ marginBottom: 15 }}
            placeholder="Ex: 19:00"
            keyboardType="number-pad"
            right={
              <Clock size={20} color={colors.mutedForeground} />
            }
          />

          <EventRoomSection
            key={eventId ?? "new-event"}
            singleSelectedDateKey={singleSelectedDateKey}
            window={roomWindow}
            isHydrating={isHydratingEvent}
            selection={roomSelection}
            currentReservedRoomId={currentReservedRoomId}
            eventId={eventId}
            onSelectionChange={setRoomSelection}
          />

          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              DESCRIÇÃO
            </Text>
            <Textarea
              label="Descrição"
              value={description}
              onChangeText={setDescription}
              containerStyle={{ marginBottom: 15 }}
            />
          </View>

          <EventAudienceSection
            key={eventId ?? "new-event"}
            isPublic={isPublic}
            selectedAudience={selectedAudience}
            onVisibilityChange={handleVisibilityChange}
            onAudienceChange={setSelectedAudience}
            onSectionLayout={handleAudienceSectionLayout}
            onSearchFocus={() =>
              scrollToAudienceSection(
                scrollViewRef,
                audienceSectionYRef.current,
              )
            }
          />

          <DefaultButton
            onPress={() => void handleSave()}
            variant="primary"
            isLoading={isLoadingEvents || isHydratingEvent}
          >
            {isEdit
              ? "Atualizar Evento"
              : selectedDateKeys.length > 1
                ? `Criar ${selectedDateKeys.length} Eventos`
                : "Criar Evento"}
          </DefaultButton>
        </ScrollView>
      </KeyboardAvoidingView>

      <EventDateModal
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
        isEdit={isEdit}
        isMultipleDateSelectionEnabled={isMultipleDateSelectionEnabled}
        handleToggleMultipleDates={handleToggleMultipleDates}
        onDayPress={onDayPress}
        selectedDays={selectedDays}
      />
    </SafeAreaView>
  );
}
