
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
                },"finance_accounts": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"id": string,"name": string,"note": string,"opening": number,"opening_excluded": number,"opening_on": string | null,"owner_id": string,"revision": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"id": string,"name": string,"note"?: string,"opening"?: number,"opening_excluded"?: number,"opening_on"?: string | null,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"note"?: string,"opening"?: number,"opening_excluded"?: number,"opening_on"?: string | null,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"finance_bills": {
                  Row: {
                    "amount": number,"created_at": string,"due_on": string,"id": string,"name": string,"owner_id": string,"revision": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"due_on": string,"id": string,"name": string,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"due_on"?: string,"id"?: string,"name"?: string,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"finance_budget_months": {
                  Row: {
                    "budget_id": string,"created_at": string,"id": string,"limit_amount": number,"month": string,"owner_id": string,"revision": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "budget_id": string,"created_at"?: string,"id": string,"limit_amount": number,"month": string,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Update: {
                    "budget_id"?: string,"created_at"?: string,"id"?: string,"limit_amount"?: number,"month"?: string,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "finance_budget_months_owner_id_budget_id_fkey"
      columns: ["owner_id","budget_id"]
isOneToOne: false
      referencedRelation: "finance_budgets"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_budget_months_owner_id_budget_id_fkey"
      columns: ["owner_id","budget_id"]
isOneToOne: false
      referencedRelation: "finance_budgets_dto"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                },"finance_budgets": {
                  Row: {
                    "category_id": string,"created_at": string,"default_limit": number,"fixed": boolean,"id": string,"name": string,"owner_id": string,"revision": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"created_at"?: string,"default_limit"?: number,"fixed"?: boolean,"id": string,"name": string,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Update: {
                    "category_id"?: string,"created_at"?: string,"default_limit"?: number,"fixed"?: boolean,"id"?: string,"name"?: string,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "finance_budgets_owner_id_category_id_fkey"
      columns: ["owner_id","category_id"]
isOneToOne: true
      referencedRelation: "finance_categories"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                },"finance_categories": {
                  Row: {
                    "archived_at": string | null,"code": string,"created_at": string,"id": string,"kind": string,"name": string,"owner_id": string,"revision": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"code": string,"created_at"?: string,"id": string,"kind": string,"name": string,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"code"?: string,"created_at"?: string,"id"?: string,"kind"?: string,"name"?: string,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"finance_category_tombstones": {
                  Row: {
                    "code": string,"deleted_at": string,"owner_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"deleted_at"?: string,"owner_id": string
                  }
                  Update: {
                    "code"?: string,"deleted_at"?: string,"owner_id"?: string
                  }
                  Relationships: [

                  ]
                },"finance_checkpoints": {
                  Row: {
                    "account_id": string,"amount": number,"created_at": string,"evidence": string,"id": string,"observed_at": string,"owner_id": string,"revision": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "account_id": string,"amount": number,"created_at"?: string,"evidence": string,"id": string,"observed_at": string,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Update: {
                    "account_id"?: string,"amount"?: number,"created_at"?: string,"evidence"?: string,"id"?: string,"observed_at"?: string,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "finance_checkpoints_owner_id_account_id_fkey"
      columns: ["owner_id","account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_checkpoints_owner_id_account_id_fkey"
      columns: ["owner_id","account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts_dto"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                },"finance_goals": {
                  Row: {
                    "allocated": number,"created_at": string,"deadline": string,"id": string,"image_path": string | null,"monthly": number,"name": string,"owner_id": string,"priority": string,"revision": number,"target": number,"updated_at": string,"visual": string
                  }
                  ComputedFields: never
                  Insert: {
                    "allocated"?: number,"created_at"?: string,"deadline": string,"id": string,"image_path"?: string | null,"monthly"?: number,"name": string,"owner_id"?: string,"priority": string,"revision"?: number,"target": number,"updated_at"?: string,"visual": string
                  }
                  Update: {
                    "allocated"?: number,"created_at"?: string,"deadline"?: string,"id"?: string,"image_path"?: string | null,"monthly"?: number,"name"?: string,"owner_id"?: string,"priority"?: string,"revision"?: number,"target"?: number,"updated_at"?: string,"visual"?: string
                  }
                  Relationships: [

                  ]
                },"finance_import_batches": {
                  Row: {
                    "created_at": string,"id": string,"owner_id": string,"payload_hash": string,"result": number,"revision": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"owner_id"?: string,"payload_hash": string,"result": number,"revision"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"owner_id"?: string,"payload_hash"?: string,"result"?: number,"revision"?: number,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"finance_projection_plans": {
                  Row: {
                    "created_at": string,"id": string,"owner_id": string,"plan": NonNullable<Json>,"revision": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"owner_id"?: string,"plan": NonNullable<Json>,"revision"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"owner_id"?: string,"plan"?: NonNullable<Json>,"revision"?: number,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"finance_scope_events": {
                  Row: {
                    "account_id": string,"amount": number,"created_at": string,"evidence": string,"id": string,"kind": string,"occurred_at": string,"owner_id": string,"revision": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "account_id": string,"amount": number,"created_at"?: string,"evidence": string,"id": string,"kind": string,"occurred_at": string,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Update: {
                    "account_id"?: string,"amount"?: number,"created_at"?: string,"evidence"?: string,"id"?: string,"kind"?: string,"occurred_at"?: string,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "finance_scope_events_owner_id_account_id_fkey"
      columns: ["owner_id","account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_scope_events_owner_id_account_id_fkey"
      columns: ["owner_id","account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts_dto"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                },"finance_settings": {
                  Row: {
                    "created_at": string,"id": string,"owner_id": string,"revision": number,"starts_on": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"owner_id"?: string,"revision"?: number,"starts_on"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"owner_id"?: string,"revision"?: number,"starts_on"?: string,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"finance_transactions": {
                  Row: {
                    "account_id": string,"amount": number,"batch_id": string | null,"cash_account_id": string | null,"cash_received": number,"category_id": string | null,"created_at": string,"date": string,"description": string,"destination_account_id": string | null,"funding_transaction_id": string | null,"id": string,"kind": string,"occurred_at": string | null,"owner_id": string,"reference": string | null,"report_group": string | null,"reporting_role": string,"revision": number,"row_index": number | null,"source": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "account_id": string,"amount": number,"batch_id"?: string | null,"cash_account_id"?: string | null,"cash_received"?: number,"category_id"?: string | null,"created_at"?: string,"date": string,"description": string,"destination_account_id"?: string | null,"funding_transaction_id"?: string | null,"id": string,"kind": string,"occurred_at"?: string | null,"owner_id"?: string,"reference"?: string | null,"report_group"?: string | null,"reporting_role"?: string,"revision"?: number,"row_index"?: number | null,"source": string,"updated_at"?: string
                  }
                  Update: {
                    "account_id"?: string,"amount"?: number,"batch_id"?: string | null,"cash_account_id"?: string | null,"cash_received"?: number,"category_id"?: string | null,"created_at"?: string,"date"?: string,"description"?: string,"destination_account_id"?: string | null,"funding_transaction_id"?: string | null,"id"?: string,"kind"?: string,"occurred_at"?: string | null,"owner_id"?: string,"reference"?: string | null,"report_group"?: string | null,"reporting_role"?: string,"revision"?: number,"row_index"?: number | null,"source"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "finance_transactions_owner_id_account_id_fkey"
      columns: ["owner_id","account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_account_id_fkey"
      columns: ["owner_id","account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts_dto"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_batch_id_fkey"
      columns: ["owner_id","batch_id"]
isOneToOne: false
      referencedRelation: "finance_import_batches"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_cash_account_id_fkey"
      columns: ["owner_id","cash_account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_cash_account_id_fkey"
      columns: ["owner_id","cash_account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts_dto"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_category_id_fkey"
      columns: ["owner_id","category_id"]
isOneToOne: false
      referencedRelation: "finance_categories"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_destination_account_id_fkey"
      columns: ["owner_id","destination_account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_destination_account_id_fkey"
      columns: ["owner_id","destination_account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts_dto"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_funding_transaction_id_fkey"
      columns: ["owner_id","funding_transaction_id"]
isOneToOne: false
      referencedRelation: "finance_transactions"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_funding_transaction_id_fkey"
      columns: ["owner_id","funding_transaction_id"]
isOneToOne: false
      referencedRelation: "finance_transactions_dto"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                },"learning_checkins": {
                  Row: {
                    "checked_on": string,"created_at": string,"habit_id": string,"id": string,"minutes": number,"note": string,"owner_id": string,"revision": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checked_on": string,"created_at"?: string,"habit_id": string,"id": string,"minutes": number,"note"?: string,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Update: {
                    "checked_on"?: string,"created_at"?: string,"habit_id"?: string,"id"?: string,"minutes"?: number,"note"?: string,"owner_id"?: string,"revision"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "learning_checkins_owner_id_habit_id_fkey"
      columns: ["owner_id","habit_id"]
isOneToOne: false
      referencedRelation: "learning_habits"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                },"learning_habits": {
                  Row: {
                    "archived": boolean,"created_at": string,"id": string,"intention": string,"owner_id": string,"revision": number,"started_on": string,"target_minutes": number,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived"?: boolean,"created_at"?: string,"id": string,"intention"?: string,"owner_id"?: string,"revision"?: number,"started_on"?: string,"target_minutes": number,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "archived"?: boolean,"created_at"?: string,"id"?: string,"intention"?: string,"owner_id"?: string,"revision"?: number,"started_on"?: string,"target_minutes"?: number,"title"?: string,"updated_at"?: string
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
                },"portfolio_media": {
                  Row: {
                    "bytes": number,"created_at": string,"id": string,"mime": string,"owner_id": string,"path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bytes": number,"created_at"?: string,"id": string,"mime": string,"owner_id"?: string,"path": string
                  }
                  Update: {
                    "bytes"?: number,"created_at"?: string,"id"?: string,"mime"?: string,"owner_id"?: string,"path"?: string
                  }
                  Relationships: [

                  ]
                },"portfolio_sites": {
                  Row: {
                    "created_at": string,"draft": NonNullable<Json>,"id": string,"owner_id": string,"published_id": string | null,"revision": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"draft": NonNullable<Json>,"id"?: string,"owner_id"?: string,"published_id"?: string | null,"revision"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"draft"?: NonNullable<Json>,"id"?: string,"owner_id"?: string,"published_id"?: string | null,"revision"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "portfolio_current_version"
      columns: ["owner_id","published_id"]
isOneToOne: false
      referencedRelation: "portfolio_versions"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                },"portfolio_versions": {
                  Row: {
                    "created_at": string,"document": NonNullable<Json>,"draft_revision": number,"id": string,"owner_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"document": NonNullable<Json>,"draft_revision": number,"id"?: string,"owner_id": string
                  }
                  Update: {
                    "created_at"?: string,"document"?: NonNullable<Json>,"draft_revision"?: number,"id"?: string,"owner_id"?: string
                  }
                  Relationships: [

                  ]
                },"profiles": {
                  Row: {
                    "address": NonNullable<Json>,"created_at": string,"id": string,"owner_id": string,"personal": NonNullable<Json>,"revision": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"owner_id"?: string,"personal"?: NonNullable<Json>,"revision"?: number,"updated_at"?: string
                  }
                  Update: {
                    "address"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"owner_id"?: string,"personal"?: NonNullable<Json>,"revision"?: number,"updated_at"?: string
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
                },"user_preferences": {
                  Row: {
                    "created_at": string,"id": string,"locale": string,"owner_id": string,"revision": number,"theme": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"locale"?: string,"owner_id"?: string,"revision"?: number,"theme"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"locale"?: string,"owner_id"?: string,"revision"?: number,"theme"?: string,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                }
          }
          Views: {
            "finance_accounts_dto": {
                  Row: {
                    "archived_at": string | null,"created_at": string | null,"id": string | null,"name": string | null,"note": string | null,"opening": string | null,"opening_excluded": string | null,"opening_on": string | null,"owner_id": string | null,"revision": number | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "archived_at"?: string | null,"created_at"?: string | null,"id"?: string | null,"name"?: string | null,"note"?: string | null,"opening"?: never,"opening_excluded"?: never,"opening_on"?: string | null,"owner_id"?: string | null,"revision"?: number | null,"updated_at"?: string | null
                         }
                        Update: {
                           "archived_at"?: string | null,"created_at"?: string | null,"id"?: string | null,"name"?: string | null,"note"?: string | null,"opening"?: never,"opening_excluded"?: never,"opening_on"?: string | null,"owner_id"?: string | null,"revision"?: number | null,"updated_at"?: string | null
                         }
                        Relationships: [

                  ]
                },"finance_bills_dto": {
                  Row: {
                    "amount": string | null,"created_at": string | null,"due_on": string | null,"id": string | null,"name": string | null,"owner_id": string | null,"revision": number | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "amount"?: never,"created_at"?: string | null,"due_on"?: string | null,"id"?: string | null,"name"?: string | null,"owner_id"?: string | null,"revision"?: number | null,"updated_at"?: string | null
                         }
                        Update: {
                           "amount"?: never,"created_at"?: string | null,"due_on"?: string | null,"id"?: string | null,"name"?: string | null,"owner_id"?: string | null,"revision"?: number | null,"updated_at"?: string | null
                         }
                        Relationships: [

                  ]
                },"finance_budget_months_dto": {
                  Row: {
                    "budget_id": string | null,"created_at": string | null,"id": string | null,"limit_amount": string | null,"month": string | null,"owner_id": string | null,"revision": number | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "budget_id"?: string | null,"created_at"?: string | null,"id"?: string | null,"limit_amount"?: never,"month"?: string | null,"owner_id"?: string | null,"revision"?: number | null,"updated_at"?: string | null
                         }
                        Update: {
                           "budget_id"?: string | null,"created_at"?: string | null,"id"?: string | null,"limit_amount"?: never,"month"?: string | null,"owner_id"?: string | null,"revision"?: number | null,"updated_at"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "finance_budget_months_owner_id_budget_id_fkey"
      columns: ["owner_id","budget_id"]
isOneToOne: false
      referencedRelation: "finance_budgets"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_budget_months_owner_id_budget_id_fkey"
      columns: ["owner_id","budget_id"]
isOneToOne: false
      referencedRelation: "finance_budgets_dto"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                },"finance_budgets_dto": {
                  Row: {
                    "category_id": string | null,"created_at": string | null,"default_limit": string | null,"fixed": boolean | null,"id": string | null,"name": string | null,"owner_id": string | null,"revision": number | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "category_id"?: string | null,"created_at"?: string | null,"default_limit"?: never,"fixed"?: boolean | null,"id"?: string | null,"name"?: string | null,"owner_id"?: string | null,"revision"?: number | null,"updated_at"?: string | null
                         }
                        Update: {
                           "category_id"?: string | null,"created_at"?: string | null,"default_limit"?: never,"fixed"?: boolean | null,"id"?: string | null,"name"?: string | null,"owner_id"?: string | null,"revision"?: number | null,"updated_at"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "finance_budgets_owner_id_category_id_fkey"
      columns: ["owner_id","category_id"]
isOneToOne: true
      referencedRelation: "finance_categories"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                },"finance_checkpoints_dto": {
                  Row: {
                    "account_id": string | null,"amount": string | null,"evidence": string | null,"id": string | null,"observed_at": string | null,"owner_id": string | null,"revision": number | null
                  }
                  ComputedFields: never
                  Insert: {
                           "account_id"?: string | null,"amount"?: never,"evidence"?: string | null,"id"?: string | null,"observed_at"?: string | null,"owner_id"?: string | null,"revision"?: number | null
                         }
                        Update: {
                           "account_id"?: string | null,"amount"?: never,"evidence"?: string | null,"id"?: string | null,"observed_at"?: string | null,"owner_id"?: string | null,"revision"?: number | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "finance_checkpoints_owner_id_account_id_fkey"
      columns: ["owner_id","account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_checkpoints_owner_id_account_id_fkey"
      columns: ["owner_id","account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts_dto"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                },"finance_goals_dto": {
                  Row: {
                    "allocated": string | null,"created_at": string | null,"deadline": string | null,"id": string | null,"image_path": string | null,"monthly": string | null,"name": string | null,"owner_id": string | null,"priority": string | null,"revision": number | null,"target": string | null,"updated_at": string | null,"visual": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "allocated"?: never,"created_at"?: string | null,"deadline"?: string | null,"id"?: string | null,"image_path"?: string | null,"monthly"?: never,"name"?: string | null,"owner_id"?: string | null,"priority"?: string | null,"revision"?: number | null,"target"?: never,"updated_at"?: string | null,"visual"?: string | null
                         }
                        Update: {
                           "allocated"?: never,"created_at"?: string | null,"deadline"?: string | null,"id"?: string | null,"image_path"?: string | null,"monthly"?: never,"name"?: string | null,"owner_id"?: string | null,"priority"?: string | null,"revision"?: number | null,"target"?: never,"updated_at"?: string | null,"visual"?: string | null
                         }
                        Relationships: [

                  ]
                },"finance_scope_events_dto": {
                  Row: {
                    "account_id": string | null,"amount": string | null,"evidence": string | null,"id": string | null,"kind": string | null,"occurred_at": string | null,"owner_id": string | null,"revision": number | null
                  }
                  ComputedFields: never
                  Insert: {
                           "account_id"?: string | null,"amount"?: never,"evidence"?: string | null,"id"?: string | null,"kind"?: string | null,"occurred_at"?: string | null,"owner_id"?: string | null,"revision"?: number | null
                         }
                        Update: {
                           "account_id"?: string | null,"amount"?: never,"evidence"?: string | null,"id"?: string | null,"kind"?: string | null,"occurred_at"?: string | null,"owner_id"?: string | null,"revision"?: number | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "finance_scope_events_owner_id_account_id_fkey"
      columns: ["owner_id","account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_scope_events_owner_id_account_id_fkey"
      columns: ["owner_id","account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts_dto"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                },"finance_transactions_dto": {
                  Row: {
                    "account_id": string | null,"amount": string | null,"batch_id": string | null,"cash_account_id": string | null,"cash_received": string | null,"category_id": string | null,"created_at": string | null,"date": string | null,"description": string | null,"destination_account_id": string | null,"funding_transaction_id": string | null,"id": string | null,"kind": string | null,"occurred_at": string | null,"owner_id": string | null,"reference": string | null,"report_group": string | null,"reporting_role": string | null,"revision": number | null,"row_index": number | null,"source": string | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "account_id"?: string | null,"amount"?: never,"batch_id"?: string | null,"cash_account_id"?: string | null,"cash_received"?: never,"category_id"?: string | null,"created_at"?: string | null,"date"?: string | null,"description"?: string | null,"destination_account_id"?: string | null,"funding_transaction_id"?: string | null,"id"?: string | null,"kind"?: string | null,"occurred_at"?: string | null,"owner_id"?: string | null,"reference"?: string | null,"report_group"?: string | null,"reporting_role"?: string | null,"revision"?: number | null,"row_index"?: number | null,"source"?: string | null,"updated_at"?: string | null
                         }
                        Update: {
                           "account_id"?: string | null,"amount"?: never,"batch_id"?: string | null,"cash_account_id"?: string | null,"cash_received"?: never,"category_id"?: string | null,"created_at"?: string | null,"date"?: string | null,"description"?: string | null,"destination_account_id"?: string | null,"funding_transaction_id"?: string | null,"id"?: string | null,"kind"?: string | null,"occurred_at"?: string | null,"owner_id"?: string | null,"reference"?: string | null,"report_group"?: string | null,"reporting_role"?: string | null,"revision"?: number | null,"row_index"?: number | null,"source"?: string | null,"updated_at"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "finance_transactions_owner_id_account_id_fkey"
      columns: ["owner_id","account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_account_id_fkey"
      columns: ["owner_id","account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts_dto"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_batch_id_fkey"
      columns: ["owner_id","batch_id"]
isOneToOne: false
      referencedRelation: "finance_import_batches"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_cash_account_id_fkey"
      columns: ["owner_id","cash_account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_cash_account_id_fkey"
      columns: ["owner_id","cash_account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts_dto"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_category_id_fkey"
      columns: ["owner_id","category_id"]
isOneToOne: false
      referencedRelation: "finance_categories"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_destination_account_id_fkey"
      columns: ["owner_id","destination_account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_destination_account_id_fkey"
      columns: ["owner_id","destination_account_id"]
isOneToOne: false
      referencedRelation: "finance_accounts_dto"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_funding_transaction_id_fkey"
      columns: ["owner_id","funding_transaction_id"]
isOneToOne: false
      referencedRelation: "finance_transactions"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "finance_transactions_owner_id_funding_transaction_id_fkey"
      columns: ["owner_id","funding_transaction_id"]
isOneToOne: false
      referencedRelation: "finance_transactions_dto"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                }
          }
          Functions: {
            "assert_owner":
{ Args: Record<PropertyKey, never>; Returns: {
              "github_user_id": string,"user_id": string
            }[]
                           },
"consume_mobile_login_attempt":
{ Args: Record<PropertyKey, never>; Returns: boolean
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
"finance_delete_category":
{ Args: { "p_category_id": string,"p_revision": number }; Returns: string
                           },
"finance_import":
{ Args: { "p_id": string,"p_rows": Json }; Returns: number
                           },
"finance_snapshot":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"learning_checkin":
{ Args: { "p_date": string,"p_habit": string,"p_id": string,"p_minutes": number,"p_note": string,"p_revision": number,"p_undo": boolean }; Returns: undefined
                           },
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
      } },
"publish_portfolio":
{ Args: { "expected_revision": number,"restore_id"?: string }; Returns: {
              "created_at": string,
"document": NonNullable<Json>,
"draft_revision": number,
"id": string,
"owner_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "portfolio_versions"
        isOneToOne: true
        isSetofReturn: false
      } },
"read_published_portfolio":
{ Args: Record<PropertyKey, never>; Returns: {
              "created_at": string,"document": Json,"id": string
            }[]
                           },
"read_published_portfolio_media":
{ Args: { "media_id": string }; Returns: {
              "path": string
            }[]
                           },
"save_portfolio":
{ Args: { "doc": Json,"expected_revision": number }; Returns: {
              "created_at": string,
"draft": NonNullable<Json>,
"id": string,
"owner_id": string,
"published_id": string | null,
"revision": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "portfolio_sites"
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
