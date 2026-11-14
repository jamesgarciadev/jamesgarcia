"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

// ── background mode store (shared with the navbar toggle) ─────────────
// dark  → animated cube web that traces the cursor and supports dragging
// light → the background disappears entirely (plain page behind it)
export type BackgroundMode = "dark" | "light";

// The background always starts ON (animated) on every visit — the toggle is
// per-visit only and never persisted, so a stale "off" can't stick around.
let mode: BackgroundMode = "dark";

const listeners = new Set<() => void>();

export function getBackgroundMode(): BackgroundMode {
  return mode;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function setMode(next: BackgroundMode) {
  if (next === mode) return;
  mode = next;
  listeners.forEach((l) => l());
}

export function toggleBackgroundMode() {
  setMode(mode === "dark" ? "light" : "dark");
}

export function useBackgroundMode(): BackgroundMode {
  return useSyncExternalStore(subscribe, getBackgroundMode, () => "dark");
}

// ── the cube web itself ───────────────────────────────────────────────

// Faceted octahedron "cubes" — same shapes/colors as the loading-screen Galaga game
type GemColors = { light: string; mid: string; dark: string; darkest: string };

const GEM_COLORS: GemColors[] = [
  // pink enemies from the mini-game
  { light: "#f9a8d4", mid: "#f472b6", dark: "#db2777", darkest: "#be185d" },
  // purple enemies from the mini-game
  { light: "#c4b5fd", mid: "#a78bfa", dark: "#8b5cf6", darkest: "#7c3aed" },
];

const GEM_RADIUS = 14; // css px, matches the octahedron scale of the mini-game

type Gem = { canvas: HTMLCanvasElement; size: number };

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gem: Gem;
  scale: number;
  rot: number;
  rotSpeed: number; // rad/s — the mini-game cubes spin too
};

const LINK_DIST = 130; // max distance for cube-to-cube web lines
const MOUSE_RADIUS = 210; // how far the cursor pulls on the web
const MAX_SPEED = 0.9; // px per frame, keeps drift lazy
const GRAB_RADIUS = 26; // pointer distance to grab a cube (scaled per particle)

function poly(
  ctx: CanvasRenderingContext2D,
  a: number[],
  b: number[],
  c: number[],
  fill: string
) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.lineTo(c[0], c[1]);
  ctx.closePath();
  ctx.fill();
}

// Draws an octahedron as a faceted gem: four visible faces, shaded top→bottom
function renderGem(colors: GemColors, dpr: number): Gem {
  const size = GEM_RADIUS * 2 + 4; // small padding so facets never clip
  const canvas = document.createElement("canvas");
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.scale(dpr, dpr);
    const cx = size / 2;
    const cy = size / 2;
    const r = GEM_RADIUS;
    const T: number[] = [cx, cy - r];
    const B: number[] = [cx, cy + r];
    const L: number[] = [cx - r, cy];
    const R: number[] = [cx + r, cy];
    const C: number[] = [cx, cy];
    poly(ctx, T, L, C, colors.light);
    poly(ctx, T, R, C, colors.mid);
    poly(ctx, B, L, C, colors.dark);
    poly(ctx, B, R, C, colors.darkest);
  }
  return { canvas, size };
}

