import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { Button, Chip, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderSecondary from '../../components/Header/HeaderSecondary';
import { getAllMinistries, getUserMinistries, UserMinistry } from '../../services/ministryService';
import {
  createScheduleValidated,
  getAssignmentWarningsForSchedule,
  getMinistryMembersOptions,
  getMinistryRolesOptions,
  getScheduleAssignmentsDetailed,
  getScheduleByEventAndMinistry,
  AssignmentWarning,
  MinistryMemberOption,
  MinistryRoleOption,
  ScheduleAssignmentDetailed,
  upsertScheduleAssignmentValidated,
} from '../../services/scheduleService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEventStore } from '../../stores/useEventStore';
import { Ministry } from '../../types/models';
import { formatDateTime } from '../../utils/formatDate';

type ManageableMinistry = Ministry | UserMinistry;

export default function CreateScheduleScreen() {
  const navigation = useNavigation();
  const { profile, session } = useAuthStore();
  const { events, fetchUpcomingEvents } = useEventStore();

  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isLoadingMinistries, setIsLoadingMinistries] = useState(false);
  const [isLoadingAssignmentsContext, setIsLoadingAssignmentsContext] = useState(false);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  const [ministries, setMinistries] = useState<ManageableMinistry[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [members, setMembers] = useState<MinistryMemberOption[]>([]);
  const [roles, setRoles] = useState<MinistryRoleOption[]>([]);
  const [assignments, setAssignments] = useState<ScheduleAssignmentDetailed[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchUpcomingEvents();
    loadManageableMinistries();
  }, [session?.user?.id, profile?.role]);

  useEffect(() => {
    if (!selectedEventId || !selectedMinistryId) {
      setScheduleId(null);
      setAssignments([]);
      setMembers([]);
      setRoles([]);
      setSelectedMemberId(null);
      setSelectedRoleId(null);
      return;
    }

    loadAssignmentContext(selectedEventId, selectedMinistryId);
  }, [selectedEventId, selectedMinistryId]);

  const loadManageableMinistries = async () => {
    if (!session?.user?.id) return;

    setIsLoadingMinistries(true);
    try {
      if (isAdmin) {
        const { data, error } = await getAllMinistries();
        if (error) throw new Error(error);
        setMinistries(data ?? []);
      } else {
        const { data, error } = await getUserMinistries(session.user.id);
        if (error) throw new Error(error);
        setMinistries((data ?? []).filter((ministry) => ministry.is_leader));
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message ?? 'Nao foi possivel carregar ministerios.');
    } finally {
      setIsLoadingMinistries(false);
    }
  };

  const loadAssignmentContext = async (eventId: string, ministryId: string) => {
    setIsLoadingAssignmentsContext(true);
    try {
      const [rolesResult, membersResult, scheduleResult] = await Promise.all([
        getMinistryRolesOptions(ministryId),
        getMinistryMembersOptions(ministryId),
        getScheduleByEventAndMinistry(eventId, ministryId),
      ]);

      if (rolesResult.error) throw new Error(rolesResult.error);
      if (membersResult.error) throw new Error(membersResult.error);
      if (scheduleResult.error) throw new Error(scheduleResult.error);

      setRoles(rolesResult.data ?? []);
      setMembers(membersResult.data ?? []);

      const existingScheduleId = scheduleResult.data?.id ?? null;
      setScheduleId(existingScheduleId);

      if (existingScheduleId) {
        const assignmentsResult = await getScheduleAssignmentsDetailed(existingScheduleId);
        if (assignmentsResult.error) throw new Error(assignmentsResult.error);
        setAssignments(assignmentsResult.data ?? []);
      } else {
        setAssignments([]);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message ?? 'Nao foi possivel carregar contexto da escala.');
    } finally {
      setIsLoadingAssignmentsContext(false);
    }
  };

  const canCreateSchedule = useMemo(() => {
    if (isAdmin) return true;
    return ministries.some((ministry) => 'is_leader' in ministry && ministry.is_leader);
  }, [isAdmin, ministries]);

  const selectedEvent = events.find((event) => event.id === selectedEventId);

  const handleCreateSchedule = async () => {
    if (!canCreateSchedule) {
      Alert.alert('Sem permissao', 'Apenas admin ou lider de ministerio pode criar escala.');
      return;
    }

    if (!selectedEventId || !selectedMinistryId) {
      Alert.alert('Campos obrigatorios', 'Selecione evento e ministerio.');
      return;
    }

    setIsLoadingSchedule(true);
    const { data, error } = await createScheduleValidated({
      eventId: selectedEventId,
      ministryId: selectedMinistryId,
      notes: notes.trim() || null,
    });
    setIsLoadingSchedule(false);

    if (error) {
      Alert.alert('Nao foi possivel criar escala', error);
      return;
    }

    const createdScheduleId = data?.id ?? null;
    setScheduleId(createdScheduleId);

    if (createdScheduleId) {
      const assignmentsResult = await getScheduleAssignmentsDetailed(createdScheduleId);
      if (!assignmentsResult.error) {
        setAssignments(assignmentsResult.data ?? []);
      }
    }

    Alert.alert('Sucesso', 'Escala criada/atualizada com sucesso.');
  };

  const handleAddAssignment = async () => {
    if (!scheduleId || !selectedMemberId || !selectedRoleId) {
      Alert.alert('Campos obrigatorios', 'Selecione membro e funcao para adicionar.');
      return;
    }

    const warningsResult = await getAssignmentWarningsForSchedule({
      scheduleId,
      userId: selectedMemberId,
    });

    if (warningsResult.error) {
      Alert.alert('Nao foi possivel validar warnings', warningsResult.error);
      return;
    }

    const warnings = warningsResult.data ?? [];

    const doInsert = async () => {
      setIsSavingAssignment(true);
      const { error } = await upsertScheduleAssignmentValidated({
        scheduleId,
        userId: selectedMemberId,
        roleId: selectedRoleId,
        status: 'pending',
      });
      setIsSavingAssignment(false);

      if (error) {
        Alert.alert('Nao foi possivel adicionar na escala', error);
        return;
      }

      const assignmentsResult = await getScheduleAssignmentsDetailed(scheduleId);
      if (!assignmentsResult.error) {
        setAssignments(assignmentsResult.data ?? []);
      }

      setSelectedMemberId(null);
      setSelectedRoleId(null);
      Alert.alert('Sucesso', 'Membro adicionado na escala.');
    };

    if (warnings.length > 0) {
      const text = formatWarningsText(warnings);
      Alert.alert(
        'Aviso',
        `${text}\n\nDeseja escalar mesmo assim?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Escalar mesmo assim', onPress: () => void doInsert() },
        ],
      );
      return;
    }

    await doInsert();
  };

  const formatWarningsText = (warnings: AssignmentWarning[]) => {
    const blocked = warnings.filter((w) => w.type === 'blocked_date');
    const conflicts = warnings.filter((w) => w.type === 'conflict');

    const parts: string[] = [];

    if (blocked.length > 0) {
      const date = blocked[0].date;
      parts.push(`Data bloqueada pelo membro: ${date}.`);
    }

    if (conflicts.length > 0) {
      const first = conflicts.slice(0, 2);
      const lines = first.map((conflict) => {
        const ministry = conflict.ministry_name ? ` (${conflict.ministry_name})` : '';
        const role = conflict.role_name ? ` - ${conflict.role_name}` : '';
        return `Conflito: ${conflict.event_title}${ministry}${role}`;
      });
      parts.push(lines.join('\n'));
      if (conflicts.length > 2) {
        parts.push(`Mais ${conflicts.length - 2} conflito(s).`);
      }
    }

    return parts.join('\n');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <HeaderSecondary title="Criar Escala" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>
          Nova Escala
        </Text>
        <Text style={{ color: '#666', marginBottom: 20 }}>
          Selecione evento e ministerio para criar a escala.
        </Text>

        {!canCreateSchedule && (
          <View
            style={{
              backgroundColor: '#fff7ed',
              borderColor: '#fdba74',
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#9a3412' }}>
              Voce precisa ser lider de pelo menos um ministerio (ou admin) para criar escala.
            </Text>
          </View>
        )}

        <Text style={{ fontWeight: '600', marginBottom: 10 }}>Evento</Text>
        <View style={{ marginBottom: 20 }}>
          {events.length === 0 ? (
            <Text style={{ color: '#888' }}>Nenhum evento futuro encontrado.</Text>
          ) : (
            events.map((event) => {
              const selected = selectedEventId === event.id;
              return (
                <TouchableOpacity
                  key={event.id}
                  onPress={() => setSelectedEventId(event.id)}
                  style={{
                    borderWidth: 1,
                    borderColor: selected ? '#000' : '#e5e7eb',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 10,
                    backgroundColor: selected ? '#f9fafb' : '#fff',
                  }}
                >
                  <Text style={{ fontWeight: '600', marginBottom: 4 }}>{event.title}</Text>
                  <Text style={{ color: '#666', fontSize: 13 }}>
                    {formatDateTime(event.start_at)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <Text style={{ fontWeight: '600', marginBottom: 10 }}>Ministerio</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {isLoadingMinistries ? (
            <Text style={{ color: '#888' }}>Carregando ministerios...</Text>
          ) : ministries.length === 0 ? (
            <Text style={{ color: '#888' }}>Nenhum ministerio disponivel para criacao.</Text>
          ) : (
            ministries.map((ministry) => (
              <Chip
                key={ministry.id}
                selected={selectedMinistryId === ministry.id}
                onPress={() => setSelectedMinistryId(ministry.id)}
              >
                {ministry.name}
              </Chip>
            ))
          )}
        </View>

        <TextInput
          mode="outlined"
          label="Observacoes (opcional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          style={{ marginBottom: 20 }}
          activeOutlineColor="#000"
        />

        {selectedEvent && (
          <View
            style={{
              backgroundColor: '#f9fafb',
              borderColor: '#e5e7eb',
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontWeight: '600', marginBottom: 4 }}>Resumo</Text>
            <Text style={{ color: '#444' }}>Evento: {selectedEvent.title}</Text>
            <Text style={{ color: '#444' }}>
              Data: {formatDateTime(selectedEvent.start_at)}
            </Text>
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleCreateSchedule}
          loading={isLoadingSchedule}
          disabled={!canCreateSchedule || isLoadingSchedule}
          style={{ borderRadius: 10, marginBottom: 24 }}
          buttonColor="#000"
        >
          Criar/Atualizar Escala
        </Button>

        {(isLoadingAssignmentsContext || scheduleId) && (
          <View style={{ marginBottom: 18 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>
              Escalacao de Membros
            </Text>

            {isLoadingAssignmentsContext ? (
              <Text style={{ color: '#888' }}>Carregando membros e funcoes...</Text>
            ) : !scheduleId ? (
              <Text style={{ color: '#888' }}>
                Crie a escala primeiro para adicionar membros e funcoes.
              </Text>
            ) : (
              <>
                <Text style={{ fontWeight: '600', marginBottom: 8 }}>Membro</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {members.length === 0 ? (
                    <Text style={{ color: '#888' }}>Nenhum membro no ministerio.</Text>
                  ) : (
                    members.map((member) => (
                      <Chip
                        key={member.user_id}
                        selected={selectedMemberId === member.user_id}
                        onPress={() => setSelectedMemberId(member.user_id)}
                      >
                        {member.full_name}
                      </Chip>
                    ))
                  )}
                </View>

                <Text style={{ fontWeight: '600', marginBottom: 8 }}>Funcao</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {roles.length === 0 ? (
                    <Text style={{ color: '#888' }}>Nenhuma funcao no ministerio.</Text>
                  ) : (
                    roles.map((role) => (
                      <Chip
                        key={role.id}
                        selected={selectedRoleId === role.id}
                        onPress={() => setSelectedRoleId(role.id)}
                      >
                        {role.name}
                      </Chip>
                    ))
                  )}
                </View>

                <Button
                  mode="outlined"
                  onPress={handleAddAssignment}
                  loading={isSavingAssignment}
                  disabled={!selectedMemberId || !selectedRoleId || isSavingAssignment}
                  style={{ borderRadius: 10, marginBottom: 18 }}
                  textColor="#000"
                >
                  Adicionar na Escala
                </Button>

                <Text style={{ fontWeight: '600', marginBottom: 8 }}>Membros ja escalados</Text>
                {assignments.length === 0 ? (
                  <Text style={{ color: '#888' }}>Nenhum membro escalado ainda.</Text>
                ) : (
                  assignments.map((assignment) => (
                    <View
                      key={assignment.id}
                      style={{
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        borderRadius: 10,
                        padding: 10,
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ fontWeight: '600' }}>{assignment.member_name}</Text>
                      <Text style={{ color: '#666' }}>
                        {assignment.role_name} - {assignment.status}
                      </Text>
                    </View>
                  ))
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
