import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// TypeScript types for database tables
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'checking' | 'savings' | 'investment' | 'credit_card'
          balance: number
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['accounts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>
      }
      payment_methods: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          name: string
          type: 'cash' | 'debit_card' | 'credit_card' | 'transfer'
          last_four_digits: string | null
          brand: string | null
          is_default: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payment_methods']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payment_methods']['Insert']>
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'expense' | 'income'
          icon: string | null
          color: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          category_id: string | null
          payment_method_id: string | null
          type: 'expense' | 'income'
          amount: number
          description: string | null
          merchant: string | null
          date: string
          is_recurring: boolean
          recurrence_pattern: string | null
          source: 'manual' | 'bank_import' | 'receipt_ocr'
          is_reconciled: boolean
          reconciled_with: string | null
          receipt_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      documents: {
        Row: {
          id: string
          user_id: string
          transaction_id: string | null
          file_path: string
          file_type: string
          original_filename: string
          ocr_text: string | null
          extracted_amount: number | null
          extracted_date: string | null
          extracted_merchant: string | null
          extracted_payment_method: string | null
          has_line_items: boolean
          processed: boolean
          is_matched: boolean
          uploaded_at: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      receipt_line_items: {
        Row: {
          id: string
          document_id: string
          product_id: string | null
          line_number: number
          description: string
          quantity: number
          unit_price: number | null
          total_price: number
          is_classified: boolean
          needs_clarification: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['receipt_line_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['receipt_line_items']['Insert']>
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          period: 'monthly' | 'yearly'
          start_date: string
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['budgets']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['budgets']['Insert']>
      }
      debts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'credit_card' | 'loan' | 'mortgage'
          total_amount: number
          remaining_amount: number
          interest_rate: number | null
          minimum_payment: number | null
          due_date: string | null
          status: 'active' | 'paid_off'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['debts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['debts']['Insert']>
      }
      debt_payments: {
        Row: {
          id: string
          debt_id: string
          amount: number
          payment_date: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['debt_payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['debt_payments']['Insert']>
      }
      financial_goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_amount: number
          current_amount: number
          deadline: string | null
          status: 'in_progress' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['financial_goals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['financial_goals']['Insert']>
      }
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          category_id: string | null
          common_merchants: string[] | null
          normalized_names: string[] | null
          unit: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      merchant_patterns: {
        Row: {
          id: string
          user_id: string
          merchant_name: string
          payment_method_id: string
          usage_count: number
          last_used: string
          confidence_score: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['merchant_patterns']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['merchant_patterns']['Insert']>
      }
      product_price_history: {
        Row: {
          id: string
          product_id: string
          merchant: string
          price: number
          quantity: number
          unit_price: number
          receipt_line_item_id: string | null
          purchased_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['product_price_history']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['product_price_history']['Insert']>
      }
    }
  }
}
