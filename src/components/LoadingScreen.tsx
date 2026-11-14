"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Heart } from "lucide-react";

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
  state: "formation" | "diving" | "dead";
  vx: number;
  vy: number;
  respawn: number; // seconds until a dead cube comes back (>= RESPAWN_DELAY)
  pop: number; // respawn pop timer
}

export default function LoadingScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  // wired up inside the effect — resets a finished run to a fresh one
  const restartRef = useRef<() => void>(() => {});
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

    // lighting for the Wasp's PBR material — enemies/bullets/stars use unlit materials and are unaffected
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const keyLight = new THREE.DirectionalLight(0xd6ecff, 2.4);
    keyLight.position.set(-3, 5, 8);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x9db8e8, 0.7);
    fillLight.position.set(4, -3, 6);
    scene.add(fillLight);

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

    // ── player ship — ARC Raiders Wasp scout drone (optimized wasp.glb, ~935 KB) ──
    // The source model is a Tripo reconstruction whose silhouette lies in its XZ plane;
    // the basis below brings it nose-up with wings left/right and its front face toward
    // the camera: model +Z → world +Y (up), model +Y → world +Z (camera), +X → -X.
    const ship = new THREE.Group();
    const SHIP_H = 1.8; // world units tall — the loaded model is scaled to this
    // player hurtbox half-extents, aligned to the loaded model's silhouette extent
    let shipHalfW = SHIP_H / 2; // fallback until the GLB finishes loading
    let shipHalfH = SHIP_H / 2;
    const dracoLoader = new DRACOLoader().setDecoderPath("/assets/draco/");
    // the reveal waits for this flag — see the ready gate below
    let modelReady = false;
    new GLTFLoader()
      .setDRACOLoader(dracoLoader)
      .load(
        "/assets/wasp.glb",
        (gltf) => {
          const model = gltf.scene;
          // nose up, front face toward the camera (see comment above)
          const rot = new THREE.Matrix4().makeBasis(
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 1, 0)
          );
          model.quaternion.setFromRotationMatrix(rot);
          model.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const s = SHIP_H / size.y; // scale so the rotated height matches the game footprint
          model.scale.setScalar(s);
          model.position.copy(center).multiplyScalar(-s); // center the bbox on the group origin
          ship.add(model);
          // hurtbox tracks the actual rendered silhouette extent
          shipHalfW = (size.x * s) / 2;
          shipHalfH = (size.y * s) / 2;
          modelReady = true;
        },
        undefined,
        () => {
          // load failed — still reveal via the timeout gate so the game never hangs
          modelReady = true;
        }
      );

    ship.position.set(0, PLAYER_Y, 0);
    scene.add(ship);

    // ── enemy formation ──────────────────────────────────────────
    const enemies: Enemy[] = [];
    const pinkMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true });
    const purpleMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true });
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
        enemies.push({ mesh, baseX, baseY, state: "formation", vx: 0, vy: 0, pop: 0, respawn: 0 });
      }
    }

    // ── bullets ──────────────────────────────────────────────────
    const bulletGeo = new THREE.BoxGeometry(0.09, 0.4, 0.09);
    const playerBulletMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const enemyBulletMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const pBullets: { mesh: THREE.Mesh; vx: number; vy: number }[] = [];
    const eBullets: { mesh: THREE.Mesh; vx: number; vy: number }[] = [];

    // ── pop shards (enemy destruction burst) ─────────────────────
    type Shard = { mesh: THREE.Mesh; vx: number; vy: number; life: number };
    const SHARD_LIFE = 0.45;
    const shardGeo = new THREE.TetrahedronGeometry(0.07);
    const shards: Shard[] = [];

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
      if (fireCooldown > 0 || over || pBullets.length >= 8) return;
      fireCooldown = 0.5; // dual mode — slower cadence, two bullets per shot
      // always fires straight up — the pointer steers the ship, never the aim
      for (const off of [-0.28, 0.28]) {
        const mesh = new THREE.Mesh(bulletGeo, playerBulletMat);
        mesh.position.set(playerX + off, PLAYER_Y + SHIP_H / 2 + 0.1, 0); // from the nose tip
        scene.add(mesh);
        pBullets.push({ mesh, vx: 0, vy: 16 });
      }
    };

    const popEnemy = (e: Enemy) => {
      // burst of shards in the enemy's color at the impact point
      const color = (e.mesh.material as THREE.MeshBasicMaterial).color.getHex();
      for (let i = 0; i < 8; i++) {
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true });
        const m = new THREE.Mesh(shardGeo, mat);
        m.position.copy(e.mesh.position);
        scene.add(m);
        const a = (i / 8) * Math.PI * 2 + Math.random() * 0.6;
        const sp = 2.5 + Math.random() * 3;
        shards.push({ mesh: m, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: SHARD_LIFE });
      }
    };

    const resetEnemy = (e: Enemy) => {
      e.state = "formation";
      e.vx = 0;
      e.vy = 0;
      e.pop = 0.25;
      e.mesh.position.set(e.baseX, e.baseY, 0);
    };

    const RESPAWN_DELAY = 3; // seconds a destroyed cube stays gone before it comes back

    const killEnemy = (e: Enemy) => {
      e.state = "dead";
      e.respawn = RESPAWN_DELAY + Math.random();
      e.mesh.visible = false;
    };

    // player hurtbox — an ellipse aligned to the loaded Wasp model's silhouette extent
    const hitShip = (dx: number, dy: number) => {
      const nx = dx / shipHalfW;
      const ny = dy / shipHalfH;
      return nx * nx + ny * ny < 1;
    };

    const hitPlayer = () => {
      if (invuln > 0 || over) return;
      lv -= 1;
      setLives(lv);
      invuln = 1.6;
      if (lv <= 0) {
        over = true;
        setGameOver(true);
        // freeze the ship in a visible state — the invuln blink no longer runs,
        // so without this it could stay stuck on an invisible frame forever
        ship.visible = true;
        // sweep up any in-flight bullets so nothing lingers around the GAME OVER text
        for (const b of [...pBullets, ...eBullets]) scene.remove(b.mesh);
        pBullets.length = 0;
        eBullets.length = 0;
      }
    };

    // ── input ────────────────────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
    };
    // mouse AND touch both arrive as pointer events — one handler covers desktop + mobile;
    // it only steers the ship (fire direction is fixed straight up)
    const onPointerMove = (e: PointerEvent) => {
      const visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const visW = visH * camera.aspect;
      targetX = THREE.MathUtils.clamp(((e.clientX / window.innerWidth - 0.5) * visW), -FIELD_HALF_W, FIELD_HALF_W);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointermove", onPointerMove);

    // ── main loop ────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;
    // gameplay stays paused until the reveal — see the ready gate below
    let started = false;

    const tick = () => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      // stars drift (always — keeps the backdrop alive behind the loading overlay)
      const pos = starGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < starCount; i++) {
        let y = pos.getY(i) - dt * 1.2;
        if (y < -9) y = 9;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;

      // everything else waits for the reveal so the game starts fresh on screen
      if (!started) {
        renderer!.render(scene, camera);
        return;
      }

      // player movement
      if (!over) {
        const speed = 9;
        if (keys.left) targetX -= speed * dt;
        if (keys.right) targetX += speed * dt;
        targetX = THREE.MathUtils.clamp(targetX, -FIELD_HALF_W, FIELD_HALF_W);
        playerX += (targetX - playerX) * Math.min(1, dt * 14);
        ship.position.x = playerX;
        fireCooldown -= dt;
        if (fireCooldown <= 0) firePlayerBullet(); // auto-fire, aimed at the pointer
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

      // on game over the field freezes — a static backdrop behind the GAME OVER text
      if (!over) {
        for (const e of enemies) {
          if (e.state === "dead") {
            e.respawn -= dt;
            if (e.respawn <= 0) {
              // revive back in its formation slot with a pop-in
              e.state = "formation";
              e.vx = 0;
              e.vy = 0;
              e.pop = 0.25;
              e.mesh.position.set(e.baseX, e.baseY, 0);
              e.mesh.visible = true;
            }
            continue;
          }
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
      }

      // on game over the swarm recedes upward and fades away, clearing space for the text
      if (over) {
        const LIFT = 3.4;
        for (const e of enemies) {
          if (!e.mesh.visible) continue;
          const ty = e.baseY + LIFT;
          e.mesh.position.y += (ty - e.mesh.position.y) * Math.min(1, dt * 2.2);
        }
        pinkMat.opacity = Math.max(0, pinkMat.opacity - dt * 0.5);
        purpleMat.opacity = Math.max(0, purpleMat.opacity - dt * 0.5);
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

      // move bullets + collisions (frozen with the field on game over)
      if (!over) {
        for (let i = pBullets.length - 1; i >= 0; i--) {
          const b = pBullets[i];
          b.mesh.position.x += b.vx * dt;
          b.mesh.position.y += b.vy * dt;
          if (b.mesh.position.y > 7 || Math.abs(b.mesh.position.x) > FIELD_HALF_W + 2.5 || b.mesh.position.y < -5) {
            scene.remove(b.mesh);
            pBullets.splice(i, 1);
            continue;
          }
          for (const e of enemies) {
            if (e.state === "dead") continue; // invisible cubes can't be hit
            const dx = b.mesh.position.x - e.mesh.position.x;
            const dy = b.mesh.position.y - e.mesh.position.y;
            if (dx * dx + dy * dy < 0.32 * 0.32) {
              addScore(e.state === "diving" ? 25 : 10);
              popEnemy(e); // burst of shards at the impact point
              scene.remove(b.mesh);
              pBullets.splice(i, 1);
              killEnemy(e); // stays gone for >= RESPAWN_DELAY seconds
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
          if (hitShip(dx, dy)) {
            scene.remove(b.mesh);
            eBullets.splice(i, 1);
            hitPlayer();
          }
        }

        // enemy body vs player — same silhouette-aligned hurtbox as bullets
        for (const e of enemies) {
          if (e.state === "dead") continue;
          const dx = e.mesh.position.x - playerX;
          const dy = e.mesh.position.y - PLAYER_Y;
          if (hitShip(dx, dy)) {
            hitPlayer();
            killEnemy(e);
          }
        }
      }

      // pop shards fly out and fade
      for (let i = shards.length - 1; i >= 0; i--) {
        const s = shards[i];
        s.life -= dt;
        if (s.life <= 0) {
          scene.remove(s.mesh);
          (s.mesh.material as THREE.Material).dispose();
          shards.splice(i, 1);
          continue;
        }
        s.mesh.position.x += s.vx * dt;
        s.mesh.position.y += s.vy * dt;
        s.mesh.rotation.z += dt * 12;
        const k = s.life / SHARD_LIFE;
        (s.mesh.material as THREE.MeshBasicMaterial).opacity = k;
        s.mesh.scale.setScalar(0.4 + k * 0.8);
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

    // RESTART (game over) — wipe every live entity and reset all run state to a fresh start.
    // A short invulnerability window keeps stray bullets from re-killing instantly.
    restartRef.current = () => {
      for (const b of pBullets) scene.remove(b.mesh);
      pBullets.length = 0;
      for (const b of eBullets) scene.remove(b.mesh);
      eBullets.length = 0;
      for (const s of shards) {
        scene.remove(s.mesh);
        (s.mesh.material as THREE.Material).dispose();
      }
      shards.length = 0;
      for (const e of enemies) {
        resetEnemy(e); // back to formation slot with the pop-in effect
        e.respawn = 0;
        e.mesh.visible = true;
      }
      // the game-over fade left the shared cube materials transparent — restore them,
      // otherwise every cube comes back invisible after a restart
      pinkMat.opacity = 1;
      purpleMat.opacity = 1;
      playerX = 0;
      targetX = 0;
      fireCooldown = 0;
      diveTimer = 1.6;
      eFireTimer = 0.9;
      invuln = 1;
      over = false;
      sc = 0;
      lv = 3;
      setScore(0);
      setLives(3);
      setGameOver(false);
    };

    // reveal only once everything is loaded — in particular the Wasp GLB, so the ship
    // never pops in after gameplay has already begun. A minimum beat keeps the loading
    // screen from flashing by on fast connections; a timeout fallback guarantees we
    // still reveal if the asset fails to load (the error callback also sets modelReady).
    const t0 = performance.now();
    const MIN_READY_MS = 900;
    const MODEL_TIMEOUT_MS = 6000;
    const readyTimer = setInterval(() => {
      const elapsed = performance.now() - t0;
      if (elapsed >= MIN_READY_MS && (modelReady || elapsed > MODEL_TIMEOUT_MS)) {
        clearInterval(readyTimer);
        started = true; // gameplay starts fresh at the moment of reveal
        setPhase("ready");
      }
    }, 100);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      clearInterval(readyTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointermove", onPointerMove);
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
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ touchAction: "none" }} />
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
        <span className="flex gap-1.5 pt-1" role="img" aria-label={`${lives} lives remaining`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              size={14}
              className={`transition-colors duration-300 ${i < lives ? "fill-pink-500 text-pink-500" : "text-zinc-700"}`}
            />
          ))}
        </span>
      </div>

      {/* game over announcement + restart — stays centered */}
      {phase === "ready" && gameOver && (
        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4">
          <p className="font-mono text-sm tracking-[0.3em] text-pink-400">
            GAME OVER — SCORE {String(score).padStart(5, "0")}
          </p>
          <button
            onClick={() => restartRef.current()}
            className="rounded-full border border-emerald-400/60 px-6 py-2.5 font-mono text-xs font-bold tracking-[0.2em] text-emerald-300 transition hover:bg-emerald-400 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 sm:text-sm"
          >
            ↻ RESTART GAME
          </button>
        </div>
      )}

      {/* bottom-right status / CTA — out of the way of the playfield, above the hint line */}
      <div className="absolute right-4 bottom-10 z-10 flex items-center justify-end" aria-live="polite">
        {phase === "loading" ? (
          <p className="animate-pulse font-mono text-sm tracking-[0.3em] text-emerald-200">
            LOADING...
          </p>
        ) : (
          <button
            ref={btnRef}
            onClick={proceed}
            className="rounded-full bg-emerald-400 px-6 py-3 font-mono text-xs font-bold tracking-[0.2em] text-black shadow-[0_0_28px_rgba(52,211,153,0.45)] transition hover:bg-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 sm:text-sm"
          >
            PROCEED TO SITE →
          </button>
        )}
      </div>

      {/* controls hint — desktop only (drag is self-evident on touch) */}
      <p className="absolute bottom-4 left-0 right-0 hidden text-center font-mono text-[11px] tracking-widest text-slate-500 sm:block">
        ← → / A D OR DRAG TO MOVE · AUTO-FIRE UPWARD
      </p>
    </div>
  );
}