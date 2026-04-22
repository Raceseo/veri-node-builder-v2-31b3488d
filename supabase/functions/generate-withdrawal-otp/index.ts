import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hashOTP } from "../_shared/crypto.ts";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 6자리 OTP 생성 (cryptographically secure)
function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Generate 6-digit OTP from random number
  return String(100000 + (array[0] % 900000));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      return new Response(
        JSON.stringify({ error: '인증 실패' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    
    // Rate limit check
    const rateLimitResult = await checkRateLimit(userId, 'generate-withdrawal-otp');
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    const { withdrawalId } = await req.json();

    if (!withdrawalId) {
      return new Response(
        JSON.stringify({ error: '출금 ID가 필요합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseServiceRole = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 출금 요청 확인 및 소유권 검증
    const { data: withdrawal, error: withdrawalError } = await supabaseServiceRole
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .eq('user_id', userId)
      .single();

    if (withdrawalError || !withdrawal) {
      return new Response(
        JSON.stringify({ error: '출금 요청을 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (withdrawal.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: '이미 처리된 출금 요청입니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (withdrawal.otp_verified) {
      return new Response(
        JSON.stringify({ error: '이미 OTP 인증이 완료되었습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OTP 생성 및 만료 시간 설정 (5분)
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Hash the OTP before storing - NEVER store plaintext OTP
    const otpHash = await hashOTP(otp);

    // OTP 해시 저장 (최대 3회 시도) - plaintext OTP is NOT stored
    const { error: updateError } = await supabaseServiceRole
      .from('withdrawals')
      .update({
        otp_code: otpHash,  // Store hash, not plaintext
        otp_expires_at: otpExpiresAt,
        otp_attempts: 0
      })
      .eq('id', withdrawalId);

    if (updateError) {
      console.error('OTP update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'OTP 생성 중 오류가 발생했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 실제 환경에서는 여기서 이메일/SMS로 OTP 전송
    // 현재는 개발 환경이므로 OTP를 직접 반환 (프로덕션에서는 제거 필요)
    console.log(`OTP generated for withdrawal ${withdrawalId}: ${otp}`);

    // Build response - OTP is only included in development environment
    const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
    
    const responseBody: Record<string, unknown> = { 
      success: true, 
      message: isDevelopment ? 'OTP가 생성되었습니다 (개발 모드)' : 'OTP가 등록된 연락처로 전송되었습니다',
      expiresAt: otpExpiresAt
    };

    // Only include OTP in development mode for testing
    if (isDevelopment) {
      responseBody.otp = otp;
      responseBody.devNote = 'OTP included for development testing only';
    }

    return new Response(
      JSON.stringify(responseBody),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-withdrawal-otp:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
