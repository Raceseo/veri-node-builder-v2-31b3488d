# Verinode — AI Assistant Working Notes

이 문서는 Claude Code·Lovable AI·기타 AI 도구가 이 프로젝트에서 작업할 때 반드시 알아야 할 특수 제약을 담습니다.

## 프로젝트 맥락

- **Verinode**: 공공 마이데이터 기반 검증된 개인 데이터 마켓플레이스 (MVP)
- **1단계 MVP**: 정부24 동의 기반 설문 마켓플레이스
- **창업 철학**: "누구도 공짜로 데이터를 가져가지 못한다. 공급하지 않으면 대가도 없다"
- **현재 단계**: 코딩보다 **수요 검증 우선** — `docs/demand-validation/` 참조

## ⚠️ 가장 중요한 사실: Supabase 연결 분리 상태

```
┌─────────────────────────────────┬──────────────────────────────────┐
│ 앱이 실제 쓰는 prod Supabase    │ 구(舊) prod (비활성)             │
├─────────────────────────────────┼──────────────────────────────────┤
│ okeeihfmagfogvuxzszb            │ erkmtsgrbsjdudiofuxw             │
│ 서울 ap-northeast-2             │ ap-south-1 / INACTIVE            │
│ .env·배포본이 이걸 가리킴       │ 과거 MCP 관리 대상, 현재 미사용  │
│ ⚠️ MCP 접근 불가 → SQL Editor 직접│ MCP 접근 가능하나 앱과 무관       │
└─────────────────────────────────┴──────────────────────────────────┘
```

**현재 앱(dev·배포본)은 서울 프로젝트 `okeeihfmagfogvuxzszb`를 사용합니다.** 이 프로젝트는 Claude Code의 MCP로 접근되지 않으므로, DB 변경은 **마이그레이션 SQL 파일을 작성 → Ray가 Supabase SQL Editor에서 직접 실행**하는 방식으로 진행합니다. (구 prod `erkmtsgrbsjdudiofuxw`는 INACTIVE 상태로 더 이상 사용하지 않습니다. Lovable 런타임 관련 과거 이력은 `docs/lovable-supabase-sync.md` 참조)

## AI Assistant별 사용 규칙

### ✅ Lovable AI (lovable.dev 채팅)
- **OK**: 프런트엔드 코드 수정 (컴포넌트·라우팅·스타일·UI)
- **OK**: 간단한 리팩터, 레이아웃 변경
- **피할 것**: DB 스키마 변경 요청 — bhuwi에 가므로 Ray prod에 무영향
- **피할 것**: `.env` 편집 요청 — Lovable이 자동 관리로 거부

### ✅ Claude Code (이 assistant)
- **OK**: 복잡한 다중 파일 수정·마이그레이션 파일 작성·PR 생성
- **DB 변경**: 서울 prod(`okeeihfmagfogvuxzszb`)는 MCP 접근 불가 →
  `supabase/migrations/`에 SQL 파일 작성 후 **Ray가 SQL Editor에서 직접 실행**.
  Claude Code가 DB에 직접 실행하지 않음.
- **MCP 도구**: 구 프로젝트 `erkmtsgrbsjdudiofuxw`(INACTIVE)에만 접근 가능 — 앱과 무관하므로 사용하지 않음.

### 원칙
1. DB 변경은 **항상 Claude Code/MCP**를 통해 erkmt에 apply
2. Lovable이 만든 `supabase/migrations/*.sql` 파일은 bhuwi 기준. Ray prod에 필요하면 MCP로 별도 apply.
3. `.env`는 gitignore됨. 로컬 `.env`는 `.env.example` 복사로 세팅. Lovable이 repo에 무엇을 넣든 로컬 개발 영향 없음.

## 로컬 개발 워크플로우

### 최초 세팅 (clone 후 한 번)
```bash
cp .env.example .env
bun install       # 또는 npm install
bun run dev       # 또는 npm run dev
```

### Lovable로 DB 만진 뒤 (수동 sync)
```bash
scripts\sync-db.bat        # Windows
./scripts/sync-db.sh       # macOS/Linux
```

자세한 내용: `docs/lovable-supabase-sync.md`의 패턴 A

### 직접 DB 변경하고 싶을 때
Claude Code에게 말하기. Claude Code가 MCP로 erkmt에 apply하고 마이그레이션 파일 commit까지 처리.

