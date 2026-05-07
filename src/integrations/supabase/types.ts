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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      beta_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          max_uses: number | null
          uses_count: number | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses_count?: number | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses_count?: number | null
        }
        Relationships: []
      }
      blog_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      calendar_ideas: {
        Row: {
          channel: string | null
          converted: boolean
          dismissed: boolean
          generated_at: string
          id: string
          idea_text: string
          idea_type: string | null
          metadata: Json | null
          pillar: string | null
          user_id: string
        }
        Insert: {
          channel?: string | null
          converted?: boolean
          dismissed?: boolean
          generated_at?: string
          id?: string
          idea_text: string
          idea_type?: string | null
          metadata?: Json | null
          pillar?: string | null
          user_id: string
        }
        Update: {
          channel?: string | null
          converted?: boolean
          dismissed?: boolean
          generated_at?: string
          id?: string
          idea_text?: string
          idea_type?: string | null
          metadata?: Json | null
          pillar?: string | null
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          campaign_type: string | null
          channels: string[] | null
          color: string
          content_plan: Json | null
          created_at: string
          end_date: string | null
          goals: string | null
          id: string
          name: string
          notes: string | null
          start_date: string | null
          status: string | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_type?: string | null
          channels?: string[] | null
          color?: string
          content_plan?: Json | null
          created_at?: string
          end_date?: string | null
          goals?: string | null
          id?: string
          name: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_type?: string | null
          channels?: string[] | null
          color?: string
          content_plan?: Json | null
          created_at?: string
          end_date?: string | null
          goals?: string | null
          id?: string
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          body: string | null
          campaign_id: string | null
          content_type: string | null
          created_at: string
          engagement: Json
          id: string
          platform: string | null
          platform_post_id: string | null
          published_at: string | null
          scheduled_for: string | null
          status: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          campaign_id?: string | null
          content_type?: string | null
          created_at?: string
          engagement?: Json
          id?: string
          platform?: string | null
          platform_post_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          campaign_id?: string | null
          content_type?: string | null
          created_at?: string
          engagement?: Json
          id?: string
          platform?: string | null
          platform_post_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_sessions: {
        Row: {
          answers: Json
          completed_at: string | null
          current_question: number
          current_section: number
          id: string
          messages: Json
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          current_question?: number
          current_section?: number
          id?: string
          messages?: Json
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          current_question?: number
          current_section?: number
          id?: string
          messages?: Json
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_sends: {
        Row: {
          body: string | null
          campaign_id: string | null
          click_rate: number | null
          id: string
          open_rate: number | null
          recipient_count: number | null
          recipient_ids: Json
          resend_email_id: string | null
          scheduled_for: string | null
          segment: string | null
          sent_at: string | null
          status: string
          subject: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          campaign_id?: string | null
          click_rate?: number | null
          id?: string
          open_rate?: number | null
          recipient_count?: number | null
          recipient_ids?: Json
          resend_email_id?: string | null
          scheduled_for?: string | null
          segment?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          campaign_id?: string | null
          click_rate?: number | null
          id?: string
          open_rate?: number | null
          recipient_count?: number | null
          recipient_ids?: Json
          resend_email_id?: string | null
          scheduled_for?: string | null
          segment?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          feedback_type: string | null
          id: string
          message: string
          page_url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback_type?: string | null
          id?: string
          message: string
          page_url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback_type?: string | null
          id?: string
          message?: string
          page_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      goal_entries: {
        Row: {
          created_at: string
          discovery_calls: number
          email_opens: number
          id: string
          notes: string | null
          posts_published: number
          updated_at: string
          user_id: string
          week_of: string
        }
        Insert: {
          created_at?: string
          discovery_calls?: number
          email_opens?: number
          id?: string
          notes?: string | null
          posts_published?: number
          updated_at?: string
          user_id: string
          week_of: string
        }
        Update: {
          created_at?: string
          discovery_calls?: number
          email_opens?: number
          id?: string
          notes?: string | null
          posts_published?: number
          updated_at?: string
          user_id?: string
          week_of?: string
        }
        Relationships: []
      }
      onboarding_responses: {
        Row: {
          completed_at: string | null
          id: string
          response: Json | null
          step: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          response?: Json | null
          step: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          response?: Json | null
          step?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          beta_code_used: string | null
          brand_assets: Json | null
          business_name: string | null
          created_at: string
          email: string | null
          email_settings: Json | null
          full_name: string | null
          id: string
          industry: string | null
          intended_use: Json | null
          is_admin: boolean | null
          onboarding_completed: boolean | null
          plan: string | null
          referral_source: string | null
          role: string | null
          team_size: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          beta_code_used?: string | null
          brand_assets?: Json | null
          business_name?: string | null
          created_at?: string
          email?: string | null
          email_settings?: Json | null
          full_name?: string | null
          id: string
          industry?: string | null
          intended_use?: Json | null
          is_admin?: boolean | null
          onboarding_completed?: boolean | null
          plan?: string | null
          referral_source?: string | null
          role?: string | null
          team_size?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          beta_code_used?: string | null
          brand_assets?: Json | null
          business_name?: string | null
          created_at?: string
          email?: string | null
          email_settings?: Json | null
          full_name?: string | null
          id?: string
          industry?: string | null
          intended_use?: Json | null
          is_admin?: boolean | null
          onboarding_completed?: boolean | null
          plan?: string | null
          referral_source?: string | null
          role?: string | null
          team_size?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      resources_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      social_analytics: {
        Row: {
          comments: number
          engagement_rate: number
          fetched_at: string
          id: string
          impressions: number
          likes: number
          platform: string
          post_id: string | null
          raw_data: Json
          reach: number
          shares: number
          user_id: string
        }
        Insert: {
          comments?: number
          engagement_rate?: number
          fetched_at?: string
          id?: string
          impressions?: number
          likes?: number
          platform: string
          post_id?: string | null
          raw_data?: Json
          reach?: number
          shares?: number
          user_id: string
        }
        Update: {
          comments?: number
          engagement_rate?: number
          fetched_at?: string
          id?: string
          impressions?: number
          likes?: number
          platform?: string
          post_id?: string | null
          raw_data?: Json
          reach?: number
          shares?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_connections: {
        Row: {
          access_token: string | null
          connected_at: string
          expires_at: string | null
          id: string
          platform: string
          profile_image: string | null
          profile_name: string | null
          profile_url: string | null
          refresh_token: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string
          expires_at?: string | null
          id?: string
          platform: string
          profile_image?: string | null
          profile_name?: string | null
          profile_url?: string | null
          refresh_token?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string
          expires_at?: string | null
          id?: string
          platform?: string
          profile_image?: string | null
          profile_name?: string | null
          profile_url?: string | null
          refresh_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          campaign_id: string | null
          canva_design_id: string | null
          content_by_platform: Json
          created_at: string
          id: string
          image_urls: Json
          is_inspiration: boolean
          is_template: boolean
          media_urls: Json
          pillar: string | null
          platform_post_ids: Json
          platforms: string[]
          published_at: string | null
          scheduled_for: string | null
          status: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          canva_design_id?: string | null
          content_by_platform?: Json
          created_at?: string
          id?: string
          image_urls?: Json
          is_inspiration?: boolean
          is_template?: boolean
          media_urls?: Json
          pillar?: string | null
          platform_post_ids?: Json
          platforms?: string[]
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          canva_design_id?: string | null
          content_by_platform?: Json
          created_at?: string
          id?: string
          image_urls?: Json
          is_inspiration?: boolean
          is_template?: boolean
          media_urls?: Json
          pillar?: string | null
          platform_post_ids?: Json
          platforms?: string[]
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          anti_positioning: string | null
          archetype: Json | null
          brand_health: Json | null
          business_goal: string | null
          calendar_entries: Json | null
          content_pillars: Json | null
          content_themes: Json | null
          created_at: string
          enhanced_foundation: Json | null
          id: string
          ideal_client: string | null
          methodology: string | null
          pain_point: string | null
          positioning_statement: string | null
          posting_frequency: string | null
          primary_channel: string | null
          raw_foundation: Json | null
          report_cached: Json | null
          strength_breakdown: Json | null
          strength_score: number | null
          strong_areas: Json | null
          success_definition: string | null
          task_completion: Json
          time_capacity: string | null
          transformation: string | null
          updated_at: string
          use_words: Json | null
          user_id: string
          voice_attributes: Json | null
          weak_areas: Json | null
        }
        Insert: {
          anti_positioning?: string | null
          archetype?: Json | null
          brand_health?: Json | null
          business_goal?: string | null
          calendar_entries?: Json | null
          content_pillars?: Json | null
          content_themes?: Json | null
          created_at?: string
          enhanced_foundation?: Json | null
          id?: string
          ideal_client?: string | null
          methodology?: string | null
          pain_point?: string | null
          positioning_statement?: string | null
          posting_frequency?: string | null
          primary_channel?: string | null
          raw_foundation?: Json | null
          report_cached?: Json | null
          strength_breakdown?: Json | null
          strength_score?: number | null
          strong_areas?: Json | null
          success_definition?: string | null
          task_completion?: Json
          time_capacity?: string | null
          transformation?: string | null
          updated_at?: string
          use_words?: Json | null
          user_id: string
          voice_attributes?: Json | null
          weak_areas?: Json | null
        }
        Update: {
          anti_positioning?: string | null
          archetype?: Json | null
          brand_health?: Json | null
          business_goal?: string | null
          calendar_entries?: Json | null
          content_pillars?: Json | null
          content_themes?: Json | null
          created_at?: string
          enhanced_foundation?: Json | null
          id?: string
          ideal_client?: string | null
          methodology?: string | null
          pain_point?: string | null
          positioning_statement?: string | null
          posting_frequency?: string | null
          primary_channel?: string | null
          raw_foundation?: Json | null
          report_cached?: Json | null
          strength_breakdown?: Json | null
          strength_score?: number | null
          strong_areas?: Json | null
          success_definition?: string | null
          task_completion?: Json
          time_capacity?: string | null
          transformation?: string | null
          updated_at?: string
          use_words?: Json | null
          user_id?: string
          voice_attributes?: Json | null
          weak_areas?: Json | null
        }
        Relationships: []
      }
      subscriber_segments: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          email: string
          id: string
          name: string | null
          notes: string | null
          status: string | null
          subscribed_at: string | null
          tags: Json
          unsubscribed_at: string | null
          user_id: string
        }
        Insert: {
          email: string
          id?: string
          name?: string | null
          notes?: string | null
          status?: string | null
          subscribed_at?: string | null
          tags?: Json
          unsubscribed_at?: string | null
          user_id: string
        }
        Update: {
          email?: string
          id?: string
          name?: string | null
          notes?: string | null
          status?: string | null
          subscribed_at?: string | null
          tags?: Json
          unsubscribed_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          beta_code_sent: string | null
          company_name: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          notes: string | null
          referral_source: string | null
          role: string | null
          scheduled_call_at: string | null
          status: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          beta_code_sent?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          notes?: string | null
          referral_source?: string | null
          role?: string | null
          scheduled_call_at?: string | null
          status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          beta_code_sent?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          referral_source?: string | null
          role?: string | null
          scheduled_call_at?: string | null
          status?: string | null
          updated_at?: string | null
          website_url?: string | null
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
