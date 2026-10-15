import { create } from "zustand";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotifications,
  type AppNotification,
} from "../services/notificationService";

interface NotificationRealtimeSubscription {
  unsubscribe: () => Promise<unknown> | void;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  subscribedUserId: string | null;
  bootstrap: (userId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  connectRealtime: (userId: string) => Promise<void>;
  disconnectRealtime: () => Promise<void>;
  clear: () => void;
}

let activeRealtimeSubscription: NotificationRealtimeSubscription | null = null;
let activeRealtimeUserId: string | null = null;
let closingRealtimeChannel: Promise<unknown> | undefined;
// Requests and channels have separate lifecycles, even when the user logs in again.
let realtimeRevision = 0;
let inboxRevision = 0;

function closeRealtimeChannel() {
  realtimeRevision++;
  const subscription = activeRealtimeSubscription;
  activeRealtimeSubscription = null;
  activeRealtimeUserId = null;
  if (subscription) {
    closingRealtimeChannel = Promise.resolve(subscription.unsubscribe());
  }
  // Supabase reuses channels with the same topic until removal has finished.
  return closingRealtimeChannel;
}

function trimNotifications(notifications: AppNotification[]) {
  return notifications.slice(0, 50);
}

function upsertNotification(
  notifications: AppNotification[],
  notification: AppNotification,
) {
  const nextNotifications = notifications.filter(
    (item) => item.id !== notification.id,
  );

  return trimNotifications([notification, ...nextNotifications]);
}

function replaceNotification(
  notifications: AppNotification[],
  notification: AppNotification,
) {
  const index = notifications.findIndex((item) => item.id === notification.id);

  if (index === -1) {
    return upsertNotification(notifications, notification);
  }

  return notifications.map((item) =>
    item.id === notification.id ? notification : item,
  );
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  subscribedUserId: null,

  bootstrap: async (userId) => {
    if (!userId) {
      get().clear();
      return;
    }

    const revision = ++inboxRevision;
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: true,
      error: null,
      subscribedUserId: userId,
    });

    const [notificationsResult, unreadCountResult] = await Promise.all([
      getNotifications(userId),
      getUnreadNotificationsCount(userId),
    ]);

    if (revision !== inboxRevision || get().subscribedUserId !== userId) return;

    const error = notificationsResult.error ?? unreadCountResult.error;

    set({
      notifications: notificationsResult.data ?? [],
      unreadCount: unreadCountResult.data ?? 0,
      isLoading: false,
      error,
      subscribedUserId: userId,
    });
  },

  refreshNotifications: async () => {
    const { subscribedUserId } = get();
    if (!subscribedUserId) return;
    const revision = inboxRevision;

    set({ isLoading: true, error: null });
    const result = await getNotifications(subscribedUserId);
    if (revision !== inboxRevision || get().subscribedUserId !== subscribedUserId) return;

    set((state) => ({
      notifications: result.data ?? state.notifications,
      isLoading: false,
      error: result.error,
    }));
  },

  refreshUnreadCount: async () => {
    const { subscribedUserId } = get();
    if (!subscribedUserId) return;
    const revision = inboxRevision;

    const result = await getUnreadNotificationsCount(subscribedUserId);
    if (revision !== inboxRevision || get().subscribedUserId !== subscribedUserId) return;

    set((state) => ({
      unreadCount: result.data ?? state.unreadCount,
      error: result.error ?? state.error,
    }));
  },

  markAsRead: async (notificationId) => {
    const { subscribedUserId } = get();
    if (!subscribedUserId) return;
    const revision = inboxRevision;
    const previousNotifications = get().notifications;
    const previousUnreadCount = get().unreadCount;
    const targetNotification = previousNotifications.find(
      (notification) => notification.id === notificationId,
    );

    if (!targetNotification || targetNotification.read || targetNotification.user_id !== subscribedUserId) {
      return;
    }

    set({
      notifications: previousNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
      unreadCount: Math.max(previousUnreadCount - 1, 0),
      error: null,
    });

    const result = await markNotificationAsRead(notificationId, subscribedUserId);
    if (!result.error || revision !== inboxRevision || get().subscribedUserId !== subscribedUserId) {
      return;
    }

    set({
      notifications: previousNotifications,
      unreadCount: previousUnreadCount,
      error: result.error,
    });
  },

  markAllAsRead: async () => {
    const { subscribedUserId } = get();
    if (!subscribedUserId) return;
    const revision = inboxRevision;
    const previousNotifications = get().notifications;
    const previousUnreadCount = get().unreadCount;

    if (previousUnreadCount === 0) {
      return;
    }

    set({
      notifications: previousNotifications.map((notification) => ({
        ...notification,
        read: true,
      })),
      unreadCount: 0,
      error: null,
    });

    const result = await markAllNotificationsAsRead(subscribedUserId);
    if (!result.error || revision !== inboxRevision || get().subscribedUserId !== subscribedUserId) {
      return;
    }

    set({
      notifications: previousNotifications,
      unreadCount: previousUnreadCount,
      error: result.error,
    });
  },

  connectRealtime: async (userId) => {
    if (!userId) {
      await get().disconnectRealtime();
      return;
    }

    if (activeRealtimeSubscription && activeRealtimeUserId === userId) {
      return;
    }

    const disconnect = closeRealtimeChannel();
    const revision = realtimeRevision;
    await disconnect;
    if (revision !== realtimeRevision) return;

    activeRealtimeUserId = userId;
    activeRealtimeSubscription = subscribeToNotifications({
      userId,
      onInsert: (notification) => {
        if (revision !== realtimeRevision || get().subscribedUserId !== userId) return;
        set((state) => ({
          notifications: upsertNotification(state.notifications, notification),
          unreadCount: notification.read
            ? state.unreadCount
            : state.unreadCount + 1,
        }));
      },
      onUpdate: (notification) => {
        if (revision !== realtimeRevision || get().subscribedUserId !== userId) return;
        set((state) => {
          const previousNotification = state.notifications.find(
            (item) => item.id === notification.id,
          );

          let unreadCount = state.unreadCount;
          if (previousNotification && previousNotification.read !== notification.read) {
            unreadCount = notification.read
              ? Math.max(state.unreadCount - 1, 0)
              : state.unreadCount + 1;
          }

          return {
            notifications: replaceNotification(state.notifications, notification),
            unreadCount,
          };
        });
      },
    });

    set({
      subscribedUserId: userId,
      error: null,
    });
  },

  disconnectRealtime: async () => {
    inboxRevision++;
    const disconnect = closeRealtimeChannel();
    set({ subscribedUserId: null });
    await disconnect;
  },

  clear: () => {
    void get().disconnectRealtime();
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      subscribedUserId: null,
    });
  },
}));
