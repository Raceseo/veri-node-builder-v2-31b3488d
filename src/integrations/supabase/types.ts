export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      api_rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          request_count: number | null
          user_id: string
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          request_count?: number | null
          user_id: string
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          request_count?: number | null
          user_id?: string
          window_start?: string | null
        }
        Relationships: []
      }
      approval_workflow: {
        Row: {
          created_at: string | null
          first_approved_at: string | null
          first_approver_id: string | null
          id: string
          reference_id: string
          reference_type: string
          rejection_reason: string | null
          requester_id: string
          second_approved_at: string | null
          second_approver_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          first_approved_at?: string | null
          first_approver_id?: string | null
          id?: string
          reference_id: string
          reference_type: string
          rejection_reason?: string | null
          requester_id: string
          second_approved_at?: string | null
          second_approver_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          first_approved_at?: string | null
          first_approver_id?: string | null
          id?: string
          reference_id?: string
          reference_type?: string
          rejection_reason?: string | null
          requester_id?: string
          second_approved_at?: string | null
          second_approver_id?: string | null
          status?: string
        }
        Relationships: []
      }
      consumption_analysis: {
        Row: {
          analysis_date: string
          category_breakdown: Json
          created_at: string
          data_value_raw: number | null
          data_value_refined: number | null
          id: string
          monthly_average: number | null
          persona_description: string | null
          persona_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_date?: string
          category_breakdown?: Json
          created_at?: string
          data_value_raw?: number | null
          data_value_refined?: number | null
          id?: string
          monthly_average?: number | null
          persona_description?: string | null
          persona_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_date?: string
          category_breakdown?: Json
          created_at?: string
          data_value_raw?: number | null
          data_value_refined?: number | null
          id?: string
          monthly_average?: number | null
          persona_description?: string | null
          persona_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      corporate_accounts: {
        Row: {
          business_category: string | null
          business_registration_number: string
          business_type: string | null
          ceo_name: string | null
          company_address: string | null
          company_name_official: string
          created_at: string
          credit_limit: number | null
          id: string
          is_verified: boolean | null
          payment_method: string | null
          settlement_cycle: string | null
          tax_email: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          business_category?: string | null
          business_registration_number: string
          business_type?: string | null
          ceo_name?: string | null
          company_address?: string | null
          company_name_official: string
          created_at?: string
          credit_limit?: number | null
          id?: string
          is_verified?: boolean | null
          payment_method?: string | null
          settlement_cycle?: string | null
          tax_email?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          business_category?: string | null
          business_registration_number?: string
          business_type?: string | null
          ceo_name?: string | null
          company_address?: string | null
          company_name_official?: string
          created_at?: string
          credit_limit?: number | null
          id?: string
          is_verified?: boolean | null
          payment_method?: string | null
          settlement_cycle?: string | null
          tax_email?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      corporate_members: {
        Row: {
          approval_limit: number | null
          corporate_account_id: string
          created_at: string
          department: string | null
          id: string
          position: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_limit?: number | null
          corporate_account_id: string
          created_at?: string
          department?: string | null
          id?: string
          position?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_limit?: number | null
          corporate_account_id?: string
          created_at?: string
          department?: string | null
          id?: string
          position?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_members_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_preferences: {
        Row: {
          auto_notify: boolean | null
          budget_range_max: number | null
          budget_range_min: number | null
          buyer_id: string
          collection_frequency: string | null
          company_name: string
          created_at: string
          id: string
          industry: string
          preferred_categories: string[]
          preferred_demographics: Json | null
          updated_at: string
        }
        Insert: {
          auto_notify?: boolean | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          buyer_id: string
          collection_frequency?: string | null
          company_name: string
          created_at?: string
          id?: string
          industry: string
          preferred_categories?: string[]
          preferred_demographics?: Json | null
          updated_at?: string
        }
        Update: {
          auto_notify?: boolean | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          buyer_id?: string
          collection_frequency?: string | null
          company_name?: string
          created_at?: string
          id?: string
          industry?: string
          preferred_categories?: string[]
          preferred_demographics?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      data_access_requests: {
        Row: {
          admin_status: string
          buyer_id: string
          completed_at: string | null
          created_at: string
          data_categories: string[]
          final_status: string
          first_admin_approved_at: string | null
          first_admin_id: string | null
          id: string
          message: string | null
          offered_price: number
          purchase_id: string | null
          request_type: string
          second_admin_approved_at: string | null
          second_admin_id: string | null
          supplier_id: string
          supplier_responded_at: string | null
          supplier_status: string
          updated_at: string
        }
        Insert: {
          admin_status?: string
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          data_categories?: string[]
          final_status?: string
          first_admin_approved_at?: string | null
          first_admin_id?: string | null
          id?: string
          message?: string | null
          offered_price?: number
          purchase_id?: string | null
          request_type?: string
          second_admin_approved_at?: string | null
          second_admin_id?: string | null
          supplier_id: string
          supplier_responded_at?: string | null
          supplier_status?: string
          updated_at?: string
        }
        Update: {
          admin_status?: string
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          data_categories?: string[]
          final_status?: string
          first_admin_approved_at?: string | null
          first_admin_id?: string | null
          id?: string
          message?: string | null
          offered_price?: number
          purchase_id?: string | null
          request_type?: string
          second_admin_approved_at?: string | null
          second_admin_id?: string | null
          supplier_id?: string
          supplier_responded_at?: string | null
          supplier_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_access_requests_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "data_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      data_category_values: {
        Row: {
          active_requests: number | null
          base_value: number
          category: string
          created_at: string | null
          current_demand_factor: number | null
          current_scarcity_factor: number | null
          display_name: string
          id: string
          last_calculated_at: string | null
          total_suppliers: number | null
          updated_at: string | null
        }
        Insert: {
          active_requests?: number | null
          base_value: number
          category: string
          created_at?: string | null
          current_demand_factor?: number | null
          current_scarcity_factor?: number | null
          display_name: string
          id?: string
          last_calculated_at?: string | null
          total_suppliers?: number | null
          updated_at?: string | null
        }
        Update: {
          active_requests?: number | null
          base_value?: number
          category?: string
          created_at?: string | null
          current_demand_factor?: number | null
          current_scarcity_factor?: number | null
          display_name?: string
          id?: string
          last_calculated_at?: string | null
          total_suppliers?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      data_listings: {
        Row: {
          actual_earnings: number | null
          allowed_uses: string[] | null
          anonymization_level: string
          buyer_count: number | null
          categories: string[]
          created_at: string
          description: string | null
          expected_monthly_value: number | null
          expected_total_value: number | null
          expires_at: string | null
          id: string
          include_premium_buyers: boolean | null
          paused_at: string | null
          sale_duration_months: number
          started_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_earnings?: number | null
          allowed_uses?: string[] | null
          anonymization_level?: string
          buyer_count?: number | null
          categories?: string[]
          created_at?: string
          description?: string | null
          expected_monthly_value?: number | null
          expected_total_value?: number | null
          expires_at?: string | null
          id?: string
          include_premium_buyers?: boolean | null
          paused_at?: string | null
          sale_duration_months?: number
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_earnings?: number | null
          allowed_uses?: string[] | null
          anonymization_level?: string
          buyer_count?: number | null
          categories?: string[]
          created_at?: string
          description?: string | null
          expected_monthly_value?: number | null
          expected_total_value?: number | null
          expires_at?: string | null
          id?: string
          include_premium_buyers?: boolean | null
          paused_at?: string | null
          sale_duration_months?: number
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_purchases: {
        Row: {
          buyer_id: string
          completed_at: string | null
          created_at: string | null
          has_cross_verification: boolean | null
          id: string
          paid_at: string | null
          platform_fee: number
          price_breakdown: Json
          product_id: string | null
          product_title: string | null
          product_type: string
          status: string
          supplier_pool: number
          target_grade: string | null
          total_price: number
          unit_count: number
          unit_price: number
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          buyer_id: string
          completed_at?: string | null
          created_at?: string | null
          has_cross_verification?: boolean | null
          id?: string
          paid_at?: string | null
          platform_fee: number
          price_breakdown?: Json
          product_id?: string | null
          product_title?: string | null
          product_type: string
          status?: string
          supplier_pool: number
          target_grade?: string | null
          total_price: number
          unit_count: number
          unit_price: number
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          buyer_id?: string
          completed_at?: string | null
          created_at?: string | null
          has_cross_verification?: boolean | null
          id?: string
          paid_at?: string | null
          platform_fee?: number
          price_breakdown?: Json
          product_id?: string | null
          product_title?: string | null
          product_type?: string
          status?: string
          supplier_pool?: number
          target_grade?: string | null
          total_price?: number
          unit_count?: number
          unit_price?: number
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: []
      }
      data_sale_records: {
        Row: {
          amount: number
          buyer_company: string
          buyer_industry: string | null
          categories_sold: string[]
          created_at: string
          id: string
          listing_id: string
          net_amount: number
          platform_fee: number | null
          sold_at: string
          user_id: string
        }
        Insert: {
          amount: number
          buyer_company: string
          buyer_industry?: string | null
          categories_sold: string[]
          created_at?: string
          id?: string
          listing_id: string
          net_amount: number
          platform_fee?: number | null
          sold_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          buyer_company?: string
          buyer_industry?: string | null
          categories_sold?: string[]
          created_at?: string
          id?: string
          listing_id?: string
          net_amount?: number
          platform_fee?: number | null
          sold_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sale_records_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "data_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      data_subscriptions: {
        Row: {
          auto_renew: boolean | null
          buyer_id: string
          categories: string[]
          created_at: string
          id: string
          is_active: boolean | null
          last_collection_date: string | null
          monthly_budget: number | null
          next_collection_date: string | null
          preference_id: string | null
          subscription_type: string
          target_grade: string | null
          target_sample_count: number | null
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean | null
          buyer_id: string
          categories?: string[]
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_collection_date?: string | null
          monthly_budget?: number | null
          next_collection_date?: string | null
          preference_id?: string | null
          subscription_type: string
          target_grade?: string | null
          target_sample_count?: number | null
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean | null
          buyer_id?: string
          categories?: string[]
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_collection_date?: string | null
          monthly_budget?: number | null
          next_collection_date?: string | null
          preference_id?: string | null
          subscription_type?: string
          target_grade?: string | null
          target_sample_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_subscriptions_preference_id_fkey"
            columns: ["preference_id"]
            isOneToOne: false
            referencedRelation: "corporate_preferences"
            referencedColumns: ["id"]
          },
        ]
      }
      data_usage_consents: {
        Row: {
          agreed_at: string | null
          consent_type: string
          consent_version: string
          corporate_account_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          is_agreed: boolean
          revoked_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          agreed_at?: string | null
          consent_type: string
          consent_version?: string
          corporate_account_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          is_agreed?: boolean
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          agreed_at?: string | null
          consent_type?: string
          consent_version?: string
          corporate_account_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          is_agreed?: boolean
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_usage_consents_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      data_verifications: {
        Row: {
          ai_generated_check: boolean | null
          created_at: string | null
          data_type: string
          details: Json | null
          id: string
          identity_match_check: boolean | null
          purity_score: number | null
          risk_level: string | null
          user_id: string
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          ai_generated_check?: boolean | null
          created_at?: string | null
          data_type: string
          details?: Json | null
          id?: string
          identity_match_check?: boolean | null
          purity_score?: number | null
          risk_level?: string | null
          user_id: string
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          ai_generated_check?: boolean | null
          created_at?: string | null
          data_type?: string
          details?: Json | null
          id?: string
          identity_match_check?: boolean | null
          purity_score?: number | null
          risk_level?: string | null
          user_id?: string
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      demo_data_sales: {
        Row: {
          buyer_company: string
          created_at: string | null
          data_category: string
          id: string
          profile_id: string | null
          provider_share: number
          sale_amount: number
        }
        Insert: {
          buyer_company: string
          created_at?: string | null
          data_category: string
          id?: string
          profile_id?: string | null
          provider_share: number
          sale_amount: number
        }
        Update: {
          buyer_company?: string
          created_at?: string | null
          data_category?: string
          id?: string
          profile_id?: string | null
          provider_share?: number
          sale_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "demo_data_sales_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "demo_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_profiles: {
        Row: {
          age_group: string | null
          company: string | null
          created_at: string | null
          data_categories: string[] | null
          display_name: string
          email: string | null
          gender: string | null
          id: string
          occupation: string | null
          region: string | null
          trust_score: number | null
          vn_balance: number | null
        }
        Insert: {
          age_group?: string | null
          company?: string | null
          created_at?: string | null
          data_categories?: string[] | null
          display_name: string
          email?: string | null
          gender?: string | null
          id?: string
          occupation?: string | null
          region?: string | null
          trust_score?: number | null
          vn_balance?: number | null
        }
        Update: {
          age_group?: string | null
          company?: string | null
          created_at?: string | null
          data_categories?: string[] | null
          display_name?: string
          email?: string | null
          gender?: string | null
          id?: string
          occupation?: string | null
          region?: string | null
          trust_score?: number | null
          vn_balance?: number | null
        }
        Relationships: []
      }
      demo_transactions: {
        Row: {
          amount: number
          buyer_company: string | null
          created_at: string | null
          data_category: string | null
          description: string | null
          id: string
          profile_id: string | null
          type: string
        }
        Insert: {
          amount: number
          buyer_company?: string | null
          created_at?: string | null
          data_category?: string | null
          description?: string | null
          id?: string
          profile_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          buyer_company?: string | null
          created_at?: string | null
          data_category?: string | null
          description?: string | null
          id?: string
          profile_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "demo_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_verification_history: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string | null
          score_change: number | null
          verification_type: string
          vn_earned: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          score_change?: number | null
          verification_type: string
          vn_earned?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          score_change?: number | null
          verification_type?: string
          vn_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_verification_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "demo_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gov_data_analysis: {
        Row: {
          analysis_date: string
          analysis_type: string
          created_at: string
          data_value_raw: number | null
          data_value_refined: number | null
          details_json: Json
          grade: string | null
          id: string
          score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_date?: string
          analysis_type: string
          created_at?: string
          data_value_raw?: number | null
          data_value_refined?: number | null
          details_json?: Json
          grade?: string | null
          id?: string
          score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_date?: string
          analysis_type?: string
          created_at?: string
          data_value_raw?: number | null
          data_value_refined?: number | null
          details_json?: Json
          grade?: string | null
          id?: string
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gov_data_connections: {
        Row: {
          agency_code: string
          agency_name: string
          agency_type: string
          connected_at: string | null
          consent_expires_at: string | null
          created_at: string
          id: string
          is_connected: boolean | null
          last_synced_at: string | null
          sync_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_code: string
          agency_name: string
          agency_type: string
          connected_at?: string | null
          consent_expires_at?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_code?: string
          agency_name?: string
          agency_type?: string
          connected_at?: string | null
          consent_expires_at?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gov_data_records: {
        Row: {
          connection_id: string | null
          created_at: string
          data_category: string
          data_json: Json
          expiry_date: string | null
          id: string
          is_verified: boolean | null
          record_date: string
          record_type: string
          user_id: string
          verification_hash: string | null
          verified_at: string | null
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          data_category: string
          data_json?: Json
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          record_date: string
          record_type: string
          user_id: string
          verification_hash?: string | null
          verified_at?: string | null
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          data_category?: string
          data_json?: Json
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          record_date?: string
          record_type?: string
          user_id?: string
          verification_hash?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gov_data_records_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "gov_data_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          corporate_account_id: string
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          invoice_pdf_url: string | null
          issue_date: string
          items: Json | null
          paid_at: string | null
          payment_status: string
          purchase_id: string | null
          supply_amount: number
          total_amount: number
          updated_at: string
          vat_amount: number
        }
        Insert: {
          corporate_account_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          invoice_pdf_url?: string | null
          issue_date?: string
          items?: Json | null
          paid_at?: string | null
          payment_status?: string
          purchase_id?: string | null
          supply_amount: number
          total_amount: number
          updated_at?: string
          vat_amount: number
        }
        Update: {
          corporate_account_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          invoice_pdf_url?: string | null
          issue_date?: string
          items?: Json | null
          paid_at?: string | null
          payment_status?: string
          purchase_id?: string | null
          supply_amount?: number
          total_amount?: number
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      mydata_connections: {
        Row: {
          account_number_masked: string | null
          connected_at: string | null
          created_at: string
          id: string
          institution_code: string
          institution_name: string
          institution_type: string
          is_connected: boolean | null
          last_synced_at: string | null
          sync_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number_masked?: string | null
          connected_at?: string | null
          created_at?: string
          id?: string
          institution_code: string
          institution_name: string
          institution_type: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number_masked?: string | null
          connected_at?: string | null
          created_at?: string
          id?: string
          institution_code?: string
          institution_name?: string
          institution_type?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mydata_transactions: {
        Row: {
          amount: number
          category: string
          connection_id: string | null
          created_at: string
          description: string
          id: string
          is_recurring: boolean | null
          merchant_name: string | null
          sub_category: string | null
          transaction_date: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          connection_id?: string | null
          created_at?: string
          description: string
          id?: string
          is_recurring?: boolean | null
          merchant_name?: string | null
          sub_category?: string | null
          transaction_date: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          connection_id?: string | null
          created_at?: string
          description?: string
          id?: string
          is_recurring?: boolean | null
          merchant_name?: string | null
          sub_category?: string | null
          transaction_date?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mydata_transactions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "mydata_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      passkey_challenges: {
        Row: {
          challenge: string
          created_at: string
          email: string | null
          expires_at: string
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          challenge: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          challenge?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_orders: {
        Row: {
          amount: number
          corporate_account_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          order_type: string
          paid_at: string | null
          payment_method: string | null
          pg_provider: string | null
          pg_transaction_id: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
          vat_amount: number
        }
        Insert: {
          amount: number
          corporate_account_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          order_type: string
          paid_at?: string | null
          payment_method?: string | null
          pg_provider?: string | null
          pg_transaction_id?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
          vat_amount?: number
        }
        Update: {
          amount?: number
          corporate_account_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          order_type?: string
          paid_at?: string | null
          payment_method?: string | null
          pg_provider?: string | null
          pg_transaction_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_kpi_snapshots: {
        Row: {
          active_corporates: number | null
          active_suppliers: number | null
          avg_data_purity: number | null
          avg_trust_score: number | null
          created_at: string | null
          id: string
          platform_revenue: number | null
          snapshot_date: string
          supplier_payouts: number | null
          take_rate: number | null
          total_gmv: number | null
          total_transactions: number | null
        }
        Insert: {
          active_corporates?: number | null
          active_suppliers?: number | null
          avg_data_purity?: number | null
          avg_trust_score?: number | null
          created_at?: string | null
          id?: string
          platform_revenue?: number | null
          snapshot_date: string
          supplier_payouts?: number | null
          take_rate?: number | null
          total_gmv?: number | null
          total_transactions?: number | null
        }
        Update: {
          active_corporates?: number | null
          active_suppliers?: number | null
          avg_data_purity?: number | null
          avg_trust_score?: number | null
          created_at?: string | null
          id?: string
          platform_revenue?: number | null
          snapshot_date?: string
          supplier_payouts?: number | null
          take_rate?: number | null
          total_gmv?: number | null
          total_transactions?: number | null
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          base_price_per_unit: number
          category: string
          created_at: string | null
          grade_multipliers: Json
          id: string
          is_active: boolean | null
          max_sample_count: number | null
          min_sample_count: number | null
          quality_multipliers: Json
          sub_category: string | null
          updated_at: string | null
          urgency_multipliers: Json
        }
        Insert: {
          base_price_per_unit?: number
          category: string
          created_at?: string | null
          grade_multipliers?: Json
          id?: string
          is_active?: boolean | null
          max_sample_count?: number | null
          min_sample_count?: number | null
          quality_multipliers?: Json
          sub_category?: string | null
          updated_at?: string | null
          urgency_multipliers?: Json
        }
        Update: {
          base_price_per_unit?: number
          category?: string
          created_at?: string | null
          grade_multipliers?: Json
          id?: string
          is_active?: boolean | null
          max_sample_count?: number | null
          min_sample_count?: number | null
          quality_multipliers?: Json
          sub_category?: string | null
          updated_at?: string | null
          urgency_multipliers?: Json
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          allowed_uses: string[] | null
          anonymization_level: string
          category: string
          created_at: string
          id: string
          is_public: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_uses?: string[] | null
          anonymization_level?: string
          category: string
          created_at?: string
          id?: string
          is_public?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_uses?: string[] | null
          anonymization_level?: string
          category?: string
          created_at?: string
          id?: string
          is_public?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_group: string | null
          birthday: string | null
          company: string | null
          created_at: string | null
          data_categories: string[] | null
          data_last_updated: string | null
          display_name: string | null
          email: string | null
          gender: string | null
          id: string
          industry: string | null
          interests: string[] | null
          introduction: string | null
          is_verified: boolean | null
          locked_balance: number
          occupation: string | null
          onboarding_completed: boolean | null
          profile_completeness: number | null
          region: string | null
          security_level: number
          sns_keywords: string[] | null
          trust_score: number | null
          updated_at: string | null
          user_type: string
          vn_balance: number | null
        }
        Insert: {
          age_group?: string | null
          birthday?: string | null
          company?: string | null
          created_at?: string | null
          data_categories?: string[] | null
          data_last_updated?: string | null
          display_name?: string | null
          email?: string | null
          gender?: string | null
          id: string
          industry?: string | null
          interests?: string[] | null
          introduction?: string | null
          is_verified?: boolean | null
          locked_balance?: number
          occupation?: string | null
          onboarding_completed?: boolean | null
          profile_completeness?: number | null
          region?: string | null
          security_level?: number
          sns_keywords?: string[] | null
          trust_score?: number | null
          updated_at?: string | null
          user_type?: string
          vn_balance?: number | null
        }
        Update: {
          age_group?: string | null
          birthday?: string | null
          company?: string | null
          created_at?: string | null
          data_categories?: string[] | null
          data_last_updated?: string | null
          display_name?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          industry?: string | null
          interests?: string[] | null
          introduction?: string | null
          is_verified?: boolean | null
          locked_balance?: number
          occupation?: string | null
          onboarding_completed?: boolean | null
          profile_completeness?: number | null
          region?: string | null
          security_level?: number
          sns_keywords?: string[] | null
          trust_score?: number | null
          updated_at?: string | null
          user_type?: string
          vn_balance?: number | null
        }
        Relationships: []
      }
      purchase_approvals: {
        Row: {
          approval_note: string | null
          approver_id: string | null
          corporate_account_id: string
          created_at: string
          id: string
          processed_at: string | null
          purchase_id: string | null
          request_details: Json | null
          requested_amount: number
          requested_at: string
          requester_id: string
          status: string
        }
        Insert: {
          approval_note?: string | null
          approver_id?: string | null
          corporate_account_id: string
          created_at?: string
          id?: string
          processed_at?: string | null
          purchase_id?: string | null
          request_details?: Json | null
          requested_amount: number
          requested_at?: string
          requester_id: string
          status?: string
        }
        Update: {
          approval_note?: string | null
          approver_id?: string | null
          corporate_account_id?: string
          created_at?: string
          id?: string
          processed_at?: string | null
          purchase_id?: string | null
          request_details?: Json | null
          requested_amount?: number
          requested_at?: string
          requester_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_approvals_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      recommended_products: {
        Row: {
          buyer_id: string
          categories: string[] | null
          created_at: string
          description: string | null
          estimated_price: number | null
          estimated_sample_count: number | null
          expires_at: string | null
          id: string
          is_purchased: boolean | null
          is_viewed: boolean | null
          recommendation_type: string
          relevance_score: number | null
          template_id: string | null
          title: string
        }
        Insert: {
          buyer_id: string
          categories?: string[] | null
          created_at?: string
          description?: string | null
          estimated_price?: number | null
          estimated_sample_count?: number | null
          expires_at?: string | null
          id?: string
          is_purchased?: boolean | null
          is_viewed?: boolean | null
          recommendation_type: string
          relevance_score?: number | null
          template_id?: string | null
          title: string
        }
        Update: {
          buyer_id?: string
          categories?: string[] | null
          created_at?: string
          description?: string | null
          estimated_price?: number | null
          estimated_sample_count?: number | null
          expires_at?: string | null
          id?: string
          is_purchased?: boolean | null
          is_viewed?: boolean | null
          recommendation_type?: string
          relevance_score?: number | null
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommended_products_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "seasonal_data_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          payment_order_id: string
          processed_at: string | null
          reason: string | null
          reason_category: string | null
          refund_amount: number
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          payment_order_id: string
          processed_at?: string | null
          reason?: string | null
          reason_category?: string | null
          refund_amount: number
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          payment_order_id?: string
          processed_at?: string | null
          reason?: string | null
          reason_category?: string | null
          refund_amount?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_order_id_fkey"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_shares: {
        Row: {
          ai_verification_percent: number | null
          created_at: string | null
          effective_from: string
          effective_until: string | null
          id: string
          is_active: boolean | null
          marketing_percent: number | null
          operations_percent: number | null
          platform_fee_percent: number
          quality_bonus_percent: number
          supplier_base_percent: number
        }
        Insert: {
          ai_verification_percent?: number | null
          created_at?: string | null
          effective_from?: string
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          marketing_percent?: number | null
          operations_percent?: number | null
          platform_fee_percent?: number
          quality_bonus_percent?: number
          supplier_base_percent?: number
        }
        Update: {
          ai_verification_percent?: number | null
          created_at?: string | null
          effective_from?: string
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          marketing_percent?: number | null
          operations_percent?: number | null
          platform_fee_percent?: number
          quality_bonus_percent?: number
          supplier_base_percent?: number
        }
        Relationships: []
      }
      reward_ledger: {
        Row: {
          amount: number
          approval_workflow_id: string | null
          balance_after: number
          created_at: string
          description: string | null
          id: string
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          amount: number
          approval_workflow_id?: string | null
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          source_id?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          amount?: number
          approval_workflow_id?: string | null
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_ledger_approval_workflow_id_fkey"
            columns: ["approval_workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflow"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_data_templates: {
        Row: {
          applicable_industries: string[] | null
          applicable_months: number[] | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          recommended_categories: string[] | null
          template_name: string
          typical_sample_size: number | null
          urgency_level: string | null
        }
        Insert: {
          applicable_industries?: string[] | null
          applicable_months?: number[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          recommended_categories?: string[] | null
          template_name: string
          typical_sample_size?: number | null
          urgency_level?: string | null
        }
        Update: {
          applicable_industries?: string[] | null
          applicable_months?: number[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          recommended_categories?: string[] | null
          template_name?: string
          typical_sample_size?: number | null
          urgency_level?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          reviewed_at: string | null
          status: string
          submission_type: string
          submitted_at: string
          title: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string
          submission_type: string
          submitted_at?: string
          title: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string
          submission_type?: string
          submitted_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          billing_key_encrypted: string | null
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          next_billing_at: string | null
          payment_method: string | null
          plan_type: string
          price: number
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          billing_key_encrypted?: string | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          next_billing_at?: string | null
          payment_method?: string | null
          plan_type?: string
          price?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string
          billing_key_encrypted?: string | null
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          next_billing_at?: string | null
          payment_method?: string | null
          plan_type?: string
          price?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supplier_payouts: {
        Row: {
          base_amount: number
          bonus_breakdown: Json | null
          created_at: string | null
          id: string
          paid_at: string | null
          payout_status: string
          purchase_id: string
          quality_bonus: number | null
          supplier_id: string
          total_amount: number
          trust_score_at_time: number | null
          verification_grade: string | null
        }
        Insert: {
          base_amount: number
          bonus_breakdown?: Json | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payout_status?: string
          purchase_id: string
          quality_bonus?: number | null
          supplier_id: string
          total_amount: number
          trust_score_at_time?: number | null
          verification_grade?: string | null
        }
        Update: {
          base_amount?: number
          bonus_breakdown?: Json | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payout_status?: string
          purchase_id?: string
          quality_bonus?: number | null
          supplier_id?: string
          total_amount?: number
          trust_score_at_time?: number | null
          verification_grade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payouts_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "data_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          answer: string | null
          created_at: string | null
          id: string
          question_id: number
          question_text: string | null
          time_spent: number | null
          typing_speed: number | null
          user_id: string
          verification_id: string | null
        }
        Insert: {
          answer?: string | null
          created_at?: string | null
          id?: string
          question_id: number
          question_text?: string | null
          time_spent?: number | null
          typing_speed?: number | null
          user_id: string
          verification_id?: string | null
        }
        Update: {
          answer?: string | null
          created_at?: string | null
          id?: string
          question_id?: number
          question_text?: string | null
          time_spent?: number | null
          typing_speed?: number | null
          user_id?: string
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verification_history"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_reports: {
        Row: {
          avg_trust_score: number | null
          buyer_id: string
          cost_breakdown: Json | null
          created_at: string | null
          generated_at: string | null
          grade_distribution: Json | null
          id: string
          purchase_id: string | null
          quality_metrics: Json | null
          report_number: string
          total_distributed: number | null
          total_suppliers: number | null
        }
        Insert: {
          avg_trust_score?: number | null
          buyer_id: string
          cost_breakdown?: Json | null
          created_at?: string | null
          generated_at?: string | null
          grade_distribution?: Json | null
          id?: string
          purchase_id?: string | null
          quality_metrics?: Json | null
          report_number: string
          total_distributed?: number | null
          total_suppliers?: number | null
        }
        Update: {
          avg_trust_score?: number | null
          buyer_id?: string
          cost_breakdown?: Json | null
          created_at?: string | null
          generated_at?: string | null
          grade_distribution?: Json | null
          id?: string
          purchase_id?: string | null
          quality_metrics?: Json | null
          report_number?: string
          total_distributed?: number | null
          total_suppliers?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_reports_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "data_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number | null
          balance_before: number | null
          bank_info: Json | null
          bonus_amount: number | null
          created_at: string | null
          description: string | null
          id: string
          is_locked: boolean | null
          reference_id: string | null
          reference_type: string | null
          security_metadata: Json | null
          status: string | null
          total_amount: number | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          balance_before?: number | null
          bank_info?: Json | null
          bonus_amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_locked?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          security_metadata?: Json | null
          status?: string | null
          total_amount?: number | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          balance_before?: number | null
          bank_info?: Json | null
          bonus_amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_locked?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          security_metadata?: Json | null
          status?: string | null
          total_amount?: number | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      trust_threat_alerts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          threat_type: string
          user_id: string
          verification_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          threat_type: string
          user_id: string
          verification_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          threat_type?: string
          user_id?: string
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_threat_alerts_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "data_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_passkeys: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      user_purity_scores: {
        Row: {
          ai_authenticity_score: number | null
          data_quality_score: number | null
          failed_count: number | null
          id: string
          identity_consistency_score: number | null
          last_updated: string | null
          overall_score: number | null
          user_id: string
          verification_count: number | null
        }
        Insert: {
          ai_authenticity_score?: number | null
          data_quality_score?: number | null
          failed_count?: number | null
          id?: string
          identity_consistency_score?: number | null
          last_updated?: string | null
          overall_score?: number | null
          user_id: string
          verification_count?: number | null
        }
        Update: {
          ai_authenticity_score?: number | null
          data_quality_score?: number | null
          failed_count?: number | null
          id?: string
          identity_consistency_score?: number | null
          last_updated?: string | null
          overall_score?: number | null
          user_id?: string
          verification_count?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_history: {
        Row: {
          created_at: string | null
          id: string
          result: Json | null
          score_change: number | null
          trust_score_after: number | null
          trust_score_before: number | null
          user_id: string
          verification_type: string
          vn_earned: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          result?: Json | null
          score_change?: number | null
          trust_score_after?: number | null
          trust_score_before?: number | null
          user_id: string
          verification_type: string
          vn_earned?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          result?: Json | null
          score_change?: number | null
          trust_score_after?: number | null
          trust_score_before?: number | null
          user_id?: string
          verification_type?: string
          vn_earned?: number | null
        }
        Relationships: []
      }
      virtual_accounts: {
        Row: {
          account_holder: string
          account_number: string
          amount: number
          bank_code: string
          bank_name: string
          corporate_account_id: string | null
          created_at: string
          expires_at: string
          id: string
          is_used: boolean | null
          order_id: string | null
          paid_at: string | null
          user_id: string | null
        }
        Insert: {
          account_holder: string
          account_number: string
          amount: number
          bank_code: string
          bank_name: string
          corporate_account_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          is_used?: boolean | null
          order_id?: string | null
          paid_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_holder?: string
          account_number?: string
          amount?: number
          bank_code?: string
          bank_name?: string
          corporate_account_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          order_id?: string | null
          paid_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "virtual_accounts_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      vn_charge_records: {
        Row: {
          bonus_vn: number
          created_at: string
          exchange_rate: number | null
          id: string
          krw_amount: number
          payment_order_id: string | null
          total_vn: number
          user_id: string
          vn_amount: number
        }
        Insert: {
          bonus_vn?: number
          created_at?: string
          exchange_rate?: number | null
          id?: string
          krw_amount: number
          payment_order_id?: string | null
          total_vn: number
          user_id: string
          vn_amount: number
        }
        Update: {
          bonus_vn?: number
          created_at?: string
          exchange_rate?: number | null
          id?: string
          krw_amount?: number
          payment_order_id?: string | null
          total_vn?: number
          user_id?: string
          vn_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "vn_charge_records_payment_order_id_fkey"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
          withdrawal_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
          withdrawal_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
          withdrawal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_audit_logs_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawals"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_daily_stats: {
        Row: {
          created_at: string
          date: string
          id: string
          total_withdrawn: number
          updated_at: string
          user_id: string
          withdrawal_count: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          total_withdrawn?: number
          updated_at?: string
          user_id: string
          withdrawal_count?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
          withdrawal_count?: number
        }
        Relationships: []
      }
      withdrawal_limits: {
        Row: {
          created_at: string
          daily_limit: number
          high_value_threshold: number
          id: string
          monthly_limit: number
          requires_additional_verification: boolean | null
          single_transaction_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_limit?: number
          high_value_threshold?: number
          id?: string
          monthly_limit?: number
          requires_additional_verification?: boolean | null
          single_transaction_limit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_limit?: number
          high_value_threshold?: number
          id?: string
          monthly_limit?: number
          requires_additional_verification?: boolean | null
          single_transaction_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_monthly_stats: {
        Row: {
          created_at: string
          id: string
          total_withdrawn: number
          updated_at: string
          user_id: string
          withdrawal_count: number
          year_month: string
        }
        Insert: {
          created_at?: string
          id?: string
          total_withdrawn?: number
          updated_at?: string
          user_id: string
          withdrawal_count?: number
          year_month: string
        }
        Update: {
          created_at?: string
          id?: string
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
          withdrawal_count?: number
          year_month?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          account_holder: string | null
          account_number: string | null
          amount: number
          bank_name: string | null
          completed_at: string | null
          created_at: string
          failure_reason: string | null
          fee: number | null
          first_approved_at: string | null
          first_approver_id: string | null
          id: string
          net_amount: number | null
          otp_attempts: number | null
          otp_code: string | null
          otp_expires_at: string | null
          otp_verified: boolean | null
          processed_at: string | null
          requested_at: string
          requires_dual_approval: boolean | null
          second_approved_at: string | null
          second_approver_id: string | null
          status: string
          synergy_bonus: number | null
          user_id: string
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          amount: number
          bank_name?: string | null
          completed_at?: string | null
          created_at?: string
          failure_reason?: string | null
          fee?: number | null
          first_approved_at?: string | null
          first_approver_id?: string | null
          id?: string
          net_amount?: number | null
          otp_attempts?: number | null
          otp_code?: string | null
          otp_expires_at?: string | null
          otp_verified?: boolean | null
          processed_at?: string | null
          requested_at?: string
          requires_dual_approval?: boolean | null
          second_approved_at?: string | null
          second_approver_id?: string | null
          status?: string
          synergy_bonus?: number | null
          user_id: string
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          completed_at?: string | null
          created_at?: string
          failure_reason?: string | null
          fee?: number | null
          first_approved_at?: string | null
          first_approver_id?: string | null
          id?: string
          net_amount?: number | null
          otp_attempts?: number | null
          otp_code?: string | null
          otp_expires_at?: string | null
          otp_verified?: boolean | null
          processed_at?: string | null
          requested_at?: string
          requires_dual_approval?: boolean | null
          second_approved_at?: string | null
          second_approver_id?: string | null
          status?: string
          synergy_bonus?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: { Args: never; Returns: string }
      generate_report_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
