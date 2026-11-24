/* =========================================================
   Piksel Zeynep v4 — kullanıcının kendi piksel görsellerinden "cutout" animasyon (önden + yandan + yerde)
   Parçalar: assets/img/karakter/*.png (kaynak/karakter_parcala.py üretir)
   - Kollar: omuz + dirsek eklemi, 2 kemik ters kinematik (IK) + yay fiziği
   - Bacaklar: kalça eklemi, yay/sarkaç fiziği
   - Yüz ifadeleri: göz kırpma, mutlu, "x x", ağız açma (yüzün üstüne piksel boyama)
   - Eşyalar piksel-art (görselin piksel boyutunda): telefon, kitap, konsol, kulaklık, bayrak
   ========================================================= */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || (() => { try { return localStorage.getItem('azaltHareket') === '1'; } catch (e) { return false; } })(); // sistem tercihi ya da kılavuzdaki ayar
  const HOVER = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const SRC = (document.currentScript && document.currentScript.src) || '';
  const IMG_BASE = SRC.replace(/js\/karakter\.js.*$/, 'img/karakter/');

  /* ---------- Parça verisi (orijinal 1024x1536 görsel koordinatları) ---------- */
  const D = {"scale":0.36,"foot":[516,1520],"parts":{"head":{"x":185,"y":12,"w":651,"h":588,"px":516,"py":548},"torso":{"x":384,"y":548,"w":269,"h":387,"px":516,"py":925},"luarm":{"x":256,"y":548,"w":136,"h":242,"px":352,"py":610},"lfarm":{"x":277,"y":776,"w":115,"h":249,"px":345,"py":790},"ruarm":{"x":653,"y":553,"w":126,"h":237,"px":700,"py":610},"rfarm":{"x":651,"y":776,"w":110,"h":249,"px":705,"py":790},"lleg":{"x":280,"y":900,"w":242,"h":622,"px":468,"py":925},"rleg":{"x":522,"y":901,"w":228,"h":621,"px":578,"py":925}},
    "face":{"eyeL":[470,397],"eyeR":[612,397],"mouth":[535,483],"skin":[254,206,179]}};
  const PT = D.parts, FOOT = D.foot;
  let CELL = 14; // eşyaların piksel boyutu (yüz ifadeleri FACE_CELL ile çizilir)
  const FACE_CELL = 18; // önden çizimin piksel boyutu
  const HAND = { L: [342, 960], R: [696, 960] };   // dinlenme hâlinde el merkezleri
  const imgs = {}; let loaded = 0;
  Object.keys(PT).forEach(k => { const im = new Image(); im.onload = () => loaded++; im.src = IMG_BASE + k + '.png'; imgs[k] = im; });

  /* ---------- Yan görünüm + yere yapışık hâl (kaynak/karakter_yan_hazirla.py üretir) ---------- */
  const SIDE = {"govde":{"x":112,"y":11,"w":662,"h":961},"bacak":{"x":331,"y":936,"w":334,"h":585},"kol":{"x":425,"y":795,"w":135,"h":239},"foot":[515,1520],"hip":[500,955],"shoulder":[482,650],"hand":[487,990],"yere":{"x":238,"y":204,"w":1303,"h":589,"ground":734,"feet":1540,"sc":1.1085}};
  const sideImgs = {};
  // arka kol/bacak için koyulaştırılmış kopya
  const darker = im => { const cv2 = document.createElement('canvas'); cv2.width = im.width; cv2.height = im.height; const x = cv2.getContext('2d'); x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(30,27,46,.32)'; x.fillRect(0, 0, im.width, im.height); return cv2; };
  [['govde', 'yan_govde'], ['bacak', 'yan_bacak'], ['kol', 'yan_kol'], ['yere', 'yere']].forEach(([k, f]) => {
    const im = new Image(); im.onload = () => { loaded++; if (k === 'bacak' || k === 'kol') sideImgs[k + 'D'] = darker(im); }; im.src = IMG_BASE + f + '.png'; sideImgs[k] = im;
  });

  /* ---------- Tam pozlar + kalkık kollar (kaynak/poz_hazirla.py üretir) ---------- */
  const POSE = {"yasasin":{"x":62,"y":33,"w":898,"h":1490,"foot":[520,1522],"sc":1.0128,"fists":{"L":[137,351],"R":[880,352]}},"arka":{"x":573,"y":58,"w":388,"h":951,"foot":[766,1008],"sc":1.5874},"kasima":{"x":1019,"y":18,"w":449,"h":991,"foot":[1231,1008],"sc":1.5874},"elL":{"x":177,"y":8,"w":516,"h":1011,"foot":[468,1018],"sc":1.4931,"fist":[228,188]},"elR":{"x":843,"y":8,"w":517,"h":1011,"foot":[1085,1018],"sc":1.4931,"fist":[1308,229]},"otur":{"x":224,"y":36,"w":311,"h":426,"foot":[385,461],"sc":2.5084},"zipla":{"x":605,"y":0,"w":327,"h":439,"foot":[756,438],"sc":2.9511},"telefon":{"x":259,"y":20,"w":529,"h":855,"foot":[520,874],"sc":1.3473},"kitap":{"x":969,"y":21,"w":552,"h":854,"foot":[1222,874],"sc":1.3143},"gitar":{"x":153,"y":31,"w":825,"h":1495,"foot":[506,1525],"sc":1.0094},"comel":{"x":233,"y":28,"w":768,"h":1271,"foot":[572,1298],"sc":0.9253,"hand":[340,872]}};
  const poseImgs = {};
  [['kasima', 'poz_kasima'], ['arka', 'poz_arka'], ['otur', 'poz_otur'], ['yasasin', 'poz_yasasin'], ['zipla', 'poz_zipla'], ['elL', 'poz_elL'], ['elR', 'poz_elR'], ['telefon', 'poz_telefon'], ['kitap', 'poz_kitap'], ['gitar', 'poz_gitar'], ['comel', 'poz_comel']].forEach(([k, f]) => {
    const im = new Image(); im.onload = () => loaded++; im.src = IMG_BASE + f + '.png'; poseImgs[k] = im;
  });
  // kalkık kol: "yaşasın" görselinden kesildi; omuz ekseni (iskelet koordinatlarında) etrafında döner
  const UP_OFF = [13, 8], UP_PIV = { L: [342, 478], R: [690, 478] };
  // eski ayrık kol verisi (POSE.kolL/kolR) artık yok: kollar hazır pozlarla çiziliyor. Veri yoksa 0 (yoksa hata çizim döngüsünü durdurup karakteri siliyordu)
  const upNat = s => { const P = POSE['kol' + s], v = UP_PIV[s]; if (!P || !v) return 0; return Math.atan2(P.fist[1] + UP_OFF[1] - v[1], P.fist[0] + UP_OFF[0] - v[0]); };
  const upMat = (base, s, a) => { const v = UP_PIV[s]; return new DOMMatrix(base).translate(v[0], v[1]).rotate(a * 180 / Math.PI).translate(-v[0], -v[1]).translate(UP_OFF[0], UP_OFF[1]); };
  const HP_OFF = { elL: -20, elR: 20 }; // dans pozlarında kulaklığın yatay kayması (iskelet birimi)
  const SIT = { eyes: [[375, 226], [456, 223]], skin: '#e7c0ad', rx: 18, ry: 15, r: 12, lw: 3.5 }; // oturma pozunda göz kapama (görsel koordinatı)

  const COL = { ink: '#1e1b2e', pink: '#ff48b0', pinkSh: '#d42b8c', blue: '#0078bf', blueSh: '#005a92', yellow: '#ffe800', yellowSh: '#d9b400',
    red: '#e30a17', redSh: '#b30010', white: '#ffffff', paper: '#f6f1e7', gray: '#b9b0c9', dark: '#2f2a45', screen: '#bfe9ff', skin: `rgb(${D.face.skin})`, mouth: '#a8204e' };

  /* ---------- Matematik ---------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ARM = {};
  ['L', 'R'].forEach(s => {
    const u = PT[s === 'L' ? 'luarm' : 'ruarm'], f = PT[s === 'L' ? 'lfarm' : 'rfarm'];
    const S0 = [u.px, u.py], E0 = [f.px, f.py], H0 = HAND[s];
    ARM[s] = { S0, E0, H0, L1: dist(S0, E0), L2: dist(E0, H0), restU: ang(S0, E0), restF: ang(E0, H0) };
  });
  // 2 kemik IK: el hedefine göre omuz ve dirsek dönüşleri
  function ik(s, T) {
    const A = ARM[s], S = A.S0;
    let d = clamp(dist(S, T), Math.abs(A.L1 - A.L2) + 1, A.L1 + A.L2 - .5);
    const th = ang(S, T);
    const al = Math.acos(clamp((A.L1 * A.L1 + d * d - A.L2 * A.L2) / (2 * A.L1 * d), -1, 1));
    const dU = s === 'L' ? th + al : th - al;           // dirsek dışa baksın
    const E = [S[0] + Math.cos(dU) * A.L1, S[1] + Math.sin(dU) * A.L1];
    const dF = ang(E, T);
    const up = dU - A.restU;
    return { up, fore: (dF - A.restF) - up, E, H: [E[0] + Math.cos(dF) * A.L2, E[1] + Math.sin(dF) * A.L2] };
  }
  // yay: değer + hız
  const spring = (o, target, k = .12, damp = .78) => { o.v = (o.v + (target - o.p) * k) * damp; o.p += o.v; return o.p; };
  const sp = v => ({ p: v, v: 0 });

  /* ---------- Piksel boyama (görselin piksel ölçeğinde) ---------- */
  let ctx; // aktif çizim bağlamı
  const cell = (x, y, c, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(x, y, CELL * w + .6, CELL * h + .6); };
  function grid(rows, ox, oy, pal) {
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x]; if (ch !== '.' && pal[ch]) cell(ox + x * CELL, oy + y * CELL, pal[ch]);
    }
  }

  /* ---------- Yüz ifadeleri (kafa uzayında) ---------- */
  function face(expr, mouth) {
    const F = D.face, C0 = CELL; CELL = FACE_CELL;
    if (expr && expr !== 'open') {
      [F.eyeL, F.eyeR].forEach(([x, y]) => {
        ctx.fillStyle = COL.skin; ctx.beginPath(); ctx.ellipse(x, y + 2, 34, 38, 0, 0, Math.PI * 2); ctx.fill();
        const ox = x - CELL * 2, oy = y - CELL;
        if (expr === 'closed') grid(['#..#', '.##.'], ox, oy + CELL, { '#': COL.ink });           // ‿ uyku / kırpma
        if (expr === 'happy') grid(['.##.', '#..#'], ox, oy, { '#': COL.ink });                    // ^ ^
        if (expr === 'x') grid(['#..#', '.##.', '.##.', '#..#'], ox, oy - CELL * .5, { '#': COL.ink });
        if (expr === 'wince') grid(['##..', '..##', '##..'], x < 508 ? ox : ox, oy, { '#': COL.ink }); // > <
      });
    }
    const [mx, my] = F.mouth;
    if (mouth === 'open') { ctx.fillStyle = COL.skin; ctx.fillRect(mx - 26, my - 14, 52, 26); grid(['.##.', '#rr#', '#rr#', '.##.'], mx - CELL * 2, my - CELL * 1.2, { '#': COL.ink, r: COL.mouth }); }
    if (mouth === 'o') { ctx.fillStyle = COL.skin; ctx.fillRect(mx - 26, my - 14, 52, 26); grid(['.#.', '#r#', '.#.'], mx - CELL * 1.5, my - CELL, { '#': COL.ink, r: COL.mouth }); }
    CELL = C0;
  }

  /* ---------- Eşyalar ---------- */
  function headphones() {
    ctx.save();
    for (let a = Math.PI * 1.02; a <= Math.PI * 1.98; a += .025) { // kafa bandı
      const x = 512 + Math.cos(a) * 300, y = 330 + Math.sin(a) * 318;
      cell(x - CELL, y - CELL, COL.ink, 2.2, 2.2); cell(x - CELL * .6, y - CELL * .6, COL.blue, 1.4, 1.4);
    }
    const cup = ['.####.', '#ppPP#', '#ppPP#', '#pppP#', '#pppP#', '#ppPP#', '#ppPP#', '.####.'];
    grid(cup, 170, 300, { '#': COL.ink, p: COL.pink, P: COL.pinkSh });
    grid(cup, 770, 300, { '#': COL.ink, p: COL.pink, P: COL.pinkSh });
    ctx.restore();
  }
  function phone(x, y, t) {
    const ox = x - CELL * 3, oy = y - CELL * 11;
    const rows = ['.######.', '#dddddd#', '#dssssd#', '#dssssd#', '#dssssd#', '#dssssd#', '#dssssd#', '#dssssd#', '#dssssd#', '#dssssd#', '#dddddd#', '#ddwwdd#', '.######.'];
    grid(rows, ox, oy, { '#': COL.ink, d: COL.dark, s: COL.screen, w: '#5b5575' });
    // ekranda kayan mesaj balonları
    const k = Math.floor(t / 70) % 3;
    const bubbles = [[1, 3, COL.pink, 3], [2, 5, COL.blue, 3], [1, 7, COL.pink, 2], [2, 9, COL.blue, 2]];
    bubbles.forEach(([bx, by, c, w], i) => { const yy = by - k; if (yy >= 3 && yy <= 9) cell(ox + (bx + 1) * CELL, oy + yy * CELL, c, w * .9, .8); });
  }
  function book(x, y, t) {
    const ox = x - CELL * 9, oy = y - CELL * 6;
    const rows = [
      '.########.########.', '#wwwwwwwwPwwwwwwww#', '#wgggggwwPwgggggww#', '#wwwwwwwwPwwwwwwww#', '#wggggwwwPwgggggww#',
      '#wwwwwwwwPwwwwwwww#', '#wgggggwwPwggggwww#', '#wwwwwwwwPwwwwwwww#', '#wggggwwwPwgggggww#', '#bbbbbbbbbbbbbbbbb#', '.#################.'];
    grid(rows, ox, oy, { '#': COL.ink, w: COL.white, g: COL.gray, P: '#d8d0e6', b: COL.blue });
    const ph = (t % 160) / 160; // sayfa çevirme
    if (ph < .25) { const px = ox + CELL * (17 - ph * 4 * 8); cell(px, oy + CELL, '#fffaf0', 1.2, 8); cell(px - CELL * .2, oy + CELL, COL.ink, .25, 8); }
  }
  function consoleToy(x, y, t) {
    const ox = x - CELL * 7, oy = y - CELL * 5;
    const rows = ['.############.', '#yyyyyyyyyyyy#', '#y#########yy#', '#y#ssssssss#y#', '#y#ssssssss#y#', '#y#ssssssss#y#', '#y#########yy#', '#yy#yyyyyyppy#', '#y###yyyyyyyY#', '#yy#yyyyyypyY#', '.############.'];
    grid(rows, ox, oy, { '#': COL.ink, y: COL.yellow, Y: COL.yellowSh, s: '#9be38f', p: COL.pink });
    // ekranda zıplayan küçük oyuncu + engel
    const j = Math.abs(Math.sin(t * .12)), ex = 10 - Math.floor((t / 6) % 9);
    cell(ox + CELL * 5, oy + CELL * (5 - Math.round(j * 1.6)), COL.ink, .9, .9);
    cell(ox + CELL * (ex < 3 ? 10 : ex), oy + CELL * 5, '#2b6b2b', .9, .9);
  }
  function flag(x, y, t) { // direk + dalgalanan Türk bayrağı (26 x 17 piksel)
    const top = y - CELL * 30;
    ctx.fillStyle = COL.ink; ctx.fillRect(x - CELL * .8, top, CELL * 1.6, y - top + CELL * 3);
    ctx.fillStyle = '#d9d2e6'; ctx.fillRect(x - CELL * .4, top, CELL * .8, y - top + CELL * 3);
    grid(['.#.', '#Y#', '.#.'], x - CELL * 1.5, top - CELL * 2.5, { '#': COL.ink, Y: COL.yellow });
    const FW = 26, FH = 17;
    for (let fx = 0; fx < FW; fx++) {
      const off = Math.sin(t * .15 - fx * .42) * (fx / FW) * 2.2;
      const shade = Math.sin(t * .15 - fx * .42 - .8) > .4;
      for (let fy = 0; fy < FH; fy++) {
        const d1 = Math.hypot(fx - 8.6, fy - 8), d2 = Math.hypot(fx - 10.6, fy - 8);
        const cres = d1 <= 6.1 && d2 > 4.9;
        const sx = fx - 16.3, sy = fy - 8, r = Math.hypot(sx, sy), a = Math.atan2(sy, sx) + Math.PI / 2;
        const star = r < 1.6 + 1.6 * Math.max(0, Math.cos(a * 5 / 2) ** 8) && r < 3.4;
        const edge = fy === 0 || fy === FH - 1 || fx === FW - 1;
        cell(x + CELL * (1 + fx), top + CELL * (fy + off), edge ? COL.ink : (cres || star) ? COL.white : shade ? COL.redSh : COL.red);
      }
    }
  }

  /* =========================================================
     KURULUM / DAVRANIŞ
     ========================================================= */
  const cv = document.createElement('canvas');
  cv.className = 'pixel-me'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const mctx = cv.getContext('2d');
  let K = .16, DPR = 1, VW = 0, VH = 0, GROUND = 0, home = 0;
  const c = { party: 0, say: 0, x: -300, y: 0, vx: 0, vy: 0, dir: 1, state: 'wait', st: 0, act: null, actT: 0, crashDir: 1, tx: 0, rot: 0, rotV: 0, sq: 1 };
  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2); VW = innerWidth; VH = innerHeight;
    const h = VW < 600 ? 150 : VW < 1100 ? 200 : 250;  // ekrandaki boy (px)
    K = h / 1510;
    cv.width = VW * DPR; cv.height = VH * DPR;
    GROUND = VH; home = VW < 600 ? VW - 60 : VW - 190;
    if (c.state !== 'wait') c.x = clamp(c.x, 60, VW - 60);
  }
  resize(); addEventListener('resize', resize);

  // eklem yayları (gövde koordinatlarında el hedefleri, bacak açıları)
  const J = { hLx: sp(HAND.L[0]), hLy: sp(HAND.L[1]), hRx: sp(HAND.R[0]), hRy: sp(HAND.R[1]), legL: sp(0), legR: sp(0), lean: sp(0), head: sp(0), bob: sp(0), upL: sp(0), upR: sp(0) };
  let t = 0, DT = 1, last = performance.now(), lastInput = performance.now();
  let mx = -999, my = -999, mvx = 0, mouseIn = false, cooldown = 0, shakes = 0, lastSign = 0, shakeDecay = 0, lastSY = scrollY;
  // performans: kaydırma konumu olaydan gelir (her karede scrollY okumak yerleşimi zorla hesaplatır)
  let curSY = scrollY, cageR = null, cageAge = 0;
  addEventListener('scroll', () => { curSY = window.__lenis ? window.__lenis.scroll : scrollY; cageR = null; }, { passive: true });
  addEventListener('resize', () => { cageR = null; });
  const cageRect = () => { if (!cageR || ++cageAge > 45) { cageR = cage.getBoundingClientRect(); cageAge = 0; } return cageR; };
  let handWorld = { L: [0, 0], R: [0, 0] }, tmInv = null;
  const V = { x: 0, y: 0, y0: 0, vx: 0 };
  const vw = { view: 'front', dir: 1, p: 0, tv: 'front', td: 1, sw: false }; // görünüm (önden/yandan) ve dönüş   // tutulan (sanal) imleç
  const parts = [];
  const unlock = id => window.__unlock && window.__unlock(id);
  const sfx = (n, a) => window.__sfx && window.__sfx(n, a); // 8-bit sesler (main.js)
  const lang = () => document.documentElement.lang === 'en' ? 'en' : 'tr';
  const set = s => { c.state = s; c.st = 0; };
  const tr = (a, b) => lang() === 'en' ? b : a;

  /* Giriş: başka sayfadan geldiyse soldan koşarak gelir */
  let runIn = false;
  try { runIn = sessionStorage.getItem('karakter-kos') === '1'; sessionStorage.removeItem('karakter-kos'); } catch (e) {}
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    const h = a.getAttribute('href') || '';
    if (h.startsWith('#') || h.startsWith('mailto') || h.startsWith('tel') || /^https?:/.test(h) || a.target === '_blank') return;
    try { sessionStorage.setItem('karakter-kos', '1'); } catch (er) {}
  }, true);
  /* Kafes: ana sayfada karakter "Hakkımda" bölümündeki çerçevede bekler; sürükleyip çıkarınca serbest kalır */
  const cage = document.querySelector('[data-pz-yuva]');
  let freed = false;
  try { freed = sessionStorage.getItem('karakter-serbest') === '1'; } catch (e) {}
  if (cage && freed) cage.classList.add('is-empty');
  const caged = () => cage && !freed;
  setTimeout(() => {
    if (caged()) { set('trapped'); return; }
    if (!cage && !freed) return; // henüz ana sayfadaki kafesten çıkarılmadı: başka sayfada görünmez
    if (RM) { c.x = home; set('idle'); return; }
    if (runIn) { c.x = -80; c.tx = VW * (.2 + Math.random() * .55); set('enter'); } else { c.x = home; c.y = 80; set('air'); }
  }, ((window.__introDelay ?? .6) * 1000) + 250);

  /* ---------- İmleci tutma: ağırlaşır, aşağı inmez, tıklama/kaydırma engellenir ---------- */
  const blocker = document.createElement('div');
  blocker.className = 'pz-block';
  const stopEv = e => { e.preventDefault(); e.stopPropagation(); };
  ['wheel', 'touchmove'].forEach(ev => blocker.addEventListener(ev, stopEv, { passive: false }));
  ['click', 'mousedown', 'mouseup', 'contextmenu'].forEach(ev => blocker.addEventListener(ev, stopEv));
  const SCROLL_KEYS = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'];
  const keyBlock = e => { if (c.state === 'hang' && SCROLL_KEYS.includes(e.key)) stopEv(e); if (c.state === 'hang' && e.key === 'Escape') release(); };
  addEventListener('keydown', keyBlock, true);
  function grab() {
    set('hang'); shakes = 0; c.act = null; c.rot = 0; c.rotV = 0;
    V.x = mx; V.y = my; V.y0 = my; V.vx = 0;
    window.__cursorHold = true; document.body.appendChild(blocker);
    window.__lenis && window.__lenis.stop();
    unlock('yakalandin'); sfx('grab');
  }
  function release() {
    window.__cursorHold = false; blocker.remove(); window.__lenis && window.__lenis.start();
    set('air'); c.vy = 3; c.vx = clamp(V.vx * .6, -10, 10); cooldown = 200; shakes = 0; sfx('release');
  }

  /* Girdiler */
  addEventListener('mousemove', e => {
    mvx = e.movementX || (e.clientX - mx); mx = e.clientX; my = e.clientY; mouseIn = true; poke();
    if (c.state === 'hang') { const sg = Math.sign(mvx); if (Math.abs(mvx) > 9 && sg && sg !== lastSign) { shakes++; lastSign = sg; shakeDecay = 0; } }
  }, { passive: true });
  document.addEventListener('mouseleave', () => { mouseIn = false; if (c.state === 'hang') release(); });
  addEventListener('keydown', poke);
  // karakterin üstünde mi? (dokununca zıplar, basılı tutup sürükleyince taşınır)
  const onChar = (x, y) => { const top = GROUND - c.y - 1480 * K; return Math.abs(x - c.x) < 250 * K && y > top && y < GROUND - c.y; };
  const DRAGGABLE = ['idle', 'act', 'walk', 'roam', 'run', 'enter', 'sleep', 'trapped'];
  let pd = null, hoverSet = false;
  const cursorState = st => window.__setCursor && window.__setCursor(st);
  addEventListener('pointerdown', e => {
    poke();
    if (c.state === 'terase' && (onChar(e.clientX, e.clientY) || (e.target.closest && TX.a && e.target.closest('.pz-word') === TX.a.parentElement))) { e.preventDefault(); scare(); return; }
    if (e.button > 0 || !DRAGGABLE.includes(c.state) || !onChar(e.clientX, e.clientY)) return;
    pd = { x: e.clientX, y: e.clientY, off: (GROUND - c.y) - e.clientY, drag: false, vx: 0, vy: 0 };
  }, { passive: false });
  addEventListener('pointermove', e => {
    if (pd) {
      if (!pd.drag && Math.hypot(e.clientX - pd.x, e.clientY - pd.y) > 6) {
        pd.drag = true; pd.from = c.state; set('drag'); c.act = null; cursorState('fist'); sfx('pick');
        spawn('text', c.x, e.clientY - 40, pd.from === 'trapped' ? tr('wiii!', 'wheee!') : '!', COL.pink);
      }
      if (pd.drag) { pd.vx = pd.vx * .5 + (e.clientX - mx) * .5; pd.vy = pd.vy * .5 + (e.clientY - my) * .5; mx = e.clientX; my = e.clientY; }
    } else if (HOVER) {
      const over = DRAGGABLE.includes(c.state) && onChar(e.clientX, e.clientY);
      if (over && !hoverSet) { hoverSet = true; cursorState('grab'); } else if (!over && hoverSet) { hoverSet = false; cursorState(''); }
    }
  }, { passive: true });
  // sürüklerken metin seçilmesin / tarayıcı sürüklemesi başlamasın (preventDefault fare olaylarını kestiği için pointerdown'da yapılmıyor)
  ['selectstart', 'dragstart'].forEach(ev => document.addEventListener(ev, e => { if (pd) e.preventDefault(); }));
  addEventListener('pointerup', e => {
    if (!pd) return;
    const p = pd; pd = null; hoverSet = false; cursorState('');
    if (!p.drag) { // tıklama
      if (c.state === 'trapped') { c.say = 120; return; }
      if (c.y === 0 && ['idle', 'act'].includes(c.state)) { c.vy = 9; set('air'); sfx('jump'); spawn('text', c.x, GROUND - 1500 * K - 6, '♥', COL.pink); }
      return;
    }
    set('air'); c.vx = clamp(p.vx * .6, -14, 14); c.vy = clamp(-p.vy * .5, -10, 14); sfx('drop');
    if (p.from === 'trapped') { // kafesten kurtuldu: sevinçle 3 kez zıplayacak
      freed = true; c.soft = true; c.party = 0; c.partyNext = true; cooldown = 600;
      try { sessionStorage.setItem('karakter-serbest', '1'); } catch (er) {}
      cage && cage.classList.add('is-empty'); sfx('free');
    }
  });
  /* Kısa tepki baloncuğu (ekstra.js de kullanır: konfeti, yıldızlar, hoş geldin) */
  function say(text, frames = 200) { c.sayText = text; c.sayT = frames; }
  // ekstra.js: yere düşen konfetiye koşar
  function chase(x) {
    if (c.y !== 0 || !['idle', 'act', 'walk', 'roam', 'sleep'].includes(c.state)) return false;
    c.act = null; if (c.state !== 'roam') set('roam');
    c.tx = clamp(x, 40, VW - 40); c.dir = Math.sign(c.tx - c.x) || c.dir; lastInput = performance.now();
    return true;
  }
  const NIGHT = () => document.documentElement.classList.contains('night');
  function poke() { lastInput = performance.now(); if (c.state === 'sleep') { c.vy = 7; set('air'); spawn('text', c.x, GROUND - 1560 * K, '!', COL.pink); } }
  function spawn(type, x, y, txt, col) {
    if (type === 'dust') for (let i = 0; i < (txt || 6); i++) parts.push({ type, x: x + (Math.random() - .5) * 60, y, vx: (Math.random() - .5) * 5, vy: -Math.random() * 2.5, life: 35, s: 2 + Math.random() * 4 });
    else parts.push({ type, x, y, vx: (Math.random() - .5) * .8, vy: -.8, life: 85, txt, col });
  }

  /* Boşta etkinlikleri — yenisini eklemek için: ACTS + ACT_LEN + targets() içinde poz */
  const ACTS = [['flag', 7], ['dance', 2], ['guitar', 2], ['phone', 2], ['read', 1], ['game', 1], ['look', 1], ['cheer', 1]]; // el sallama yalnızca sayfaya girişte, oturma yalnızca uykuda
  const ACT_LEN = { dance: 420, phone: 400, flag: 340, read: 420, game: 380, wave: 140, look: 220, rub: 130, sit: 520, cheer: 150, guitar: 420 };
  const pickAct = () => { let r = Math.random() * ACTS.reduce((s, a) => s + a[1], 0); for (const [n, w] of ACTS) if ((r -= w) < 0) return n; return 'dance'; };

  /* =========================================================
     HARF OYUNU: karakter bir başlığa zıplar, iki harfin yerini değiştirir.
     Ziyaretçi pembe işaretli harflere tıklayınca düzelir (başarım "Editör");
     tıklanmazsa 45 sn sonra kendiliğinden düzelir.
     ========================================================= */
  const TXT_STATES = ['tleap', 'tgrab', 'twalk', 'tswap', 'terase']; // başlığa bağlı durumlar
  const TX = { a: null, b: null, ca: null, cb: null, from: null, dur: 0 };
  const swapped = [];
  const LETTER = /[A-Za-zÇĞİÖŞÜÂÎÛçğıöşüâîû]/;
  const onScreen = r => r.width > 0 && r.top > 30 && r.bottom < VH - 8 && r.right > 20 && r.left < VW - 20;
  // ekranda görünen büyük başlıklardaki kelimeler (pred: kelime kutusu için ek koşul)
  function collectWords(minLen, pred) {
    const found = [];
    document.querySelectorAll('h1, h2').forEach(h => {
      if (h.closest('header.site, .site-header, nav, footer, .menu, [data-chars], [aria-hidden="true"], [role="dialog"]') || h.querySelector('[data-chars]')) return;
      if (h.checkVisibility && !h.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return;
      if (parseFloat(getComputedStyle(h).fontSize) < 34) return;
      const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        const el = n.parentElement;
        if (!el || el.closest('.pz-word') || !el.getClientRects().length) continue;
        const re = new RegExp(`[A-Za-zÇĞİÖŞÜÂÎÛçğıöşüâîû]{${minLen},}`, 'g'); let m;
        while ((m = re.exec(n.nodeValue))) {
          const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
          const r = rg.getBoundingClientRect();
          if (!onScreen(r) || !pred(r)) continue;
          const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); // üstünü örten bir şey yok mu?
          if (!top || !h.contains(top)) continue;
          const mask = el.closest('.line-mask');
          if (mask) { const mr = mask.getBoundingClientRect(), cy = r.top + r.height / 2; if (cy < mr.top || cy > mr.bottom) continue; } // henüz açılmamış (maskede gizli) satır
          found.push({ n, idx: m.index, len: m[0].length, w: m[0], r });
        }
      }
    });
    return found;
  }
  const pickOne = L => L.length ? L[Math.floor(Math.random() * L.length)] : null;
  function findTarget() {
    const minTop = 1450 * K + 10; // karakterin başı ekranın üstünden taşmasın
    return pickOne(collectWords(4, r => r.top >= minTop).map(f => {
      const pairs = [];
      for (let i = 1; i < f.len - 1; i++) for (let j = i + 1; j <= Math.min(f.len - 1, i + 2); j++)
        if (f.w[i].toLowerCase() !== f.w[j].toLowerCase()) pairs.push([i, j]);
      return pairs.length ? Object.assign(f, { pair: pickOne(pairs) }) : null;
    }).filter(Boolean));
  }
  function wrapWord(T) {
    const n = T.n, txt = n.nodeValue, frag = document.createDocumentFragment(), word = document.createElement('span');
    word.className = 'pz-word';
    if (T.idx) frag.appendChild(document.createTextNode(txt.slice(0, T.idx)));
    const spans = [...txt.slice(T.idx, T.idx + T.len)].map(ch => { const sp_ = document.createElement('span'); sp_.className = 'pz-ch'; sp_.textContent = ch; word.appendChild(sp_); return sp_; });
    frag.appendChild(word);
    if (T.idx + T.len < txt.length) frag.appendChild(document.createTextNode(txt.slice(T.idx + T.len)));
    n.parentNode.replaceChild(frag, n);
    return spans;
  }
  function makeClone(span) { // harfin kopyası: başlığın taşma maskesinden bağımsız, ekranda serbestçe taşınır
    const r = span.getBoundingClientRect(), cs = getComputedStyle(span), el = document.createElement('span');
    el.className = 'pz-letter'; el.textContent = span.textContent; el.setAttribute('aria-hidden', 'true');
    ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariationSettings', 'letterSpacing', 'color', 'textShadow', 'textTransform'].forEach(p => { el.style[p] = cs[p]; });
    el.style.left = r.left + 'px'; el.style.top = r.top + 'px'; el.style.height = r.height + 'px'; el.style.lineHeight = r.height + 'px';
    document.body.appendChild(el);
    return { el, x0: r.left, y0: r.top, w: r.width, h: r.height };
  }
  const placeClone = (cl, x, y, rot = 0) => { cl.el.style.transform = `translate(${x - cl.x0 - cl.w / 2}px,${y - cl.y0 - cl.h / 2}px) rotate(${rot}rad)`; };
  // harfin gerçek tepesi: harfin yanına görünmez bir ölçüm kutusu (yüksekliği 1ex / büyük harfte 1cap,
  // tabanı satır taban çizgisinde) koyup tepesini okur; sonuç harf kutusunun tepesine göre saklanır
  function inkOff(sp_) {
    if (sp_._ink != null) return sp_._ink;
    const pr = document.createElement('span'), ch = sp_.textContent;
    pr.style.cssText = `display:inline-block;width:0;vertical-align:baseline;height:${ch !== ch.toLowerCase() || /[bdfhklt]/.test(ch) ? '1cap' : '1ex'}`;
    sp_.after(pr);
    sp_._ink = pr.getBoundingClientRect().top - sp_.getBoundingClientRect().top;
    pr.remove();
    return sp_._ink;
  }
  const mid = sp_ => { const r = sp_.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, top: r.top + inkOff(sp_), r }; };
  // karakterin ayağının altındaki harf (kelimede yürürken zemin yüksekliği buna göre)
  function floorAt(x) {
    const w = TX.a.parentElement; let best = null, bd = 1e9;
    for (const sp_ of w.children) { const r = sp_.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - x); if (d < bd) { bd = d; best = sp_; } }
    return mid(best).top;
  }
  const headY = cl => GROUND - c.y - 1530 * K - cl.h * .42;
  const ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const fontsOk = () => document.fonts && document.fonts.status === 'loaded';
  function startText() { // yaramazlık 1: iki harfin yerini değiştirir
    if (RM || swapped.length >= 2 || !fontsOk()) return false;
    const T = findTarget(); if (!T) return false;
    const spans = wrapWord(T);
    Object.assign(TX, { mode: 'swap', spans, a: spans[T.pair[0]], b: spans[T.pair[1]], ca: null, cb: null, from: { x: c.x, y: c.y }, dur: 0 });
    c.act = null; set('tleap');
    return true;
  }
  // harfin taban çizgisi (karakter silerken kelimenin yanında bu çizgiye basar)
  function baseOff(sp_) {
    if (sp_._base != null) return sp_._base;
    const pr = document.createElement('span'); pr.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    sp_.after(pr); sp_._base = pr.getBoundingClientRect().top - sp_.getBoundingClientRect().top; pr.remove();
    return sp_._base;
  }
  function eraseSpot(i) { // eli silinen harfin sağ kenarına değecek şekilde çömelir
    const sp_ = TX.spans[i], r = sp_.getBoundingClientRect(), P = POSE.comel;
    return { x: r.right - r.width * .2 + (P.foot[0] - P.hand[0]) * P.sc * K, y: GROUND - (r.top + baseOff(sp_)) };
  }
  function startErase() { // yaramazlık 2: arkası dönük, bir kelimeyi harf harf siler
    if (RM || swapped.length >= 2 || !fontsOk()) return false;
    const T = pickOne(collectWords(4, r => r.top + r.height * .8 - 1450 * K > 10 && r.right + 420 * K < VW - 10)); if (!T) return false;
    const spans = wrapWord(T);
    Object.assign(TX, { mode: 'erase', spans, a: spans[0], b: spans[spans.length - 1], i: spans.length - 1, from: { x: c.x, y: c.y }, dur: 0 });
    c.act = null; set('tleap');
    return true;
  }
  function startFail() { // yaramazlık 3: kendisi için fazla yüksek bir başlığa çıkmaya çalışır, yetişemeyip çakılır
    if (RM || !fontsOk()) return false;
    const T = pickOne(collectWords(3, r => GROUND - r.top > 1500 * K + 380 && r.top < VH * .55)); if (!T) return false;
    Object.assign(TX, { mode: 'fail', fx: clamp(T.r.left + T.r.width / 2, 80, VW - 80), top: T.r.top, atSpot: false });
    c.act = null; c.dir = Math.sign(TX.fx - c.x) || c.dir; set('tprep');
    return true;
  }
  function mischief() { // hangi yaramazlık? (olmazsa sıradakini dener)
    if (TX.ca || TX.cb || TXT_STATES.includes(c.state) || c.state === 'tprep') return false; // biri zaten sürüyor
    const q = Math.random();
    const order = q < .4 ? [startText, startErase, startFail] : q < .75 ? [startErase, startText, startFail] : [startFail, startErase, startText];
    return order.some(f => f());
  }
  function restoreLetters(spans) {
    spans.forEach(sp_ => {
      const was = sp_.classList.contains('pz-erased') || sp_.style.opacity !== '';
      sp_.style.opacity = ''; sp_.classList.remove('pz-erased'); sp_.removeAttribute('data-cursor'); sp_.removeAttribute('title');
      if (was) { sp_.classList.add('pz-fix'); setTimeout(() => sp_.classList.remove('pz-fix'), 700); }
    });
  }
  function abortText() { // başlık ekrandan çıktı vb.: harfleri yerine bırak, aşağı süzül
    [TX.ca, TX.cb].forEach(cl => cl && cl.el.remove()); TX.ca = TX.cb = null;
    [TX.a, TX.b].forEach(sp_ => sp_ && (sp_.style.visibility = ''));
    if (TX.mode === 'erase' && TX.spans) restoreLetters(TX.spans);
    c.soft = true; c.vy = 2; c.vx = 0; set('air');
  }
  function scare() { // silerken yakalandı: korkup kaçar, harfler geri gelir
    sfx('yelp');
    restoreLetters(TX.spans);
    unlock('sucustu');
    spawn('text', c.x - 20, GROUND - c.y - 1650 * K, '!!', COL.pink);
    spawn('text', c.x + 120 * K, GROUND - c.y - 1500 * K, tr('eyvah!', 'yikes!'), COL.ink);
    c.soft = true; c.vy = 13; c.vx = (c.x > VW / 2 ? -1 : 1) * 6; c.dir = Math.sign(c.vx); set('air');
  }
  function stepFail(dt) {
    const dx = TX.fx - c.x;
    if (!TX.atSpot) {                       // başlığın altına koşar
      if (Math.abs(dx) > 3) { c.dir = Math.sign(dx); c.x += Math.sign(dx) * Math.min(Math.abs(dx), 27 * K * .9 * dt); c.st = 0; return; }
      TX.atSpot = true; c.st = 0;
      spawn('text', c.x + 140 * K, GROUND - 1600 * K, tr('oraya çıkacağım!', "I'll get up there!"), COL.ink);
    }
    if (c.st > 60) {                         // elini uzatıp zıplar… ama yetişemez
      const need = GROUND - TX.top, peak = Math.max(230, need * .5);
      c.vy = Math.sqrt(1.6 * peak); c.vx = 0; c.reach = true; c.failJump = true; c.soft = false; set('air'); sfx('boing');
    }
  }
  function stepText(dt) {
    if (c.state === 'tprep') { stepFail(dt); return; }
    if (!TX.a || !document.contains(TX.a)) { abortText(); return; }
    const A = mid(TX.a), B = mid(TX.b);
    if (!onScreen(A.r) || !onScreen(B.r)) { abortText(); return; }
    if (c.state === 'tleap') {
      const S = TX.mode === 'erase' ? eraseSpot(TX.i) : { x: A.x, y: GROUND - A.top };
      TX.dur = TX.dur || 30 + Math.min(28, Math.abs(S.y - TX.from.y) / 18);
      const p = Math.min(1, c.st / TX.dur), e = ease(p);
      c.dir = Math.sign(S.x - TX.from.x) || c.dir;
      c.x = TX.from.x + (S.x - TX.from.x) * e;
      c.y = TX.from.y + (S.y - TX.from.y) * e + Math.sin(p * Math.PI) * 150 * (K / .165);
      if (c.st < 2 && !TX.snd) { TX.snd = true; spawn('dust', TX.from.x, GROUND - TX.from.y, 6); sfx('boing'); }
      if (p >= 1) { c.sq = .82; spawn('dust', c.x, GROUND - c.y, 5); sfx('land'); TX.snd = false; set(TX.mode === 'erase' ? 'terase' : 'tgrab'); }
    } else if (c.state === 'terase') {       // arkası dönük, harf harf siler
      const sp_ = TX.spans[TX.i], S = eraseSpot(TX.i);
      c.x += (S.x - c.x) * Math.min(1, .2 * dt); c.y += (S.y - c.y) * Math.min(1, .3 * dt);
      const p = Math.min(1, c.st / 80), r = sp_.getBoundingClientRect(); // yavaş yavaş
      sp_.style.opacity = String(1 - p * p);
      if (Math.random() < .3 * dt) spawn('dust', r.left + Math.random() * r.width, r.top + r.height * (.3 + Math.random() * .5), 1);
      if (c.st > 2 && c.st - dt <= 2 && TX.i === TX.spans.length - 1) spawn('text', c.x + 150 * K, GROUND - c.y - 1550 * K, tr('şşş…', 'shh…'), COL.ink);
      if (p >= 1) {
        sp_.style.opacity = ''; sp_.classList.add('pz-erased'); sp_.setAttribute('data-cursor', ''); sp_.title = tr('Harfleri geri getir', 'Bring the letters back');
        TX.i--; c.st = 0; sfx('scrub');
        if (TX.i < 0) {                      // yakalanmadan bitirdi
          swapped.push({ kind: 'erase', spans: TX.spans, t0: performance.now() });
          spawn('text', c.x + 150 * K, GROUND - c.y - 1500 * K, tr('tamamdır!', 'all gone!'), COL.pink);
          c.soft = true; c.vy = 8; c.vx = (c.x > VW / 2 ? -1 : 1) * 3; set('air');
        }
      }
    } else if (c.state === 'tgrab') {        // harfi tutup başının üstüne kaldırır
      c.x = A.x; c.y = GROUND - A.top;
      if (c.st > 10 && !TX.ca) { sfx('pick'); TX.ca = makeClone(TX.a); TX.a.style.visibility = 'hidden'; spawn('text', c.x + 140 * K, GROUND - c.y - 1450 * K, tr('hıı?', 'hmm?'), COL.ink); }
      if (TX.ca) { const p = ease(Math.min(1, (c.st - 10) / 22)); placeClone(TX.ca, A.x, A.y + (headY(TX.ca) - A.y) * p, Math.sin(p * Math.PI) * .25); }
      if (c.st > 40) { c.dir = Math.sign(B.x - A.x) || 1; set('twalk'); }
    } else if (c.state === 'twalk') {        // harfi başında taşıyarak öbür harfe yürür
      const sp_ = 27 * K * .4 * dt, dx = B.x - c.x;
      c.x += Math.sign(dx) * Math.min(Math.abs(dx), sp_);
      c.y += ((GROUND - floorAt(c.x)) - c.y) * Math.min(1, .35 * dt); // harften harfe yükseklik değişimi yumuşak
      placeClone(TX.ca, c.x, headY(TX.ca) - Math.abs(Math.sin(t * .3)) * 6, Math.sin(t * .15) * .08);
      if (Math.abs(dx) < 1) set('tswap');
    } else if (c.state === 'tswap') {        // iki harf havada yer değiştirir
      c.x = B.x; c.y += ((GROUND - B.top) - c.y) * Math.min(1, .35 * dt);
      if (!TX.cb) { TX.cb = makeClone(TX.b); TX.b.style.visibility = 'hidden'; }
      const p = ease(Math.min(1, c.st / 26)), hy = headY(TX.ca);
      placeClone(TX.ca, c.x + (B.x - c.x) * p, hy + (B.y - hy) * p, (1 - p) * .3);
      placeClone(TX.cb, B.x + (A.x - B.x) * p, B.y + (A.y - B.y) * p - Math.sin(p * Math.PI) * 120 * (K / .165), p * Math.PI * 2);
      if (c.st >= 26) {
        const ta = TX.a.textContent; TX.a.textContent = TX.b.textContent; TX.b.textContent = ta; TX.a._ink = TX.b._ink = null;
        [TX.a, TX.b].forEach(sp_ => { sp_.style.visibility = ''; sp_.classList.add('pz-swapped'); sp_.setAttribute('data-cursor', ''); sp_.title = tr('Harfleri düzelt', 'Fix the letters'); });
        TX.ca.el.remove(); TX.cb.el.remove(); TX.ca = TX.cb = null;
        swapped.push({ a: TX.a, b: TX.b, t0: performance.now() }); sfx('pop');
        spawn('text', c.x + 150 * K, GROUND - c.y - 1500 * K, tr('hihi', 'hehe'), COL.pink);
        spawn('text', B.x - 40, B.r.top - 30, tr('düzelt bakalım!', 'fix it!'), COL.ink);
        c.soft = true; c.vy = 7; c.vx = (c.x > VW / 2 ? -1 : 1) * 3; set('air'); // aşağı atlar
      }
    }
  }
  function fixPair(p, byUser) {
    const i = swapped.indexOf(p); if (i < 0) return; swapped.splice(i, 1);
    if (p.kind === 'erase') restoreLetters(p.spans);
    else {
      const ta = p.a.textContent; p.a.textContent = p.b.textContent; p.b.textContent = ta;
      [p.a, p.b].forEach(sp_ => { sp_.classList.remove('pz-swapped'); sp_.removeAttribute('data-cursor'); sp_.removeAttribute('title'); sp_.classList.add('pz-fix'); setTimeout(() => sp_.classList.remove('pz-fix'), 700); });
    }
    if (byUser) {
      unlock('editor'); sfx('coin');
      const r = (p.a || p.spans[0]).getBoundingClientRect(); spawn('text', r.left, r.top - 8, '✔', COL.blue);
      if (['idle', 'act', 'walk', 'roam'].includes(c.state)) {
        const say = [tr('hıh!', 'hmph!'), tr('fark ettin ha', 'you noticed'), tr('peki peki', 'okay okay')][Math.floor(Math.random() * 3)];
        spawn('text', c.x + 140 * K, GROUND - c.y - 1550 * K, say, COL.pink);
      }
    }
  }
  document.addEventListener('click', e => {
    const sp_ = e.target.closest && e.target.closest('.pz-swapped, .pz-erased'); if (!sp_) return;
    const p = swapped.find(q => q.a === sp_ || q.b === sp_ || (q.spans && q.spans.includes(sp_))); if (!p) return;
    e.preventDefault(); e.stopPropagation(); fixPair(p, true);
  }, true);

  /* ---------- Döngü ---------- */
  function stepInner(now) {
    const dt = Math.min(3, (now - last) / 16.67); DT = dt; last = now; t += dt; c.st += dt; if (cooldown > 0) cooldown -= dt;
    const sy = curSY, d = sy - lastSY; lastSY = sy;
    for (const p of swapped.slice()) if (now - p.t0 > 45000) fixPair(p, false);
    if (c.sayT > 0) c.sayT -= dt;
    if (d > 2 && !['hang', 'crash', 'wait', 'getup', 'trapped', 'drag', 'party', ...TXT_STATES].includes(c.state) && c.party === 0 && !RM) { // aşağı kaydırma → havalanır
      c.vy = Math.min(26, c.vy + d * .09 * dt);
      if (c.state !== 'air') { set('air'); c.act = null; }
      lastInput = now;
    }
    const band = mouseIn && HOVER && my > VH - 360 && my < VH; // imleç ekranın altına inince kovalar (İmleç benim oyuncağım)
    const run = 27 * K * 1.0, walk = run * .35; // ekrandaki boya göre hız (px/kare)
    switch (c.state) {
      case 'tleap': case 'tgrab': case 'twalk': case 'tswap': case 'terase': case 'tprep': stepText(dt); break;
      case 'trapped': { // kafeste: el sallar, zıplar, "beni çıkar!"
        const r = cageRect(), ph = c.st % 330;
        c.x = r.left + r.width / 2; c.dir = 1;
        const hop = ph > 120 && ph < 200 ? Math.abs(Math.sin((ph - 120) / 80 * Math.PI * 2)) * 34 * (K / .16) : 0;
        c.y = GROUND - (r.bottom - 12) + hop;
        if (c.say > 0) c.say -= dt;
        lastInput = now;
        break;
      }
      case 'drag': {
        c.x = mx; c.y = GROUND - my - pd.off; c.dir = 1; lastInput = now;
        // tutulan noktadan sarkaç gibi sallanır (sınırlı)
        c.rotV += (-Math.sin(c.rot) * .03 - (pd ? pd.vx : 0) * .0009) * dt; c.rotV *= .88; c.rot = clamp(c.rot + c.rotV * dt, -.55, .55);
        if (pd) { pd.vx *= .85; pd.vy *= .85; }
        break;
      }
      case 'party': { // kurtulma sevinci: her seferinde daha yükseğe
        if (c.st > 18) { c.party++; c.vy = [0, 11, 14.2, 27][c.party]; set('air'); sfx('jump', c.party);
          spawn('text', c.x, GROUND - 1700 * K, [, tr('özgürüm!', 'free!'), tr('yaşasın!', 'yay!'), tr('YUPPİ!', 'WOOHOO!')][c.party], COL.pink); }
        break;
      }
      case 'enter':
        if (band && cooldown <= 0) { set('run'); break; }
        c.dir = 1; c.x += run * dt;
        if (c.x >= c.tx) { set('act'); c.act = 'wave'; c.actT = ACT_LEN.wave; }
        break;
      case 'idle': case 'act': {
        if (band && cooldown <= 0 && c.act !== 'rub') { set('run'); c.act = null; break; }
        if (now - lastInput > (NIGHT() ? 14000 : 25000)) { set('sleep'); c.act = null; break; } // gece daha çabuk uyur
        if (c.state === 'idle' && c.st > 100) {
          const r = Math.random();
          if (r < .18) { set('roam'); c.tx = clamp(c.x + (Math.random() < .5 ? -1 : 1) * (280 + Math.random() * 520), 70, VW - 70); c.dir = Math.sign(c.tx - c.x) || c.dir; }
          else if (r < .24) { set('walk'); c.tx = clamp(c.x + (Math.random() - .5) * 260, 70, VW - 70); c.dir = Math.sign(c.tx - c.x) || c.dir; }
          else if (r < .66 && mischief()) { /* yaramazlık başladı */ }
          else { set('act'); c.act = pickAct(); c.actT = ACT_LEN[c.act]; }
        }
        if (c.state === 'act') {
          const fl = Math.floor(c.st);
          if (c.st > c.actT) { c.act = null; if (c.afterParty) { c.afterParty = false; set('roam'); c.tx = clamp(c.x + (c.x > VW / 2 ? -1 : 1) * VW * .35, 70, VW - 70); c.dir = Math.sign(c.tx - c.x) || 1; } else set('idle'); }
          else if (c.act === 'dance' && fl % 28 === 0 && fl !== c.lastNote) { c.lastNote = fl; spawn('text', c.x + (Math.random() - .3) * 300 * K, GROUND - 1450 * K, Math.random() < .5 ? '♪' : '♫', Math.random() < .5 ? COL.pink : COL.blue); }
          else if (c.act === 'guitar' && fl % 24 === 0 && fl !== c.lastNote) { c.lastNote = fl; sfx('strum'); spawn('text', c.x + (120 + Math.random() * 160) * K, GROUND - (1150 + Math.random() * 250) * K, Math.random() < .6 ? '♪' : '♫', [COL.pink, COL.blue, COL.ink][Math.floor(Math.random() * 3)]); }
          else if (c.act === 'phone' && Math.random() < .004 * dt) spawn('text', c.x + 200 * K, GROUND - 1100 * K, Math.random() < .5 ? 'haha' : '♥', COL.pink);
          else if (c.act === 'game' && Math.random() < .003 * dt) { c.vy = 6; set('air'); c.act = 'game'; spawn('text', c.x, GROUND - 1550 * K, '★', COL.yellow); }
          else if (c.act === 'flag' && fl === 26 && c.lastNote !== -26) { c.lastNote = -26; spawn('text', c.x + 330 * K, GROUND - 1800 * K, '✦', COL.yellow); spawn('text', c.x - 200 * K, GROUND - 1600 * K, '!', COL.pink); }
          else if (c.act === 'cheer' && fl % 22 === 11 && fl !== c.lastNote) { c.lastNote = fl; spawn('text', c.x + (Math.random() - .5) * 300 * K, GROUND - 1700 * K, Math.random() < .5 ? '★' : '✦', Math.random() < .5 ? COL.yellow : COL.pink); }
          else if (c.act === 'sit' && Math.random() < .003 * dt) spawn('text', c.x + 180 * K, GROUND - 1150 * K, Math.random() < .5 ? '♪' : '…', COL.blue);
          else if (c.act === 'rub' && fl === 10 && c.lastNote !== -10) { c.lastNote = -10; spawn('text', c.x + 260 * K, GROUND - 1600 * K, tr('auu', 'ouch'), COL.ink); }
        }
        break;
      }
      case 'walk': case 'roam': {
        if (band && cooldown <= 0) { set('run'); break; }
        const dx = c.tx - c.x; c.dir = Math.sign(dx) || c.dir;
        c.x += Math.sign(dx) * Math.min(Math.abs(dx), (c.state === 'roam' ? run * .85 : walk) * dt);
        if (Math.abs(dx) < 2) set('idle');
        break;
      }
      case 'sleep': c.zT = (c.zT || 0) + dt; if (c.zT > 70) { c.zT = 0; spawn('text', c.x + 200 * K, GROUND - 1150 * K, 'z', COL.ink); } if (band && cooldown <= 0) poke(); break;
      case 'run': {
        if (!band) { if (c.st > 40) set('idle'); break; }
        c.st = 0;
        // sağ eli imlecin altına gelecek şekilde konumlan
        const fR = POSE.elR, dx = mx - (fR.fist[0] - fR.foot[0]) * fR.sc * K - c.x;
        // imlecin altına gelince yön değiştirmeyi bırakır: yoksa her karede sağa-sola dönüp (kâğıt dönüşü) kayboluyor gibi görünüyordu
        if (Math.abs(dx) > 14) c.dir = Math.sign(dx);
        if (Math.abs(dx) > 3) c.x += Math.sign(dx) * Math.min(Math.abs(dx), run * 1.1 * dt);
        if (Math.abs(dx) < 160 * K && my < GROUND - 1000 * K && my > GROUND - 2300 * K) {
          const need = (GROUND - 1300 * K) - my; // imlece yetişmek için gereken yükseklik
          c.vy = clamp(Math.sqrt(Math.max(0, need) * 1.6) + 4, 7, 22); c.reach = true; set('air');
        }
        break;
      }
      case 'air': {
        c.vy -= .8 * dt; c.y += c.vy * dt; c.x += c.vx * dt; c.vx *= .96;
        if (c.y > VH * .62 && !c.soft) { c.y = VH * .62; c.vy = Math.min(c.vy, 0); }
        if (HOVER && mouseIn && cooldown <= 0) for (const s of ['L', 'R']) {
          if (Math.hypot(mx - handWorld[s][0], my - handWorld[s][1]) < 30) { grab(); break; }
        }
        if (c.state === 'hang') break;
        if (c.y <= 0) {
          const impact = -c.vy; c.y = 0; c.vy = 0; c.vx = 0; c.reach = false; if (impact <= 15) c.failJump = false;
          if (impact > 15 && !c.soft) { sfx('crash'); if (c.failJump) spawn('text', c.x + 60 * K, GROUND - 700 * K, tr('çok yüksekmiş…', 'too high…'), COL.ink); c.failJump = false; set('crash'); c.crashDir = Math.random() < .5 ? -1 : 1; spawn('dust', c.x, GROUND, 16); unlock('cakildi'); if (c.party) { c.party = 0; c.afterParty = true; } }
          else {
            c.soft = false; c.sq = impact > 4 ? .82 : .94; if (impact > 4) { spawn('dust', c.x, GROUND, 6); sfx('land'); }
            if (c.partyNext || (c.party > 0 && c.party < 3)) { c.partyNext = false; c.act = null; set('party'); }
            else set(c.act ? 'act' : 'idle');
          }
        }
        break;
      }
      case 'hang': {
        // sanal imleç: ağır, aşağı inemez; karakterin ağırlığı onu yakalandığı hizaya çeker
        const tx = mx, ty = Math.min(my, V.y0);
        const ax = (tx - V.x) * .045 * dt; V.vx = V.vx * .85 + ax; V.x += V.vx;
        V.y += (ty - V.y) * .04 * dt; V.y += (V.y0 - V.y) * .02 * dt;
        window.__cursorTo && window.__cursorTo(V.x, V.y);
        // sarkaç: imlecin yatay ivmesi karakteri sallar
        c.rotV += (-Math.sin(c.rot) * .012 - ax * .0016) * dt; c.rotV *= .985; c.rot += c.rotV * dt;
        shakeDecay += dt; if (shakeDecay > 45) { shakes = Math.max(0, shakes - 1); shakeDecay = 0; }
        if (shakes >= 7) release();
        else if (c.st > 900) { spawn('text', V.x, V.y - 40, tr('of, yoruldum', 'ugh, tired'), COL.ink); release(); }
        break;
      }
      case 'crash': if (c.st > 120) set('getup'); break;
      case 'getup': if (c.st > 46) { set('act'); c.act = 'rub'; c.actT = ACT_LEN.rub; } break;
    }
    // ekran dışına çıkıp kaybolmasın (imleci kenara kadar kovalayınca dışarı koşuyordu)
    if (!['enter', 'hang', 'drag', 'trapped', 'wait', ...TXT_STATES, 'tprep'].includes(c.state)) c.x = clamp(c.x, 50, VW - 50);
    c.sq += (1 - c.sq) * .18;
    if (!['hang', 'drag'].includes(c.state)) { c.rot *= .8; c.rotV = 0; }
    draw();
  }
  // güvenlik: bir karede hata olsa bile döngü durmasın (yoksa karakter ekrandan silinip donuyordu)
  let errs = 0;
  function step(now) {
    try { stepInner(now); } catch (e) { if (errs++ < 3) console.error('karakter:', e); }
    requestAnimationFrame(step);
  }

  /* ---------- Poz hedefleri (gövde koordinatlarında) ---------- */
  function targets() {
    const T = { up: { L: null, R: null }, L: [HAND.L[0], HAND.L[1]], R: [HAND.R[0], HAND.R[1]], legL: 0, legR: 0, lean: 0, head: 0, bob: 0, eyes: 'open', mouth: null, prop: null, phones: false };
    const s = c.st, A = c.act;
    const runPose = (sp, amp) => {
      const ph = t * sp, k = Math.sin(ph);
      T.legL = k * amp; T.legR = k * amp; // ikisi aynı yöne: önden koşu adımı
      T.legL = Math.max(0, k) * amp * 1.4 - .05; T.legR = Math.max(0, -k) * amp * 1.4 - .05;
      T.L = [HAND.L[0] + 30 * k, HAND.L[1] - 70 * Math.max(0, k)]; T.R = [HAND.R[0] + 30 * k, HAND.R[1] - 70 * Math.max(0, -k)];
      T.bob = -Math.abs(k) * 28; T.lean = c.dir * .07; T.head = -c.dir * .03;
    };
    switch (c.state) {
      case 'enter': case 'run': case 'roam': runPose(.3, .32); break;
      case 'walk': runPose(.14, .16); T.bob *= .4; break;
      case 'air':
        if (c.vy > 0) { T.up = { L: 0, R: 0 }; T.legL = .12; T.legR = .12; T.eyes = 'open'; T.mouth = 'open'; }
        else { const w = Math.sin(t * .45); T.up = { L: -.15 + w * .35, R: .15 + w * .35 }; T.legL = .18 + w * .2; T.legR = .18 - w * .2; T.mouth = c.vy < -8 ? 'open' : 'o'; }
        if (A === 'game') { T.up = { L: 0, R: 0 }; T.eyes = 'happy'; T.mouth = 'open'; }
        if (c.reach && tmInv && mouseIn) { // zıplarken sağ eliyle imlece uzan
          const q = tmInv.transformPoint(new DOMPoint(mx, my));
          T.up = { L: -.2, R: clamp(Math.atan2(q.y - UP_PIV.R[1], q.x - UP_PIV.R[0]) - upNat('R'), -1.1, .7) }; T.mouth = 'open';
        }
        break;
      case 'hang': {
        // sağ el dimdik yukarıda imleci tutuyor, sol kol çırpınıyor
        T.up = { R: -Math.PI / 2 - upNat('R') - c.rot, L: -.1 + Math.sin(t * .22) * .45 };
        T.legL = .1 + Math.sin(t * .3) * .25 - c.rotV * 8; T.legR = .1 - Math.sin(t * .3) * .25 + c.rotV * 8;
        T.mouth = Math.floor(t / 50) % 2 ? 'open' : null; T.head = c.rot * -.5;
        break;
      }
      case 'trapped': {
        const ph = c.st % 330;
        T.eyes = 'happy'; T.mouth = 'open';
        if (ph < 120) T.up.R = -.1 + Math.sin(t * .3) * .32;                                    // el sallar
        else if (ph < 200) T.up = { L: Math.sin(t * .4) * .2, R: -Math.sin(t * .4) * .2 };       // zıplar
        else { T.up = { L: -.2 + Math.sin(t * .5) * .35, R: .2 - Math.sin(t * .5) * .35 }; T.eyes = 'open'; } // "imdat!"
        break;
      }
      case 'drag': {
        const w = Math.sin(t * .4);
        T.up = { L: -.25 + w * .3, R: .25 - w * .3 }; T.legL = .2 + w * .25 - c.rotV * 6; T.legR = .2 - w * .25 + c.rotV * 6;
        T.mouth = 'open'; T.eyes = 'open'; T.lean = c.rot * .6;
        break;
      }
      case 'crash': T.L = [170, 830]; T.R = [860, 770]; T.legL = .35; T.legR = .2; T.eyes = 'x'; T.mouth = 'o'; break;
      case 'getup': T.L = [305, 920]; T.R = [735, 920]; T.eyes = 'wince'; break;
      case 'sleep': T.eyes = 'closed'; T.head = .12; T.bob = Math.sin(t / 30) * 8; T.L = [342, 960]; T.R = [696, 960]; break;
      case 'act':
        if (A === 'dance') {
          const beat = Math.floor(t / 28) % 2, ph = t / 28 * Math.PI;
          T.phones = true; T.eyes = 'happy'; T.mouth = beat ? 'open' : null;
          T.bob = -Math.abs(Math.sin(ph)) * 30; T.head = Math.sin(ph / 2) * .07; T.lean = Math.sin(ph / 2) * .04;
          if (beat) { T.up.L = Math.sin(t * .11) * .25; T.R = [600, 720]; } else { T.L = [430, 720]; T.up.R = Math.sin(t * .11) * .25; }
          T.legL = beat ? .14 : 0; T.legR = beat ? 0 : .14;
        }
        if (A === 'phone') { T.prop = 'phone'; T.R = [600, 730]; T.L = [342, 960]; T.head = .07; T.mouth = Math.floor(t / 130) % 3 === 0 ? 'open' : null; }
        if (A === 'read' || A === 'game') { T.prop = A === 'read' ? 'book' : 'console'; T.L = [425, 775]; T.R = [607, 775]; T.head = .06; T.mouth = A === 'game' && Math.floor(t / 60) % 2 ? 'o' : null; }
        if (A === 'flag') {
          T.eyes = 'happy'; T.mouth = 'open';
          if (s < 24) { T.R = [770, 990]; T.eyes = 'open'; T.mouth = 'o'; }                       // arkadan çıkarıyor
          else if (s < c.actT - 28) { T.prop = 'flag'; T.up.R = .02 + Math.sin(t * .14) * .12; T.bob = s < 38 ? -40 : 0; T.lean = Math.sin(t * .07) * .03; }
          else T.R = [HAND.R[0], HAND.R[1]];
        }
        if (A === 'wave') { T.up.R = -.1 + Math.sin(t * .3) * .3; T.eyes = 'happy'; T.mouth = 'open'; }
        if (A === 'look') { T.head = Math.sin(s / 40) * .14; T.lean = Math.sin(s / 40) * .03; }
        if (A === 'rub') { T.R = [705 + Math.sin(t * .45) * 28, 250 + Math.cos(t * .45) * 16]; T.eyes = 'wince'; T.head = -.08; T.mouth = 'o'; }
        break;
      default: T.bob = Math.sin(t / 40) * 6;
    }
    if ((t % 210) < 6 && T.eyes === 'open') T.eyes = 'closed'; // göz kırpma
    return T;
  }

  /* Kol kalkan pozlar: hazır görsellerden (elL / elR = tek kol, cheer = iki kol) */
  function armView(A) {
    const st = c.state;
    if (st === 'trapped') return c.st % 330 < 120 ? 'elR' : 'cheer';
    if (st === 'drag') return 'cheer';
    if (st === 'hang') return 'elR';
    if (st === 'air') return c.reach ? 'elR' : 'cheer';
    if (A === 'wave') return 'elR';
    if (A === 'flag' && c.st >= 24 && c.st < c.actT - 28) return 'elR';
    if (A === 'dance') return Math.floor(t / 28) % 2 ? 'elL' : 'elR';
    return 'front';
  }

  /* ---------- Çizim ---------- */
  function draw() {
    const g = mctx;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, VW, VH);
    // tüm parça/poz görselleri yüklenene kadar çizme
    if (c.state === 'wait' || loaded < Object.keys(PT).length + 4 + Object.keys(poseImgs).length) return;
    // görünüm: önden iskelet / yandan / arkadan / oturma / kafa kaşıma / yaşasın / yerde
    const A = c.state === 'act' ? c.act : null;
    const want = c.state === 'terase' ? 'comel' : c.state === 'tprep' ? (TX.atSpot ? 'elR' : 'side')
      : c.state === 'tleap' ? 'zipla' : c.state === 'twalk' ? 'side' : ['tgrab', 'tswap'].includes(c.state) ? 'cheer'
      : (c.state === 'crash' && c.st > 10) || (c.state === 'getup' && c.st < 14) ? 'flat'
      : ['enter', 'run', 'roam', 'walk'].includes(c.state) ? 'side'
      : c.state === 'sleep' || A === 'sit' ? 'sit'
      : A === 'phone' ? 'telefon' : A === 'read' ? 'kitap' : A === 'guitar' ? 'gitar'   // bağdaş kurup telefona bakar / kitap okur
      : A === 'look' ? 'back' : A === 'rub' ? 'kasima' : A === 'cheer' || c.state === 'party' ? 'cheer'
      : c.state === 'air' && c.party > 0 && (c.party < 3 || c.vy > -9) ? 'zipla' : armView(A);
    if (vw.p === 0 && (want !== vw.view || (want === 'side' && c.dir !== vw.dir))) {
      const turn = want !== 'flat' && vw.view !== 'flat' && (['side', 'back'].includes(want) || ['side', 'back'].includes(vw.view));
      if (turn) { vw.p = .001; vw.tv = want; vw.td = c.dir; vw.sw = false; }      // kağıt gibi döner
      else { if (want !== 'flat' && vw.view !== 'flat') c.sq = .86; vw.view = want; vw.dir = c.dir; } // küçük esneme ile poz değişir
    }
    if (vw.p > 0) {
      if (vw.p < .5 && vw.tv === 'side' && want === 'side') vw.td = c.dir; // dönüşün ilk yarısında yön değişirse yeni yöne dön
      vw.p += DT / 8;
      if (vw.p >= .5 && !vw.sw) { vw.view = vw.tv; vw.dir = vw.td; vw.sw = true; }
      if (vw.p >= 1) vw.p = 0;
    }
    const turnSx = vw.p > 0 ? .18 + .82 * Math.abs(Math.cos(vw.p * Math.PI)) : 1;
    if (vw.view === 'flat') return drawFlat(g);
    if (vw.view === 'side') return drawSide(g, turnSx);
    if (vw.view !== 'front') return drawPose(g, vw.view, turnSx);
    const T = targets();
    T.up = { L: null, R: null }; // kol kaldırılan pozlar artık hazır görsellerle çiziliyor (armView)
    const kk = c.state === 'hang' || c.reach ? .3 : .14;
    const hL = [spring(J.hLx, T.L[0], kk), spring(J.hLy, T.L[1], kk)], hR = [spring(J.hRx, T.R[0], kk), spring(J.hRy, T.R[1], kk)];
    const legL = spring(J.legL, T.legL, .16, .8), legR = spring(J.legR, T.legR, .16, .8);
    const lean = spring(J.lean, T.lean, .1), headR = spring(J.head, T.head, .1), bob = spring(J.bob, T.bob, .25, .7);
    const aL = ik('L', hL), aR = ik('R', hR);
    // kalkık kollar: yukarı kalkarken aşağıdan yay ile gelir
    ['L', 'R'].forEach(sd => { const j = J['up' + sd], on = T.up[sd] != null; if (on && !j.on) { j.p = sd === 'R' ? 1.25 : -1.25; j.v = 0; } j.on = on; if (on) spring(j, T.up[sd], .17, .72); });
    const upOn = { L: T.up.L != null, R: T.up.R != null };
    const fistLocal = sd => upMat(new DOMMatrix(), sd, J['up' + sd].p).transformPoint(new DOMPoint(POSE['kol' + sd].fist[0], POSE['kol' + sd].fist[1]));

    // kök dönüşüm (ekran ← orijinal görsel koordinatları)
    let rootX = c.x, rootY = GROUND - c.y, rootRot = 0;
    if (c.state === 'crash' || c.state === 'getup') {
      const p = c.state === 'crash' ? Math.min(1, c.st / 12) : 1 - clamp((c.st - 14) / 30, 0, 1);
      const e = c.state === 'crash' ? 1 - Math.pow(1 - p, 3) + Math.sin(p * Math.PI) * .08 : p * p;
      rootRot = c.crashDir * Math.PI / 2 * e; rootY = GROUND - 260 * K * e;
    }
    // sürüklenirken tutulan nokta (imleç) etrafında döner
    let m = c.state === 'drag' ? new DOMMatrix().translate(mx, my).rotate(c.rot * 180 / Math.PI).translate(-mx, -my) : new DOMMatrix();
    m = m.translate(rootX, rootY).rotate(rootRot * 180 / Math.PI).scale(K * (2 - c.sq) * turnSx, K * c.sq).translate(-FOOT[0], -FOOT[1]);
    // gövde dönüşümü (kalça etrafında eğilme + zıplama)
    const HIP = PT.torso.py, NECK = PT.head.py; // eklemler parça verisinden
    const torsoM = mm => mm.translate(516, HIP + bob).rotate(lean * 180 / Math.PI).translate(-516, -HIP);
    if (c.state === 'hang') { // sağ el imlecin üstünde olacak şekilde kökü yerleştir
      const probe = torsoM(new DOMMatrix().rotate(c.rot * 180 / Math.PI).scale(K).translate(-FOOT[0], -FOOT[1]));
      const fp = upOn.R ? fistLocal('R') : { x: aR.H[0], y: aR.H[1] };
      const hp = probe.transformPoint(new DOMPoint(fp.x, fp.y));
      rootX = V.x - hp.x; rootY = V.y - hp.y;
      m = new DOMMatrix().translate(rootX, rootY).rotate(c.rot * 180 / Math.PI).scale(K).translate(-FOOT[0], -FOOT[1]);
      c.x = rootX; c.y = GROUND - rootY;
    }
    const tm = torsoM(new DOMMatrix(m));
    const hw = (a) => { const q = tm.transformPoint(new DOMPoint(a.H[0], a.H[1])); return [q.x, q.y]; };
    const hwUp = sd => { const f = fistLocal(sd), q = tm.transformPoint(f); return [q.x, q.y]; };
    handWorld = { L: upOn.L ? hwUp('L') : hw(aL), R: upOn.R ? hwUp('R') : hw(aR) }; tmInv = tm.inverse();

    ctx = g;
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    const setM = mat => g.setTransform(mat.a * DPR, mat.b * DPR, mat.c * DPR, mat.d * DPR, mat.e * DPR, mat.f * DPR);
    const drawPart = (name, mat) => { const p = PT[name]; setM(mat); g.drawImage(imgs[name], p.x, p.y, p.w, p.h); };
    const limb = (name, mat, px, py, rot) => drawPart(name, mat.translate(px, py).rotate(rot * 180 / Math.PI).translate(-px, -py));
    const armDraw = (s, a) => {
      const u = s === 'L' ? 'luarm' : 'ruarm', f = s === 'L' ? 'lfarm' : 'rfarm', A = ARM[s];
      const um = new DOMMatrix(tm).translate(A.S0[0], A.S0[1]).rotate(a.up * 180 / Math.PI).translate(-A.S0[0], -A.S0[1]);
      drawPart(u, um);
      drawPart(f, um.translate(A.E0[0], A.E0[1]).rotate(a.fore * 180 / Math.PI).translate(-A.E0[0], -A.E0[1]));
    };
    const raised = a => a.H[1] < 700;

    // bacaklar (kalçadan)
    limb('lleg', new DOMMatrix(m).translate(0, bob), PT.lleg.px, PT.lleg.py, legL);
    limb('rleg', new DOMMatrix(m).translate(0, bob), PT.rleg.px, PT.rleg.py, -legR);
    // gövde
    { const k = upOn.L && upOn.R ? 'torso_LR' : upOn.L ? 'torso_L' : upOn.R ? 'torso_R' : null;
      if (k) { setM(tm); g.drawImage(poseImgs[k], PT.torso.x, PT.torso.y, PT.torso.w, PT.torso.h); } else drawPart('torso', tm); }
    if (T.prop === 'book' || T.prop === 'console') { setM(tm); g.imageSmoothingEnabled = false; (T.prop === 'book' ? book : consoleToy)((hL[0] + hR[0]) / 2, (hL[1] + hR[1]) / 2 - 20, t); g.imageSmoothingEnabled = true; }
    if (!upOn.L && !raised(aL)) armDraw('L', aL);
    if (!upOn.R && !raised(aR)) armDraw('R', aR);
    // bayrak (kalkık yumruğun içinden geçen direk)
    if (T.prop === 'flag' && upOn.R) { const f = fistLocal('R'); setM(tm); g.imageSmoothingEnabled = false; flag(f.x, f.y + 20, t); g.imageSmoothingEnabled = true; }
    // kafa
    const hm = new DOMMatrix(tm).translate(516, NECK).rotate(headR * 180 / Math.PI).translate(-516, -NECK);
    drawPart('head', hm);
    setM(hm); g.imageSmoothingEnabled = false;
    face(T.eyes, T.mouth);
    if (T.phones) headphones();
    g.imageSmoothingEnabled = true;
    // kalkık kollar saçın önünde (yaşasın görselindeki gibi)
    ['L', 'R'].forEach(sd => { if (upOn[sd]) { const P = POSE['kol' + sd]; setM(upMat(tm, sd, J['up' + sd].p)); g.drawImage(poseImgs['kol' + sd], P.x, P.y, P.w, P.h); } });
    if (!upOn.L && raised(aL)) armDraw('L', aL);
    if (!upOn.R && raised(aR)) armDraw('R', aR);
    setM(tm); g.imageSmoothingEnabled = false;
    if (T.prop === 'phone') phone(aR.H[0] - 8, aR.H[1] + 10, t);
    if (T.prop === 'flag' && !upOn.R) flag(aR.H[0], aR.H[1], t);
    g.imageSmoothingEnabled = true;

    overlays(g, hm.transformPoint(new DOMPoint(516, 200)));
  }
  // ortak üst katman: çakılma yıldızları, konuşma balonu, parçacıklar
  function overlays(g, hp) {
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (c.state === 'crash' && hp) {
      for (let i = 0; i < 3; i++) { const a = t / 9 + i * 2.1; star(g, hp.x + Math.cos(a) * 40, hp.y - 30 + Math.sin(a) * 12); }
    }
    if (c.state === 'trapped') { const r = cageRect(); if (r.bottom > 0 && r.top < VH) bubble(g, c.x, GROUND - c.y - 1560 * K, c.say > 0 ? tr('tut ve sürükle!', 'grab & drag me!') : c.sayT > 0 ? c.sayText : tr('beni çıkar!', 'let me out!')); }
    else if (c.sayT > 0 && !['hang', 'drag', 'wait'].includes(c.state) && !(c.state === 'sleep')) bubble(g, c.x, GROUND - c.y - 1560 * K, c.sayText);
    if (c.state === 'hang') bubble(g, V.x, V.y - 30, tr(shakes > 2 ? 'bırakmam!' : 'yakaladım! salla beni', shakes > 2 ? 'not letting go!' : 'gotcha! shake me off'));
    // parçacıklar
    for (let i = parts.length - 1; i >= 0; i--) {
      const q = parts[i]; q.x += q.vx; q.y += q.vy; q.life--;
      g.globalAlpha = clamp(q.life / 30, 0, 1);
      if (q.type === 'dust') { q.vy += .05; q.vx *= .95; g.fillStyle = '#d8cfc0'; g.fillRect(q.x, q.y - q.s, q.s * 2, q.s * 2); }
      else { g.fillStyle = q.col || COL.pink; g.font = `700 ${q.txt.length > 1 ? 15 : 24}px "Space Mono", monospace`; g.fillText(q.txt, q.x - 6, q.y + Math.sin(q.life / 8) * 3); }
      g.globalAlpha = 1;
      if (q.life <= 0) parts.splice(i, 1);
    }
  }
  /* ---------- Yandan görünüm: gövde + sallanan kol ve bacaklar ---------- */
  function drawSide(g, turnSx) {
    const run = !['walk', 'twalk'].includes(c.state), sp = run ? .3 : .15, ph = t * sp;
    const sw = Math.sin(ph), legA = (run ? .36 : .22) * sw, armA = (run ? .55 : .3) * sw;
    const bob = -Math.abs(Math.cos(ph)) * (run ? 34 : 14), lean = run ? .07 : .02;
    const S = SIDE, F = S.foot, H = S.hip, SH = S.shoulder;
    const m = new DOMMatrix().translate(c.x, GROUND - c.y).scale(K * (2 - c.sq) * turnSx * vw.dir, K * c.sq).translate(-F[0], -F[1]);
    const body = new DOMMatrix(m).translate(0, bob).translate(H[0], H[1]).rotate(lean * 180 / Math.PI).translate(-H[0], -H[1]);
    const setM = mat => g.setTransform(mat.a * DPR, mat.b * DPR, mat.c * DPR, mat.d * DPR, mat.e * DPR, mat.f * DPR);
    const put = (im, p, mat) => { setM(mat); g.drawImage(im, p.x, p.y, p.w, p.h); };
    const rot = (mat, P, a) => new DOMMatrix(mat).translate(P[0], P[1]).rotate(a * 180 / Math.PI).translate(-P[0], -P[1]);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    // arkadaki kol ve bacak (koyu), sonra öndeki bacak, gövde, öndeki kol
    put(sideImgs.kolD, S.kol, rot(new DOMMatrix(body).translate(-14, 0), SH, armA));
    put(sideImgs.bacakD, S.bacak, rot(new DOMMatrix(m).translate(-10, bob), H, legA));
    put(sideImgs.bacak, S.bacak, rot(new DOMMatrix(m).translate(0, bob), H, -legA));
    put(sideImgs.govde, S.govde, body);
    const arm = rot(body, SH, -armA);
    put(sideImgs.kol, S.kol, arm);
    const hp = arm.transformPoint(new DOMPoint(S.hand[0], S.hand[1]));
    handWorld = { L: [hp.x, hp.y], R: [hp.x, hp.y] }; tmInv = null;
    if (run && Math.floor(t) % 9 === 0 && Math.random() < .5) spawn('dust', c.x - c.dir * 20, GROUND, 1);
    overlays(g, null);
  }
  /* ---------- Tam pozlar: kafa kaşıma, arkadan bakma, oturma, yaşasın ---------- */
  function drawPose(g, key, turnSx) {
    const nm = { back: 'arka', sit: 'otur', kasima: 'kasima', cheer: 'yasasin', zipla: 'zipla', elL: 'elL', elR: 'elR', telefon: 'telefon', kitap: 'kitap', gitar: 'gitar', comel: 'comel' }[key], P = POSE[nm], im = poseImgs[nm];
    let dy = 0, rot = 0, sc = K * (P.sc || 1), sy = 1;
    const A = c.state === 'act' ? c.act : null, waving = A === 'wave' || (c.state === 'trapped' && key === 'elR');
    if (key === 'kasima') { rot = Math.sin(t * .4) * .025; dy = -Math.abs(Math.sin(t * .4)) * 3; }
    if (key === 'comel') { rot = Math.sin(t * .7) * .035; dy = -Math.abs(Math.sin(t * .35)) * 2; } // çömelmiş, harfi ovalar
    if (key === 'back') { rot = c.state === 'terase' ? Math.sin(t * .7) * .05 : Math.sin(c.st / 45) * .02; }
    if (key === 'sit') { sy = 1 + Math.sin(t / 35) * .012; if (c.state === 'sleep') rot = Math.sin(t / 60) * .015; }
    if (waving) { rot = Math.sin(t * .3) * .035; dy = -Math.abs(Math.sin(t * .3)) * 4; }
    if (A === 'dance') { dy = -Math.abs(Math.sin(t / 28 * Math.PI)) * 30 * (K / .16); rot = Math.sin(t / 56 * Math.PI) * .05; }
    if (A === 'flag') { rot = Math.sin(t * .07) * .03; }
    if (key === 'gitar') { const b = t / 24 * Math.PI; dy = -Math.abs(Math.sin(b)) * 6 * (K / .16); rot = Math.sin(b / 2) * .035; } // ritimle sallanır
    if (key === 'telefon' || key === 'kitap') { sy = 1 + Math.sin(t / 35) * .012; if (key === 'kitap' && (t % 160) < 12) dy = -3; } // nefes; kitapta sayfa çevirirken kıpırdar
    if (c.state === 'air' && key === 'cheer') { rot = c.vy < 0 ? Math.sin(t * .45) * .07 : 0; sy = c.vy > 3 ? 1.05 : 1; }
    if (c.state === 'drag') { rot = Math.sin(t * .4) * .04; }
    if (key === 'cheer' && A === 'cheer') { const h = Math.abs(Math.sin(c.st * .14)); dy = -h * 70 * (K / .16); if (h < .25) sy = .94; }
    if (key === 'cheer' && c.state === 'party') sy = c.st < 8 ? .9 : 1; // iniş esnemesi, sonra hazırlanır
    if (key === 'zipla') { rot = clamp(c.vx * .02, -.2, .2); sy = c.vy > 4 ? 1.06 : 1; }
    let m;
    if (c.state === 'hang' && P.fist) { // yumruğu imlecin üstünde, oradan sarkar
      m = new DOMMatrix().translate(V.x, V.y).rotate(c.rot * 180 / Math.PI).scale(sc).translate(-P.fist[0], -P.fist[1]);
      const fw = m.transformPoint(new DOMPoint(P.foot[0], P.foot[1])); c.x = fw.x; c.y = GROUND - fw.y;
    } else {
      m = c.state === 'drag' ? new DOMMatrix().translate(mx, my).rotate(c.rot * 180 / Math.PI).translate(-mx, -my) : new DOMMatrix();
      m = m.translate(c.x, GROUND - c.y + dy).rotate(rot * 180 / Math.PI)
        .scale(sc * (2 - c.sq) * turnSx * (2 - sy), sc * c.sq * sy).translate(-P.foot[0], -P.foot[1]);
    }
    // bayrak: direk yumruğun içinden (görselin arkasında, yumruk direği kavrar)
    const fistW = P.fist ? m.transformPoint(new DOMPoint(P.fist[0], P.fist[1])) : null;
    if (A === 'flag' && fistW) { ctx = g; g.setTransform(K * DPR, 0, 0, K * DPR, fistW.x * DPR, fistW.y * DPR); g.imageSmoothingEnabled = false; flag(0, 26, t); }
    const setM = mat => g.setTransform(mat.a * DPR, mat.b * DPR, mat.c * DPR, mat.d * DPR, mat.e * DPR, mat.f * DPR);
    setM(m); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(im, P.x, P.y, P.w, P.h);
    ctx = g;
    if (key === 'sit' && (c.state === 'sleep' || (t % 230) < 7)) { // göz kapama / kırpma
      SIT.eyes.forEach(([x, y]) => {
        g.fillStyle = SIT.skin; g.beginPath(); g.ellipse(x, y, SIT.rx, SIT.ry, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = COL.ink; g.lineWidth = SIT.lw; g.lineCap = 'square'; g.beginPath(); g.arc(x, y - SIT.r * .55, SIT.r, .2 * Math.PI, .8 * Math.PI); g.stroke();
      });
    }
    if (key === 'kasima' && Math.floor(t / 7) % 2) { // kaşınma çizgileri
      g.imageSmoothingEnabled = false;
      [[700, 40, -.5], [735, 70, -.15], [748, 112, .2]].forEach(([x, y, a]) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = COL.ink; g.fillRect(-6, -26, 12, 40); g.restore(); });
    }
    if (A === 'dance') { // kulaklık: iskeletin kafa koordinatlarına göre
      const hm = new DOMMatrix().translate(c.x, GROUND - c.y + dy).rotate(rot * 180 / Math.PI).scale(K * (2 - c.sq), K * c.sq).translate(-FOOT[0], -FOOT[1]).translate(HP_OFF[key] || 0, 0);
      setM(hm); g.imageSmoothingEnabled = false; headphones();
    }
    if (waving && fistW && Math.floor(t / 8) % 2) { // el sallama çizgileri
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.fillStyle = COL.ink;
      [[-1, -.5], [0, -1], [1, -.5]].forEach(([i, j]) => g.fillRect(fistW.x + i * 16 * (K / .16) - 2, fistW.y - 26 * (K / .16) + j * 6 * (K / .16) - 6, 4, 9));
    }
    // imleç yakalama için yumruk konumları
    handWorld = { L: [-999, -999], R: [-999, -999] }; tmInv = null;
    if (key === 'elR' && fistW) handWorld.R = [fistW.x, fistW.y];
    if (key === 'elL' && fistW) handWorld.L = [fistW.x, fistW.y];
    if (key === 'cheer') ['L', 'R'].forEach(sd => { const q = m.transformPoint(new DOMPoint(...P.fists[sd])); handWorld[sd] = [q.x, q.y]; });
    overlays(g, null);
  }
  /* ---------- Yere yapışık hâl (çakılınca) ---------- */
  function drawFlat(g) {
    const Y = SIDE.yere, KF = K * Y.sc, s = c.state === 'crash' ? c.st - 10 : 0;
    const squash = c.state === 'crash' ? 1 - Math.max(0, 1 - s / 14) * .22 * Math.cos(s * .5) : 1;
    const lift = c.state === 'getup' ? Math.sin(Math.min(1, c.st / 14) * Math.PI / 2) * 10 : 0;
    const twitch = c.state === 'crash' && s > 40 && Math.floor(s / 30) % 3 === 0 ? Math.sin(s * 1.6) * 1.5 : 0;
    const fx = Y.feet; // ayak ucu
    const m = new DOMMatrix().translate(c.x + twitch, GROUND - lift).scale(KF * -c.crashDir * (2 - squash), KF * squash).translate(-fx, -Y.ground);
    g.setTransform(m.a * DPR, m.b * DPR, m.c * DPR, m.d * DPR, m.e * DPR, m.f * DPR);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(sideImgs.yere, Y.x, Y.y, Y.w, Y.h);
    handWorld = { L: [-999, -999], R: [-999, -999] }; tmInv = null;
    overlays(g, null);
  }
  function star(g, x, y) { g.fillStyle = COL.yellow; g.fillRect(x - 2, y - 9, 4, 18); g.fillRect(x - 9, y - 2, 18, 4); g.fillStyle = COL.ink; g.fillRect(x - 2, y - 2, 4, 4); }
  function bubble(g, x, y, text) {
    g.font = '700 13px "Space Mono", monospace';
    const pw = g.measureText(text).width + 20, ph = 28, bx = clamp(x - pw / 2, 6, VW - pw - 6), by = Math.max(6, y - ph);
    g.fillStyle = COL.ink; g.fillRect(bx + 3, by + 3, pw, ph); g.fillStyle = COL.yellow; g.fillRect(bx, by, pw, ph);
    g.strokeStyle = COL.ink; g.lineWidth = 2; g.strokeRect(bx, by, pw, ph); g.fillStyle = COL.ink; g.fillText(text, bx + 10, by + 18);
  }

  window.__pzData = { SIDE, POSE, base: IMG_BASE }; // 404 sayfasındaki mini oyun bu çizimleri kullanır
  window.__pz = { c, J, targets, vw, startText, startErase, startFail, swapped, fixPair, TX, say, onChar, chase };
  requestAnimationFrame(step);
})();
