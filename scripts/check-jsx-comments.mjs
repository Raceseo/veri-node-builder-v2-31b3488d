#!/usr/bin/env node
/**
 * JSX 주석 닫힘 검사.
 *
 * 왜 있나: `{/* ... *\/}` 를 `*\/` 로만 닫으면(끝의 `}` 누락) **tsc 는 통과하고
 * 빌드에서 깨진다.** tsc 는 타입을 보지 JSX 주석 구문의 닫힘을 검사하지 않는다.
 * 2026-08-22 하루에 세 번 같은 실수가 났다 — TrustScoreHeader · SupplierHomeTab ·
 * SupplierLayout. 배움노트 6번에 적은 직후 네 번째가 날 뻔해 검사로 바꿨다.
 *
 * 배움노트 7번: "같은 실수가 두 번 나면 노트에 적는 대신 자동 검사를 만든다.
 * 노트는 사람이 기억해서 지키는 것이고, 기억은 세 번 실패했다."
 *
 * 실행: npm run check:jsx   (npm run build 가 자동으로 먼저 돌린다)
 * 실패하면 exit 1 로 빌드를 세운다.
 *
 * ⚠️ 의존성을 쓰지 않고 Node 내장 API 만 쓴다. fs.globSync 는 Node 22+ 전용이라
 *    쓰지 않았다 — 이 스크립트가 build 앞에 붙으므로, 여기서 깨지면 배포가 깨진다.
 *    Lovable 빌드 환경의 Node 버전을 우리가 통제하지 못한다.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** src 이하 .tsx 를 재귀로 모은다. */
function collect(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collect(full, out);
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

const files = collect("src");
const bad = [];

for (const file of files) {
  const src = readFileSync(file, "utf8");
  // `{/*` 하나하나에 대해 가장 가까운 `*/` 를 찾고, 그 뒤가 `}` 인지 본다.
  for (let i = src.indexOf("{/*"); i !== -1; i = src.indexOf("{/*", i + 3)) {
    const close = src.indexOf("*/", i + 3);
    if (close === -1 || src[close + 2] !== "}") {
      bad.push(`${file}:${src.slice(0, i).split("\n").length}`);
    }
  }
}

if (bad.length) {
  console.error(`\n🔴 JSX 주석이 '*/}' 로 닫히지 않았습니다 (${bad.length}건):`);
  for (const b of bad) console.error(`   ${b}`);
  console.error(`\n   '{/*' 로 연 주석은 '*/}' 로 닫아야 합니다. '*/' 만으로는 빌드가 깨집니다.\n`);
  process.exit(1);
}

console.log(`✅ JSX 주석 닫힘 검사 통과 (${files.length}개 파일)`);
