/* =========================================================
   404 mini oyunu — "Koş Zeynep koş"
   Karakterin kendi çizimleri (karakter.js → window.__pzData): yandan koşu, zıplama, yere yapışma.
   Engeller: zıplanacak harf blokları. Rekor tarayıcıda saklanır (localStorage 'oyunRekor').
   ========================================================= */
(() => {
  const box = document.querySelector('[data-game]'); if (!box) return;
  const cv = box.querySelector('canvas'), g = cv.getContext('2d');
  const startBtn = box.querySelector('[data-game-start]'), scoreEl = box.querySelector('[data-score]'), bestEl = box.querySelector('[data-best]');
  const sfx = (n, a) => window.__sfx && window.__sfx(n, a);
  const COL = { ink: '#1e1b2e', pink: '#ff48b0', blue: '#0078bf', yellow: '#ffe800', paper: '#f6f1e7', coral: '#ff6c5c' };
  const LETTERS = '404HATA?!ZEYNEP';
  let W = 0, H = 0, DPR = 1, GROUND = 0, S = 1; // S: karakter ölçeği
  let best = 0; try { best = +localStorage.getItem('oyunRekor') || 0; } catch (e) {}
  const pad = n => String(Math.floor(n)).padStart(4, '0');
  bestEl.textContent = pad(best);

  // görseller (karakter.js yüklendikten sonra)
  const im = {}; let D = null, ready = false;
  function loadImgs() {
    D = window.__pzData; if (!D) return false;
    const list = { govde: 'yan_govde', bacak: 'yan_bacak', kol: 'yan_kol', zipla: 'poz_zipla', yere: 'yere' };
    let n = 0, total = Object.keys(list).length;
    for (const [k, f] of Object.entries(list)) { const i = new Image(); i.onload = () => { if (++n === total) { ready = true; draw(); } }; i.src = D.base + f + '.png'; im[k] = i; }
    return true;
  }

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = box.clientWidth; H = Math.round(Math.min(280, Math.max(200, W * .32)));
    cv.width = W * DPR; cv.height = H * DPR; cv.style.height = H + 'px';
    GROUND = H - 34; S = (H * .46) / 1508;
    draw();
  }

  // oyun durumu
  let state = 'ready', score = 0, speed = 6, t = 0, last = 0, obs = [], nextObs = 0, nextMilestone = 100, dust = [];
  const P = { x: 0, y: 0, vy: 0, onGround: true };
  function reset() { score = 0; speed = 6 * (W / 900 + .4) / 1.4; obs = []; nextObs = 60; nextMilestone = 100; P.y = 0; P.vy = 0; P.onGround = true; t = 0; dust = []; }
  function start() {
    if (!ready) return;
    reset(); state = 'run'; startBtn.hidden = true; box.classList.add('playing'); last = performance.now(); requestAnimationFrame(loop);
  }
  function jump() {
    if (state !== 'run') { start(); return; }
    if (P.onGround) { P.vy = -H * .052; P.onGround = false; sfx('jump'); }
  }
  function gameOver() {
    state = 'over'; sfx('crash');
    if (score > best) { best = Math.floor(score); try { localStorage.setItem('oyunRekor', best); } catch (e) {} bestEl.textContent = pad(best); }
    if (score >= 300 && window.__unlock) window.__unlock('kosucu');
    setTimeout(() => {
      startBtn.hidden = false; box.classList.remove('playing');
      startBtn.querySelector('b').innerHTML = '<span lang="tr">Güm! Tekrar dene</span><span lang="en">Thud! Try again</span>';
    }, 700);
  }

  function loop(now) {
    if (state === 'ready') return;
    const dt = Math.min(2.5, (now - last) / 16.67); last = now; t += dt;
    if (state === 'run') {
      speed += .0035 * dt * (W / 900 + .4);
      score += dt * .25; scoreEl.textContent = pad(score);
      if (score >= nextMilestone) { nextMilestone += 100; sfx('coin'); }
      // fizik
      P.vy += H * .0028 * dt; P.y += P.vy * dt;
      if (P.y >= 0) { if (!P.onGround) { dust.push(...Array.from({ length: 5 }, () => ({ x: P.x, y: GROUND, vx: (Math.random() - .5) * 3, vy: -Math.random() * 2, l: 20 }))); } P.y = 0; P.vy = 0; P.onGround = true; }
      // engeller
      nextObs -= dt * speed;
      if (nextObs <= 0) {
        const h = H * (.16 + Math.random() * .12), w = h * (.7 + Math.random() * .25);
        obs.push({ x: W + 20, w, h, ch: LETTERS[Math.floor(Math.random() * LETTERS.length)], c: [COL.pink, COL.yellow, COL.blue, COL.coral][Math.floor(Math.random() * 4)], r: (Math.random() - .5) * .2 });
        nextObs = W * (.38 + Math.random() * .45);
      }
      obs.forEach(o => { o.x -= speed * dt; });
      obs = obs.filter(o => o.x + o.w > -20);
      // çarpışma (karakter kutusu biraz küçültülmüş)
      const pw = 1508 * S * .28, ph = 1508 * S * .9, px = P.x - pw / 2, py = GROUND + P.y - ph;
      for (const o of obs) if (px < o.x + o.w - 6 && px + pw > o.x + 6 && py + ph > GROUND - o.h + 6) { gameOver(); break; }
    }
    draw();
    if (state === 'run' || (state === 'over' && t < 9999)) requestAnimationFrame(loop);
  }

  function drawRunner() {
    const SD = D.SIDE, F = SD.foot, Hp = SD.hip, SH = SD.shoulder;
    const ph = t * .32, sw = Math.sin(ph), legA = P.onGround ? .38 * sw : .5, armA = P.onGround ? .55 * sw : -.6;
    const bob = P.onGround ? -Math.abs(Math.cos(ph)) * 30 : 0;
    const base = new DOMMatrix().translate(P.x, GROUND + P.y).scale(S).translate(-F[0], -F[1]);
    const rot = (m, p, a) => new DOMMatrix(m).translate(p[0], p[1]).rotate(a * 57.2958).translate(-p[0], -p[1]);
    const put = (img, p, m) => { g.setTransform(m.a * DPR, m.b * DPR, m.c * DPR, m.d * DPR, m.e * DPR, m.f * DPR); g.drawImage(img, p.x, p.y, p.w, p.h); };
    const body = new DOMMatrix(base).translate(0, bob).translate(Hp[0], Hp[1]).rotate(4).translate(-Hp[0], -Hp[1]);
    g.globalAlpha = .55; put(im.kol, SD.kol, rot(new DOMMatrix(body).translate(-14, 0), SH, armA)); put(im.bacak, SD.bacak, rot(new DOMMatrix(base).translate(-10, bob), Hp, legA)); g.globalAlpha = 1;
    put(im.bacak, SD.bacak, rot(new DOMMatrix(base).translate(0, bob), Hp, -legA));
    put(im.govde, SD.govde, body);
    put(im.kol, SD.kol, rot(body, SH, -armA));
  }
  function drawJump() {
    const Z = D.POSE.zipla, sc = S * (Z.sc || 1);
    const m = new DOMMatrix().translate(P.x, GROUND + P.y).rotate(P.vy * .6).scale(sc).translate(-Z.foot[0], -Z.foot[1]);
    g.setTransform(m.a * DPR, m.b * DPR, m.c * DPR, m.d * DPR, m.e * DPR, m.f * DPR); g.drawImage(im.zipla, Z.x, Z.y, Z.w, Z.h);
  }
  function drawCrash() {
    const Y = D.SIDE.yere, sc = S * (Y.sc || 1);
    const m = new DOMMatrix().translate(P.x + 30, GROUND).scale(-sc, sc).translate(-Y.feet, -Y.ground);
    g.setTransform(m.a * DPR, m.b * DPR, m.c * DPR, m.d * DPR, m.e * DPR, m.f * DPR); g.drawImage(im.yere, Y.x, Y.y, Y.w, Y.h);
  }

  function draw() {
    if (!W) return;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
    // zemin: noktalı şerit + hareket eden çizgiler
    g.fillStyle = COL.ink; g.fillRect(0, GROUND, W, 3);
    g.fillStyle = 'rgba(30,27,46,.25)';
    const off = (t * speed) % 40;
    for (let x = -off; x < W; x += 40) g.fillRect(x, GROUND + 12, 16, 3);
    for (let x = -(t * speed * .3) % 90; x < W; x += 90) g.fillRect(x + 30, GROUND + 22, 6, 3);
    // engeller: harf blokları
    obs.forEach(o => {
      g.save(); g.translate(o.x + o.w / 2, GROUND - o.h / 2); g.rotate(o.r);
      g.fillStyle = COL.ink; g.fillRect(-o.w / 2 + 4, -o.h / 2 + 4, o.w, o.h);
      g.fillStyle = o.c; g.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      g.strokeStyle = COL.ink; g.lineWidth = 3; g.strokeRect(-o.w / 2, -o.h / 2, o.w, o.h);
      g.fillStyle = o.c === COL.blue ? COL.paper : COL.ink; g.font = `800 ${o.h * .72}px "Bricolage Grotesque", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(o.ch, 0, o.h * .04); g.restore();
    });
    // toz
    g.fillStyle = '#c9bfae';
    dust.forEach(d => { d.x += d.vx; d.y += d.vy; d.vy += .15; d.l--; g.fillRect(d.x, d.y, 4, 4); }); dust = dust.filter(d => d.l > 0);
    if (!ready) return;
    P.x = Math.max(70, W * .14);
    g.save();
    if (state === 'over') drawCrash(); else if (!P.onGround) drawJump(); else drawRunner();
    g.restore();
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // girdiler
  startBtn.addEventListener('click', e => { e.stopPropagation(); start(); });
  cv.addEventListener('pointerdown', e => { e.preventDefault(); jump(); });
  addEventListener('keydown', e => {
    const tg = e.target; if ((e.code === 'Space' || e.key === 'ArrowUp') && !(tg && tg.closest && tg.closest('input, textarea, button, a'))) { e.preventDefault(); jump(); }
  });
  addEventListener('resize', resize);
  const boot = () => { if (!loadImgs()) setTimeout(boot, 100); };
  resize(); boot();
})();
