"use strict";

// Subtle drifting particle field with faint links — a light, original backdrop
// (no external libs). Respects reduced-motion and pauses when the tab is hidden.
(function () {
  const canvas = document.getElementById("bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w, h, dpr, nodes, raf;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    const count = Math.min(90, Math.floor((innerWidth * innerHeight) / 22000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.12 * dpr,
      vy: (Math.random() - 0.5) * 0.12 * dpr,
    }));
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    const link = 130 * dpr;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j];
        const dx = n.x - m.x, dy = n.y - m.y;
        const d = Math.hypot(dx, dy);
        if (d < link) {
          ctx.strokeStyle = `rgba(124,140,255,${0.14 * (1 - d / link)})`;
          ctx.lineWidth = dpr;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(m.x, m.y);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "rgba(176,107,255,0.5)";
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.3 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  function start() { if (!raf) frame(); }
  function stop() { cancelAnimationFrame(raf); raf = null; }

  resize();
  addEventListener("resize", resize);
  if (reduced) {
    frame(); stop(); // draw one static frame only
  } else {
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    start();
  }
})();

// Full-screen index overlay.
(function () {
  const overlay = document.getElementById("index-overlay");
  const open = document.getElementById("index-open");
  const close = document.getElementById("index-close");
  if (!overlay || !open) return;
  const show = () => { overlay.hidden = false; document.body.style.overflow = "hidden"; };
  const hide = () => { overlay.hidden = true; document.body.style.overflow = ""; };
  open.addEventListener("click", show);
  close.addEventListener("click", hide);
  overlay.querySelectorAll(".index-list a").forEach((a) => a.addEventListener("click", hide));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); });
})();

