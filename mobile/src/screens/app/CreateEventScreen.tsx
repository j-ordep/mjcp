import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity as RNTouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Button, Chip, Divider, Switch, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Calendar as CalendarIcon, Clock, Search, Sparkles, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HeaderSecondary from '../../components/Header/HeaderSecondary';
import DefaultButton from '../../components/button/DefaultButton';
import type {
  CreateEventScreenProps,
  RootStackParamList,
} from '../../navigation/AppNavigator';
import { getEventAudienceUserIds } from '../../services/eventService';
import {
  getProfilesByIds,
  searchProfiles,
  type SearchableProfile,
} from '../../services/profileService';
import { useEventStore } from '../../stores/useEventStore';
import {
  createLocalDateTime,
  formatLocalDateKey,
  formatTimeFromDate,
  getDefaultEndAt,
  getNow,
} from '../../utils/eventDate';
import {
  EVENT_CATEGORY_OPTIONS,
  type EventCategory,
  normalizeEventCategory,
} from '../../utils/eventCategory';

const PRESETS = [
  {
    id: 'culto-familia',
    label: 'Culto da Família',
    title: 'Culto da Família',
    category: 'culto' as EventCategory,
    time: '18:00',
    location: 'Templo',
    description: 'Culto da Família',
  },
  {
    id: 'culto-jovens',
    label: 'Culto Jovem',
    title: 'Culto Jovem',
    category: 'jovens' as EventCategory,
    time: '19:00',
    location: 'Templo',
    description: 'Culto jovem',
  },
  {
    id: 'culto-cura-libertacao',
    label: 'Culto de cura e libertação',
    title: 'Culto de cura e libertação',
    category: 'culto' as EventCategory,
    time: '19:30',
    location: 'Templo',
    description: 'Culto de cura e libertação',
  },
];

type CalendarSelection = {
  selected: boolean;
  selectedColor: string;
};

function getEventDateLabel(selectedDays: Record<string, CalendarSelection>) {
  const dates = Object.keys(selectedDays);

  if (dates.length === 0) return 'Selecione a data';

  if (dates.length === 1) {
    const [year, month, day] = dates[0].split('-');
    return `${day}/${month}/${year}`;
  }

  return `${dates.length} datas selecionadas`;
}

