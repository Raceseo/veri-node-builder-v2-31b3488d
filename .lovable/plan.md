

## 옵션 1: GitHub 자동 연결 (권장 경로)

### 데이터 주권 관점
> "내 코드의 주인은 나" — 옛날 주소 잔재 정리하고, `regio-report-weekly-v2` 단일 주소로 귀속시키는 작업입니다.

### 작업 분담

**Ray님 작업 (GitHub.com + Lovable UI)**

1. **기존 레포 삭제** (보존할 코드 없음 확인됨)
   - GitHub.com → `regio-report-weekly-v2` 레포 진입
   - Settings 탭 → 페이지 맨 아래 **Danger Zone**
   - **"Delete this repository"** 클릭
   - 확인창에서 레포 이름 `regio-report-weekly-v2` 입력 → 삭제

2. **GitHub 앱 권한 정리** (옛날 권한 잔재 제거)
   - GitHub.com → 우측 상단 프로필 → Settings
   - 좌측 메뉴 **Applications** → **Installed GitHub Apps**
   - **Lovable** 찾아서 **Configure** → 맨 아래 **Uninstall** (또는 **Suspend**)

3. **Lovable에서 새로 연결**
   - 좌측 사이드바 **Connectors** → **GitHub** → **Connect project**
   - GitHub 인증 화면에서 본인 계정 선택
   - 레포 생성 단계에서 이름을 **`regio-report-weekly-v2`** 로 입력
   - **Create Repository** 클릭
   - → VeriNode 코드 전체가 새 `regio-report-weekly-v2`에 자동 push됨

**제가 default 모드에서 처리할 작업**

4. **`services/githubService.ts` 삭제**
   - 옛날 주소 `Raceseo/veri-node-builder-8ffef160` 하드코딩 잔재 제거
   - 검색 결과 사용처 0개인 죽은 코드 → 안전하게 삭제 가능
   - 삭제 후 옛날 GitHub 주소 코드에서 완전히 사라짐

### 작업 순서

```
1. [Ray] GitHub.com에서 regio-report-weekly-v2 레포 삭제
2. [Ray] GitHub 앱 권한에서 Lovable 제거
3. [Ray] Lovable Connectors → GitHub → Connect project
        → 레포 이름 "regio-report-weekly-v2" 입력 → Create
4. [AI]  services/githubService.ts 파일 삭제
5. [Ray + AI] 새 레포에 코드 정상 push 확인
```

### 검증 체크리스트
- Lovable Settings 화면에 `intyco-Ray/veri-node-builder` 더 이상 표시되지 않음
- 새 GitHub 레포 `regio-report-weekly-v2`에 VeriNode 코드 정상 push됨
- 코드 내 옛날 주소(`Raceseo`, `intyco-Ray`, `veri-node-builder`) 잔재 0개

### 주의사항
- **Step 1 삭제는 되돌릴 수 없음** — 보존할 코드 없는 것 다시 한번 확인 부탁드려요
- **Step 2(앱 권한 제거)는 선택사항**이지만, 안 하면 옛날 권한이 남아 다시 옛 레포로 연결될 수 있음 → 권장
- **Step 3에서 레포 이름 정확히 입력**: `regio-report-weekly-v2` (오타 주의)

승인하시면 default 모드로 전환해서 Step 4 (코드 정리) 진행하겠습니다. Step 1~3은 Ray님이 UI에서 직접 진행 부탁드려요.

