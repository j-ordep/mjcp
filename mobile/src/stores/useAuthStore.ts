import { create } from 'zustand';
import { UserProfile } from '../types/models';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  sessionRevision: number;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  sessionRevision: 0,
  
  setSession: (session) => set((state) => ({
    session,
    sessionRevision: state.sessionRevision + (state.session?.user.id !== session?.user.id ? 1 : 0),
  })),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
}));
