-- ============================================================================
-- B-39 1단계 — 관리자 판별 체계 신설 (app_role / user_roles / has_role / is_admin)
-- 대상: 서울 prod (okeeihfmagfogvuxzszb, ap-northeast-2)
-- 실행: MCP 접근 불가 → Ray 가 Supabase SQL Editor 에서 직접 실행
-- 작성: Claude Code (2026-08-06)
--
-- 배경 (2026-08-06 실측):
--   select to_regclass('public.user_roles') → NULL
--   select to_regtype('public.app_role')    → NULL
--   select … from pg_proc where proname='has_role' → 0행
--   → 셋 다 서울 실물에 없다. "고장 수리"가 아니라 **신설**이다.
--   → 관리자 판별이 존재하지 않으므로 approve-withdrawal 등이 fail-closed 로
--      전원 차단 상태였다(유출 방향 아님, 기능 불능 방향). 최초 발견 2026-07-31,
--      백로그 미등록으로 유실됐다가 2026-08-06 재발견.
--
-- Ray 결정 (2026-08-06):
--   1. 첫 admin 은 Ray 계정 1개만. 2인 승인 로직은 출시 전까지 보류.
--      구조는 여러 admin 을 수용하되 활성화만 나중에 → UNIQUE(user_id, role) 유지.
--   2. user_roles RLS 는 **클라이언트 SELECT 포함 전부 차단.** 역할 부여·조회는
--      service_role / SQL Editor 만.
--   3. 결정 2 로 프런트가 자기 admin 여부조차 못 읽으므로 is_admin() 을 추가한다.
--
-- 보안 규칙(CLAUDE.md) 준수:
--   #1 새 테이블은 같은 마이그레이션에서 RLS 활성화 → 아래 §2 참조(정책 0개 = 전면 차단)
--   #2 USING(true)/WITH CHECK(true) 없음
--   #3 SECURITY DEFINER 함수는 REVOKE 후 필요한 역할에만 GRANT
--   #6 관리자 2인 승인 로직을 제거·우회하지 않는다 — 정책 원문 그대로 재적용
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- §1. app_role ENUM
--     CREATE TYPE 에는 IF NOT EXISTS 가 없어 DO 블록으로 감싼다.
--     값 집합은 기존 마이그레이션(20260106082812) 정의를 그대로 따른다.
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF to_regtype('public.app_role') IS NULL THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- §2. user_roles 테이블
--     UNIQUE(user_id, role) — 한 사용자가 같은 역할을 중복으로 갖지 않는다.
--     여러 admin 을 수용하는 구조다(Ray 결정 1: 구조는 열어두고 활성화만 보류).
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

COMMENT ON TABLE public.user_roles IS
  '관리자·역할 부여 기록. RLS 정책 0개 = 클라이언트 전면 차단(Ray 결정 2). '
  '역할 부여·조회는 service_role 또는 SQL Editor 로만. '
  '프런트는 자기 admin 여부만 public.is_admin() 으로 확인한다.';

-- 🔒 RLS 활성화. **정책을 하나도 만들지 않는다.**
--    Postgres 에서 RLS 가 켜진 테이블에 매칭되는 정책이 없으면 전부 거부된다.
--    → anon·authenticated 는 SELECT 조차 불가 (Ray 결정 2).
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 🔴 **ENABLE 만 쓴다. FORCE ROW LEVEL SECURITY 를 걸지 않는다.** (Ray 확인 2026-08-06)
--    ENABLE 은 테이블 소유자(postgres)를 RLS 대상에서 제외하고, FORCE 는 소유자까지 포함시킨다.
--    FORCE + 정책 0개였다면:
--      ① 3단계의 첫 admin INSERT 가 SQL Editor(postgres)에서 막혀 절차 자체가 불능
--      ② §3·§4 의 SECURITY DEFINER 함수가 소유자 권한으로 실행돼도 차단 → 영구 false
--         → 관리자 판별이 항상 거짓 → 이 공사 전체가 무력화
--      ③ 보안 이득도 없다 — anon·authenticated 는 정책 0개로 이미 전부 차단이고,
--         postgres 가 탈취된 시나리오라면 FORCE 자체를 풀 수 있어 방어가 성립하지 않는다
--    → 따라서 ENABLE 만이 맞다. (§6 검증 ⓒ 에서 force_rls = false 를 확인한다)

