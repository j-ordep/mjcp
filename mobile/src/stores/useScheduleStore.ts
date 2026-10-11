import { create } from "zustand";
import {
  getManageableScheduleCards,
  getUserScheduleCards,
  type ScheduleCard,
} from "../services/scheduleService";

export type ScheduleViewMode = "manageable" | "personal";

interface FetchScheduleCardsInput {
  userId: string;
  viewMode: ScheduleViewMode;
  isAdmin?: boolean;
  leaderMinistryIds?: string[];
  forceRefresh?: boolean;
}

interface ScheduleState {
  scheduleCards: ScheduleCard[];
  scheduleCardsCacheKey: string | null;
  viewMode: ScheduleViewMode;
  isLoadingSchedules: boolean;
  error: string | null;
  fetchScheduleCards: (input: FetchScheduleCardsInput) => Promise<void>;
  clearScheduleCards: () => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => {
  let revision = 0;
  return {
    scheduleCards: [],
    scheduleCardsCacheKey: null,
    viewMode: "personal",
    isLoadingSchedules: false,
    error: null,

    fetchScheduleCards: async ({
      userId,
      viewMode,
      isAdmin = false,
      leaderMinistryIds = [],
      forceRefresh = false,
    }) => {
      if (!userId) return;
      leaderMinistryIds = [...new Set(leaderMinistryIds.filter((id) => !!id?.trim()))];
      const shouldUseManageableView = viewMode === "manageable";
      if (shouldUseManageableView && !isAdmin && leaderMinistryIds.length === 0) {
        ++revision;
        set({ scheduleCards: [], scheduleCardsCacheKey: null, viewMode, isLoadingSchedules: false, error: "Nenhum ministério autorizado para gerenciar escalas." });
        return;
      }
      const cacheKey = [
        userId,
        viewMode,
        shouldUseManageableView ? (isAdmin ? "admin" : [...new Set(leaderMinistryIds)].sort().join(",")) : "own",
      ].join("|");
      const currentState = get();
      if (!forceRefresh && currentState.scheduleCardsCacheKey === cacheKey) return;
      const request = ++revision;

      set({
        viewMode,
        isLoadingSchedules: true,
        error: null,
        scheduleCards:
          currentState.scheduleCardsCacheKey === cacheKey
            ? currentState.scheduleCards
            : [],
        scheduleCardsCacheKey:
          currentState.scheduleCardsCacheKey === cacheKey ? cacheKey : null,
      });

      const result = shouldUseManageableView
        ? await getManageableScheduleCards(
            userId,
            isAdmin ? undefined : leaderMinistryIds,
          )
        : await getUserScheduleCards(userId);

      if (request !== revision) return;
      if (result.error) {
        set({
          error: result.error,
          isLoadingSchedules: false,
          scheduleCards: [],
          scheduleCardsCacheKey: null,
        });
        return;
      }

      set({
        scheduleCards: result.data ?? [],
        scheduleCardsCacheKey: cacheKey,
        viewMode: shouldUseManageableView ? "manageable" : "personal",
        isLoadingSchedules: false,
      });
    },

    clearScheduleCards: () => {
      ++revision;
      set({
        scheduleCards: [],
        scheduleCardsCacheKey: null,
        error: null,
        viewMode: "personal",
        isLoadingSchedules: false,
      });
    },
  };
});