export default function CreateEventScreen({ route }: CreateEventScreenProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const params = route.params || {};
  const isEdit = params.mode === 'edit';
  const eventId = params.eventId;
  const initialData = params.initialData;

  const { createBatchEvents, updateExistingEvent, isLoadingEvents } =
    useEventStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('geral');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState(() => formatTimeFromDate(getNow()));
  const [isPublic, setIsPublic] = useState(true);
  const [audienceSearch, setAudienceSearch] = useState('');
  const [selectedAudience, setSelectedAudience] = useState<SearchableProfile[]>(
    [],
  );
  const [audienceResults, setAudienceResults] = useState<SearchableProfile[]>([]);
  const [isLoadingAudience, setIsLoadingAudience] = useState(false);
  const [hasLoadedInitialAudience, setHasLoadedInitialAudience] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Record<string, CalendarSelection>>(() => {
    const todayKey = formatLocalDateKey(getNow());
    return { [todayKey]: { selected: true, selectedColor: '#000' } };
  });

  useEffect(() => {
    if (!isEdit || !initialData) return;

    setTitle(initialData.title);
    setCategory(normalizeEventCategory(initialData.category));
    setDescription(initialData.description || '');
    setLocation(initialData.location || '');
    setIsPublic(initialData.is_public !== false);

    const date = new Date(initialData.start_at);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    setTime(`${hours}:${minutes}`);

    const dateKey = initialData.start_at.split('T')[0];
    setSelectedDays({ [dateKey]: { selected: true, selectedColor: '#000' } });
  }, [initialData, isEdit]);

  useEffect(() => {
    if (!isEdit || !eventId || !initialData || initialData.is_public !== false) {
      return;
    }

    if (hasLoadedInitialAudience) {
      return;
    }

    let isMounted = true;

    const loadAudience = async () => {
      setIsLoadingAudience(true);
      setHasLoadedInitialAudience(true);

      const audienceResult = await getEventAudienceUserIds(eventId);
      if (!isMounted) return;

      if (audienceResult.error) {
        Alert.alert('Erro', audienceResult.error);
        setIsLoadingAudience(false);
        return;
      }

      const visibleUserIds = audienceResult.data ?? [];
      if (visibleUserIds.length === 0) {
        setSelectedAudience([]);
        setIsLoadingAudience(false);
        return;
      }

      const profilesResult = await getProfilesByIds(visibleUserIds);
      if (!isMounted) return;

      if (profilesResult.error) {
        Alert.alert('Erro', profilesResult.error);
        setIsLoadingAudience(false);
        return;
      }

      setSelectedAudience(
        (profilesResult.data ?? []).filter((profile) => profile.role !== 'admin'),
      );
      setIsLoadingAudience(false);
    };

    void loadAudience();

    return () => {
      isMounted = false;
    };
  }, [eventId, hasLoadedInitialAudience, initialData, isEdit]);

  useEffect(() => {
    if (isPublic) {
      setAudienceSearch('');
      setAudienceResults([]);
      return;
    }

    const normalizedSearch = audienceSearch.trim();
    if (!normalizedSearch) {
      setAudienceResults([]);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(() => {
      void (async () => {
        setIsLoadingAudience(true);
        const { data, error } = await searchProfiles(normalizedSearch);

        if (!isMounted) return;

        setIsLoadingAudience(false);

        if (error) {
          Alert.alert('Erro', error);
          return;
        }

        setAudienceResults(
          (data ?? []).filter((profile) => profile.role !== 'admin'),
        );
      })();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [audienceSearch, isPublic]);

  const selectedAudienceIds = new Set(
    selectedAudience.map((profile) => profile.id),
  );

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
    const dateString = day.dateString;
    const nextSelectedDays = isEdit ? {} : { ...selectedDays };

    if (nextSelectedDays[dateString]) {
      delete nextSelectedDays[dateString];
    } else {
      nextSelectedDays[dateString] = { selected: true, selectedColor: '#000' };
    }

    setSelectedDays(nextSelectedDays);
  };

  const handleTimeChange = (text: string) => {
    let clean = text.replace(/\D/g, '');
    if (clean.length > 4) clean = clean.substring(0, 4);

    let formatted = clean;
    if (clean.length > 2) {
      formatted = `${clean.substring(0, 2)}:${clean.substring(2)}`;
    }

    setTime(formatted);
  };

  const handleTimeBlur = () => {
    if (!time) return;

    let clean = time.replace(/\D/g, '');
    let hours = '19';
    let minutes = '00';

    if (clean.length <= 2) {
      hours = clean.padStart(2, '0');
    } else if (clean.length === 3) {
      hours = clean.substring(0, 1).padStart(2, '0');
      minutes = clean.substring(1).padStart(2, '0');
    } else if (clean.length >= 4) {
      hours = clean.substring(0, 2);
      minutes = clean.substring(2, 4);
    }

    const hoursNumber = parseInt(hours, 10);
    const minutesNumber = parseInt(minutes, 10);

    if (hoursNumber > 23) hours = '23';
    if (minutesNumber > 59) minutes = '59';

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

  const handleSave = async () => {
    const dates = Object.keys(selectedDays);

    if (!title.trim() || dates.length === 0 || !time.trim()) {
      Alert.alert('Erro', 'Título, data e hora são obrigatórios.');
      return;
    }

    if (!isPublic && selectedAudience.length === 0) {
      Alert.alert(
        'Selecione os membros',
        'Escolha pelo menos um membro para um evento privado.',
      );
      return;
    }

    const [hours, minutes] = time.split(':');
    const visibleToUserIds = selectedAudience.map((profile) => profile.id);

    if (isEdit && eventId) {
      const dateKey = dates[0];
      const eventDate = createLocalDateTime(dateKey, `${hours}:${minutes}`);

      const { error } = await updateExistingEvent(eventId, {
        title,
        category,
        description,
        location,
        start_at: eventDate.toISOString(),
        end_at: getDefaultEndAt(eventDate).toISOString(),
        is_public: isPublic,
        visible_to_user_ids: visibleToUserIds,
      });

      if (error) {
        Alert.alert('Erro ao atualizar', error);
        return;
      }

      navigation.goBack();
      return;
    }

    const eventsToCreate = dates.map((dateKey) => {
      const eventDate = createLocalDateTime(dateKey, `${hours}:${minutes}`);

      return {
        title,
        category,
        description,
        location,
        start_at: eventDate.toISOString(),
        end_at: getDefaultEndAt(eventDate).toISOString(),
        is_public: isPublic,
        visible_to_user_ids: visibleToUserIds,
      };
    });

    const { error } = await createBatchEvents(eventsToCreate);

    if (error) {
      Alert.alert('Erro ao criar eventos', error);
      return;
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <HeaderSecondary
        title={isEdit ? 'Editar Evento' : 'Novo Evento'}
        onBack={() => navigation.goBack()}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {!isEdit && (
              <View style={{ marginBottom: 20 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 10,
                    gap: 6,
                  }}
                >
                  <Sparkles size={16} color="#666" />
                  <Text
                    style={{
                      fontSize: 13,
                      color: '#666',
                      fontWeight: 'bold',
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
                      style={{ backgroundColor: '#f3f4f6' }}
                      textStyle={{ fontSize: 13 }}
                    >
                      {preset.label}
                    </Chip>
                  ))}
                </ScrollView>
              </View>
            )}

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
                  color: '#666',
                  fontWeight: 'bold',
                  marginBottom: 8,
                }}
              >
                CATEGORIA
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {EVENT_CATEGORY_OPTIONS.map((option) => {
                  const selected = category === option.value;

                  return (
                    <Chip
                      key={option.value}
                      selected={selected}
                      showSelectedCheck={false}
                      onPress={() => setCategory(option.value)}
                      style={{
                        backgroundColor: selected ? '#111827' : '#f3f4f6',
                        borderColor: selected ? '#111827' : '#e5e7eb',
                        borderWidth: 1,
                      }}
                      textStyle={{
                        color: selected ? '#fff' : '#374151',
                        fontWeight: selected ? 'bold' : 'normal',
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
                    <TextInput.Icon
                      icon={() => <CalendarIcon size={20} color="#666" />}
                    />
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
              right={
                <TextInput.Icon
                  icon={() => <Clock size={20} color="#666" />}
                />
              }
              activeOutlineColor="#000"
            />

            <TextInput
              label="Descrição"
              mode="outlined"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              style={{ marginBottom: 20 }}
              activeOutlineColor="#000"
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 16 }}>Evento público?</Text>
              <Switch value={isPublic} onValueChange={setIsPublic} color="#000" />
            </View>

            <Text
              style={{
                fontSize: 13,
                color: '#6b7280',
                lineHeight: 18,
                marginBottom: 20,
              }}
            >
              {isPublic
                ? 'Todos os membros visualizam este evento.'
                : 'Apenas membros selecionados e administradores visualizam este evento.'}
            </Text>

            {!isPublic && (
              <View
                style={{
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 20,
                  padding: 16,
                  gap: 14,
                }}
              >
                <View style={{ gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#111827',
                    }}
                  >
                    Membros que podem ver este evento
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: '#6b7280',
                      lineHeight: 18,
                    }}
                  >
                    Apenas os membros selecionados e administradores visualizarão
                    este evento.
                  </Text>
                </View>

                <TextInput
                  mode="outlined"
                  value={audienceSearch}
                  onChangeText={setAudienceSearch}
                  placeholder="Buscar membro por nome"
                  activeOutlineColor="#000"
                  outlineColor="#d1d5db"
                  left={
                    <TextInput.Icon
                      icon={() => <Search size={18} color="#6b7280" />}
                    />
                  }
                />

                <View style={{ gap: 8 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: '#374151',
                    }}
                  >
                    Selecionados ({selectedAudience.length})
                  </Text>

                  {selectedAudience.length === 0 ? (
                    <Text style={{ fontSize: 13, color: '#6b7280' }}>
                      Nenhum membro selecionado ainda.
                    </Text>
                  ) : (
                    selectedAudience.map((profile) => (
                      <View
                        key={profile.id}
                        style={{
                          borderWidth: 1,
                          borderColor: '#e5e7eb',
                          borderRadius: 16,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '600', color: '#111827' }}>
                            {profile.full_name}
                          </Text>
                          {!!profile.email && (
                            <Text style={{ fontSize: 12, color: '#6b7280' }}>
                              {profile.email}
                            </Text>
                          )}
                        </View>

                        <RNTouchableOpacity
                          onPress={() => removeAudienceMember(profile.id)}
                        >
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
                      fontWeight: '700',
                      color: '#374151',
                    }}
                  >
                    Resultado da busca
                  </Text>

                  {isLoadingAudience ? (
                    <Text style={{ fontSize: 13, color: '#6b7280' }}>
                      Carregando membros...
                    </Text>
                  ) : audienceSearch.trim().length === 0 ? (
                    <Text style={{ fontSize: 13, color: '#6b7280' }}>
                      Digite o nome do membro para buscar.
                    </Text>
                  ) : availableAudienceResults.length === 0 ? (
                    <Text style={{ fontSize: 13, color: '#6b7280' }}>
                      Nenhum membro encontrado para este termo.
                    </Text>
                  ) : (
                    availableAudienceResults.map((profile) => (
                      <RNTouchableOpacity
                        key={profile.id}
                        onPress={() => toggleAudienceMember(profile)}
                        activeOpacity={0.8}
                        style={{
                          borderWidth: 1,
                          borderColor: '#e5e7eb',
                          borderRadius: 16,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '600', color: '#111827' }}>
                            {profile.full_name}
                          </Text>
                          {!!profile.email && (
                            <Text style={{ fontSize: 12, color: '#6b7280' }}>
                              {profile.email}
                            </Text>
                          )}
                        </View>

                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: '#111827',
                          }}
                        >
                          Adicionar
                        </Text>
                      </RNTouchableOpacity>
                    ))
                  )}
                </View>
              </View>
            )}

            <DefaultButton
              onPress={handleSave}
              variant="primary"
              isLoading={isLoadingEvents}
            >
              {isEdit
                ? 'Atualizar Evento'
                : Object.keys(selectedDays).length > 1
                  ? `Criar ${Object.keys(selectedDays).length} Eventos`
                  : 'Criar Evento'}
            </DefaultButton>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <RNTouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <View
            style={{
              width: '90%',
              backgroundColor: '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              padding: 10,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 10,
              }}
            >
              <View>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                  {isEdit ? 'Alterar Data' : 'Selecione as Datas'}
                </Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  {isEdit
                    ? 'Toque para escolher um novo dia'
                    : 'Toque para selecionar vários dias'}
                </Text>
              </View>

              <RNTouchableOpacity onPress={() => setShowCalendar(false)}>
                <X size={24} color="#000" />
              </RNTouchableOpacity>
            </View>

            <Calendar
              onDayPress={onDayPress}
              markedDates={selectedDays}
              theme={{
                selectedDayBackgroundColor: '#000',
                todayTextColor: '#000',
                arrowColor: '#000',
                monthTextColor: '#000',
                indicatorColor: '#000',
              }}
            />

            <Button
              mode="contained"
              onPress={() => setShowCalendar(false)}
              style={{ marginTop: 10, backgroundColor: '#000' }}
            >
              Confirmar {Object.keys(selectedDays).length} data(s)
            </Button>
          </View>
        </RNTouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
