import { supabase } from "@/integrations/supabase/client";

/**
 * 구간J-1: 동의를 data_usage_consents 에 기록한다.
 * - 재시도 최대 2회(총 3시도), 지수 백오프(500ms → 1500ms). 최종 실패면 { ok: false } 반환.
 *   순간 통신 스톨(보통 1~2초)이면 대기 후 재시도가 넘어간다 — 즉시 연속 재시도는 셋 다 같은
 *   나쁜 구간에 걸려 무력했다(2026-08-19 실증: appleapdm 계정 저장 실패, 몇 초 뒤 수동 재시도 성공).
 * - 호출부는 ok:false 면 "진행 차단"(기록 없는 데이터 수집을 막음 — J의 목적).
 * - user_agent: navigator.userAgent. ip_address: 클라이언트 취득 불가 → null.
 * - user.id 는 getSession(로컬 캐시)로 얻는다. getUser(인증 서버 왕복) 불필요 — RLS 는 요청에
 *   자동 첨부되는 JWT 로 auth.uid() 를 판정하며, id 값은 세션에 이미 들어 있어 왕복이 실패 표면만 늘렸다.
 */
interface RecordConsentParams {
  consentType: string;
  consentVersion: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const RETRY_DELAYS_MS = [500, 1500]; // 1차 실패 후 500ms, 2차 실패 후 1500ms 대기(3차는 마지막)

export async function recordConsent(
  { consentType, consentVersion }: RecordConsentParams,
): Promise<{ ok: boolean }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { ok: false };

    const row = {
      user_id: session.user.id,
      consent_type: consentType,
      consent_version: consentVersion,
      is_agreed: true,
      agreed_at: new Date().toISOString(),
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      ip_address: null as string | null, // 클라이언트에서 공인 IP 취득 불가 → null (후속 Edge Function 여지)
    };

    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabase.from("data_usage_consents").insert(row);
      if (!error) return { ok: true };
      console.error(`동의 기록 실패(시도 ${attempt + 1}/3):`, error);
      if (attempt < RETRY_DELAYS_MS.length) await sleep(RETRY_DELAYS_MS[attempt]);
    }
    return { ok: false };
  } catch (e) {
    console.error("동의 기록 오류:", e);
    return { ok: false };
  }
}
