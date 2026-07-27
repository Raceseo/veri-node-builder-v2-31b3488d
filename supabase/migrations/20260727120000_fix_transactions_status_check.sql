-- ============================================================================
-- 구간④ 보강 — transactions_status_check 교정 (서울 실물 전용 제약)
-- 대상: 서울 prod (okeeihfmagfogvuxzszb, ap-northeast-2)
-- 실행: MCP 접근 불가 → Ray 가 Supabase SQL Editor 에서 직접 실행
-- 작성: Claude Code (2026-07-27)
--
-- 배경 (문서 ≠ 실물):
--  · transactions.status 는 DEFAULT 'completed' (마이그레이션 20260113224540)인데,
--    서울 실DB 에만 존재하는 transactions_status_check 가 'pending/approved/rejected'
--    만 허용 → status 를 명시하지 않은(=default 'completed') insert 가 CHECK 위반(23514)로
--    거부됨. (로컬 마이그레이션에는 이 제약 정의 자체가 없음)
--  · 그 결과 claim-survey-reward 의 장부 insert 가 거부되어 "잔액만 오르고 장부 0행"
--    현상이 발생. 이 제약은 status:'completed' 를 쓰는 다른 함수(process-vn-charge,
--    verify-withdrawal-otp, match-and-distribute-rewards, portone-webhook,
--    handle-data-access-request 등)의 거래도 동일하게 깨뜨림.
--
-- 조치: default('completed') 및 실제 코드 사용값과 일치하도록 허용집합을 확장.
--       (출금 워크플로 값 pending/approved/rejected 도 유지)
-- ============================================================================

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_status_check
  CHECK (status = ANY (ARRAY[
    'completed', 'pending', 'processing', 'failed', 'cancelled', 'approved', 'rejected'
  ]));