-- ⚠️ 보안 규칙 #1 은 "RLS 활성화 + 정책 포함"을 요구한다. 여기서는 정책을 0개로 둔다.
--    규칙의 취지가 "보호되지 않는 테이블 금지"인데, 정책 0개는 **최대 보호**(전면 거부)다.
--    Ray 결정 2 가 명시적으로 클라이언트 SELECT 까지 차단하도록 정한 결과다.

-- 📌 **3단계(첫 admin INSERT)가 ENABLE 상태에서 동작하는 근거**:
--    Ray 가 SQL Editor 에서 실행하면 role 은 postgres = 이 테이블의 소유자다.
--    ENABLE 은 소유자에게 RLS 를 적용하지 않으므로, 정책이 0개여도 INSERT 가 통과한다.


-- ────────────────────────────────────────────────────────────────────────────
-- §3. has_role(uuid, app_role) — RLS·서버 전용
--
--     📌 **ENABLE 상태에서 동작하는 근거**: SECURITY DEFINER 라 소유자(postgres)
--        권한으로 실행되고, ENABLE 은 소유자를 RLS 대상에서 제외한다(§2 참조).
--        따라서 user_roles 에 정책이 0개여도 이 함수는 읽을 수 있다.
--        ※ FORCE 였다면 소유자도 차단돼 항상 false 를 반환했을 것이다.
--
--     재귀도 없다: user_roles 에 정책을 만들지 않았으므로 "정책이 has_role 을 부르고
--     has_role 이 그 정책을 다시 트리거하는" 고리 자체가 성립하지 않는다.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role    = _role
  )
$$;

-- 보안 규칙 #3: 프런트 직접 호출 차단. RLS 정책 평가와 service_role 만 사용한다.
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;

COMMENT ON FUNCTION public.has_role(UUID, public.app_role) IS
  'RLS 정책·서버 전용 역할 확인. 프런트는 호출 불가 — 자기 확인은 is_admin() 사용.';


-- ────────────────────────────────────────────────────────────────────────────
-- §4. is_admin() — 프런트용, 인자 없음
--
--     Ray 결정 3: 결정 2로 프런트가 user_roles 를 못 읽으니 자기 admin 여부를
--     확인할 경로가 필요하다. 인자가 없어 **호출자 자신(auth.uid())만** 판정한다.
--     → 남의 역할을 캐낼 수 없으므로 authenticated 에 GRANT 해도 안전하다.
--     → 비로그인(auth.uid() IS NULL)이면 false.
--
--     📌 **ENABLE 상태에서 동작하는 근거**: §3 과 동일하다. SECURITY DEFINER 로
--        소유자 권한 실행 → ENABLE 은 소유자를 RLS 에서 제외 → 정책 0개여도 읽는다.
--        호출자는 authenticated 지만 함수 본문은 소유자 권한으로 돌기 때문에,
--        "프런트는 테이블을 못 읽지만 이 함수로는 자기 여부만 알 수 있다"가 성립한다.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role    = 'admin'
  )
$$;

-- 보안 규칙 #3: 일단 전부 회수한 뒤 authenticated 에만 부여한다.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

COMMENT ON FUNCTION public.is_admin() IS
  '호출자 자신의 admin 여부만 반환. 인자가 없어 타인 역할 조회 불가 → 프런트 호출 허용.';


