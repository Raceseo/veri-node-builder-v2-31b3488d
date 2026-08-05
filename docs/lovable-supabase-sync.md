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

→ PR #5(`fix/lovable-repo-migration-sync`)에서 각각을 로컬 파일로 복원했습니다.

### 로컬 파일은 있는데 remote `schema_migrations`에 기록 없음 (36개)

이 36개는 2026년 초부터 Lovable이 만든 파일들인데, Lovable이 해당 DDL을 **실제로 DB에 apply했는지는 불명확**합니다. 일부(예: `20260113214216` 가격 시스템, `20260304080702` data_access_requests)는 DB에 존재하지 않음 — **apply 안 됨** 확인.

이 36개는 수요 검증 이후 필요한 것만 개별 apply 권장 (아래 "재진입 체크리스트" 참조).

## 3) Lovable Dashboard 점검 결과 (2026-04-23 확인 완료)

### ✅ GitHub 연동: 정상
- **경로**: 에디터 → 점 세 개(⋯) 메뉴 → GitHub 박스 → "Configure"
- 상태: `Raceseo/veri-node-builder-v2-31b3488d` / branch `main` / **Connected**
- 발견: repo에 push는 정상 작동. 단 DB 마이그레이션 SQL은 push 대상에서 누락됨.

### ✅ Supabase 연동: 정상 (단, 자동화 토글 없음)
- **경로**: 에디터 → 점 세 개(⋯) 메뉴 → **Cloud** → Supabase 패널
- 상태: `Enabled` / `Raceseo's Org` 소속 `erkmtsgrbsjdudiofuxw (Verinode)` 프로젝트 연결됨

> 📌 2026-08-05 기준 실물은 VeriNode Org의 okeeihfmagfogvuxzszb(서울)다. 위는 이전 전 기록.

- **"Linked Supabase organizations"** 모달에서 확인:
  - Raceseo's Org → 버튼 없음 = 정상 연결
  - INTYCO HOMPAGE DB → "Reconnect" 버튼 있지만 이 조직은 옛 홈페이지 프로젝트 (이미 다른 Supabase로 이전 완료) → verinode와 무관, 방치해도 무방
- **결정적 발견**: 이 Supabase 통합 화면에 **"Auto-commit migrations to repo" 토글이 존재하지 않음**.

### 🔴 결론

**Lovable 자체가 DB 마이그레이션 파일을 repo에 auto-commit하는 기능을 제공하지 않습니다.** 드리프트는 "설정 실수"가 아니라 "Lovable이 원래 그렇게 만들어져 있어서" 발생합니다. 앞으로는 **수동 프로세스**로 대응할 수밖에 없습니다. 아래 치트시트가 그 정답.

## 4) 수동 워크플로우 치트시트

### 🧰 도구 셋업 (최초 한 번)

```bash
# Supabase CLI 없으면 npx로 쓰거나 설치:
npm install -g supabase     # 또는 brew install supabase/tap/supabase (macOS)

# 프로젝트 링크 (D:\app_develop\verinode 에서)
cd D:\app_develop\verinode
npx supabase link --project-ref okeeihfmagfogvuxzszb
# (중간에 Database password 물어보면: Supabase Dashboard → Settings → Database)
```

링크는 프로젝트 폴더 안의 `supabase/.temp/`에 저장돼 있으니 한 번만 하면 됩니다.

### 🟢 패턴 A — Lovable UI로 DB 스키마 변경한 직후

Lovable 채팅에서 "auth에 컬럼 추가해줘", "새 테이블 만들어줘" 등 DDL 변경 요청 후:

```bash
cd D:\app_develop\verinode
git pull                          # Lovable이 코드 파일 commit한 것 먼저 받기
npx supabase db pull              # DB 변경 스냅샷을 supabase/migrations/에 파일로 저장
git status                        # 새 파일(<timestamp>_remote_schema.sql) 생성됐는지 확인
git add supabase/migrations/
git commit -m "chore(db): sync Lovable migration (<무엇을 바꿨는지>)"
git push
```

**핵심**: Lovable이 DB 건드릴 때마다 `supabase db pull` 한 번 돌려서 파일로 남겨야 앞으로 관리 가능. 귀찮으면 일주일에 한 번 몰아서 해도 됩니다 (대신 어떤 commit이 어떤 변경인지 추적이 어려워짐).

### 🟢 패턴 B — Claude Code가 마이그레이션 PR 만들었을 때

```bash
# (PR 머지 완료 후)
cd D:\app_develop\verinode
git pull                          # 새 마이그레이션 파일 받기
npx supabase db push              # DB에 적용
```

두 번째 단계를 빼먹으면 파일만 있고 DB엔 없는 상태가 됩니다 (drift).

### 🟢 패턴 C — 정합성 점검 (월 1회 권장)

```bash
cd D:\app_develop\verinode
git pull
npx supabase db pull --dry-run    # remote에만 있는 것 있는지 표시
npx supabase db push --dry-run    # 로컬에만 있는 것 있는지 표시
```

dry-run이라 실제 변경은 없고 리포트만. 둘 다 "no changes"면 정합 상태.

### ⚠️ 패턴 D — drift 발견 시 복구 (이번 세션과 같은 상황)

```bash
# remote-only 마이그레이션을 로컬 파일로 가져오고 싶을 때
npx supabase db pull
# → supabase/migrations/<timestamp>_remote_schema.sql 생성됨

# 또는 MCP로 직접 schema_migrations 테이블 조회해 SQL 원본 확보 (정확함)
# (PR #5에서 사용한 방법)
```

`supabase migration repair`는 **마지막 수단**. state만 덮어쓰고 실제 schema는 안 건드리므로 "거짓 정합" 만들기 쉬움 → 가급적 피하기.

## 5) 재진입 체크리스트 (수요 검증 Go 판정 후)

PR #4의 수요 검증 설문에서 **Go 신호** 나오면 다시 verinode 개발 재개. 재개 시 해야 할 것들:

- [ ] 최근 Lovable 변경분 반영: `git pull` + `npx supabase db pull`
- [ ] remote-only 마이그레이션 있으면 PR #5 방식으로 로컬 파일 복원
- [ ] 로컬 36개 파일 중 실제 apply 안 된 것 식별 (MCP로 핵심 테이블 존재 여부 체크):
  - `data_access_requests`, `data_listings`, `data_sale_records` 등 Dashboard 용
  - `has_role(uuid, text)` 함수 (data_access_requests RLS 필수)
- [ ] 필요한 것만 idempotent catch-up SQL로 묶어 apply (PR #2 방식)
- [ ] Auth.tsx에 "사전 신청" CTA 추가 (Google Form 링크 확보 후)

## 6) 참고 링크

- Supabase CLI migration 문서: https://supabase.com/docs/reference/cli/supabase-migration
- `supabase db pull` vs `push` 차이: https://supabase.com/docs/guides/deployment/managing-environments
- Lovable Supabase integration 문서: https://docs.lovable.dev/integrations/supabase

## 7) 이 문서의 TL;DR

1. Lovable은 DB 변경을 자동으로 repo에 commit해주지 않습니다. 확인됨.
2. 그러니 Lovable로 DB 건드릴 때마다 `npx supabase db pull` → commit이 사용자분의 루틴이 돼야 합니다.
3. 한 주에 한 번이라도 패턴 C의 dry-run 점검을 돌리면 이번 같은 drift가 쌓이기 전에 잡을 수 있습니다.
