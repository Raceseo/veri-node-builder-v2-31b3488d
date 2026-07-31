import { supabase } from "@/integrations/supabase/client";

/**
 * 구간J-1: 동의를 data_usage_consents 에 기록한다.
 * - 재시도 최대 2회(총 3시도). 최종 실패면 { ok: false } 반환.
 * - 호출부는 ok:false 면 "진행 차단"(기록 없는 데이터 수집을 막음 — J의 목적).
 * - user_agent: navigator.userAgent. ip_address: 클라이언트 취득 불가 → null.
 */
interface RecordConsentParams {
  consentType: string;
  consentVersion: string;
}

export async function recordConsent(
  { consentType, consentVersion }: RecordConsentParams,
): Promise<{ ok: boolean }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false };

    const row = {
      user_id: user.id,
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
    }
    return { ok: false };
  } catch (e) {
    console.error("동의 기록 오류:", e);
    return { ok: false };
  }
}
