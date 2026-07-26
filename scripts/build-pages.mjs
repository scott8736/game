// Generates static SEO landing pages for every game in games.json, plus
// platform "guide" hub pages, sitemap.xml and robots.txt.
// Run: node scripts/build-pages.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE_URL = 'https://game.charry333.workers.dev';

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'games.json'), 'utf8'));
const GAMES = data.games;
const featured = JSON.parse(fs.readFileSync(path.join(__dirname, 'featured-articles.json'), 'utf8'));

const PLAT_META = {
  internetarcade: { ko: '아케이드', code: 'arcade', ctrl: '방향키로 이동 · Ctrl/Alt/Space로 버튼 · 5로 동전 넣기 · 1로 게임 시작' },
  softwarelibrary_msdos_games: { ko: 'MS-DOS', code: 'msdos', ctrl: '방향키 또는 WASD로 이동 · Ctrl/Alt/Space로 액션 · Enter로 확인' },
  sega_genesis_library: { ko: '세가 제네시스', code: 'genesis', ctrl: '방향키로 이동 · Z/X/C로 버튼 · Enter로 Start' },
  sega_sms_library: { ko: '세가 마스터 시스템', code: 'sms', ctrl: '방향키로 이동 · Z/X로 버튼 · Enter로 Start' },
  gamegear_library: { ko: '게임기어', code: 'gamegear', ctrl: '방향키로 이동 · Z/X로 버튼 · Enter로 Start' },
  tg16_library: { ko: 'PC엔진', code: 'pcengine', ctrl: '방향키로 이동 · Z/X로 버튼 · Enter로 RUN' },
  atari_2600_library: { ko: '아타리 2600', code: 'atari2600', ctrl: '방향키로 이동 · Space 또는 Z로 발사' },
  atari_7800_library: { ko: '아타리 7800', code: 'atari7800', ctrl: '방향키로 이동 · Z/X로 버튼' },
  atari_5200_library: { ko: '아타리 5200', code: 'atari5200', ctrl: '방향키로 이동 · Space/Z로 발사' },
  coleco_colecovision_library: { ko: '콜레코비전', code: 'coleco', ctrl: '방향키로 이동 · Z/X로 발사' },
  ngp_library: { ko: '네오지오 포켓', code: 'ngp', ctrl: '방향키로 이동 · Z/X로 버튼' },
  'wonderswan-library': { ko: '원더스완', code: 'wonderswan', ctrl: '방향키로 이동 · Z/X로 버튼' },
  psxgames: { ko: '플레이스테이션(PS1)', code: 'ps1', ctrl: '방향키로 이동 · Z/X/A/S로 버튼' },
};
const GENRE_KO = { racing: '레이싱', shooter: '슈팅', maze: '미로', platform: '플랫폼', action: '액션', puzzle: '퍼즐', fighting: '격투', sports: '스포츠', adventure: '어드벤처', simulation: '시뮬레이션', strategy: '전략', rpg: 'RPG' };

const TOP_FEATURED_COUNT = 80;
const OG_IMAGE = `${SITE_URL}/og-image.png`;
const ADSENSE_SNIPPET = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8646375689901020" crossorigin="anonymous"></script>`;

function escHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escXml(s) { return escHtml(s); }

function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

// --- pass 1: compute unique slugs for every game ---
const usedSlugs = new Map();
const games = GAMES.map((g) => {
  const cat = g.category || 'other';
  const meta = PLAT_META[cat] || { ko: '레트로', code: 'retro', ctrl: '' };
  let base = slugify(g.title) || slugify(g.identifier);
  let slug = `${base}-${meta.code}`;
  const count = usedSlugs.get(slug) || 0;
  if (count > 0) slug = `${slug}-${count + 1}`;
  usedSlugs.set(base + '-' + meta.code, count + 1);
  return { ...g, category: cat, meta, slug };
});

// featured tier: top N by downloads
const byDownloads = [...games].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
const featuredSet = new Set(byDownloads.slice(0, TOP_FEATURED_COUNT).map((g) => g.identifier));

// group by category (in original order) for related-games lookups
const byCategory = new Map();
for (const g of games) {
  if (!byCategory.has(g.category)) byCategory.set(g.category, []);
  byCategory.get(g.category).push(g);
}
const slugById = new Map(games.map((g) => [g.identifier, g.slug]));

