import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptData, getEncryptionKeyFromEnv } from "../_shared/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    let encryptionKey: string;
    try {
      encryptionKey = getEncryptionKeyFromEnv();
    } catch (err) {
      console.error('ENCRYPTION_KEY not configured');
      return new Response(
        JSON.stringify({ error: '서버 설정 오류' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user and get claims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 토큰입니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check if user is admin using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.log(`Admin access denied for user: ${userId}`);
      return new Response(
        JSON.stringify({ error: '관리자 권한이 필요합니다' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { withdrawal_id } = await req.json();

    if (!withdrawal_id) {
      return new Response(
        JSON.stringify({ error: '출금 ID가 필요합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch encrypted withdrawal data
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawals')
      .select('account_number, account_holder, bank_name, user_id, amount, status')
      .eq('id', withdrawal_id)
      .single();

    if (fetchError || !withdrawal) {
      console.error('Withdrawal fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: '출금 정보를 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt bank information using shared crypto utility
    let decryptedAccountNumber = withdrawal.account_number;
    let decryptedAccountHolder = withdrawal.account_holder;

    try {
      if (withdrawal.account_number) {
        decryptedAccountNumber = await decryptData(withdrawal.account_number, encryptionKey);
      }
      if (withdrawal.account_holder) {
        decryptedAccountHolder = await decryptData(withdrawal.account_holder, encryptionKey);
      }
    } catch (decryptError) {
      console.error('Decryption error:', decryptError);
      return new Response(
        JSON.stringify({ error: '복호화에 실패했습니다. 암호화 키를 확인하세요.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log admin access for audit
    console.log(`Admin ${userId} accessed withdrawal ${withdrawal_id} bank info`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          withdrawal_id,
          bank_name: withdrawal.bank_name,
          account_number: decryptedAccountNumber,
          account_holder: decryptedAccountHolder,
          amount: withdrawal.amount,
          status: withdrawal.status,
          user_id: withdrawal.user_id
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Decrypt bank info error:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
