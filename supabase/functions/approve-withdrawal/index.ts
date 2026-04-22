import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req): Promise<Response> => {
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // User client for authentication
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: '인증 실패' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const approverId = user.id;
    
    // Rate limit check
    const rateLimitResult = await checkRateLimit(approverId, 'approve-withdrawal');
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    console.log('Approver ID:', approverId);

    // Parse request
    const { withdrawalId, approvalType } = await req.json();

    if (!withdrawalId || !approvalType) {
      return new Response(
        JSON.stringify({ error: '필수 파라미터가 누락되었습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['first', 'second'].includes(approvalType)) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 승인 유형입니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service role client for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch withdrawal
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      console.error('Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: '출금 요청을 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ 관리자 역할 검증
    const { data: hasAdminRole } = await supabase
      .rpc('has_role', { _user_id: approverId, _role: 'admin' });

    if (!hasAdminRole) {
      console.error('Security violation: Non-admin attempted approval', { approverId, withdrawalId });
      
      await supabase.from('withdrawal_audit_logs').insert({
        withdrawal_id: withdrawalId,
        user_id: approverId,
        action: 'approval_blocked',
        details: { reason: 'admin_role_required', blocked_at: new Date().toISOString() }
      });

      return new Response(
        JSON.stringify({ 
          error: '권한 부족: 관리자만 출금을 승인할 수 있습니다',
          code: 'ADMIN_ROLE_REQUIRED'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation based on approval type
    if (approvalType === 'first') {
      if (withdrawal.status !== 'pending') {
        return new Response(
          JSON.stringify({ error: '1차 승인 대기 상태가 아닙니다' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ✅ 신청자 본인이 1차 승인하는 것 차단
      if (withdrawal.user_id === approverId) {
        console.error('Security violation: Self-approval attempted', {
          withdrawalId,
          userId: withdrawal.user_id,
          approverId
        });

        await supabase.from('withdrawal_audit_logs').insert({
          withdrawal_id: withdrawalId,
          user_id: approverId,
          action: 'approval_blocked',
          details: { reason: 'self_approval_attempt', blocked_at: new Date().toISOString() }
        });

        return new Response(
          JSON.stringify({ 
            error: '금융 보안 정책상 본인 승인은 불가능합니다',
            code: 'SELF_APPROVAL_BLOCKED'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update to first_approved
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: 'first_approved',
          first_approver_id: approverId,
          first_approved_at: new Date().toISOString(),
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(
          JSON.stringify({ error: '1차 승인 처리 중 오류가 발생했습니다' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log audit with detailed approver info
      await supabase.from('withdrawal_audit_logs').insert({
        withdrawal_id: withdrawalId,
        user_id: approverId,
        action: 'first_approval',
        details: { 
          approved_at: new Date().toISOString(),
          approver_id: approverId,
          approval_stage: '1차 승인',
          withdrawal_amount: withdrawal.amount,
          withdrawal_status_before: 'pending',
          withdrawal_status_after: 'first_approved'
        }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: '1차 승인이 완료되었습니다',
          newStatus: 'first_approved'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (approvalType === 'second') {
      if (withdrawal.status !== 'first_approved') {
        return new Response(
          JSON.stringify({ error: '2차 승인 대기 상태가 아닙니다' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ✅ 신청자 본인이 2차 승인하는 것 차단
      if (withdrawal.user_id === approverId) {
        console.error('Security violation: Self-approval attempted on second stage', {
          withdrawalId,
          userId: withdrawal.user_id,
          approverId
        });

        await supabase.from('withdrawal_audit_logs').insert({
          withdrawal_id: withdrawalId,
          user_id: approverId,
          action: 'approval_blocked',
          details: { reason: 'self_approval_attempt_second_stage', blocked_at: new Date().toISOString() }
        });

        return new Response(
          JSON.stringify({ 
            error: '금융 보안 정책상 본인 승인은 불가능합니다',
            code: 'SELF_APPROVAL_BLOCKED'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ✅ 1차 승인자와 2차 승인자가 동일인인 경우 차단 (분리 원칙 강제)
      if (withdrawal.first_approver_id === approverId) {
        console.error('Security violation: Same approver for both stages', {
          withdrawalId,
          firstApproverId: withdrawal.first_approver_id,
          secondApproverId: approverId
        });

        await supabase.from('withdrawal_audit_logs').insert({
          withdrawal_id: withdrawalId,
          user_id: approverId,
          action: 'approval_blocked',
          details: { 
            reason: 'same_approver_violation', 
            blocked_at: new Date().toISOString(),
            first_approver_id: withdrawal.first_approver_id
          }
        });

        return new Response(
          JSON.stringify({ 
            error: '보안 정책 위반: 1차 승인자와 2차 승인자는 반드시 다른 관리자여야 합니다',
            code: 'SAME_APPROVER_BLOCKED'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update to completed - trigger will handle balance deduction
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: 'completed',
          second_approver_id: approverId,
          second_approved_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(
          JSON.stringify({ error: '2차 승인 처리 중 오류가 발생했습니다: ' + updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log audit with detailed approver info
      await supabase.from('withdrawal_audit_logs').insert({
        withdrawal_id: withdrawalId,
        user_id: approverId,
        action: 'second_approval',
        details: { 
          approved_at: new Date().toISOString(),
          approver_id: approverId,
          first_approver_id: withdrawal.first_approver_id,
          approval_stage: '2차 승인 (최종)',
          withdrawal_amount: withdrawal.amount,
          net_amount: withdrawal.net_amount,
          withdrawal_status_before: 'first_approved',
          withdrawal_status_after: 'completed',
          applicant_id: withdrawal.user_id
        }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: '2차 승인이 완료되었습니다. 출금이 처리됩니다.',
          newStatus: 'completed'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // This should never be reached, but satisfies TypeScript
    return new Response(
      JSON.stringify({ error: '알 수 없는 오류' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in approve-withdrawal:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
