import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CorporatePreference {
  id: string;
  buyer_id: string;
  company_name: string;
  industry: string;
  preferred_categories: string[];
  preferred_demographics: Record<string, unknown>;
  collection_frequency: string;
  budget_range_min: number;
  budget_range_max: number;
  auto_notify: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeasonalTemplate {
  id: string;
  template_name: string;
  description: string;
  applicable_industries: string[];
  applicable_months: number[];
  recommended_categories: string[];
  typical_sample_size: number;
  urgency_level: string;
  is_active: boolean;
  created_at: string;
}

export interface RecommendedProduct {
  id: string;
  buyer_id: string;
  template_id: string | null;
  recommendation_type: string;
  title: string;
  description: string;
  categories: string[];
  estimated_price: number;
  estimated_sample_count: number;
  relevance_score: number;
  expires_at: string | null;
  is_viewed: boolean;
  is_purchased: boolean;
  created_at: string;
}

export interface DataSubscription {
  id: string;
  buyer_id: string;
  preference_id: string | null;
  subscription_type: string;
  categories: string[];
  target_sample_count: number;
  target_grade: string;
  monthly_budget: number;
  next_collection_date: string | null;
  last_collection_date: string | null;
  is_active: boolean;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export const useCorporatePreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 기업 선호도 조회
  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['corporate-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('corporate_preferences')
        .select('*')
        .eq('buyer_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as CorporatePreference | null;
    },
    enabled: !!user?.id,
  });

  // 시즌별 템플릿 조회
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['seasonal-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasonal_data_templates')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as SeasonalTemplate[];
    },
  });

  // 추천 상품 조회
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['recommended-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('recommended_products')
        .select('*')
        .eq('buyer_id', user.id)
        .eq('is_purchased', false)
        .order('relevance_score', { ascending: false });
      
      if (error) throw error;
      return data as RecommendedProduct[];
    },
    enabled: !!user?.id,
  });

  // 구독 조회
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['data-subscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('data_subscriptions')
        .select('*')
        .eq('buyer_id', user.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as DataSubscription[];
    },
    enabled: !!user?.id,
  });

  // 선호도 저장/업데이트
  const savePreferences = useMutation({
    mutationFn: async (prefs: Partial<CorporatePreference>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('corporate_preferences')
        .upsert({
          ...prefs,
          buyer_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-preferences'] });
      toast.success('선호도가 저장되었습니다');
    },
    onError: (error) => {
      toast.error('선호도 저장에 실패했습니다');
      console.error(error);
    },
  });

  // 구독 생성
  const createSubscription = useMutation({
    mutationFn: async (sub: Partial<DataSubscription>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('data_subscriptions')
        .insert({
          ...sub,
          buyer_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-subscriptions'] });
      toast.success('구독이 생성되었습니다');
    },
    onError: (error) => {
      toast.error('구독 생성에 실패했습니다');
      console.error(error);
    },
  });

  // 현재 월에 맞는 추천 템플릿 필터링
  const currentMonth = new Date().getMonth() + 1;
  const relevantTemplates = templates?.filter(t => 
    t.applicable_months.includes(currentMonth)
  ) || [];

  // 업종에 맞는 템플릿 필터링
  const industryTemplates = preferences?.industry 
    ? relevantTemplates.filter(t => t.applicable_industries.includes(preferences.industry))
    : relevantTemplates;

  return {
    preferences,
    templates,
    recommendations,
    subscriptions,
    relevantTemplates: industryTemplates,
    isLoading: preferencesLoading || templatesLoading || recommendationsLoading || subscriptionsLoading,
    savePreferences,
    createSubscription,
  };
};
