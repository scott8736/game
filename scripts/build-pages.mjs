// Generates static SEO landing pages for every game in games.json, plus
// platform "guide" hub pages, sitemap.xml and robots.txt.
// Run: node scripts/build-pages.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE_URL = 'https://bamboostand.kr';

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'games.json'), 'utf8'));
const GAMES = data.games;
const featured = JSON.parse(fs.readFileSync(path.join(__dirname, 'featured-articles.json'), 'utf8'));
const seoGames = JSON.parse(fs.readFileSync(path.join(__dirname, 'seo-games.json'), 'utf8'));
const seoById = new Map(seoGames.map((item) => [item.identifier, item]));
import { PLATFORM_INFO, GENRE_INFO, GENERIC_GENRE } from './game-page-content.mjs';

const articleGameLinks = JSON.parse(fs.readFileSync(path.join(__dirname, 'article-game-links.json'), 'utf8'));
const ARTICLE_TITLES = {
  'best-dos-games': '90년대 도스게임 명작 추천', 'best-arcade-games': '추억의 오락실게임 추천',
  'free-retro-games-online': '설치 없이 즐기는 무료 고전게임', 'best-mega-drive-games': '메가드라이브 명작 게임 추천',
  'best-ps1-games': 'PS1 명작 게임 추천', 'retro-games-with-kids': '부모와 아이가 함께하기 좋은 고전게임',
  'best-retro-racing-games': '고전 레이싱게임 추천', 'best-retro-puzzle-games': '고전 퍼즐게임 추천',
  'prince-of-persia-beginner-guide': '페르시아의 왕자 조작법과 초보 공략', 'pac-man-high-score-guide': '팩맨 고득점 기본 공략',
  'best-atari-2600-games': '아타리 2600 대표 게임 추천', 'quick-arcade-games': '짧게 즐기기 좋은 오락실게임',
  'prehistorik-2-beginner-guide': '고인돌 2 조작법과 숨겨진 요소', 'simcity-beginner-guide': '심시티 초보 도시 운영법',
  'wolfenstein-3d-controls-guide': '울펜슈타인 3D 기본 조작법', 'doom-2-beginner-guide': '둠 2 초보자 생존 공략',
  'outrun-route-controls-guide': '아웃런 코스 선택과 조작법', 'tetris-beginner-stacking-guide': '테트리스 초보 블록 쌓기',
  'frogger-beginner-guide': '프로거 안전하게 길 건너는 법', 'dig-dug-score-guide': '디그더그 초보 점수 공략'
};

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

const OG_IMAGE = `${SITE_URL}/og-image.png`;
const ADSENSE_SNIPPET = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8646375689901020" crossorigin="anonymous"></script>`;

