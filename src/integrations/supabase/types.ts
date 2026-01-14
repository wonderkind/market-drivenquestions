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
      analysis_results: {
        Row: {
          analysis_data: Json
          created_at: string
          id: string
          search_id: string | null
          user_id: string
        }
        Insert: {
          analysis_data: Json
          created_at?: string
          id?: string
          search_id?: string | null
          user_id: string
        }
        Update: {
          analysis_data?: Json
          created_at?: string
          id?: string
          search_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "saved_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_jobs: {
        Row: {
          created_at: string
          employer_logo: string | null
          employer_name: string | null
          id: string
          job_apply_link: string | null
          job_description: string | null
          job_employment_type: string | null
          job_id: string
          job_location: string | null
          job_posted_at: string | null
          job_title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          employer_logo?: string | null
          employer_name?: string | null
          id?: string
          job_apply_link?: string | null
          job_description?: string | null
          job_employment_type?: string | null
          job_id: string
          job_location?: string | null
          job_posted_at?: string | null
          job_title: string
          user_id: string
        }
        Update: {
          created_at?: string
          employer_logo?: string | null
          employer_name?: string | null
          id?: string
          job_apply_link?: string | null
          job_description?: string | null
          job_employment_type?: string | null
          job_id?: string
          job_location?: string | null
          job_posted_at?: string | null
          job_title?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          created_at: string
          employer_logo: string | null
          employer_name: string | null
          employer_website: string | null
          enhanced_data_fetched: boolean | null
          id: string
          job_apply_link: string | null
          job_benefits: string[] | null
          job_city: string | null
          job_country: string | null
          job_description: string | null
          job_employment_type: string | null
          job_highlights: Json | null
          job_id: string
          job_is_remote: boolean | null
          job_location: string | null
          job_max_salary: number | null
          job_min_salary: number | null
          job_posted_at: string | null
          job_publisher: string | null
          job_salary_period: string | null
          job_state: string | null
          job_title: string
          search_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employer_logo?: string | null
          employer_name?: string | null
          employer_website?: string | null
          enhanced_data_fetched?: boolean | null
          id?: string
          job_apply_link?: string | null
          job_benefits?: string[] | null
          job_city?: string | null
          job_country?: string | null
          job_description?: string | null
          job_employment_type?: string | null
          job_highlights?: Json | null
          job_id: string
          job_is_remote?: boolean | null
          job_location?: string | null
          job_max_salary?: number | null
          job_min_salary?: number | null
          job_posted_at?: string | null
          job_publisher?: string | null
          job_salary_period?: string | null
          job_state?: string | null
          job_title: string
          search_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employer_logo?: string | null
          employer_name?: string | null
          employer_website?: string | null
          enhanced_data_fetched?: boolean | null
          id?: string
          job_apply_link?: string | null
          job_benefits?: string[] | null
          job_city?: string | null
          job_country?: string | null
          job_description?: string | null
          job_employment_type?: string | null
          job_highlights?: Json | null
          job_id?: string
          job_is_remote?: boolean | null
          job_location?: string | null
          job_max_salary?: number | null
          job_min_salary?: number | null
          job_posted_at?: string | null
          job_publisher?: string | null
          job_salary_period?: string | null
          job_state?: string | null
          job_title?: string
          search_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "saved_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      onet_occupations: {
        Row: {
          code: string
          created_at: string | null
          has_data: boolean | null
          id: string
          job_zone: number | null
          title: string
        }
        Insert: {
          code: string
          created_at?: string | null
          has_data?: boolean | null
          id?: string
          job_zone?: number | null
          title: string
        }
        Update: {
          code?: string
          created_at?: string | null
          has_data?: boolean | null
          id?: string
          job_zone?: number | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          country: string
          created_at: string
          date_posted: string
          id: string
          job_title: string
          language: string
          location: string | null
          user_id: string
        }
        Insert: {
          country?: string
          created_at?: string
          date_posted?: string
          id?: string
          job_title: string
          language?: string
          location?: string | null
          user_id: string
        }
        Update: {
          country?: string
          created_at?: string
          date_posted?: string
          id?: string
          job_title?: string
          language?: string
          location?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
