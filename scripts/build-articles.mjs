import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'articles');
const SITE = 'https://bamboostand.kr';
fs.mkdirSync(OUT, { recursive: true });

const articles = [
  {slug:'best-dos-games',title:'90년대 도스게임 명작 TOP 20',desc:'지금 다시 해도 재미있는 90년대 도스게임 20선을 장르와 입문 난이도로 정리했습니다.',items:['페르시아의 왕자','둠 2','울펜슈타인 3D','심시티','고인돌 2','재즈 잭래빗','어둠 속에 나 홀로','원숭이 섬의 비밀','듄 2','테마파크'],cta:'../guide/softwarelibrary_msdos_games.html',ctaLabel:'도스게임 전체 보기'},
  {slug:'best-arcade-games',title:'추억의 오락실게임 추천 TOP 30',desc:'짧게 즐겨도 손맛이 살아 있는 추억의 오락실게임 추천 목록과 선택 기준을 소개합니다.',items:['아웃런','디그더그','팩맨','프로거','테트리스','갤러그 계열 슈팅','동키콩','버거타임','페이퍼보이','문 패트롤'],cta:'../guide/internetarcade.html',ctaLabel:'오락실게임 전체 보기'},
  {slug:'free-retro-games-online',title:'설치 없이 즐기는 무료 고전게임 가이드',desc:'다운로드 없이 브라우저에서 고전게임을 즐기는 방법과 실행 전 확인할 점을 정리했습니다.',items:['브라우저 호환성 확인','첫 실행 로딩 기다리기','게임 화면 클릭으로 소리 활성화','조작법 버튼 확인','전체 화면과 화면 배율 활용'],cta:'../index.html',ctaLabel:'무료 고전게임 찾기'},
  {slug:'best-mega-drive-games',title:'메가드라이브 명작 게임 추천',desc:'액션과 속도감이 뛰어난 메가드라이브 명작을 초보자 관점에서 추천합니다.',items:['소닉 더 헤지혹','베어 너클 2','골든 액스','건스타 히어로즈','알라딘','코믹스 존','벡터맨','캐슬바니아 블러드라인','아웃런 2019','토 잼 앤 얼'],cta:'../guide/sega_genesis_library.html',ctaLabel:'메가드라이브 게임 보기'},
  {slug:'best-ps1-games',title:'PS1 명작 게임 추천과 플레이 팁',desc:'플레이스테이션 1 입문자가 즐기기 좋은 명작과 웹 플레이 시 로딩 팁을 안내합니다.',items:['철권 3','메탈기어 솔리드','캐슬바니아 월하의 야상곡','파이널 판타지 7','크래시 밴디쿳','스파이로 더 드래곤','토니 호크 프로 스케이터 2','바이오하자드 2'],cta:'../guide/psxgames.html',ctaLabel:'PS1 게임 전체 보기'},
  {slug:'retro-games-with-kids',title:'부모와 아이가 함께하기 좋은 고전게임',desc:'규칙이 단순하고 한 판이 짧아 가족이 함께 즐기기 좋은 레트로게임을 소개합니다.',items:['테트리스','프로거','팩맨','버거타임','디그더그','소닉 더 헤지혹','알렉스 키드','로드 러너'],cta:'../index.html',ctaLabel:'가족용 게임 찾기'},
  {slug:'best-retro-racing-games',title:'고전 레이싱게임 추천',desc:'아웃런부터 테스트 드라이브까지 시대별 고전 레이싱게임의 재미와 입문 포인트를 정리했습니다.',items:['아웃런','행온','슈퍼 행온','테스트 드라이브','스턴츠','로드 래시','탑 기어 2','릿지 레이서'],cta:'../index.html?genre=racing',ctaLabel:'레이싱게임 둘러보기'},
  {slug:'best-retro-puzzle-games',title:'고전 퍼즐게임 추천',desc:'규칙은 쉽고 반복 플레이 가치가 높은 고전 퍼즐게임을 추천합니다.',items:['테트리스','아칸노이드 2','수파플렉스','컬럼스','로스트 바이킹','레밍즈','파이프 드림','블록아웃'],cta:'../index.html?genre=puzzle',ctaLabel:'퍼즐게임 둘러보기'},
  {slug:'prince-of-persia-beginner-guide',title:'페르시아의 왕자 조작법과 초보 공략',desc:'페르시아의 왕자 도스판 기본 조작, 점프 타이밍과 초반 생존 요령을 설명합니다.',items:['방향키로 이동하고 위쪽 키로 제자리 점프','달리다가 위쪽 키를 눌러 멀리 점프','Shift를 누른 채 이동하면 조심스럽게 걷기','낭떠러지 앞에서는 걷기로 전환','전투에서는 거리 유지 후 공격과 방어 반복'],cta:'../games/prince-of-persia-msdos.html',ctaLabel:'페르시아의 왕자 플레이'},
  {slug:'pac-man-high-score-guide',title:'팩맨 고득점 기본 공략',desc:'팩맨 초보자가 오래 생존하고 점수를 높이는 동선과 파워 펠릿 활용법을 정리했습니다.',items:['처음부터 모든 점을 무리하게 먹지 않기','유령의 현재 위치보다 진행 방향 관찰','파워 펠릿은 포위될 때 사용할 수 있도록 남기기','터널을 도주 경로로 활용','과일은 안전한 동선일 때만 노리기'],cta:'../games/pac-man-msdos.html',ctaLabel:'팩맨 플레이'},
  {slug:'best-atari-2600-games',title:'아타리 2600 대표 게임 추천',desc:'가정용 게임기의 초창기를 대표하는 아타리 2600 명작과 입문 순서를 소개합니다.',items:['스페이스 인베이더','피트폴','리버 레이드','프로거','미사일 커맨드','어드벤처','컴뱃','버저크'],cta:'../guide/atari_2600_library.html',ctaLabel:'아타리 2600 게임 보기'},
  {slug:'quick-arcade-games',title:'짧게 즐기기 좋은 오락실게임',desc:'5분에서 15분 사이에 부담 없이 한 판 즐기기 좋은 오락실게임을 모았습니다.',items:['팩맨','디그더그','프로거','버거타임','문 패트롤','큐버트','페이퍼보이','테트리스'],cta:'../guide/internetarcade.html',ctaLabel:'오락실게임 바로 찾기'},
  {slug:'prehistorik-2-beginner-guide',title:'고인돌 2 조작법과 숨겨진 요소',desc:'고인돌 2 초보자를 위한 기본 조작, 아이템 수집과 스테이지 진행 요령을 정리했습니다.',items:['방향키로 이동하고 액션 키로 공격','높은 곳은 점프 거리부터 확인','배경과 어울리지 않는 벽을 탐색','적을 무시하기보다 안전하게 제거','체력 회복 아이템은 위험 구간 전에 확보'],cta:'../games/prehistorik-2-msdos.html',ctaLabel:'고인돌 2 플레이'},
  {slug:'simcity-beginner-guide',title:'심시티 초보 도시 운영법',desc:'심시티 초보자가 적자를 피하고 안정적인 도시를 만드는 기본 순서를 안내합니다.',items:['주거·상업·공업 구역의 균형 유지','도로와 전기는 필요한 만큼만 건설','세율을 급격하게 바꾸지 않기','소방과 경찰은 수요가 생긴 뒤 확충','예산 적자 때 신규 개발 잠시 중단'],cta:'../games/simcity-msdos.html',ctaLabel:'심시티 플레이'},
  {slug:'wolfenstein-3d-controls-guide',title:'울펜슈타인 3D 기본 조작법',desc:'울펜슈타인 3D의 이동과 전투 조작, 초반 생존에 필요한 기본 습관을 설명합니다.',items:['방향키로 전진·후진·회전','문 앞에서는 적의 소리를 먼저 확인','탄약이 부족하면 짧게 끊어 쏘기','벽의 다른 무늬를 비밀 통로로 의심','체력과 탄약을 남긴 채 다음 구역 진입'],cta:'../games/wolfenstein-3d-msdos.html',ctaLabel:'울펜슈타인 3D 플레이'},
  {slug:'doom-2-beginner-guide',title:'둠 2 초보자 생존 공략',desc:'둠 2를 처음 시작할 때 필요한 이동, 무기 선택과 적 대응 원칙을 정리했습니다.',items:['한곳에 멈추지 않고 좌우로 이동','약한 적에게 강한 탄약 낭비하지 않기','좁은 문을 방어 지점으로 활용','폭발 무기는 가까운 벽에서 사용 금지','새 방에 들어가기 전에 퇴로 확인'],cta:'../guide/softwarelibrary_msdos_games.html',ctaLabel:'둠 2와 도스게임 보기'},
  {slug:'outrun-route-controls-guide',title:'아웃런 코스 선택과 조작법',desc:'아웃런의 기본 조작과 분기 코스 선택, 충돌을 줄이는 초보 운전법을 안내합니다.',items:['가속은 유지하되 코너 전에 미리 감속','차량 사이 빈 공간을 먼저 확인','급조향보다 짧고 부드럽게 방향 조절','초보자는 완만한 분기 코스부터 선택','충돌 후 무리한 추월보다 속도 회복 우선'],cta:'../games/out-run-arcade.html',ctaLabel:'아웃런 플레이'},
  {slug:'tetris-beginner-stacking-guide',title:'테트리스 초보 블록 쌓기',desc:'테트리스 초보자가 빈틈을 줄이고 오래 버티는 기본 블록 쌓기 방법을 설명합니다.',items:['한쪽 끝에 긴 블록용 세로 공간 남기기','중앙을 지나치게 높이지 않기','막힌 구멍을 만드는 덮기 피하기','다음 블록을 보고 착지 위치 결정','테트리스보다 안전한 한 줄 제거 우선'],cta:'../games/tetris-msdos.html',ctaLabel:'테트리스 플레이'},
  {slug:'frogger-beginner-guide',title:'프로거 안전하게 길 건너는 법',desc:'프로거 초보자를 위한 차량 간격 읽기와 강 건너기 타이밍을 정리했습니다.',items:['한 번에 멀리 가지 않고 한 칸씩 확인','차량 속도가 다른 차선을 따로 관찰','중앙 안전지대에서 다음 구간 준비','통나무 끝보다 중앙에 올라타기','시간이 부족해도 무리한 연속 이동 피하기'],cta:'../games/atari-2600-frogger-atari2600.html',ctaLabel:'프로거 플레이'},
  {slug:'dig-dug-score-guide',title:'디그더그 초보 점수 공략',desc:'디그더그에서 적을 안전하게 처리하고 점수를 높이는 기본 동선과 바위 활용법을 소개합니다.',items:['막다른 터널을 만들지 않기','적이 가까우면 펌프를 짧게 반복','여러 적을 한 줄에 유도','바위 아래로 적을 끌어 높은 점수 노리기','마지막 적의 도주 경로를 미리 차단'],cta:'../games/internet-arcade-dig-dug-arcade.html',ctaLabel:'디그더그 플레이'}
];