// Search results cut titles off past roughly 65 characters, so build a list of
// progressively shorter forms and take the first that fits (and, for the
// curated SEO pages, still carries both the Korean and English name).
const TITLE_MAX = 65;
function fitTitle(candidates, isValid) {
  const usable = isValid ? candidates.filter(isValid) : candidates;
  const pool = usable.length ? usable : candidates;
  for (const c of pool) if (c.length <= TITLE_MAX) return c;
  const shortest = pool.reduce((a, b) => (b.length < a.length ? b : a));
  // A curated page must keep both its Korean and English name, so overrun the
  // target rather than cut it; auto-generated pages can be trimmed.
  if (isValid) return shortest;
  return shortest.slice(0, TITLE_MAX - 1).replace(/[\s\-·|(]+$/, '') + '…';
}
const DESC_MIN = 70;
const DESC_MAX = 160;
function fitDesc(text, tail) {
  let d = String(text || '').trim();
  if (d.length < DESC_MIN && tail) d = `${d} ${tail}`.trim();
  if (d.length > DESC_MAX) {
    const cut = d.slice(0, DESC_MAX);
    const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('다. '));
    d = (stop > DESC_MIN ? cut.slice(0, stop + 1) : cut.replace(/[\s,·—-]+\S*$/, '') + '…').trim();
  }
  return d;
}
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
  const primarySlug = `${base}-${meta.code}`;
  let slug = primarySlug;
  const count = usedSlugs.get(slug) || 0;
  // Same title + platform appears more than once in the Archive libraries (a
  // second ROM dump of the same game). Those pages are near-duplicates of the
  // first one, so they get a canonical pointing at it and stay out of the
  // sitemap instead of competing with it in search.
  if (count > 0) slug = `${slug}-${count + 1}`;
  usedSlugs.set(primarySlug, count + 1);
  return { ...g, category: cat, meta, slug, primarySlug, isDuplicate: count > 0 };
});

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
  const seo = seoById.get(g.identifier);
  if (seo?.relatedIds?.length) {
    const curated = seo.relatedIds.map((id) => games.find((item) => item.identifier === id)).filter(Boolean);
    if (curated.length) return curated.slice(0, 4);
  }
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
  const seo = seoById.get(g.identifier);
  return `${prefix}play.html?game=${encodeURIComponent(g.identifier)}&cat=${encodeURIComponent(g.category)}&t=${encodeURIComponent(seo?.koTitle || g.title)}&et=${encodeURIComponent(seo?.enTitle || '')}&y=${encodeURIComponent(g.year || '')}`;
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
.article-links{margin-top:20px;border:1px solid var(--border);background:var(--bg-2);padding:14px 16px;}
.article-links h2{font-size:17px;color:var(--accent-2);margin:0 0 9px;}
.article-links ul{margin:0;padding-left:20px;line-height:1.8;}
.article-links a{color:var(--accent);text-decoration:none;}
.spec{width:100%;border-collapse:collapse;margin:4px 0 20px;}
.spec th,.spec td{border:1px solid var(--border);padding:8px 12px;text-align:left;font-size:14px;}
.spec th{width:34%;color:var(--accent-2);background:var(--bg-2);font-weight:400;}
.note{border-left:3px solid var(--accent-2);background:var(--bg-2);padding:10px 14px;margin:0 0 20px;font-size:14px;line-height:1.7;color:var(--dim);}
.faq{margin:8px 0 20px;}
.faq dt{color:var(--accent-2);font-size:15px;margin:14px 0 5px;}
.faq dd{margin:0;padding-left:14px;border-left:1px solid var(--border);line-height:1.75;font-size:14px;}
footer{margin-top:30px;color:var(--dim);font-size:12px;text-align:center;line-height:1.6;opacity:0.8;}
footer a{color:var(--accent);}
`;
const SAMPLE_CSS = `
.en-title{color:var(--dim);font-size:18px;margin:-2px 0 10px;}
article h2{color:var(--accent-2);font-size:21px;margin:26px 0 10px;}
.controls{width:100%;border-collapse:collapse;margin:10px 0 18px;}
.controls th,.controls td{border:1px solid var(--border);padding:9px 12px;text-align:left;font-size:14px;}
.controls th{width:38%;color:var(--accent-2);background:var(--bg-2);}
.tips{line-height:1.75;padding-left:22px;margin:8px 0 20px;}
.tips li{margin-bottom:7px;}
`;

// --- reference sections ---------------------------------------------------
// Each block below is built from data the catalogue actually holds (year,
// platform, genre, siblings in the same library) plus the hardware and genre
// reference in game-page-content.mjs. No per-game claims are invented here.

function specTable(g, seo, genreLabel) {
  const rows = [
    seo ? ['한국어 제목', seo.koTitle] : null,
    ['원제', g.title],
    ['출시 연도', g.year ? `${g.year}년` : '미상'],
    ['플랫폼', g.meta.ko],
    genreLabel ? ['장르', genreLabel] : null,
    ['자료 출처', `Internet Archive · ${g.identifier}`],
  ].filter(Boolean);
  return `<table class="spec"><tbody>${rows
    .map(([k, v]) => `<tr><th scope="row">${escHtml(k)}</th><td>${escHtml(v)}</td></tr>`)
    .join('')}</tbody></table>`;
}

// Where this title sits in its library: how big the library is, and which
// other games in it came out the same year. Both are read from games.json.
function libraryContext(g) {
  const list = byCategory.get(g.category) || [];
  const parts = [`게임다방에는 ${g.meta.ko} 게임이 ${list.length}개 정리되어 있습니다.`];
  if (g.year) {
    const sameYear = list.filter((x) => x.identifier !== g.identifier && x.year === g.year);
    parts.push(
      sameYear.length
        ? `그중 ${g.year}년에 나온 작품은 이 게임을 포함해 ${sameYear.length + 1}개입니다.`
        : `${g.year}년 작품으로는 이 게임이 유일하게 정리되어 있습니다.`,
    );
  }
  return parts.join(' ');
}

function faqBlock(g, displayName) {
  const name = escHtml(displayName);
  const items = [
    [
      `${name}, 설치 없이 바로 할 수 있나요?`,
      '네. 별도 프로그램이나 에뮬레이터를 내려받지 않아도 브라우저에서 바로 실행됩니다. 다만 첫 실행 때 원본 게임 데이터를 불러오는 시간이 필요합니다.',
    ],
    [
      '휴대폰에서도 되나요?',
      '화면은 표시되지만 터치 조작은 지원하지 않습니다. 모바일에서 즐기려면 블루투스 키보드나 게임패드를 연결해야 하며, PC 환경을 권장합니다.',
    ],
    [
      '진행 상황이 저장되나요?',
      '원본 게임이 배터리 백업이나 패스워드 저장을 지원하는 경우에만 저장할 수 있고, 브라우저를 닫으면 초기화될 수 있습니다. 긴 게임이라면 짧은 구간에서 저장이 되는지 먼저 확인해 보세요.',
    ],
    [
      '소리가 나지 않습니다.',
      '브라우저는 사용자가 페이지를 한 번 클릭하기 전까지 소리를 막습니다. 게임 화면을 한 번 클릭한 뒤 다시 시도해 보세요.',
    ],
  ];
  return `<dl class="faq">${items
    .map(([q, a]) => `<dt>${q}</dt><dd>${escHtml(a)}</dd>`)
    .join('')}</dl>`;
}

// The reference sections shared by every page. Curated pages already carry a
// hand-written intro, controls table and tips, so those parts are skipped for
// them and only the platform, library and FAQ sections are added.
function referenceSections(g, displayName, hasSample, part) {
  const plat = PLATFORM_INFO[g.category];
  const genreKey = g.genre && GENRE_INFO[g.genre] ? g.genre : null;
  const genre = genreKey ? GENRE_INFO[genreKey] : GENERIC_GENRE;
  const out = [];

  if (part === 'lead') {
    if (hasSample) return '';
    out.push(`<h2>${escHtml(displayName)} 기본 정보</h2>`);
    out.push(specTable(g, seoById.get(g.identifier), genreKey ? genre.label : ''));
    out.push(`<h2>어떤 게임인가요</h2>`);
    out.push(`<p>${escHtml(buildIntro(g))}</p>`);
    out.push(`<p>${escHtml(genre.summary)}</p>`);
    return out.join('\n');
  }

  if (plat) {
    // Appositive rather than a 은/는 particle: the correct particle depends on
    // whether the platform name ends in a consonant, which varies across these
    // labels (아타리 2600, PC엔진, 원더스완 ...).
    out.push(`<h2>${escHtml(plat.label)}, 어떤 기기인가요</h2>`);
    out.push(`<p>${escHtml(plat.summary)}</p>`);
    out.push(`<p>${escHtml(libraryContext(g))}</p>`);
    if (!hasSample) {
      out.push(`<h2>조작법</h2>`);
      out.push(
        `<table class="controls"><tbody>${plat.rows
          .map(([a, k]) => `<tr><th scope="row">${escHtml(a)}</th><td>${escHtml(k)}</td></tr>`)
          .join('')}</tbody></table>`,
      );
    }
    out.push(`<p class="note">${escHtml(plat.note)}</p>`);
  }

  if (!hasSample) {
    out.push(`<h2>플레이 전 알아두기</h2>`);
    out.push(`<ul class="tips">${genre.tips.map((t) => `<li>${escHtml(t)}</li>`).join('')}</ul>`);
  }

  out.push(`<h2>자주 묻는 질문</h2>`);
  out.push(faqBlock(g, displayName));
  return out.join('\n');
}

// A de-duplicated slug is only a near-duplicate when nothing distinguishes it
// from the primary page; a curated SEO entry has its own keyword and copy.
function isNearDuplicate(g) {
  return g.isDuplicate && !seoById.has(g.identifier);
}

function gamePage(g) {
  const url = `${SITE_URL}/games/${g.slug}.html`;
  const canonicalUrl = isNearDuplicate(g) ? `${SITE_URL}/games/${g.primarySlug}.html` : url;
  const seo = seoById.get(g.identifier);
  const sample = seo?.sample;
  const title = escHtml(g.title);
  const koTitle = escHtml(seo?.koTitle || '');
  const displayTitle = seo ? koTitle : title;
  const genreKo = (g.genre && GENRE_KO[g.genre]) || g.genre || '';
  const metaDescription = sample
    ? sample.metaDescription
    : seo
      ? `${seo.koTitle}(${seo.enTitle}) ${g.meta.ko}${genreKo ? ` ${genreKo}` : ''} 고전게임을 설치 없이 온라인으로 플레이하세요. 기본 조작법과 관련 게임도 함께 확인할 수 있습니다.`
      : buildIntro(g);
  const desc = escHtml(fitDesc(metaDescription, `${g.meta.ko} 레트로 게임을 다운로드나 에뮬레이터 설치 없이 브라우저에서 바로 무료로 플레이하세요.`));
  const intro = escHtml(buildIntro(g));
  const yearLabel = g.year || '????';
  const related = relatedGames(g);
  const directArticles = Object.entries(articleGameLinks).filter(([, ids]) => ids.includes(g.identifier)).map(([slug]) => slug);
  const broadArticles = [];
  if (g.category === 'softwarelibrary_msdos_games') broadArticles.push('best-dos-games');
  if (g.category === 'internetarcade') broadArticles.push('best-arcade-games');
  if (g.category === 'sega_genesis_library') broadArticles.push('best-mega-drive-games');
  if (g.category === 'psxgames') broadArticles.push('best-ps1-games');
  if (g.category === 'atari_2600_library') broadArticles.push('best-atari-2600-games');
  if (g.genre === 'racing') broadArticles.push('best-retro-racing-games');
  if (g.genre === 'puzzle') broadArticles.push('best-retro-puzzle-games');
  if (!directArticles.length && !broadArticles.length) broadArticles.push('free-retro-games-online');
  const articleSlugs = [...new Set([...directArticles, ...broadArticles])].slice(0, 3);
  const articleHtml = articleSlugs.length ? `<section class="article-links"><h2>${displayTitle} 관련 공략·추천 글</h2><ul>${articleSlugs.map((slug) => `<li><a href="../articles/${slug}.html">${escHtml(ARTICLE_TITLES[slug])}</a></li>`).join('')}</ul></section>` : '';
  const relHtml = related.length
    ? `<div class="related"><h2>관련 게임</h2><ul>${related.map((r) => {
      const relatedSeo = seoById.get(r.identifier);
      const relatedName = seo && relatedSeo ? `${relatedSeo.koTitle} (${r.title})` : r.title;
      return `<li><a href="${escHtml(r.slug)}.html">${escHtml(relatedName)} (${r.year || '????'})</a></li>`;
    }).join('')}</ul></div>`
    : '';
  const displayName = seo ? seo.koTitle : g.title;
  const curated = sample
    ? `<h2>${koTitle} 게임 소개</h2>
