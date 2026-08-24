export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      account_deletions: {
        Row: {
          deleted_at: string
          email: string
          full_name: string
          id: string
          reason: string | null
          role: string
          user_id: string
        }
        Insert: {
          deleted_at?: string
          email: string
          full_name: string
          id?: string
          reason?: string | null
          role: string
          user_id: string
        }
        Update: {
          deleted_at?: string
          email?: string
          full_name?: string
          id?: string
          reason?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          counsellor_user_id: string
          created_at: string
          id: string
          is_emergency: boolean
          mode: string
          notes: string | null
          purpose: string | null
          reason: string | null
          reschedule_note: string | null
          reschedule_requested_at: string | null
          room_id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          student_user_id: string
          updated_at: string
        }
        Insert: {
          counsellor_user_id: string
          created_at?: string
          id?: string
          is_emergency?: boolean
          mode?: string
          notes?: string | null
          purpose?: string | null
          reason?: string | null
          reschedule_note?: string | null
          reschedule_requested_at?: string | null
          room_id?: string
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          student_user_id: string
          updated_at?: string
        }
        Update: {
          counsellor_user_id?: string
          created_at?: string
          id?: string
          is_emergency?: boolean
          mode?: string
          notes?: string | null
          purpose?: string | null
          reason?: string | null
          reschedule_note?: string | null
          reschedule_requested_at?: string | null
          room_id?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          student_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          answers: Json
          created_at: string
          id: string
          risk: Database["public"]["Enums"]["risk_level"]
          scores: Json
          suicidal_flag: boolean
          total_score: number
          user_id: string
          wellbeing_score: number
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          risk?: Database["public"]["Enums"]["risk_level"]
          scores?: Json
          suicidal_flag?: boolean
          total_score?: number
          user_id: string
          wellbeing_score?: number
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          risk?: Database["public"]["Enums"]["risk_level"]
          scores?: Json
          suicidal_flag?: boolean
          total_score?: number
          user_id?: string
          wellbeing_score?: number
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          appointment_id: string | null
          callee_id: string
          caller_id: string
          created_at: string
          duration_seconds: number
          ended_at: string | null
          id: string
          kind: string
          started_at: string
          status: string
        }
        Insert: {
          appointment_id?: string | null
          callee_id: string
          caller_id: string
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          kind?: string
          started_at?: string
          status?: string
        }
        Update: {
          appointment_id?: string | null
          callee_id?: string
          caller_id?: string
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          kind?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          emotion: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          emotion?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          emotion?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          checkin_date: string
          created_at: string
          energy_level: number | null
          id: string
          notes: string | null
          social_level: number | null
          stress_level: number | null
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          energy_level?: number | null
          id?: string
          notes?: string | null
          social_level?: number | null
          stress_level?: number | null
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          energy_level?: number | null
          id?: string
          notes?: string | null
          social_level?: number | null
          stress_level?: number | null
          user_id?: string
        }
        Relationships: []
      }
      counsellors: {
        Row: {
          address: string | null
          availability: string | null
          available_days: string | null
          available_slots: string | null
          bio: string | null
          city: string | null
          clinic: string | null
          consultation_fee: number | null
          country: string | null
          created_at: string
          district: string | null
          email: string
          experience_years: number | null
          full_name: string
          hospital: string | null
          id: string
          is_available: boolean
          is_deleted: boolean
          languages: string | null
          lat: number | null
          license_number: string | null
          lng: number | null
          notify_email: boolean
          notify_push: boolean
          phone: string | null
          photo_url: string | null
          profile_public: boolean
          qualification: string | null
          rating: number
          specialization: string | null
          state: string | null
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          address?: string | null
          availability?: string | null
          available_days?: string | null
          available_slots?: string | null
          bio?: string | null
          city?: string | null
          clinic?: string | null
          consultation_fee?: number | null
          country?: string | null
          created_at?: string
          district?: string | null
          email: string
          experience_years?: number | null
          full_name: string
          hospital?: string | null
          id?: string
          is_available?: boolean
          is_deleted?: boolean
          languages?: string | null
          lat?: number | null
          license_number?: string | null
          lng?: number | null
          notify_email?: boolean
          notify_push?: boolean
          phone?: string | null
          photo_url?: string | null
          profile_public?: boolean
          qualification?: string | null
          rating?: number
          specialization?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          address?: string | null
          availability?: string | null
          available_days?: string | null
          available_slots?: string | null
          bio?: string | null
          city?: string | null
          clinic?: string | null
          consultation_fee?: number | null
          country?: string | null
          created_at?: string
          district?: string | null
          email?: string
          experience_years?: number | null
          full_name?: string
          hospital?: string | null
          id?: string
          is_available?: boolean
          is_deleted?: boolean
          languages?: string | null
          lat?: number | null
          license_number?: string | null
          lng?: number | null
          notify_email?: boolean
          notify_push?: boolean
          phone?: string | null
          photo_url?: string | null
          profile_public?: boolean
          qualification?: string | null
          rating?: number
          specialization?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      emergency_alerts: {
        Row: {
          ai_score: number
          contacts_notified: Json
          counsellor_user_id: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          mental_status: string | null
          reason: string | null
          report: Json
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          risk: Database["public"]["Enums"]["risk_level"]
          student_user_id: string
          summary: string
          trigger_source: string
        }
        Insert: {
          ai_score?: number
          contacts_notified?: Json
          counsellor_user_id?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          mental_status?: string | null
          reason?: string | null
          report?: Json
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          risk?: Database["public"]["Enums"]["risk_level"]
          student_user_id: string
          summary: string
          trigger_source?: string
        }
        Update: {
          ai_score?: number
          contacts_notified?: Json
          counsellor_user_id?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          mental_status?: string | null
          reason?: string | null
          report?: Json
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          risk?: Database["public"]["Enums"]["risk_level"]
          student_user_id?: string
          summary?: string
          trigger_source?: string
        }
        Relationships: []
      }
      emotion_analyses: {
        Row: {
          confidence: number | null
          created_at: string
          details: Json
          distress_score: number
          emotion: string
          id: string
          risk: Database["public"]["Enums"]["risk_level"]
          source: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          details?: Json
          distress_score?: number
          emotion: string
          id?: string
          risk?: Database["public"]["Enums"]["risk_level"]
          source: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          details?: Json
          distress_score?: number
          emotion?: string
          id?: string
          risk?: Database["public"]["Enums"]["risk_level"]
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          sentiment: string | null
          sentiment_score: number | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sentiment?: string | null
          sentiment_score?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sentiment?: string | null
          sentiment_score?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_path: string | null
          attachment_type: string | null
          content: string
          created_at: string
          id: string
          kind: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_type?: string | null
          content?: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_type?: string | null
          content?: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          created_at: string
          id: string
          mood: string
          mood_score: number
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood: string
          mood_score: number
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mood?: string
          mood_score?: number
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      session_notes: {
        Row: {
          appointment_id: string | null
          counsellor_user_id: string
          created_at: string
          id: string
          notes: string
          prescription: string | null
          progress_rating: number | null
          student_user_id: string
        }
        Insert: {
          appointment_id?: string | null
          counsellor_user_id: string
          created_at?: string
          id?: string
          notes: string
          prescription?: string | null
          progress_rating?: number | null
          student_user_id: string
        }
        Update: {
          appointment_id?: string | null
          counsellor_user_id?: string
          created_at?: string
          id?: string
          notes?: string
          prescription?: string | null
          progress_rating?: number | null
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_logs: {
        Row: {
          created_at: string
          hours: number
          id: string
          log_date: string
          quality: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          hours: number
          id?: string
          log_date?: string
          quality?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          hours?: number
          id?: string
          log_date?: string
          quality?: number | null
          user_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          address: string | null
          age: number | null
          avatar_url: string | null
          blood_group: string | null
          city: string | null
          college: string | null
          country: string | null
          created_at: string
          department: string | null
          dob: string | null
          email: string
          emergency_contact: string | null
          friend_mobile: string | null
          friend_name: string | null
          full_name: string
          gender: string | null
          id: string
          last_active_at: string
          last_lat: number | null
          last_lng: number | null
          mobile_number: string | null
          onboarding_complete: boolean
          parent_mobile: string | null
          parent_name: string | null
          perm_camera: boolean
          perm_location: boolean
          perm_microphone: boolean
          perm_notification: boolean
          perm_storage: boolean
          pin_code: string | null
          register_number: string | null
          state: string | null
          updated_at: string
          user_id: string
          year_of_study: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          avatar_url?: string | null
          blood_group?: string | null
          city?: string | null
          college?: string | null
          country?: string | null
          created_at?: string
          department?: string | null
          dob?: string | null
          email: string
          emergency_contact?: string | null
          friend_mobile?: string | null
          friend_name?: string | null
          full_name: string
          gender?: string | null
          id?: string
          last_active_at?: string
          last_lat?: number | null
          last_lng?: number | null
          mobile_number?: string | null
          onboarding_complete?: boolean
          parent_mobile?: string | null
          parent_name?: string | null
          perm_camera?: boolean
          perm_location?: boolean
          perm_microphone?: boolean
          perm_notification?: boolean
          perm_storage?: boolean
          pin_code?: string | null
          register_number?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          year_of_study?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          avatar_url?: string | null
          blood_group?: string | null
          city?: string | null
          college?: string | null
          country?: string | null
          created_at?: string
          department?: string | null
          dob?: string | null
          email?: string
          emergency_contact?: string | null
          friend_mobile?: string | null
          friend_name?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          last_active_at?: string
          last_lat?: number | null
          last_lng?: number | null
          mobile_number?: string | null
          onboarding_complete?: boolean
          parent_mobile?: string | null
          parent_name?: string | null
          perm_camera?: boolean
          perm_location?: boolean
          perm_microphone?: boolean
          perm_notification?: boolean
          perm_storage?: boolean
          pin_code?: string | null
          register_number?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          year_of_study?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_emergency_contact_of: {
        Args: { _counsellor: string; _student: string }
        Returns: boolean
      }
      is_my_patient: {
        Args: { _counsellor: string; _student: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "counsellor" | "admin"
      appointment_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "completed"
        | "cancelled"
      risk_level: "level_1" | "level_2" | "level_3"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "counsellor", "admin"],
      appointment_status: [
        "pending",
        "accepted",
        "rejected",
        "completed",
        "cancelled",
      ],
      risk_level: ["level_1", "level_2", "level_3"],
    },
  },
} as const
