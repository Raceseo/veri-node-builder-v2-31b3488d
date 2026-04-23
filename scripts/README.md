# scripts/

verinode 개발 보조 스크립트.

## `sync-db.bat` / `sync-db.sh` — Lovable DB 변경 동기화

Lovable 채팅에서 DB 스키마를 바꾼 뒤 (예: "profiles에 birthday 컬럼 추가해줘"), repo의 `supabase/migrations/` 폴더에도 같은 내용을 파일로 남기는 루틴을 자동화합니다. 자세한 배경은 [docs/lovable-supabase-sync.md](../docs/lovable-supabase-sync.md) 참조.

### Windows 사용법

**방법 1 — 더블클릭**
1. 파일 탐색기로 `scripts\sync-db.bat` 찾기
2. 더블클릭 → cmd 창이 열리며 자동 실행

**방법 2 — cmd에서**
```cmd
scripts\sync-db.bat
```

### macOS/Linux 사용법

```bash
./scripts/sync-db.sh
```

(최초 한 번 실행 권한 부여: `chmod +x scripts/sync-db.sh`)

### 하는 일 (3단계)

1. `git pull` — Lovable이 commit한 코드 변경분 받기
2. `npx supabase db pull` — DB의 최신 스키마를 `supabase/migrations/<타임스탬프>_remote_schema.sql` 파일로 저장
3. `git status` 출력 — 새 파일이 생겼는지 보여주기

그 다음 사용자가 수동으로:
```bash
git add supabase/migrations/
git commit -m "chore(db): sync Lovable migration - [무엇을 바꿨는지]"
git push
```

### 사전 요구사항 (최초 한 번)

```bash
cd D:\app_develop\verinode
npx supabase link --project-ref erkmtsgrbsjdudiofuxw
```

(중간에 Database password 물어보면 Supabase Dashboard → Settings → Database에서 확인)

### 언제 실행하나

- **꼼꼼하게**: Lovable에게 DB 관련 요청한 직후마다
- **게으르게**: 주 1회 정기 점검 (대신 여러 변경이 한 파일에 뭉침)

### 트러블슈팅

| 에러 메시지 | 해결 |
|---|---|
| `Cannot find project ref` | 위 "사전 요구사항"의 link 명령 먼저 실행 |
| `Remote migration versions not found…` | drift 상태. `docs/lovable-supabase-sync.md`의 **패턴 D** 참조 |
| `npx: command not found` | Node.js 미설치. https://nodejs.org 에서 LTS 설치 |

---

## `create-demand-survey.gs` — Verinode 수요 검증 Google Form 자동 생성

`docs/demand-validation/survey-individual-supplier-v1.md`의 21문항 10섹션을 Google Form으로 한 번에 생성하는 Apps Script. 수동으로 30분씩 작업할 필요 없음.

### 사용법

1. **Google Apps Script 접속**: https://script.google.com (Google 계정 로그인)
2. 좌측 상단 **[+ 새 프로젝트]** 클릭
3. 기본 코드 `function myFunction() {}` 부분을 **전부 삭제**
4. `scripts/create-demand-survey.gs` 파일 내용을 **전체 복사·붙여넣기**
5. `Ctrl+S` 저장 → 프로젝트 이름 입력 (예: `verinode-survey`)
6. 상단 [실행] (▶) 버튼 클릭
7. **처음이면 권한 요청 팝업이 뜸**:
   - [권한 검토] 클릭
   - Google 계정 선택
   - "Google에서 확인되지 않은 앱" 경고 화면에서 [고급] → [프로젝트 이름(으)로 이동] → [허용]
   - (이 앱은 Ray 본인이 방금 만든 것이라 안전)
8. 실행 완료 후 하단 **"실행 로그"**에 두 URL 표시:
   - **응답 URL** (공유용): `https://forms.gle/xxxxxxxx` ← 이걸 카카오·DM에 뿌림
   - **편집 URL** (본인 전용): `https://docs.google.com/forms/d/xxxxxx/edit` ← 필요 시 수정

### 생성되는 Form

- 제목: "내 데이터에 정당한 대가, 받으실 의향 있으신가요?"
- 10개 섹션 · 21개 질문
- 진행률 표시줄 켜짐
- 이메일 수집은 18번 질문으로만 (자발적 signal 확보)
- 로그인 요구 없음 (응답률 우선)

### 생성 후 Google Drive 위치

자동으로 Ray의 Google Drive 루트에 저장됨. https://drive.google.com 에서 "내 데이터에 정당한 대가..."로 검색하면 찾을 수 있음.

### 수정하고 싶으면

1. 편집 URL로 Google Forms 편집기 접속해서 직접 수정
2. 또는 이 `.gs` 파일 수정 후 Apps Script에 재붙여넣기 + 재실행 (새 Form이 또 생성됨 — 기존 것은 Drive에서 수동 삭제)

### v2 설문 만들 때

`docs/demand-validation/survey-individual-supplier-v2.md` 만든 후 이 `.gs` 파일의 질문 블록들을 v2에 맞게 수정하고 재실행.
