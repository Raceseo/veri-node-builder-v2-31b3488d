/**
 * 구간H — 딥링크 생존: /?surveyId=... 로 접속한 비로그인/신규가입 사용자가
 * 인증(로그인·회원가입·이메일확인) 왕복 후에도 원래 설문에 도달하도록,
 * surveyId 를 localStorage 에 잠깐 스태시했다가 인증 후 1회 복원한다.
 *
 * 원칙:
 *  - 저장: 앱 부트스트랩(main.tsx)에서 URL 에 surveyId 가 있으면 즉시.
 *  - 만료: 2시간 (읽는 시점에 검사).
 *  - 소비: 단일 사용. 읽는 즉시 삭제(설문 진입 실패해도 되살아나지 않게).
 *  - localStorage 접근/파싱 실패는 조용히 무시 — 앱 구동이 최우선(딥링크 복원 실패는 수용).
 */

const KEY = "verinode.pendingSurveyId";
// §10-2: Supabase Email OTP expiration(기본 3600초 = 1시간)과 정렬.
//   확인 메일 링크가 죽은 뒤에도 스태시만 살아 있으면, 사용자는 링크가 만료돼
//   로그인도 못 하는데 설문 딥링크만 남는 불일치 상태가 된다. 두 시한을 같게 둔다.
const TTL_MS = 1 * 60 * 60 * 1000; // 1시간

interface StashShape {
  surveyId: string;
  savedAt: number;
}

/** 부트스트랩 저장: 유효한 surveyId 만 저장. 실패 시 조용히 무시(조건2). */
export function stashPendingSurvey(surveyId: string | null | undefined): void {
  try {
    if (!surveyId) return;
    const payload: StashShape = { surveyId, savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // 시크릿 모드·저장소 차단 등 — 무시(딥링크 복원 포기, 앱은 정상 구동)
  }
}

/** 단일 사용 소비: 유효하면 삭제 후 surveyId 반환, 아니면 삭제/무시 후 null.
 *  - 만료(2h 초과) → 삭제 후 null (조건: 만료 로직은 읽는 시점에)
 *  - JSON 파싱 실패·형식 불일치 → 삭제 후 null (조건3)
 *  - localStorage 접근 실패 → null (조건2) */
export function consumePendingSurvey(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;

    let parsed: StashShape | null = null;
    try {
      parsed = JSON.parse(raw) as StashShape;
    } catch {
      // 손상·구버전 잔재 → 삭제하고 종료(조건3)
      clearPendingSurvey();
      return null;
    }

    // 소비는 단일 사용: 유효성과 무관하게 먼저 삭제한다(실패해도 재소생 방지)
    clearPendingSurvey();

    if (
      !parsed ||
      typeof parsed.surveyId !== "string" ||
      !parsed.surveyId ||
      typeof parsed.savedAt !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.savedAt > TTL_MS) {
      return null; // 만료
    }
    return parsed.surveyId;
  } catch {
    return null; // localStorage 접근 실패(조건2)
  }
}

/**
 * §10-2 엿보기: 스태시를 **삭제하지 않고** 읽는다. 유효하지 않으면 null.
 *
 * consumePendingSurvey() 는 1회용이라 읽는 즉시 삭제되므로,
 * "가입 메일의 redirect URL 을 만들 때"처럼 값이 이후에도 살아 있어야 하는 곳에서는
 * 반드시 이 함수를 쓴다. (consume 을 쓰면 온보딩 완료 시점의 복원이 깨진다)
 *
 * 만료·손상 값이어도 여기서는 삭제하지 않는다 — 정리는 consume 쪽 책임.
 */
export function peekPendingSurvey(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;

    let parsed: StashShape | null = null;
    try {
      parsed = JSON.parse(raw) as StashShape;
    } catch {
      return null; // 손상 값 — 삭제는 consume 에 맡긴다
    }

    if (
      !parsed ||
      typeof parsed.surveyId !== "string" ||
      !parsed.surveyId ||
      typeof parsed.savedAt !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.savedAt > TTL_MS) {
      return null; // 만료
    }
    return parsed.surveyId;
  } catch {
    return null; // localStorage 접근 실패(조건2)
  }
}

/**
 * §10-2 현재 살아있는 surveyId 해석: ① 현재 URL 의 ?surveyId= → ② 스태시(엿보기).
 * 둘 다 없으면 null. 어느 쪽도 소비/삭제하지 않는다.
 */
export function resolveActiveSurveyId(): string | null {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("surveyId");
    if (fromUrl) return fromUrl;
  } catch {
    // location 접근 실패 — 스태시로 폴백
  }
  return peekPendingSurvey();
}

/** 삭제: 실패 시 조용히 무시(조건2). */
export function clearPendingSurvey(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}
