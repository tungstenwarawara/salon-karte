import type { CounselingTemplate } from "./counseling-template";
export type { CounselingTemplate };

export type DaySchedule = {
  is_open: boolean;
  open_time: string; // "HH:MM"
  close_time: string; // "HH:MM"
};

export type BusinessHours = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

export type BookingSettings = {
  same_day_enabled: boolean;
  lead_time_minutes: number; // 0 = 制限なし / 30 / 60 / 120 / 180
  max_concurrent_appointments: number; // 同時予約上限 1〜5, デフォルト1
  min_advance_hours?: number; // 予約受付締切（X時間前まで）。0 = 制限なし
  change_deadline_hours?: number; // キャンセル・変更締切（予約のX時間前まで）。0 = 制限なし
};

/** 特定日の営業時間上書き（臨時の時短営業・延長営業等） */
export type HourOverrides = Record<string, DaySchedule>; // "YYYY-MM-DD" → DaySchedule

/** サロンHP コンテンツ（hp_content JSONB） */
export type SalonHpContent = {
  // テスト用または別表示名/住所/営業時間/メニューで運用したい場合の上書き
  display_name_override?: string;
  address_override?: string;
  phone_override?: string | null;
  business_hours_override?: BusinessHours;
  menu_override?: {
    id: string;
    name: string;
    name_en?: string;
    description?: string;
    price: number;
    duration_minutes: number;
  }[];

  // ブランド表記 (Hero / Footer / Corner Logo で参照)
  brand?: {
    mark: string;       // 例: "SEI." (corner logo / footer)
    sub?: string;       // 例: "Bust care studio"
    summary?: string;   // フッターの説明文
  };

  // マーキー帯
  marquee?: {
    items: string[];
  };

  // Why セクション (3 reasons)
  why_sei?: {
    eyebrow?: string;
    headline?: string;
    headline_em?: string;
    lead?: string;
    items: { number: string; label: string; title: string; description: string }[];
  };

  // Moment 全画面引用
  moment?: {
    eyebrow?: string;
    headline: string;
    body: string;
    image_path: string;
  };

  // Journey 5ステップ
  journey?: {
    eyebrow?: string;
    headline?: string;
    subheadline?: string;
    items: { number: string; label: string; title: string; description: string; image_path: string }[];
  };

  // Reserve 最終CTA
  reserve?: {
    eyebrow?: string;
    headline?: string;
    lead?: string;
    primary_label?: string;
    secondary_label?: string;
    secondary_url?: string | null;
    image_path?: string;
  };

  hero: {
    headline: string;
    subheadline: string;
    image_path: string | null;
    trust_badges?: { label: string; value: string }[];
  };
  concerns?: {
    title: string;
    items: string[];
  };
  about: {
    title: string;
    description: string;
    owner_name: string;
    owner_title: string;
    owner_image_path: string | null;
    name_en?: string;            // Therapist セクションの "Ruika." 等
    role?: string;               // Therapist 役職
    career?: string;             // dl Career
    license?: string;            // dl License
    specialty?: string;          // dl Specialty
    story?: string;
    qualifications?: string[];
    message?: string;
  };
  concept: {
    title: string;
    paragraphs?: string[];       // Claude Design 用 (本文段落)
    image_path?: string;         // Claude Design 用 (左の写真)
    eyebrow?: string;
    points: { title: string; description: string; icon?: string }[];
  };
  before_after?: {
    title: string;
    items: { image_path: string; caption: string; menu: string }[];
  };
  flow: {
    steps: { title: string; description: string }[];
  };
  gallery: {
    images: { path: string; caption: string }[];
  };
  testimonials: {
    items: { name: string; content: string; menu: string }[];
    hotpepper_rating?: number;
    hotpepper_review_count?: number;
    hotpepper_url?: string | null;
  };
  pricing?: {
    title: string;
    original_price?: number;
    trial_price?: number;
    description?: string;
    note?: string;
  };
  faq: {
    items: { question: string; answer: string }[];
  };
  access: {
    station: string;
    details: string;
    google_maps_embed_url: string | null;
  };
  links: {
    instagram: string | null;
    line_url: string | null;
    website: string | null;
  };
};