const esc = (v) => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const css = `:root{--bg:#04101a;--panel:#082234;--fg:#d6f0ff;--dim:#7fa3ba;--accent:#23c4ff;--accent2:#48e0c0;--border:#17425d}*{box-sizing:border-box}body{margin:0;padding:24px;background:var(--bg);color:var(--fg);font-family:system-ui,sans-serif}.wrap{max-width:900px;margin:auto}a{color:var(--accent2)}nav{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:28px}h1{color:var(--accent);line-height:1.25}h2{color:var(--accent2);margin-top:32px}p,li{line-height:1.8}.lead{font-size:18px;color:var(--dim)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}.card{display:block;padding:18px;border:1px solid var(--border);background:var(--panel);border-radius:10px;text-decoration:none;color:var(--fg)}.card:hover{border-color:var(--accent)}.card p{color:var(--dim);font-size:14px}.cta{display:inline-block;margin:22px 0;padding:13px 20px;background:var(--accent);color:var(--bg);border-radius:8px;text-decoration:none;font-weight:800}.note{padding:14px 18px;border-left:4px solid var(--accent2);background:var(--panel)}@media(max-width:600px){body{padding:16px}h1{font-size:28px}}`;
const nav = `<nav><a href="../index.html">게임 홈</a><a href="../guide.html">게임소개</a><a href="index.html">레트로게임 가이드</a></nav>`;

