import { create } from "zustand";
import {
  getUserMinistries,
  UserMinistry,
} from "../services/ministryService";
import { useAuthStore } from "./useAuthStore";

interface MinistryState {
  userMinistries: UserMinistry[];
  userMinistriesUserId: string | null;
  isLoadingMinistries: boolean;
  error: string | null;
  fetchUserMinistries: (forceRefresh?: boolean) => Promise<void>;
  clearMinistries: () => void;
}

export const useMinistryStore = create<MinistryState>((set, get) => {
  let userRevision = 0;
  return {
    userMinistries: [],
    userMinistriesUserId: null,
    isLoadingMinistries: false,
    error: null,
    clearMinistries: () => {
      ++userRevision;
      set({ userMinistries: [], userMinistriesUserId: null, isLoadingMinistries: false, error: null });
    },

    fetchUserMinistries: async (forceRefresh = false) => {
      const session = useAuthStore.getState().session;
      const userId = session?.user?.id;
      if (!userId) {
        get().clearMinistries();
        return;
      }

      const currentState = get();
      if (!forceRefresh && currentState.userMinistriesUserId === userId) return;
      const request = ++userRevision;

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
      if (request !== userRevision || useAuthStore.getState().session?.user.id !== userId) return;

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
  };
});
