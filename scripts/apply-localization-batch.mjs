import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const batchPath = process.argv[2];

if (!batchPath) {
  console.error('사용법: node scripts/apply-localization-batch.mjs scripts/localization-batch-001.json');
  process.exit(1);
}

const gamesPath = path.join(ROOT, 'games.json');
const seoPath = path.join(__dirname, 'seo-games.json');
const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8')).games;
const seoGames = JSON.parse(fs.readFileSync(seoPath, 'utf8'));
const batch = JSON.parse(fs.readFileSync(path.resolve(ROOT, batchPath), 'utf8'));
const gamesById = new Map(games.map((game) => [game.identifier, game]));
const originalById = new Map(seoGames.map((game) => [game.identifier, game]));
const seen = new Set();

for (const row of batch) {
  if (!Array.isArray(row) || row.length !== 2) {
    throw new Error(`잘못된 배치 행: ${JSON.stringify(row)}`);
  }
  const [identifier, koTitle] = row;
  const game = gamesById.get(identifier);
  if (!game) throw new Error(`games.json에 없는 identifier: ${identifier}`);
  if (seen.has(identifier)) throw new Error(`배치 내 중복 identifier: ${identifier}`);
  if (!koTitle || (!/[가-힣]/.test(koTitle) && !/^\d+$/.test(koTitle))) {
    throw new Error(`한글 제목 확인 필요: ${identifier}`);
  }
  seen.add(identifier);

  // Existing hand-authored SEO entries are intentionally never overwritten.
  // Entries carrying this batch marker remain safely re-runnable and editable.
  const existing = originalById.get(identifier);
  const isGeneratedEntry = existing
    && existing.priority === 'B'
    && Array.isArray(existing.relatedIds)
    && existing.relatedIds.length === 0
    && Array.isArray(existing.secondaryKeywords)
    && existing.secondaryKeywords.length === 3;
  if (existing && existing.localizationBatch !== path.basename(batchPath, '.json') && !isGeneratedEntry) continue;
  originalById.set(identifier, {
    identifier,
    koTitle,
    enTitle: game.title,
    priority: 'B',
    primaryKeyword: `${koTitle} 게임하기`,
    secondaryKeywords: [
      `${koTitle} 고전게임`,
      `${koTitle} 무료게임`,
      `${koTitle} 온라인 플레이`
    ],
    relatedIds: [],
    localizationBatch: path.basename(batchPath, '.json')
  });
}

fs.writeFileSync(seoPath, `${JSON.stringify([...originalById.values()], null, 2)}\n`);
console.log(`한글화 ${seen.size}개 적용, 전체 한국어 제목 ${originalById.size}개`);
