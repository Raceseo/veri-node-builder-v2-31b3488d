import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DemoRequest {
  productType: string;
  sampleCount: number;
  totalPrice: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { productType, sampleCount, totalPrice } = await req.json() as DemoRequest;

    // Calculate demo metrics
    const platformFeeRate = 0.15;
    const platformFee = Math.round(totalPrice * platformFeeRate);
    const supplierPool = totalPrice - platformFee;
    
    // Simulate supplier distribution
    const supplierCount = Math.max(sampleCount, Math.round(sampleCount * 1.27));
    const avgTrustScore = 78.3;
    
    // Grade distribution simulation
    const gradeDistribution = {
      S: Math.round(supplierCount * 0.23),
      A: Math.round(supplierCount * 0.45),
      B: Math.round(supplierCount * 0.22),
      C: Math.round(supplierCount * 0.10)
    };

    // Calculate rewards per grade
    const baseReward = Math.round(supplierPool * 0.7 / supplierCount);
    const qualityBonusPool = supplierPool * 0.3;
    
    const gradeMultipliers = { S: 1.5, A: 1.2, B: 1.0, C: 0.5 };
    const totalWeightedSuppliers = 
      gradeDistribution.S * gradeMultipliers.S +
      gradeDistribution.A * gradeMultipliers.A +
      gradeDistribution.B * gradeMultipliers.B +
      gradeDistribution.C * gradeMultipliers.C;
    
    const bonusPerWeight = qualityBonusPool / totalWeightedSuppliers;

    const avgReward = Math.round(supplierPool / supplierCount);
    const qualityScore = 99.2;

    // Calculate total distributed
    const totalDistributed = supplierPool;

    // Try to create a demo purchase record (optional - for persistence)
    try {
      const demoUserId = '00000000-0000-0000-0000-000000000000'; // Demo user ID
      
      // Create a demo purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from('data_purchases')
        .insert({
          buyer_id: demoUserId,
          product_type: productType || 'consumption',
          product_title: 'MZ세대 소비패턴 데이터셋 (Demo)',
          total_price: totalPrice,
          platform_fee: platformFee,
          supplier_pool: supplierPool,
          unit_count: sampleCount,
          unit_price: Math.round(totalPrice / sampleCount),
          status: 'completed',
          price_breakdown: {
            base: supplierPool * 0.7,
            quality_bonus: supplierPool * 0.3,
            platform_fee: platformFee,
            demo: true
          },
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (purchase && !purchaseError) {
        // Create demo transaction report
        const reportNumber = `TXN-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-DEMO`;
        
        await supabase
          .from('transaction_reports')
          .insert({
            purchase_id: purchase.id,
            buyer_id: demoUserId,
            report_number: reportNumber,
            total_suppliers: supplierCount,
            total_distributed: totalDistributed,
            avg_trust_score: avgTrustScore,
            grade_distribution: gradeDistribution,
            quality_metrics: {
              data_purity: qualityScore,
              completion_rate: 98.5,
              verification_rate: 100
            },
            cost_breakdown: {
              base_amount: supplierPool * 0.7,
              quality_bonus: supplierPool * 0.3,
              platform_fee: platformFee
            }
          });

        // Update KPI snapshot
        const today = new Date().toISOString().slice(0, 10);
        
        await supabase
          .from('platform_kpi_snapshots')
          .upsert({
            snapshot_date: today,
            total_gmv: totalPrice,
            platform_revenue: platformFee,
            supplier_payouts: supplierPool,
            active_suppliers: supplierCount,
            active_corporates: 1,
            total_transactions: 1,
            avg_trust_score: avgTrustScore,
            avg_data_purity: qualityScore,
            take_rate: platformFeeRate * 100
          }, {
            onConflict: 'snapshot_date'
          });
      }
    } catch (dbError) {
      console.log('Demo DB operation skipped:', dbError);
      // Continue without DB persistence for demo
    }

    return new Response(
      JSON.stringify({
        success: true,
        supplierCount,
        totalDistributed,
        platformFee,
        avgReward,
        qualityScore,
        gradeDistribution,
        rewards: {
          S: { count: gradeDistribution.S, base: baseReward, bonus: Math.round(bonusPerWeight * gradeMultipliers.S) },
          A: { count: gradeDistribution.A, base: baseReward, bonus: Math.round(bonusPerWeight * gradeMultipliers.A) },
          B: { count: gradeDistribution.B, base: baseReward, bonus: Math.round(bonusPerWeight * gradeMultipliers.B) },
          C: { count: gradeDistribution.C, base: baseReward, bonus: Math.round(bonusPerWeight * gradeMultipliers.C) }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Demo error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
