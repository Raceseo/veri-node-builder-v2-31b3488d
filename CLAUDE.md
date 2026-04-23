# Verinode — AI Assistant Working Notes

이 문서는 Claude Code·Claude Design·Lovable AI·기타 AI 도구가 이 프로젝트에서 작업할 때 반드시 알아야 할 특수 제약을 담습니다.

## 프로젝트 맥락

- **Verinode**: 공공 마이데이터 기반 검증된 개인 데이터 마켓플레이스 (MVP)
- **1단계 MVP**: 정부24 동의 기반 설문 마켓플레이스
- **창업 철학**: "누구도 공짜로 데이터를 가져가지 못한다. 공급하지 않으면 대가도 없다"
- **현재 단계**: 코딩보다 **수요 검증 우선** — `docs/demand-validation/` 참조

## 🔄 진행 중인 전환: Lovable → Claude Design (2026-04-24 시작, 2주 플랜)

**이 기간 동안 Lovable에서 신규 작업을 하지 않습니다.** 디자인·UI 변경은 Claude Design(claude.ai/design)에서 생성 후 handoff bundle을 Claude Code에 넘겨 이 repo에 반영합니다.

- **동기**: Lovable-repo-prod 간 Supabase split으로 인한 drift 비용 제거 + Claude Design의 design system 연동·PPTX/PDF export 활용
- **타임라인**: 5-phase, 목표 완료 2026-05-08
- **진행 현황·체크리스트**: `docs/design-migration.md`

## ⚠️ 가장 중요한 사실: Supabase 연결 분리 상태

```
┌─────────────────────────────────┬──────────────────────────────────┐
│ Ray의 실제 prod Supabase        │ Lovable 내부 runtime Supabase    │
├─────────────────────────────────┼──────────────────────────────────┤
│ erkmtsgrbsjdudiofuxw            │ bhuwicburjiyplsotzqo             │
│ Raceseo's Org / Verinode        │ INTYCO HOMPAGE DB org (추정)     │
│ MCP로 관리                      │ Ray 계정으로 접근 불가           │
│ dev 서버·prod 앱 모두 사용 대상 │ Lovable이 repo .env에 계속 주입 │
└─────────────────────────────────┴──────────────────────────────────┘
```

**두 Supabase는 완전 분리되어 동기화되지 않습니다.** Lovable AI가 DB 작업을 실행하면 bhuwi에 반영되고 Ray prod(erkmt)엔 영향이 없습니다.

## AI Assistant별 사용 규칙

### 🧊 Lovable AI (lovable.dev 채팅) — 2026-04-24부터 동결
- **금지**: 신규 UI/DB 작업 일체 (migration 중). 예외는 "운영 중단급 hotfix"만.
- **사유**: Claude Design으로 이관 중. Lovable이 건드리면 두 소스(Lovable·Claude Design)가 경쟁하며 drift 발생.
- **동결 해제**: migration 완료 후 Lovable은 점진적 deprecation.

### 🎨 Claude Design (claude.ai/design) — 디자인·프로토타입 레이어
- **OK**: UI/디자인 시안·변형 생성, 디자인 시스템 확립, 랜딩/화면 프로토타입, 덱·PDF export
- **OK**: repo의 `tailwind.config.ts` + `src/components/ui/*` 읽혀서 브랜드 토큰 일관성 유지
- **출력**: **handoff bundle**을 export → Claude Code가 이 repo에 반영
- **Design Token 기준**: Pretendard Variable + 커스텀 팔레트(trust/trustTeal/gold/navy/success). 자세히는 `tailwind.config.ts`.
- **금지**: 직접 repo에 commit하지 않음. 반드시 Claude Code 경유.

### ✅ Claude Code (이 assistant) + Supabase MCP
- **OK**: Ray의 실제 prod(erkmt) DB 모든 작업
- **OK**: 복잡한 다중 파일 수정·마이그레이션 관리·PR 생성
- **OK**: Claude Design의 handoff bundle을 받아 repo에 반영 (실제 구현 레이어)
- **MCP 도구**: `mcp__*__apply_migration`, `mcp__*__execute_sql` 등 — erkmt 프로젝트 ID 사용 (`erkmtsgrbsjdudiofuxw`)

### 원칙
1. DB 변경은 **항상 Claude Code/MCP**를 통해 erkmt에 apply
2. UI/디자인은 **Claude Design → handoff → Claude Code → PR** 파이프라인을 따름
3. Lovable이 과거에 만든 `supabase/migrations/*.sql` 파일은 bhuwi 기준. Ray prod에 필요하면 MCP로 별도 apply.
4. `.env`는 gitignore됨. 로컬 `.env`는 `.env.example` 복사로 세팅.

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

- `docs/design-migration.md` — **Lovable → Claude Design 이관 플랜·체크리스트·결정 로그**
- `docs/lovable-supabase-sync.md` — 3자 drift 역사·치트시트·패턴 A~D (이관 완료 시 archive 예정)
- `docs/demand-validation/` — 수요 검증 설문·배포 가이드
- `scripts/README.md` — sync-db 유틸리티 + Google Forms Apps Script

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
| #8 | `.env` gitignore 분리 + CLAUDE.md 초판 |
| #9 | Google Forms 자동 생성 Apps Script |
| (이 PR) | Lovable → Claude Design 이관 Phase 0 (문서·동결 선언) |

## 수요 검증 Go 판정 후 재개할 과제

- 로컬 파일 36개 중 실제 apply 안 된 마이그레이션 식별 (data_access_requests·data_listings 등 Dashboard용)
- `has_role(uuid, text)` 함수 erkmt에 정의
- Auth.tsx에 "사전 신청" CTA 연결 (Google Form URL 확보 후) — 이제 Claude Design 파이프라인으로 처리
