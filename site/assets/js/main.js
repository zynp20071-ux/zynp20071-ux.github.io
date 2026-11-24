/* =========================================================
   Portfolyo — etkileşim, scrollytelling ve oyun katmanı
   Kütüphaneler: GSAP + ScrollTrigger, Lenis (yumuşak kaydırma)
   ========================================================= */
(() => {
  const root = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || (() => { try { return localStorage.getItem('azaltHareket') === '1'; } catch (e) { return false; } })(); // sistem tercihi ya da kılavuzdaki ayar
  const HOVER = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const tr = (a, b) => `<span lang="tr">${a}</span><span lang="en">${b}</span>`;
  let setCursor = () => {};
  window.__setCursor = st => setCursor(st); // karakter.js sürüklerken kullanır
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* =========================================================
     8-BİT SESLER — dosya yok, Web Audio ile anında üretilir.
     Varsayılan AÇIK (tarayıcı ilk dokunuştan sonra çalar); footer'daki "Ses" düğmesi / kılavuz ayarları kapatır (localStorage 'ses').
     Kullanım: window.__sfx('jump')  (karakter.js de kullanır)
     ========================================================= */
  const SFX = (() => {
    let on = store.get('ses', true), ac = null, master = null, lastHover = 0;
    const ctx = () => {
      if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); master = ac.createGain(); master.gain.value = .16; master.connect(ac.destination); }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    };
    // kare / üçgen dalga notası: f0 → f1 kayarak
    const tone = (f0, f1, dur, { type = 'square', vol = .5, delay = 0 } = {}) => {
      const a = ctx(); if (!a) return; const t0 = a.currentTime + delay;
      const o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .005); g.gain.exponentialRampToValueAtTime(.0008, t0 + dur);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + .02);
    };
    const noise = (dur, { vol = .5, freq = 1200, delay = 0, q = .8 } = {}) => {
      const a = ctx(); if (!a) return; const t0 = a.currentTime + delay;
      const b = a.createBuffer(1, Math.max(1, a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0008, t0 + dur);
      s.connect(f); f.connect(g); g.connect(master); s.start(t0);
    };
    const seq = (notes, step = .07, opt) => notes.forEach((f, i) => f && tone(f, f, step * 1.1, { ...opt, delay: i * step }));
    const PENTA = [523, 587, 659, 784, 880, 1047];
    const S = {
      hover: () => { const n = performance.now(); if (n - lastHover < 70) return; lastHover = n; tone(1400, 1400, .025, { vol: .12 }); },
      click: () => tone(880, 1320, .05, { vol: .3 }),
      on: () => seq([523, 659, 784, 1047], .06, { vol: .35 }),
      ach: () => seq([659, 784, 1047, 0, 1319, 1568], .075, { vol: .4 }),
      secret: () => seq([392, 523, 659, 784, 1047, 784, 1047, 1319], .08, { vol: .4 }),
      success: () => seq([784, 988, 1175, 1568], .08, { vol: .35 }),
      open: () => tone(300, 900, .12, { type: 'triangle', vol: .5 }),
      close: () => tone(900, 300, .1, { type: 'triangle', vol: .4 }),
      page: () => tone(660, 990, .05, { vol: .25 }),
      switch: () => seq([784, 1175], .05, { vol: .3 }),
      pick: () => tone(500, 1000, .07, { vol: .35 }),
      drop: () => tone(700, 250, .12, { vol: .35 }),
      jump: (p = 0) => tone(260 * (1 + p * .25), 760 * (1 + p * .25), .16, { vol: .4 }),
      land: () => noise(.05, { vol: .25, freq: 400 }),
      crash: () => { noise(.35, { vol: .7, freq: 250, q: .5 }); tone(400, 60, .4, { vol: .45 }); },
      grab: () => seq([523, 784], .06, { vol: .35 }),
      release: () => tone(900, 400, .1, { vol: .3 }),
      boing: () => { tone(200, 600, .1, { type: 'triangle', vol: .6 }); tone(600, 350, .12, { type: 'triangle', vol: .4, delay: .1 }); },
      pop: () => { tone(1200, 600, .05, { vol: .35 }); tone(900, 1500, .05, { vol: .35, delay: .07 }); },
      scrub: () => noise(.07, { vol: .25, freq: 2500, q: 2 }),
      yelp: () => { tone(900, 1800, .08, { vol: .45 }); tone(1800, 1200, .1, { vol: .35, delay: .08 }); },
      coin: () => { tone(988, 988, .07, { vol: .35 }); tone(1319, 1319, .25, { vol: .35, delay: .07 }); },
      strum: () => { const f = PENTA[Math.floor(Math.random() * PENTA.length)] / 2; tone(f, f, .3, { type: 'triangle', vol: .45 }); tone(f * 1.5, f * 1.5, .25, { type: 'triangle', vol: .2, delay: .03 }); },
      shutter: () => { noise(.04, { vol: .5, freq: 3000, q: 1.5 }); noise(.06, { vol: .35, freq: 1500, q: 1, delay: .07 }); },
      flip: () => tone(700, 1100, .04, { type: 'triangle', vol: .3 }),
      blip: () => { const f = 560 + Math.random() * 140; tone(f, f, .03, { vol: .13 }); },
      free: () => seq([523, 659, 784, 1047, 784, 1047], .07, { vol: .4 }),
    };
    const api = {
      play(name, arg) { if (!on || !S[name]) return; try { S[name](arg); } catch (e) { window.__sfxErr = name + ': ' + e; } },
      get on() { return on; },
      set(v, quiet) {
        on = !!v; store.set('ses', on);
        $$('[data-sound-toggle] .snd-state').forEach(el => el.innerHTML = on ? tr('Açık', 'On') : tr('Kapalı', 'Off'));
        $$('[data-sound-toggle]').forEach(b => b.setAttribute('aria-pressed', on ? 'true' : 'false'));
        $$('[data-sound]').forEach(i => { i.checked = on; });
        if (on && !quiet) S.on();
      },
    };
    // tarayıcılar sesi ancak bir dokunuştan sonra açar
    ['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => { if (on) ctx(); }, { once: true, capture: true }));
    return api;
  })();
  window.__sfx = (n, a) => SFX.play(n, a);
  // ses düğmeleri (footer) ve kılavuzdaki anahtar
  $$('[data-sound-toggle]').forEach(b => b.addEventListener('click', () => SFX.set(!SFX.on)));
  $$('[data-sound]').forEach(i => i.addEventListener('change', () => SFX.set(i.checked)));
  SFX.set(SFX.on, true); // yalnızca düğme görünümünü eşitle
  // genel arayüz sesleri: bağlantı/düğme tıklaması
  document.addEventListener('click', e => { const el = e.target.closest && e.target.closest('a, button, [role="button"]'); if (el && !el.matches('[data-sound-toggle], [data-guide-open], [data-guide-close], [data-guide-prev], [data-guide-next]')) SFX.play('click'); }, true);

  /* =========================================================
     A. BAŞARIM SİSTEMİ (oyun katmanı)
     ========================================================= */
  const ACH = [
    { id: 'merhaba', n: ['Hoş geldin!', 'Welcome!'], d: ['Siteyi ilk kez aç', 'Open the site for the first time'] },
    { id: 'dil', n: ['Dil ustası', 'Polyglot'], d: ['Dili değiştir', 'Switch the language'] },
    { id: 'daginik', n: ['Dağınıklık sanattır', 'Creative mess'], d: ['Anasayfadaki bir çıkartmayı sürükle', 'Drag a sticker on the home page'] },
    { id: 'sanat', n: ['Sanatsever', 'Art lover'], d: ['Galeride bir fotoğrafı büyüt', 'Enlarge a photo in the gallery'] },
    { id: 'kurator', n: ['Küratör', 'Curator'], d: ['Galerideki bütün fotoğrafları albümüne topla', 'Collect every photo in the gallery into your album'] },
    { id: 'hafiza', n: ['Fil hafızası', 'Elephant memory'], d: ['Galerideki “Eşini bul” oyununu bitir', 'Finish the “Find the pair” game in the gallery'] },
    { id: 'kurdu', n: ['Kitap kurdu', 'Bookworm'], d: ['Bir blog yazısını sonuna kadar oku', 'Read a blog post to the end'] },
    { id: 'son', n: ['Sonuna kadar', 'All the way down'], d: ['Bir sayfanın en altına in', 'Scroll to the very bottom of a page'] },
    { id: 'kasif', n: ['Kâşif', 'Explorer'], d: ['6 sayfanın hepsini gez', 'Visit all 6 pages'] },
    { id: 'yakalandin', n: ['Yakalandın!', 'Gotcha!'], d: ['Piksel Zeynep imlecini yakalasın', 'Let Pixel Zeynep catch your cursor'] },
    { id: 'cakildi', n: ['Güm!', 'Ouch!'], d: ['Çok hızlı kaydırıp karakteri yere çakılt', 'Scroll so fast the character crashes'] },
    { id: 'editor', n: ['Editör', 'Editor'], d: ['Karakterin karıştırdığı harfleri düzelt', 'Fix the letters the character swapped'] },
    { id: 'sucustu', n: ['Suçüstü!', 'Red-handed!'], d: ['Karakteri bir başlığı silerken yakala (tıkla)', 'Catch the character erasing a heading (click)'] },
    { id: 'kosucu', n: ['Koşucu', 'Runner'], d: ['404 sayfasındaki mini oyunda 300 puan yap', 'Score 300 in the mini game on the 404 page'] },
    { id: 'gece', n: ['Gece kuşu', 'Night owl'], d: ['Siteyi gece modunda gez (üstteki ay düğmesi)', 'Browse the site in night mode (moon button at the top)'] },
    { id: 'yildiz', n: ['Yıldız avcısı', 'Star hunter'], d: ['Sayfalara saklanmış 6 sarı yıldızı bul', 'Find the 6 yellow stars hidden across the pages'] },
    { id: 'gizli', n: ['Gizli kod', 'Secret code'], d: ['Gizli kodu bul — ipucu: logo ya da ↑↑↓↓←→←→BA', 'Find the secret — hint: the logo, or ↑↑↓↓←→←→BA'] },
  ];
  let unlocked = store.get('ach', []);
  const trophy = () => ($('#px-trophy') ? $('#px-trophy').innerHTML : '★');
  const toastBox = $('.toasts');
  const queue = []; let toasting = false;

  function updateCount() { $$('.ach-count:not(.snd-state, .char-mode)').forEach(el => el.textContent = `${unlocked.length}/${ACH.length}`); }
  function unlock(id) {
    if (unlocked.includes(id)) return;
    const a = ACH.find(x => x.id === id); if (!a) return;
    unlocked.push(id); store.set('ach', unlocked); updateCount();
    queue.push(a); if (!toasting) nextToast(); SFX.play('ach');
    $$('.hdr-ach').forEach(b => { b.classList.toggle('bump', false); void b.offsetWidth; b.classList.add('bump'); }); // üstteki düğme zıplasın
    if (unlocked.length === ACH.length) setTimeout(() => confetti(260), 900);
  }
  function nextToast() {
    const a = queue.shift(); if (!a || !toastBox) { toasting = false; return; }
    toasting = true;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="toast-ico">${trophy()}</span><div><small>${tr('Başarım açıldı', 'Achievement unlocked')}</small><b>${tr(a.n[0], a.n[1])}</b><span>${tr(a.d[0], a.d[1])}</span></div>`;
    toastBox.appendChild(el);
    const done = () => { el.remove(); nextToast(); };
    if (hasGSAP && !RM) {
      gsap.timeline({ onComplete: done })
        .from(el, { x: -60, opacity: 0, rotate: -6, duration: .6, ease: 'back.out(2)' })
        .from($('.toast-ico', el), { scale: 0, rotate: -90, duration: .5, ease: 'back.out(3)' }, '-=.3')
        .to(el, { x: -40, opacity: 0, duration: .4, ease: 'power2.in', delay: 3.2 });
    } else setTimeout(done, 3800);
  }
  // Panel
  const panel = $('.ach-panel');
  function renderPanel() {
    const ul = $('.ach-list', panel); if (!ul) return;
    ul.innerHTML = ACH.map(a => `<li class="${unlocked.includes(a.id) ? '' : 'locked'}"><span class="toast-ico">${trophy()}</span><div><b>${unlocked.includes(a.id) ? tr(a.n[0], a.n[1]) : '???'}</b><span>${tr(a.d[0], a.d[1])}</span></div></li>`).join('');
  }
  function openPanel() { if (!panel) return; renderPanel(); panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); window.__lenis && window.__lenis.stop(); $('[data-ach-close]', panel).focus(); }
  function closePanel() { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); window.__lenis && window.__lenis.start(); }
  $$('[data-ach-open]').forEach(b => b.addEventListener('click', openPanel));
  if (panel) {
    $('[data-ach-close]', panel).addEventListener('click', closePanel);
    panel.addEventListener('click', e => { if (e.target === panel) closePanel(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(); });
  }
  updateCount();
  window.__unlock = unlock;
  // Sayfa ziyaretleri → Kâşif
  const visited = new Set(store.get('visited', []));
  visited.add(document.body.dataset.page || 'index.html'); store.set('visited', [...visited]);
  setTimeout(() => { unlock('merhaba'); if (visited.size >= 6) unlock('kasif'); }, 2600);

  /* Konfeti (riso renkleri) */
  function confetti(n = 160) {
    if (RM) return;
    const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
    const ctx = c.getContext('2d'); const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
    const cols = ['#ff48b0', '#0078bf', '#ffe800', '#ff6c5c', '#1e1b2e'];
    const ps = Array.from({ length: n }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .55,
      vx: (Math.random() - .5) * 16, vy: -Math.random() * 18 - 6, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
      s: 6 + Math.random() * 9, c: cols[(Math.random() * cols.length) | 0], sh: Math.random() < .5
    }));
    let t = 0;
    (function frame() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ps.forEach(p => {
        p.vy += .45; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (p.sh) ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2.4, 0, 7); ctx.fill(); }
        ctx.restore();
      });
      if (++t < 220) requestAnimationFrame(frame); else c.remove();
    })();
  }
  window.__confetti = confetti;
  /* Gizli kod: Konami ya da logoya 5 hızlı tık */
  function secret() {
    unlock('gizli'); confetti(); SFX.play('secret');
    if (hasGSAP && !RM) {
      gsap.fromTo('.hero-name .char, .page-hero .display, .logo', { rotate: 0 }, { rotate: () => gsap.utils.random(-14, 14), yoyo: true, repeat: 3, duration: .12, ease: 'none', clearProps: 'rotate' });
    }
  }
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kp = 0;
  addEventListener('keydown', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kp = k === KONAMI[kp] ? kp + 1 : (k === KONAMI[0] ? 1 : 0);
    if (kp === KONAMI.length) { kp = 0; secret(); }
  });
  const logo = $('.logo'); let taps = [];
  if (logo) logo.addEventListener('click', e => {
    const now = Date.now(); taps = taps.filter(x => now - x < 1500); taps.push(now);
    if (taps.length >= 5) { e.preventDefault(); e.stopImmediatePropagation(); taps = []; secret(); }
    else if (document.body.dataset.page === 'index.html') { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  // Sayfa sonu
  const endEl = $('.footer-bottom');
  if (endEl) new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { unlock('son'); o.disconnect(); } })).observe(endEl);
  // Blog yazısı sonu
  const postEnd = $('.next-post');
  if (postEnd) new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { unlock('kurdu'); o.disconnect(); } })).observe(postEnd);

  /* =========================================================
     B. TEMEL ETKİLEŞİMLER (animasyonsuz da çalışır)
     ========================================================= */
  /* Dil */
  const titleTR = document.title;
  function setLang(lang, user) {
    root.lang = lang;
    store.set('lang', lang); try { localStorage.setItem('lang', lang); } catch (e) {}
    document.title = (lang === 'en' && document.body.dataset.titleEn) ? document.body.dataset.titleEn : titleTR;
    $$('[data-ph-en]').forEach(el => {
      if (!el.dataset.phTr) el.dataset.phTr = el.placeholder;
      el.placeholder = lang === 'en' ? el.dataset.phEn : el.dataset.phTr;
    });
    $$('[data-aria-en]').forEach(el => {
      if (!el.dataset.ariaTr) el.dataset.ariaTr = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', lang === 'en' ? el.dataset.ariaEn : el.dataset.ariaTr);
    });
    $$('[data-set-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.setLang === lang));
    if (user) { unlock('dil'); SFX.play('switch'); }
    if (hasGSAP) requestAnimationFrame(() => ScrollTrigger.refresh());
  }
  $$('[data-set-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.setLang, true)));
  setLang(root.lang === 'en' ? 'en' : 'tr');

  /* Mobil menü */
  const menuBtn = $('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', open);
      if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
    });
    $$('.mnav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));
  }

  /* Galeri ışık kutusu */
  const lb = $('.lightbox');
  if (lb) {
    const items = $$('[data-lightbox]');
    let idx = 0;
    const lbImg = $('img', lb), lbTitle = $('.lb-title', lb), lbDesc = $('.lb-desc', lb);
    const show = i => {
      idx = (i + items.length) % items.length;
      const it = items[idx], img = $('img', it);
      lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt;
      const cap = $('.cap', it);
      lbTitle.innerHTML = cap ? $('b', cap).innerHTML : '';
      lbDesc.innerHTML = cap ? $(':scope > span', cap).innerHTML : '';
      document.dispatchEvent(new CustomEvent('lb:show', { detail: { index: idx, item: it, img } })); // ekstra.js: albüm + fotoğrafçı
    };
    const open = i => { document.dispatchEvent(new CustomEvent('lb:open')); show(i); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); window.__lenis && window.__lenis.stop(); $('.lb-close', lb).focus(); unlock('sanat'); SFX.play('open'); };
    const close = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); window.__lenis && window.__lenis.start(); };
    items.forEach((it, i) => {
      it.tabIndex = 0;
      it.addEventListener('click', () => open(i));
      it.addEventListener('keydown', e => { if (e.key === 'Enter') open(i); });
    });
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', () => show(idx - 1));
    $('.lb-next', lb).addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
  }

  /* Blog filtresi */
  const filters = $('.filters');
  if (filters) {
    filters.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('button', filters).forEach(x => x.classList.toggle('on', x === b));
      const f = b.dataset.filter;
      $$('.post-row').forEach(r => {
        const show = f === 'all' || (r.dataset.cats || '').split(',').includes(f);
        r.style.display = show ? '' : 'none';
      });
      hasGSAP && ScrollTrigger.refresh();
    });
  }

  /* Blog satırı: fareyi takip eden görsel */
  const thumb = $('.post-thumb');
  if (thumb && HOVER) {
    const timg = $('img', thumb);
    let tx = 0, ty = 0, cx = 0, cy = 0;
    $$('.post-row[data-img]').forEach(r => {
      r.addEventListener('mouseenter', () => { timg.src = r.dataset.img; thumb.classList.add('on'); });
      r.addEventListener('mouseleave', () => thumb.classList.remove('on'));
    });
    addEventListener('mousemove', e => { tx = e.clientX + 150; ty = e.clientY; });
    (function loop() { cx += (tx - cx) * .14; cy += (ty - cy) * .14; thumb.style.left = cx + 'px'; thumb.style.top = cy + 'px'; requestAnimationFrame(loop); })();
  }

  /* İletişim formu */
  const form = $('#contact-form');
  if (form) {
    const status = $('.form-status', form);
    const msg = (a, b, cls) => { status.className = 'form-status ' + cls; status.innerHTML = tr(a, b); };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const btn = $('button[type=submit]', form); btn.disabled = true;
      msg('Gönderiliyor…', 'Sending…', '');
      try {
        const res = await fetch(form.getAttribute('action') || '/', {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString()
        });
        if (!res.ok) throw new Error(res.status);
        form.reset(); confetti(120); SFX.play('success');
        msg('Teşekkürler! Mesajın bana ulaştı, en kısa sürede dönüş yapacağım.', 'Thank you! Your message reached me — I’ll get back to you soon.', 'ok');
      } catch (err) {
        msg('Mesaj gönderilemedi. Lütfen e-posta ile ulaş.', 'Message could not be sent. Please reach me by e-mail.', 'err');
      } finally { btn.disabled = false; }
    });
  }

  /* Menü linklerinde dijital harf karıştırma */
  if (HOVER) {
    const GLYPHS = '!<>-_\\/[]{}=+*^?#01';
    $$('[data-scramble]').forEach(a => a.addEventListener('mouseenter', () => {
      const span = $$('[lang]', a).find(s => s.lang === root.lang) || a;
      const orig = span.dataset.orig || (span.dataset.orig = span.textContent);
      let f = 0; const total = 14;
      clearInterval(span._t);
      span._t = setInterval(() => {
        span.textContent = [...orig].map((ch, i) => (i < (f / total) * orig.length || ch === ' ') ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');
        if (++f > total) { clearInterval(span._t); span.textContent = orig; }
      }, 28);
    }));
  }


  /* =========================================================
     KARAKTER KILAVUZU (ana sayfa, kafesteki "i" düğmesi)
     ========================================================= */
  /* Proje kartlarında kısa video önizleme (CMS'te "video" alanı doluysa) */
  $$('[data-hover-video]').forEach(el => {
    const v = $('video.hover-vid', el); if (!v || RM) return;
    const on = () => { v.play().then(() => el.classList.add('playing')).catch(() => {}); };
    const off = () => { v.pause(); el.classList.remove('playing'); };
    if (HOVER) { el.addEventListener('mouseenter', on); el.addEventListener('mouseleave', off); }
    else new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? on() : off())), { threshold: .6 }).observe(el);
  });

  /* Özgeçmiş (PDF): yazdırmadan önce kaydırınca açılan her şeyi son hâline getir */
  const cvBtn = $('[data-print-cv]');
  cvBtn && cvBtn.addEventListener('click', () => window.print());
  addEventListener('beforeprint', () => {
    $$('.bar i[data-val]').forEach(i => i.style.setProperty('transform', `scaleX(${(+i.dataset.val || 0) / 100})`, 'important'));
    $$('.timeline-line i').forEach(i => i.style.setProperty('transform', 'none', 'important'));
  });

  function initGuide() {
    const g = $('[data-guide]'); if (!g) return;
    const pages = $$('[data-guide-page]', g), dots = $('.pz-g-dots', g), prev = $('[data-guide-prev]', g), next = $('[data-guide-next]', g);
    const openBtn = $('[data-guide-open]');
    let i = 0;
    dots.innerHTML = pages.map(() => '<i></i>').join('');
    const show = (n, dir = 1) => {
      i = Math.max(0, Math.min(pages.length - 1, n));
      pages.forEach((p, k) => { p.hidden = k !== i; p.classList.toggle('back', dir < 0); });
      $$('i', dots).forEach((d, k) => d.classList.toggle('on', k === i));
      prev.disabled = i === 0; next.disabled = i === pages.length - 1;
    };
    const open = () => {
      if (openBtn) { // panel düğmeden "fırlasın"
        const r = openBtn.getBoundingClientRect(), b = $('.pz-g-box', g).getBoundingClientRect();
        g.style.setProperty('--gx', `${r.left - b.left}px`); g.style.setProperty('--gy', `${r.top - b.top}px`);
      }
      show(0); g.classList.add('open'); g.setAttribute('aria-hidden', 'false'); SFX.play('open');
      setTimeout(() => next.focus(), 60);
    };
    const close = () => { if (!g.classList.contains('open')) return; g.classList.remove('open'); g.setAttribute('aria-hidden', 'true'); openBtn && openBtn.focus(); SFX.play('close'); };
    openBtn && openBtn.addEventListener('click', e => { e.stopPropagation(); g.classList.contains('open') ? close() : open(); });
    $('[data-guide-close]', g).addEventListener('click', close);
    prev.addEventListener('click', () => { show(i - 1, -1); SFX.play('page'); });
    next.addEventListener('click', () => { show(i + 1, 1); SFX.play('page'); });
    addEventListener('keydown', e => {
      if (!g.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') { show(i + 1, 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { show(i - 1, -1); e.preventDefault(); }
    });
    document.addEventListener('pointerdown', e => { if (!e.target.closest('.pz-g-box, [data-guide-open]')) close(); });
    // ayarlar: animasyonları azalt (sayfa yenilenir), karakteri kafese geri koy
    const rm = $('[data-reduce-motion]', g);
    if (rm) {
      try { rm.checked = localStorage.getItem('azaltHareket') === '1'; } catch (e) {}
      rm.addEventListener('change', () => {
        try { localStorage.setItem('azaltHareket', rm.checked ? '1' : '0'); } catch (e) {}
        setTimeout(() => location.reload(), 350);
      });
    }
    const reset = $('[data-cage-reset]', g);
    reset && reset.addEventListener('click', () => { try { sessionStorage.removeItem('karakter-serbest'); } catch (e) {} location.reload(); });
  }
  initGuide();

  /* =========================================================
     C. ANİMASYONLAR (GSAP)
     ========================================================= */
  if (!hasGSAP) { root.classList.remove('js'); return; }
  if (RM) {
    root.classList.add('reduced');
    const c = $('.curtain'); if (c) c.style.display = 'none';
    initStickers(false);
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* Lenis yumuşak kaydırma */
  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -70 }); }
    }));
  }

  /* Header: aşağı kaydırınca gizle */
  const header = $('.header');
  let lastY = 0;
  const onScrollHeader = () => {
    const y = scrollY;
    header.classList.toggle('is-solid', y > 40);
    header.classList.toggle('is-hidden', y > 300 && y > lastY + 2 && !document.body.classList.contains('menu-open'));
    if (Math.abs(y - lastY) > 2) lastY = y;
  };
  addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* Okuma ilerleme çubuğu */
  const prog = $('.progress');
  if (prog) gsap.to(prog, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  /* Riso baskı kayması: fare ve kaydırma hızıyla canlanır */
  {
    let tx = 3, ty = 2, x = 3, y = 2, vel = 0;
    if (HOVER) addEventListener('mousemove', e => {
      tx = 1 + (e.clientX / innerWidth) * 6; ty = 1 + (e.clientY / innerHeight) * 4;
    });
    ScrollTrigger.create({ onUpdate: s => { vel = gsap.utils.clamp(-14, 14, s.getVelocity() / 250); } });
    // performans: değişkeni köke yazmak tüm sayfanın stilini her karede yeniden hesaplatıyordu.
    // Artık yalnızca ekranda görünen başlıklara, değer gerçekten değiştiğinde yazılır.
    const misEls = $$('.display, .hero-name'), vis = new Set();
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { vis.add(e.target); e.target.style.setProperty('--mx', x.toFixed(1) + 'px'); e.target.style.setProperty('--my', y.toFixed(1) + 'px'); } else vis.delete(e.target); }));
    misEls.forEach(el => io.observe(el));
    let lx = -9, ly = -9;
    gsap.ticker.add(() => {
      vel *= .9; x += (tx + vel * .4 - x) * .08; y += (ty + vel - y) * .08;
      if (Math.abs(x - lx) < .08 && Math.abs(y - ly) < .08) return; // durgunken hiçbir şey yazma
      lx = x; ly = y;
      const sx = x.toFixed(1) + 'px', sy = y.toFixed(1) + 'px';
      vis.forEach(el => { el.style.setProperty('--mx', sx); el.style.setProperty('--my', sy); });
    });
  }

  /* ---------- Sayfa geçişi: üç renkli katman ---------- */
  const curtain = $('.curtain');
  const layers = curtain ? $$('i', curtain) : [];
  const firstVisit = !sessionStorage.getItem('seen');
  try { sessionStorage.setItem('seen', '1'); } catch (e) {}
  let introDelay = 0;
  if (curtain) {
    const label = $('.curtain-label', curtain), count = $('.curtain-count', curtain);
    const tl = gsap.timeline({ defaults: { ease: 'expo.inOut' } });
    if (firstVisit) {
      const o = { v: 0 };
      tl.to(o, { v: 100, duration: 1.2, ease: 'power2.inOut', onUpdate: () => count.textContent = String(Math.round(o.v)).padStart(3, '0') })
        .to(label, { yPercent: -30, opacity: 0, duration: .4, ease: 'power2.in' });
      introDelay = 1.5;
    } else {
      gsap.set(label, { opacity: 0 }); introDelay = .55;
    }
    tl.to([...layers].reverse(), { yPercent: -100, duration: .9, stagger: .1 }, firstVisit ? '-=.1' : .1);
    $$('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel') || a.target === '_blank' || /^https?:/.test(href)) return;
      a.addEventListener('click', e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.defaultPrevented) return;
        e.preventDefault();
        gsap.timeline({ onComplete: () => { location.href = a.href; } })
          .fromTo(layers, { yPercent: 100 }, { yPercent: 0, duration: .55, stagger: .08, ease: 'expo.inOut' });
      });
    });
    addEventListener('pageshow', e => { if (e.persisted) gsap.set(layers, { yPercent: -100 }); });
  }

  /* ---------- Metin bölme ---------- */
  function splitNode(el, type) {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          const parts = type === 'chars' ? [...n.textContent] : n.textContent.split(/(\s+)/);
          parts.forEach(p => {
            if (/^\s+$/.test(p) || p === '') { frag.appendChild(document.createTextNode(p)); return; }
            const s = document.createElement('span'); s.className = type === 'chars' ? 'char' : 'w'; s.textContent = p; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  }
  function onEnter(els, cb, margin = '0px 0px -10% 0px') {
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      entries.filter(e => e.isIntersecting).forEach((e, i) => { io.unobserve(e.target); cb(e.target, i); });
    }, { rootMargin: margin });
    els.forEach(el => io.observe(el));
  }
  window.__introDelay = introDelay;
  const heroSel = '.page-hero, .hero, .article-hero';
  const delayFor = el => (el.closest(heroSel) ? introDelay : 0);

  /* ---------- Hero ismi: harfler fareye tepki verir ---------- */
  $$('[data-chars]').forEach(el => {
    splitNode(el, 'chars');
    const chars = $$('.char', el);
    gsap.from(chars, { yPercent: 120, rotate: () => gsap.utils.random(-25, 25), opacity: 0, duration: 1.3, ease: 'back.out(1.6)', stagger: .07, delay: introDelay });
    gsap.to(chars, { y: i => -40 - i * 35, rotate: i => (i % 2 ? 8 : -8), ease: 'none', scrollTrigger: { trigger: el, start: 'top 55%', end: 'bottom top', scrub: true } });
    if (HOVER && el.hasAttribute('data-wave')) {
      chars.forEach(c => { c.style.fontVariationSettings = '"opsz" 96, "wght" var(--w, 800), "wdth" var(--d, 85)'; });
      let mx = -9999, my = -9999, raf, inView = true, centers = null, qs = null;
      new IntersectionObserver(es => { inView = es[0].isIntersecting; }).observe(el);
      // performans: harf merkezleri bir kez (sayfa koordinatında) ölçülür; her karede ölçmek tüm sayfanın yerleşimini zorluyordu
      const scrollPos = () => (window.__lenis ? window.__lenis.scroll : scrollY);
      const measure = () => { const s = scrollPos(); centers = chars.map(c => { const r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2 + s]; }); };
      addEventListener('resize', () => { centers = null; });
      const update = () => {
        raf = null; if (!inView) return;
        if (!centers) measure();
        if (!qs) { // her harf için tek, sürekli güncellenen animasyon; değerler kademeli uygulanır (font örneği önbelleği)
          const st = chars.map(() => ({ w: 800, d: 85 }));
          qs = chars.map((c, i) => ({ w: gsap.quickTo(st[i], 'w', { duration: .5, ease: 'power3.out' }), d: gsap.quickTo(st[i], 'd', { duration: .5, ease: 'power3.out' }), y: gsap.quickTo(c, 'yPercent', { duration: .5, ease: 'power3.out' }) }));
          gsap.ticker.add(() => {
            if (!inView) return;
            chars.forEach((c, i) => {
              const w = Math.round(st[i].w / 20) * 20, d = Math.round(st[i].d);
              if (w !== c._w) { c._w = w; c.style.setProperty('--w', w); }
              if (d !== c._d) { c._d = d; c.style.setProperty('--d', d); }
            });
          });
        }
        const s = scrollPos();
        chars.forEach((c, i) => {
          const d = Math.hypot(mx - centers[i][0], my - (centers[i][1] - s));
          const k = Math.max(0, 1 - d / 420); // 0 uzak, 1 yakın
          qs[i].w(800 - k * 520); qs[i].d(85 + k * 15); qs[i].y(-k * 8);
        });
      };
      // giriş animasyonu bitene kadar dalga başlamasın (harfler o sırada yerinde değil)
      let ready = false; setTimeout(() => { ready = true; centers = null; }, (introDelay + 2.2) * 1000);
      addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; if (ready && !raf) raf = requestAnimationFrame(update); });
    }
  });

  /* Satır maskeleri */
  const masks = $$('.line-mask > span');
  if (masks.length) gsap.set(masks, { yPercent: 105 });
  onEnter(masks, (el, i) => gsap.to(el, { yPercent: 0, duration: 1.1, ease: 'expo.out', delay: delayFor(el) + i * .08 }), '0px');

  /* Fosforlu kalem vurguları kendini çizer */
  const hls = $$('.display em').filter(e => !e.closest('[data-words]'));
  if (hls.length) gsap.set(hls, { '--hl': 0 });
  onEnter(hls, (el, i) => gsap.to(el, { '--hl': 1, duration: .8, ease: 'power3.inOut', delay: delayFor(el) + .5 + i * .05 }), '0px 0px -15% 0px');

  /* Manifesto: kelimeler kaydırdıkça mürekkeple dolar, vurgu kalemi çizilir */
  $$('[data-words]').forEach(el => {
    splitNode(el, 'words');
    $$('[lang]', el).forEach(block => {
      gsap.to($$('.w', block), { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 45%', scrub: .6 } });
      $$('em', block).forEach(em => gsap.to(em, { '--hl': 1, ease: 'none', scrollTrigger: { trigger: el, start: 'center 60%', end: 'bottom 45%', scrub: .6 } }));
    });
  });

  /* Genel giriş efektleri */
  onEnter($$('[data-reveal]'), (el, i) => gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', delay: delayFor(el) + i * .08 }));
  onEnter($$('[data-clip]'), (el, i) => {
    const d = delayFor(el) + i * .1;
    gsap.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.3, ease: 'expo.inOut', delay: d });
    const img = $('img', el);
    if (img && !img.hasAttribute('data-parallax')) gsap.from(img, { scale: 1.35, duration: 1.8, ease: 'expo.out', delay: d });
  }, '0px 0px -5% 0px');
  $$('[data-parallax]').forEach(el => {
    const s = parseFloat(el.dataset.parallax) || .2;
    gsap.fromTo(el, { yPercent: -s * 50 }, { yPercent: s * 50, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* Riso daireleri: giriş + paralaks + fare */
  const blobs = $$('.blob');
  if (blobs.length) {
    gsap.from(blobs, { scale: 0, duration: 1.4, ease: 'elastic.out(1, .6)', stagger: .12, delay: introDelay - .2 });
    blobs.forEach(b => {
      const s = parseFloat(b.dataset.parallaxY) || -.3;
      gsap.to(b, { yPercent: s * 100, ease: 'none', scrollTrigger: { trigger: b.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
    });
    if (HOVER) addEventListener('mousemove', e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      blobs.forEach((b, i) => gsap.to(b, { x: x * (40 + i * 30), y: y * (30 + i * 20), duration: 1.4, ease: 'power3.out' }));
    });
  }

  /* Hero yüzen görseller */
  const floats = $$('.hero-float');
  if (floats.length) {
    gsap.from(floats, { scale: .5, opacity: 0, rotate: '+=20', duration: 1.2, ease: 'back.out(1.7)', stagger: .12, delay: introDelay + .2 });
    floats.forEach((f, i) => gsap.to(f, { yPercent: -60 - i * 40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } }));
    if (HOVER) addEventListener('mousemove', e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      floats.forEach((f, i) => gsap.to(f, { x: x * -(30 + i * 25), y: y * -(20 + i * 15), duration: 1.2, ease: 'power3.out' }));
    });
  }

  /* ---------- Sürüklenebilir çıkartmalar ---------- */
  initStickers(true);
  function initStickers(animate) {
    const stickers = $$('[data-sticker]');
    if (!stickers.length) return;
    if (animate) gsap.from(stickers, { scale: 0, rotate: () => gsap.utils.random(-90, 90), duration: .9, ease: 'back.out(2.2)', stagger: .09, delay: introDelay + .6 });
    let z = 10;
    stickers.forEach(st => {
      let sx, sy, ox, oy, moved = 0, dragging = false;
      const pos = { x: 0, y: 0 };
      st.addEventListener('pointerdown', e => {
        dragging = true; moved = 0; st.setPointerCapture(e.pointerId); st.classList.add('is-drag'); st.style.zIndex = ++z;
        setCursor('fist');
        sx = e.clientX; sy = e.clientY; ox = pos.x; oy = pos.y;
        if (window.gsap) gsap.to(st, { scale: 1.15, rotate: '+=6', duration: .3, ease: 'back.out(3)' });
      });
      st.addEventListener('pointermove', e => {
        if (!dragging) return;
        pos.x = ox + e.clientX - sx; pos.y = oy + e.clientY - sy; moved = Math.hypot(e.clientX - sx, e.clientY - sy);
        if (window.gsap) gsap.to(st, { x: pos.x, y: pos.y, duration: .25, ease: 'power3.out' }); else st.style.translate = `${pos.x}px ${pos.y}px`;
      });
      const up = () => {
        if (!dragging) return; dragging = false; st.classList.remove('is-drag');
        setCursor(st.matches(':hover') ? 'grab' : '');
        if (window.gsap) gsap.to(st, { scale: 1, rotate: gsap.utils.random(-14, 14), duration: .6, ease: 'elastic.out(1.2, .4)' });
        if (moved > 30) unlock('daginik');
      };
      st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    });
  }

  /* ---------- 3B eğilen kartlar ---------- */
  if (HOVER) $$('[data-tilt]').forEach(card => {
    gsap.set(card, { transformPerspective: 900 });
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      gsap.to(card, { rotateY: x * 14, rotateX: -y * 10, duration: .5, ease: 'power3.out' });
    });
    card.addEventListener('mouseleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: .9, ease: 'elastic.out(1, .5)' }));
  });

  const mm = gsap.matchMedia();
  /* Yatay proje şeridi (masaüstü pin) */
  mm.add('(min-width: 901px)', () => {
    $$('.hscroll').forEach(sec => {
      const track = $('.hscroll-track', sec);
      const pinEl = sec.closest('section') || sec;
      const dist = () => track.scrollWidth - innerWidth;
      gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: pinEl, start: 'top top', end: () => '+=' + dist(), pin: pinEl, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
    });
  });

  /* Yığılan proje kartları */
  const cards = $$('.stack-card');
  cards.forEach((card, i) => {
    if (i === cards.length - 1) return;
    gsap.to(card, { scale: .9, rotate: i % 2 ? 1.5 : -1.5, filter: 'brightness(0.55)', ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 15%', scrub: true } });
  });
  cards.forEach(card => {
    const img = $('.stack-media img', card);
    if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'top top', scrub: true } });
  });

  /* Zaman çizelgesi */
  $$('.timeline').forEach(tl => {
    gsap.to($('.timeline-line i', tl), { scaleY: 1, ease: 'none', scrollTrigger: { trigger: tl, start: 'top 70%', end: 'bottom 60%', scrub: true } });
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('on');
      else if (e.boundingClientRect.top > 0) e.target.classList.remove('on');
    }), { rootMargin: '0px 0px -35% 0px' });
    $$('.tl-item', tl).forEach(it => io.observe(it));
  });

  /* Yetenek (XP) çubukları */
  const bars = $$('.bar i');
  if (bars.length) gsap.set(bars, { scaleX: 0 });
  // çerçeve (.bar) izlenir: ölçeği 0 olan iç çubuk genişliksiz olduğu için görünür sayılmıyordu
  onEnter(bars.map(b => b.parentElement), (bar, i) => { const b = $('i', bar); gsap.to(b, { scaleX: (parseFloat(b.dataset.val) || 50) / 100, duration: 1.4, ease: 'steps(12)', delay: i * .08 }); });

  /* İlgi alanı kartları ve bilgi kutuları zıplayarak gelir */
  const pops = $$('.interest, .facts > div, .info-list > div');
  pops.forEach(el => { el.classList.add('pop-in'); el.style.setProperty('--r', gsap.utils.random(-7, 7).toFixed(1) + 'deg'); });
  onEnter(pops, (el, i) => { el.style.setProperty('--d', (i * .08) + 's'); el.classList.add('is-in'); });

  /* Kaydırma hızına duyarlı şeritler */
  $$('.marquee-inner').forEach(m => {
    const rev = m.hasAttribute('data-reverse');
    const tween = rev ? gsap.fromTo(m, { xPercent: -50 }, { xPercent: 0, duration: 26, ease: 'none', repeat: -1 })
                      : gsap.to(m, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      onUpdate: self => {
        const v = Math.abs(self.getVelocity() / 300);
        gsap.to(tween, { timeScale: gsap.utils.clamp(1, 7, 1 + v) * (self.direction || 1), duration: .3, overwrite: true });
        gsap.to(tween, { timeScale: self.direction || 1, duration: 1.2, delay: .3 });
      }
    });
  });

  /* Footer büyük yazı */
  $$('.footer-big').forEach(el => gsap.from(el, { xPercent: 25, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom bottom', scrub: true } }));

  /* Galeri öğeleri */
  const figs = $$('.masonry figure');
  figs.forEach((f, i) => gsap.set(f, { y: 80 + (i % 3) * 40, rotate: (i % 2 ? 3 : -3), opacity: 0 }));
  onEnter(figs, (f, i) => gsap.to(f, { y: 0, rotate: 0, opacity: 1, duration: 1.1, ease: 'back.out(1.4)', delay: i * .08 }), '0px 0px -3% 0px');

  /* ---------- Özel imleç: riso noktası + piksel ikonlar ---------- */
  const cur = $('.cursor');
  if (cur && HOVER) {
    root.classList.add('has-cursor');
    const xTo = gsap.quickTo(cur, 'x', { duration: .12, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: .12, ease: 'power3' });
    let state = '';
    setCursor = s => { if (s !== state) { state = s; cur.dataset.state = s; } };
    // üzerine gelinen öğeye göre ikon seç
    const pick = el => {
      if (!el || !el.closest) return '';
      if (el.closest('[data-sticker]')) return 'grab';
      if (el.closest('[data-lightbox]')) return 'zoom';
      if (el.closest('a, button, label, [role="button"], [data-cursor], input[type="checkbox"]')) return 'point';
      return '';
    };
    // karakter imleci tuttuğunda (window.__cursorHold) imleci o yönetir
    window.__cursorTo = (x, y) => { xTo(x); yTo(y); };
    addEventListener('mousemove', e => { cur.style.opacity = 1; if (window.__cursorHold) return; xTo(e.clientX); yTo(e.clientY); });
    document.addEventListener('mouseover', e => { if (state === 'fist') return; const s_ = pick(e.target); if (s_ === 'point' && state !== 'point') SFX.play('hover'); setCursor(s_); });
    document.addEventListener('mouseleave', () => { cur.style.opacity = 0; });
    $$('iframe').forEach(f => f.addEventListener('mouseenter', () => { cur.style.opacity = 0; }));
    addEventListener('mousedown', () => cur.classList.add('is-down'));
    addEventListener('mouseup', () => cur.classList.remove('is-down'));
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
