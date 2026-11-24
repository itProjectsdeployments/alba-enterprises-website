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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applicants: {
        Row: {
          cv_url: string
          email: string
          id: string
          job_id: string
          name: string
          phone: string
          status: string
          uploaded_at: string
        }
        Insert: {
          cv_url: string
          email: string
          id?: string
          job_id: string
          name: string
          phone: string
          status?: string
          uploaded_at?: string
        }
        Update: {
          cv_url?: string
          email?: string
          id?: string
          job_id?: string
          name?: string
          phone?: string
          status?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicants_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_at: string | null
          id: string
          job_id: string
          resume_url: string | null
          status: string | null
          worker_id: string
        }
        Insert: {
          applied_at?: string | null
          id?: string
          job_id: string
          resume_url?: string | null
          status?: string | null
          worker_id: string
        }
        Update: {
          applied_at?: string | null
          id?: string
          job_id?: string
          resume_url?: string | null
          status?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          id: string
          candidate_id: string | null
          job_id: string | null
          client_id: string | null
          application_id: string | null
          kind: string
          content: string
          created_by: string | null
          created_by_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          candidate_id?: string | null
          job_id?: string | null
          client_id?: string | null
          application_id?: string | null
          kind?: string
          content: string
          created_by?: string | null
          created_by_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string | null
          job_id?: string | null
          client_id?: string | null
          application_id?: string | null
          kind?: string
          content?: string
          created_by?: string | null
          created_by_email?: string | null
          created_at?: string
        }
        Relationships: []
      }
      crm_applications: {
        Row: {
          id: string
          job_id: string
          candidate_id: string
          stage: string
          score_skill: number | null
          score_experience: number | null
          score_communication: number | null
          score_grooming: number | null
          screening_notes: string | null
          cv_sent_at: string | null
          offer_salary: string | null
          offer_date: string | null
          offer_status: string | null
          joining_date: string | null
          joined_on: string | null
          rejection_reason: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          candidate_id: string
          stage?: string
          score_skill?: number | null
          score_experience?: number | null
          score_communication?: number | null
          score_grooming?: number | null
          screening_notes?: string | null
          cv_sent_at?: string | null
          offer_salary?: string | null
          offer_date?: string | null
          offer_status?: string | null
          joining_date?: string | null
          joined_on?: string | null
          rejection_reason?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          candidate_id?: string
          stage?: string
          score_skill?: number | null
          score_experience?: number | null
          score_communication?: number | null
          score_grooming?: number | null
          screening_notes?: string | null
          cv_sent_at?: string | null
          offer_salary?: string | null
          offer_date?: string | null
          offer_status?: string | null
          joining_date?: string | null
          joined_on?: string | null
          rejection_reason?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_candidates: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          email: string | null
          city: string | null
          job_role: string | null
          department: string | null
          experience: string | null
          current_employer: string | null
          current_salary: string | null
          expected_salary: string | null
          notice_period: string | null
          source: string
          status: string
          next_follow_up: string | null
          interview_at: string | null
          notes: string | null
          cv_url: string | null
          tags: string[]
          extra: Json
          source_ref: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          phone?: string | null
          email?: string | null
          city?: string | null
          job_role?: string | null
          department?: string | null
          experience?: string | null
          current_employer?: string | null
          current_salary?: string | null
          expected_salary?: string | null
          notice_period?: string | null
          source?: string
          status?: string
          next_follow_up?: string | null
          interview_at?: string | null
          notes?: string | null
          cv_url?: string | null
          tags?: string[]
          extra?: Json
          source_ref?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          email?: string | null
          city?: string | null
          job_role?: string | null
          department?: string | null
          experience?: string | null
          current_employer?: string | null
          current_salary?: string | null
          expected_salary?: string | null
          notice_period?: string | null
          source?: string
          status?: string
          next_follow_up?: string | null
          interview_at?: string | null
          notes?: string | null
          cv_url?: string | null
          tags?: string[]
          extra?: Json
          source_ref?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_clients: {
        Row: {
          id: string
          name: string
          property_type: string | null
          city: string | null
          address: string | null
          contact_person: string | null
          contact_designation: string | null
          contact_phone: string | null
          contact_email: string | null
          terms: string | null
          status: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          property_type?: string | null
          city?: string | null
          address?: string | null
          contact_person?: string | null
          contact_designation?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          terms?: string | null
          status?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          property_type?: string | null
          city?: string | null
          address?: string | null
          contact_person?: string | null
          contact_designation?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          terms?: string | null
          status?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_documents: {
        Row: {
          id: string
          candidate_id: string
          doc_type: string
          status: string
          file_path: string | null
          notes: string | null
          verified_at: string | null
          verified_by_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          doc_type: string
          status?: string
          file_path?: string | null
          notes?: string | null
          verified_at?: string | null
          verified_by_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          doc_type?: string
          status?: string
          file_path?: string | null
          notes?: string | null
          verified_at?: string | null
          verified_by_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_followups: {
        Row: {
          id: string
          application_id: string
          title: string
          due_date: string
          status: string
          candidate_feedback: string | null
          client_feedback: string | null
          satisfaction: number | null
          notes: string | null
          done_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          title: string
          due_date: string
          status?: string
          candidate_feedback?: string | null
          client_feedback?: string | null
          satisfaction?: number | null
          notes?: string | null
          done_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          title?: string
          due_date?: string
          status?: string
          candidate_feedback?: string | null
          client_feedback?: string | null
          satisfaction?: number | null
          notes?: string | null
          done_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_interviews: {
        Row: {
          id: string
          application_id: string
          kind: string
          mode: string
          scheduled_at: string
          location: string | null
          interviewer: string | null
          status: string
          result: string
          feedback: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          kind?: string
          mode?: string
          scheduled_at: string
          location?: string | null
          interviewer?: string | null
          status?: string
          result?: string
          feedback?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          kind?: string
          mode?: string
          scheduled_at?: string
          location?: string | null
          interviewer?: string | null
          status?: string
          result?: string
          feedback?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_jobs: {
        Row: {
          id: string
          intake_key: string | null
          client_id: string | null
          title: string
          department: string | null
          level: string | null
          openings: number
          location: string | null
          salary_range: string | null
          experience_required: string | null
          shift: string | null
          benefits: string | null
          skills: string | null
          description: string | null
          target_date: string | null
          priority: string
          status: string
          public_job_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          intake_key?: string | null
          client_id?: string | null
          title: string
          department?: string | null
          level?: string | null
          openings?: number
          location?: string | null
          salary_range?: string | null
          experience_required?: string | null
          shift?: string | null
          benefits?: string | null
          skills?: string | null
          description?: string | null
          target_date?: string | null
          priority?: string
          status?: string
          public_job_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          intake_key?: string | null
          client_id?: string | null
          title?: string
          department?: string | null
          level?: string | null
          openings?: number
          location?: string | null
          salary_range?: string | null
          experience_required?: string | null
          shift?: string | null
          benefits?: string | null
          skills?: string | null
          description?: string | null
          target_date?: string | null
          priority?: string
          status?: string
          public_job_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_settings: {
        Row: {
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_tasks: {
        Row: {
          id: string
          title: string
          due_date: string | null
          priority: string
          done: boolean
          candidate_id: string | null
          job_id: string | null
          client_id: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          due_date?: string | null
          priority?: string
          done?: boolean
          candidate_id?: string | null
          job_id?: string | null
          client_id?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          due_date?: string | null
          priority?: string
          done?: boolean
          candidate_id?: string | null
          job_id?: string | null
          client_id?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          category: string
          country: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_active: boolean | null
          location: string | null
          recruiter_id: string | null
          salary: string | null
          status: string
          title: string
        }
        Insert: {
          category: string
          country: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          recruiter_id?: string | null
          salary?: string | null
          status?: string
          title: string
        }
        Update: {
          category?: string
          country?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          recruiter_id?: string | null
          salary?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean | null
          company_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
        }
        Insert: {
          approved?: boolean | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          approved?: boolean | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      queries: {
        Row: {
          created_at: string
          cv_url: string | null
          email: string
          id: string
          message: string
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          cv_url?: string | null
          email: string
          id?: string
          message: string
          name: string
          phone: string
        }
        Update: {
          created_at?: string
          cv_url?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      recruiter_requirements: {
        Row: {
          created_at: string | null
          id: string
          job_title: string
          location: string | null
          number_required: number | null
          recruiter_id: string
          salary_range: string | null
          skill_required: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_title: string
          location?: string | null
          number_required?: number | null
          recruiter_id: string
          salary_range?: string | null
          skill_required?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_title?: string
          location?: string | null
          number_required?: number | null
          recruiter_id?: string
          salary_range?: string | null
          skill_required?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_requirements_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      is_staff: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "recruiter" | "worker" | "hr"
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
      app_role: ["admin", "user", "recruiter", "worker", "hr"],
    },
  },
} as const
