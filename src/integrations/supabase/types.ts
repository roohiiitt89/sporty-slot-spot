export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_bookings: {
        Row: {
          admin_id: string
          amount_collected: number | null
          booking_id: string
          created_at: string
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          payment_method: string
          payment_status: string | null
        }
        Insert: {
          admin_id: string
          amount_collected?: number | null
          booking_id: string
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          payment_method: string
          payment_status?: string | null
        }
        Update: {
          admin_id?: string
          amount_collected?: number | null
          booking_id?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          payment_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_slots: {
        Row: {
          court_id: string
          created_at: string
          created_by: string
          date: string
          end_time: string
          id: string
          reason: string | null
          start_time: string
        }
        Insert: {
          court_id: string
          created_at?: string
          created_by: string
          date: string
          end_time: string
          id?: string
          reason?: string | null
          start_time: string
        }
        Update: {
          court_id?: string
          created_at?: string
          created_by?: string
          date?: string
          end_time?: string
          id?: string
          reason?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booked_by_admin_id: string | null
          booking_date: string
          court_id: string
          created_at: string
          end_time: string
          guest_name: string | null
          guest_phone: string | null
          id: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booked_by_admin_id?: string | null
          booking_date: string
          court_id: string
          created_at?: string
          end_time: string
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booked_by_admin_id?: string | null
          booking_date?: string
          court_id?: string
          created_at?: string
          end_time?: string
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      court_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "court_groups_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      courts: {
        Row: {
          court_group_id: string | null
          created_at: string
          hourly_rate: number
          id: string
          is_active: boolean
          name: string
          sport_id: string
          updated_at: string
          "Venue name/ Sports name": string | null
          venue_id: string
        }
        Insert: {
          court_group_id?: string | null
          created_at?: string
          hourly_rate?: number
          id?: string
          is_active?: boolean
          name: string
          sport_id: string
          updated_at?: string
          "Venue name/ Sports name"?: string | null
          venue_id: string
        }
        Update: {
          court_group_id?: string | null
          created_at?: string
          hourly_rate?: number
          id?: string
          is_active?: boolean
          name?: string
          sport_id?: string
          updated_at?: string
          "Venue name/ Sports name"?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courts_court_group_id_fkey"
            columns: ["court_group_id"]
            isOneToOne: false
            referencedRelation: "court_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courts_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      help_requests: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      match_chats: {
        Row: {
          challenge_id: string
          content: string
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          content: string
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          content?: string
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_chats_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "team_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_chats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          challenge_id: string
          completed_at: string
          created_at: string
          id: string
          team_a_score: number
          team_b_score: number
          updated_at: string
          winner_team_id: string | null
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          created_at?: string
          id?: string
          team_a_score?: number
          team_b_score?: number
          updated_at?: string
          winner_team_id?: string | null
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          created_at?: string
          id?: string
          team_a_score?: number
          team_b_score?: number
          updated_at?: string
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_results_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: true
            referencedRelation: "team_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
          updated_at: string
          user_id: string
          venue_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
          updated_at?: string
          user_id: string
          venue_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
          updated_at?: string
          user_id?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          assists: number
          challenge_id: string
          created_at: string
          goals: number
          id: string
          is_mvp: boolean | null
          rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assists?: number
          challenge_id: string
          created_at?: string
          goals?: number
          id?: string
          is_mvp?: boolean | null
          rating?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assists?: number
          challenge_id?: string
          created_at?: string
          goals?: number
          id?: string
          is_mvp?: boolean | null
          rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "team_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          draws: number
          email: string | null
          full_name: string | null
          id: string
          level: number
          losses: number
          phone: string | null
          profile_name: string | null
          share_link: string | null
          updated_at: string
          wins: number
          xp: number
        }
        Insert: {
          created_at?: string
          draws?: number
          email?: string | null
          full_name?: string | null
          id: string
          level?: number
          losses?: number
          phone?: string | null
          profile_name?: string | null
          share_link?: string | null
          updated_at?: string
          wins?: number
          xp?: number
        }
        Update: {
          created_at?: string
          draws?: number
          email?: string | null
          full_name?: string | null
          id?: string
          level?: number
          losses?: number
          phone?: string | null
          profile_name?: string | null
          share_link?: string | null
          updated_at?: string
          wins?: number
          xp?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          is_approved: boolean | null
          rating: number
          user_id: string
          venue_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          rating: number
          user_id: string
          venue_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          rating?: number
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      sports: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      team_challenges: {
        Row: {
          booking_date: string
          challenger_team_id: string
          court_id: string
          created_at: string
          end_time: string
          format: string
          id: string
          opponent_team_id: string
          sport_id: string
          start_time: string
          status: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          booking_date: string
          challenger_team_id: string
          court_id: string
          created_at?: string
          end_time: string
          format: string
          id?: string
          opponent_team_id: string
          sport_id: string
          start_time: string
          status: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          booking_date?: string
          challenger_team_id?: string
          court_id?: string
          created_at?: string
          end_time?: string
          format?: string
          id?: string
          opponent_team_id?: string
          sport_id?: string
          start_time?: string
          status?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_challenges_challenger_team_id_fkey"
            columns: ["challenger_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_challenges_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_challenges_opponent_team_id_fkey"
            columns: ["opponent_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_challenges_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_challenges_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      team_chats: {
        Row: {
          content: string
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_chats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_join_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          status: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_join_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          draws: number
          id: string
          logo_url: string | null
          losses: number
          name: string
          slug: string
          updated_at: string
          wins: number
          xp: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          draws?: number
          id?: string
          logo_url?: string | null
          losses?: number
          name: string
          slug: string
          updated_at?: string
          wins?: number
          xp?: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          draws?: number
          id?: string
          logo_url?: string | null
          losses?: number
          name?: string
          slug?: string
          updated_at?: string
          wins?: number
          xp?: number
        }
        Relationships: []
      }
      template_slots: {
        Row: {
          court_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          price: string
          start_time: string
          updated_at: string
        }
        Insert: {
          court_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          price: string
          start_time: string
          updated_at?: string
        }
        Update: {
          court_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          price?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_slots_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      venue_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_admins_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_sport_display_names: {
        Row: {
          created_at: string
          display_name: string
          id: string
          sport_id: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          sport_id: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          sport_id?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_sport_display_names_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_sport_display_names_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          allow_cash_payments: boolean | null
          capacity: number | null
          contact_number: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean
          latitude: number | null
          location: string
          longitude: number | null
          name: string
          opening_hours: string | null
          rating: number | null
          updated_at: string
        }
        Insert: {
          allow_cash_payments?: boolean | null
          capacity?: number | null
          contact_number?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          latitude?: number | null
          location: string
          longitude?: number | null
          name: string
          opening_hours?: string | null
          rating?: number | null
          updated_at?: string
        }
        Update: {
          allow_cash_payments?: boolean | null
          capacity?: number | null
          contact_number?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          latitude?: number | null
          location?: string
          longitude?: number | null
          name?: string
          opening_hours?: string | null
          rating?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_booking_with_lock: {
        Args:
          | {
              p_court_id: string
              p_user_id: string
              p_booking_date: string
              p_start_time: string
              p_end_time: string
              p_total_price: number
              p_guest_name?: string
              p_guest_phone?: string
            }
          | {
              p_court_id: string
              p_user_id: string
              p_booking_date: string
              p_start_time: string
              p_end_time: string
              p_total_price: number
              p_payment_reference?: string
              p_payment_status?: string
              p_guest_name?: string
              p_guest_phone?: string
            }
        Returns: string
      }
      create_help_request: {
        Args: { p_user_id: string; p_subject: string }
        Returns: {
          created_at: string
          id: string
          last_message_at: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
      }
      gbt_bit_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      generate_slug: {
        Args: { team_name: string }
        Returns: string
      }
      get_admin_venues: {
        Args: Record<PropertyKey, never>
        Returns: {
          venue_id: string
          venue_name: string
          allow_cash_payments: boolean
        }[]
      }
      get_available_slots: {
        Args: { p_court_id: string; p_date: string }
        Returns: {
          start_time: string
          end_time: string
          is_available: boolean
        }[]
      }
      get_help_requests: {
        Args: { p_status?: string }
        Returns: {
          id: string
          user_id: string
          subject: string
          status: string
          created_at: string
          updated_at: string
          last_message_at: string
          user_name: string
          user_email: string
        }[]
      }
      get_user_help_requests: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          id: string
          last_message_at: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }[]
      }
      has_role: {
        Args: { role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_venue_admin: {
        Args: { venue_id: string }
        Returns: boolean
      }
      update_help_request_status: {
        Args: { p_help_request_id: string; p_status: string }
        Returns: {
          created_at: string
          id: string
          last_message_at: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
      }
    }
    Enums: {
      app_role: "user" | "admin" | "super_admin"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin", "super_admin"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
    },
  },
} as const