// NOTE: templates avoid attaching Korean particles (은/는/을/를) directly to
// the raw (often English) title, since correct particle choice depends on
// Hangul pronunciation and can't be reliably derived from Latin spelling.
// Titles are kept as list-style appositives instead ("Title (year) — ...").
const TEMPLATES = [
  (t, y, p, gp) => `${t} (${y}) · ${p} ${gp}게임 — 다운로드나 에뮬레이터 설치 없이 브라우저에서 무료로 온라인 플레이할 수 있습니다.`,
  (t, y, p, gp) => `${p} 게임 컬렉션에 있는 ${t} (${y})! ${gp}장르를 좋아한다면 지금 브라우저에서 바로 무료로 즐겨보세요.`,
  (t, y, p, gp) => `${y}년 ${p}에서 만날 수 있는 ${gp}게임, ${t}. 추억의 레트로 게임을 에뮬레이터 설치 없이 웹에서 바로 즐길 수 있습니다.`,
  (t, y, p, gp) => `${t} (${y}) · ${p} 라이브러리 수록작. 다운로드 없이 온라인에서 무료로 플레이 가능한 ${gp}게임입니다.`,
  (t, y, p, gp) => `레트로 게임 컬렉션 속 한 편, ${t} (${y}). ${p}에서 만나볼 수 있는 ${gp}게임을 지금 바로 브라우저에서 무료로 플레이해보세요.`,
];

function buildIntro(g) {
  if (featured.hasOwnProperty(g.identifier)) return featured[g.identifier];
  const year = g.year || '출시연도 미상';
  const genreKo = (g.genre && GENRE_KO[g.genre]) || g.genre || '';
  const genrePhrase = genreKo ? genreKo + ' 장르의 ' : '';
  const tpl = TEMPLATES[hashStr(g.identifier) % TEMPLATES.length];
  return tpl(g.title, year, g.meta.ko, genrePhrase);
}

function relatedGames(g) {
  const list = byCategory.get(g.category) || [];
  if (list.length <= 1) return [];
  const startIdx = list.findIndex((x) => x.identifier === g.identifier);
  const out = [];
  for (let i = 1; i <= 4 && out.length < 4; i++) {
    const cand = list[(startIdx + i) % list.length];
    if (cand.identifier !== g.identifier) out.push(cand);
  }
  return out;
}

function playHref(g, prefix) {
  return `${prefix}play.html?game=${encodeURIComponent(g.identifier)}&cat=${encodeURIComponent(g.category)}&t=${encodeURIComponent(g.title)}&y=${encodeURIComponent(g.year || '')}`;
}

const PAGE_CSS = `
:root{--bg:#04101a;--bg-2:#082234;--fg:#d6f0ff;--dim:#6b93ad;--accent:#23c4ff;--accent-2:#48e0c0;--border:#0f3550;--radius:10px;}
*{box-sizing:border-box;}
body{background:var(--bg);color:var(--fg);font-family:'Share Tech Mono',monospace;min-height:100vh;margin:0;padding:24px;}
.wrap{max-width:800px;margin:0 auto;}
.crumb{color:var(--dim);font-size:14px;margin-bottom:14px;}
.crumb a{color:var(--accent-2);text-decoration:none;}
h1{font-family:'Orbitron',sans-serif;color:var(--accent);font-size:32px;letter-spacing:1px;margin:0 0 6px;text-shadow:0 0 12px var(--accent);}
.meta{color:var(--dim);font-size:14px;margin-bottom:18px;letter-spacing:0.5px;}
article p{line-height:1.8;font-size:15px;margin:0 0 14px;}
.ctrl-box{border:1px solid var(--border);background:var(--bg-2);padding:12px 16px;margin:18px 0;font-size:14px;color:var(--accent-2);}
.cta{display:inline-block;background:var(--accent);color:var(--bg);font-weight:700;padding:14px 28px;border-radius:var(--radius);text-decoration:none;font-size:18px;letter-spacing:1px;margin:10px 0 24px;}
.cta:hover{background:var(--accent-2);}
.related{margin-top:20px;border-top:1px solid var(--border);padding-top:16px;}
.related h2{font-size:16px;color:var(--accent-2);margin:0 0 10px;}
.related ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;}
.related a{color:var(--fg);text-decoration:none;font-size:14px;}
.related a:hover{color:var(--accent);}
footer{margin-top:30px;color:var(--dim);font-size:12px;text-align:center;line-height:1.6;opacity:0.8;}
footer a{color:var(--accent);}
`;