export default function GalagaWeb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let gems: Gem[] = [];
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = false;
    let visible = true;
    let last = performance.now();
    const mouse = { x: -9999, y: -9999, active: false };

    // drag state
    let dragged: Particle | null = null;
    let dragPointerId = -1;
    let trail: { x: number; y: number; t: number }[] = [];

    function spawn() {
      const count = Math.max(35, Math.min(90, Math.round((width * height) / 18000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        gem: gems[Math.floor(Math.random() * gems.length)],
        scale: 0.7 + Math.random() * 0.6,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 1.2,
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      if (!width || !height) return;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      gems = GEM_COLORS.map((c) => renderGem(c, dpr));
      spawn();
      if (reducedMotion) drawFrame(); // reduced-motion users keep a single static frame
    }

    function step(dt: number) {
      const t = dt / (1000 / 60); // normalize to 60fps frames
      for (const p of particles) {
        if (p !== dragged && mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < MOUSE_RADIUS && d > 1) {
            // gentle pull toward the cursor so the web traces it
            const f = 0.02 * (1 - d / MOUSE_RADIUS) * t;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        if (p !== dragged) {
          const sp = Math.hypot(p.vx, p.vy);
          if (sp > MAX_SPEED) {
            p.vx *= MAX_SPEED / sp;
            p.vy *= MAX_SPEED / sp;
          }
          p.x += p.vx * t;
          p.y += p.vy * t;
        }
        p.rot += (p.rotSpeed * dt) / 1000;
        // wrap around edges with a margin so cubes never pop in/out
        const m = 30;
        if (p.x < -m) p.x = width + m;
        else if (p.x > width + m) p.x = -m;
        if (p.y < -m) p.y = height + m;
        else if (p.y > height + m) p.y = -m;
      }
    }

    function drawFrame() {
      ctx!.clearRect(0, 0, width, height);
      ctx!.lineWidth = 1;

      // cube-to-cube web
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          if (Math.abs(dx) > LINK_DIST || Math.abs(dy) > LINK_DIST) continue;
          const d = Math.hypot(dx, dy);
          if (d >= LINK_DIST) continue;
          ctx!.strokeStyle = `rgba(52, 211, 153, ${(1 - d / LINK_DIST) * 0.2})`;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      // web lines to the cursor + anchor dot (dark mode only)
      if (mouse.active && getBackgroundMode() === "dark") {
        for (const p of particles) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          if (Math.abs(dx) > MOUSE_RADIUS || Math.abs(dy) > MOUSE_RADIUS) continue;
          const d = Math.hypot(dx, dy);
          if (d >= MOUSE_RADIUS) continue;
          ctx!.strokeStyle = `rgba(52, 211, 153, ${(1 - d / MOUSE_RADIUS) * 0.4})`;
          ctx!.beginPath();
          ctx!.moveTo(p.x, p.y);
          ctx!.lineTo(mouse.x, mouse.y);
          ctx!.stroke();
        }
        ctx!.fillStyle = "rgba(52, 211, 153, 0.15)";
        ctx!.beginPath();
        ctx!.arc(mouse.x, mouse.y, 7, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = "rgba(52, 211, 153, 0.8)";
        ctx!.beginPath();
        ctx!.arc(mouse.x, mouse.y, 2.5, 0, Math.PI * 2);
        ctx!.fill();
      }

      // cubes on top of the web
      for (const p of particles) {
        const s = p.gem.size * p.scale;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rot);
        ctx!.globalAlpha = 0.9;
        ctx!.drawImage(p.gem.canvas, -s / 2, -s / 2, s, s);
        ctx!.restore();
      }
      ctx!.globalAlpha = 1;
    }

    function frame(now: number) {
      if (!running) return;
      const dt = Math.min(now - last, 50);
      last = now;
      if (visible && !document.hidden) {
        step(dt);
        drawFrame();
      }
      raf = requestAnimationFrame(frame);
    }

    function startLoop() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function stopLoop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    // ── dragging ────────────────────────────────────────────────────
    function endDrag() {
      if (!dragged) return;
      // fling: velocity from the recent pointer trail, clamped
      const now = performance.now();
      const recent = trail.filter((s) => now - s.t < 120);
      if (recent.length >= 2) {
        const a = recent[0];
        const b = recent[recent.length - 1];
        const dt = Math.max(b.t - a.t, 1);
        dragged.vx = Math.max(-2.5, Math.min(2.5, ((b.x - a.x) / dt) * 16.7));
        dragged.vy = Math.max(-2.5, Math.min(2.5, ((b.y - a.y) / dt) * 16.7));
      } else {
        dragged.vx = 0;
        dragged.vy = 0;
      }
      try {
        canvas!.releasePointerCapture(dragPointerId);
      } catch {
        // pointer already released
      }
      dragged = null;
      dragPointerId = -1;
      trail = [];
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      canvas!.style.cursor = "";
    }

    function onPointerDown(e: PointerEvent) {
      if (getBackgroundMode() === "light") return; // static mode: no interaction
      const r = canvas!.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      let best: Particle | null = null;
      let bestD = Infinity;
      for (const p of particles) {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < GRAB_RADIUS * p.scale + 8 && d < bestD) {
          best = p;
          bestD = d;
        }
      }
      if (!best) return; // empty space — let the page behave normally
      dragged = best;
      dragPointerId = e.pointerId;
      trail = [{ x, y, t: performance.now() }];
      best.vx = 0;
      best.vy = 0;
      try {
        canvas!.setPointerCapture(e.pointerId);
      } catch {
        // capture unsupported — drag still works while pointer is over the canvas
      }
      e.preventDefault();
      // keep names/labels from getting selected mid-drag
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";
      canvas!.style.cursor = "grabbing";
    }

    function onPointerMove(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active =
        mouse.x >= 0 && mouse.x <= r.width && mouse.y >= 0 && mouse.y <= r.height;

      if (dragged) {
        // move the grabbed cube with the pointer, clamped to the hero area
        dragged.x = Math.max(18, Math.min(width - 18, mouse.x));
        dragged.y = Math.max(18, Math.min(height - 18, mouse.y));
        const now = performance.now();
        trail.push({ x: mouse.x, y: mouse.y, t: now });
        while (trail.length > 2 && now - trail[0].t > 120) trail.shift();
      } else if (getBackgroundMode() === "dark") {
        // hover affordance: grab cursor over a cube
        let over = false;
        for (const p of particles) {
          if (Math.hypot(p.x - mouse.x, p.y - mouse.y) < GRAB_RADIUS * p.scale + 8) {
            over = true;
            break;
          }
        }
        canvas!.style.cursor = over ? "grab" : "";
      }
    }

    function onPointerLeave() {
      mouse.active = false;
    }

    // ── mode switching (navbar toggle) ──────────────────────────────
    function applyMode(next: BackgroundMode) {
      if (next === "light") {
        // light mode: the web just disappears — no frozen frame left behind.
        // The loop keeps running; IntersectionObserver pauses drawing while hidden.
        endDrag();
        mouse.active = false;
        canvas!.style.display = "none";
      } else {
        canvas!.style.display = "";
        if (!reducedMotion) startLoop();
      }
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeave);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // pause the loop while the hero is scrolled out of view
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    const unsubMode = subscribe(() => applyMode(getBackgroundMode()));

    resize();
    applyMode(getBackgroundMode()); // honor the persisted mode on load

    return () => {
      stopLoop();
      endDrag();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", onPointerLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);
      ro.disconnect();
      io.disconnect();
      unsubMode();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
    />
  );
}
