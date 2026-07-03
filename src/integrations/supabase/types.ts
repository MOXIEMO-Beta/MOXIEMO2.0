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
      assets: {
        Row: {
          file_size_kb: number | null
          file_type: string | null
          filename: string | null
          id: string
          platform_tag: string | null
          uploaded_at: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          file_size_kb?: number | null
          file_type?: string | null
          filename?: string | null
          id?: string
          platform_tag?: string | null
          uploaded_at?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          file_size_kb?: number | null
          file_type?: string | null
          filename?: string | null
          id?: string
          platform_tag?: string | null
          uploaded_at?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          brand_audit_score: number | null
          created_at: string
          domain: string | null
          generation_started_at: string | null
          id: string
          inputs: Json | null
          low_data: boolean | null
          model_type: string | null
          posture: string | null
          raw_report: Json | null
          report: Json | null
          review_reason: string | null
          signals: Json | null
          stage: string | null
          status: string
          validation: Json | null
        }
        Insert: {
          brand_audit_score?: number | null
          created_at?: string
          domain?: string | null
          generation_started_at?: string | null
          id?: string
          inputs?: Json | null
          low_data?: boolean | null
          model_type?: string | null
          posture?: string | null
          raw_report?: Json | null
          report?: Json | null
          review_reason?: string | null
          signals?: Json | null
          stage?: string | null
          status?: string
          validation?: Json | null
        }
        Update: {
          brand_audit_score?: number | null
          created_at?: string
          domain?: string | null
          generation_started_at?: string | null
          id?: string
          inputs?: Json | null
          low_data?: boolean | null
          model_type?: string | null
          posture?: string | null
          raw_report?: Json | null
          report?: Json | null
          review_reason?: string | null
          signals?: Json | null
          stage?: string | null
          status?: string
          validation?: Json | null
        }
        Relationships: []
      }
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
      beta20_founding: {
        Row: {
          company: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          referral_source: string | null
          role: string | null
          source: string
          status: string
          tier_interest: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          referral_source?: string | null
          role?: string | null
          source?: string
          status?: string
          tier_interest?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          referral_source?: string | null
          role?: string | null
          source?: string
          status?: string
          tier_interest?: string
          user_id?: string | null
          website?: string | null
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
      brand_kit_leads: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          ip_address: string | null
          last_name: string
          source: string
          user_agent: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          ip_address?: string | null
          last_name: string
          source?: string
          user_agent?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          ip_address?: string | null
          last_name?: string
          source?: string
          user_agent?: string | null
          website_url?: string | null
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
      campaign_execution_items: {
        Row: {
          campaign_id: string
          channel: string
          content_brief: string | null
          created_at: string
          date: string
          id: string
          status: string
          updated_at: string
          user_id: string
          week_number: number | null
          week_theme: string | null
        }
        Insert: {
          campaign_id: string
          channel: string
          content_brief?: string | null
          created_at?: string
          date: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
          week_number?: number | null
          week_theme?: string | null
        }
        Update: {
          campaign_id?: string
          channel?: string
          content_brief?: string | null
          created_at?: string
          date?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
          week_number?: number | null
          week_theme?: string | null
        }
        Relationships: []
      }
      campaign_recommendations: {
        Row: {
          generated_at: string
          id: string
          recommendations: Json
          user_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          recommendations?: Json
          user_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          recommendations?: Json
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          archived: boolean
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
          pillars: string[] | null
          plan: Json | null
          start_date: string | null
          status: string | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
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
          pillars?: string[] | null
          plan?: Json | null
          start_date?: string | null
          status?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
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
          pillars?: string[] | null
          plan?: Json | null
          start_date?: string | null
          status?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_calendar_overrides: {
        Row: {
          created_at: string
          id: string
          item_id: string
          override_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          override_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          override_date?: string
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
          image_url: string | null
          link_url: string | null
          platform: string | null
          platform_post_id: string | null
          published_at: string | null
          scheduled_for: string | null
          source_filename: string | null
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
          image_url?: string | null
          link_url?: string | null
          platform?: string | null
          platform_post_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          source_filename?: string | null
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
          image_url?: string | null
          link_url?: string | null
          platform?: string | null
          platform_post_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          source_filename?: string | null
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
          brand_data: Json | null
          completed_at: string | null
          current_question: number
          current_section: number
          id: string
          lane: string | null
          messages: Json
          started_at: string
          status: string
          synthesis_attempts: number
          synthesis_completed_at: string | null
          synthesis_last_error: string | null
          synthesis_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          brand_data?: Json | null
          completed_at?: string | null
          current_question?: number
          current_section?: number
          id?: string
          lane?: string | null
          messages?: Json
          started_at?: string
          status?: string
          synthesis_attempts?: number
          synthesis_completed_at?: string | null
          synthesis_last_error?: string | null
          synthesis_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          brand_data?: Json | null
          completed_at?: string | null
          current_question?: number
          current_section?: number
          id?: string
          lane?: string | null
          messages?: Json
          started_at?: string
          status?: string
          synthesis_attempts?: number
          synthesis_completed_at?: string | null
          synthesis_last_error?: string | null
          synthesis_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
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
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          feedback_type: string | null
          id: string
          message: string
          page_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_type?: string | null
          id?: string
          message: string
          page_url?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          feedback_type?: string | null
          id?: string
          message?: string
          page_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generation_history: {
        Row: {
          campaign_id: string | null
          content_preview: string | null
          generated_at: string
          id: string
          platform: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          content_preview?: string | null
          generated_at?: string
          id?: string
          platform?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          content_preview?: string | null
          generated_at?: string
          id?: string
          platform?: string | null
          user_id?: string
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
      leads: {
        Row: {
          audit_id: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          source: string | null
        }
        Insert: {
          audit_id?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          source?: string | null
        }
        Update: {
          audit_id?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
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
      pending_pages_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          organizations: Json
          refresh_token: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          organizations: Json
          refresh_token?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          organizations?: Json
          refresh_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pillar_feed_cache: {
        Row: {
          angles_json: Json
          generated_at: string
          id: string
          user_id: string
        }
        Insert: {
          angles_json: Json
          generated_at?: string
          id?: string
          user_id: string
        }
        Update: {
          angles_json?: Json
          generated_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          beta_code_used: string | null
          brand_assets: Json | null
          brand_colors: Json | null
          brand_fonts: Json | null
          brand_hub_visited: boolean
          brand_logo_url: string | null
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
          password_set: boolean
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
          brand_colors?: Json | null
          brand_fonts?: Json | null
          brand_hub_visited?: boolean
          brand_logo_url?: string | null
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
          password_set?: boolean
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
          brand_colors?: Json | null
          brand_fonts?: Json | null
          brand_hub_visited?: boolean
          brand_logo_url?: string | null
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
          password_set?: boolean
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
      scrape_cache: {
        Row: {
          data: Json
          domain: string
          scraped_at: string
        }
        Insert: {
          data: Json
          domain: string
          scraped_at?: string
        }
        Update: {
          data?: Json
          domain?: string
          scraped_at?: string
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
          connection_type: string
          expires_at: string | null
          id: string
          organization_id: string | null
          organization_name: string | null
          platform: string
          profile_image: string | null
          profile_name: string | null
          profile_url: string | null
          refresh_token: string | null
          reminder_sent_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string
          connection_type?: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          organization_name?: string | null
          platform: string
          profile_image?: string | null
          profile_name?: string | null
          profile_url?: string | null
          refresh_token?: string | null
          reminder_sent_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string
          connection_type?: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          organization_name?: string | null
          platform?: string
          profile_image?: string | null
          profile_name?: string | null
          profile_url?: string | null
          refresh_token?: string | null
          reminder_sent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_media_assets: {
        Row: {
          created_at: string
          filename: string | null
          id: string
          media_type: string | null
          size_bytes: number | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filename?: string | null
          id?: string
          media_type?: string | null
          size_bytes?: number | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          filename?: string | null
          id?: string
          media_type?: string | null
          size_bytes?: number | null
          url?: string
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
          sort_order: number
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
          sort_order?: number
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
          sort_order?: number
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
          strategy_lane: string | null
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
          strategy_lane?: string | null
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
          strategy_lane?: string | null
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          generations_used: number | null
          id: string
          last_reset: string | null
          month: string
          reset_date: string | null
          user_id: string | null
        }
        Insert: {
          generations_used?: number | null
          id?: string
          last_reset?: string | null
          month: string
          reset_date?: string | null
          user_id?: string | null
        }
        Update: {
          generations_used?: number | null
          id?: string
          last_reset?: string | null
          month?: string
          reset_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_generation: {
        Args: {
          p_campaign_id: string
          p_dry_run?: boolean
          p_platform: string
          p_preview: string
        }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
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
