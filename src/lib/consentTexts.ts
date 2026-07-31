/**
 * 구간J-1: 동의 문안·버전 단일 출처.
 * - version 문자열이 곧 data_usage_consents.consent_version 에 저장되는 값.
 * - 문안이 바뀌면 반드시 version 을 올린다(그래야 "무엇에 동의했는지" 추적 가능).
 * - 화면은 이 상수를 렌더하고, 기록은 이 version 을 저장한다 → 표시=기록 일치.
 */

export const ONBOARDING_PLEDGE = {
  consentType: "onboarding_pledge",
  version: "onboarding_pledge/2026-07-31.v1",
  items: [
    { key: "ownership", title: "데이터 소유권 인지", description: "본인이 제공하는 모든 데이터의 소유권은 본인에게 있으며, VeriNode는 본인의 명시적 동의 하에서만 이를 관리한다는 것을 이해합니다." },
    { key: "honesty", title: "정직한 데이터 공급", description: "모든 설문 응답과 제공 데이터는 진실에 기반하여 작성하겠습니다." },
    { key: "accuracy", title: "정확한 정보 제공", description: "AI 검증을 위한 프로필 정보를 정확하게 입력하겠습니다." },
    { key: "responsibility", title: "책임 있는 참여", description: "허위 응답이나 조작된 데이터 제공 시 발생하는 불이익을 수용합니다." },
  ],
} as const;

export const SURVEY_ETHICS = {
  consentType: "survey_ethics",
  version: "survey_ethics/2026-07-31.v1",
  items: [
    "모든 응답은 본인의 실제 경험에 기반합니다",
    "거짓 정보를 제공하지 않겠습니다",
    "AI 또는 타인의 답변을 복사하지 않겠습니다",
    "서약 위반 시 보상 회수에 동의합니다",
  ],
} as const;

/**
 * J-1-b(가입 개인정보 수집·이용 동의)용 고지 문안 — 후보2(항목형) + 동의 거부 시 불이익.
 * ※ 이 상수는 J-1-b(Auth.tsx)에서 사용 예정. J-1에서는 정의만 해두고 아직 화면에 안 붙임.
 * ※ 수집 항목은 코드에서 실제 저장되는 것만 나열(이메일·이름·설문응답·소요시간·타이핑속도).
 * ※ 보유 기간: 정책 미확정 → 지어내지 않고 비워둠. Ray 확정 + 전문가 확인 후 추가.
 */
export const DATA_USAGE_NOTICE = {
  consentType: "data_usage",
  version: "data_usage/2026-07-31.v1",
  collected: ["이메일", "이름(표시 이름)", "설문 응답 내용", "응답 소요시간·타이핑 속도(성실 응답 확인용)"],
  purpose: ["설문 데이터 제공", "보상(VN) 지급"],
  notCollected: ["금융정보", "위치정보", "IP 주소"],
  refusalConsequence: "동의하지 않으면 설문에 참여할 수 없습니다.",
  // retentionPeriod: (미확정 — Ray 확정 + 전문가 확인 후 추가)
} as const;
