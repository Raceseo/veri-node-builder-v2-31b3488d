-- ============================================================================
-- 구간④ 보강 — user_rewards UNIQUE(user_id) 복원 (서울 실물 광범위 버그 수정)
-- 대상: 서울 prod (okeeihfmagfogvuxzszb, ap-northeast-2)
-- 실행: MCP 접근 불가 → Ray 가 Supabase SQL Editor 에서 직접 실행 (2026-07-27 적용 완료)
-- 작성: Claude Code (2026-07-27)
--
-- 배경 (문서 ≠ 실물, 광범위 영향):
--  · transactions 에 insert 가 일어나면 sync_total_earned 트리거가 user_rewards 를
--    UPSERT 하는데 ON CONFLICT (user_id) 를 사용함.
--  · 그런데 서울 실물 user_rewards 에 UNIQUE(user_id) 제약이 없어, 해당 UPSERT 가
--    42P10 (no unique or exclusion constraint matching the ON CONFLICT specification)
--    으로 실패 → transactions insert 자체가 롤백됨.
--  · 영향 범위: 설문 보상(claim-survey-reward)뿐 아니라 충전·출금·데이터 판매 등
--    transactions 에 기록하는 모든 거래 함수가 동일하게 깨지고 있었음.
--  · UNIQUE(user_id) 를 추가해 트리거 UPSERT 가 정상 동작하도록 복원.
--
-- ⚠️ 이 파일은 기록용입니다. 실제 제약은 2026-07-27 SQL Editor 에서 이미 적용됨.
--    재실행 안전하도록 존재 여부 확인 후 추가.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'user_rewards_user_id_key'
       AND conrelid = 'public.user_rewards'::regclass
  ) THEN
    ALTER TABLE public.user_rewards ADD CONSTRAINT user_rewards_user_id_key UNIQUE (user_id);
  END IF;
END $$;