## 관련 문서

- `docs/lovable-supabase-sync.md` — 3자 drift 역사·치트시트·패턴 A~D
- `docs/demand-validation/` — 수요 검증 설문·배포 가이드
- `scripts/README.md` — sync-db 유틸리티 사용법

## 세션 이력 (2026-04-22 이후 주요 PR)

| PR | 역할 |
|---|---|
| #1 | UX 3건 수정 (NotFound 한국어화·저작권·Router v7) |
| #2 | 온보딩 blocker DB fix (erkmt에 적용) |
| #3 | `.env` project ref 정정 (→ erkmt) |
| #4 | 수요 검증 설문·공유 스크립트 |
| #5 | Lovable-repo 마이그레이션 1차 sync 복원 |
| #6 | Lovable 연동 점검 결과·수동 치트시트 |
| #7 | sync-db 유틸리티 |
| (이 PR) | `.env` gitignore 분리 + 이 문서 |

## 수요 검증 Go 판정 후 재개할 과제

- **구간④-후속: 인증 모드 보상 Edge Function 이관** — `updateProfileVerification`(src/components/views/AntiCherryPickerSurveyView.tsx)은 현재 인증(is_verified)·신뢰도(trust_score)만 갱신하고 VN 보상은 미지급 상태(verification_history.vn_earned=0, result.reward_pending=true). 보안 규칙 #4/protect_vn_balance 때문에 프론트 직접 vn_balance 수정 불가. 설문 보상용 `supabase/functions/claim-survey-reward`를 참고해 `claim-verification-reward`(가칭)를 신설·이관해야 함.
- **구간④ UI 후속(경미): 적립 후 화면 잔액 즉시 미갱신** — `claimSurveyReward` 성공 후 `queryClient.invalidateQueries(['profile']/['home-profile']/['transactions'])`를 호출하나 홈 화면 VN 잔액이 즉시 반영되지 않음. 잔액을 표시하는 쪽(ProfileContext 등)이 구독하는 쿼리 키와 무효화 키의 정합성 점검 필요.
- **재발 방지 기록(서울 문서≠실물): user_rewards UNIQUE(user_id) 누락** — `sync_total_earned` 트리거가 `ON CONFLICT (user_id)`로 `user_rewards`를 UPSERT하는데 서울 실물에 UNIQUE(user_id)가 없어 **transactions insert마다 42P10으로 실패** → 설문 보상뿐 아니라 **충전·출금·데이터 판매 등 모든 거래 기재가 깨지던** 광범위 버그였음. 2026-07-27 UNIQUE 추가로 해소(마이그레이션 `20260727140000`). **교훈**: 서울 실물은 트리거가 의존하는 제약이 문서 없이 누락돼 있을 수 있으니, 거래 관련 함수 도입 전 관련 트리거·제약을 `pg_constraint`로 실물 확인할 것.
- 로컬 파일 36개 중 실제 apply 안 된 마이그레이션 식별 (data_access_requests·data_listings 등 Dashboard용)
- `has_role(uuid, text)` 함수 erkmt에 정의
- Auth.tsx에 "사전 신청" CTA 연결 (Google Form URL 확보 후)

## VeriNode DB 보안 규칙 (필수)
1. 새 테이블 생성 시 반드시 같은 마이그레이션에 ENABLE ROW LEVEL SECURITY와 RLS 정책을 포함할 것
2. RLS 정책에 USING (true) / WITH CHECK (true) 금지 (공개 읽기 전용 SELECT만 예외)
3. SECURITY DEFINER 함수 생성 시 같은 마이그레이션에서 REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated 후 필요한 역할에만 GRANT할 것
4. VN잔액 변경은 Edge Function(service_role) 경유만 허용. 프론트엔드(src/)에서 잔액 변경 RPC 직접 호출 금지
   - vn_balance는 DB 트리거로도 보호됨(protect_vn_balance) — profiles.vn_balance 직접 UPDATE는 service_role 외 차단(2026-07-26 적용)
5. DB 스키마 변경 작업 후 Supabase Advisor 경고 0건 확인을 완료 기준에 포함할 것
6. 관리자 2인 승인 로직은 어떤 리팩토링에서도 제거·우회 금지
