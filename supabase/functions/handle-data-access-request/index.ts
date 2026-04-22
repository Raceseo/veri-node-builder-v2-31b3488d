import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: '인증 실패' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { action, ...payload } = await req.json();

    // ─── 1. 기업이 데이터 구매 요청 생성 ───
    if (action === 'create_request') {
      const { supplierId, dataCategories, offeredPrice, message, requestType, purchaseId } = payload;

      const { data: request, error } = await supabase
        .from('data_access_requests')
        .insert({
          buyer_id: user.id,
          supplier_id: supplierId,
          purchase_id: purchaseId || null,
          request_type: requestType || 'data_purchase',
          data_categories: dataCategories || [],
          offered_price: offeredPrice || 0,
          message: message || null,
          admin_status: requestType === 'sensitive_export' ? 'pending' : 'not_required',
        })
        .select()
        .single();

      if (error) throw error;

      // 공급자에게 알림 발송
      await supabase.from('notifications').insert({
        user_id: supplierId,
        type: 'approval_request',
        title: '📋 새로운 데이터 요청',
        message: `기업에서 귀하의 데이터를 요청했습니다. 제안 금액: ${offeredPrice?.toLocaleString() || 0} VN`,
        metadata: { request_id: request.id, offered_price: offeredPrice, categories: dataCategories }
      });

      return new Response(JSON.stringify({ success: true, request }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── 2. 공급자가 승인/거절 ───
    if (action === 'supplier_respond') {
      const { requestId, decision } = payload; // decision: 'approved' | 'rejected'

      const { data: req_record, error: fetchErr } = await supabase
        .from('data_access_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchErr || !req_record) {
        return new Response(JSON.stringify({ error: '요청을 찾을 수 없습니다' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (req_record.supplier_id !== user.id) {
        return new Response(JSON.stringify({ error: '권한이 없습니다' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (req_record.supplier_status !== 'pending') {
        return new Response(JSON.stringify({ error: '이미 처리된 요청입니다' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const updateData: Record<string, unknown> = {
        supplier_status: decision,
        supplier_responded_at: new Date().toISOString(),
      };

      if (decision === 'rejected') {
        updateData.final_status = 'rejected';
        updateData.completed_at = new Date().toISOString();
      } else if (decision === 'approved' && req_record.admin_status === 'not_required') {
        // 관리자 승인 불필요한 일반 거래 → 바로 완료
        updateData.final_status = 'approved';
        updateData.completed_at = new Date().toISOString();

        // 보상 지급: 공급자 잔액 증가
        await supabase.rpc('', {}).catch(() => {});
        const { data: profile } = await supabase
          .from('profiles')
          .select('vn_balance')
          .eq('id', req_record.supplier_id)
          .single();

        const newBalance = (profile?.vn_balance || 0) + req_record.offered_price;
        await supabase
          .from('profiles')
          .update({ vn_balance: newBalance })
          .eq('id', req_record.supplier_id);

        // 거래 기록
        await supabase.from('transactions').insert({
          user_id: req_record.supplier_id,
          type: 'data_sale',
          amount: req_record.offered_price,
          description: `데이터 판매 수익 (${(req_record.data_categories || []).join(', ')})`,
          reference_type: 'data_access_request',
          reference_id: req_record.id,
          status: 'completed',
        });
      }
      // 민감 데이터인 경우 admin_status가 'pending'이므로 관리자 승인 대기

      const { error: updateErr } = await supabase
        .from('data_access_requests')
        .update(updateData)
        .eq('id', requestId);

      if (updateErr) throw updateErr;

      // 기업에게 결과 알림
      const notifTitle = decision === 'approved' ? '✅ 데이터 요청 승인됨' : '❌ 데이터 요청 거절됨';
      const notifMsg = decision === 'approved'
        ? (req_record.admin_status !== 'not_required'
          ? '공급자가 승인했습니다. 관리자 2인 승인 절차가 진행 중입니다.'
          : '데이터 거래가 완료되었습니다!')
        : '공급자가 요청을 거절했습니다.';

      await supabase.from('notifications').insert({
        user_id: req_record.buyer_id,
        type: decision === 'approved' ? 'approval_completed' : 'approval_rejected',
        title: notifTitle,
        message: notifMsg,
        metadata: { request_id: requestId, decision }
      });

      return new Response(JSON.stringify({ success: true, decision }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── 3. 관리자 승인 (2인 승인) ───
    if (action === 'admin_approve') {
      const { requestId } = payload;

      // 관리자 역할 확인
      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: '관리자 권한이 필요합니다', code: 'ADMIN_REQUIRED' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: req_record, error: fetchErr } = await supabase
        .from('data_access_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchErr || !req_record) {
        return new Response(JSON.stringify({ error: '요청을 찾을 수 없습니다' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 공급자가 아직 미승인인 경우 차단
      if (req_record.supplier_status !== 'approved') {
        return new Response(JSON.stringify({ error: '공급자 승인이 먼저 필요합니다' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 본인이 요청자/공급자인 경우 차단
      if (req_record.buyer_id === user.id || req_record.supplier_id === user.id) {
        return new Response(JSON.stringify({ error: '이해관계자는 승인할 수 없습니다', code: 'CONFLICT_OF_INTEREST' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (req_record.admin_status === 'pending') {
        // 1차 승인
        const { error } = await supabase
          .from('data_access_requests')
          .update({
            admin_status: 'first_approved',
            first_admin_id: user.id,
            first_admin_approved_at: new Date().toISOString(),
          })
          .eq('id', requestId);

        if (error) throw error;

        // 감사 로그
        await supabase.from('withdrawal_audit_logs').insert({
          withdrawal_id: null,
          user_id: user.id,
          action: 'data_access_first_approval',
          details: { request_id: requestId, stage: '1차 승인' }
        });

        return new Response(JSON.stringify({ success: true, stage: 'first_approved', message: '1차 관리자 승인 완료' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } else if (req_record.admin_status === 'first_approved') {
        // 동일인 차단
        if (req_record.first_admin_id === user.id) {
          return new Response(JSON.stringify({
            error: '1차 승인자와 2차 승인자는 다른 관리자여야 합니다',
            code: 'SAME_APPROVER_BLOCKED'
          }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // 2차 승인 → 완료
        const { error } = await supabase
          .from('data_access_requests')
          .update({
            admin_status: 'completed',
            second_admin_id: user.id,
            second_admin_approved_at: new Date().toISOString(),
            final_status: 'approved',
            completed_at: new Date().toISOString(),
          })
          .eq('id', requestId);

        if (error) throw error;

        // 보상 지급
        const { data: profile } = await supabase
          .from('profiles')
          .select('vn_balance')
          .eq('id', req_record.supplier_id)
          .single();

        const newBalance = (profile?.vn_balance || 0) + req_record.offered_price;
        await supabase
          .from('profiles')
          .update({ vn_balance: newBalance })
          .eq('id', req_record.supplier_id);

        await supabase.from('transactions').insert({
          user_id: req_record.supplier_id,
          type: 'data_sale',
          amount: req_record.offered_price,
          description: `민감 데이터 판매 (관리자 2인 승인 완료)`,
          reference_type: 'data_access_request',
          reference_id: req_record.id,
          status: 'completed',
        });

        // 양측 알림
        await supabase.from('notifications').insert([
          {
            user_id: req_record.supplier_id,
            type: 'reward',
            title: '💰 데이터 판매 보상 지급!',
            message: `관리자 2인 승인이 완료되어 ${req_record.offered_price.toLocaleString()} VN이 지급되었습니다.`,
            metadata: { request_id: requestId, amount: req_record.offered_price }
          },
          {
            user_id: req_record.buyer_id,
            type: 'approval_completed',
            title: '✅ 데이터 접근 승인 완료',
            message: '관리자 2인 승인이 완료되어 데이터에 접근할 수 있습니다.',
            metadata: { request_id: requestId }
          }
        ]);

        // 감사 로그
        await supabase.from('withdrawal_audit_logs').insert({
          withdrawal_id: null,
          user_id: user.id,
          action: 'data_access_second_approval',
          details: {
            request_id: requestId,
            stage: '2차 승인 (최종)',
            first_admin: req_record.first_admin_id,
            second_admin: user.id,
          }
        });

        return new Response(JSON.stringify({ success: true, stage: 'completed', message: '2차 관리자 승인 완료. 거래가 처리되었습니다.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: '승인할 수 없는 상태입니다' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── 4. 관리자 거절 ───
    if (action === 'admin_reject') {
      const { requestId, reason } = payload;

      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: '관리자 권한이 필요합니다' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { error } = await supabase
        .from('data_access_requests')
        .update({
          admin_status: 'rejected',
          final_status: 'rejected',
          completed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // 알림 (양측)
      const { data: req_record } = await supabase
        .from('data_access_requests')
        .select('buyer_id, supplier_id')
        .eq('id', requestId)
        .single();

      if (req_record) {
        await supabase.from('notifications').insert([
          {
            user_id: req_record.supplier_id,
            type: 'approval_rejected',
            title: '❌ 관리자 승인 거절',
            message: `관리자가 데이터 접근 요청을 거절했습니다.${reason ? ` 사유: ${reason}` : ''}`,
            metadata: { request_id: requestId, reason }
          },
          {
            user_id: req_record.buyer_id,
            type: 'approval_rejected',
            title: '❌ 데이터 접근 요청 거절',
            message: `관리자 검토 결과 요청이 거절되었습니다.${reason ? ` 사유: ${reason}` : ''}`,
            metadata: { request_id: requestId, reason }
          }
        ]);
      }

      return new Response(JSON.stringify({ success: true, message: '요청이 거절되었습니다' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: '알 수 없는 action입니다' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('handle-data-access-request error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