<p>${escHtml(sample.intro)}</p>
<h2>${koTitle} 조작법</h2>
<table class="controls"><tbody>${sample.controls.map(([action, key]) => `<tr><th scope="row">${escHtml(action)}</th><td>${escHtml(key)}</td></tr>`).join('')}</tbody></table>
<h2>초보자 공략</h2>
<ul class="tips">${sample.tips.map((tip) => `<li>${escHtml(tip)}</li>`).join('')}</ul>`
    : '';
  const leadArticle = `<article>
${curated}${referenceSections(g, displayName, Boolean(sample), 'lead')}
</article>`;
  const detailArticle = `<article>
${referenceSections(g, displayName, Boolean(sample), 'detail')}
</article>`;
  const pageTitle = seo
    ? fitTitle(
        [
          `${seo.primaryKeyword} - ${seo.enTitle} | 게임다방`,
          `${seo.primaryKeyword} - ${seo.enTitle}`,
          `${seo.primaryKeyword} | ${seo.koTitle} (${seo.enTitle})`,
          `${seo.primaryKeyword} | ${seo.koTitle} (${seo.enTitle}) - 게임다방`,
        ],
        (t) => t.includes(seo.koTitle) && t.includes(seo.enTitle),
      )
    : fitTitle([
        `${g.title} 온라인 무료 플레이 - ${g.meta.ko} ${genreKo} 게임 | 게임다방`,
        `${g.title} 온라인 무료 플레이 - ${g.meta.ko} ${genreKo} 게임`,
        `${g.title} 온라인 무료 플레이 - ${g.meta.ko} 게임`,
        `${g.title} - ${g.meta.ko} 무료 게임 | 게임다방`,
        `${g.title} - ${g.meta.ko} 무료 게임`,
        `${g.title} - ${g.meta.ko}`,
      ]);
  const ogTitle = seo
    ? `${seo.primaryKeyword} | ${seo.koTitle} (${seo.enTitle})`
    : `${g.title} 온라인 무료 플레이 | 게임다방`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: seo ? seo.koTitle : g.title,
    alternateName: seo ? seo.enTitle : undefined,
    genre: genreKo || undefined,
    datePublished: g.year ? String(g.year) : undefined,
    gamePlatform: g.meta.ko,
    url: canonicalUrl,
  };
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(pageTitle)}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonicalUrl}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escHtml(ogTitle)}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="${OG_IMAGE}">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">\n<link rel="apple-touch-icon" href="../icon-192.png">
<link rel="stylesheet" href="../style.css">
<style>${PAGE_CSS}${SAMPLE_CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${ADSENSE_SNIPPET}
</head>
<body>
<div class="wrap">
<div class="crumb"><a href="../index.html">홈</a> &rsaquo; <a href="../guide/${g.category}.html">${escHtml(g.meta.ko)}</a> &rsaquo; ${displayTitle}</div>
<h1>${seo ? escHtml(seo.primaryKeyword) : title}</h1>${seo ? `\n<div class="en-title">${title}</div>` : ''}
<div class="meta">${yearLabel} · ${escHtml(g.meta.ko)}${genreKo ? ' · ' + escHtml(genreKo) : ''}</div>
${leadArticle}
<a class="cta" href="${playHref(g, '../')}">🕹️ ${seo ? `${koTitle} 바로 플레이하기` : '지금 무료로 플레이하기'}</a>
${detailArticle}
${articleHtml}
${relHtml}
<footer><a href="../guide.html">← 게임소개 목록으로</a> · <a href="../index.html">전체 게임 갤러리</a></footer>
</div>
</body>
</html>`;
}

