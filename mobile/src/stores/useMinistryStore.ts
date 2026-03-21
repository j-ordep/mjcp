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
  allMinistries: Ministry[];
  isLoadingMinistries: boolean;
  error: string | null;
  fetchUserMinistries: (forceRefresh?: boolean) => Promise<void>;
  fetchAllMinistries: (forceRefresh?: boolean) => Promise<void>;
}

export const useMinistryStore = create<MinistryState>((set, get) => ({
  userMinistries: [],
  allMinistries: [],
  isLoadingMinistries: false,
  error: null,

  fetchUserMinistries: async (forceRefresh = false) => {
    if (!forceRefresh && get().userMinistries.length > 0) return;

    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return;

    set({ isLoadingMinistries: true, error: null });

    const { data, error } = await getUserMinistries(session.user.id);

    if (error) {
      set({ error, isLoadingMinistries: false });
    } else {
      set({ userMinistries: data || [], isLoadingMinistries: false });
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
