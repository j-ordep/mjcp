export interface UserProfile {
  id: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  role: 'admin' | 'leader' | 'member'
  created_at: string
}

export interface Ministry {
  id: string
  name: string
  description: string | null
  color: string
}

export interface MinistryRole {
  id: string
  ministry_id: string
  name: string  // ex: "Guitarra", "Vocal", "Portaria"
}

export interface MinistryMember {
  id: string
  ministry_id: string
  user_id: string
  is_leader: boolean
  joined_at: string
}

export interface MinistryMemberRole {
  id: string
  member_id: string
  role_id: string
}

export interface Event {
  id: string
  title: string
  description: string | null
  location: string | null
  start_at: string
  end_at: string | null
  is_public: boolean
}

// ─── Schedules ────────────────────────────────────────────────────────
// Bloco de escala de um ministério dentro de um evento
export interface Schedule {
  id: string
  event_id: string
  ministry_id: string
  notes: string | null
  created_at: string
}

// Assignment: "João VAI tocar Guitarra no Culto Domingo"
export interface ScheduleAssignment {
  id: string
  schedule_id: string
  user_id: string
  role_id: string
  status: 'pending' | 'confirmed' | 'declined' | 'swapped'
  confirmed_at: string | null
  created_at: string
}

// REVER LOGICA DE TROCA
// ─── Swap Requests ────────────────────────────────────────────────────
export interface SwapRequest {
  id: string
  from_assignment_id: string
  to_assignment_id: string | null
  to_user_id: string | null
  reason: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reviewed_by: string | null
  created_at: string
  updated_at: string
}

// ─── Blocked Dates ────────────────────────────────────────────────────
export interface BlockedDate {
  id: string
  user_id: string
  date: string   // formato "YYYY-MM-DD"
  reason: string | null
  created_at: string
}

// ─── Songs & Setlists ─────────────────────────────────────────────────
export type SongCategory = 'louvor' | 'adoracao' | 'infantil' | 'outro'

export interface Song {
  id: string
  title: string
  artist: string | null
  key: string | null       // tom musical: "G", "Bb", "C#"...
  bpm: number | null
  category: SongCategory | null
  lyrics_url: string | null
  created_at: string
}

export interface EventSetlist {
  id: string
  event_id: string
  song_id: string
  position: number   // ordem na setlist
  song_key: string | null  // override do tom para este evento
}

export interface Room {
  id: string
  name: string
  capacity: number
  description: string | null
}

// ─── Room Reservations ────────────────────────────────────
export interface RoomReservation {
  id: string
  room_id: string
  reserved_by: string
  start_at: string
  end_at: string
  purpose: string | null
  status: 'active' | 'cancelled'
  created_at: string
}

export type NotificationType = 'schedule' | 'swap_request' | 'room' | 'general'

export interface Notification {
  id: string
  title: string
  body: string | null
  type: NotificationType
  data: Record<string, unknown>  // JSONB — pode ter qualquer coisa dentro
  read: boolean
  created_at: string
}
