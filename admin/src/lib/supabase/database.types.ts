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
      activity: {
        Row: {
          actor_id: string | null
          actor_name: string
          at: string
          batch_id: string | null
          id: number
          kind: string
          message: string
          project_id: string
          to_status: Database["public"]["Enums"]["unit_status"] | null
          unit_numbers: string[] | null
        }
        ComputedFields: never
        Insert: {
          actor_id?: string | null
          actor_name?: string
          at?: string
          batch_id?: string | null
          id?: never
          kind: string
          message: string
          project_id: string
          to_status?: Database["public"]["Enums"]["unit_status"] | null
          unit_numbers?: string[] | null
        }
        Update: {
          actor_id?: string | null
          actor_name?: string
          at?: string
          batch_id?: string | null
          id?: never
          kind?: string
          message?: string
          project_id?: string
          to_status?: Database["public"]["Enums"]["unit_status"] | null
          unit_numbers?: string[] | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          agent_name: string
          area: number
          booked_on: string
          channel: string
          created_at: string
          created_by: string | null
          created_by_name: string
          customer_name: string
          customer_phone: string
          id: string
          note: string | null
          plot_number: string
          price: number
          project_id: string
          unit_id: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          agent_name: string
          area: number
          booked_on?: string
          channel: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string
          customer_name: string
          customer_phone: string
          id?: string
          note?: string | null
          plot_number: string
          price: number
          project_id: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_name?: string
          area?: number
          booked_on?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          note?: string | null
          plot_number?: string
          price?: number
          project_id?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          client_hash: string | null
          created_at: string
          email: string | null
          emailed_at: string | null
          form: string
          id: number
          interest: string | null
          message: string | null
          name: string
          page: string | null
          phone: string
          plot_number: string | null
          project_id: string | null
          source: string
          visit_when: string | null
          wants_similar: boolean
        }
        ComputedFields: never
        Insert: {
          client_hash?: string | null
          created_at?: string
          email?: string | null
          emailed_at?: string | null
          form: string
          id?: never
          interest?: string | null
          message?: string | null
          name: string
          page?: string | null
          phone: string
          plot_number?: string | null
          project_id?: string | null
          source: string
          visit_when?: string | null
          wants_similar?: boolean
        }
        Update: {
          client_hash?: string | null
          created_at?: string
          email?: string | null
          emailed_at?: string | null
          form?: string
          id?: never
          interest?: string | null
          message?: string | null
          name?: string
          page?: string | null
          phone?: string
          plot_number?: string | null
          project_id?: string | null
          source?: string
          visit_when?: string | null
          wants_similar?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          content: NonNullable<Json>
          created_at: string
          homepage_slot: string | null
          id: string
          inventory_updated_at: string | null
          lifecycle: Database["public"]["Enums"]["project_lifecycle"]
          name: string
          public_content: Json | null
          publish_state: Database["public"]["Enums"]["publish_state"]
          published_at: string | null
          sample: boolean
          slug: string
          sort_order: number
          status_sample: boolean
          type_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          content?: NonNullable<Json>
          created_at?: string
          homepage_slot?: string | null
          id: string
          inventory_updated_at?: string | null
          lifecycle?: Database["public"]["Enums"]["project_lifecycle"]
          name: string
          public_content?: never
          publish_state?: Database["public"]["Enums"]["publish_state"]
          published_at?: string | null
          sample?: boolean
          slug: string
          sort_order?: number
          status_sample?: boolean
          type_id: string
          updated_at?: string
        }
        Update: {
          content?: NonNullable<Json>
          created_at?: string
          homepage_slot?: string | null
          id?: string
          inventory_updated_at?: string | null
          lifecycle?: Database["public"]["Enums"]["project_lifecycle"]
          name?: string
          public_content?: never
          publish_state?: Database["public"]["Enums"]["publish_state"]
          published_at?: string | null
          sample?: boolean
          slug?: string
          sort_order?: number
          status_sample?: boolean
          type_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      unit_status_events: {
        Row: {
          actor_id: string | null
          actor_name: string
          at: string
          batch_id: string | null
          from_status: Database["public"]["Enums"]["unit_status"] | null
          id: number
          note: string | null
          prev: Json | null
          to_status: Database["public"]["Enums"]["unit_status"]
          unit_id: string
        }
        ComputedFields: never
        Insert: {
          actor_id?: string | null
          actor_name?: string
          at?: string
          batch_id?: string | null
          from_status?: Database["public"]["Enums"]["unit_status"] | null
          id?: never
          note?: string | null
          prev?: Json | null
          to_status: Database["public"]["Enums"]["unit_status"]
          unit_id: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string
          at?: string
          batch_id?: string | null
          from_status?: Database["public"]["Enums"]["unit_status"] | null
          id?: never
          note?: string | null
          prev?: Json | null
          to_status?: Database["public"]["Enums"]["unit_status"]
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_status_events_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          area: number
          bedrooms: number | null
          bhk: number | null
          block: string | null
          built_up_area_sqft: number | null
          carpet_area_sqft: number | null
          corner: boolean | null
          created_at: string
          depth_ft: number | null
          document_no: string | null
          facing: string | null
          facing2: string | null
          floor: number | null
          id: string
          mortgaged_to: string | null
          number: string
          price: number | null
          project_id: string
          road_width_ft: number | null
          road_width2_ft: number | null
          sample: boolean
          status: Database["public"]["Enums"]["unit_status"]
          status_date: string | null
          status_note: string | null
          tower: string | null
          updated_at: string
          width_ft: number | null
        }
        ComputedFields: never
        Insert: {
          area: number
          bedrooms?: number | null
          bhk?: number | null
          block?: string | null
          built_up_area_sqft?: number | null
          carpet_area_sqft?: number | null
          corner?: boolean | null
          created_at?: string
          depth_ft?: number | null
          document_no?: string | null
          facing?: string | null
          facing2?: string | null
          floor?: number | null
          id?: string
          mortgaged_to?: string | null
          number: string
          price?: number | null
          project_id: string
          road_width_ft?: number | null
          road_width2_ft?: number | null
          sample?: boolean
          status?: Database["public"]["Enums"]["unit_status"]
          status_date?: string | null
          status_note?: string | null
          tower?: string | null
          updated_at?: string
          width_ft?: number | null
        }
        Update: {
          area?: number
          bedrooms?: number | null
          bhk?: number | null
          block?: string | null
          built_up_area_sqft?: number | null
          carpet_area_sqft?: number | null
          corner?: boolean | null
          created_at?: string
          depth_ft?: number | null
          document_no?: string | null
          facing?: string | null
          facing2?: string | null
          floor?: number | null
          id?: string
          mortgaged_to?: string | null
          number?: string
          price?: number | null
          project_id?: string
          road_width_ft?: number | null
          road_width2_ft?: number | null
          sample?: boolean
          status?: Database["public"]["Enums"]["unit_status"]
          status_date?: string | null
          status_note?: string | null
          tower?: string | null
          updated_at?: string
          width_ft?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "units_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      crm_sheet: {
        Row: {
          agent: string | null
          area: number | null
          at: string | null
          booked_on: string | null
          details: string | null
          email: string | null
          id: string | null
          kind: string | null
          name: string | null
          phone: string | null
          plot_number: string | null
          price: number | null
          project_id: string | null
          project_name: string | null
          source: string | null
        }
        ComputedFields: never
        Relationships: []
      }
    }
    Functions: {
      replace_units: {
        Args: {
          p_add: Json
          p_batch_id: string
          p_message: string
          p_project_id: string
          p_remove: string[]
          p_remove_from?: Database["public"]["Enums"]["unit_status"][]
        }
        Returns: undefined
      }
      save_booking: {
        Args: { p: Json; p_mark_sold?: boolean }
        Returns: string
      }
      save_unit: {
        Args: { p_message?: string; p_project_id: string; p_unit: Json }
        Returns: undefined
      }
      set_unit_statuses: {
        Args: {
          p_batch_id: string
          p_date?: string
          p_document_no?: string
          p_from?: Database["public"]["Enums"]["unit_status"][]
          p_message: string
          p_mortgaged_to?: string
          p_note?: string
          p_numbers: string[]
          p_project_id: string
          p_to: Database["public"]["Enums"]["unit_status"]
        }
        Returns: number
      }
      submit_enquiry: { Args: { p: Json }; Returns: number }
      undo_batch: {
        Args: {
          p_add?: Json
          p_batch_id: string
          p_project_id: string
          p_remove?: string[]
          p_remove_from?: Database["public"]["Enums"]["unit_status"][]
        }
        Returns: undefined
      }
    }
    Enums: {
      project_lifecycle: "upcoming" | "ongoing" | "completed"
      publish_state: "draft" | "published" | "archived"
      unit_status:
        | "available"
        | "hold"
        | "sold_out"
        | "mortgaged"
        | "registered"
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
      project_lifecycle: ["upcoming", "ongoing", "completed"],
      publish_state: ["draft", "published", "archived"],
      unit_status: ["available", "hold", "sold_out", "mortgaged", "registered"],
    },
  },
} as const