-- ────────────────────────────────────────────────────────────────────────────
-- §5. 기존 RLS 정책 재적용 (4개)
--
--     ⚠️ 대상 테이블이 서울 실물에 있는지 미확인이다. 마이그레이션
--        20260216073308(submissions·approval_workflow)·20260304080702
--        (data_access_requests)이 서울에 적용된 적 없을 수 있다
--        (20260114084151 이 그랬던 전례가 있다 — v8 §4).
--     → 테이블이 없으면 조용히 건너뛰도록 to_regclass 로 감싼다.
--        건너뛴 항목은 §6 검증 쿼리에서 드러난다.
--
--     정책 본문은 원문 그대로다. 보안 규칙 #6 — 2인 승인 로직을 바꾸지 않는다.
--     (특히 approval_workflow 의 자기승인 방지 `auth.uid() != requester_id`)
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- ① submissions — 본인 또는 관리자 조회
  IF to_regclass('public.submissions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Owner or admin can view submissions" ON public.submissions;
    CREATE POLICY "Owner or admin can view submissions"
      ON public.submissions FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
  END IF;

  -- ②③ approval_workflow — 2인 승인 대상. 원문 그대로.
  IF to_regclass('public.approval_workflow') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Requester or approvers or admin can view workflows" ON public.approval_workflow;
    CREATE POLICY "Requester or approvers or admin can view workflows"
      ON public.approval_workflow FOR SELECT
      TO authenticated
      USING (
        auth.uid() = requester_id
        OR auth.uid() = first_approver_id
        OR auth.uid() = second_approver_id
        OR public.has_role(auth.uid(), 'admin')
      );

    DROP POLICY IF EXISTS "Admin can update workflow except self-approval" ON public.approval_workflow;
    CREATE POLICY "Admin can update workflow except self-approval"
      ON public.approval_workflow FOR UPDATE
      TO authenticated
      USING (
        public.has_role(auth.uid(), 'admin')
        AND auth.uid() != requester_id
      );
  END IF;

  -- ④⑤ data_access_requests
  IF to_regclass('public.data_access_requests') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admins can approve requests" ON public.data_access_requests;
    CREATE POLICY "Admins can approve requests"
      ON public.data_access_requests FOR UPDATE
      USING (public.has_role(auth.uid(), 'admin') AND admin_status IN ('pending', 'first_approved'));

    DROP POLICY IF EXISTS "Admins can view all requests" ON public.data_access_requests;
    CREATE POLICY "Admins can view all requests"
      ON public.data_access_requests FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END
$$;


-- ============================================================================
-- §6. 검증 쿼리 — 적용 직후 이것만 따로 실행해 결과를 확인할 것 (2단계)
-- ============================================================================
-- -- ⓐ 타입·테이블·함수가 생겼나
-- select to_regtype('public.app_role')     as app_role_enum,      -- app_role
--        to_regclass('public.user_roles')  as user_roles_table;   -- user_roles
--
-- select p.proname,
--        pg_get_function_identity_arguments(p.oid) as args,
--        p.prosecdef  as security_definer,
--        p.provolatile as volatility        -- 's' = STABLE
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname='public' and p.proname in ('has_role','is_admin')
--  order by p.proname;
--
-- -- ⓑ 권한이 의도대로인가 (has_role: service_role 만 / is_admin: +authenticated)
-- select p.proname, a.grantee, a.privilege_type
--   from pg_proc p
--   join pg_namespace n on n.oid = p.pronamespace
--   join information_schema.routine_privileges a
--     on a.routine_name = p.proname and a.routine_schema = n.nspname
--  where n.nspname='public' and p.proname in ('has_role','is_admin')
--  order by p.proname, a.grantee;
--
-- -- ⓒ user_roles 는 RLS 켜짐 + 정책 0개 + **force_rls = false** 여야 한다
-- --    🔴 force_rls 가 true 로 나오면 3단계 admin INSERT 와 함수가 전부 막힌다.
-- select relname, relrowsecurity as rls_enabled, relforcerowsecurity as force_rls
--   from pg_class where oid = 'public.user_roles'::regclass;
-- select count(*) as policy_count_should_be_0
--   from pg_policies where schemaname='public' and tablename='user_roles';
--
-- -- ⓓ 재적용된 정책 (건너뛴 테이블이 있으면 여기서 빠져 보인다)
-- select tablename, policyname, cmd
--   from pg_policies
--  where schemaname='public'
--    and (qual like '%has_role%' or with_check like '%has_role%')
--  order by tablename, policyname;
--
-- -- ⓔ 대상 테이블 실재 여부 (§5 에서 건너뛴 것이 있는지 확인)
-- select to_regclass('public.submissions')          as submissions,
--        to_regclass('public.approval_workflow')    as approval_workflow,
--        to_regclass('public.data_access_requests') as data_access_requests;
--
-- -- ⓕ 아직 admin 은 0명이어야 한다 (3단계에서 심는다)
-- select count(*) as admin_count_should_be_0
--   from public.user_roles where role = 'admin';
-- ============================================================================
