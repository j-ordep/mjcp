# Core Closeout And Permission Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the approved core-closeout track while first fixing confirmed permission, notification-scope, and integrity gaps that should block new feature work.

**Architecture:** Treat this as two waves. Wave 0 hardens trust boundaries in Supabase and the notification client contract. Wave 1 closes visible UX gaps and finishes the shared operational polish on top of the hardened backend.

**Tech Stack:** React Native, Expo, TypeScript, Zustand, Supabase SQL/RLS/RPC

---

## Summary

This queue should be implemented in order:

1. Harden privileged writes and user-scoped notification reads.
2. Align `SECURITY DEFINER` RPCs with the same temporal/authZ checks already enforced by table policies.
3. Close the visible swap/event UX gaps still open in the app shell.
4. Finish the cross-screen polish work for loading/error/empty states and shared date handling.
5. Run the remote operational closeout for `NOT VALID` constraints only after data cleanup.

## Key Changes

### Wave 0 - Security and integrity blockers

**Files:**
- Create: `supabase/migrations/20260614000129_harden_profile_and_event_rpc_permissions.sql`
- Create: `supabase/migrations/20260614000130_restrict_member_assignment_status_transitions.sql`
- Modify: `tests/migrationIntegrity.test.ts`
- Modify: `src/services/notificationService.ts`
- Modify: `src/stores/useNotificationStore.ts`
- Modify: `tests/notificationService.test.ts`
- Modify: `tests/notificationStore.test.ts`

- [ ] Lock `profiles.role` and any other privileged profile fields behind backend-controlled logic.
  - Replace the generic "user updates own profile" posture with a safer contract that still allows normal profile edits (`full_name`, `phone`, `avatar_url`) but rejects self-promotion or privileged flag edits.
  - Keep `set_profile_event_management_permission(...)` as the only normal path for `can_manage_events`.

- [ ] Add explicit temporal/authZ checks inside event and setlist RPCs.
  - `save_event_with_optional_room_reservation(...)` must reject edits when the target event is no longer editable.
  - `replace_event_setlist(...)` must apply the same event editability rule instead of trusting only `can_manage_events()`.

- [ ] Restrict member assignment mutations to allowed transitions.
  - Preserve the existing "member updates own status before `start_at`" capability, but narrow it to explicit status changes instead of a broad row update.
  - Prevent member-side mutation of structural fields such as `schedule_id`, `role_id`, `user_id`, and arbitrary `confirmed_at`.

- [ ] Scope notification reads and mutations to the subscribed user.
  - Require `userId` in `getNotifications`, `markNotificationAsRead`, `markAllNotificationsAsRead`, and `getUnreadNotificationsCount`.
  - Update the notification store so every fetch/mutation passes `subscribedUserId`.
  - Preserve realtime behavior as-is because it already filters by `user_id`.

### Wave 1 - Visible core closeout

**Files:**
- Modify: `src/screens/app/HomeScreen.tsx`
- Modify: `src/screens/app/SwapRequestsScreen.tsx`
- Modify: `src/screens/app/CreateEventScreen.tsx`
- Modify: `src/screens/app/EventsScreen.tsx`
- Modify: `src/screens/app/ManageEventPermissionsScreen.tsx`
- Modify: `src/stores/useEventStore.ts`
- Modify: `src/services/eventService.ts`
- Modify: `src/utils/userFacingErrors.ts`

- [ ] Re-enable the `Trocas` entry from Home and point it to the existing `SwapRequests` flow.

- [ ] Fix the `Minhas` filter in `SwapRequestsScreen`.
  - "Minhas" should show only requests created from the current user's assignments.
  - "Disponiveis" should keep showing only pending requests from other people that the current user can act on.

- [ ] Surface the real friendly event/room error in `CreateEventScreen`.
  - Reuse the service-layer error string instead of collapsing all failures into the same generic message.
  - Preserve the current sanitized UX contract; do not expose raw Supabase text.

- [ ] Resolve the event deletion mismatch.
  - Preferred path: implement delete in the event service/store and add the CTA only where permission already exists.
  - Fallback path if deletion is intentionally out of scope: align admin/event-management copy so it promises only what the UI actually supports.

### Wave 2 - Cross-screen polish

**Files:**
- Modify: `src/screens/app/HomeScreen.tsx`
- Modify: `src/screens/app/ScheduleScreen.tsx`
- Modify: `src/screens/app/SwapRequestsScreen.tsx`
- Modify: `src/screens/app/RoomsScreen.tsx`
- Modify: `src/screens/app/MusicScreen.tsx`
- Modify: `src/screens/app/ManageEventPermissionsScreen.tsx`
- Modify: `src/utils/eventDate.ts`
- Modify: any remaining form helper still building local date/time outside the shared contract

- [ ] Standardize loading/error/empty states across the main operational surfaces.
  - Prefer one consistent pattern for initial loading, pull-to-refresh, inline retry, and empty-state messaging.
  - Keep copy explicit about user context: "nenhuma troca disponivel", "nenhuma proxima escala", "nenhuma reserva no dia", etc.

- [ ] Expand the shared local-date-to-UTC contract to remaining forms.
  - Reuse `buildUtcRangeFromLocalForm(...)` or a sibling helper instead of screen-local ad hoc conversions.
  - Keep the current rule set intact: local church timezone UX, UTC persistence, default three-hour duration when relevant.

### Wave 3 - Operational remote closeout

**Files:**
- Modify: `docs/SUPABASE_REMOTE_RUNBOOK.md`
- Modify: `docs/TASKS.md`

- [ ] Audit historical rows that would fail `events_end_after_start_check` and `room_reservations_end_after_start_check`.
- [ ] Validate the constraints remotely only after cleanup succeeds.
- [ ] Record the exact operational result back in the runbook/backlog so the repo no longer carries this as an open hidden risk.

## Test Plan

- Run `npm test` after each merged wave.
- Add migration tests that assert:
  - privileged profile fields cannot be self-updated through the old direct path
  - event/setlist RPC migrations mention the required editability checks
  - member assignment transition hardening exists in SQL
- Add notification service/store tests for:
  - listing only the active user's notifications
  - marking a single notification as read without touching another user
  - marking all notifications as read only for the active user
- Add UI/service tests for:
  - `SwapRequestsScreen` "Minhas" filter behavior
  - Home shortcut navigation to `SwapRequests`
  - friendly room-conflict error propagation in event creation/editing

## Assumptions

- The approved track is still "close the current core" rather than start a new product module.
- Event-private notifications and room-reservation notifications stay out of the first implementation wave because their payload/copy rules are still not decision-complete.
- If event deletion is intentionally out of scope for now, we should prefer copy alignment over a half-finished destructive flow.
