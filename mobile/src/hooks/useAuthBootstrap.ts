import type { Session } from "@supabase/supabase-js";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getProfile } from "../services/profileService";
import { useAuthStore } from "../stores/useAuthStore";
import { useEventStore } from "../stores/useEventStore";
import { useMinistryStore } from "../stores/useMinistryStore";
import { useScheduleStore } from "../stores/useScheduleStore";
import { useNotificationStore } from "../stores/useNotificationStore";

export function useAuthBootstrap() {
  const { setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    let active = true;
    let revision = 0;
    let profileTimer: ReturnType<typeof setTimeout> | undefined;
    let userId = useAuthStore.getState().session?.user.id;
    const isCurrent = (request: number) => active && request === revision;
    function acceptSession(session: Session | null) {
      const nextUserId = session?.user.id;
      if (!session || nextUserId !== userId) {
        setProfile(null);
        useEventStore.getState().clearEvents();
        useMinistryStore.getState().clearMinistries();
        useScheduleStore.getState().clearScheduleCards();
        useNotificationStore.getState().clear();
      }
      userId = nextUserId;
      setSession(session);
    }

    async function loadProfile(session: Session | null, request: number) {
      try {
        const profile = session?.user.id
          ? (await getProfile(session.user.id)).profile
          : null;
        if (isCurrent(request)) setProfile(profile);
      } catch {
        if (isCurrent(request)) setProfile(null);
      } finally {
        if (isCurrent(request)) setLoading(false);
      }
    }

    async function restoreSession() {
      const request = revision;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isCurrent(request)) return;
        if (error) throw error;
        acceptSession(data.session);
        await loadProfile(data.session, request);
      } catch {
        if (isCurrent(request)) {
          acceptSession(null);
          setProfile(null);
          setLoading(false);
        }
      }
    }

    void restoreSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const request = ++revision;
      clearTimeout(profileTimer);
      acceptSession(session);
      if (!session) {
        setProfile(null);
        setLoading(false);
        return;
      }
      // This callback holds Supabase's auth lock; queries must run after it returns.
      profileTimer = setTimeout(() => { void loadProfile(session, request); }, 0);
    });

    return () => {
      active = false;
      clearTimeout(profileTimer);
      subscription.unsubscribe();
    };
  }, [setLoading, setProfile, setSession]);
}
