import { create } from "zustand";
import {
  getUpcomingAllSchedules,
  getUpcomingUserSchedules,
  UpcomingSchedule,
} from "../services/scheduleService";

interface ScheduleState {
  mySchedules: UpcomingSchedule[];
  isLoadingSchedules: boolean;
  error: string | null;
  // #4 userId e isAdmin passados como parâmetros — store não acessa useAuthStore diretamente
  fetchMySchedules: (
    userId: string,
    isAdmin?: boolean,
    forceRefresh?: boolean,
  ) => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  mySchedules: [],
  isLoadingSchedules: false,
  error: null,

  fetchMySchedules: async (
    userId: string,
    isAdmin = false,
    forceRefresh = false,
  ) => {
    // Se já temos as escalas salvas e não queremos forçar reload, ignorar
    if (!forceRefresh && get().mySchedules.length > 0) return;

    if (!userId) return;

    set({ isLoadingSchedules: true, error: null });

    // #9 Decisão de "admin vs membro" fica explícita no caller, não hardcoded no store
    const { data, error } = isAdmin
      ? await getUpcomingAllSchedules()
      : await getUpcomingUserSchedules(userId);

    if (error) {
      set({ error, isLoadingSchedules: false });
    } else {
      set({ mySchedules: data || [], isLoadingSchedules: false });
    }
  },
}));
