#!/usr/bin/env bash
# =============================================
#  verinode DB 동기화 유틸리티 (macOS/Linux)
#  Lovable로 DB 스키마 바꾼 뒤 실행
#  사용법: ./scripts/sync-db.sh
# =============================================

set -e

# 프로젝트 루트로 이동 (이 스크립트 파일 기준)
cd "$(dirname "$0")/.."

echo
echo "============================================"
echo "  1/3 Git pull (Lovable 코드 변경 받기)"
echo "============================================"
git pull

echo
echo "============================================"
echo "  2/3 Supabase db pull (DB 변경을 파일로 저장)"
echo "============================================"
npx supabase db pull

echo
echo "============================================"
echo "  3/3 상태 확인"
echo "============================================"
git status --short

cat <<'EOF'

--------------------------------------------
새 마이그레이션 파일이 생겼다면 아래 명령으로 commit:

  git add supabase/migrations/
  git commit -m "chore(db): sync Lovable migration - [무엇을 바꿨는지]"
  git push

새 파일이 없으면 Lovable 변경이 아직 DB에 반영 안 됐거나,
이미 전에 sync된 상태입니다.
--------------------------------------------
EOF
