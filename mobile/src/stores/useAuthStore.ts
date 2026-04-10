import { create } from 'zustand';
import { UserProfile } from '../types/models';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),

  // #13 Invalida a sessão no servidor antes de limpar o store local
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, isLoading: false });
  },
}));