export type Database = {
  public: {
    Tables: {
      salons: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          phone: string | null;
          address: string | null;
          business_hours: BusinessHours | null;
          salon_holidays: string[] | null;
          booking_settings: BookingSettings | null;
          hour_overrides: HourOverrides | null;
          booking_slug: string | null;
          booking_enabled: boolean;
          counseling_template: CounselingTemplate | null;
          plan_type: "free" | "standard";
          referral_code: string;
          hp_enabled: boolean;
          hp_content: SalonHpContent | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          phone?: string | null;
          address?: string | null;
          business_hours?: BusinessHours | null;
          salon_holidays?: string[] | null;
          booking_settings?: BookingSettings | null;
          hour_overrides?: HourOverrides | null;
          booking_slug?: string | null;
          booking_enabled?: boolean;
          counseling_template?: CounselingTemplate | null;
          plan_type?: "free" | "standard";
          referral_code?: string;
          hp_enabled?: boolean;
          hp_content?: SalonHpContent | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          phone?: string | null;
          address?: string | null;
          business_hours?: BusinessHours | null;
          salon_holidays?: string[] | null;
          booking_settings?: BookingSettings | null;
          hour_overrides?: HourOverrides | null;
          booking_slug?: string | null;
          booking_enabled?: boolean;
          counseling_template?: CounselingTemplate | null;
          plan_type?: "free" | "standard";
          referral_code?: string;
          hp_enabled?: boolean;
          hp_content?: SalonHpContent | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          referrer_salon_id: string;
          referred_salon_id: string;
          referral_code: string;
          status: "pending" | "rewarded";
          referrer_reward_applied_at: string | null;
          referred_reward_applied_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_salon_id: string;
          referred_salon_id: string;
          referral_code: string;
          status?: "pending" | "rewarded";
          referrer_reward_applied_at?: string | null;
          referred_reward_applied_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          referrer_salon_id?: string;
          referred_salon_id?: string;
          referral_code?: string;
          status?: "pending" | "rewarded";
          referrer_reward_applied_at?: string | null;
          referred_reward_applied_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_salon_id_fkey";
            columns: ["referrer_salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_referred_salon_id_fkey";
            columns: ["referred_salon_id"];
            isOneToOne: true;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      stripe_processed_events: {
        Row: {
          event_id: string;
          event_type: string;
          processed_at: string;
        };
        Insert: {
          event_id: string;
          event_type: string;
          processed_at?: string;
        };
        Update: {
          event_id?: string;
          event_type?: string;
          processed_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          salon_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          status: "active" | "past_due" | "canceled" | "incomplete";
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          status?: "active" | "past_due" | "canceled" | "incomplete";
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
          status?: "active" | "past_due" | "canceled" | "incomplete";
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_salon_id_fkey";
            columns: ["salon_id"];
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          id: string;
          salon_id: string;
          last_name: string;
          first_name: string;
          last_name_kana: string | null;
          first_name_kana: string | null;
          birth_date: string | null;
          phone: string | null;
          email: string | null;
          skin_type: string | null;
          allergies: string | null;
          notes: string | null;
          address: string | null;
          marital_status: string | null;
          has_children: boolean | null;
          dm_allowed: boolean | null;
          height_cm: number | null;
          weight_kg: number | null;
          treatment_goal: string | null;
          graduated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          last_name: string;
          first_name: string;
          last_name_kana?: string | null;
          first_name_kana?: string | null;
          birth_date?: string | null;
          phone?: string | null;
          email?: string | null;
          skin_type?: string | null;
          allergies?: string | null;
          notes?: string | null;
          address?: string | null;
          marital_status?: string | null;
          has_children?: boolean | null;
          dm_allowed?: boolean | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          treatment_goal?: string | null;
          graduated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          last_name?: string;
          first_name?: string;
          last_name_kana?: string | null;
          first_name_kana?: string | null;
          birth_date?: string | null;
          phone?: string | null;
          email?: string | null;
          skin_type?: string | null;
          allergies?: string | null;
          notes?: string | null;
          address?: string | null;
          marital_status?: string | null;
          has_children?: boolean | null;
          dm_allowed?: boolean | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          treatment_goal?: string | null;
          graduated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      treatment_menus: {
        Row: {
          id: string;
          salon_id: string;
          name: string;
          category: string | null;
          duration_minutes: number | null;
          price: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          name: string;
          category?: string | null;
          duration_minutes?: number | null;
          price?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          name?: string;
          category?: string | null;
          duration_minutes?: number | null;
          price?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "treatment_menus_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      treatment_records: {
        Row: {
          id: string;
          customer_id: string;
          salon_id: string;
          staff_id: string | null;
          treatment_date: string;
          menu_id: string | null;
          menu_name_snapshot: string | null;
          treatment_area: string | null;
          products_used: string | null;
          skin_condition_before: string | null;
          notes_after: string | null;
          next_visit_memo: string | null;
          conversation_notes: string | null;
          caution_notes: string | null;
          record_type: "visit" | "product_only" | "cancelled" | "memo";
          appointment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          salon_id: string;
          staff_id?: string | null;
          treatment_date?: string;
          menu_id?: string | null;
          menu_name_snapshot?: string | null;
          treatment_area?: string | null;
          products_used?: string | null;
          skin_condition_before?: string | null;
          notes_after?: string | null;
          next_visit_memo?: string | null;
          conversation_notes?: string | null;
          caution_notes?: string | null;
          record_type?: "visit" | "product_only" | "cancelled" | "memo";
          appointment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          salon_id?: string;
          staff_id?: string | null;
          treatment_date?: string;
          menu_id?: string | null;
          menu_name_snapshot?: string | null;
          treatment_area?: string | null;
          products_used?: string | null;
          skin_condition_before?: string | null;
          notes_after?: string | null;
          next_visit_memo?: string | null;
          conversation_notes?: string | null;
          caution_notes?: string | null;
          record_type?: "visit" | "product_only" | "cancelled" | "memo";
          appointment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "treatment_records_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "treatment_records_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "treatment_records_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "treatment_menus";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "treatment_records_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      treatment_photos: {
        Row: {
          id: string;
          treatment_record_id: string;
          storage_path: string;
          photo_type: string;
          memo: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          treatment_record_id: string;
          storage_path: string;
          photo_type: string;
          memo?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          treatment_record_id?: string;
          storage_path?: string;
          photo_type?: string;
          memo?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "treatment_photos_treatment_record_id_fkey";
            columns: ["treatment_record_id"];
            isOneToOne: false;
            referencedRelation: "treatment_records";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          id: string;
          salon_id: string;
          customer_id: string;
          menu_id: string | null;
          menu_name_snapshot: string | null;
          appointment_date: string;
          start_time: string;
          end_time: string | null;
          status: string;
          source: string | null;
          memo: string | null;
          treatment_record_id: string | null;
          staff_id: string | null;
          cancel_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          customer_id: string;
          menu_id?: string | null;
          menu_name_snapshot?: string | null;
          appointment_date: string;
          start_time: string;
          end_time?: string | null;
          status?: string;
          source?: string | null;
          memo?: string | null;
          treatment_record_id?: string | null;
          staff_id?: string | null;
          cancel_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          customer_id?: string;
          menu_id?: string | null;
          menu_name_snapshot?: string | null;
          appointment_date?: string;
          start_time?: string;
          end_time?: string | null;
          status?: string;
          source?: string | null;
          memo?: string | null;
          treatment_record_id?: string | null;
          staff_id?: string | null;
          cancel_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "treatment_menus";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_treatment_record_id_fkey";
            columns: ["treatment_record_id"];
            isOneToOne: false;
            referencedRelation: "treatment_records";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      appointment_menus: {
        Row: {
          id: string;
          appointment_id: string;
          menu_id: string | null;
          menu_name_snapshot: string;
          price_snapshot: number | null;
          duration_minutes_snapshot: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          menu_id?: string | null;
          menu_name_snapshot: string;
          price_snapshot?: number | null;
          duration_minutes_snapshot?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          menu_id?: string | null;
          menu_name_snapshot?: string;
          price_snapshot?: number | null;
          duration_minutes_snapshot?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointment_menus_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_menus_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "treatment_menus";
            referencedColumns: ["id"];
          },
        ];
      };
      purchases: {
        Row: {
          id: string;
          salon_id: string;
          customer_id: string;
          purchase_date: string;
          item_name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          memo: string | null;
          product_id: string | null;
          cost_price: number | null;
          sell_price: number | null;
          payment_type: string;
          treatment_record_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          customer_id: string;
          purchase_date?: string;
          item_name: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          memo?: string | null;
          product_id?: string | null;
          cost_price?: number | null;
          sell_price?: number | null;
          payment_type?: string;
          treatment_record_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          customer_id?: string;
          purchase_date?: string;
          item_name?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          memo?: string | null;
          product_id?: string | null;
          cost_price?: number | null;
          sell_price?: number | null;
          payment_type?: string;
          treatment_record_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_treatment_record_id_fkey";
            columns: ["treatment_record_id"];
            isOneToOne: false;
            referencedRelation: "treatment_records";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          salon_id: string;
          name: string;
          category: string | null;
          base_sell_price: number;
          base_cost_price: number;
          reorder_point: number;
          is_active: boolean;
          memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          name: string;
          category?: string | null;
          base_sell_price?: number;
          base_cost_price?: number;
          reorder_point?: number;
          is_active?: boolean;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          name?: string;
          category?: string | null;
          base_sell_price?: number;
          base_cost_price?: number;
          reorder_point?: number;
          is_active?: boolean;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_logs: {
        Row: {
          id: string;
          salon_id: string;
          product_id: string;
          log_type: string;
          quantity: number;
          unit_cost_price: number | null;
          unit_sell_price: number | null;
          reason: string | null;
          related_purchase_id: string | null;
          logged_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          product_id: string;
          log_type: string;
          quantity: number;
          unit_cost_price?: number | null;
          unit_sell_price?: number | null;
          reason?: string | null;
          related_purchase_id?: string | null;
          logged_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          product_id?: string;
          log_type?: string;
          quantity?: number;
          unit_cost_price?: number | null;
          unit_sell_price?: number | null;
          reason?: string | null;
          related_purchase_id?: string | null;
          logged_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_logs_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_logs_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_logs_related_purchase_id_fkey";
            columns: ["related_purchase_id"];
            isOneToOne: false;
            referencedRelation: "purchases";
            referencedColumns: ["id"];
          },
        ];
      };
      treatment_record_menus: {
        Row: {
          id: string;
          treatment_record_id: string;
          menu_id: string | null;
          menu_name_snapshot: string;
          price_snapshot: number | null;
          duration_minutes_snapshot: number | null;
          payment_type: "cash" | "credit" | "ticket" | "service";
          ticket_id: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          treatment_record_id: string;
          menu_id?: string | null;
          menu_name_snapshot: string;
          price_snapshot?: number | null;
          duration_minutes_snapshot?: number | null;
          payment_type?: "cash" | "credit" | "ticket" | "service";
          ticket_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          treatment_record_id?: string;
          menu_id?: string | null;
          menu_name_snapshot?: string;
          price_snapshot?: number | null;
          duration_minutes_snapshot?: number | null;
          payment_type?: "cash" | "credit" | "ticket" | "service";
          ticket_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "treatment_record_menus_treatment_record_id_fkey";
            columns: ["treatment_record_id"];
            isOneToOne: false;
            referencedRelation: "treatment_records";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "treatment_record_menus_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "treatment_menus";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "treatment_record_menus_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "course_tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      course_tickets: {
        Row: {
          id: string;
          salon_id: string;
          customer_id: string;
          ticket_name: string;
          total_sessions: number;
          used_sessions: number;
          purchase_date: string;
          expiry_date: string | null;
          price: number | null;
          memo: string | null;
          status: string;
          payment_type: string;
          treatment_record_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          customer_id: string;
          ticket_name: string;
          total_sessions: number;
          used_sessions?: number;
          purchase_date?: string;
          expiry_date?: string | null;
          price?: number | null;
          memo?: string | null;
          status?: string;
          payment_type?: string;
          treatment_record_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          customer_id?: string;
          ticket_name?: string;
          total_sessions?: number;
          used_sessions?: number;
          purchase_date?: string;
          expiry_date?: string | null;
          price?: number | null;
          memo?: string | null;
          status?: string;
          payment_type?: string;
          treatment_record_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "course_tickets_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_tickets_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_tickets_treatment_record_id_fkey";
            columns: ["treatment_record_id"];
            isOneToOne: false;
            referencedRelation: "treatment_records";
            referencedColumns: ["id"];
          },
        ];
      };
      counseling_sheets: {
        Row: {
          id: string;
          salon_id: string;
          customer_id: string | null;
          template_id: string | null;
          token: string;
          status: "pending" | "submitted";
          responses: Record<string, unknown> | null;
          submitted_at: string | null;
          expires_at: string;
          include_customer_info: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          customer_id?: string | null;
          template_id?: string | null;
          token?: string;
          status?: "pending" | "submitted";
          responses?: Record<string, unknown> | null;
          submitted_at?: string | null;
          expires_at: string;
          include_customer_info?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          customer_id?: string | null;
          template_id?: string | null;
          token?: string;
          status?: "pending" | "submitted";
          responses?: Record<string, unknown> | null;
          submitted_at?: string | null;
          expires_at?: string;
          include_customer_info?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "counseling_sheets_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "counseling_sheets_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "counseling_sheets_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "counseling_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      counseling_templates: {
        Row: {
          id: string;
          salon_id: string;
          name: string;
          template: CounselingTemplate;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          name?: string;
          template: CounselingTemplate;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          name?: string;
          template?: CounselingTemplate;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "counseling_templates_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_line_configs: {
        Row: {
          id: string;
          salon_id: string;
          channel_id: string;
          channel_secret_encrypted: string;
          channel_access_token_encrypted: string;
          webhook_secret: string;
          is_active: boolean;
          reminder_enabled: boolean;
          confirmation_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          channel_id: string;
          channel_secret_encrypted: string;
          channel_access_token_encrypted: string;
          webhook_secret?: string;
          is_active?: boolean;
          reminder_enabled?: boolean;
          confirmation_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          channel_id?: string;
          channel_secret_encrypted?: string;
          channel_access_token_encrypted?: string;
          webhook_secret?: string;
          is_active?: boolean;
          reminder_enabled?: boolean;
          confirmation_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_line_configs_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: true;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_line_links: {
        Row: {
          id: string;
          salon_id: string;
          customer_id: string | null;
          line_user_id: string;
          display_name: string | null;
          picture_url: string | null;
          is_following: boolean;
          linked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          customer_id?: string | null;
          line_user_id: string;
          display_name?: string | null;
          picture_url?: string | null;
          is_following?: boolean;
          linked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          customer_id?: string | null;
          line_user_id?: string;
          display_name?: string | null;
          picture_url?: string | null;
          is_following?: boolean;
          linked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_line_links_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_line_links_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      line_message_logs: {
        Row: {
          id: string;
          salon_id: string;
          customer_line_link_id: string | null;
          message_type: "reminder" | "confirmation" | "test";
          status: "pending" | "sent" | "failed";
          error_message: string | null;
          related_appointment_id: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          customer_line_link_id?: string | null;
          message_type: "reminder" | "confirmation" | "test";
          status?: "pending" | "sent" | "failed";
          error_message?: string | null;
          related_appointment_id?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          customer_line_link_id?: string | null;
          message_type?: "reminder" | "confirmation" | "test";
          status?: "pending" | "sent" | "failed";
          error_message?: string | null;
          related_appointment_id?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "line_message_logs_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "line_message_logs_customer_line_link_id_fkey";
            columns: ["customer_line_link_id"];
            isOneToOne: false;
            referencedRelation: "customer_line_links";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "line_message_logs_related_appointment_id_fkey";
            columns: ["related_appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
      import_batches: {
        Row: {
          id: string;
          salon_id: string;
          batch_type: "customers" | "products" | "records";
          filename: string | null;
          total_count: number;
          success_count: number;
          failed_count: number;
          entity_ids: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          batch_type: "customers" | "products" | "records";
          filename?: string | null;
          total_count?: number;
          success_count?: number;
          failed_count?: number;
          entity_ids?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          batch_type?: "customers" | "products" | "records";
          filename?: string | null;
          total_count?: number;
          success_count?: number;
          failed_count?: number;
          entity_ids?: string[];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "import_batches_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      staff: {
        Row: {
          id: string;
          salon_id: string;
          auth_user_id: string | null;
          name: string;
          email: string;
          role: "owner" | "manager" | "staff";
          is_active: boolean;
          default_schedule: BusinessHours | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          auth_user_id?: string | null;
          name: string;
          email: string;
          role: "owner" | "manager" | "staff";
          is_active?: boolean;
          default_schedule?: BusinessHours | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          auth_user_id?: string | null;
          name?: string;
          email?: string;
          role?: "owner" | "manager" | "staff";
          is_active?: boolean;
          default_schedule?: BusinessHours | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_schedule_overrides: {
        Row: {
          id: string;
          staff_id: string;
          salon_id: string;
          override_date: string;
          is_working: boolean;
          start_time: string | null;
          end_time: string | null;
          memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          salon_id: string;
          override_date: string;
          is_working?: boolean;
          start_time?: string | null;
          end_time?: string | null;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          salon_id?: string;
          override_date?: string;
          is_working?: boolean;
          start_time?: string | null;
          end_time?: string | null;
          memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_schedule_overrides_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "staff_schedule_overrides_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_menus: {
        Row: {
          id: string;
          staff_id: string;
          menu_id: string;
          nomination_fee: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          menu_id: string;
          nomination_fee?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          menu_id?: string;
          nomination_fee?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_menus_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "staff_menus_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "treatment_menus";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      auth_user_lookup_by_email: {
        Args: {
          p_email: string;
        };
        Returns: {
          id: string;
          email: string;
          email_confirmed_at: string | null;
        }[];
      };
      get_lapsed_customers: {
        Args: {
          p_salon_id: string;
          p_days_threshold?: number;
        };
        Returns: {
          id: string;
          last_name: string;
          first_name: string;
          last_visit_date: string;
          days_since: number;
        }[];
      };
      get_monthly_sales_summary: {
        Args: {
          p_salon_id: string;
          p_year: number;
        };
        Returns: {
          month: number;
          treatment_sales: number;
          product_sales: number;
          ticket_sales: number;
          ticket_consumption: number;
          service_amount: number;
        }[];
      };
      get_deferred_revenue: {
        Args: {
          p_salon_id: string;
        };
        Returns: number;
      };
      use_course_ticket_session: {
        Args: {
          p_ticket_id: string;
        };
        Returns: {
          used_sessions: number;
          status: string;
        };
      };
      undo_course_ticket_session: {
        Args: {
          p_ticket_id: string;
        };
        Returns: {
          used_sessions: number;
          status: string;
        };
      };
      reverse_product_sale: {
        Args: {
          p_purchase_id: string;
        };
        Returns: {
          deleted_purchase_id: string;
          remaining_stock: number | null;
        };
      };
      adjust_course_ticket_sessions: {
        Args: {
          p_ticket_id: string;
          p_new_used_sessions: number;
        };
        Returns: {
          used_sessions: number;
          status: string;
        };
      };
      get_product_inventory_logs: {
        Args: {
          p_salon_id: string;
          p_product_id: string;
          p_limit?: number;
        };
        Returns: {
          id: string;
          log_type: string;
          quantity: number;
          unit_cost_price: number | null;
          reason: string | null;
          logged_at: string;
          created_at: string;
        }[];
      };
      get_inventory_summary: {
        Args: {
          p_salon_id: string;
        };
        Returns: {
          product_id: string;
          product_name: string;
          category: string | null;
          base_sell_price: number;
          base_cost_price: number;
          reorder_point: number;
          is_active: boolean;
          current_stock: number;
          stock_value: number;
        }[];
      };
      record_product_sale: {
        Args: {
          p_salon_id: string;
          p_customer_id: string;
          p_product_id: string;
          p_quantity: number;
          p_sell_price: number;
          p_purchase_date?: string;
          p_memo?: string | null;
          p_treatment_record_id?: string | null;
          p_payment_type?: string;
        };
        Returns: {
          purchase_id: string;
          remaining_stock: number;
        };
      };
      get_tax_report: {
        Args: {
          p_salon_id: string;
          p_year: number;
        };
        Returns: {
          year: number;
          total_purchases: number;
          closing_stock_value: number;
          monthly_purchases: { month: number; amount: number }[];
          closing_stock_details: {
            product_name: string;
            stock: number;
            unit_price: number;
            total_value: number;
          }[];
        };
      };
      get_customer_ltv_summary: {
        Args: {
          p_salon_id: string;
        };
        Returns: {
          customer_id: string;
          last_name: string;
          first_name: string;
          visit_count: number;
          treatment_revenue: number;
          purchase_revenue: number;
          ticket_revenue: number;
          first_visit_date: string | null;
          last_visit_date: string | null;
        }[];
      };
      get_monthly_new_vs_returning: {
        Args: {
          p_salon_id: string;
          p_year: number;
        };
        Returns: {
          month: number;
          new_customers: number;
          returning_customers: number;
        }[];
      };
      get_menu_ranking: {
        Args: {
          p_salon_id: string;
          p_limit?: number;
        };
        Returns: {
          menu_name: string;
          count: number;
          revenue: number;
        }[];
      };
      get_product_ranking: {
        Args: {
          p_salon_id: string;
          p_limit?: number;
        };
        Returns: {
          product_name: string;
          count: number;
          revenue: number;
        }[];
      };
      get_customer_visit_summary: {
        Args: {
          p_salon_id: string;
        };
        Returns: {
          customer_id: string;
          visit_count: number;
          last_visit_date: string | null;
        }[];
      };
      check_import_batch_modifications: {
        Args: {
          p_batch_id: string;
          p_salon_id: string;
        };
        Returns: {
          modified_count: number;
          total_count: number;
          batch_type: string;
        }[];
      };
      undo_import_batch: {
        Args: {
          p_batch_id: string;
          p_salon_id: string;
        };
        Returns: {
          deleted_count: number;
          batch_type: string;
        }[];
      };
      get_dashboard_kpi: {
        Args: {
          p_salon_id: string;
        };
        Returns: {
          current_month_revenue: number;
          previous_month_revenue: number;
          current_month_visits: number;
          previous_month_visits: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
