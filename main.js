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
