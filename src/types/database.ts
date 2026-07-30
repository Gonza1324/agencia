export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string;
          entity_id: string;
          entity_type: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          entity_id: string;
          entity_type: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attachments_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          new_values: Json | null;
          old_values: Json | null;
          reason: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          new_values?: Json | null;
          old_values?: Json | null;
          reason?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          new_values?: Json | null;
          old_values?: Json | null;
          reason?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      business_days: {
        Row: {
          closed_at: string | null;
          closed_by: string | null;
          created_at: string;
          date: string;
          id: string;
          is_working_day: boolean;
          opened_at: string | null;
          opened_by: string | null;
          reopen_reason: string | null;
          reopened_at: string | null;
          reopened_by: string | null;
          status: Database["public"]["Enums"]["business_day_status"];
          updated_at: string;
        };
        Insert: {
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string;
          date: string;
          id?: string;
          is_working_day: boolean;
          opened_at?: string | null;
          opened_by?: string | null;
          reopen_reason?: string | null;
          reopened_at?: string | null;
          reopened_by?: string | null;
          status?: Database["public"]["Enums"]["business_day_status"];
          updated_at?: string;
        };
        Update: {
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string;
          date?: string;
          id?: string;
          is_working_day?: boolean;
          opened_at?: string | null;
          opened_by?: string | null;
          reopen_reason?: string | null;
          reopened_at?: string | null;
          reopened_by?: string | null;
          status?: Database["public"]["Enums"]["business_day_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_days_closed_by_fkey";
            columns: ["closed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_days_opened_by_fkey";
            columns: ["opened_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_days_reopened_by_fkey";
            columns: ["reopened_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cash_accounts: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          status: Database["public"]["Enums"]["record_status"];
          type: Database["public"]["Enums"]["cash_account_type"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          status?: Database["public"]["Enums"]["record_status"];
          type: Database["public"]["Enums"]["cash_account_type"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["record_status"];
          type?: Database["public"]["Enums"]["cash_account_type"];
          updated_at?: string;
        };
        Relationships: [];
      };
      cash_categories: {
        Row: {
          created_at: string;
          id: string;
          is_system: boolean;
          name: string;
          status: Database["public"]["Enums"]["record_status"];
          type: Database["public"]["Enums"]["cash_category_type"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_system?: boolean;
          name: string;
          status?: Database["public"]["Enums"]["record_status"];
          type: Database["public"]["Enums"]["cash_category_type"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_system?: boolean;
          name?: string;
          status?: Database["public"]["Enums"]["record_status"];
          type?: Database["public"]["Enums"]["cash_category_type"];
          updated_at?: string;
        };
        Relationships: [];
      };
      cash_closures: {
        Row: {
          bank_difference: number;
          business_day_id: string;
          cash_difference: number;
          closed_at: string;
          closed_by: string | null;
          counted_cash_amount: number;
          created_at: string;
          expected_bank_amount: number;
          expected_cash_amount: number;
          id: string;
          note: string | null;
          reopen_reason: string | null;
          reopened_at: string | null;
          reopened_by: string | null;
          reported_bank_amount: number;
          status: Database["public"]["Enums"]["closure_status"];
          total_available: number;
          total_expense: number;
          total_income: number;
          total_withdrawals: number;
          updated_at: string;
        };
        Insert: {
          bank_difference?: number;
          business_day_id: string;
          cash_difference?: number;
          closed_at?: string;
          closed_by?: string | null;
          counted_cash_amount?: number;
          created_at?: string;
          expected_bank_amount?: number;
          expected_cash_amount?: number;
          id?: string;
          note?: string | null;
          reopen_reason?: string | null;
          reopened_at?: string | null;
          reopened_by?: string | null;
          reported_bank_amount?: number;
          status?: Database["public"]["Enums"]["closure_status"];
          total_available?: number;
          total_expense?: number;
          total_income?: number;
          total_withdrawals?: number;
          updated_at?: string;
        };
        Update: {
          bank_difference?: number;
          business_day_id?: string;
          cash_difference?: number;
          closed_at?: string;
          closed_by?: string | null;
          counted_cash_amount?: number;
          created_at?: string;
          expected_bank_amount?: number;
          expected_cash_amount?: number;
          id?: string;
          note?: string | null;
          reopen_reason?: string | null;
          reopened_at?: string | null;
          reopened_by?: string | null;
          reported_bank_amount?: number;
          status?: Database["public"]["Enums"]["closure_status"];
          total_available?: number;
          total_expense?: number;
          total_income?: number;
          total_withdrawals?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cash_closures_business_day_id_fkey";
            columns: ["business_day_id"];
            isOneToOne: true;
            referencedRelation: "business_days";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_closures_closed_by_fkey";
            columns: ["closed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_closures_reopened_by_fkey";
            columns: ["reopened_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cash_movements: {
        Row: {
          amount: number;
          business_day_id: string;
          cash_account_id: string;
          category_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          direction: Database["public"]["Enums"]["cash_movement_direction"];
          id: string;
          note: string | null;
          owner_name: string | null;
          related_settlement_id: string | null;
          related_subagent_account_movement_id: string | null;
          transfer_group_id: string | null;
          type: Database["public"]["Enums"]["cash_movement_type"];
          updated_at: string;
          updated_by: string | null;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
        };
        Insert: {
          amount: number;
          business_day_id: string;
          cash_account_id: string;
          category_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          direction: Database["public"]["Enums"]["cash_movement_direction"];
          id?: string;
          note?: string | null;
          owner_name?: string | null;
          related_settlement_id?: string | null;
          related_subagent_account_movement_id?: string | null;
          transfer_group_id?: string | null;
          type: Database["public"]["Enums"]["cash_movement_type"];
          updated_at?: string;
          updated_by?: string | null;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          amount?: number;
          business_day_id?: string;
          cash_account_id?: string;
          category_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          direction?: Database["public"]["Enums"]["cash_movement_direction"];
          id?: string;
          note?: string | null;
          owner_name?: string | null;
          related_settlement_id?: string | null;
          related_subagent_account_movement_id?: string | null;
          transfer_group_id?: string | null;
          type?: Database["public"]["Enums"]["cash_movement_type"];
          updated_at?: string;
          updated_by?: string | null;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cash_movements_business_day_id_fkey";
            columns: ["business_day_id"];
            isOneToOne: false;
            referencedRelation: "business_days";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_movements_cash_account_id_fkey";
            columns: ["cash_account_id"];
            isOneToOne: false;
            referencedRelation: "cash_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_movements_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "cash_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_movements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_movements_related_settlement_id_fkey";
            columns: ["related_settlement_id"];
            isOneToOne: false;
            referencedRelation: "daily_settlements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_movements_related_subagent_account_movement_id_fkey";
            columns: ["related_subagent_account_movement_id"];
            isOneToOne: false;
            referencedRelation: "subagent_account_movements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_movements_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_movements_voided_by_fkey";
            columns: ["voided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_settlements: {
        Row: {
          business_day_id: string;
          commission_amount: number | null;
          commission_percentage: number | null;
          created_at: string;
          created_by: string | null;
          debt_amount: number;
          expected_amount: number | null;
          id: string;
          notes: string | null;
          prizes_paid_amount: number | null;
          received_amount: number;
          sales_amount: number | null;
          settlement_date: string;
          status: Database["public"]["Enums"]["settlement_status"];
          subagent_id: string;
          updated_at: string;
          updated_by: string | null;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
        };
        Insert: {
          business_day_id: string;
          commission_amount?: number | null;
          commission_percentage?: number | null;
          created_at?: string;
          created_by?: string | null;
          debt_amount?: number;
          expected_amount?: number | null;
          id?: string;
          notes?: string | null;
          prizes_paid_amount?: number | null;
          received_amount: number;
          sales_amount?: number | null;
          settlement_date: string;
          status?: Database["public"]["Enums"]["settlement_status"];
          subagent_id: string;
          updated_at?: string;
          updated_by?: string | null;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          business_day_id?: string;
          commission_amount?: number | null;
          commission_percentage?: number | null;
          created_at?: string;
          created_by?: string | null;
          debt_amount?: number;
          expected_amount?: number | null;
          id?: string;
          notes?: string | null;
          prizes_paid_amount?: number | null;
          received_amount?: number;
          sales_amount?: number | null;
          settlement_date?: string;
          status?: Database["public"]["Enums"]["settlement_status"];
          subagent_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "daily_settlements_business_day_id_fkey";
            columns: ["business_day_id"];
            isOneToOne: false;
            referencedRelation: "business_days";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_settlements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_settlements_subagent_id_fkey";
            columns: ["subagent_id"];
            isOneToOne: false;
            referencedRelation: "subagents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_settlements_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_settlements_voided_by_fkey";
            columns: ["voided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          status: Database["public"]["Enums"]["record_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["record_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["record_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      settlement_payments: {
        Row: {
          amount: number;
          cash_account_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          method: Database["public"]["Enums"]["payment_method"];
          notes: string | null;
          settlement_id: string;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
        };
        Insert: {
          amount: number;
          cash_account_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          method: Database["public"]["Enums"]["payment_method"];
          notes?: string | null;
          settlement_id: string;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          amount?: number;
          cash_account_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          notes?: string | null;
          settlement_id?: string;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "settlement_payments_cash_account_id_fkey";
            columns: ["cash_account_id"];
            isOneToOne: false;
            referencedRelation: "cash_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlement_payments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlement_payments_settlement_id_fkey";
            columns: ["settlement_id"];
            isOneToOne: false;
            referencedRelation: "daily_settlements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlement_payments_voided_by_fkey";
            columns: ["voided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subagent_account_movements: {
        Row: {
          amount: number;
          business_day_id: string | null;
          created_at: string;
          created_by: string | null;
          direction: Database["public"]["Enums"]["account_movement_direction"];
          id: string;
          notes: string | null;
          related_cash_movement_id: string | null;
          related_settlement_id: string | null;
          subagent_id: string;
          type: Database["public"]["Enums"]["account_movement_type"];
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
        };
        Insert: {
          amount: number;
          business_day_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          direction: Database["public"]["Enums"]["account_movement_direction"];
          id?: string;
          notes?: string | null;
          related_cash_movement_id?: string | null;
          related_settlement_id?: string | null;
          subagent_id: string;
          type: Database["public"]["Enums"]["account_movement_type"];
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          amount?: number;
          business_day_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          direction?: Database["public"]["Enums"]["account_movement_direction"];
          id?: string;
          notes?: string | null;
          related_cash_movement_id?: string | null;
          related_settlement_id?: string | null;
          subagent_id?: string;
          type?: Database["public"]["Enums"]["account_movement_type"];
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subagent_account_movements_business_day_id_fkey";
            columns: ["business_day_id"];
            isOneToOne: false;
            referencedRelation: "business_days";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subagent_account_movements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subagent_account_movements_related_settlement_id_fkey";
            columns: ["related_settlement_id"];
            isOneToOne: false;
            referencedRelation: "daily_settlements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subagent_account_movements_subagent_id_fkey";
            columns: ["subagent_id"];
            isOneToOne: false;
            referencedRelation: "subagents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subagent_account_movements_voided_by_fkey";
            columns: ["voided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subagent_account_related_cash_movement_fk";
            columns: ["related_cash_movement_id"];
            isOneToOne: false;
            referencedRelation: "cash_movements";
            referencedColumns: ["id"];
          },
        ];
      };
      subagents: {
        Row: {
          commission_percentage: number;
          created_at: string;
          created_by: string | null;
          id: string;
          machine_code: string;
          name: string;
          notes: string | null;
          status: Database["public"]["Enums"]["record_status"];
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          commission_percentage?: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          machine_code: string;
          name: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          commission_percentage?: number;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          machine_code?: string;
          name?: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subagents_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subagents_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_manage_users: { Args: never; Returns: boolean };
      can_operate: { Args: never; Returns: boolean };
      close_business_day: {
        Args: {
          p_business_date: string;
          p_counted_cash_amount: number;
          p_note?: string | null;
          p_reported_bank_amount: number;
        };
        Returns: string;
      };
      create_daily_settlement: {
        Args: {
          p_bank_amount: number;
          p_cash_amount: number;
          p_commission_amount?: number | null;
          p_expected_amount?: number | null;
          p_notes?: string | null;
          p_prizes_paid_amount?: number | null;
          p_sales_amount?: number | null;
          p_settlement_date: string;
          p_subagent_id: string;
        };
        Returns: string;
      };
      create_manual_cash_movement: {
        Args: {
          p_amount: number;
          p_business_date: string;
          p_cash_account_id: string;
          p_category_id: string | null;
          p_description?: string | null;
          p_direction: Database["public"]["Enums"]["cash_movement_direction"];
          p_note?: string | null;
          p_owner_name?: string | null;
          p_type: Database["public"]["Enums"]["cash_movement_type"];
        };
        Returns: string;
      };
      create_subagent_account_movement: {
        Args: {
          p_amount: number;
          p_business_date: string;
          p_cash_account_id?: string | null;
          p_notes?: string | null;
          p_subagent_id: string;
          p_type: Database["public"]["Enums"]["account_movement_type"];
        };
        Returns: string;
      };
      ensure_current_business_day: {
        Args: never;
        Returns: {
          closed_at: string | null;
          closed_by: string | null;
          created_at: string;
          date: string;
          id: string;
          is_working_day: boolean;
          opened_at: string | null;
          opened_by: string | null;
          reopen_reason: string | null;
          reopened_at: string | null;
          reopened_by: string | null;
          status: Database["public"]["Enums"]["business_day_status"];
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "business_days";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_cash_summary: {
        Args: never;
        Returns: {
          bank_balance: number;
          cash_balance: number;
          operating_expense: number;
          operating_income: number;
          operating_profit: number;
          total_balance: number;
        }[];
      };
      get_daily_closure_summary: {
        Args: { p_business_date: string };
        Returns: {
          business_day_id: string;
          business_day_status: Database["public"]["Enums"]["business_day_status"];
          expected_bank_amount: number;
          expected_cash_amount: number;
          total_available: number;
          total_expense: number;
          total_income: number;
          total_withdrawals: number;
        }[];
      };
      get_daily_report: {
        Args: { p_date: string };
        Returns: {
          bank_difference: number;
          bank_income: number;
          cash_difference: number;
          cash_income: number;
          indebted_subagents: number;
          late_subagents: number;
          pending_subagents: number;
          settlements_count: number;
          total_available: number;
          total_expense: number;
          total_income: number;
          total_withdrawals: number;
        }[];
      };
      get_period_report: {
        Args: { p_from: string; p_to: string };
        Returns: {
          ending_bank_balance: number;
          ending_cash_balance: number;
          ending_total_balance: number;
          operating_profit: number;
          outstanding_debt: number;
          total_expense: number;
          total_income: number;
          total_withdrawals: number;
        }[];
      };
      get_report_daily_series: {
        Args: { p_from: string; p_to: string };
        Returns: {
          closing_bank_balance: number;
          closing_cash_balance: number;
          closing_total_balance: number;
          expense: number;
          income: number;
          is_working_day: boolean;
          operating_profit: number;
          report_date: string;
          withdrawals: number;
        }[];
      };
      get_report_owner_withdrawals: {
        Args: { p_from: string; p_to: string };
        Returns: {
          owner_name: string;
          withdrawal_amount: number;
          withdrawals_count: number;
        }[];
      };
      get_report_subagent_ranking: {
        Args: { p_from: string; p_to: string };
        Returns: {
          machine_code: string;
          missing_days: number;
          outstanding_balance: number;
          received_amount: number;
          settlements_count: number;
          subagent_id: string;
          subagent_name: string;
        }[];
      };
      get_subagent_account_summary: {
        Args: { p_subagent_id: string };
        Returns: {
          active_movements: number;
          balance: number;
          total_credits: number;
          total_debits: number;
        }[];
      };
      get_subagent_dashboard: {
        Args: { p_date?: string };
        Returns: {
          dashboard_status: string;
          debt_today: number;
          delay_days: number;
          known_balance: number;
          last_settlement_date: string;
          machine_code: string;
          received_today: number;
          subagent_id: string;
          subagent_name: string;
          today_settlement_id: string;
        }[];
      };
      is_internal_user: { Args: never; Returns: boolean };
      is_owner_admin: { Args: never; Returns: boolean };
      reopen_business_day: {
        Args: { p_business_date: string; p_reason: string };
        Returns: string;
      };
      replace_daily_settlement: {
        Args: {
          p_bank_amount: number;
          p_cash_amount: number;
          p_commission_amount?: number | null;
          p_expected_amount?: number | null;
          p_notes?: string | null;
          p_previous_settlement_id: string;
          p_prizes_paid_amount?: number | null;
          p_sales_amount?: number | null;
          p_settlement_date: string;
          p_subagent_id: string;
        };
        Returns: string;
      };
      void_daily_settlement: {
        Args: { p_reason: string; p_settlement_id: string };
        Returns: undefined;
      };
      void_manual_cash_movement: {
        Args: { p_movement_id: string; p_reason: string };
        Returns: undefined;
      };
      void_subagent_account_movement: {
        Args: { p_movement_id: string; p_reason: string };
        Returns: undefined;
      };
    };
    Enums: {
      account_movement_direction: "debit" | "credit";
      account_movement_type:
        | "settlement_debt"
        | "debt_payment"
        | "positive_adjustment"
        | "negative_adjustment"
        | "compensation"
        | "void";
      business_day_status: "open" | "closed" | "reopened";
      cash_account_type: "cash" | "bank";
      cash_category_type: "income" | "expense" | "withdrawal" | "adjustment";
      cash_movement_direction: "in" | "out";
      cash_movement_type:
        "income" | "expense" | "withdrawal" | "adjustment" | "transfer";
      closure_status: "closed" | "reopened";
      payment_method: "cash" | "bank_transfer";
      record_status: "active" | "inactive";
      settlement_status:
        | "pending"
        | "settled"
        | "settled_with_debt"
        | "late"
        | "late_serious"
        | "late_critical"
        | "voided";
      user_role: "owner_admin" | "cash_operator" | "subagent" | "viewer";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      account_movement_direction: ["debit", "credit"],
      account_movement_type: [
        "settlement_debt",
        "debt_payment",
        "positive_adjustment",
        "negative_adjustment",
        "compensation",
        "void",
      ],
      business_day_status: ["open", "closed", "reopened"],
      cash_account_type: ["cash", "bank"],
      cash_category_type: ["income", "expense", "withdrawal", "adjustment"],
      cash_movement_direction: ["in", "out"],
      cash_movement_type: [
        "income",
        "expense",
        "withdrawal",
        "adjustment",
        "transfer",
      ],
      closure_status: ["closed", "reopened"],
      payment_method: ["cash", "bank_transfer"],
      record_status: ["active", "inactive"],
      settlement_status: [
        "pending",
        "settled",
        "settled_with_debt",
        "late",
        "late_serious",
        "late_critical",
        "voided",
      ],
      user_role: ["owner_admin", "cash_operator", "subagent", "viewer"],
    },
  },
} as const;
