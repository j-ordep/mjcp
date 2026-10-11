import { useEffect } from "react";
import { useNotificationStore } from "../stores/useNotificationStore";

export function useNotificationSubscription(userId?: string, sessionRevision = 0) {
  const bootstrap = useNotificationStore((state) => state.bootstrap);
  const connectRealtime = useNotificationStore((state) => state.connectRealtime);
  const disconnectRealtime = useNotificationStore((state) => state.disconnectRealtime);
  const clear = useNotificationStore((state) => state.clear);

  useEffect(() => {
    if (!userId) {
      void disconnectRealtime();
      clear();
      return;
    }
    void bootstrap(userId);
    void connectRealtime(userId);
    return () => { void disconnectRealtime(); };
  }, [bootstrap, clear, connectRealtime, disconnectRealtime, userId, sessionRevision]);
}
