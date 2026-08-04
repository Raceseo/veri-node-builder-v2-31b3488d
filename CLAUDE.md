
# 작업 원칙 (VeriNode)

1. 설계 전에 조사할 것. 같은 문제를 이미 푼 서비스·라이브러리를 먼저 확인하고
   검증된 방식을 채택할 것. 방식을 새로 발명하지 말 것.

2. 코드는 덧붙이지 말고 지울 것. 단, 아래 보호 구역은 예외이며
   삭제·변경 전에 반드시 나에게 먼저 설명하고 승인받을 것.
   [보호 구역] supabase/migrations, DB 스키마·RLS 정책,
   Portone 결제 흐름, 출금·계좌 관련 Edge Function

3. 지금 요구사항을 충족하는 가장 단순한 구현을 고를 것.
   나중에 쓸지 모르는 설정값·옵션·추상화를 미리 만들지 말 것.

4. 한 번에 하나씩. 끝까지 동작하는 최소 버전을 만든 뒤 그 위에 기능을 얹을 것.
   동작하는 화면을 미완성 리팩터링과 바꾸지 말 것.

5. 개인정보·인증정보·계좌정보가 지나가는 코드를 고칠 때는
   어떤 데이터가 어디로 흐르는지 먼저 요약해 보여주고 승인받을 것.
   로그·에러 메시지에 원본 값을 남기지 말 것.

6. 직접 만들기 전에 이미 설치된 것부터 확인할 것
   (package.json, Supabase 클라이언트, shadcn 컴포넌트).
   문서를 안 보고 "그 기능은 없다"고 단정하지 말 것.

7. 임시방편 금지. "나중에 교체" 주석으로 넘기지 말고,
   지금 제대로 하거나 백로그 항목으로 올릴 것.

8. 완료를 보고하기 전에 실제 반영 상태를 명령으로 확인할 것
   (git status, 원격 브랜치 확인, 배포 URL 접속).
   확인 없이 "커밋·푸시·배포 완료"라고 쓰지 말 것.

# 프로젝트 예외

- supabase/config.toml은 임의 수정 금지 (민감 함수 JWT 설정 포함, B-14 검토 대기)
- 기존 마이그레이션 파일은 수정하지 말고 새 마이그레이션을 추가할 것
- 세션 시작 시 앱 정의서를 먼저 확인할 것

<!--
이 파일은 복사본입니다. 원본은 옵시디언 'VeriNode 작업 원칙' 문서이며,
수정은 원본에서 한 뒤 이 파일에 다시 붙여넣습니다.
버전 1.0 / 2026-08-05
-->

# Verinode — AI Assistant Working Notes

이 문서는 Claude Code·Lovable AI·기타 AI 도구가 이 프로젝트에서 작업할 때 반드시 알아야 할 특수 제약을 담습니다.

## 프로젝트 맥락

- **Verinode**: 공공 마이데이터 기반 검증된 개인 데이터 마켓플레이스 (MVP)
- **1단계 MVP**: 정부24 동의 기반 설문 마켓플레이스
- **창업 철학**: "누구도 공짜로 데이터를 가져가지 못한다. 공급하지 않으면 대가도 없다"
- **현재(2026-08-05 기준) 단계**: 코딩보다 **수요 검증 우선** — `docs/demand-validation/` 참조

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

## 세션 시작 시 읽을 것 (2026-07-29 갱신)

### 첫 명령 (고정)
pwd && git log --oneline -3 && git status --short

### 내가 볼 수 없는 것 — 추측 금지
- 서울 DB 실물 (MCP 접근 불가). SQL은 블록으로 제시만, Ray가 SQL Editor에서 실행
- Ray가 SQL Editor에서 한 작업 (테스트 데이터 정리 등)
- Lovable 배포 상태
- 브라우저 화면 (로그인 자격 없음)
→ 이 영역이 보고에 등장하면 "짐작"이라고 명시할 것

### SQL 작성 시
- auth.uid()는 SQL Editor(Role postgres)에서 NULL. 이메일이나 uuid로 대체
- INSERT/UPDATE 전 information_schema.columns 조회를 낀다
- jsonb 컬럼은 select 컬럼::text ... limit 1 로 기존 견본 확인
- 한글 텍스트는 $$ 달러 인용
- 테스트 데이터 정리는 delete 대신 status='closed'

