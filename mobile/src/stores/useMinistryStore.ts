import { create } from "zustand";
import {
  getAllMinistries,
  getUserMinistries,
  UserMinistry,
} from "../services/ministryService";
import { Ministry } from "../types/models";
import { useAuthStore } from "./useAuthStore";

interface MinistryState {
  userMinistries: UserMinistry[];
  userMinistriesUserId: string | null;
  allMinistries: Ministry[];
  isLoadingMinistries: boolean;
  error: string | null;
  fetchUserMinistries: (forceRefresh?: boolean) => Promise<void>;
  fetchAllMinistries: (forceRefresh?: boolean) => Promise<void>;
}

export const useMinistryStore = create<MinistryState>((set, get) => ({
  userMinistries: [],
  userMinistriesUserId: null,
  allMinistries: [],
  isLoadingMinistries: false,
  error: null,

  fetchUserMinistries: async (forceRefresh = false) => {
    const session = useAuthStore.getState().session;
    const userId = session?.user?.id;
    if (!userId) {
      set({ userMinistries: [], userMinistriesUserId: null });
      return;
    }

    const currentState = get();
    if (!forceRefresh && currentState.userMinistriesUserId === userId) return;

    set({
      isLoadingMinistries: true,
      error: null,
      userMinistries:
        currentState.userMinistriesUserId === userId
          ? currentState.userMinistries
          : [],
      userMinistriesUserId:
        currentState.userMinistriesUserId === userId ? userId : null,
    });

    const { data, error } = await getUserMinistries(userId);

    if (error) {
      set({ error, isLoadingMinistries: false });
    } else {
      set({
        userMinistries: data || [],
        userMinistriesUserId: userId,
        isLoadingMinistries: false,
      });
    }
  },

  fetchAllMinistries: async (forceRefresh = false) => {
    if (!forceRefresh && get().allMinistries.length > 0) return;

    set({ isLoadingMinistries: true, error: null });

    const { data, error } = await getAllMinistries();

    if (error) {
      set({ error, isLoadingMinistries: false });
    } else {
      set({ allMinistries: data || [], isLoadingMinistries: false });
    }
  },
}));
