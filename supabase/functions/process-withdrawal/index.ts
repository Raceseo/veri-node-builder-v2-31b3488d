import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptData, getEncryptionKeyFromEnv } from "../_shared/crypto.ts";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 인증 확인
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // JWT 검증
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: '인증 실패' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    
    // Rate limit check
    const rateLimitResult = await checkRateLimit(userId, 'process-withdrawal');
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    console.log('Processing withdrawal for user:', userId);

    // 요청 본문 파싱
    const { amount, bankName, accountNumber, accountHolder } = await req.json();

    // 입력 검증
    if (!amount || !bankName || !accountNumber || !accountHolder) {
      return new Response(
        JSON.stringify({ error: '모든 필드를 입력해주세요' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedBankName = String(bankName).trim();
    const trimmedAccountNumber = String(accountNumber).trim();
    const trimmedAccountHolder = String(accountHolder).trim();

    // 금액 검증
    if (typeof amount !== 'number' || amount < 1000 || amount > 10000000) {
      return new Response(
        JSON.stringify({ error: '출금 금액은 1,000원 ~ 10,000,000원 사이로 입력해주세요' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 은행명 검증
    if (trimmedBankName.length < 2 || trimmedBankName.length > 50) {
      return new Response(
        JSON.stringify({ error: '은행명은 2-50자 사이로 입력해주세요' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 계좌번호 검증 (암호화 전 평문 검증)
    if (!/^\d{10,16}$/.test(trimmedAccountNumber)) {
      return new Response(
        JSON.stringify({ error: '계좌번호는 10-16자리 숫자로 입력해주세요' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 예금주 검증
    if (trimmedAccountHolder.length < 2 || trimmedAccountHolder.length > 50) {
      return new Response(
        JSON.stringify({ error: '예금주명은 2-50자 사이로 입력해주세요' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 암호화 키 가져오기 (공유 유틸리티 사용)
    const encryptionKey = getEncryptionKeyFromEnv();
    console.log('Encryption key loaded successfully');

    // 계좌번호와 예금주 암호화 (SHA-256 기반 키 파생 사용)
    const encryptedAccountNumber = await encryptData(trimmedAccountNumber, encryptionKey);
    const encryptedAccountHolder = await encryptData(trimmedAccountHolder, encryptionKey);
    
    console.log('Bank info encrypted successfully');

    // 서비스 롤 클라이언트로 DB 삽입 (RLS 우회)
    const supabaseServiceRole = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 사용자 잔액 확인
    const { data: profile, error: profileError } = await supabaseServiceRole
      .from('profiles')
      .select('vn_balance')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: '사용자 정보를 찾을 수 없습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if ((profile.vn_balance || 0) < amount) {
      return new Response(
        JSON.stringify({ error: '잔액이 부족합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 수수료는 DB 트리거/생성컬럼에서 자동 계산됨
    const estimatedFee = Math.ceil(amount * 0.01);
    const estimatedNetAmount = amount - estimatedFee;

    // 출금 요청 저장 (암호화된 정보)
    // NOTE: fee와 net_amount는 generated column이므로 INSERT에서 제외
    const { data: withdrawal, error: insertError } = await supabaseServiceRole
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount: amount,
        bank_name: trimmedBankName,
        account_number: encryptedAccountNumber,
        account_holder: encryptedAccountHolder,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Withdrawal insert error:', insertError);
      return new Response(
        JSON.stringify({ error: '출금 요청 중 오류가 발생했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Withdrawal created successfully:', withdrawal.id);

    // DB에서 계산된 실제 값 사용
    const actualFee = withdrawal.fee || estimatedFee;
    const actualNetAmount = withdrawal.net_amount || estimatedNetAmount;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '출금 요청이 완료되었습니다',
        withdrawalId: withdrawal.id,
        netAmount: actualNetAmount,
        fee: actualFee
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-withdrawal:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
