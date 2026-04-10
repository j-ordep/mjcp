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
  viewMode: ScheduleViewMode;
  isLoadingSchedules: boolean;
  error: string | null;
  fetchScheduleCards: (input: FetchScheduleCardsInput) => Promise<void>;
  clearScheduleCards: () => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  scheduleCards: [],
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
    if (!forceRefresh && get().scheduleCards.length > 0) return;

    set({ isLoadingSchedules: true, error: null });

    const shouldUseManageableView = isAdmin || leaderMinistryIds.length > 0;
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
      });
      return;
    }

    set({
      scheduleCards: result.data ?? [],
      viewMode: shouldUseManageableView ? "manageable" : "personal",
      isLoadingSchedules: false,
    });
  },

  clearScheduleCards: () => {
    set({ scheduleCards: [], error: null, viewMode: "personal" });
  },
}));
