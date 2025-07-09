export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      equipment_assets: {
        Row: {
          asset_number: string
          brand: string | null
          category: string
          created_at: string
          id: string
          location: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          status: string
          updated_at: string
          warranty_end_date: string | null
          warranty_start_date: string | null
        }
        Insert: {
          asset_number: string
          brand?: string | null
          category: string
          created_at?: string
          id?: string
          location?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          warranty_end_date?: string | null
          warranty_start_date?: string | null
        }
        Update: {
          asset_number?: string
          brand?: string | null
          category?: string
          created_at?: string
          id?: string
          location?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          warranty_end_date?: string | null
          warranty_start_date?: string | null
        }
        Relationships: []
      }
      equipment_maintenance: {
        Row: {
          cost: number | null
          created_at: string
          description: string
          equipment_id: string | null
          id: string
          maintenance_date: string
          maintenance_type: string
          next_maintenance_date: string | null
          notes: string | null
          performed_by: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description: string
          equipment_id?: string | null
          id?: string
          maintenance_date: string
          maintenance_type: string
          next_maintenance_date?: string | null
          notes?: string | null
          performed_by?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string
          equipment_id?: string | null
          id?: string
          maintenance_date?: string
          maintenance_type?: string
          next_maintenance_date?: string | null
          notes?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_batches: {
        Row: {
          batch_number: string
          created_at: string
          expiry_date: string | null
          id: string
          inventory_item_id: string | null
          lot_number: string | null
          manufacture_date: string | null
          quantity_received: number
          quantity_remaining: number
          received_date: string
          supplier_id: string | null
          unit_cost: number | null
        }
        Insert: {
          batch_number: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          inventory_item_id?: string | null
          lot_number?: string | null
          manufacture_date?: string | null
          quantity_received: number
          quantity_remaining: number
          received_date?: string
          supplier_id?: string | null
          unit_cost?: number | null
        }
        Update: {
          batch_number?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          inventory_item_id?: string | null
          lot_number?: string | null
          manufacture_date?: string | null
          quantity_received?: number
          quantity_remaining?: number
          received_date?: string
          supplier_id?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_category_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          alert_expiry_days: number | null
          barcode: string | null
          category_id: string | null
          created_at: string
          current_stock: number
          description: string | null
          expiry_date: string | null
          id: string
          last_restocked: string | null
          location: string | null
          maximum_stock: number | null
          minimum_stock: number
          name: string
          qr_code: string | null
          sku: string | null
          supplier_id: string | null
          track_batches: boolean | null
          unit_of_measurement: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          alert_expiry_days?: number | null
          barcode?: string | null
          category_id?: string | null
          created_at?: string
          current_stock?: number
          description?: string | null
          expiry_date?: string | null
          id?: string
          last_restocked?: string | null
          location?: string | null
          maximum_stock?: number | null
          minimum_stock?: number
          name: string
          qr_code?: string | null
          sku?: string | null
          supplier_id?: string | null
          track_batches?: boolean | null
          unit_of_measurement?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          alert_expiry_days?: number | null
          barcode?: string | null
          category_id?: string | null
          created_at?: string
          current_stock?: number
          description?: string | null
          expiry_date?: string | null
          id?: string
          last_restocked?: string | null
          location?: string | null
          maximum_stock?: number | null
          minimum_stock?: number
          name?: string
          qr_code?: string | null
          sku?: string | null
          supplier_id?: string | null
          track_batches?: boolean | null
          unit_of_measurement?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_documents: {
        Row: {
          document_type: string
          file_name: string
          file_path: string
          id: string
          purchase_order_id: string | null
          stock_receipt_id: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          document_type: string
          file_name: string
          file_path: string
          id?: string
          purchase_order_id?: string | null
          stock_receipt_id?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          purchase_order_id?: string | null
          stock_receipt_id?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_documents_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_documents_stock_receipt_id_fkey"
            columns: ["stock_receipt_id"]
            isOneToOne: false
            referencedRelation: "stock_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          inventory_item_id: string | null
          item_code: string | null
          item_description: string | null
          purchase_order_id: string | null
          quantity: number
          received_quantity: number | null
          remarks: string | null
          total_price: number | null
          unit_of_measure: string | null
          unit_price: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_code?: string | null
          item_description?: string | null
          purchase_order_id?: string | null
          quantity: number
          received_quantity?: number | null
          remarks?: string | null
          total_price?: number | null
          unit_of_measure?: string | null
          unit_price: number
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_code?: string | null
          item_description?: string | null
          purchase_order_id?: string | null
          quantity?: number
          received_quantity?: number | null
          remarks?: string | null
          total_price?: number | null
          unit_of_measure?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          authorized_by: string | null
          created_at: string
          created_by: string | null
          delivery_address: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          payment_terms: string | null
          po_number: string
          requested_by: string | null
          shipping_method: string | null
          status: string
          supplier_id: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          authorized_by?: string | null
          created_at?: string
          created_by?: string | null
          delivery_address?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          payment_terms?: string | null
          po_number: string
          requested_by?: string | null
          shipping_method?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          authorized_by?: string | null
          created_at?: string
          created_by?: string | null
          delivery_address?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          payment_terms?: string | null
          po_number?: string
          requested_by?: string | null
          shipping_method?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_receipt_items: {
        Row: {
          batch_number: string | null
          condition: string | null
          created_at: string
          expiry_date: string | null
          has_discrepancy: boolean | null
          id: string
          inventory_item_id: string | null
          lot_number: string | null
          manufacture_date: string | null
          quantity: number
          quantity_ordered: number | null
          remarks: string | null
          stock_receipt_id: string | null
          storage_location: string | null
          unit_cost: number | null
          unit_of_measure: string | null
        }
        Insert: {
          batch_number?: string | null
          condition?: string | null
          created_at?: string
          expiry_date?: string | null
          has_discrepancy?: boolean | null
          id?: string
          inventory_item_id?: string | null
          lot_number?: string | null
          manufacture_date?: string | null
          quantity: number
          quantity_ordered?: number | null
          remarks?: string | null
          stock_receipt_id?: string | null
          storage_location?: string | null
          unit_cost?: number | null
          unit_of_measure?: string | null
        }
        Update: {
          batch_number?: string | null
          condition?: string | null
          created_at?: string
          expiry_date?: string | null
          has_discrepancy?: boolean | null
          id?: string
          inventory_item_id?: string | null
          lot_number?: string | null
          manufacture_date?: string | null
          quantity?: number
          quantity_ordered?: number | null
          remarks?: string | null
          stock_receipt_id?: string | null
          storage_location?: string | null
          unit_cost?: number | null
          unit_of_measure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_receipt_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_receipt_items_stock_receipt_id_fkey"
            columns: ["stock_receipt_id"]
            isOneToOne: false
            referencedRelation: "stock_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_receipts: {
        Row: {
          created_at: string
          delivery_note_uploaded: boolean | null
          delivery_note_url: string | null
          id: string
          invoice_uploaded: boolean | null
          invoice_url: string | null
          notes: string | null
          purchase_order_id: string | null
          qc_report_uploaded: boolean | null
          qc_report_url: string | null
          receipt_date: string
          receipt_number: string
          received_by: string | null
          supplier_id: string | null
        }
        Insert: {
          created_at?: string
          delivery_note_uploaded?: boolean | null
          delivery_note_url?: string | null
          id?: string
          invoice_uploaded?: boolean | null
          invoice_url?: string | null
          notes?: string | null
          purchase_order_id?: string | null
          qc_report_uploaded?: boolean | null
          qc_report_url?: string | null
          receipt_date?: string
          receipt_number: string
          received_by?: string | null
          supplier_id?: string | null
        }
        Update: {
          created_at?: string
          delivery_note_uploaded?: boolean | null
          delivery_note_url?: string | null
          id?: string
          invoice_uploaded?: boolean | null
          invoice_url?: string | null
          notes?: string | null
          purchase_order_id?: string | null
          qc_report_uploaded?: boolean | null
          qc_report_url?: string | null
          receipt_date?: string
          receipt_number?: string
          received_by?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_receipts_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      system_configuration: {
        Row: {
          auto_reorder: boolean | null
          clinic_name: string | null
          created_at: string | null
          currency: string | null
          expiry_warning_days: number | null
          id: string
          low_stock_threshold: number | null
          updated_at: string | null
        }
        Insert: {
          auto_reorder?: boolean | null
          clinic_name?: string | null
          created_at?: string | null
          currency?: string | null
          expiry_warning_days?: number | null
          id?: string
          low_stock_threshold?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_reorder?: boolean | null
          clinic_name?: string | null
          created_at?: string | null
          currency?: string | null
          expiry_warning_days?: number | null
          id?: string
          low_stock_threshold?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_asset_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_po_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_receipt_number: {
        Args: Record<PropertyKey, never>
        Returns: string
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
