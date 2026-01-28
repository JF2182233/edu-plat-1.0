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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      modules: {
        Row: {
          created_at: string
          description_en: string
          description_sv: string
          id: string
          is_published: boolean
          read_content_en: string
          read_content_sv: string
          sort_order: number
          title_en: string
          title_sv: string
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          description_en: string
          description_sv: string
          id?: string
          is_published?: boolean
          read_content_en: string
          read_content_sv: string
          sort_order?: number
          title_en: string
          title_sv: string
          updated_at?: string
          video_url: string
        }
        Update: {
          created_at?: string
          description_en?: string
          description_sv?: string
          id?: string
          is_published?: boolean
          read_content_en?: string
          read_content_sv?: string
          sort_order?: number
          title_en?: string
          title_sv?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      module_topics: {
        Row: {
          created_at: string
          description_en: string
          description_sv: string
          id: string
          module_id: string
          read_content_en: string
          read_content_sv: string
          sort_order: number
          title_en: string
          title_sv: string
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          description_en: string
          description_sv: string
          id?: string
          module_id: string
          read_content_en: string
          read_content_sv: string
          sort_order?: number
          title_en: string
          title_sv: string
          updated_at?: string
          video_url: string
        }
        Update: {
          created_at?: string
          description_en?: string
          description_sv?: string
          id?: string
          module_id?: string
          read_content_en?: string
          read_content_sv?: string
          sort_order?: number
          title_en?: string
          title_sv?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_topics_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_access: {
        Row: {
          created_at: string
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_access_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_index: number
          explanation: string | null
          id: string
          module_id: string
          topic_id: string
          options: Json
          question_text: string
          sort_order: number
        }
        Insert: {
          correct_index: number
          explanation?: string | null
          id?: string
          module_id: string
          topic_id: string
          options: Json
          question_text: string
          sort_order?: number
        }
        Update: {
          correct_index?: number
          explanation?: string | null
          id?: string
          module_id?: string
          topic_id?: string
          options?: Json
          question_text?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "module_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          best_score: number
          completed_at: string | null
          id: string
          latest_score: number
          module_id: string
          quiz_attempts: number
          step_read_done: boolean
          step_watch_done: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          best_score?: number
          completed_at?: string | null
          id?: string
          latest_score?: number
          module_id: string
          quiz_attempts?: number
          step_read_done?: boolean
          step_watch_done?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          best_score?: number
          completed_at?: string | null
          id?: string
          latest_score?: number
          module_id?: string
          quiz_attempts?: number
          step_read_done?: boolean
          step_watch_done?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_progress: {
        Row: {
          best_score: number
          completed_at: string | null
          id: string
          latest_score: number
          quiz_attempts: number
          step_read_done: boolean
          step_watch_done: boolean
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          best_score?: number
          completed_at?: string | null
          id?: string
          latest_score?: number
          quiz_attempts?: number
          step_read_done?: boolean
          step_watch_done?: boolean
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          best_score?: number
          completed_at?: string | null
          id?: string
          latest_score?: number
          quiz_attempts?: number
          step_read_done?: boolean
          step_watch_done?: boolean
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "module_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_quiz_questions: {
        Args: { p_topic_id: string }
        Returns: {
          id: string
          options: Json
          question_text: string
          sort_order: number
        }[]
      }
      get_quiz_results: {
        Args: { p_topic_id: string }
        Returns: {
          correct_index: number
          explanation: string
          options: Json
          question_id: string
          question_text: string
          sort_order: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_can_access_module: {
        Args: { p_module_id: string; p_user_id: string }
        Returns: boolean
      }
      submit_quiz_answers: {
        Args: { p_answers: Json; p_topic_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "user" | "admin"
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
      app_role: ["user", "admin"],
    },
  },
} as const
