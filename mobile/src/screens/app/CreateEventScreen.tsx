import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity as RNTouchableOpacity,
  View,
} from "react-native";
import { Button, Checkbox, Chip, Divider, Switch, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { Calendar as CalendarIcon, Clock, Search, Sparkles, X } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import HeaderSecondary from "../../components/Header/HeaderSecondary";
import DefaultButton from "../../components/button/DefaultButton";
import type {
  CreateEventScreenProps,
  RootStackParamList,
} from "../../navigation/AppNavigator";
import { getEventEditorData } from "../../services/eventService";
import {
  getLinkedReservationForEvent,
  getRoomsForWindow,
  type RoomAvailability,
} from "../../services/roomReservationService";
import {
  getProfilesByIds,
  listProfilesPage,
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
  getEventCategoryLabel,
  type EventCategory,
  normalizeEventCategory,
} from "../../utils/eventCategory";
import { canManageEvents as canManageEventsForProfile } from "../../utils/eventPermissions";
import {
  getRoomIdForEditSave,
  isRoomSelectable,
  reconcileRoomSelection,
  shouldApplyAvailabilityResponse,
} from "../../utils/roomAvailability";
import { resolveAudienceResponse } from "../../utils/audienceResults";
import type { Event } from "../../types/models";

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

function getEventDateLabel(selectedDays: Record<string, CalendarSelectionMark>) {
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

function formatReservationSummary(room: RoomAvailability, currentEventId?: string) {
  const reservation = room.reservation;

  if (!reservation) {
    return "Disponível neste horário.";
  }

  const startAt = new Date(reservation.start_at);
  const endAt = new Date(reservation.end_at);
  const timeLabel =
    Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())
      ? ""
      : `${startAt.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })} - ${endAt.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}`;

  if (reservation.event_id && reservation.event_id === currentEventId) {
    return `Sala já vinculada a este evento${timeLabel ? ` · ${timeLabel}` : ""}.`;
  }

  const title = reservation.purpose?.trim() || "Reserva ativa";
  const category = getEventCategoryLabel(reservation.category);

  return `${title} · ${category}${timeLabel ? ` · ${timeLabel}` : ""}`;
}

function showFriendlyError(title: string, message: string) {
  Alert.alert(title, message);
}

export default function CreateEventScreen({ route }: CreateEventScreenProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile } = useAuthStore();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const audienceRequestIdRef = useRef(0);
  const audienceResultsRef = useRef<SearchableProfile[]>([]);
  const audienceSectionYRef = useRef(0);
  const isPublicRef = useRef(true);
  const roomAvailabilityRequestIdRef = useRef(0);
  const selectedRoomIdRef = useRef<string | null>(null);
  const hasManualRoomSelectionChangeRef = useRef(false);
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
  const [audienceSearch, setAudienceSearch] = useState("");
  const [debouncedAudienceSearch, setDebouncedAudienceSearch] = useState("");
  const [selectedAudience, setSelectedAudience] = useState<SearchableProfile[]>(
    [],
  );
  const [audienceResults, setAudienceResults] = useState<SearchableProfile[]>([]);
  const [isLoadingAudience, setIsLoadingAudience] = useState(false);
  const [isHydratingEvent, setIsHydratingEvent] = useState(false);
  const [audiencePage, setAudiencePage] = useState(0);
  const [hasMoreAudience, setHasMoreAudience] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [allowMultipleDates, setAllowMultipleDates] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Record<string, CalendarSelectionMark>>(() => {
    const todayKey = formatLocalDateKey(getNow());
    return { [todayKey]: createCalendarSelectionMark() };
  });
  const [rooms, setRooms] = useState<RoomAvailability[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [currentReservedRoomId, setCurrentReservedRoomId] = useState<string | null>(null);
  const [hasManualRoomSelectionChange, setHasManualRoomSelectionChange] = useState(false);
  const [isRoomSelectionAutoCleared, setIsRoomSelectionAutoCleared] = useState(false);

  const selectedDateKeys = useMemo(() => Object.keys(selectedDays), [selectedDays]);
  const isMultipleDateSelectionEnabled = !isEdit && allowMultipleDates;
  const singleSelectedDateKey =
    selectedDateKeys.length === 1 ? selectedDateKeys[0] : null;
  const roomWindow = useMemo(
    () =>
      singleSelectedDateKey ? buildSingleEventWindow(singleSelectedDateKey, time) : null,
    [singleSelectedDateKey, time],
  );

  const applyEventToForm = (
    event: Pick<
      Event,
      "title" | "category" | "description" | "location" | "is_public" | "start_at"
    >,
  ) => {
    setTitle(event.title);
    setCategory(normalizeEventCategory(event.category));
    setDescription(event.description || "");
    setLocation(event.location || "");
    setIsPublic(event.is_public !== false);

    const date = new Date(event.start_at);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    setTime(`${hours}:${minutes}`);

    const dateKey = formatLocalDateKey(date);
    setAllowMultipleDates(false);
    setSelectedDays({ [dateKey]: createCalendarSelectionMark() });
  };

  useEffect(() => {
    audienceResultsRef.current = audienceResults;
  }, [audienceResults]);

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
    isPublicRef.current = isPublic;
  }, [isPublic]);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    hasManualRoomSelectionChangeRef.current = hasManualRoomSelectionChange;
  }, [hasManualRoomSelectionChange]);

  useEffect(() => {
    if (!isEdit || !eventId) {
      setCurrentReservedRoomId(null);
      setSelectedRoomId(null);
      setHasManualRoomSelectionChange(false);
      setIsRoomSelectionAutoCleared(false);
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

      if (!isMounted) return;

      if (eventResult.error || !eventResult.data) {
        showFriendlyError("Erro", "Não foi possível carregar o evento para edição.");
        setIsHydratingEvent(false);
        return;
      }

      if (linkedReservationResult.error) {
        showFriendlyError("Erro", "Não foi possível carregar a sala vinculada a este evento.");
        setIsHydratingEvent(false);
        return;
      }

      applyEventToForm(eventResult.data.event);

      const linkedRoomId = linkedReservationResult.data?.room_id ?? null;
      setCurrentReservedRoomId(linkedRoomId);
      setSelectedRoomId(linkedRoomId);
      setHasManualRoomSelectionChange(false);
      setIsRoomSelectionAutoCleared(false);

      if (eventResult.data.visible_to_user_ids.length === 0) {
        setSelectedAudience([]);
        setIsHydratingEvent(false);
        return;
      }

      const profilesResult = await getProfilesByIds(
        eventResult.data.visible_to_user_ids,
      );
      if (!isMounted) return;

      if (profilesResult.error) {
        showFriendlyError("Erro", "Não foi possível carregar a lista de membros deste evento.");
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
  }, [eventId, initialData, isEdit]);

  const loadAudienceCandidates = async (
    page: number,
    query: string,
    mode: "replace" | "append",
  ) => {
    const requestId = ++audienceRequestIdRef.current;
    setIsLoadingAudience(true);

    const { data, hasMore, error } = await listProfilesPage({
      query,
      page,
      pageSize: 10,
    });

    const resolution = resolveAudienceResponse({
      current: audienceResultsRef.current,
      incoming: data ?? [],
      mode,
      page,
      hasMore,
      requestId,
      latestRequestId: audienceRequestIdRef.current,
      isPublic: isPublicRef.current,
    });

    if (!resolution.shouldApply) {
      if (requestId === audienceRequestIdRef.current) {
        setIsLoadingAudience(false);
      }
      return;
    }

    setIsLoadingAudience(false);

    if (error) {
      showFriendlyError("Erro", "Não foi possível carregar os membros agora.");
      return;
    }

    setAudiencePage(resolution.page ?? 0);
    setHasMoreAudience(resolution.hasMore);
    setAudienceResults(resolution.results);
  };

  useEffect(() => {
    if (isPublic) {
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedAudienceSearch(audienceSearch.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [audienceSearch, isPublic]);

  useEffect(() => {
    if (isPublic) {
      audienceRequestIdRef.current += 1;
      setAudienceSearch("");
      setDebouncedAudienceSearch("");
      setAudienceResults([]);
      setAudiencePage(0);
      setHasMoreAudience(false);
      return;
    }

    void loadAudienceCandidates(0, debouncedAudienceSearch, "replace");
  }, [debouncedAudienceSearch, isPublic]);

  const loadRooms = async () => {
    if (!roomWindow) {
      roomAvailabilityRequestIdRef.current += 1;
      setRooms([]);
      setRoomsError(null);
      setIsLoadingRooms(false);
      return;
    }

    const requestId = ++roomAvailabilityRequestIdRef.current;

    setIsLoadingRooms(true);
    setRoomsError(null);

    const { data, error } = await getRoomsForWindow(roomWindow);
    if (
      !shouldApplyAvailabilityResponse({
        requestId,
        latestRequestId: roomAvailabilityRequestIdRef.current,
      })
    ) {
      return;
    }

    if (error) {
      setRooms([]);
      setRoomsError(error);
      setIsLoadingRooms(false);
      return;
    }

    const nextRooms = data ?? [];
    const nextRoomSelection = reconcileRoomSelection({
      selectedRoomId: selectedRoomIdRef.current,
      linkedRoomId: currentReservedRoomId,
      rooms: nextRooms,
      currentEventId: eventId,
      hasManualRoomSelectionChange: hasManualRoomSelectionChangeRef.current,
    });

    setRooms(nextRooms);
    setRoomsError(null);
    setIsLoadingRooms(false);

    if (nextRoomSelection.selectedRoomId !== selectedRoomIdRef.current) {
      setSelectedRoomId(nextRoomSelection.selectedRoomId);
    }
    setIsRoomSelectionAutoCleared(nextRoomSelection.isRoomSelectionAutoCleared);
  };

  useEffect(() => {
    if (!singleSelectedDateKey) {
      roomAvailabilityRequestIdRef.current += 1;
      setSelectedRoomId(null);
      setHasManualRoomSelectionChange(false);
      setIsRoomSelectionAutoCleared(false);
      setRooms([]);
      setRoomsError(null);
      setIsLoadingRooms(false);
      return;
    }

    if (isHydratingEvent || !roomWindow) {
      roomAvailabilityRequestIdRef.current += 1;
      setRooms([]);
      setRoomsError(null);
      setIsLoadingRooms(false);
      return;
    }

    void loadRooms();
  }, [isHydratingEvent, roomWindow?.endAt, roomWindow?.startAt, singleSelectedDateKey]);

  const selectedAudienceIds = new Set(selectedAudience.map((profile) => profile.id));
  const availableAudienceResults = audienceResults.filter(
    (profile) => !selectedAudienceIds.has(profile.id),
  );

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

  const toggleAudienceMember = (profile: SearchableProfile) => {
    setSelectedAudience((current) => {
      const alreadySelected = current.some((member) => member.id === profile.id);

      if (alreadySelected) {
        return current.filter((member) => member.id !== profile.id);
      }

      return [...current, profile];
    });
  };

  const removeAudienceMember = (profileId: string) => {
    setSelectedAudience((current) =>
      current.filter((member) => member.id !== profileId),
    );
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

  const handleLoadMoreAudience = async () => {
    if (isLoadingAudience || !hasMoreAudience) {
      return;
    }

    await loadAudienceCandidates(audiencePage + 1, debouncedAudienceSearch, "append");
  };

  const handleSelectRoom = (roomId: string | null) => {
    setSelectedRoomId(roomId);
    setHasManualRoomSelectionChange(true);
    setIsRoomSelectionAutoCleared(false);
  };

  const handleSave = async () => {
    if (!canManageEvents) {
      showFriendlyError("Acesso negado", "Você não tem permissão para gerenciar eventos.");
      return;
    }

    if (isEdit && !eventId) {
      showFriendlyError("Erro", "Evento inválido para edição.");
      return;
    }

    if (!title.trim() || selectedDateKeys.length === 0 || !time.trim()) {
      showFriendlyError("Erro", "Título, data e hora são obrigatórios.");
      return;
    }

    if (!isValidTimeValue(time)) {
      showFriendlyError("Erro", "Informe uma hora válida no formato HH:MM.");
      return;
    }

    const visibleToUserIds = selectedAudience.map((profile) => profile.id);

    if (selectedDateKeys.length === 1) {
      const dateKey = selectedDateKeys[0];
      const eventWindow = buildSingleEventWindow(dateKey, time);

      if (!eventWindow) {
        showFriendlyError("Erro", "Não foi possível montar a data e hora do evento.");
        return;
      }

      const payload = {
        title: title.trim(),
        category,
        description,
        location,
        start_at: eventWindow.startAt,
        end_at: eventWindow.endAt,
        is_public: isPublic,
        visible_to_user_ids: visibleToUserIds,
      };

      if (isEdit && eventId) {
        const roomIdForSave = getRoomIdForEditSave({
          selectedRoomId,
          hasManualRoomSelectionChange,
          isRoomSelectionAutoCleared,
        });
        const { error } = await updateEventWithRoom(eventId, payload, roomIdForSave);

        if (error) {
          showFriendlyError("Erro ao atualizar", "Não foi possível atualizar o evento agora.");
          return;
        }

        navigation.goBack();
        return;
      }

      const { error } = await createEventWithRoom(payload, selectedRoomId);

      if (error) {
        showFriendlyError("Erro ao criar evento", "Não foi possível criar o evento agora.");
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
        title: title.trim(),
        category,
        description,
        location,
        start_at: eventWindow.startAt,
        end_at: eventWindow.endAt,
        is_public: isPublic,
        visible_to_user_ids: visibleToUserIds,
      };
    });

    const { error } = await createBatchEvents(eventsToCreate);

    if (error) {
      showFriendlyError("Erro ao criar eventos", "Não foi possível criar os eventos agora.");
      return;
    }

    navigation.goBack();
  };

  if (!canManageEvents) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
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
                color: "#6b7280",
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
                <Sparkles size={16} color="#666" />
                <Text
                  style={{
                    fontSize: 13,
                    color: "#666",
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
                    style={{ backgroundColor: "#f3f4f6" }}
                    textStyle={{ fontSize: 13 }}
                  >
                    {preset.label}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <TextInput
            label="Título do evento"
            mode="outlined"
            value={title}
            onChangeText={setTitle}
            style={{ marginBottom: 15 }}
            activeOutlineColor="#000"
          />

          <View style={{ marginBottom: 15 }}>
            <Text
              style={{
                fontSize: 13,
                color: "#666",
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              CATEGORIA
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {EVENT_CATEGORY_OPTIONS.map((option) => {
                const selected = category === option.value;

                return (
                  <Chip
                    key={option.value}
                    selected={selected}
                    showSelectedCheck={false}
                    onPress={() => setCategory(option.value)}
                    style={{
                      backgroundColor: selected ? "#111827" : "#f3f4f6",
                      borderColor: selected ? "#111827" : "#e5e7eb",
                      borderWidth: 1,
                    }}
                    textStyle={{
                      color: selected ? "#fff" : "#374151",
                      fontWeight: selected ? "bold" : "normal",
                    }}
                  >
                    {option.label}
                  </Chip>
                );
              })}
            </View>
          </View>

          <TextInput
            label="Localização"
            mode="outlined"
            value={location}
            onChangeText={setLocation}
            style={{ marginBottom: 15 }}
            activeOutlineColor="#000"
          />

          <RNTouchableOpacity
            style={{ marginBottom: 15 }}
            onPress={() => setShowCalendar(true)}
            activeOpacity={0.7}
          >
            <View pointerEvents="none">
              <TextInput
                label="Data do evento"
                mode="outlined"
                value={getEventDateLabel(selectedDays)}
                editable={false}
                right={
                  <TextInput.Icon icon={() => <CalendarIcon size={20} color="#666" />} />
                }
                activeOutlineColor="#000"
              />
            </View>
          </RNTouchableOpacity>

          <TextInput
            label="Hora"
            mode="outlined"
            value={time}
            onChangeText={handleTimeChange}
            onBlur={handleTimeBlur}
            style={{ marginBottom: 15 }}
            placeholder="Ex: 19:00"
            keyboardType="number-pad"
            right={<TextInput.Icon icon={() => <Clock size={20} color="#666" />} />}
            activeOutlineColor="#000"
          />

          <View
            style={{
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 20,
              padding: 16,
              gap: 12,
            }}
          >
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Sala (opcional)
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  lineHeight: 18,
                }}
              >
                Vincule uma sala apenas quando o evento tiver uma única data.
              </Text>
            </View>

            {singleSelectedDateKey == null ? (
              <Text style={{ fontSize: 13, color: "#6b7280", lineHeight: 18 }}>
                Se houver múltiplas datas selecionadas, o evento será salvo sem sala.
              </Text>
            ) : !roomWindow ? (
              <Text style={{ fontSize: 13, color: "#6b7280", lineHeight: 18 }}>
                Informe uma hora válida para carregar as salas disponíveis.
              </Text>
            ) : (
              <>
                <RNTouchableOpacity
                  onPress={() => handleSelectRoom(null)}
                  activeOpacity={0.8}
                  style={{
                    borderWidth: 1,
                    borderColor: selectedRoomId === null ? "#111827" : "#e5e7eb",
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    backgroundColor: selectedRoomId === null ? "#111827" : "#ffffff",
                  }}
                >
                  <Text
                    style={{
                      color: selectedRoomId === null ? "#ffffff" : "#111827",
                      fontWeight: "700",
                    }}
                  >
                    Sem sala
                  </Text>
                  <Text
                    style={{
                      color: selectedRoomId === null ? "#e5e7eb" : "#6b7280",
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    Salva o evento sem criar ou mantém sem reserva vinculada.
                  </Text>
                </RNTouchableOpacity>

                {isLoadingRooms ? (
                  <Text style={{ fontSize: 13, color: "#6b7280" }}>
                    Carregando salas...
                  </Text>
                ) : null}

                {isRoomSelectionAutoCleared && currentReservedRoomId != null ? (
                  <Text style={{ fontSize: 13, color: "#b45309", lineHeight: 18 }}>
                    Sala vinculada ficou indisponível para o horário atual. Se salvar agora,
                    a reserva será removida.
                  </Text>
                ) : null}

                {roomsError ? (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#fecaca",
                      borderRadius: 16,
                      padding: 14,
                      gap: 8,
                    }}
                  >
                    <Text style={{ color: "#b91c1c", fontSize: 13 }}>{roomsError}</Text>
                    <RNTouchableOpacity onPress={() => void loadRooms()} activeOpacity={0.8}>
                      <Text style={{ color: "#111827", fontSize: 13, fontWeight: "700" }}>
                        Tentar novamente
                      </Text>
                    </RNTouchableOpacity>
                  </View>
                ) : null}

                {!isLoadingRooms && !roomsError && rooms.length === 0 ? (
                  <Text style={{ fontSize: 13, color: "#6b7280" }}>
                    Nenhuma sala cadastrada para este horário.
                  </Text>
                ) : null}

                {rooms.map((room) => {
                  const isOwnReservation = room.reservation?.event_id === eventId;
                  const isSelectable = isRoomSelectable(room, eventId);
                  const isSelected = selectedRoomId === room.id;

                  return (
                    <RNTouchableOpacity
                      key={room.id}
                      activeOpacity={0.8}
                      disabled={!isSelectable}
                      onPress={() => {
                        if (isSelectable) {
                          handleSelectRoom(room.id);
                        }
                      }}
                      style={{
                        borderWidth: 1,
                        borderColor: isSelected ? "#111827" : "#e5e7eb",
                        borderRadius: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                        backgroundColor: isSelected ? "#111827" : "#ffffff",
                        opacity: isSelectable ? 1 : 0.55,
                        gap: 6,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "700",
                              color: isSelected ? "#ffffff" : "#111827",
                            }}
                          >
                            {room.name}
                          </Text>
                        </View>

                        <View
                          style={{
                            borderRadius: 999,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            backgroundColor:
                              room.status === "available"
                                ? isSelected
                                  ? "#ffffff"
                                  : "#f3f4f6"
                                : isSelected
                                  ? "#374151"
                                  : "#111827",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "700",
                              color:
                                room.status === "available"
                                  ? isSelected
                                    ? "#111827"
                                    : "#111827"
                                  : "#ffffff",
                            }}
                          >
                            {room.status === "available"
                              ? "Disponível"
                              : isOwnReservation
                                ? "Neste evento"
                                : "Ocupada"}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={{
                          fontSize: 13,
                          lineHeight: 18,
                          color: isSelected ? "#e5e7eb" : "#6b7280",
                        }}
                      >
                        {formatReservationSummary(room, eventId)}
                      </Text>

                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: isSelected ? "#ffffff" : "#111827",
                        }}
                      >
                        {isSelected
                          ? "Sala selecionada"
                          : isSelectable
                            ? "Toque para selecionar"
                            : "Indisponível para este horário"}
                      </Text>
                    </RNTouchableOpacity>
                  );
                })}
              </>
            )}
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 13,
                color: "#666",
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              DESCRIÇÃO
            </Text>
            <TextInput
              mode="outlined"
              label="Descrição"
              value={description}
              onChangeText={setDescription}
              style={{ marginBottom: 15 }}
              activeOutlineColor="#000"
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>Evento público?</Text>
            <Switch value={isPublic} onValueChange={handleVisibilityChange} color="#000" />
          </View>

          <Text
            style={{
              fontSize: 13,
              color: "#6b7280",
              lineHeight: 18,
              marginBottom: 20,
            }}
          >
            {isPublic
              ? "Todos os membros autenticados visualizam este evento."
              : selectedAudience.length === 0
                ? "Sem membros selecionados, apenas administradores visualizam este evento."
                : "Administradores e membros selecionados visualizam este evento."}
          </Text>

          {!isPublic ? (
            <View
              onLayout={handleAudienceSectionLayout}
              style={{
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 20,
                padding: 16,
                gap: 14,
              }}
            >
              <View style={{ gap: 4 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  Membros que podem ver este evento
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    lineHeight: 18,
                  }}
                >
                  Defina quem pode visualizar este evento privado.
                </Text>
              </View>

              <TextInput
                mode="outlined"
                value={audienceSearch}
                onChangeText={setAudienceSearch}
                onFocus={() =>
                  scrollToAudienceSection(scrollViewRef, audienceSectionYRef.current)
                }
                placeholder="Buscar membro por nome"
                activeOutlineColor="#000"
                outlineColor="#d1d5db"
                left={
                  <TextInput.Icon icon={() => <Search size={18} color="#6b7280" />} />
                }
              />

              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#374151",
                  }}
                >
                  Selecionados ({selectedAudience.length})
                </Text>

                {selectedAudience.length === 0 ? (
                  <Text style={{ fontSize: 13, color: "#6b7280" }}>
                    Nenhum membro selecionado. Se salvar assim, apenas administradores
                    visualizam este evento.
                  </Text>
                ) : (
                  selectedAudience.map((profile) => (
                    <View
                      key={profile.id}
                      style={{
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        borderRadius: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: "600", color: "#111827" }}>
                          {profile.full_name}
                        </Text>
                        {!!profile.email ? (
                          <Text style={{ fontSize: 12, color: "#6b7280" }}>
                            {profile.email}
                          </Text>
                        ) : null}
                      </View>

                      <RNTouchableOpacity onPress={() => removeAudienceMember(profile.id)}>
                        <X size={18} color="#6b7280" />
                      </RNTouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              <Divider />

              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#374151",
                  }}
                >
                  Membros disponíveis
                </Text>

                {isLoadingAudience && availableAudienceResults.length === 0 ? (
                  <Text style={{ fontSize: 13, color: "#6b7280" }}>
                    Carregando membros...
                  </Text>
                ) : availableAudienceResults.length === 0 ? (
                  <Text style={{ fontSize: 13, color: "#6b7280" }}>
                    {debouncedAudienceSearch
                      ? "Nenhum membro encontrado para este termo."
                      : "Nenhum membro disponível para adicionar."}
                  </Text>
                ) : (
                  <>
                    {availableAudienceResults.map((profile) => (
                      <RNTouchableOpacity
                        key={profile.id}
                        onPress={() => toggleAudienceMember(profile)}
                        activeOpacity={0.8}
                        style={{
                          borderWidth: 1,
                          borderColor: "#e5e7eb",
                          borderRadius: 16,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "600", color: "#111827" }}>
                            {profile.full_name}
                          </Text>
                          {!!profile.email ? (
                            <Text style={{ fontSize: 12, color: "#6b7280" }}>
                              {profile.email}
                            </Text>
                          ) : null}
                        </View>

                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: "#111827",
                          }}
                        >
                          Adicionar
                        </Text>
                      </RNTouchableOpacity>
                    ))}

                    {hasMoreAudience ? (
                      <RNTouchableOpacity
                        onPress={() => void handleLoadMoreAudience()}
                        activeOpacity={0.8}
                        style={{
                          borderWidth: 1,
                          borderColor: "#d1d5db",
                          borderRadius: 14,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: isLoadingAudience ? 0.7 : 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: "#111827",
                          }}
                        >
                          {isLoadingAudience ? "Carregando..." : "Carregar mais 10 membros"}
                        </Text>
                      </RNTouchableOpacity>
                    ) : null}
                  </>
                )}
              </View>
            </View>
          ) : null}

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

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <RNTouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <View
            style={{
              width: "90%",
              backgroundColor: "#fff",
              borderRadius: 16,
              overflow: "hidden",
              padding: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 10,
              }}
            >
              <View>
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                  {isEdit
                    ? "Alterar Data"
                    : isMultipleDateSelectionEnabled
                      ? "Selecione as Datas"
                      : "Selecione a Data"}
                </Text>
                <Text style={{ fontSize: 12, color: "#666" }}>
                  {isEdit
                    ? "Toque para escolher um novo dia"
                    : isMultipleDateSelectionEnabled
                      ? "Toque para selecionar ou remover várias datas"
                      : "Por padrão, apenas uma data fica ativa por vez"}
                </Text>
              </View>

              <RNTouchableOpacity onPress={() => setShowCalendar(false)}>
                <X size={24} color="#000" />
              </RNTouchableOpacity>
            </View>

            {!isEdit ? (
              <RNTouchableOpacity
                onPress={handleToggleMultipleDates}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 10,
                  paddingBottom: 10,
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontWeight: "700", color: "#111827" }}>
                    Permitir múltiplas datas
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    Desativado por padrão para manter a criação mais simples.
                  </Text>
                </View>
                <Checkbox
                  status={isMultipleDateSelectionEnabled ? "checked" : "unchecked"}
                />
              </RNTouchableOpacity>
            ) : null}

            <Calendar
              onDayPress={onDayPress}
              markedDates={selectedDays}
              theme={{
                selectedDayBackgroundColor: "#000",
                todayTextColor: "#000",
                arrowColor: "#000",
                monthTextColor: "#000",
                indicatorColor: "#000",
              }}
            />

            <Button
              mode="contained"
              onPress={() => setShowCalendar(false)}
              style={{ marginTop: 10, backgroundColor: "#000" }}
            >
              {isMultipleDateSelectionEnabled && selectedDateKeys.length > 1
                ? `Confirmar ${selectedDateKeys.length} datas`
                : "Confirmar data"}
            </Button>
          </View>
        </RNTouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
