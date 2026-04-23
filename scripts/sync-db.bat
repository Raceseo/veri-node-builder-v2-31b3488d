@echo off
REM =============================================
REM  verinode DB 동기화 유틸리티 (Windows)
REM  Lovable로 DB 스키마 바꾼 뒤 이 파일 더블클릭
REM  또는 cmd에서: scripts\sync-db.bat
REM =============================================

setlocal

REM 프로젝트 루트로 이동
cd /d "%~dp0.."

echo.
echo ============================================
echo  1/3 Git pull (Lovable 코드 변경 받기)
echo ============================================
git pull
if errorlevel 1 goto error

echo.
echo ============================================
echo  2/3 Supabase db pull (DB 변경을 파일로 저장)
echo ============================================
call npx supabase db pull
if errorlevel 1 goto error

echo.
echo ============================================
echo  3/3 상태 확인
echo ============================================
git status --short

echo.
echo --------------------------------------------
echo 새 마이그레이션 파일이 생겼다면 아래 명령으로 commit:
echo.
echo   git add supabase/migrations/
echo   git commit -m "chore(db): sync Lovable migration - [무엇을 바꿨는지]"
echo   git push
echo.
echo 새 파일이 없으면 Lovable 변경이 아직 DB에 반영 안 됐거나,
echo 이미 전에 sync된 상태입니다.
echo --------------------------------------------
echo.

goto end

:error
echo.
echo ============================================
echo  오류 발생 - 위 메시지 확인
echo ============================================
echo.
echo 자주 발생하는 에러:
echo  - "Remote migration versions not found..."
echo      = drift 상태. docs/lovable-supabase-sync.md 패턴 D 참조
echo  - "Cannot find project ref"
echo      = 먼저 링크: npx supabase link --project-ref erkmtsgrbsjdudiofuxw
echo.

:end
pause
endlocal
