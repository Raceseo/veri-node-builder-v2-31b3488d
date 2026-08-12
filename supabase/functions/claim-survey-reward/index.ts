import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * claim-survey-reward
 * 설문 응답 완료 사용자에게 surveys.reward_vn 만큼 VN 을 1회 적립한다.
 * 보안/정합성:
 *  - 요청자 uid 는 body 가 아니라 Authorization JWT 에서 추출(위조 방지)
 *  - 적립(claim + 잔액 + 장부)은 Postgres RPC grant_survey_reward 로 원자적 처리
 *    → 장부 insert 가 실패하면 잔액/claim 도 전체 롤백(잔액과 장부는 한 몸)
 *  - 잔액 변경은 service_role(BYPASSRLS + protect_vn_balance 통과)로만 수행
 */
serve(async (req) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // 1) 요청자 인증 — JWT 에서 uid 추출(위조 방지)
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: '인증이 필요합니다' }, 401);
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await authClient.auth.getUser();
    if (userErr || !user) return json({ error: '유효하지 않은 세션입니다' }, 401);
    const uid = user.id;

    const { surveyId } = await req.json().catch(() => ({ surveyId: null }));
    if (!surveyId) return json({ error: 'surveyId 가 필요합니다' }, 400);

    // 2) 원자적 적립 — claim + 잔액 + 장부를 한 트랜잭션(RPC)에서 처리
    const admin = createClient(supabaseUrl, serviceKey);
    const { data, error } = await admin.rpc('grant_survey_reward', {
      p_survey_id: surveyId,
      p_user_id: uid,
    });

    // RPC 자체 예외(장부 insert 실패 등) → 전체 롤백됨. 원인을 detail 로 노출.
    if (error) {
      console.error('grant_survey_reward RPC error:', error);
      return json({ error: '보상 적립 처리 실패', detail: error.message }, 500);
    }

    // 업무 규칙 위반(코드로 구분)
    if (!data?.ok) {
      const code = data?.code as string | undefined;
      // 중복은 실패가 아니라 "이미 완료" → 200 으로 반환해 프론트가 정상 분기하게 함
      if (code === 'already_claimed') return json({ already_claimed: true }, 200);
      const map: Record<string, [string, number]> = {
        survey_not_found:   ['설문을 찾을 수 없습니다', 404],
        survey_not_active:  ['진행 중인 설문이 아닙니다', 400],
        no_reward:          ['보상이 설정되지 않은 설문입니다', 400],
        no_response:        ['먼저 설문에 응답해야 합니다', 400],
        incomplete_survey:  ['모든 문항에 응답해야 보상이 지급됩니다', 400],
        too_fast:           ['응답이 너무 빨라요. 문항을 충분히 읽고 다시 응답해 주세요', 400],
      };
      const [msg, status] = map[code ?? ''] ?? ['보상 적립 실패', 400];
      return json({ error: msg, code }, status);
    }

    return json({ success: true, reward_vn: data.reward_vn, new_balance: data.new_balance });
  } catch (e) {
    console.error('claim-survey-reward error:', e);
    return json({ error: e instanceof Error ? e.message : '서버 오류' }, 500);
  }
});
