import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const games = JSON.parse(fs.readFileSync(path.join(ROOT, 'games.json'), 'utf8')).games;
const seo = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/seo-games.json'), 'utf8'));
const codes = {internetarcade:'arcade',softwarelibrary_msdos_games:'msdos',sega_genesis_library:'genesis',sega_sms_library:'sms',gamegear_library:'gamegear',tg16_library:'pcengine',atari_2600_library:'atari2600',atari_7800_library:'atari7800',atari_5200_library:'atari5200',coleco_colecovision_library:'coleco',ngp_library:'ngp','wonderswan-library':'wonderswan',psxgames:'ps1'};
const slugify = (v) => String(v).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-');
const used = new Map();
const slugById = new Map(games.map((g) => {
  const base = `${slugify(g.title) || slugify(g.identifier)}-${codes[g.category] || 'retro'}`;
  const n = used.get(base) || 0; used.set(base, n + 1);
  return [g.identifier, n ? `${base}-${n + 1}` : base];
}));
const decode = (v) => String(v).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const field = (html, re) => decode(html.match(re)?.[1]?.trim() || '');
const titles = new Map(), descriptions = new Map(), canonicals = new Map();
const issues = [], rows = [];

for (const item of seo) {
  const slug = slugById.get(item.identifier);
  const file = slug && path.join(ROOT, 'games', `${slug}.html`);
  if (!slug || !fs.existsSync(file)) { issues.push(`${item.koTitle}: 생성 페이지 없음`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  const title = field(html, /<title>(.*?)<\/title>/s);
  const h1 = field(html, /<h1>(.*?)<\/h1>/s).replace(/<[^>]+>/g, '');
  const desc = field(html, /<meta name="description" content="(.*?)">/s);
  const canonical = field(html, /<link rel="canonical" href="(.*?)">/s);
  const checks = {
    title: title.includes(item.koTitle) && title.includes(item.enTitle),
    h1: h1 === item.primaryKeyword,
    description: desc.length >= 70 && desc.length <= 180,
    canonical: canonical === `https://bamboostand.kr/games/${slug}.html`,
    related: html.includes('관련 게임'),
    article: html.includes('../articles/')
  };
  for (const [name, ok] of Object.entries(checks)) if (!ok) issues.push(`${item.koTitle}: ${name} 검사 실패`);
  for (const [map, value, label] of [[titles,title,'title'],[descriptions,desc,'description'],[canonicals,canonical,'canonical']]) {
    if (map.has(value)) issues.push(`${item.koTitle}: ${label} 중복 (${map.get(value)})`);
    map.set(value, item.koTitle);
  }
  rows.push(`| ${item.priority} | ${item.koTitle} | ${item.primaryKeyword} | ${Object.values(checks).every(Boolean) ? '통과' : '확인 필요'} |`);
}

const report = `# SEO 대상 게임 80개 검수 보고서

- 검사 대상: ${seo.length}개
- 정상 생성: ${rows.length}개
- 발견 이슈: ${issues.length}건
- 검사 항목: title 한·영문 포함, H1 목표 키워드 일치, description 길이, canonical, 관련 게임, 정보성 콘텐츠 역링크, 중복

## 결과

${issues.length ? issues.map((x) => `- ${x}`).join('\n') : '- 전체 항목 통과'}

## 페이지별 상태

| 우선순위 | 한국어명 | 목표 키워드 | 상태 |
|---|---|---|---|
${rows.join('\n')}
`;
fs.mkdirSync(path.join(ROOT, 'reports'), {recursive:true});
fs.writeFileSync(path.join(ROOT, 'reports/seo-audit-80.md'), report);
console.log(`audited ${seo.length} SEO pages: ${issues.length} issues`);
if (issues.length) process.exitCode = 1;
