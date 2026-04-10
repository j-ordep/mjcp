export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = 'admin' | 'leader' | 'member';
export type AssignmentStatus = 'pending' | 'confirmed' | 'declined' | 'swapped';
export type SwapRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type NotificationType = 'schedule' | 'swap_request' | 'room' | 'general';
export type SongCategory = 'louvor' | 'adoracao' | 'infantil' | 'outro';
export type RoomReservationStatus = 'active' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: AppRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      ministries: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          created_at?: string;
        };
      };
      ministry_roles: {
        Row: {
          id: string;
          ministry_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ministry_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ministry_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      ministry_members: {
        Row: {
          id: string;
          ministry_id: string;
          user_id: string;
          is_leader: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          ministry_id: string;
          user_id: string;
          is_leader?: boolean;
          joined_at?: string;
        };
        Update: {
          id?: string;
          ministry_id?: string;
          user_id?: string;
          is_leader?: boolean;
          joined_at?: string;
        };
      };
      ministry_member_roles: {
        Row: {
          id: string;
          member_id: string;
          role_id: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          role_id: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          role_id?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          location: string | null;
          start_at: string;
          end_at: string | null;
          is_public: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          location?: string | null;
          start_at: string;
          end_at?: string | null;
          is_public?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          start_at?: string;
          end_at?: string | null;
          is_public?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      schedules: {
        Row: {
          id: string;
          event_id: string;
          ministry_id: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          ministry_id: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          ministry_id?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      schedule_assignments: {
        Row: {
          id: string;
          schedule_id: string;
          user_id: string;
          role_id: string;
          status: AssignmentStatus;
          confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          user_id: string;
          role_id: string;
          status?: AssignmentStatus;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          schedule_id?: string;
          user_id?: string;
          role_id?: string;
          status?: AssignmentStatus;
          confirmed_at?: string | null;
          created_at?: string;
        };
      };
      swap_requests: {
        Row: {
          id: string;
          from_assignment_id: string;
          to_assignment_id: string | null;
          to_user_id: string | null;
          reason: string | null;
          status: SwapRequestStatus;
          reviewed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          from_assignment_id: string;
          to_assignment_id?: string | null;
          to_user_id?: string | null;
          reason?: string | null;
          status?: SwapRequestStatus;
          reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          from_assignment_id?: string;
          to_assignment_id?: string | null;
          to_user_id?: string | null;
          reason?: string | null;
          status?: SwapRequestStatus;
          reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      blocked_dates: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          reason?: string | null;
          created_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          capacity: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          capacity?: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          capacity?: number;
          description?: string | null;
          created_at?: string;
        };
      };
      room_reservations: {
        Row: {
          id: string;
          room_id: string;
          reserved_by: string;
          start_at: string;
          end_at: string;
          purpose: string | null;
          status: RoomReservationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          reserved_by: string;
          start_at: string;
          end_at: string;
          purpose?: string | null;
          status?: RoomReservationStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          reserved_by?: string;
          start_at?: string;
          end_at?: string;
          purpose?: string | null;
          status?: RoomReservationStatus;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string | null;
          type: NotificationType;
          data: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body?: string | null;
          type: NotificationType;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string | null;
          type?: NotificationType;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
      };
      songs: {
        Row: {
          id: string;
          title: string;
          artist: string | null;
          key: string | null;
          bpm: number | null;
          category: SongCategory | null;
          lyrics_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          artist?: string | null;
          key?: string | null;
          bpm?: number | null;
          category?: SongCategory | null;
          lyrics_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          artist?: string | null;
          key?: string | null;
          bpm?: number | null;
          category?: SongCategory | null;
          lyrics_url?: string | null;
          created_at?: string;
        };
      };
      event_setlists: {
        Row: {
          id: string;
          event_id: string;
          song_id: string;
          position: number;
          song_key: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          song_id: string;
          position?: number;
          song_key?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          song_id?: string;
          position?: number;
          song_key?: string | null;
        };
      };
    };
  };
}

export type PublicSchema = Database['public'];
export type PublicTables = PublicSchema['Tables'];
export type TableRow<T extends keyof PublicTables> = PublicTables[T]['Row'];
export type TableInsert<T extends keyof PublicTables> = PublicTables[T]['Insert'];
export type TableUpdate<T extends keyof PublicTables> = PublicTables[T]['Update'];
