import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PurchaseRequest {
  productType: 'survey' | 'analysis' | 'raw_data';
  productId?: string;
  productTitle: string;
  totalPrice: number;
  unitCount: number;
  unitPrice: number;
  targetGrade: string;
  urgency: string;
  hasCrossVerification: boolean;
  priceBreakdown: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 인증 확인
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const purchaseData: PurchaseRequest = await req.json();

    // 수익 분배 정책 조회
    const { data: revenueShare } = await supabase
      .from('revenue_shares')
      .select('*')
      .eq('is_active', true)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    const platformFeePercent = revenueShare?.platform_fee_percent || 25;

    // 수익 분배 계산
    const platformFee = Math.round(purchaseData.totalPrice * (platformFeePercent / 100));
    const supplierPool = purchaseData.totalPrice - platformFee;

    // 구매 기록 생성
    const { data: purchase, error: purchaseError } = await supabase
      .from('data_purchases')
      .insert({
        buyer_id: user.id,
        product_type: purchaseData.productType,
        product_id: purchaseData.productId || null,
        product_title: purchaseData.productTitle,
        total_price: purchaseData.totalPrice,
        platform_fee: platformFee,
        supplier_pool: supplierPool,
        unit_count: purchaseData.unitCount,
        unit_price: purchaseData.unitPrice,
        target_grade: purchaseData.targetGrade,
        urgency: purchaseData.urgency,
        has_cross_verification: purchaseData.hasCrossVerification,
        price_breakdown: purchaseData.priceBreakdown,
        status: 'pending',
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Purchase insert error:', purchaseError);
      return new Response(
        JSON.stringify({ error: 'Failed to create purchase record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        purchase: {
          id: purchase.id,
          totalPrice: purchaseData.totalPrice,
          platformFee,
          supplierPool,
          status: 'pending',
        },
        message: '구매 요청이 생성되었습니다. 결제 완료 후 데이터 수집이 시작됩니다.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process data purchase error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
