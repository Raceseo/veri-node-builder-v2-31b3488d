import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyOTPHash } from "../_shared/crypto.ts";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const rateLimitResult = await checkRateLimit(userId, 'verify-withdrawal-otp');
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    const { withdrawalId, otp } = await req.json();

    if (!withdrawalId || !otp) {
      return new Response(
        JSON.stringify({ error: '출금 ID와 OTP가 필요합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OTP 형식 검증
    if (!/^\d{6}$/.test(otp)) {
      return new Response(
        JSON.stringify({ error: 'OTP는 6자리 숫자입니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseServiceRole = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 출금 요청 확인
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

    // OTP 만료 확인
    if (!withdrawal.otp_expires_at || new Date(withdrawal.otp_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'OTP가 만료되었습니다. 새로운 OTP를 요청해주세요' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 시도 횟수 확인 (최대 3회)
    const attempts = (withdrawal.otp_attempts || 0) + 1;
    
    if (attempts > 3) {
      // 출금 요청 취소 - clear OTP hash for security
      await supabaseServiceRole
        .from('withdrawals')
        .update({ 
          status: 'cancelled', 
          failure_reason: 'OTP 인증 실패 (3회 초과)',
          otp_code: null  // Clear OTP hash after max attempts
        })
        .eq('id', withdrawalId);

      return new Response(
        JSON.stringify({ error: 'OTP 인증 실패 횟수를 초과했습니다. 출금 요청이 취소되었습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OTP 검증 using secure hash comparison
    const isValidOTP = await verifyOTPHash(otp, withdrawal.otp_code);
    
    if (!isValidOTP) {
      // 시도 횟수 증가
      await supabaseServiceRole
        .from('withdrawals')
        .update({ otp_attempts: attempts })
        .eq('id', withdrawalId);

      const remainingAttempts = 3 - attempts;
      return new Response(
        JSON.stringify({ 
          error: `OTP가 일치하지 않습니다. ${remainingAttempts}회 남음`,
          remainingAttempts
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OTP 인증 성공 - 자동 출금 처리 시작
    console.log(`OTP verified for withdrawal ${withdrawalId}, processing automatic withdrawal...`);

    const withdrawalAmount = Number(withdrawal.amount);
    const netAmount = Number(withdrawal.net_amount);
    const today = new Date().toISOString().split('T')[0];
    const yearMonth = today.substring(0, 7); // YYYY-MM

    // ===== 출금 한도 검증 시작 =====
    
    // 사용자 한도 설정 가져오기
    const { data: limits } = await supabaseServiceRole
      .from('withdrawal_limits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const dailyLimit = limits?.daily_limit || 100000;
    const monthlyLimit = limits?.monthly_limit || 1000000;
    const singleLimit = limits?.single_transaction_limit || 50000;
    const highValueThreshold = limits?.high_value_threshold || 30000;

    // 1. 단일 거래 한도 확인
    if (withdrawalAmount > singleLimit) {
      return new Response(
        JSON.stringify({ 
          error: `1회 출금 한도(${singleLimit.toLocaleString()}원)를 초과했습니다`,
          limitType: 'single',
          limit: singleLimit,
          requested: withdrawalAmount
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 일일 출금 통계 조회
    const { data: dailyStats } = await supabaseServiceRole
      .from('withdrawal_daily_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    const todayWithdrawn = dailyStats?.total_withdrawn || 0;
    const dailyRemaining = dailyLimit - todayWithdrawn;

    if (withdrawalAmount > dailyRemaining) {
      return new Response(
        JSON.stringify({ 
          error: `일일 출금 한도를 초과했습니다. 오늘 남은 한도: ${dailyRemaining.toLocaleString()}원`,
          limitType: 'daily',
          limit: dailyLimit,
          used: todayWithdrawn,
          remaining: dailyRemaining,
          requested: withdrawalAmount
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 월간 출금 통계 조회
    const { data: monthlyStats } = await supabaseServiceRole
      .from('withdrawal_monthly_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('year_month', yearMonth)
      .maybeSingle();

    const monthWithdrawn = monthlyStats?.total_withdrawn || 0;
    const monthlyRemaining = monthlyLimit - monthWithdrawn;

    if (withdrawalAmount > monthlyRemaining) {
      return new Response(
        JSON.stringify({ 
          error: `월간 출금 한도를 초과했습니다. 이번 달 남은 한도: ${monthlyRemaining.toLocaleString()}원`,
          limitType: 'monthly',
          limit: monthlyLimit,
          used: monthWithdrawn,
          remaining: monthlyRemaining,
          requested: withdrawalAmount
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 고액 출금 경고 (추가 인증 필요 여부 확인)
    const isHighValue = withdrawalAmount >= highValueThreshold;
    if (isHighValue && limits?.requires_additional_verification) {
      // 추후 추가 인증 로직 구현 가능
      console.log(`High value withdrawal detected: ${withdrawalAmount}원`);
    }

    // ===== 출금 한도 검증 완료 =====

    // 1. 사용자 잔액 및 locked_balance 확인
    const { data: profile, error: profileError } = await supabaseServiceRole
      .from('profiles')
      .select('vn_balance, locked_balance')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: '사용자 정보를 찾을 수 없습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentBalance = profile.vn_balance || 0;

    // 잔액 부족 확인
    if (currentBalance < withdrawalAmount) {
      await supabaseServiceRole
        .from('withdrawals')
        .update({ 
          status: 'failed', 
          failure_reason: '잔액 부족',
          otp_verified: true
        })
        .eq('id', withdrawalId);

      return new Response(
        JSON.stringify({ error: '잔액이 부족합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 잔액 차감 및 locked_balance 해제
    const newBalance = currentBalance - withdrawalAmount;
    const currentLockedBalance = profile.locked_balance || 0;
    const newLockedBalance = Math.max(0, currentLockedBalance - withdrawalAmount);
    
    const { error: balanceError } = await supabaseServiceRole
      .from('profiles')
      .update({ 
        vn_balance: newBalance,
        locked_balance: newLockedBalance
      })
      .eq('id', userId);

    if (balanceError) {
      console.error('Balance update error:', balanceError);
      return new Response(
        JSON.stringify({ error: '잔액 차감 중 오류가 발생했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 출금 상태 업데이트 (완료) - clear OTP hash after successful verification
    const { error: updateError } = await supabaseServiceRole
      .from('withdrawals')
      .update({ 
        otp_verified: true,
        otp_code: null,  // Clear OTP hash after successful verification for security
        status: 'completed',
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId);

    if (updateError) {
      // 잔액 롤백
      await supabaseServiceRole
        .from('profiles')
        .update({ vn_balance: currentBalance })
        .eq('id', userId);

      console.error('Withdrawal status update error:', updateError);
      return new Response(
        JSON.stringify({ error: '출금 처리 중 오류가 발생했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 일일 출금 통계 업데이트 (Upsert)
    await supabaseServiceRole
      .from('withdrawal_daily_stats')
      .upsert({
        user_id: userId,
        date: today,
        total_withdrawn: todayWithdrawn + withdrawalAmount,
        withdrawal_count: (dailyStats?.withdrawal_count || 0) + 1,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,date' });

    // 5. 월간 출금 통계 업데이트 (Upsert)
    await supabaseServiceRole
      .from('withdrawal_monthly_stats')
      .upsert({
        user_id: userId,
        year_month: yearMonth,
        total_withdrawn: monthWithdrawn + withdrawalAmount,
        withdrawal_count: (monthlyStats?.withdrawal_count || 0) + 1,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,year_month' });

    // 6. 거래 내역 기록
    await supabaseServiceRole
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'withdrawal',
        amount: -withdrawalAmount,
        balance_before: currentBalance,
        balance_after: newBalance,
        description: `출금 완료 (수수료 ${withdrawal.fee}원 차감)`,
        reference_id: withdrawalId,
        reference_type: 'withdrawal',
        status: 'completed'
      });

    // 7. 감사 로그 기록
    await supabaseServiceRole
      .from('withdrawal_audit_logs')
      .insert({
        withdrawal_id: withdrawalId,
        user_id: userId,
        action: 'completed',
        details: { 
          otp_verified_at: new Date().toISOString(),
          amount: withdrawalAmount,
          net_amount: netAmount,
          fee: withdrawal.fee,
          balance_before: currentBalance,
          balance_after: newBalance,
          is_high_value: isHighValue,
          daily_used_after: todayWithdrawn + withdrawalAmount,
          monthly_used_after: monthWithdrawn + withdrawalAmount
        }
      });

    console.log(`Withdrawal ${withdrawalId} completed successfully. Amount: ${withdrawalAmount}, Net: ${netAmount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '출금이 완료되었습니다!',
        withdrawalId,
        amount: withdrawalAmount,
        netAmount,
        fee: withdrawal.fee,
        newBalance,
        limits: {
          dailyUsed: todayWithdrawn + withdrawalAmount,
          dailyLimit,
          dailyRemaining: dailyLimit - (todayWithdrawn + withdrawalAmount),
          monthlyUsed: monthWithdrawn + withdrawalAmount,
          monthlyLimit,
          monthlyRemaining: monthlyLimit - (monthWithdrawn + withdrawalAmount)
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-withdrawal-otp:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