// Highlight the active section in the nav as you scroll.
(function () {
  const links = [...document.querySelectorAll(".nav nav a")];
  const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const a = map.get(e.target.id);
        if (a && e.isIntersecting) {
          links.forEach((l) => (l.style.color = ""));
          a.style.color = "var(--fg)";
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  document.querySelectorAll("section[id]").forEach((s) => obs.observe(s));
})();

// Preloader: animate to 100%, then reveal the page (min ~1.1s, hard cap 2.6s).
(function () {
  const pre = document.getElementById("preloader");
  if (!pre) return;
  const fill = document.getElementById("pl-fill");
  const pct = document.getElementById("pl-pct");
  const t0 = Date.now();
  let p = 0;
  const iv = setInterval(() => {
    p = Math.min(100, p + Math.random() * 8 + 2);
    fill.style.width = p + "%";
    pct.textContent = Math.floor(p) + "%";
    if (p >= 100) clearInterval(iv);
  }, 70);
  function done() {
    if (pre.dataset.done) return;
    pre.dataset.done = "1";
    const wait = Math.max(0, 1100 - (Date.now() - t0));
    setTimeout(() => {
      clearInterval(iv);
      fill.style.width = "100%";
      pct.textContent = "100%";
      pre.classList.add("hidden");
      setTimeout(() => pre.remove(), 600);
    }, wait);
  }
  window.addEventListener("load", done);
  setTimeout(done, 2600);
})();

// Company logos with graceful fallback: Clearbit -> favicon -> monogram.
(function () {
  document.querySelectorAll("#logos > span").forEach((s) => {
    const { domain, name, src } = s.dataset;
    const tile = document.createElement("div");
    tile.className = "logo-tile";
    const img = document.createElement("img");
    img.alt = name;
    img.loading = "lazy";
    let stage = src ? 2 : 0; // local file -> only fall back to monogram
    img.src = src || `https://logo.clearbit.com/${domain}`;
    img.onerror = () => {
      if (stage === 0) {
        stage = 1;
        img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      } else {
        const b = document.createElement("div");
        b.className = "mono-badge";
        b.textContent = (name[0] || "?").toUpperCase();
        img.replaceWith(b);
      }
    };
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.textContent = name;
    tile.append(img, nm);
    s.replaceWith(tile);
  });
})();

// Eyes that follow the cursor (rAF loop so it also tracks on scroll/resize).
(function () {
  const eyes = document.querySelector(".eyes");
  if (!eyes) return;
  const pairs = [...eyes.querySelectorAll("g")].map((g) => ({
    sclera: g.querySelector(".sclera"),
    pupil: g.querySelector(".pupil"),
  }));
  if (!pairs.length) return;
  let mx = innerWidth / 2, my = innerHeight / 2;
  addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
  addEventListener("touchmove", (e) => {
    if (e.touches[0]) { mx = e.touches[0].clientX; my = e.touches[0].clientY; }
  }, { passive: true });
  (function tick() {
    pairs.forEach(({ sclera, pupil }) => {
      const r = sclera.getBoundingClientRect();
      if (!r.width) return;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const ang = Math.atan2(my - cy, mx - cx);
      const reach = (+sclera.getAttribute("r") || 20) * 0.45;
      pupil.setAttribute("transform", `translate(${Math.cos(ang) * reach} ${Math.sin(ang) * reach})`);
    });
    requestAnimationFrame(tick);
  })();
})();

// Mini reflex/aim game.
(function () {
  const cv = document.getElementById("game");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height;
  const colors = ["#7c8cff", "#b06bff", "#34d3ee", "#43e08a", "#fbbf3d"];
  const $ = (id) => document.getElementById(id);
  const best = () => +(localStorage.getItem("ls-aim-best") || 0);
  let targets = [], score = 0, time = 20, running = false, timer, spawner, raf;
  $("g-best").textContent = best();

  function spawn() {
    const r = 18 + Math.random() * 16;
    targets.push({ x: r + Math.random() * (W - 2 * r), y: r + Math.random() * (H - 2 * r), r, born: Date.now(), life: 1100 + Math.random() * 700, c: colors[(Math.random() * colors.length) | 0] });
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const now = Date.now();
    targets = targets.filter((t) => now - t.born < t.life);
    targets.forEach((t) => {
      const age = (now - t.born) / t.life, rr = t.r * (1 - age * 0.3);
      ctx.globalAlpha = 1 - age * 0.6;
      ctx.fillStyle = t.c;
      ctx.beginPath(); ctx.arc(t.x, t.y, rr, 0, 7); ctx.fill();
      ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.6)";
      ctx.beginPath(); ctx.arc(t.x, t.y, rr, 0, 7); ctx.stroke();
    });
    if (running) raf = requestAnimationFrame(draw);
  }
  cv.addEventListener("click", (e) => {
    if (!running) return;
    const rect = cv.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);
    for (let i = targets.length - 1; i >= 0; i--) {
      if (Math.hypot(mx - targets[i].x, my - targets[i].y) <= targets[i].r) {
        targets.splice(i, 1); score++; $("g-score").textContent = score; break;
      }
    }
  });
  function start() {
    if (running) return;
    running = true; score = 0; time = 20; targets = [];
    $("g-score").textContent = 0; $("g-time").textContent = 20;
    timer = setInterval(() => { $("g-time").textContent = --time; if (time <= 0) end(); }, 1000);
    spawner = setInterval(spawn, 620); spawn(); draw();
  }
  function end() {
    running = false; clearInterval(timer); clearInterval(spawner); cancelAnimationFrame(raf);
    if (score > best()) { localStorage.setItem("ls-aim-best", score); $("g-best").textContent = score; }
    ctx.fillStyle = "rgba(10,11,15,.72)"; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center"; ctx.fillStyle = "#ecedf2"; ctx.font = "700 34px Georgia, serif";
    ctx.fillText(`Score ${score}`, W / 2, H / 2 - 4);
    ctx.font = "14px monospace"; ctx.fillStyle = "#8b90a3";
    ctx.fillText("Press Start to play again", W / 2, H / 2 + 26);
  }
  $("g-start").addEventListener("click", start);
  ctx.textAlign = "center"; ctx.fillStyle = "#8b90a3"; ctx.font = "15px monospace";
  ctx.fillText("Press Start ▸", W / 2, H / 2);
})();
