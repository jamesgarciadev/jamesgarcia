"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Phase = "loading" | "ready";

const FIELD_HALF_W = 5.6; // playable half-width in world units
const PLAYER_Y = -3.4;
const ENEMY_COLS = 5;
const ENEMY_ROWS = 4;
const FORMATION_Y = 3.1;

interface Enemy {
  mesh: THREE.Mesh;
  baseX: number;
  baseY: number;
  state: "formation" | "diving";
  vx: number;
  vy: number;
  pop: number; // respawn pop timer
}

export default function LoadingScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    } catch {
      // no WebGL — the overlay still works as a static loading screen
      const t = setTimeout(() => setPhase("ready"), 2500);
      return () => clearTimeout(t);
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05060f);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 14;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer!.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    // ── starfield ────────────────────────────────────────────────
    const starCount = 320;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 26;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      starPos[i * 3 + 2] = -4 - Math.random() * 8;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0x4a5178, size: 0.06 })
    );
    scene.add(stars);

    // ── player ship (emerald — matches site accent) ─────────────
    const ship = new THREE.Group();
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.75, 4), bodyMat);
    body.rotation.x = Math.PI / 2; // point "up" (toward -z? no: cone points +y by default)
    body.rotation.set(0, 0, 0);
    const wings = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.16, 0.3), bodyMat);
    wings.position.y = -0.18;
    ship.add(body, wings);
    ship.position.set(0, PLAYER_Y, 0);
    scene.add(ship);

    // ── enemy formation ──────────────────────────────────────────
    const enemies: Enemy[] = [];
    const pinkMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });
    const purpleMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa });
    for (let r = 0; r < ENEMY_ROWS; r++) {
      for (let c = 0; c < ENEMY_COLS; c++) {
        const mesh = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.26),
          (r + c) % 2 === 0 ? pinkMat : purpleMat
        );
        const baseX = (c - (ENEMY_COLS - 1) / 2) * 1.15;
        const baseY = FORMATION_Y - r * 0.75;
        mesh.position.set(baseX, baseY, 0);
        scene.add(mesh);
        enemies.push({ mesh, baseX, baseY, state: "formation", vx: 0, vy: 0, pop: 0 });
      }
    }

    // ── bullets ──────────────────────────────────────────────────
    const bulletGeo = new THREE.BoxGeometry(0.09, 0.4, 0.09);
    const playerBulletMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const enemyBulletMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const pBullets: { mesh: THREE.Mesh; vy: number }[] = [];
    const eBullets: { mesh: THREE.Mesh; vx: number; vy: number }[] = [];

    // ── game state (closure-scoped, mirrored to React on change) ─
    let playerX = 0;
    let targetX = 0;
    const keys = { left: false, right: false };
    let fireCooldown = 0;
    let diveTimer = 1.6;
    let eFireTimer = 0.9;
    let invuln = 0;
    let over = false;
    let sc = 0;
    let lv = 3;

    const addScore = (n: number) => {
      sc += n;
      setScore(sc);
    };

    const firePlayerBullet = () => {
      if (fireCooldown > 0 || over || pBullets.length >= 4) return;
      fireCooldown = 0.22;
      const mesh = new THREE.Mesh(bulletGeo, playerBulletMat);
      mesh.position.set(playerX, PLAYER_Y + 0.55, 0);
      scene.add(mesh);
      pBullets.push({ mesh, vy: 16 });
    };

    const resetEnemy = (e: Enemy) => {
      e.state = "formation";
      e.vx = 0;
      e.vy = 0;
      e.pop = 0.25;
      e.mesh.position.set(e.baseX, e.baseY, 0);
    };

    const hitPlayer = () => {
      if (invuln > 0 || over) return;
      lv -= 1;
      setLives(lv);
      invuln = 1.6;
      if (lv <= 0) {
        over = true;
        setGameOver(true);
      }
    };

    // ── input ────────────────────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", " ", "a", "d", "A", "D"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
      if (e.key === " ") firePlayerBullet();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
    };
    const onPointerMove = (e: PointerEvent) => {
      const visW = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
      targetX = THREE.MathUtils.clamp(((e.clientX / window.innerWidth - 0.5) * visW), -FIELD_HALF_W, FIELD_HALF_W);
    };
    const onPointerDown = () => firePlayerBullet();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);

    // ── main loop ────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      // stars drift
      const pos = starGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < starCount; i++) {
        let y = pos.getY(i) - dt * 1.2;
        if (y < -9) y = 9;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;

      // player movement
      if (!over) {
        const speed = 9;
        if (keys.left) targetX -= speed * dt;
        if (keys.right) targetX += speed * dt;
        targetX = THREE.MathUtils.clamp(targetX, -FIELD_HALF_W, FIELD_HALF_W);
        playerX += (targetX - playerX) * Math.min(1, dt * 14);
        ship.position.x = playerX;
        fireCooldown -= dt;
        if (invuln > 0) {
          invuln -= dt;
          ship.visible = Math.floor(t * 12) % 2 === 0;
        } else {
          ship.visible = true;
        }
      }

      // formation sway + dives
      const sway = Math.sin(t * 0.9) * 1.25;
      diveTimer -= dt;
      if (!over && diveTimer <= 0) {
        diveTimer = 1.1 + Math.random() * 1.6;
        const candidates = enemies.filter((e) => e.state === "formation");
        if (candidates.length > 0) {
          const e = candidates[Math.floor(Math.random() * candidates.length)];
          e.state = "diving";
          e.vx = THREE.MathUtils.clamp((playerX - e.mesh.position.x) * 0.55, -3.2, 3.2);
          e.vy = -(4.5 + Math.random() * 3);
        }
      }

      for (const e of enemies) {
        if (e.state === "formation") {
          const bob = Math.sin(t * 2.1 + e.baseX * 1.7) * 0.06;
          e.mesh.position.x += ((e.baseX + sway) - e.mesh.position.x) * Math.min(1, dt * 8);
          e.mesh.position.y = e.baseY + bob;
          e.mesh.rotation.z += dt * 2;
        } else {
          e.mesh.position.x += e.vx * dt;
          e.mesh.position.y += e.vy * dt;
          e.mesh.rotation.z += dt * 9;
          if (e.mesh.position.y < -4.5) resetEnemy(e);
        }
        if (e.pop > 0) {
          e.pop -= dt;
          const s = 1 + Math.max(0, e.pop) * 2.2;
          e.mesh.scale.setScalar(s);
        } else {
          e.mesh.scale.setScalar(1);
        }
      }

      // enemy fire (from divers only — Galaga-style pressure)
      if (!over) {
        eFireTimer -= dt;
        if (eFireTimer <= 0) {
          eFireTimer = 0.7 + Math.random() * 0.8;
          const divers = enemies.filter((e) => e.state === "diving");
          if (divers.length > 0) {
            const d = divers[Math.floor(Math.random() * divers.length)];
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), enemyBulletMat);
            mesh.position.copy(d.mesh.position);
            scene.add(mesh);
            eBullets.push({
              mesh,
              vx: THREE.MathUtils.clamp((playerX - d.mesh.position.x) * 0.4, -2.5, 2.5),
              vy: -7.5,
            });
          }
        }
      }

      // move bullets + collisions
      for (let i = pBullets.length - 1; i >= 0; i--) {
        const b = pBullets[i];
        b.mesh.position.y += b.vy * dt;
        if (b.mesh.position.y > 6.5) {
          scene.remove(b.mesh);
          pBullets.splice(i, 1);
          continue;
        }
        for (const e of enemies) {
          const dx = b.mesh.position.x - e.mesh.position.x;
          const dy = b.mesh.position.y - e.mesh.position.y;
          if (dx * dx + dy * dy < 0.32 * 0.32) {
            addScore(e.state === "diving" ? 25 : 10);
            scene.remove(b.mesh);
            pBullets.splice(i, 1);
            resetEnemy(e);
            break;
          }
        }
      }

      for (let i = eBullets.length - 1; i >= 0; i--) {
        const b = eBullets[i];
        b.mesh.position.x += b.vx * dt;
        b.mesh.position.y += b.vy * dt;
        if (b.mesh.position.y < PLAYER_Y - 1.2) {
          scene.remove(b.mesh);
          eBullets.splice(i, 1);
          continue;
        }
        const dx = b.mesh.position.x - playerX;
        const dy = b.mesh.position.y - PLAYER_Y;
        if (dx * dx + dy * dy < 0.3 * 0.3) {
          scene.remove(b.mesh);
          eBullets.splice(i, 1);
          hitPlayer();
        }
      }

      // enemy body vs player
      for (const e of enemies) {
        const dx = e.mesh.position.x - playerX;
        const dy = e.mesh.position.y - PLAYER_Y;
        if (dx * dx + dy * dy < 0.45 * 0.45) {
          hitPlayer();
          resetEnemy(e);
        }
      }

      renderer!.render(scene, camera);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        clock.getDelta(); // flush accumulated time
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    tick();

    // ready when the scene is live and a minimum beat has passed (content is SSR'd underneath)
    const t0 = performance.now();
    const readyTimer = setInterval(() => {
      if (performance.now() - t0 > 2400) {
        clearInterval(readyTimer);
        setPhase("ready");
      }
    }, 150);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      clearInterval(readyTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("visibilitychange", onVisibility);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
      renderer!.dispose();
    };
  }, []);

  useEffect(() => {
    if (phase === "ready") btnRef.current?.focus();
  }, [phase]);

  const proceed = () => {
    setLeaving(true);
    setTimeout(() => setGone(true), 450);
  };

  if (gone) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#05060f] transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`}
      role="dialog"
      aria-modal="true"
      aria-label="Loading screen with mini game"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* CRT scanlines + vignette */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{ background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, #000 3px)" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)" }}
      />

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-4 font-mono text-xs tracking-widest sm:text-sm">
        <span className="text-emerald-300">SCORE {String(score).padStart(5, "0")}</span>
        <span className="flex gap-1.5 pt-1" aria-label={`${lives} lives`}>
          {Array.from({ length: Math.max(lives, 0) }).map((_, i) => (
            <span key={i} className="text-emerald-400">▲</span>
          ))}
        </span>
      </div>

      {/* center content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center" aria-live="polite">
        {phase === "loading" ? (
          <p className="animate-pulse font-mono text-lg tracking-[0.35em] text-emerald-200 sm:text-xl">
            LOADING...
          </p>
        ) : (
          <>
            {gameOver && (
              <p className="font-mono text-sm tracking-[0.3em] text-pink-400">
                GAME OVER — SCORE {String(score).padStart(5, "0")}
              </p>
            )}
            <button
              ref={btnRef}
              onClick={proceed}
              className="rounded-full bg-emerald-400 px-8 py-3.5 font-mono text-sm font-bold tracking-[0.25em] text-black shadow-[0_0_28px_rgba(52,211,153,0.45)] transition hover:bg-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
            >
              PROCEED TO SITE →
            </button>
          </>
        )}
      </div>

      {/* controls hint */}
      <p className="absolute bottom-4 left-0 right-0 text-center font-mono text-[11px] tracking-widest text-slate-500">
        ← → / A D MOVE · SPACE SHOOT · (OR DRAG + TAP)
      </p>
    </div>
  );
}