for (const a of articles) {
  const canonical = `${SITE}/articles/${a.slug}.html`;
  const list = a.items.map((x,i)=>`<li><strong>${i+1}. ${esc(x)}</strong></li>`).join('');
  const jsonLd = JSON.stringify({"@context":"https://schema.org","@type":"Article",headline:a.title,description:a.desc,mainEntityOfPage:canonical,author:{"@type":"Organization",name:"게임다방"},publisher:{"@type":"Organization",name:"게임다방"}});
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(a.title)} | 게임다방</title><meta name="description" content="${esc(a.desc)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(a.title)}"><meta property="og:description" content="${esc(a.desc)}"><style>${css}</style><script type="application/ld+json">${jsonLd}</script></head><body><main class="wrap">${nav}<article><h1>${esc(a.title)}</h1><p class="lead">${esc(a.desc)}</p><p>게임 선택이 어렵다면 조작이 단순하고 한 판의 목표가 분명한 작품부터 시작하는 것이 좋습니다. 아래 목록은 인지도뿐 아니라 지금 브라우저에서 다시 즐겼을 때의 접근성과 장르 다양성을 함께 고려했습니다.</p><h2>추천 목록과 선택 포인트</h2><ol>${list}</ol><h2>처음 플레이할 때 확인할 점</h2><p>게임마다 키 배치와 로딩 시간이 다릅니다. 플레이 화면의 조작법 안내를 먼저 확인하고, 소리가 나지 않으면 게임 화면을 한 번 클릭하세요. 모바일에서는 터치 조작이 지원되지 않으므로 가로 화면과 블루투스 키보드 또는 게임패드를 권장합니다.</p><div class="note">저장 기능이나 게임패드 인식은 원본 에뮬레이터와 브라우저 환경에 따라 달라질 수 있습니다. 중요한 진행은 한 번에 끝낼 수 있는 짧은 구간부터 시험하세요.</div><a class="cta" href="${a.cta}">${esc(a.ctaLabel)} →</a></article></main></body></html>`;
  fs.writeFileSync(path.join(OUT, `${a.slug}.html`), html);
}

const cards = articles.map(a=>`<a class="card" href="${a.slug}.html"><h2>${esc(a.title)}</h2><p>${esc(a.desc)}</p></a>`).join('');
fs.writeFileSync(path.join(OUT,'index.html'),`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>레트로게임 가이드 | 게임다방</title><meta name="description" content="도스게임, 오락실게임, 메가드라이브, PS1 추천과 초보 공략을 모은 게임다방 정보 가이드입니다."><link rel="canonical" href="${SITE}/articles/"><style>${css}</style></head><body><main class="wrap">${nav}<h1>📚 레트로게임 가이드</h1><p class="lead">추천작, 조작법, 초보 공략을 읽고 바로 게임을 시작하세요.</p><div class="grid">${cards}</div></main></body></html>`);

const sitemapPath = path.join(ROOT,'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath,'utf8');
sitemap = sitemap.replace(/\n<url><loc>https:\/\/bamboostand\.kr\/articles\/.*?<\/loc><\/url>/g,'');
const articleUrls = [`${SITE}/articles/`, ...articles.map(a=>`${SITE}/articles/${a.slug}.html`)];
sitemap = sitemap.replace('</urlset>', `${articleUrls.map(u=>`\n<url><loc>${u}</loc></url>`).join('')}\n</urlset>`);
fs.writeFileSync(sitemapPath,sitemap);
console.log(`generated ${articles.length} articles and article index`);
