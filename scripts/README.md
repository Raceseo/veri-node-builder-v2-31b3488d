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
