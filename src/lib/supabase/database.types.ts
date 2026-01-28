export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlanType = "PLAN_BASICO" | "PLAN_PRO" | "PLAN_PREMIUM";
export type SubscriptionStatus = "active" | "expired" | "cancelled";
export type PaymentProvider = "mercadopago" | "wompi";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          has_active_subscription: boolean;
          current_plan: PlanType | null;
          subscription_end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          has_active_subscription?: boolean;
          current_plan?: PlanType | null;
          subscription_end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          has_active_subscription?: boolean;
          current_plan?: PlanType | null;
          subscription_end_date?: string | null;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_type: PlanType;
          status: SubscriptionStatus;
          start_date: string;
          end_date: string;
          payment_provider: PaymentProvider | null;
          payment_reference: string | null;
          amount_paid: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_type: PlanType;
          status?: SubscriptionStatus;
          start_date?: string;
          end_date: string;
          payment_provider?: PaymentProvider | null;
          payment_reference?: string | null;
          amount_paid: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_type?: PlanType;
          status?: SubscriptionStatus;
          start_date?: string;
          end_date?: string;
          payment_provider?: PaymentProvider | null;
          payment_reference?: string | null;
          amount_paid?: number;
          updated_at?: string;
        };
      };
      wizard_data: {
        Row: {
          id: string;
          user_id: string;
          data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          data?: Json;
          updated_at?: string;
        };
      };
      plan_downloads: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string;
          download_token: string;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id: string;
          download_token: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string;
          download_token?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_active_subscription: {
        Args: { user_uuid: string };
        Returns: boolean;
      };
      get_active_subscription: {
        Args: { user_uuid: string };
        Returns: {
          id: string;
          plan_type: PlanType;
          end_date: string;
          days_remaining: number;
        }[];
      };
      expire_old_subscriptions: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: {
      plan_type: PlanType;
      subscription_status: SubscriptionStatus;
      payment_provider: PaymentProvider;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
