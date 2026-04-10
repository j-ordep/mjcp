import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Modal, TouchableOpacity as RNTouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Switch, Divider, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Calendar as CalendarIcon, Clock, X, Sparkles } from 'lucide-react-native';
import HeaderSecondary from '../../components/Header/HeaderSecondary';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEventStore } from '../../stores/useEventStore';
import DefaultButton from '../../components/button/DefaultButton';
import type {
  CreateEventScreenProps,
  RootStackParamList,
} from '../../navigation/AppNavigator';
import {
  createLocalDateTime,
  formatLocalDateKey,
  formatTimeFromDate,
  getDefaultEndAt,
  getNow,
} from '../../utils/eventDate';

const PRESETS = [
  { id: 'culto-familia', label: 'Culto da Família', title: 'Culto da Família', time: '18:00', location: 'Templo', description: "Culto da Família"},
  { id: 'culto-jovens', label: 'Culto Jovem', title: 'Culto Jovem', time: '19:00', location: 'Templo', description: "Culto jovem"},
  { id: 'culto-cura-libertacao', label: 'Culto de cura e libertação', title: 'Culto de cura e libertação', time: '19:30', location: 'Templo', description: "Culto de cura e libertação"},
];

export default function CreateEventScreen({ route }: CreateEventScreenProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const params = route.params || {};
  const isEdit = params.mode === 'edit';
  const eventId = params.eventId;
  const initialData = params.initialData;

  const { createBatchEvents, updateExistingEvent, isLoadingEvents } = useEventStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState(() => formatTimeFromDate(getNow())); // Formato HH:MM
  const [isPublic, setIsPublic] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Record<string, any>>(() => {
    const todayKey = formatLocalDateKey(getNow());
    return { [todayKey]: { selected: true, selectedColor: '#000' } };
  });

  useEffect(() => {
    if (isEdit && initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setLocation(initialData.location || '');
      setIsPublic(initialData.is_public !== false);
      
      const d = new Date(initialData.start_at);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setTime(`${hh}:${mm}`);
      
      const dateStr = initialData.start_at.split('T')[0];
      setSelectedDays({ [dateStr]: { selected: true, selectedColor: '#000' } });
    }
  }, [isEdit, initialData]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setTitle(preset.title);
    setTime(preset.time);
    setLocation(preset.location);
    setDescription(preset.description);
  };

  const onDayPress = (day: any) => {
    const dateString = day.dateString;
    const newSelectedDays = isEdit ? {} : { ...selectedDays }; // Se for edição, só pode 1 dia
    
    if (newSelectedDays[dateString]) {
      delete newSelectedDays[dateString];
    } else {
      newSelectedDays[dateString] = { selected: true, selectedColor: '#000' };
    }
    
    setSelectedDays(newSelectedDays);
  };

  const getFormattedDateLabel = () => {
    const counts = Object.keys(selectedDays).length;
    if (counts === 0) return 'Selecione a data';
    if (counts === 1) {
      const [y, m, d] = Object.keys(selectedDays)[0].split('-');
      return `${d}/${m}/${y}`;
    }
    return `${counts} datas selecionadas`;
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
    let hh = '19';
    let mm = '00';

    if (clean.length <= 2) {
      hh = clean.padStart(2, '0');
    } else if (clean.length === 3) {
      hh = clean.substring(0, 1).padStart(2, '0');
      mm = clean.substring(1).padStart(2, '0');
    } else if (clean.length >= 4) {
      hh = clean.substring(0, 2);
      mm = clean.substring(2, 4);
    }

    // Validação de range (0-23 horas, 0-59 minutos)
    const hhNum = parseInt(hh, 10);
    const mmNum = parseInt(mm, 10);
    if (hhNum > 23) hh = '23';
    if (mmNum > 59) mm = '59';

    setTime(`${hh}:${mm}`);
  };

  const handleSave = async () => {
    const dates = Object.keys(selectedDays);
    if (!title.trim() || dates.length === 0 || !time.trim()) {
      Alert.alert('Erro', 'Título, Data e Hora são obrigatórios.');
      return;
    }

    const [hh, mm] = time.split(':');
    
    if (isEdit && eventId) {
      const dateStr = dates[0];
      const [y, m, d] = dateStr.split('-');
      // NOTA: a data é construída sem timezone explícito, usando o fuso local do device.
      // .toISOString() converte para UTC — correto para o campo TIMESTAMPTZ do Supabase.
      // Todos os usuários devem estar no mesmo fuso (Igreja local). Se multi-fuso for necessário no futuro, usar date-fns-tz.
      const eventDate = createLocalDateTime(`${y}-${m}-${d}`, `${hh}:${mm}`);
      
      const { error } = await updateExistingEvent(eventId, {
        title,
        description,
        location,
        start_at: eventDate.toISOString(),
        end_at: getDefaultEndAt(eventDate).toISOString(),
        is_public: isPublic
      });

      if (error) {
        Alert.alert('Erro ao atualizar', error);
      } else {
        Alert.alert('Sucesso', 'Evento atualizado com sucesso!');
        navigation.goBack();
      }
    } else {
      const eventsToCreate = dates.map(dateStr => {
        const [y, m, d] = dateStr.split('-');
        // Mesma nota de timezone acima: usa fuso local do device.
        const eventDate = createLocalDateTime(`${y}-${m}-${d}`, `${hh}:${mm}`);
        return {
          title,
          description,
          location,
          start_at: eventDate.toISOString(),
          end_at: getDefaultEndAt(eventDate).toISOString(),
          is_public: isPublic
        };
      });

      const { error } = await createBatchEvents(eventsToCreate);

      if (error) {
        Alert.alert('Erro ao criar eventos', error);
      } else {
        Alert.alert('Sucesso', `${eventsToCreate.length} evento(s) criado(s) com sucesso!`);
        navigation.goBack();
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <HeaderSecondary 
        title={isEdit ? "Editar Evento" : "Novo Evento"} 
        onBack={() => navigation.goBack()} 
      />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            
            {!isEdit && (
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 }}>
                  <Sparkles size={16} color="#666" />
                  <Text style={{ fontSize: 13, color: '#666', fontWeight: 'bold' }}>SUGESTÕES GERAIS</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {PRESETS.map(p => (
                    <Chip 
                      key={p.id} 
                      onPress={() => applyPreset(p)}
                      style={{ backgroundColor: '#f3f4f6' }}
                      textStyle={{ fontSize: 13 }}
                    >
                      {p.label}
                    </Chip>
                  ))}
                </ScrollView>
              </View>
            )}

            <TextInput
              label="Título do Evento"
              mode="outlined"
              value={title}
              onChangeText={setTitle}
              style={{ marginBottom: 15 }}
              activeOutlineColor="#000"
            />

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
                  value={getFormattedDateLabel()}
                  editable={false}
                  right={<TextInput.Icon icon={() => <CalendarIcon size={20} color="#666" />} />}
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

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
              <Text style={{ fontSize: 16 }}>Evento Público?</Text>
              <Switch value={isPublic} onValueChange={setIsPublic} color="#000" />
            </View>

            <DefaultButton onPress={handleSave} variant="primary" isLoading={isLoadingEvents}>
              {isEdit 
                ? 'Atualizar Evento' 
                : Object.keys(selectedDays).length > 1 
                  ? `Criar ${Object.keys(selectedDays).length} Eventos` 
                  : 'Criar Evento'
              }
            </DefaultButton>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <Modal visible={showCalendar} transparent={true} animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <RNTouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <View style={{ width: '90%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', padding: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 }}>
              <View>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                  {isEdit ? "Alterar Data" : "Selecione as Datas"}
                </Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  {isEdit ? "Toque para escolher um novo dia" : "Toque para selecionar vários dias"}
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