### 화면 정리 작업 시
① 지우기 → ② Ray가 화면 확인 → ③ 구조 정리
①만 하면 값이 빠진 껍데기 카드가 남는다 (2026-07-29 실증)
line-item 제거 지시를 받으면 "제거 후 껍데기가 되는 카드"도 함께 보고할 것

### 주요 코드 좌표
- src/pages/Index.tsx:55 — 온보딩 완료자를 /dashboard로 리다이렉트
  → SupplierLayout(설문 목록)에 정상 도달 불가. 구간②-B 미착수
- src/pages/Index.tsx:49-54 — ?surveyId= 있으면 리다이렉트 안 함 (유일한 예외)
- src/pages/Dashboard.tsx:28 — /dashboard = VeriNodeFinancialDashboard
- SupplierLayout.tsx:52 activeTab 기본값 'home' / 59 초기 currentView
  / 70-71,137 handleBackToMain / 206 case home / 294-296 BottomNav
- 설문 완주 → handleBackToMain → main 뷰 → 홈 탭 착지
  즉 딥링크 응답자는 완주 직후 SupplierHomeTab을 본다

### 현재 우회 진입 경로 (구간②-B 완료 전까지 유일)
/?surveyId=<uuid> → "← 돌아가기" → 하단 "수익 쌓기" 탭
화면명 "수익 쌓기" = 코드명 earn

### 배포 3점 대조 (2026-08-04 추가, B-35)
1. **GitHub에 커밋 존재** — `git log origin/main`
2. **Lovable 수신** — 커밋 목록에 보이는가
3. **실물 서버 반영** — **파일 지문(`index-*.js` 해시) 변경**

셋 중 하나라도 어긋나면 **배포 안 된 것**이다.
⚠️ **Lovable UI의 "Published" 표시는 ③의 증거가 아니다.**
2026-08-04 실측: GitHub `ebcef2e` + "Published" 표시인데 실물은 `39f23ca` 시점
번들(`index-CDwlQRHC.js`)을 그대로 서빙했다(검사 6회, 캐시 아님).

**배포 운용 규칙 (2026-08-05 확정)** — 고장이 아니라 긴 전파 지연이다:
① 배포가 필요하면 Lovable에 무해한 주석 편집을 지시한다 (내부 빌드 강제)
② Publish
③ 반영까지 수 시간 허용한다 — 즉시 안 바뀌어도 실패로 판정하지 않는다
④ 판정은 파일 지문(`index-*.js` 해시)으로만 한다

### 검증 규칙
- 돈 관련 기능은 3점 대조: 화면 ↔ profiles.vn_balance ↔ survey_reward_claims
- 3점 일치 전 커밋 금지
- 한 번에 한 작업만 커밋. 무관 파일 절대 미포함
- 커밋과 푸시를 함께 처리 (푸시 누락으로 다음 날 혼선 발생한 적 있음)
- 커밋 대상 아님: .claude/, .env.bak_seoulfix, supabase/.temp/,
  supabase/functions/verify-portone-identity/, package-lock.json,
  supabase/config.toml

### 절대 손대지 말 것
- 관리자 2인 승인 (2-Admin Approval System) — 보안규칙 #6 보호 대상
- vn_balance 직접 UPDATE — RPC / Edge Function 경유만
- 요청 범위 밖 파일

### 상태 정보는 파일에 적지 않는다
"어느 PC가 뒤처졌나" 같은 정보는 하루면 틀린다.
파일 대신 git log / git status로 매번 확인한다.

### Drive 문서 읽기 (클박사용 메모)
클박사가 Drive 문서를 읽으려면 추가 도구 로드가 필요하다.
- 기본 google_drive_search는 Google Docs만 검색된다
- Google Drive:search_files + download_file_content를 쓰면 .md도 읽힌다
- 2026-08-01 실측 확인. "안 읽힌다"는 판단이 나오면 추가 도구를
  로드했는지 먼저 확인할 것
저장 형식은 자유. Google Docs 변환 불필요.


