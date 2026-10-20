
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {

  "public": {
          Tables: {
            "calendar_events": {
                  Row: {
                    "attendees": string,"category": string,"color": string,"created_at": string,"description": string,"ends_at": string | null,"ends_on": string | null,"id": string,"kind": string,"location": string,"owner_id": string,"priority": string,"revision": number,"starts_at": string | null,"starts_on": string | null,"status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attendees"?: string,"category": string,"color": string,"created_at"?: string,"description"?: string,"ends_at"?: string | null,"ends_on"?: string | null,"id": string,"kind": string,"location"?: string,"owner_id"?: string,"priority": string,"revision"?: number,"starts_at"?: string | null,"starts_on"?: string | null,"status": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "attendees"?: string,"category"?: string,"color"?: string,"created_at"?: string,"description"?: string,"ends_at"?: string | null,"ends_on"?: string | null,"id"?: string,"kind"?: string,"location"?: string,"owner_id"?: string,"priority"?: string,"revision"?: number,"starts_at"?: string | null,"starts_on"?: string | null,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"calendar_settings": {
                  Row: {
                    "created_at": string,"id": string,"owner_id": string,"revision": number,"settings": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"owner_id"?: string,"revision"?: number,"settings"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"owner_id"?: string,"revision"?: number,"settings"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"notes": {
                  Row: {
                    "color": string,"content": NonNullable<Json>,"created_at": string,"id": string,"note_at": string,"owner_id": string,"revision": number,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string,"content"?: NonNullable<Json>,"created_at"?: string,"id": string,"note_at"?: string,"owner_id"?: string,"revision"?: number,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "color"?: string,"content"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"note_at"?: string,"owner_id"?: string,"revision"?: number,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"today_items": {
                  Row: {
                    "category": string,"created_at": string,"done": boolean,"id": string,"item_date": string,"owner_id": string,"revision": number,"slot": number,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"created_at"?: string,"done"?: boolean,"id": string,"item_date": string,"owner_id"?: string,"revision"?: number,"slot": number,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "category"?: string,"created_at"?: string,"done"?: boolean,"id"?: string,"item_date"?: string,"owner_id"?: string,"revision"?: number,"slot"?: number,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "assert_owner":
{ Args: Record<PropertyKey, never>; Returns: {
              "github_user_id": string,"user_id": string
            }[]
                           },
"create_today":
{ Args: { "p_category": string,"p_date": string,"p_id": string,"p_title": string }; Returns: {
              "category": string,
"created_at": string,
"done": boolean,
"id": string,
"item_date": string,
"owner_id": string,
"revision": number,
"slot": number,
"title": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "today_items"
        isOneToOne: true
        isSetofReturn: false
      } },
"move_today":
{ Args: { "p_date": string,"p_id": string,"p_revision": number }; Returns: {
              "category": string,
"created_at": string,
"done": boolean,
"id": string,
"item_date": string,
"owner_id": string,
"revision": number,
"slot": number,
"title": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "today_items"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            [_ in never]: never
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
  "public": {
          Enums: {

          }
        }
} as const
