"use client";

import { useEffect, useRef } from "react";

/**
 * Full-screen "anti-gravity" particle vortex — a field of glowing dash/pill
 * particles that spiral slowly around a void at the screen center, drifting
 * outward (warp-tunnel feel) and respawning near the center when they leave
 * the viewport. The whole field also parallaxes gently against the cursor.
 *
 * Pure Canvas2D + rAF, no external dependencies — this replaced a Three.js
 * effect that was loaded from a third-party CDN at runtime.
 */

interface Particle {
  angle: number;        // current angle around the center, radians
  radius: number;       // current distance from the center
  spawnRadius: number;  // radius this particle last respawned at (drives fade-in)
  speed: number;        // outward radial drift per ms
  spin: number;         // per-particle angular drift on top of the global rotation
  length: number;       // dash length in px
  thickness: number;    // dash stroke width in px
  hueMix: number;       // 0..1 — blends between the two brand blues for depth variance
  opacity: number;      // base opacity, further modulated by radius fade in/out
}

// Brand blues (see globals.css --brand: #5ad2f4) blended with a slightly
// deeper indigo-blue so particles read as glowing light-blue with variance,
// not a flat single hue.
const COLOR_A = { r: 90, g: 210, b: 244 };   // #5ad2f4 — site brand color
const COLOR_B = { r: 74, g: 144, b: 226 };   // #4A90E2 — deeper accent blue

function lerpColor(t: number) {
  const r = Math.round(COLOR_A.r + (COLOR_B.r - COLOR_A.r) * t);
  const g = Math.round(COLOR_A.g + (COLOR_B.g - COLOR_A.g) * t);
  const b = Math.round(COLOR_A.b + (COLOR_B.b - COLOR_A.b) * t);
  return `${r}, ${g}, ${b}`;
}

export default function VortexBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // The absolute center stays empty — particles only ever live between
    // VOID_RADIUS and MAX_RADIUS, then respawn back at the inner edge.
    const VOID_RADIUS = 60;
    let maxRadius = 900;

    const particles: Particle[] = [];

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    function makeParticle(spawnNear = false): Particle {
      // Bias radius toward the outer edge so density increases with distance
      // from center (sqrt of a uniform draw skews the distribution outward).
      const radius = spawnNear
        ? VOID_RADIUS + rand(0, 20)
        : VOID_RADIUS + Math.sqrt(Math.random()) * (maxRadius - VOID_RADIUS);

      return {
        angle: rand(0, Math.PI * 2),
        radius,
        spawnRadius: radius,
        speed: rand(0.012, 0.045),          // px/ms — slow outward drift
        spin: rand(-0.00015, 0.00015),      // subtle per-particle spiral variance
        length: rand(10, 26),
        thickness: rand(1, 2.4),
        hueMix: Math.random(),
        opacity: rand(0.25, 0.95),
      };
    }

    function targetParticleCount() {
      // Scale with screen area, capped for consistent 60fps on large displays.
      const area = window.innerWidth * window.innerHeight;
      return Math.min(420, Math.max(140, Math.round(area / 4200)));
    }

    function seedParticles() {
      particles.length = 0;
      const count = targetParticleCount();
      for (let i = 0; i < count; i++) particles.push(makeParticle());
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Half the viewport diagonal plus margin so particles fully clear the
      // screen before respawning, at any aspect ratio.
      maxRadius = Math.hypot(width, height) / 2 + 80;

      const count = targetParticleCount();
      if (particles.length === 0) {
        seedParticles();
      } else if (particles.length < count) {
        while (particles.length < count) particles.push(makeParticle());
      } else if (particles.length > count) {
        particles.length = count;
      }
    }

    // ── Mouse parallax: the vortex center drifts opposite the cursor ──
    let targetOffsetX = 0;
    let targetOffsetY = 0;
    let offsetX = 0;
    let offsetY = 0;
    const PARALLAX_STRENGTH = 40; // px of max center travel

    function handlePointerMove(e: PointerEvent) {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;   // -1..1
      const ny = (e.clientY / window.innerHeight) * 2 - 1;  // -1..1
      targetOffsetX = -nx * PARALLAX_STRENGTH;
      targetOffsetY = -ny * PARALLAX_STRENGTH;
    }
    function handlePointerLeave() {
      targetOffsetX = 0;
      targetOffsetY = 0;
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);

    const GLOBAL_ROTATION_SPEED = 0.00006; // rad/ms — slow continuous field rotation
    let lastTime = performance.now();
    let rafId = 0;

    function frame(now: number) {
      const dt = Math.min(now - lastTime, 48); // clamp to avoid jumps on tab-switch
      lastTime = now;

      // Smoothly ease the parallax offset toward its target (no snapping).
      offsetX += (targetOffsetX - offsetX) * 0.06;
      offsetY += (targetOffsetY - offsetY) * 0.06;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2 + offsetX;
      const centerY = height / 2 + offsetY;

      ctx.lineCap = "round";

      for (const p of particles) {
        // Global rotation + this particle's own slight spiral drift.
        p.angle += GLOBAL_ROTATION_SPEED * dt + p.spin * dt;
        p.radius += p.speed * dt * (1 + p.radius / maxRadius); // accelerates outward, like approaching the viewer

        if (p.radius > maxRadius) {
          Object.assign(p, makeParticle(true));
          continue;
        }

        const dirX = Math.cos(p.angle);
        const dirY = Math.sin(p.angle);

        const innerR = p.radius;
        const outerR = p.radius + p.length;

        const x1 = centerX + dirX * innerR;
        const y1 = centerY + dirY * innerR;
        const x2 = centerX + dirX * outerR;
        const y2 = centerY + dirY * outerR;

        // Fade in near the void, fade out near the outer edge, for a soft
        // respawn/dissolve rather than a hard pop.
        const life = (p.radius - VOID_RADIUS) / (maxRadius - VOID_RADIUS);
        const fadeIn = Math.min(1, (p.radius - p.spawnRadius) / 40);
        const fadeOut = Math.min(1, (1 - life) / 0.08);
        const alpha = p.opacity * Math.max(0, Math.min(fadeIn, fadeOut, 1));

        if (alpha <= 0.01) continue;

        const rgb = lerpColor(p.hueMix);
        ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
        ctx.lineWidth = p.thickness;
        ctx.shadowColor = `rgba(${rgb}, ${Math.min(alpha * 0.8, 0.6)})`;
        ctx.shadowBlur = 4;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "#000" }}
    />
  );
}