function gamePage(g) {
  const url = `${SITE_URL}/games/${g.slug}.html`;
  const title = escHtml(g.title);
  const desc = escHtml(buildIntro(g));
  const yearLabel = g.year || '????';
  const genreKo = (g.genre && GENRE_KO[g.genre]) || g.genre || '';
  const related = relatedGames(g);
  const relHtml = related.length
    ? `<div class="related"><h2>관련 게임</h2><ul>${related.map((r) => `<li><a href="${escHtml(r.slug)}.html">${escHtml(r.title)} (${r.year || '????'})</a></li>`).join('')}</ul></div>`
    : '';
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: g.title,
    genre: genreKo || undefined,
    datePublished: g.year ? String(g.year) : undefined,
    gamePlatform: g.meta.ko,
    url,
  };
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} 온라인 무료 플레이 - ${escHtml(g.meta.ko)} ${escHtml(genreKo)} 게임 | 게임다방</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title} 온라인 무료 플레이 | 게임다방">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${OG_IMAGE}">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="stylesheet" href="../style.css">
<style>${PAGE_CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${ADSENSE_SNIPPET}
</head>
<body>
<div class="wrap">
<div class="crumb"><a href="../index.html">홈</a> &rsaquo; <a href="../guide/${g.category}.html">${escHtml(g.meta.ko)}</a> &rsaquo; ${title}</div>
<h1>${title}</h1>
<div class="meta">${yearLabel} · ${escHtml(g.meta.ko)}${genreKo ? ' · ' + escHtml(genreKo) : ''}</div>
<article><p>${desc}</p></article>
<div class="ctrl-box">🎮 조작법: ${escHtml(g.meta.ctrl || '게임 화면 내 안내를 참고하세요')}</div>
<a class="cta" href="${playHref(g, '../')}">🕹️ 지금 무료로 플레이하기</a>
${relHtml}
<footer>본 사이트의 게임은 Internet Archive(archive.org) 자료를 임베드한 것으로, 게임 보존·교육을 위한 비영리 페이지입니다. 저작권은 각 권리자에게 있으며 권리자 요청 시 즉시 삭제합니다.<br><a href="../guide.html">← 게임소개 목록으로</a> · <a href="../index.html">전체 게임 갤러리</a></footer>
</div>
</body>
</html>`;
}

function guidePlatformPage(cat, list) {
  const meta = PLAT_META[cat] || { ko: '레트로', code: 'retro' };
  const sorted = [...list].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  const items = sorted.map((g) => `<li><a href="../games/${escHtml(g.slug)}.html"><img loading="lazy" src="https://archive.org/services/img/${encodeURIComponent(g.identifier)}" alt="" onerror="this.style.display='none'"><span class="ti">${escHtml(g.title)}</span><span class="yr">${g.year || '????'}</span></a></li>`).join('');
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(meta.ko)} 게임 모음 - 무료 온라인 플레이 | 게임다방</title>
<meta name="description" content="${escHtml(meta.ko)} 레트로 게임 ${list.length}개를 다운로드나 에뮬레이터 설치 없이 브라우저에서 무료로 플레이하세요.">
<link rel="canonical" href="${SITE_URL}/guide/${cat}.html">
<meta property="og:type" content="website">
<meta property="og:title" content="${escHtml(meta.ko)} 게임 모음 | 게임다방">
<meta property="og:image" content="${OG_IMAGE}">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="stylesheet" href="../style.css">
${ADSENSE_SNIPPET}
<style>${PAGE_CSS}
ul{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;}
li a{display:block;color:var(--fg);text-decoration:none;border:1px solid var(--border);background:var(--bg-2);border-radius:8px;overflow:hidden;}
li img{width:100%;aspect-ratio:4/3;object-fit:contain;background:#000;display:block;}
li .ti{display:block;font-size:12px;padding:6px 8px 0;line-height:1.3;}
li .yr{display:block;font-size:11px;color:var(--dim);padding:0 8px 8px;}
</style>
</head>
<body><div class="wrap" style="max-width:1100px;">
<div class="crumb"><a href="../index.html">홈</a> &rsaquo; <a href="../guide.html">게임소개</a> &rsaquo; ${escHtml(meta.ko)}</div>
<h1>${escHtml(meta.ko)} 게임 모음</h1>
<div class="meta">${list.length}개 게임 · 다운로드/에뮬레이터 설치 없이 브라우저에서 무료 플레이</div>
<ul>${items}</ul>
<footer><a href="../guide.html">← 게임소개 목록으로</a> · <a href="../index.html">전체 게임 갤러리</a></footer>
</div></body></html>`;
}

