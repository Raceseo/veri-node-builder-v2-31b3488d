import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      purchaseId, 
      amount, 
      vatAmount, 
      totalAmount, 
      paymentMethod,
      needTaxInvoice,
      taxEmail,
    } = await req.json();

    // Generate unique merchant UID
    const merchantUid = `corp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if user has corporate account
    const { data: corpAccount } = await supabaseClient
      .from('corporate_accounts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Create payment order
    const { data: order, error: orderError } = await supabaseClient
      .from('payment_orders')
      .insert({
        user_id: user.id,
        corporate_account_id: corpAccount?.id || null,
        amount,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        order_type: 'data_purchase',
        payment_method: paymentMethod,
        status: 'pending',
        metadata: {
          purchase_id: purchaseId,
          merchant_uid: merchantUid,
          need_tax_invoice: needTaxInvoice,
          tax_email: taxEmail,
        },
      })
      .select()
      .single();

    if (orderError) throw orderError;

    let virtualAccount = null;

    // For virtual account, generate account info
    if (paymentMethod === 'virtual_account') {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // In production, this would call the PG API to generate real virtual account
      // For now, create mock data
      const { data: vaData, error: vaError } = await supabaseClient
        .from('virtual_accounts')
        .insert({
          user_id: user.id,
          corporate_account_id: corpAccount?.id || null,
          order_id: order.id,
          bank_code: '020',
          bank_name: '우리은행',
          account_number: `1002-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900000 + 100000)}`,
          account_holder: 'VeriNode',
          amount: totalAmount,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (!vaError && vaData) {
        virtualAccount = {
          bankName: vaData.bank_name,
          accountNumber: vaData.account_number,
          accountHolder: vaData.account_holder,
          expiresAt: vaData.expires_at,
        };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        merchantUid,
        virtualAccount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Corporate payment creation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
