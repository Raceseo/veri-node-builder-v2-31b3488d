import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * claim-verification-reward
 * 본인 인증을 마친 사용자에게 100 VN 을 1회 적립하고 trust_score 를 +5 한다.
 *
 * 보안/정합성:
 *  - 요청자 uid 는 body 가 아니라 Authorization JWT 에서 추출(위조 방지)
 *  - 인증 확정 + 기록 + 잔액 + 장부는 Postgres RPC grant_verification_reward 로
 *    원자적 처리 → 하나라도 실패하면 전체 롤백(신뢰도·기록·잔액·장부는 한 몸)
 *  - 잔액 변경은 service_role 로만 수행.
 *    ⚠️ 서울 실물의 protect_vn_balance 트리거는 auth.jwt() ->> 'role' 이
 *       'authenticated' 인지를 검사한다(2026-08-05 실측, B-42). 따라서 RPC 호출
 *       클라이언트에는 **사용자 JWT 를 절대 전달하지 않는다** — 전달하면 role 이
 *       authenticated 로 남아 잔액 UPDATE 가 차단된다.
 *
 * 참조 구현: claim-survey-reward/index.ts
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

    // 1) 요청자 인증 — JWT 에서 uid 추출(위조 방지). 이 클라이언트는 uid 확보에만 쓴다.
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: '인증이 필요합니다' }, 401);
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await authClient.auth.getUser();
    if (userErr || !user) return json({ error: '유효하지 않은 세션입니다' }, 401);
    const uid = user.id;

    // 2) 원자적 적립 — 인증 확정 + 기록 + 잔액 + 장부를 한 트랜잭션(RPC)에서 처리.
    //    ⚠️ Authorization 헤더를 넘기지 않는다(위 주석 참조).
    const admin = createClient(supabaseUrl, serviceKey);
    const { data, error } = await admin.rpc('grant_verification_reward', {
      p_user_id: uid,
    });

    // RPC 자체 예외(장부 insert 실패 등) → 전체 롤백됨. 원인을 detail 로 노출.
    if (error) {
      console.error('grant_verification_reward RPC error:', error);
      return json({ error: '보상 적립 처리 실패', detail: error.message }, 500);
    }

    // 업무 규칙 위반(코드로 구분)
    if (!data?.ok) {
      const code = data?.code as string | undefined;
      // 이미 인증됐거나 이미 적립된 경우는 실패가 아니라 "이미 완료" →
      // 200 으로 반환해 프론트가 완료 화면으로 정상 진행하게 한다.
      if (code === 'already_claimed' || code === 'already_verified') {
        return json({ already_claimed: true, code }, 200);
      }
      const map: Record<string, [string, number]> = {
        profile_not_found: ['프로필을 찾을 수 없습니다', 404],
      };
      const [msg, status] = map[code ?? ''] ?? ['보상 적립 실패', 400];
      return json({ error: msg, code }, status);
    }

    return json({
      success: true,
      reward_vn: data.reward_vn,
      new_balance: data.new_balance,
      score_change: data.score_change,
      new_trust_score: data.new_trust_score,
    });
  } catch (e) {
    console.error('claim-verification-reward error:', e);
    return json({ error: e instanceof Error ? e.message : '서버 오류' }, 500);
  }
});
