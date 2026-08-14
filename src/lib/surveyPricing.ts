/**
 * 설문 견적 — 문항 수 구간 가격 로직.
 * ----------------------------------------------------------------------------
 * 견적 기준 v2 (Ray 확정 2026-08-14).
 * 가격은 단일 단가가 아니라 **문항 수의 함수**다.
 *  · 근거: 오픈서베이 공식 문항 구간 가격표(1차 자료, 2026-08-13 확보).
 *  · 종전 단일 단가 1,000원(2026-08-11 잠정)은 폐기됐다.
 *  · 31문항 이상은 접수 보류 — getUnitPrice/getRewardVn 이 null 을 반환한다.
 *
 * 🔴 가격 로직은 여기 한 곳에만 둔다 (Ray 조건 2026-08-15).
 *    다른 파일에서 800·300 같은 값을 다시 계산하지 말고 이 파일에서 import 할 것.
 *    값이 두 군데로 갈라지면 1,000원/800원 사고가 재발한다.
 *
 * 🔴 rewardVn(제공자 리워드)은 수요자 화면에 표시하지 않는다.
 *    단가와 나란히 뜨면 마진이 고객에게 그대로 노출된다.
 *    수요자가 볼 숫자는 "내가 내는 총액"뿐. getRewardVn 은 저장 단계에서만 쓴다.
 */
const PRICE_TIERS: { max: number; unitPrice: number; rewardVn: number }[] = [
  { max: 5,  unitPrice: 400,   rewardVn: 300 },
  { max: 10, unitPrice: 550,   rewardVn: 300 },
  { max: 15, unitPrice: 800,   rewardVn: 300 },  // ← 1호 설문 12문항
  { max: 20, unitPrice: 950,   rewardVn: 300 },
  { max: 25, unitPrice: 1100,  rewardVn: 400 },
  { max: 30, unitPrice: 1250,  rewardVn: 450 },
];

/**
 * 접수 가능한 최대 문항 수.
 * 구간표의 마지막 상한에서 **파생**한다 — 30 을 따로 적으면 구간표와 갈라진다.
 */
export const MAX_QUESTIONS = PRICE_TIERS[PRICE_TIERS.length - 1].max;

/** 문항 수 구간 단가(원/응답 1건). 범위 밖(0 이하·상한 초과)은 null. */
export const getUnitPrice = (questionCount: number): number | null =>
  PRICE_TIERS.find(t => questionCount >= 1 && questionCount <= t.max)?.unitPrice ?? null;

/** 문항 수 구간 제공자 리워드(VN). 범위 밖(0 이하·상한 초과)은 null. */
export const getRewardVn = (questionCount: number): number | null =>
  PRICE_TIERS.find(t => questionCount >= 1 && questionCount <= t.max)?.rewardVn ?? null;
