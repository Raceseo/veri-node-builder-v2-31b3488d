import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 기본 배율 (DB에서 조회 실패 시 사용)
const DEFAULT_GRADE_MULTIPLIERS = { silver: 1.0, gold: 1.5, platinum: 2.2, diamond: 2.8 };
const DEFAULT_URGENCY_MULTIPLIERS = { normal: 1.0, fast: 1.3, urgent: 1.8 };
const DEFAULT_QUALITY_MULTIPLIERS = { c_grade: 1.0, b_grade: 1.2, a_grade: 1.8, s_grade: 2.5 };

interface PricingRequest {
  productType: 'survey' | 'analysis' | 'raw_data';
  subCategory: string;
  sampleCount: number;
  targetGrade: string;
  urgency: string;
  hasCrossVerification?: boolean;
  qualityGrade?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const {
      productType,
      subCategory,
      sampleCount,
      targetGrade = 'silver',
      urgency = 'normal',
      hasCrossVerification = false,
      qualityGrade = 'c_grade',
    }: PricingRequest = await req.json();

    // 입력 검증
    if (!productType || !subCategory || !sampleCount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: productType, subCategory, sampleCount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (sampleCount < 10 || sampleCount > 10000) {
      return new Response(
        JSON.stringify({ error: 'Sample count must be between 10 and 10000' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 가격 정책 조회
    const { data: pricingRule } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('category', productType)
      .eq('sub_category', subCategory)
      .eq('is_active', true)
      .single();

    // 기본 단가 설정
    let basePricePerUnit = pricingRule?.base_price_per_unit || 500;
    
    // 배율 설정 (DB 또는 기본값)
    const gradeMultipliers = pricingRule?.grade_multipliers || DEFAULT_GRADE_MULTIPLIERS;
    const urgencyMultipliers = pricingRule?.urgency_multipliers || DEFAULT_URGENCY_MULTIPLIERS;
    const qualityMultipliers = pricingRule?.quality_multipliers || DEFAULT_QUALITY_MULTIPLIERS;

    const gradeMultiplier = gradeMultipliers[targetGrade] || 1.0;
    const urgencyMultiplier = urgencyMultipliers[urgency] || 1.0;
    const qualityMultiplier = productType === 'analysis' 
      ? (qualityMultipliers[qualityGrade] || 1.0)
      : 1.0;

    // 기본 가격 계산
    let basePrice = basePricePerUnit * sampleCount;
    basePrice = Math.round(basePrice * gradeMultiplier * urgencyMultiplier * qualityMultiplier);

    // 교차검증 추가 비용 (설문에만 적용, 20% 추가)
    const crossVerificationFee = hasCrossVerification && productType === 'survey' 
      ? Math.round(basePrice * 0.2) 
      : 0;

    // 총 가격
    const totalPrice = basePrice + crossVerificationFee;

    // 수익 분배 정책 조회
    const { data: revenueShare } = await supabase
      .from('revenue_shares')
      .select('*')
      .eq('is_active', true)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    const platformFeePercent = revenueShare?.platform_fee_percent || 25;
    const supplierBasePercent = revenueShare?.supplier_base_percent || 60;
    const qualityBonusPercent = revenueShare?.quality_bonus_percent || 15;

    // 수익 분배 계산
    const platformFee = Math.round(totalPrice * (platformFeePercent / 100));
    const supplierPool = totalPrice - platformFee;

    // 공급자 1인당 예상 보상 (등급별)
    const basePerSupplier = Math.round(supplierPool / sampleCount);
    const estimatedPerSupplier = {
      silver: basePerSupplier,
      gold: Math.round(basePerSupplier * 1.25),
      platinum: Math.round(basePerSupplier * 1.5),
    };

    const response = {
      pricing: {
        basePricePerUnit,
        sampleCount,
        gradeMultiplier,
        urgencyMultiplier,
        qualityMultiplier,
        crossVerificationFee,
        basePrice,
        totalPrice,
      },
      revenueDistribution: {
        platformFeePercent,
        platformFee,
        supplierPool,
        supplierBasePercent,
        qualityBonusPercent,
      },
      estimatedPerSupplier,
      breakdown: {
        baseCost: `₩${basePricePerUnit.toLocaleString()} × ${sampleCount}명`,
        gradeAdjustment: `${targetGrade.toUpperCase()} (×${gradeMultiplier})`,
        urgencyAdjustment: `${urgency} (×${urgencyMultiplier})`,
        crossVerification: hasCrossVerification ? `+₩${crossVerificationFee.toLocaleString()}` : '미포함',
        total: `₩${totalPrice.toLocaleString()}`,
      },
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Calculate purchase price error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
