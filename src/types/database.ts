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
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          salon_id: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          salon_id?: string;
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
        ];
      };
      treatment_photos: {
        Row: {
          id: string;
          treatment_record_id: string;
          storage_path: string;
          photo_type: string;
          memo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          treatment_record_id: string;
          storage_path: string;
          photo_type: string;
          memo?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          treatment_record_id?: string;
          storage_path?: string;
          photo_type?: string;
          memo?: string | null;
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
    };
    Views: Record<string, never>;
    Functions: {
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
          opening_stock_value: number;
          closing_stock_value: number;
          total_purchases: number;
          cost_of_goods_sold: number;
          monthly_purchases: { month: number; amount: number }[];
          closing_stock_details: {
            product_name: string;
            stock: number;
            unit_price: number;
            total_value: number;
          }[];
        };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
