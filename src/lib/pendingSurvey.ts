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
const TTL_MS = 2 * 60 * 60 * 1000; // 2시간

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

/** 삭제: 실패 시 조용히 무시(조건2). */
export function clearPendingSurvey(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}