function guidePlatformPage(cat, list) {
  const meta = PLAT_META[cat] || { ko: '레트로', code: 'retro' };
  const sorted = [...list].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  const items = sorted.map((g) => { const seo = seoById.get(g.identifier); const label = seo ? `${seo.koTitle} (${seo.enTitle})` : g.title; return `<li><a href="../games/${escHtml(g.slug)}.html"><img loading="lazy" src="https://archive.org/services/img/${encodeURIComponent(g.identifier)}" alt="" onerror="this.style.display='none'"><span class="ti">${escHtml(label)}</span><span class="yr">${g.year || '????'}</span></a></li>`; }).join('');
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
<link rel="icon" type="image/svg+xml" href="../favicon.svg">\n<link rel="apple-touch-icon" href="../icon-192.png">
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
<link rel="icon" type="image/svg+xml" href="favicon.svg">\n<link rel="apple-touch-icon" href="icon-192.png">
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
  ...games.filter((g) => !isNearDuplicate(g)).map((g) => `${SITE_URL}/games/${g.slug}.html`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${escXml(u)}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

// catalog.json - the gallery data index.html needs, as columnar rows with
// category/genre dictionaries. index.html used to inline this as 338KB of
// object literals; the columnar form is 179KB and, fetched rather than
// inlined, keeps it out of the HTML parse.
const catCodes = [...new Set(games.map((g) => g.category))];
const genreCodes = [...new Set(games.map((g) => g.genre || ''))];
const catalog = {
  c: catCodes,
  g: genreCodes,
  r: games.map((g) => [
    g.identifier,
    g.title,
    g.year || 0,
    catCodes.indexOf(g.category),
    genreCodes.indexOf(g.genre || ''),
    g.downloads || 0,
    g.fav ? 1 : 0,
  ]),
};
fs.writeFileSync(path.join(ROOT, 'catalog.json'), JSON.stringify(catalog));

// robots.txt
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`generated ${games.length} game pages (${games.filter(isNearDuplicate).length} canonicalised duplicates), ${byCategory.size} guide pages, sitemap with ${urls.length} urls`);
