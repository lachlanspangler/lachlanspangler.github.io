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

// Scroll reveal.
(function () {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const els = document.querySelectorAll(".block, .kpis, .card");
  if (reduced) { els.forEach((e) => e.classList.add("reveal", "in")); return; }
  els.forEach((e) => e.classList.add("reveal"));
  const obs = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -10% 0px" });
  els.forEach((e) => obs.observe(e));
})();

// 3D card tilt toward the cursor.
(function () {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-4px) rotateX(${-py * 7}deg) rotateY(${px * 7}deg)`;
    });
    card.addEventListener("mouseleave", () => { card.style.transform = ""; });
  });
})();

// Rotating role (typewriter).
(function () {
  const el = document.getElementById("role");
  if (!el) return;
  const roles = ["low-latency systems", "matching engines", "trading infrastructure", "market-microstructure tooling"];
  let ri = 0, ci = 0, deleting = false;
  (function type() {
    const word = roles[ri];
    el.textContent = word.slice(0, ci);
    if (!deleting && ci < word.length) { ci++; setTimeout(type, 55); }
    else if (!deleting) { deleting = true; setTimeout(type, 1400); }
    else if (ci > 0) { ci--; setTimeout(type, 28); }
    else { deleting = false; ri = (ri + 1) % roles.length; setTimeout(type, 250); }
  })();
})();

// Command palette (Cmd/Ctrl-K).
(function () {
  const modal = document.getElementById("cmdk");
  const input = document.getElementById("cmdk-input");
  const list = document.getElementById("cmdk-list");
  if (!modal || !input || !list) return;
  const items = [
    { label: "Work", href: "#work" },
    { label: "Projects", href: "#projects" },
    { label: "Awards", href: "#awards" },
    { label: "Education", href: "#education" },
    { label: "About", href: "#about" },
    { label: "GitHub", href: "https://github.com/lachlanspangler", ext: true },
    { label: "LinkedIn", href: "https://linkedin.com/in/lachlan-spangler", ext: true },
    { label: "Email", href: "mailto:lachlan.spangler@gmail.com", ext: true },
    { label: "hft-matching-engine", href: "https://github.com/lachlanspangler/hft-matching-engine", ext: true },
    { label: "market-maker", href: "https://github.com/lachlanspangler/market-maker", ext: true },
    { label: "OrderBookSim", href: "https://github.com/lachlanspangler/OrderBookSim", ext: true },
    { label: "job-finder", href: "https://github.com/lachlanspangler/job-finder", ext: true },
  ];
  let filtered = items.slice(), sel = 0;
  function render() {
    list.innerHTML = filtered.length
      ? filtered.map((it, i) => `<li class="${i === sel ? "sel" : ""}" data-i="${i}">${it.label}<span class="a">${it.ext ? "↗" : "↵"}</span></li>`).join("")
      : `<div class="cmdk-empty">No matches</div>`;
  }
  function open() { modal.hidden = false; input.value = ""; filtered = items.slice(); sel = 0; render(); input.focus(); }
  function close() { modal.hidden = true; }
  function go(it) { if (!it) return; close(); if (it.ext) window.open(it.href, "_blank", "noopener"); else location.hash = it.href; }
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase();
    filtered = items.filter((it) => it.label.toLowerCase().includes(q));
    sel = 0; render();
  });
  list.addEventListener("click", (e) => { const li = e.target.closest("li"); if (li) go(filtered[+li.dataset.i]); });
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); modal.hidden ? open() : close(); return; }
    if (modal.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, filtered.length - 1); render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); }
    else if (e.key === "Enter") { e.preventDefault(); go(filtered[sel]); }
  });
})();

// KPI count-up + live GitHub stats.
(function () {
  const USER = "lachlanspangler";
  function countUp(el, target, dec) {
    const dur = 1000, t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  const cardsEl = document.querySelector("[data-cards]");
  if (cardsEl) cardsEl.dataset.target = document.querySelectorAll(".cards .card").length;

  const band = document.getElementById("kpis");
  let done = false;
  if (band) {
    const obs = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (e.isIntersecting && !done) {
          done = true;
          document.querySelectorAll("#kpis .kpi-num[data-target]").forEach((el) =>
            countUp(el, parseFloat(el.dataset.target), +el.dataset.dec || 0));
          obs.disconnect();
        }
      });
    }, { rootMargin: "0px 0px -20% 0px" });
    obs.observe(band);
  }

  const repoEl = document.querySelector('[data-gh="repos"]');
  const commitEl = document.querySelector('[data-gh="commits"]');
  fetch(`https://api.github.com/users/${USER}`)
    .then((r) => r.json()).then((d) => { if (repoEl && typeof d.public_repos === "number") countUp(repoEl, d.public_repos, 0); })
    .catch(() => {});
  fetch(`https://api.github.com/search/commits?q=author:${USER}+author-date:>=2026-01-01&per_page=1`)
    .then((r) => r.json()).then((d) => { if (commitEl && typeof d.total_count === "number") countUp(commitEl, d.total_count, 0); })
    .catch(() => {});
})();