function guideIndexPage() {
  const cats = Object.keys(PLAT_META);
  const cards = cats.map((cat) => {
    const meta = PLAT_META[cat];
    const count = (byCategory.get(cat) || []).length;
    return `<a class="pcard" href="guide/${cat}.html"><div class="pname">${escHtml(meta.ko)}</div><div class="pcount">${count}개</div></a>`;
  }).join('');
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>게임소개 - 플랫폼별 레트로 게임 목록 | 게임다방</title>
<meta name="description" content="아케이드, MS-DOS, 세가 제네시스, 플레이스테이션 등 플랫폼별로 정리된 레트로 게임 소개 목록. 다운로드 없이 브라우저에서 무료로 플레이하세요.">
<link rel="canonical" href="${SITE_URL}/guide.html">
<meta property="og:type" content="website">
<meta property="og:title" content="게임소개 - 플랫폼별 레트로 게임 목록 | 게임다방">
<meta property="og:image" content="${OG_IMAGE}">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="stylesheet" href="style.css">
${ADSENSE_SNIPPET}
<style>${PAGE_CSS}
.wrap{max-width:900px;}
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:20px;}
.pcard{display:block;border:1px solid var(--border);background:var(--bg-2);border-radius:10px;padding:16px;text-decoration:none;color:var(--fg);text-align:center;}
.pcard:hover{border-color:var(--accent);color:var(--accent);}
.pname{font-family:'Orbitron',sans-serif;font-size:16px;letter-spacing:1px;}
.pcount{color:var(--dim);font-size:13px;margin-top:6px;}
</style>
</head>
<body><div class="wrap">
<div class="crumb"><a href="index.html">홈</a> &rsaquo; 게임소개</div>
<h1>🕹️ 게임소개</h1>
<article><p>게임다방이 보존하고 있는 2,200여 개의 아케이드·콘솔·PC 레트로 게임을 플랫폼별로 소개합니다. 각 게임 소개 페이지에서 발매연도, 장르, 조작법을 확인하고 바로 무료로 온라인 플레이할 수 있습니다.</p></article>
<div class="pgrid">${cards}</div>
<footer><a href="index.html">전체 게임 갤러리로 돌아가기</a></footer>
</div></body></html>`;
}

// --- write output ---
const gamesDir = path.join(ROOT, 'games');
const guideDir = path.join(ROOT, 'guide');
fs.mkdirSync(gamesDir, { recursive: true });
fs.mkdirSync(guideDir, { recursive: true });

for (const g of games) {
  fs.writeFileSync(path.join(gamesDir, `${g.slug}.html`), gamePage(g));
}
for (const [cat, list] of byCategory) {
  fs.writeFileSync(path.join(guideDir, `${cat}.html`), guidePlatformPage(cat, list));
}
fs.writeFileSync(path.join(ROOT, 'guide.html'), guideIndexPage());

// sitemap.xml
const urls = [
  `${SITE_URL}/`,
  `${SITE_URL}/guide.html`,
  ...Object.keys(PLAT_META).map((cat) => `${SITE_URL}/guide/${cat}.html`),
  ...games.map((g) => `${SITE_URL}/games/${g.slug}.html`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${escXml(u)}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

// robots.txt
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`generated ${games.length} game pages, ${byCategory.size} guide pages, sitemap with ${urls.length} urls`);
