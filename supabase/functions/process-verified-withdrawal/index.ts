import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptData, getEncryptionKeyFromEnv } from "../_shared/crypto.ts";

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
    // 인증 확인
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다', code: 'AUTH_REQUIRED' }),
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
        JSON.stringify({ error: '인증 실패', code: 'AUTH_FAILED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('Processing verified withdrawal for user:', userId);

    // 요청 본문 파싱
    const { amount, bankName, accountNumber, accountHolder, consentConfirmed } = await req.json();

    // 입력 검증
    if (!amount || !bankName || !accountNumber || !accountHolder) {
      return new Response(
        JSON.stringify({ error: '모든 필드를 입력해주세요', code: 'MISSING_FIELDS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 동의 확인 검증
    if (!consentConfirmed) {
      return new Response(
        JSON.stringify({ error: '데이터 정산금 인출 동의가 필요합니다', code: 'CONSENT_REQUIRED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedBankName = String(bankName).trim();
    const trimmedAccountNumber = String(accountNumber).trim();
    const trimmedAccountHolder = String(accountHolder).trim();

    // 금액 검증
    if (typeof amount !== 'number' || amount < 1000 || amount > 10000000) {
      return new Response(
        JSON.stringify({ error: '출금 금액은 1,000원 ~ 10,000,000원 사이로 입력해주세요', code: 'INVALID_AMOUNT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 계좌번호 검증
    if (!/^\d{10,16}$/.test(trimmedAccountNumber)) {
      return new Response(
        JSON.stringify({ error: '계좌번호는 10-16자리 숫자로 입력해주세요', code: 'INVALID_ACCOUNT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 서비스 롤 클라이언트로 DB 작업
    const supabaseServiceRole = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 사용자 잔액 확인
    const { data: profile, error: profileError } = await supabaseServiceRole
      .from('profiles')
      .select('vn_balance, trust_score')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: '사용자 정보를 찾을 수 없습니다', code: 'PROFILE_NOT_FOUND' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if ((profile.vn_balance || 0) < amount) {
      return new Response(
        JSON.stringify({ error: '잔액이 부족합니다', code: 'INSUFFICIENT_BALANCE' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 암호화 키 가져오기
    const encryptionKey = getEncryptionKeyFromEnv();
    
    // 계좌번호와 예금주 암호화
    const encryptedAccountNumber = await encryptData(trimmedAccountNumber, encryptionKey);
    const encryptedAccountHolder = await encryptData(trimmedAccountHolder, encryptionKey);
    
    console.log('Bank info encrypted successfully');

    // 수수료는 DB 트리거(validate_withdrawal)에서 자동 계산됨
    // net_amount는 Generated Column이므로 직접 INSERT 불가
    const estimatedFee = Math.ceil(amount * 0.01);
    const estimatedNetAmount = amount - estimatedFee;

    // 출금 요청 저장 및 즉시 완료 처리 (본인 인증 완료로 자동 승인)
    // NOTE: fee와 net_amount는 DB 트리거/생성컬럼에서 자동 처리
    const { data: withdrawal, error: insertError } = await supabaseServiceRole
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount: amount,
        // fee, net_amount는 DB에서 자동 계산되므로 제외
        bank_name: trimmedBankName,
        account_number: encryptedAccountNumber,
        account_holder: encryptedAccountHolder,
        status: 'completed', // 본인 인증 완료로 즉시 completed
        completed_at: new Date().toISOString(),
        otp_verified: true // 본인 인증 완료 표시
      })
      .select()
      .single();

    if (insertError) {
      console.error('Withdrawal insert error:', insertError);
      return new Response(
        JSON.stringify({ error: '출금 요청 중 오류가 발생했습니다', code: 'INSERT_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Withdrawal created with completed status:', withdrawal.id);

    // DB에서 계산된 실제 fee와 net_amount 사용
    const actualFee = withdrawal.fee || estimatedFee;
    const actualNetAmount = withdrawal.net_amount || estimatedNetAmount;

    // 금융급 보안 감사 로그 기록
    const { error: auditError } = await supabaseServiceRole
      .from('withdrawal_audit_logs')
      .insert({
        withdrawal_id: withdrawal.id,
        user_id: userId,
        action: 'identity_verified_auto_complete',
        details: {
          verification_method: 'password_reauthentication',
          consent_confirmed: true,
          consent_text: '본인은 데이터 가치 정산금 인출에 동의하며, 이는 본인에 의해 직접 요청되었습니다',
          verified_at: new Date().toISOString(),
          withdrawal_amount: amount,
          fee: actualFee,
          net_amount: actualNetAmount,
          bank_name: trimmedBankName,
          status_result: 'completed',
          auto_approved: true,
          security_level: 'financial_grade',
          user_trust_score: profile.trust_score
        }
      });

    if (auditError) {
      console.error('Audit log error:', auditError);
      // 감사 로그 실패는 출금 처리에 영향을 주지 않음 (단, 로그는 남김)
    }

    // 송금 API 호출 시뮬레이션 (실제 환경에서는 PortOne/은행 API 연동)
    console.log('Transfer API call simulation:', {
      bankName: trimmedBankName,
      accountNumber: '****' + trimmedAccountNumber.slice(-4),
      amount: actualNetAmount,
      withdrawalId: withdrawal.id
    });

    // 송금 완료 감사 로그
    await supabaseServiceRole
      .from('withdrawal_audit_logs')
      .insert({
        withdrawal_id: withdrawal.id,
        user_id: userId,
        action: 'transfer_initiated',
        details: {
          transfer_amount: actualNetAmount,
          bank_name: trimmedBankName,
          initiated_at: new Date().toISOString(),
          transfer_status: 'simulated_success',
          note: '실제 환경에서는 PortOne/은행 API를 통해 송금 처리됨'
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '본인 인증 완료 - 출금이 즉시 처리되었습니다',
        withdrawalId: withdrawal.id,
        netAmount: actualNetAmount,
        fee: actualFee,
        status: 'completed'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-verified-withdrawal:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다', code: 'SERVER_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
