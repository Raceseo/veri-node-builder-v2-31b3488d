# Lovable → Claude Design 이관 플랜

**시작**: 2026-04-24
**목표 완료**: 2026-05-08 (2주)
**상태**: Phase 0 진행 중

## 왜 옮기는가

현재 구조의 비용:
- Lovable이 자체 Supabase(bhuwi)를 repo `.env`에 주입 → Ray의 실제 prod(erkmt)와 분리된 채 계속 drift
- `sync-db.bat`·`docs/lovable-supabase-sync.md`(패턴 A~D)·`.env` 재정정(PR #3) 등 이 drift만을 위한 인프라가 누적됨
- PR #2·#3·#5·#6·#7·#8 중 다수가 "Lovable 때문에 생긴 문제" 뒷처리

Claude Design으로 옮길 때의 이익:
1. **Supabase split 구조적 소거** — Claude Design은 디자인만 담당, 구현은 Claude Code + MCP가 erkmt에 직접. bhuwi가 끼어들 구조 없음.
2. **Design system 자동 연동** — `tailwind.config.ts` + `src/components/ui/*`(shadcn 49개) 읽어서 브랜드 토큰(Pretendard, trust/gold/navy 팔레트) 일관성 유지.
3. **다용도 export** — PPTX·PDF·Canva·HTML. 수요 검증 배포 비주얼·기업 인터뷰 덱·투자자 피치를 한 툴로 커버.
4. **Git diff 감사 가능** — 모든 변경이 handoff → PR → review로 남음. Lovable의 "갑자기 반영된 변경" 감사 비용 사라짐.

리스크:
- Claude Design은 **research preview** (2026-04-17 런칭) — 기능 변동·버그 가능성
- 라이브 DB 프리뷰 없음(정적 프로토타입 수준) → 실제 데이터 엣지 케이스(빈 상태, 긴 한글)와 drift 가능
- Lovable의 "공개 프리뷰 URL" 대체 필요 (Vercel/Netlify 연결 예정)

## 5-Phase 타임라인

### Phase 0 — 이관 선언 및 문서화 (오늘, 1일)
- [x] 현재 디자인 시스템 인벤토리 파악 (Pretendard + shadcn 49개 + 25 애니메이션 + verinode 팔레트)
- [x] CLAUDE.md에 migration-in-progress 섹션 추가 + Lovable 동결 선언 + Claude Design 규칙 추가
- [x] `docs/design-migration.md` (이 문서) 생성
- [ ] Phase 0 PR 생성·merge
- [ ] Ray가 Claude Design에 이 repo 컨텍스트 연결 시도 (GitHub 읽기 or `tailwind.config.ts` 수동 paste)

### Phase 1 — 파일럿 1개 화면 (1~2일)
**대상**: Auth 페이지 "사전 신청" CTA + 랜딩 상단 hero

**왜 이 화면**: ① 수요 검증 블로커(현재 Google Form URL 대기 중인 미완 과제) ② 소규모(화면 1~2개) ③ 실패해도 roll-back 쉬움 ④ 결과물이 바로 수요 검증 배포에 투입됨

절차:
- [ ] Ray: Claude Design에서 시안 3개 생성 → 하나 확정
- [ ] Ray: handoff bundle export → 이 worktree에 떨굼
- [ ] Claude Code: bundle 받아 `src/pages/Auth.tsx` + 관련 컴포넌트 반영
- [ ] Google Form URL 확보되면 CTA에 연결
- [ ] 파일럿 평가 (아래 기준)

**파일럿 평가 기준** (Go/No-go 결정):
| 기준 | Go | No-go |
|---|---|---|
| 후처리 시간 | Lovable 대비 ≤1.5x | >2x |
| Diff 청결도 | 기존 디자인 시스템과 일치 | 충돌·중복 많음 |
| Ray 체감 속도 | Lovable 대비 허용 범위 | 답답함 |
| 한글 카피 품질 | 자연스러움 | 번역투·어색 |

### Phase 2 — 디자인 시스템 공식화 (3~5일)
- [ ] `docs/design-system.md` 생성 — 색·타이포·스페이싱·모션·보이스(한글 카피 톤) 공식 기준
- [ ] Claude Design에 이 문서를 "프로젝트 컨텍스트"로 주입 (지원되는 방식 확인 후)
- [ ] verinode 고유 컴포넌트(DigitalBadgeCard, TrustScoreGauge, VerificationCard 등) 스타일 가이드 작성

### Phase 3 — 페이지 단위 점진 이관 (1주)
우선순위 (상 → 하):
- [ ] 랜딩(`Index.tsx`)
- [ ] 온보딩 플로우 (`src/components/` 하위 온보딩 관련)
- [ ] Auth (`Auth.tsx`) 잔여분
- [ ] Dashboard(`Dashboard.tsx`) 복원분
- [ ] Enterprise(`Enterprise.tsx`)
- [ ] PaymentComplete(`PaymentComplete.tsx`)

원칙: **1페이지/세션**. PR 분리. 각 이관마다 roll-back 창 유지.

### Phase 4 — Lovable deprecation (이관 완료 후 1~2일)
- [ ] Phase 3에서 전 페이지 이관 확인
- [ ] Lovable 프로젝트 연결 해제
- [ ] `scripts/sync-db.bat`·`scripts/sync-db.sh` 삭제 or `_archive/`로 이동
- [ ] `docs/lovable-supabase-sync.md` → `docs/_archive/` 이동
- [ ] CLAUDE.md의 Lovable 관련 섹션 삭제
- [ ] `.env.example`에서 Lovable 관련 흔적 정리

### Phase 5 — 배포 파이프라인 보강 (+2~3일, 선택)
Lovable이 제공하던 "공개 프리뷰 URL" 대체:
- [ ] Vercel 또는 Netlify 연결 (권장: Vercel + GitHub 자동 배포)
- [ ] `main` branch push → prod, PR branch → preview URL 자동 생성
- [ ] 수요 검증 Google Form 링크와 함께 공유 가능한 랜딩 URL 확보

## 결정 로그

| 날짜 | 결정 | 근거 |
|---|---|---|
| 2026-04-24 | Lovable → Claude Design 이관 결정 | Supabase split 유지 비용 > Claude Design research preview 리스크. MVP 단계이고 디자인 양 적어 이관 비용 최저점. |
| 2026-04-24 | 점진적 이관 (2주), 파일럿 먼저 | Research preview 리스크 회피. 1개 화면으로 핸드오프 품질 검증 후 확장. |

## 판정 체크포인트

**Phase 1 완료 시** (대략 2026-04-26): 파일럿 평가 기준 4개 중 3개 이상 Go이면 Phase 2 진입. 그렇지 않으면 Lovable 유지 쪽으로 회귀하고 Claude Design은 "시안 탐색 전용"으로 축소.

**Phase 3 완료 시** (대략 2026-05-05): 전 페이지 이관 diff review 후 이상 없으면 Phase 4 진행. 잔존 이슈 있으면 Phase 3 연장.

## 참고

- Claude Design 소개: https://www.anthropic.com/news/claude-design-anthropic-labs
- Claude Design 시작 가이드: https://support.claude.com/en/articles/14604416-get-started-with-claude-design
