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
      account_gallery: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string | null
          id: string
          image_path: string
          trading_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_path: string
          trading_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_path?: string
          trading_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_gallery_trading_account_id_fkey"
            columns: ["trading_account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_status: {
        Row: {
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          assigned_agent_id: string | null
          created_at: string
          id: string
          language: string
          last_message_at: string
          mode: string
          status: string
          unread_for_agent: boolean
          unread_for_visitor: boolean
          updated_at: string
          user_id: string | null
          visitor_email: string | null
          visitor_id: string
          visitor_name: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          created_at?: string
          id?: string
          language?: string
          last_message_at?: string
          mode?: string
          status?: string
          unread_for_agent?: boolean
          unread_for_visitor?: boolean
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_id: string
          visitor_name?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          created_at?: string
          id?: string
          language?: string
          last_message_at?: string
          mode?: string
          status?: string
          unread_for_agent?: boolean
          unread_for_visitor?: boolean
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_id?: string
          visitor_name?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          referred_user_id: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          referred_user_id?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          referred_user_id?: string | null
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_accounts: {
        Row: {
          account_login: string
          account_password: string
          competition_id: string
          created_at: string
          current_balance: number
          current_equity: number
          daily_loss_pct: number
          display_name: string | null
          disqualified_reason: string | null
          id: string
          last_updated_at: string
          max_drawdown_pct: number
          peak_equity: number
          platform: string
          profit_pct: number
          profit_usd: number
          server: string
          starting_balance: number
          status: string
          trades_count: number
          user_id: string
          win_rate: number
        }
        Insert: {
          account_login: string
          account_password: string
          competition_id: string
          created_at?: string
          current_balance?: number
          current_equity?: number
          daily_loss_pct?: number
          display_name?: string | null
          disqualified_reason?: string | null
          id?: string
          last_updated_at?: string
          max_drawdown_pct?: number
          peak_equity?: number
          platform?: string
          profit_pct?: number
          profit_usd?: number
          server?: string
          starting_balance?: number
          status?: string
          trades_count?: number
          user_id: string
          win_rate?: number
        }
        Update: {
          account_login?: string
          account_password?: string
          competition_id?: string
          created_at?: string
          current_balance?: number
          current_equity?: number
          daily_loss_pct?: number
          display_name?: string | null
          disqualified_reason?: string | null
          id?: string
          last_updated_at?: string
          max_drawdown_pct?: number
          peak_equity?: number
          platform?: string
          profit_pct?: number
          profit_usd?: number
          server?: string
          starting_balance?: number
          status?: string
          trades_count?: number
          user_id?: string
          win_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "competition_accounts_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_prizes: {
        Row: {
          account_id: string
          amount: number
          competition_id: string
          created_at: string
          id: string
          paid_at: string | null
          rank: number
          status: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          competition_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          rank: number
          status?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          competition_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          rank?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_prizes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "competition_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_prizes_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          account_size: number
          created_at: string
          daily_drawdown_pct: number
          ends_at: string
          id: string
          max_drawdown_pct: number
          month: string
          name: string
          prize_1: number
          prize_2: number
          prize_3: number
          starts_at: string
          status: string
          updated_at: string
          winners_announced_at: string | null
        }
        Insert: {
          account_size?: number
          created_at?: string
          daily_drawdown_pct?: number
          ends_at: string
          id?: string
          max_drawdown_pct?: number
          month: string
          name: string
          prize_1?: number
          prize_2?: number
          prize_3?: number
          starts_at: string
          status?: string
          updated_at?: string
          winners_announced_at?: string | null
        }
        Update: {
          account_size?: number
          created_at?: string
          daily_drawdown_pct?: number
          ends_at?: string
          id?: string
          max_drawdown_pct?: number
          month?: string
          name?: string
          prize_1?: number
          prize_2?: number
          prize_3?: number
          starts_at?: string
          status?: string
          updated_at?: string
          winners_announced_at?: string | null
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
      generated_documents: {
        Row: {
          created_at: string
          generated_by: string | null
          id: string
          page_count: number
          size_bytes: number
          storage_path: string
          title: string
        }
        Insert: {
          created_at?: string
          generated_by?: string | null
          id?: string
          page_count?: number
          size_bytes?: number
          storage_path: string
          title: string
        }
        Update: {
          created_at?: string
          generated_by?: string | null
          id?: string
          page_count?: number
          size_bytes?: number
          storage_path?: string
          title?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          addon_free_next: boolean
          amount: number
          created_at: string
          customer_details: Json | null
          email: string | null
          id: string
          is_free_redemption: boolean
          network: string | null
          payment_proof_url: string | null
          plan: string | null
          referral_code_used: string | null
          referrer_id: string | null
          size: string | null
          status: string
          tx_hash: string | null
          user_id: string | null
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          addon_free_next?: boolean
          amount: number
          created_at?: string
          customer_details?: Json | null
          email?: string | null
          id: string
          is_free_redemption?: boolean
          network?: string | null
          payment_proof_url?: string | null
          plan?: string | null
          referral_code_used?: string | null
          referrer_id?: string | null
          size?: string | null
          status?: string
          tx_hash?: string | null
          user_id?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          addon_free_next?: boolean
          amount?: number
          created_at?: string
          customer_details?: Json | null
          email?: string | null
          id?: string
          is_free_redemption?: boolean
          network?: string | null
          payment_proof_url?: string | null
          plan?: string | null
          referral_code_used?: string | null
          referrer_id?: string | null
          size?: string | null
          status?: string
          tx_hash?: string | null
          user_id?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          notes: string | null
          payout_details: Json
          processed_at: string | null
          requested_at: string
          status: string
          trading_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: string
          notes?: string | null
          payout_details?: Json
          processed_at?: string | null
          requested_at?: string
          status?: string
          trading_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          payout_details?: Json
          processed_at?: string | null
          requested_at?: string
          status?: string
          trading_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_trading_account_id_fkey"
            columns: ["trading_account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          free_account_credits: number
          full_name: string | null
          id: string
          referral_code: string
          referred_by: string | null
          total_earned: number
          updated_at: string
          wallet_balance: number
        }
        Insert: {
          created_at?: string
          email?: string | null
          free_account_credits?: number
          full_name?: string | null
          id: string
          referral_code: string
          referred_by?: string | null
          total_earned?: number
          updated_at?: string
          wallet_balance?: number
        }
        Update: {
          created_at?: string
          email?: string | null
          free_account_credits?: number
          full_name?: string | null
          id?: string
          referral_code?: string
          referred_by?: string | null
          total_earned?: number
          updated_at?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          discount_percent: number
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          discount_percent: number
          id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_settings: {
        Row: {
          commission_rate: number
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          commission_rate?: number
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          commission_rate?: number
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string
          created_at: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          rating: number
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          rating: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          rating?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_business_entries: {
        Row: {
          approved: boolean
          business_volume: number
          created_at: string
          description: string | null
          id: string
          member_id: string
          period_month: string
          updated_at: string
        }
        Insert: {
          approved?: boolean
          business_volume?: number
          created_at?: string
          description?: string | null
          id?: string
          member_id: string
          period_month: string
          updated_at?: string
        }
        Update: {
          approved?: boolean
          business_volume?: number
          created_at?: string
          description?: string | null
          id?: string
          member_id?: string
          period_month?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_business_entries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "sales_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_team_members: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          role: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          role?: string
          updated_at?: string
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
      trade_results: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string
          id: string
          image_path: string
          title: string
          trade_date: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by: string
          id?: string
          image_path: string
          title: string
          trade_date: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string
          id?: string
          image_path?: string
          title?: string
          trade_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trading_accounts: {
        Row: {
          admin_notes: string | null
          balance: number
          breached_reason: string | null
          created_at: string
          delivered_at: string | null
          equity: number
          id: string
          last_payout_at: string | null
          login: string | null
          order_id: string | null
          password: string | null
          plan: string | null
          platform: string
          profit: number
          server: string | null
          size: string | null
          starting_balance: number
          status: Database["public"]["Enums"]["trading_account_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          balance?: number
          breached_reason?: string | null
          created_at?: string
          delivered_at?: string | null
          equity?: number
          id?: string
          last_payout_at?: string | null
          login?: string | null
          order_id?: string | null
          password?: string | null
          plan?: string | null
          platform?: string
          profit?: number
          server?: string | null
          size?: string | null
          starting_balance?: number
          status?: Database["public"]["Enums"]["trading_account_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          balance?: number
          breached_reason?: string | null
          created_at?: string
          delivered_at?: string | null
          equity?: number
          id?: string
          last_payout_at?: string | null
          login?: string | null
          order_id?: string | null
          password?: string | null
          plan?: string | null
          platform?: string
          profit?: number
          server?: string | null
          size?: string | null
          starting_balance?: number
          status?: Database["public"]["Enums"]["trading_account_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_accounts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          notes: string | null
          payout_details: Json
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: string
          notes?: string | null
          payout_details?: Json
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          payout_details?: Json
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      account_requires_min_hold: {
        Args: { _is_fee_based?: boolean; _plan: string }
        Returns: boolean
      }
      admin_set_commission_status: {
        Args: { _commission_id: string; _status: string }
        Returns: undefined
      }
      approve_order: {
        Args: { _notes?: string; _order_id: string }
        Returns: undefined
      }
      confirm_order_and_credit_referral: {
        Args: {
          _addon_free_next?: boolean
          _amount: number
          _customer_details?: Json
          _is_free_redemption?: boolean
          _network: string
          _order_id: string
          _payment_proof_url?: string
          _plan: string
          _referral_code?: string
          _size: string
          _tx_hash: string
        }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_trade_valid_for_compliance: {
        Args: {
          _closed_at: string
          _is_fee_based?: boolean
          _opened_at: string
          _plan: string
        }
        Returns: boolean
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
      payout_cycle_days: { Args: { _plan: string }; Returns: number }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reject_order: {
        Args: { _notes?: string; _order_id: string }
        Returns: undefined
      }
      request_account_payout: {
        Args: {
          _account_id: string
          _amount: number
          _method: string
          _payout_details: Json
        }
        Returns: string
      }
      request_withdrawal: {
        Args: { _amount: number; _method: string; _payout_details: Json }
        Returns: string
      }
      set_commission_rate: { Args: { _rate: number }; Returns: undefined }
      trade_hold_seconds: {
        Args: { _closed_at: string; _opened_at: string }
        Returns: number
      }
      update_own_profile_name: {
        Args: { _full_name: string }
        Returns: undefined
      }
      update_own_referral_code: { Args: { _code: string }; Returns: string }
      validate_account_trade: {
        Args: {
          _account_id: string
          _closed_at: string
          _is_fee_based?: boolean
          _opened_at: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user" | "support_agent"
      trading_account_status:
        | "pending"
        | "active"
        | "breached"
        | "passed"
        | "suspended"
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
      app_role: ["admin", "user", "support_agent"],
      trading_account_status: [
        "pending",
        "active",
        "breached",
        "passed",
        "suspended",
      ],
    },
  },
} as const
