
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "animal_types": {
                  Row: {
                    "active": boolean,"created_at": string,"created_by": string | null,"farm_id": string,"id": string,"name": string,"tracking_mode": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"farm_id": string,"id"?: string,"name": string,"tracking_mode": string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"farm_id"?: string,"id"?: string,"name"?: string,"tracking_mode"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "animal_types_farm_id_fkey"
      columns: ["farm_id"]
isOneToOne: false
      referencedRelation: "farms"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor": string | null,"at": string,"farm_id": string,"id": number,"new_data": Json | null,"old_data": Json | null,"record_id": string | null,"table_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor"?: string | null,"at"?: string,"farm_id": string,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null,"record_id"?: string | null,"table_name": string
                  }
                  Update: {
                    "action"?: string,"actor"?: string | null,"at"?: string,"farm_id"?: string,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null,"record_id"?: string | null,"table_name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"breeds": {
                  Row: {
                    "active": boolean,"animal_type_id": string,"created_at": string,"created_by": string | null,"farm_id": string,"id": string,"name": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"animal_type_id": string,"created_at"?: string,"created_by"?: string | null,"farm_id": string,"id"?: string,"name": string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"animal_type_id"?: string,"created_at"?: string,"created_by"?: string | null,"farm_id"?: string,"id"?: string,"name"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "breeds_animal_type_id_fkey"
      columns: ["animal_type_id"]
isOneToOne: false
      referencedRelation: "animal_types"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "breeds_farm_id_fkey"
      columns: ["farm_id"]
isOneToOne: false
      referencedRelation: "farms"
      referencedColumns: ["id"]
    }
                  ]
                },"doc_counters": {
                  Row: {
                    "doc_type": string,"farm_id": string,"next_no": number,"year": number
                  }
                  ComputedFields: never
                  Insert: {
                    "doc_type": string,"farm_id": string,"next_no"?: number,"year": number
                  }
                  Update: {
                    "doc_type"?: string,"farm_id"?: string,"next_no"?: number,"year"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "doc_counters_farm_id_fkey"
      columns: ["farm_id"]
isOneToOne: false
      referencedRelation: "farms"
      referencedColumns: ["id"]
    }
                  ]
                },"farm_invitations": {
                  Row: {
                    "accepted_at": string | null,"accepted_by": string | null,"created_at": string,"created_by": string | null,"email": string,"expires_at": string,"farm_id": string,"id": string,"role": Database["public"]['Enums']["farm_role"],"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"created_at"?: string,"created_by"?: string | null,"email": string,"expires_at"?: string,"farm_id": string,"id"?: string,"role": Database["public"]['Enums']["farm_role"],"token_hash": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"created_at"?: string,"created_by"?: string | null,"email"?: string,"expires_at"?: string,"farm_id"?: string,"id"?: string,"role"?: Database["public"]['Enums']["farm_role"],"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "farm_invitations_farm_id_fkey"
      columns: ["farm_id"]
isOneToOne: false
      referencedRelation: "farms"
      referencedColumns: ["id"]
    }
                  ]
                },"farm_memberships": {
                  Row: {
                    "active": boolean,"created_at": string,"created_by": string | null,"farm_id": string,"id": string,"role": Database["public"]['Enums']["farm_role"],"updated_at": string | null,"updated_by": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"farm_id": string,"id"?: string,"role": Database["public"]['Enums']["farm_role"],"updated_at"?: string | null,"updated_by"?: string | null,"user_id": string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"farm_id"?: string,"id"?: string,"role"?: Database["public"]['Enums']["farm_role"],"updated_at"?: string | null,"updated_by"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "farm_memberships_farm_id_fkey"
      columns: ["farm_id"]
isOneToOne: false
      referencedRelation: "farms"
      referencedColumns: ["id"]
    }
                  ]
                },"farms": {
                  Row: {
                    "address": string | null,"category": Database["public"]['Enums']["farm_category"],"client_request_id": string | null,"created_at": string,"created_by": string | null,"currency": string,"id": string,"language": string,"logo_path": string | null,"name": string,"phone": string | null,"settings": NonNullable<Json>,"timezone": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"category": Database["public"]['Enums']["farm_category"],"client_request_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"language"?: string,"logo_path"?: string | null,"name": string,"phone"?: string | null,"settings"?: NonNullable<Json>,"timezone"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"category"?: Database["public"]['Enums']["farm_category"],"client_request_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"id"?: string,"language"?: string,"logo_path"?: string | null,"name"?: string,"phone"?: string | null,"settings"?: NonNullable<Json>,"timezone"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"locations": {
                  Row: {
                    "active": boolean,"created_at": string,"created_by": string | null,"farm_id": string,"id": string,"kind": string,"name": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"farm_id": string,"id"?: string,"kind"?: string,"name": string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"farm_id"?: string,"id"?: string,"kind"?: string,"name"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "locations_farm_id_fkey"
      columns: ["farm_id"]
isOneToOne: false
      referencedRelation: "farms"
      referencedColumns: ["id"]
    }
                  ]
                },"money_categories": {
                  Row: {
                    "active": boolean,"created_at": string,"created_by": string | null,"farm_id": string,"id": string,"kind": string,"name": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"farm_id": string,"id"?: string,"kind": string,"name": string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"farm_id"?: string,"id"?: string,"kind"?: string,"name"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "money_categories_farm_id_fkey"
      columns: ["farm_id"]
isOneToOne: false
      referencedRelation: "farms"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_methods": {
                  Row: {
                    "active": boolean,"created_at": string,"created_by": string | null,"farm_id": string,"id": string,"kind": string,"name": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"farm_id": string,"id"?: string,"kind": string,"name": string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"farm_id"?: string,"id"?: string,"kind"?: string,"name"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_methods_farm_id_fkey"
      columns: ["farm_id"]
isOneToOne: false
      referencedRelation: "farms"
      referencedColumns: ["id"]
    }
                  ]
                },"production_sessions": {
                  Row: {
                    "active": boolean,"created_at": string,"created_by": string | null,"farm_id": string,"id": string,"name": string,"sort_order": number,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"farm_id": string,"id"?: string,"name": string,"sort_order"?: number,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"farm_id"?: string,"id"?: string,"name"?: string,"sort_order"?: number,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "production_sessions_farm_id_fkey"
      columns: ["farm_id"]
isOneToOne: false
      referencedRelation: "farms"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string | null,"full_name": string | null,"phone": string | null,"updated_at": string | null,"updated_by": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string | null,"phone"?: string | null,"updated_at"?: string | null,"updated_by"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string | null,"phone"?: string | null,"updated_at"?: string | null,"updated_by"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"unit_conversions": {
                  Row: {
                    "created_at": string,"created_by": string | null,"factor": number,"farm_id": string,"from_unit_id": string,"id": string,"to_unit_id": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"factor": number,"farm_id": string,"from_unit_id": string,"id"?: string,"to_unit_id": string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"factor"?: number,"farm_id"?: string,"from_unit_id"?: string,"id"?: string,"to_unit_id"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "unit_conversions_farm_id_fkey"
      columns: ["farm_id"]
isOneToOne: false
      referencedRelation: "farms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "unit_conversions_from_unit_id_fkey"
      columns: ["from_unit_id"]
isOneToOne: false
      referencedRelation: "units"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "unit_conversions_to_unit_id_fkey"
      columns: ["to_unit_id"]
isOneToOne: false
      referencedRelation: "units"
      referencedColumns: ["id"]
    }
                  ]
                },"units": {
                  Row: {
                    "active": boolean,"code": string,"created_at": string,"created_by": string | null,"farm_id": string,"id": string,"kind": string,"name": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"code": string,"created_at"?: string,"created_by"?: string | null,"farm_id": string,"id"?: string,"kind": string,"name": string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"code"?: string,"created_at"?: string,"created_by"?: string | null,"farm_id"?: string,"id"?: string,"kind"?: string,"name"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "units_farm_id_fkey"
      columns: ["farm_id"]
isOneToOne: false
      referencedRelation: "farms"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_invitation":
{ Args: { "p_token": string }; Returns: string
                           },
"create_farm_with_template":
{ Args: { "p_category": Database["public"]['Enums']["farm_category"],"p_client_request_id"?: string,"p_name": string,"p_timezone"?: string }; Returns: string
                           },
"create_invitation":
{ Args: { "p_email": string,"p_farm": string,"p_role": Database["public"]['Enums']["farm_role"] }; Returns: string
                           },
"get_invitation":
{ Args: { "p_token": string }; Returns: {
              "accepted": boolean,"email": string,"expired": boolean,"farm_name": string,"role": Database["public"]['Enums']["farm_role"]
            }[]
                           }
          }
          Enums: {
            "farm_category": "dairy"|"livestock"|"poultry"|"mixed"|"other","farm_role": "owner"|"manager"|"accountant"|"worker"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "farm_category": ["dairy", "livestock", "poultry", "mixed", "other"],"farm_role": ["owner", "manager", "accountant", "worker"]
          }
        }
} as const
