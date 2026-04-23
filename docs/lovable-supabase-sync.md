# Lovable ↔ GitHub ↔ Supabase 연동 가이드

> 왜 이 문서가 있나요? 2026-04-22~23 세션에서 "신규 회원이 온보딩을 완료할 수 없다"는 prod 버그를 추적하는 과정에서, **Lovable이 UI로 만든 DB 변경이 GitHub repo에 제대로 commit되지 않는 상태**가 드러났습니다. 이 문서는 그 원인과 재발 방지 방법을 정리합니다.

## 1) 문제의 구조

Verinode는 3개 주체가 얽혀 움직입니다:

```
  Lovable (AI 빌더)        GitHub repo            Supabase (DB)
       │                         │                     │
       │  코드 commit (OK)       │                     │
       │────────────────────────▶│                     │
       │                         │                     │
       │  SQL 마이그레이션 파일  │                     │
       │  (자주 누락!) ❌        │                     │
       │────────────────────────X│                     │
       │                         │                     │
       │  DDL 직접 실행 (OK)     │                     │
       │─────────────────────────┼────────────────────▶│
       │                         │                     │
                                 │                     │
                                 │  supabase db push   │
                                 │  (파일 기반)        │
                                 │────────────────────▶│
                                 │                     │
                                 │  supabase_migrations.
                                 │  schema_migrations  │
                                 │  ↕ 비교            │
```

**결과**: repo의 `supabase/migrations/` 폴더와 prod DB의 `schema_migrations` 테이블이 서로 다른 길을 걷습니다.

## 2) 이번 세션에서 확인한 실제 drift

### Remote에만 있고 로컬 파일로 없던 것 (8개)
Lovable이 UI에서 만들고 DB에는 적용했지만 repo에 commit 안 한 것들:

| Version | 내용 |
|---|---|
| 20260307064741 | `notifications` 테이블 + RLS + 트리거 |
| 20260307064756 | notifications INSERT 정책 수정 |
| 20260307065629 | transactions 제약·balance 동기화·RLS 최적화 |
| 20260307065641 | portfolio_assemblies RLS 재활성화 |
| 20260307065653 | FK 인덱스·RLS 최종 최적화 |
| 20260421221437 | profiles.identity_verified·verified_* 컬럼 |
| 20260421230304 | profiles.ci_hash UNIQUE INDEX |
| 20260422221437 | (Claude Code가 이 세션에서 MCP로 적용한 PR #2) |

→ 현재 이 PR(`fix/lovable-repo-migration-sync`)에서 각각을 로컬 파일로 복원했습니다. `supabase/migrations/`에 8개 `.sql` 파일 추가.

### 로컬 파일은 있는데 remote `schema_migrations`에 기록 없음 (36개)

이 36개는 2026년 초부터 Lovable이 만든 파일들인데, Lovable이 해당 DDL을 **실제로 DB에 apply했는지는 불명확**합니다. 일부(예: `20260113214216` 가격 시스템, `20260304080702` data_access_requests)는 DB에 존재하지 않음 — **apply 안 됨** 확인.

이 36개를 어떻게 처리할지는 이 PR의 범위 밖입니다. 아래 "다음 단계"를 보세요.

## 3) 재발 방지 — Lovable Dashboard 설정 점검

Lovable에는 repo에 commit하는 자동화가 있는데, DDL/Supabase 변경에 한해 일부 케이스에서 commit이 누락되는 것으로 보입니다. 사용자가 확인할 것:

### 단계 A. Lovable 프로젝트 설정 접근

1. https://lovable.dev/ 로그인
2. 본인 verinode 프로젝트 열기
3. 우측 상단 설정(⚙️) 또는 왼쪽 사이드바에서 **Settings** 진입

### 단계 B. GitHub 연동 상태 확인

- **GitHub Integration** 섹션:
  - repo가 `Raceseo/veri-node-builder-v2-31b3488d`로 연결돼 있는지
  - 브랜치가 `main`으로 설정돼 있는지
  - **"Auto-commit to repo"** 또는 **"Sync migrations"** 같은 토글이 있다면 **ON** 확인

### 단계 C. Supabase 연동 상태 확인

- **Supabase Integration** 섹션:
  - Project가 `erkmtsgrbsjdudiofuxw (Verinode)` 로 연결돼 있는지
  - **"Commit migrations to repo"** 또는 유사 토글 찾아서 ON
  - 없다면 Lovable이 원래 migrations commit을 제공하지 않는 것 — 이 경우 **단계 D**

### 단계 D. Lovable이 자동화 못 해주는 경우 대응

만약 Lovable Dashboard에 "migrations commit" 옵션 자체가 없으면, **수동 프로세스**를 만들어야 합니다:

1. **Lovable UI로 DB 스키마 변경 시**: 바로 Supabase Dashboard → SQL Editor에서 그 SQL을 확인 후, 동일 내용을 `supabase/migrations/<타임스탬프>_<설명>.sql` 파일로 repo에 commit
2. **또는** 주기적으로 `npx supabase db pull` 실행해 remote 기준으로 파일 sync
3. **이 PR에 추가된 `scripts/sync-from-lovable.sh` (있다면)** 스크립트 활용

> 현재 Lovable이 단계 B·C의 옵션을 실제로 제공하는지 Claude Code에서 확인 불가 — 사용자가 Dashboard 직접 확인 필요.

## 4) 남은 과제 (이번 세션 이후)

- [ ] Lovable Dashboard 설정 점검 결과 공유 (위 단계 A~D)
- [ ] `schema_migrations`에 로컬 36개 `--status applied`로 기록할지 판단
  - 문제: 일부는 실제 DB에 apply 안 됨 → `applied` 로 기록하면 "거짓 상태"
  - 안전한 방법: MCP로 각 마이그레이션의 핵심 테이블·컬럼 존재 여부 개별 체크 후, 실제 apply된 것만 `applied`, 나머지는 이 PR처럼 idempotent 재적용
- [ ] `has_role(uuid, text)` 함수 정의 (현재 prod에 없음 — `data_access_requests` 마이그레이션 apply 시 필요)
- [ ] Dashboard 내 기능 복원 (data_listings·data_sale_records 등) — **수요 검증 결과 후 진행 권장**

## 5) 빠르게 참고할 명령

```bash
# 현재 로컬 ↔ remote 불일치 확인
npx supabase db pull --dry-run   # remote에만 있는 것 나열
git diff supabase/migrations/    # 로컬 새로 추가된 것 나열

# 이 PR 내용을 prod에 반영 (이미 remote에 있는 것들이니 대부분 no-op)
npx supabase db push

# 또는 강제 sync (주의: 로컬 파일과 remote state 덮어씀)
npx supabase migration repair --status applied <version>
```

## 참고 링크

- Supabase CLI migration 문서: https://supabase.com/docs/reference/cli/supabase-migration
- `supabase db pull` vs `push` 차이: https://supabase.com/docs/guides/deployment/managing-environments
- Lovable GitHub 연동 공식 문서: (사용자 확인 필요)
