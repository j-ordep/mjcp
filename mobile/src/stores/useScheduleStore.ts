import { create } from "zustand";
import {
  getManageableScheduleCards,
  getUserScheduleCards,
  type ScheduleCard,
} from "../services/scheduleService";

type ScheduleViewMode = "manageable" | "personal";

interface FetchScheduleCardsInput {
  userId: string;
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

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  scheduleCards: [],
  scheduleCardsCacheKey: null,
  viewMode: "personal",
  isLoadingSchedules: false,
  error: null,

  fetchScheduleCards: async ({
    userId,
    isAdmin = false,
    leaderMinistryIds = [],
    forceRefresh = false,
  }) => {
    if (!userId) return;
    const shouldUseManageableView = isAdmin || leaderMinistryIds.length > 0;
    const cacheKey = [
      userId,
      shouldUseManageableView ? "manageable" : "personal",
      isAdmin ? "admin" : leaderMinistryIds.slice().sort().join(","),
    ].join("|");
    const currentState = get();
    if (!forceRefresh && currentState.scheduleCardsCacheKey === cacheKey) return;

    set({
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
    set({
      scheduleCards: [],
      scheduleCardsCacheKey: null,
      error: null,
      viewMode: "personal",
    });
  },
}));
