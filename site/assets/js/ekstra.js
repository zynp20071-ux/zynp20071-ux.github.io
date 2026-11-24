/* =========================================================
   Ekstra oyun katmanı
   1. Gece / gündüz — gerçek saate göre (20:00–07:00 gece); üstteki ay/güneş düğmesiyle değiştirilir.
      Arka plan: gündüz piksel güneş + bulutlar + renkli pırıltılar, gece yıldızlar + ay
   2. Tıkla → konfeti (ana sayfa) — Piksel Zeynep yere düşen parçaları toplamaya koşar
   3. Kendini çizen süslemeler — [data-doodle] başlıklar görünür olunca çizilir
   4. Tekrar hoş geldin — geri gelen ziyaretçiye kaldığı yeri hatırlatır
   5. Gizli yıldızlar — her sayfada bir tane; karakter kaç tane kaldığını söyler, 6'sını bulana sırrını verir
   6. Galeri oyunu — albüm (topla), fotoğrafçı flaşı, “Eşini bul” hafıza oyunu
   7. Hakkımda: RPG karakter kartı — XP dolunca "level up"
   Performans: kare başına yerleşim okuması yok; konumlar yalnızca açılışta / boyut değişince ölçülür.
   ========================================================= */
(() => {
  const root = document.documentElement, body = document.body;
  const R = body.dataset.root || '';
  const PAGE = body.dataset.page || '';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || (() => { try { return localStorage.getItem('azaltHareket') === '1'; } catch (e) { return false; } })();
  const HOVER = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = window.gsap;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const L = () => (root.lang === 'en' ? 1 : 0);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const bi = (a, b) => `<span lang="tr">${a}</span><span lang="en">${b}</span>`;
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const sfx = n => window.__sfx && window.__sfx(n);
  const unlock = id => window.__unlock && window.__unlock(id);
  const pz = () => window.__pz;
  const STAR_TOTAL = 6; // gizli yıldız sayısı (bkz. 5. bölüm)

  /* =========================================================
     1. GECE / GÜNDÜZ  (sınıf, sayfa çizilmeden <head> içinde eklenir: build.py)
     ========================================================= */
  const themeBtns = $$('[data-theme-toggle]');
  const metaTheme = $('meta[name="theme-color"]');
  const isNight = () => root.classList.contains('night');
  function syncTheme() {
    const n = isNight();
    themeBtns.forEach(b => b.setAttribute('aria-pressed', n ? 'true' : 'false'));
    if (metaTheme) metaTheme.content = n ? '#16132a' : '#ff48b0';
  }
  // gökyüzü katmanı (sayfanın arkasında, CSS gösterir): gündüz güneş + bulut + riso pırıltıları, gece yıldız + ay
  const sky = document.createElement('div');
  sky.className = 'sky'; sky.setAttribute('aria-hidden', 'true');
  const rnd = (a, b) => (a + Math.random() * (b - a)).toFixed(1);
  let day = '<i class="sun"></i>', night = '<i class="moon"></i>';
  for (let i = 0; i < 4; i++) day += `<i class="cloud c${i % 2}" style="top:${rnd(14 + i * 20, 24 + i * 20)}%;animation-duration:${rnd(140, 220)}s;animation-delay:-${rnd(0, 200)}s;--s:${rnd(.7, 1.3)}"></i>`;
  const SP = ['p', 'b', 'y'];
  for (let i = 0; i < 26; i++) day += `<i class="sp ${SP[i % 3]}" style="left:${rnd(0, 100)}%;top:${rnd(0, 100)}%;animation-delay:-${rnd(0, 6)}s;animation-duration:${rnd(4, 8)}s"></i>`;
  for (let i = 0; i < 46; i++) night += `<i class="st${Math.random() < .18 ? ' big' : ''}" style="left:${rnd(0, 100)}%;top:${rnd(0, 100)}%;animation-delay:-${rnd(0, 4)}s;animation-duration:${rnd(2.5, 5.5)}s"></i>`;
  sky.innerHTML = `<div class="sky-day">${day}</div><div class="sky-night">${night}</div>`;
  body.prepend(sky);
  syncTheme();
  if (isNight()) setTimeout(() => unlock('gece'), 3200);
  themeBtns.forEach(b => b.addEventListener('click', () => {
    const n = !isNight();
    if (!RM) { root.classList.add('theme-anim'); setTimeout(() => root.classList.remove('theme-anim'), 700); }
    root.classList.toggle('night', n);
    store.set('tema', n ? 'gece' : 'gunduz');
    syncTheme(); sfx(n ? 'close' : 'open');
    if (n) { unlock('gece'); pz() && pz().say(L() ? 'good night…' : 'iyi geceler…', 160); }
    else pz() && pz().say(L() ? 'morning!' : 'günaydın!', 160);
  }));

  /* =========================================================
     2. TIKLA → KONFETİ (ana sayfa)
     Boş bir yere tıklayınca konfeti patlar; parçalar ekranın altına kadar süzülüp yere serilir.
     Piksel Zeynep yere düşen parçalara koşar ve üstünden geçtiklerini toplar.
     Başka sayfalarda da açmak için CONFETTI_PAGES listesine ekle.
     ========================================================= */
  const CONFETTI_PAGES = ['index.html'];
  if (CONFETTI_PAGES.includes(PAGE) && !RM) {
    const cv = document.createElement('canvas'); cv.className = 'tap-confetti'; cv.setAttribute('aria-hidden', 'true');
    body.appendChild(cv);
    const g = cv.getContext('2d');
    let W = 0, H = 0, DPR = 1;
    const size = () => { DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; };
    size(); addEventListener('resize', size);
    const COLS = ['#ff48b0', '#0070b4', '#ffe800', '#ff6c5c'];
    const SKIP = 'a, button, input, textarea, select, label, summary, video, iframe, [role="button"], [data-sticker], [data-lightbox], .pz-guide, .ach-panel, .lightbox, .welcome, .hstar, .pz-yuva, .pz-swapped, .pz-erased, .pz-word, .mnav';
    const ps = [];
    let raf = 0, t = 0, last = 0, chaseT = 0, lastCoin = 0, got = 0, cagedSaid = false, cdir = 0; // cdir: karakterin topladığı yön

    function burst(x, y) {
      const n = 26 + Math.floor(Math.random() * 8);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 7;
        ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, w: 6 + Math.random() * 5, h: 3 + Math.random() * 4,
          r: Math.random() * 6, vr: (Math.random() - .5) * .35, ph: Math.random() * 6, col: COLS[i % COLS.length], st: 'fly', life: 0, a: 1 });
      }
      while (ps.length > 260) ps.shift(); // çok birikirse en eskiler gider
      sfx('pop');
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    }

    document.addEventListener('click', e => {
      if (e.button !== 0 || e.defaultPrevented) return;
      const tg = e.target;
      if (tg.closest && tg.closest(SKIP)) return;
      const sel = getSelection && getSelection(); if (sel && String(sel).length) return; // metin seçiyorsa değil
      const P = pz(); if (P && P.onChar && P.onChar(e.clientX, e.clientY)) return; // karaktere tıklamak konuşma açar
      burst(e.clientX, e.clientY);
    });

    function loop(now) {
      const dt = Math.min(3, (now - last) / 16.67); last = now; t += dt;
      const P = pz(), c = P && P.c;
      const canCollect = c && c.y === 0 && ['idle', 'act', 'walk', 'roam', 'run'].includes(c.state);
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      let resting = null, restDist = 1e9, ahead = null, aheadDist = 1e9;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        if (p.st === 'fly') {
          p.vy = Math.min(p.vy + .3 * dt, 2.6 + p.w * .08);         // kâğıt gibi yavaş düşer
          p.vx *= Math.pow(.97, dt);
          p.x += (p.vx + Math.sin(t * .08 + p.ph) * .7) * dt; p.y += p.vy * dt; p.r += p.vr * dt;
          if (p.x < 4) { p.x = 4; p.vx = Math.abs(p.vx); } else if (p.x > W - 4) { p.x = W - 4; p.vx = -Math.abs(p.vx); }
          if (p.y >= H - 3) { p.y = H - 2 - Math.random() * 3; p.st = 'rest'; p.life = 0; p.r = Math.round(p.r / Math.PI) * Math.PI + (Math.random() - .5) * .5; }
        } else if (p.st === 'rest') {
          p.life += dt;
          if (p.life > 720) { p.a -= .02 * dt; if (p.a <= 0) { ps.splice(i, 1); continue; } } // ~12 sn sonra solar
          if (canCollect && Math.abs(p.x - c.x) < 30) { // karakter üstünden geçti: toplar
            p.st = 'pop'; p.vy = -5 - Math.random() * 3; p.vx = (Math.random() - .5) * 3; p.life = 0; got++;
            if (now - lastCoin > 90) { lastCoin = now; sfx('blip'); }
          } else {
            const d = c ? Math.abs(p.x - c.x) : 0; if (d < restDist) { restDist = d; resting = p; }
            if (c && cdir && (p.x - c.x) * cdir > -10 && d < aheadDist) { aheadDist = d; ahead = p; } // gittiği yöndeki en yakın
          }
        } else { // toplandı: yukarı zıplayıp kaybolur
          p.vy += .35 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += .4 * dt; p.a -= .045 * dt;
          if (p.a <= 0) { ps.splice(i, 1); continue; }
        }
        g.globalAlpha = Math.max(0, p.a);
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.col;
        g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (p.st === 'fly' ? Math.abs(Math.cos(t * .15 + p.ph)) * .8 + .2 : 1)); // dönerken incelir
        g.restore();
      }
      g.globalAlpha = 1;
      // karakter: en yakın yerdeki parçaya koşar
      chaseT -= dt;
      if (P && resting && chaseT <= 0) {
        chaseT = 18;
        if (c.state === 'trapped') {
          if (!cagedSaid) { cagedSaid = true; P.say(L() ? 'let me out, I want some too!' : 'beni de çıkar, ben de toplamak istiyorum!', 260); }
        } else {
          // önce bir yöndekilerin hepsini toplar, o yönde kalmayınca geri döner (sağa sola zikzak yapmaz)
          let tgt = ahead;
          if (!tgt) { tgt = resting; cdir = Math.sign(resting.x - c.x) || 1; }
          // o yöndeki en uzak parçaya kadar koşar; yoldakileri üstünden geçerken toplar
          for (const q of ps) if (q.st === 'rest' && (q.x - c.x) * cdir > (tgt.x - c.x) * cdir) tgt = q;
          if ((c.state !== 'roam' || Math.abs(c.tx - tgt.x) > 30) && P.chase(tgt.x) && Math.random() < .25) P.say(pick(L() ? ['mine!', 'confetti!!', 'wait for me!'] : ['benim!', 'konfetii!', 'bekle beni!']), 110);
        }
      }
      if (!resting) cdir = 0;
      if (!resting && got >= 12 && c && c.state !== 'trapped') { // yerdekilerin hepsini topladı
        P.say(pick(L() ? ['all mine!', 'more please!', 'clean floor ✓'] : ['hepsi benim!', 'bir daha!', 'yer tertemiz ✓']), 150); got = 0;
      }
      if (ps.length) raf = requestAnimationFrame(loop);
      else { raf = 0; g.clearRect(0, 0, W, H); got = 0; cagedSaid = false; cdir = 0; }
    }
  }

  /* =========================================================
     3. KENDİNİ ÇİZEN SÜSLEMELER
     <h2 data-doodle="underline|circle|arrow|stars" data-doodle-on="em">  (data-doodle-on: süslemenin saracağı parça)
     ========================================================= */
  const SHAPES = {
    underline: { vb: [200, 30], d: 'M3 18 C 30 8, 55 26, 85 15 S 140 6, 170 16 S 192 20, 197 12' },
    circle: { vb: [200, 100], d: 'M120 8 C 60 2, 6 20, 8 52 C 10 86, 80 96, 140 90 C 186 84, 198 56, 190 34 C 182 14, 140 4, 92 10' },
    arrow: { vb: [100, 100], d: 'M92 10 C 70 8, 52 30, 62 48 C 70 62, 88 50, 78 38 C 66 24, 36 40, 14 82 M14 82 L 12 60 M14 82 L 34 74' },
    stars: { vb: [100, 100], d: 'M30 20 L30 50 M15 35 L45 35 M70 50 L70 80 M58 65 L82 65 M78 14 L78 30 M70 22 L86 22' },
  };
  const doodles = $$('[data-doodle]').map(h => {
    const s = SHAPES[h.dataset.doodle]; if (!s) return null;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'doodle doodle--' + h.dataset.doodle); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<path pathLength="1"/>';
    h.classList.add('has-doodle'); h.appendChild(svg);
    return { h, svg, type: h.dataset.doodle, shape: s };
  }).filter(Boolean);
  // konum: offsetLeft/Top zinciriyle ölçülür (başlığın giriş animasyonundaki transform'lardan etkilenmez)
  function rel(el, anc) {
    let x = 0, y = 0, e = el;
    while (e && e !== anc) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    if (e !== anc) { const a = anc.getBoundingClientRect(), b = el.getBoundingClientRect(); return [b.left - a.left, b.top - a.top]; }
    return [x, y];
  }
  function placeDoodle(o) {
    const sel = o.h.dataset.doodleOn;
    const tgt = (sel && [...o.h.querySelectorAll(sel)].find(el => el.offsetParent !== null && el.getClientRects().length)) || o.h;
    const w = tgt.offsetWidth, h = tgt.offsetHeight;
    if (!w) return;
    const [x, y] = tgt === o.h ? [0, 0] : rel(tgt, o.h), st = o.svg.style;
    const box = {
      underline: [x - w * .02, y + h * .82, w * 1.04, h * .28],
      circle: [x - w * .1, y - h * .14, w * 1.2, h * 1.28],
      arrow: [x + w + h * .05, y - h * .35, h * .85, h * .85],
      stars: [x + w - h * .05, y - h * .5, h * .6, h * .6],
    }[o.type];
    st.left = box[0] + 'px'; st.top = box[1] + 'px'; st.width = box[2] + 'px'; st.height = box[3] + 'px';
    // yolu gerçek piksel boyutuna ölçekle (çizgi kalınlığı ve çizilme animasyonu bozulmasın)
    const sx = box[2] / o.shape.vb[0], sy = box[3] / o.shape.vb[1]; let n = 0;
    o.svg.setAttribute('viewBox', `0 0 ${box[2].toFixed(1)} ${box[3].toFixed(1)}`);
    o.svg.firstChild.setAttribute('d', o.shape.d.replace(/-?\d*\.?\d+/g, v => (+v * (n++ % 2 ? sy : sx)).toFixed(1)));
  }
  if (doodles.length) {
    const placeAll = () => doodles.forEach(placeDoodle);
    // yazı tipleri yüklenince ölç; boyut ya da dil değişince yeniden
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(placeAll, 50));
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(placeAll, 200); });
    document.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-set-lang]')) setTimeout(placeAll, 60); });
    if (RM || !('IntersectionObserver' in window)) doodles.forEach(o => o.svg.classList.add('drawn'));
    else {
      const io = new IntersectionObserver(es => es.forEach(en => {
        if (!en.isIntersecting) return;
        const o = doodles.find(d => d.h === en.target); placeDoodle(o);
        setTimeout(() => o.svg.classList.add('drawn'), 650); // başlık maskeden çıktıktan sonra
        io.unobserve(en.target);
      }), { threshold: .6 });
      doodles.forEach(o => io.observe(o.h));
    }
  }

  /* =========================================================
     4. TEKRAR HOŞ GELDİN
     ========================================================= */
  const relPath = () => { const parts = location.pathname.split('/').filter(Boolean); const n = (R.match(/\.\.\//g) || []).length + 1; return parts.slice(-n).join('/') || 'index.html'; };
  let firstOfSession = false;
  try { firstOfSession = sessionStorage.getItem('oturum') !== '1'; sessionStorage.setItem('oturum', '1'); } catch (e) {}
  const prev = store.get('sonZiyaret', null);
  if (firstOfSession) {
    const visits = store.get('ziyaretSay', 0) + 1; store.set('ziyaretSay', visits);
    if (prev && visits > 1 && Date.now() - prev.t > 20 * 60 * 1000) setTimeout(() => welcome(prev, visits), 2400);
  }
  if (PAGE !== '404.html') addEventListener('pagehide', () => store.set('sonZiyaret', { t: Date.now(), path: relPath(), tr: document.title.split(' — ')[0], en: (body.dataset.titleEn || document.title).split(' — ')[0] }));
  function welcome(p, visits) {
    const here = relPath() === p.path;
    const el = document.createElement('div'); el.className = 'welcome'; el.setAttribute('role', 'status');
    const ord = n => n + '.';
    el.innerHTML = `<button class="welcome-x" type="button" aria-label="Kapat" data-aria-en="Close">✕</button>
      <b>${bi('Yine geldin! 👋', 'You’re back! 👋')}</b>
      <span>${bi(`Bu ${ord(visits)} ziyaretin.`, `This is visit number ${visits}.`)}${here ? '' : ' ' + bi(`Geçen sefer <em>${esc(p.tr)}</em> sayfasındaydın.`, `Last time you were on <em>${esc(p.en)}</em>.`)}</span>
      ${here ? '' : `<a class="welcome-go" href="${esc(R + p.path)}">${bi('Kaldığın yerden devam', 'Pick up where you left off')} →</a>`}`;
    body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    const bye = () => { el.classList.remove('in'); setTimeout(() => el.remove(), 500); };
    $('.welcome-x', el).addEventListener('click', bye);
    setTimeout(bye, 11000);
    sfx('coin');
    const P = pz(); if (P) P.say(P.c.state === 'trapped' || P.c.state === 'wait' ? (L() ? 'you again! get me out!' : 'yine mi sen? çıkar beni!') : (L() ? 'missed you!' : 'seni özledim!'), 320);
  }

  /* =========================================================
     5. GİZLİ YILDIZLAR (her sayfada bir tane)
     ========================================================= */
  const STARS = { // sayfa: [hangi öğenin içinde, konum]
    'index.html': ['.manifesto', 'right:2.5%;bottom:8%'],
    'hakkimda.html': ['main > section:nth-of-type(3)', 'left:2%;top:10%'],
    'projeler.html': ['.page-hero', 'right:6%;bottom:14%'],
    'galeri.html': ['main > section:nth-of-type(2)', 'left:1%;bottom:2%'],
    'blog.html': ['.page-hero', 'right:22%;top:30%'],
    'iletisim.html': ['main > section:last-of-type', 'right:3%;top:4%'],
  };
  const found = store.get('yildizlar', []);
  const spot = STARS[PAGE] && $(STARS[PAGE][0]);
  if (spot && !found.includes(PAGE)) {
    if (getComputedStyle(spot).position === 'static') spot.style.position = 'relative';
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'hstar'; b.style.cssText = STARS[PAGE][1];
    b.setAttribute('aria-label', L() ? 'Hidden star' : 'Gizli yıldız');
    b.innerHTML = '<svg viewBox="0 0 9 9" width="22" height="22" aria-hidden="true"><path fill="#1e1b2e" d="M4 0h1v2h1v1h3v1H8v1H7v1h1v3H7V8H6V7H3v1H2v1H1V6h1V5H1V4H0V3h3V2h1z"/><path fill="#ffe800" d="M4 2h1v1h1v1h2v1H7v2H6V6H3v1H2V5H1V4h2V3h1z"/></svg>';
    spot.appendChild(b);
    b.addEventListener('click', e => {
      e.stopPropagation();
      const list = store.get('yildizlar', []); if (!list.includes(PAGE)) list.push(PAGE); store.set('yildizlar', list);
      sfx('coin');
      const done = list.length >= STAR_TOTAL;
      const r = b.getBoundingClientRect();
      const tag = document.createElement('div'); tag.className = 'star-count'; tag.setAttribute('role', 'status');
      tag.innerHTML = `★ ${list.length}/${STAR_TOTAL}` + (done ? ' ' + bi('— hepsi!', '— all of them!') : '');
      tag.style.left = r.left + r.width / 2 + 'px'; tag.style.top = r.top + 'px';
      body.appendChild(tag); setTimeout(() => tag.remove(), 1800);
      if (G && !RM) G.to(b, { y: -80, rotate: 360, scale: 1.6, autoAlpha: 0, duration: .7, ease: 'power2.out', onComplete: () => b.remove() });
      else b.remove();
      if (done) {
        unlock('yildiz'); window.__confetti && window.__confetti(180);
        const P = pz(); P && P.say(L() ? 'all stars! secret: ↑↑↓↓←→←→BA' : 'hepsini buldun! sırrım: ↑↑↓↓←→←→BA', 520);
      } else {
        const P = pz(); P && P.say(L() ? `${STAR_TOTAL - list.length} more to go!` : `${STAR_TOTAL - list.length} tane kaldı!`, 200);
      }
    });
  }

  /* =========================================================
     6. GALERİ OYUNU (galeri.html)
     a) Albüm: büyütülen her fotoğraf "toplanır" (localStorage 'albüm'), hepsi → başarım 'kurator'
     b) Fotoğrafçı: fotoğraf açılınca flaş patlar, Piksel Zeynep yorum yapar
     c) Eşini bul: galerideki fotoğraflarla hafıza oyunu (rekor: localStorage 'hafizaRekor')
     ========================================================= */
  if (PAGE === 'galeri.html') {
    const figs = $$('.masonry [data-lightbox]');
    const keyOf = f => { const im = $('img', f); return (im.getAttribute('src') || '').split('/').pop(); };
    const TOTAL = figs.length;
    let album = store.get('album', []).filter(k => figs.some(f => keyOf(f) === k));
    const countEls = $$('[data-album-count]'), slots = $('[data-album-slots]');
    if (slots) slots.innerHTML = figs.map(() => '<i></i>').join('');
    function stamp(f) {
      if (f.querySelector('.got-stamp')) return;
      const s = document.createElement('span'); s.className = 'got-stamp'; s.setAttribute('aria-hidden', 'true'); s.textContent = '✓';
      f.appendChild(s); f.classList.add('got');
    }
    function renderAlbum(bump) {
      countEls.forEach(el => { el.textContent = `${album.length}/${TOTAL}`; });
      if (slots) [...slots.children].forEach((sl, i) => sl.classList.toggle('on', i < album.length));
      figs.forEach(f => { if (album.includes(keyOf(f))) stamp(f); });
      const box = $('[data-album]');
      if (bump && box && !RM) { box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump'); }
      if (box) box.classList.toggle('done', album.length >= TOTAL);
    }
    renderAlbum(false);

    // ışık kutusundaki küçük albüm rozeti
    const lb = $('.lightbox');
    let lbChip = null;
    if (lb) {
      lbChip = document.createElement('div'); lbChip.className = 'lb-album'; lbChip.setAttribute('aria-live', 'polite');
      lb.appendChild(lbChip);
    }
    const flash = document.createElement('div'); flash.className = 'cam-flash'; flash.setAttribute('aria-hidden', 'true'); body.appendChild(flash);
    const SAY_NEW = [['çek! 📸', 'snap! 📸'], ['bu benim favorim!', 'my favourite!'], ['ışık süper', 'great light'], ['albüme ekledim', 'added to the album'], ['netlik tam', 'nice and sharp']];
    let opening = false;
    document.addEventListener('lb:open', () => { opening = true; });
    document.addEventListener('lb:show', e => {
      const f = e.detail.item; if (!figs.includes(f)) return;
      const k = keyOf(f), isNew = !album.includes(k);
      if (opening && !RM) { flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go'); sfx('shutter'); }
      opening = false;
      if (isNew) {
        album.push(k); store.set('album', album); renderAlbum(true);
        if (album.length >= TOTAL) {
          unlock('kurator'); window.__confetti && window.__confetti(160);
          const P = pz(); P && P.say(L() ? 'album complete! 📷' : 'albüm tamam! 📷', 300);
        } else {
          const P = pz(); P && P.say(pick(SAY_NEW)[L()], 150);
        }
      }
      if (lbChip) {
        lbChip.innerHTML = `📷 ${album.length}/${TOTAL}` + (isNew ? ` <em>${L() ? '+1 new!' : '+1 yeni!'}</em>` : '');
        lbChip.classList.toggle('new', isNew);
      }
    });

    /* ---- Eşini bul ---- */
    const grid = $('[data-memo-grid]');
    if (grid && figs.length >= 2) {
      const PAIRS = Math.min(6, figs.length);
      const movesEl = $('[data-memo-moves]'), timeEl = $('[data-memo-time]'), bestEl = $('[data-memo-best]');
      let cards = [], open = [], moves = 0, found = 0, t0 = 0, timer = 0, lock = false;
      const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      const showBest = () => { const b = store.get('hafizaRekor', null); bestEl.textContent = b ? `${b.m} · ${fmt(b.s)}` : '—'; };
      showBest();
      function deal() {
        clearInterval(timer); timer = 0; t0 = 0; moves = 0; found = 0; open = []; lock = false;
        movesEl.textContent = '0'; timeEl.textContent = '0:00';
        const pool = figs.slice().sort(() => Math.random() - .5).slice(0, PAIRS);
        const deck = [...pool, ...pool].sort(() => Math.random() - .5);
        const DUO = ['', 'duo--pink', 'duo--yellow', 'duo--coral'];
        grid.innerHTML = deck.map((f, i) => {
          const im = $('img', f);
          return `<button class="memo-card" type="button" data-k="${esc(keyOf(f))}" aria-label="${L() ? 'Card' : 'Kart'} ${i + 1}">
            <span class="memo-in"><span class="memo-back" aria-hidden="true">?</span>
            <span class="memo-front duo ${DUO[figs.indexOf(f) % 4]}"><img src="${esc(im.getAttribute('src'))}" alt="${esc(im.alt)}" loading="lazy"></span></span></button>`;
        }).join('');
        cards = $$('.memo-card', grid);
      }
      function tick() { timeEl.textContent = fmt(Math.floor((performance.now() - t0) / 1000)); }
      grid.addEventListener('click', e => {
        const c = e.target.closest('.memo-card');
        if (!c || lock || c.classList.contains('up') || c.classList.contains('done')) return;
        if (!t0) { t0 = performance.now(); timer = setInterval(tick, 500); }
        c.classList.add('up'); c.setAttribute('aria-label', $('img', c).alt); sfx('flip'); open.push(c);
        if (open.length < 2) return;
        moves++; movesEl.textContent = moves;
        const [a, b] = open; open = [];
        if (a.dataset.k === b.dataset.k) {
          a.classList.add('done'); b.classList.add('done'); found++; sfx('coin');
          if (found === PAIRS) win();
          else if (Math.random() < .35) { const P = pz(); P && P.say(pick(L() ? ['match!', 'nice!', 'got it!'] : ['eşleşti!', 'süper!', 'buldun!']), 110); }
        } else {
          lock = true;
          setTimeout(() => { a.classList.remove('up'); b.classList.remove('up'); lock = false; }, RM ? 500 : 850);
        }
      });
      function win() {
        clearInterval(timer); tick();
        const s = Math.floor((performance.now() - t0) / 1000), best = store.get('hafizaRekor', null);
        const rec = !best || moves < best.m || (moves === best.m && s < best.s);
        if (rec) store.set('hafizaRekor', { m: moves, s });
        showBest(); unlock('hafiza'); window.__confetti && window.__confetti(140); sfx('success');
        const P = pz(); P && P.say(rec ? (L() ? `new record: ${moves} moves!` : `yeni rekor: ${moves} hamle!`) : (L() ? `done in ${moves} moves!` : `${moves} hamlede bitti!`), 300);
      }
      $('[data-memo-reset]').addEventListener('click', deal);
      deal();
    }
  }

  // "Yapım alanı" projesinin sayfasında şantiye şefi Piksel Zeynep uyarır
  if (/projeler\/yapim-alani\.html$/.test(location.pathname)) {
    setTimeout(() => { const P = pz(); P && P.say(L() ? 'hard hats on! ⛑' : 'baretini takmayı unutma! ⛑', 260); }, 3200);
  }

  /* =========================================================
     7. RPG KARAKTER KARTI (hakkimda.html): XP çubuğu dolunca seviye rozeti "level up" zıplar
     ========================================================= */
  const rpgSkills = $$('[data-rpg] .rpg-skills li');
  if (rpgSkills.length) {
    const lvlUp = (li, i) => setTimeout(() => {
      li.classList.add('lvl'); sfx('coin');
      if (i === rpgSkills.length - 1) { const P = pz(); P && P.say(L() ? 'level up!' : 'seviye atladım!', 160); }
    }, RM ? 0 : 1500 + i * 280); // çubuk animasyonu (main.js, 1.4 sn) bitince
    if (RM || !('IntersectionObserver' in window)) rpgSkills.forEach(li => li.classList.add('lvl'));
    else {
      const io = new IntersectionObserver(es => {
        if (!es.some(e => e.isIntersecting)) return;
        rpgSkills.forEach(lvlUp); io.disconnect();
      }, { threshold: .4 });
      io.observe($('[data-rpg] .rpg-skills'));
    }
  }
})();
