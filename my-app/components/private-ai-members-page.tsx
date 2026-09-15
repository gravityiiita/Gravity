"use client";

import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useMembers } from "@/hooks/use-members";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import type { Member } from "@/lib/types";
import { isSameWing } from "@/lib/wing-match";
import ProfileCard from "@/components/profile-card";
import "@/components/ProfileCard.css";
import { useIsTrueDesktop } from "@/hooks/use-true-desktop";

const GRAVITY_LOGO_SRC = "/gravity-logo.png";
const WING_FILTER = "Private AI";
const PARTICLE_IMG_SIZE = 400;
const MONO = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace";

// ─── Global CSS ─────────────────────────────────────────────────────────────
const NEURAL_CSS = `
@keyframes redacted-reveal {
  0% { transform: scaleX(1); transform-origin: left; }
  50% { transform: scaleX(0.2) skewX(-20deg); transform-origin: left; }
  51% { transform: scaleX(0.2) skewX(20deg); transform-origin: right; }
  100% { transform: scaleX(1); transform-origin: right; }
}

@keyframes text-flicker {
  0% { opacity: 0.1; text-shadow: 2px 0 #22d3ee, -2px 0 #8b5cf6; }
  2% { opacity: 1; text-shadow: 2px 0 #22d3ee, -2px 0 #8b5cf6; }
  4% { opacity: 0.1; text-shadow: none; }
  6% { opacity: 1; text-shadow: none; }
  /* ... more flickers ... */
  100% { opacity: 1; }
}

.stealth-heading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.stealth-title-wrapper {
  position: relative;
  overflow: hidden;
  padding: 10px 20px;
}

.stealth-title-text {
  font-size: clamp(42px, 8vw, 68px);
  font-weight: 950;
  letter-spacing: -0.05em;
  color: #fff;
  line-height: 0.9;
  text-transform: uppercase;
  font-family: ${MONO};
  margin: 0;
  position: relative;
  z-index: 2;
}

.redacted-reveal-bar {
  position: absolute;
  top: 15%;
  left: 0;
  width: 100%;
  height: 70%;
  background: #fff;
  z-index: 3;
  mix-blend-mode: difference;
  animation: redacted-reveal 6s cubic-bezier(0.8, 0, 0.2, 1) infinite;
}

.scanline-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(34, 211, 238, 0.05) 50%,
    transparent 100%
  );
  height: 2px;
  width: 100%;
  z-index: 4;
  animation: scanline 4s linear infinite;
  pointer-events: none;
}
`;

// ─── Image preprocessor (preserved) ─────────────────────────────────────────
function useProcessedImage(src: string): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!src) return;

    if (cacheRef.current.has(src)) {
      setDataUrl(cacheRef.current.get(src)!);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;
      try {
        const size = PARTICLE_IMG_SIZE;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = img.naturalWidth;
        tempCanvas.height = img.naturalHeight;
        const tCtx = tempCanvas.getContext("2d");
        if (!tCtx) return;
        tCtx.drawImage(img, 0, 0);
        const idata = tCtx.getImageData(
          0,
          0,
          img.naturalWidth,
          img.naturalHeight,
        );
        const data = idata.data;

        let minX = img.naturalWidth,
          minY = img.naturalHeight,
          maxX = 0,
          maxY = 0;
        for (let y = 0; y < img.naturalHeight; y++) {
          for (let x = 0; x < img.naturalWidth; x++) {
            const alpha = data[(y * img.naturalWidth + x) * 4 + 3];
            if (alpha > 10) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (minX > maxX || minY > maxY) {
          minX = 0;
          minY = 0;
          maxX = img.naturalWidth;
          maxY = img.naturalHeight;
        }

        const croppedW = maxX - minX;
        const croppedH = maxY - minY;
        ctx.clearRect(0, 0, size, size);
        const fitSize = size * 0.95;
        const scale = Math.min(fitSize / croppedW, fitSize / croppedH);
        const drawW = croppedW * scale;
        const drawH = croppedH * scale;
        const drawX = (size - drawW) / 2;
        const drawY = (size - drawH) / 2;

        ctx.drawImage(
          tempCanvas,
          minX,
          minY,
          croppedW,
          croppedH,
          drawX,
          drawY,
          drawW,
          drawH,
        );

        const finalDataUrl = canvas.toDataURL("image/png");
        cacheRef.current.set(src, finalDataUrl);
        setDataUrl(finalDataUrl);
      } catch (err) {
        console.error("Failed to process image:", err);
      }
    };

    img.onerror = () => {
      if (!cancelled) setDataUrl(src);
    };

    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return dataUrl;
}

// ─── Typewriter text ────────────────────────────────────────────────────────
function TypewriterText({
  text,
  speed = 30,
  delay = 500,
}: {
  text: string;
  speed?: number;
  delay?: number;
}) {
  const [chars, setChars] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started || chars >= text.length) return;
    const t = setTimeout(() => setChars((c) => c + 1), speed);
    return () => clearTimeout(t);
  }, [started, chars, text, speed]);

  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: "11px",
        color: "rgba(34,211,238,0.65)",
        letterSpacing: "0.02em",
      }}
    >
      {text.slice(0, chars)}
      <span
        style={{
          animation: "cursorBlink 1s step-end infinite",
          color: "rgba(34,211,238,0.9)",
        }}
      >
        ▋
      </span>
    </span>
  );
}

// ─── Neural Lattice Background (page-level canvas) ──────────────────────────
function NeuralLatticeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const count = 70;
    const nodes = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.8,
      baseAlpha: Math.random() * 0.3 + 0.06,
      hue: 210 + Math.random() * 70,
    }));

    const pulses: Array<{
      fi: number;
      ti: number;
      t: number;
      spd: number;
      hue: number;
    }> = [];

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let animId: number;
    const connDist = 180;

    const animate = () => {
      frame++;
      const w = canvas.width,
        h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -10) n.x = w + 10;
        if (n.x > w + 10) n.x = -10;
        if (n.y < -10) n.y = h + 10;
        if (n.y > h + 10) n.y = -10;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connDist) {
            const alpha = (1 - dist / connDist) * 0.1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(139,92,246,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            if (
              frame % 90 === 0 &&
              Math.random() < 0.012 &&
              pulses.length < 25
            ) {
              pulses.push({
                fi: i,
                ti: j,
                t: 0,
                spd: 0.005 + Math.random() * 0.008,
                hue: Math.random() > 0.5 ? 188 : 270,
              });
            }
          }
        }
      }

      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.t += pulse.spd;
        if (pulse.t > 1) {
          pulses.splice(p, 1);
          continue;
        }
        const from = nodes[pulse.fi],
          to = nodes[pulse.ti];
        if (!from || !to) {
          pulses.splice(p, 1);
          continue;
        }
        const px = from.x + (to.x - from.x) * pulse.t;
        const py = from.y + (to.y - from.y) * pulse.t;
        const pa = Math.sin(pulse.t * Math.PI) * 0.65;
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${pulse.hue},80%,65%,${pa})`;
        ctx.fill();
      }

      const mx = mouseRef.current.x,
        my = mouseRef.current.y;
      for (const n of nodes) {
        const md = Math.sqrt((n.x - mx) ** 2 + (n.y - my) ** 2);
        const mouseBoost = md < 160 ? (1 - md / 160) * 0.45 : 0;
        const alpha =
          n.baseAlpha +
          mouseBoost +
          Math.sin(frame * 0.015 + n.x * 0.01) * 0.07;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${n.hue},70%,65%,${Math.min(alpha, 0.85)})`;
        ctx.fill();

        if (alpha > 0.2) {
          const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
          grd.addColorStop(0, `hsla(${n.hue},70%,65%,${alpha * 0.22})`);
          grd.addColorStop(1, `hsla(${n.hue},70%,65%,0)`);
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouse);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.1,
      }}
    />
  );
}

// ─── Data Scroll Overlay (subtle hex/binary columns) ────────────────────────
function DataScrollOverlay() {
  return null;
}

// ─── Ambient floating particles (preserved, for particle viewport) ──────────
function AmbientParticles({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      opacity: number;
      hue: number;
      pulse: number;
      pulseSpeed: number;
    }>
  >([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;

    const count = Math.floor((width * height) / 1600);
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.3 + 0.05,
      hue: 210 + Math.random() * 70,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
    }));

    let animId: number;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const currentOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255, ${currentOpacity})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: width,
        height: height,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

import { Canvas, useFrame } from "@react-three/fiber";
import { TextureLoader, LinearFilter, Vector2, Object3D } from "three";
import { gsap } from "gsap";
import { vertex, fragment } from "./particle-system/shaders";
import {
  useInteractivity,
  interactivityTexture,
} from "./particle-system/interactivity";

// ─── ParticleSystem Inner Component ─────────────────────────────────────────
function ParticleSystem({
  src,
  width,
  height,
}: {
  src: string;
  width: number;
  height: number;
}) {
  const instanceMeshRef = useRef<any>(null);
  const isFirstLoad = useRef(true);

  // Uniform states
  const uniformsData = useMemo(() => {
    return {
      uSize: { value: 0.0 },
      uDepth: { value: -30.0 },
      uScatter: { value: 0.0 },
      uTime: { value: 0.0 },
      uRayTexture: { value: interactivityTexture },
      uTexture: { value: null as any },
      uTextureSize: {
        value: new Vector2(PARTICLE_IMG_SIZE, PARTICLE_IMG_SIZE),
      },
    };
  }, []);

  const { addTouch } = useInteractivity();

  // GSAP animations for transitions
  const showParticles = useCallback(
    (
      dValue: number,
      sValue: number,
      scValue: number,
      callback?: () => void,
      fast = false,
    ) => {
      gsap.killTweensOf(uniformsData.uDepth);
      gsap.killTweensOf(uniformsData.uScatter);
      gsap.killTweensOf(uniformsData.uSize);

      if (fast) {
        gsap
          .timeline({ onComplete: callback })
          .to(uniformsData.uDepth, {
            duration: 0.65,
            value: dValue,
            ease: "sine.inOut",
          })
          .to(
            uniformsData.uScatter,
            { duration: 0.65, value: scValue, ease: "sine.inOut" },
            "<",
          )
          .to(
            uniformsData.uSize,
            { duration: 0.65, value: sValue, ease: "sine.inOut" },
            "<",
          );
      } else {
        gsap
          .timeline({ onComplete: callback })
          .to(uniformsData.uDepth, {
            duration: 1.8,
            value: dValue,
            ease: "power2.out",
          })
          .to(
            uniformsData.uScatter,
            { duration: 1.8, value: scValue, ease: "power2.out" },
            "<",
          )
          .to(
            uniformsData.uSize,
            { duration: 1.8, value: sValue, ease: "power2.out" },
            "<",
          );
      }
    },
    [uniformsData],
  );

  // Load new texture when src changes, apply transition
  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    new TextureLoader().load(src, (tex) => {
      if (cancelled) return;
      tex.minFilter = LinearFilter;
      tex.magFilter = LinearFilter;

      if (!isFirstLoad.current) {
        gsap.killTweensOf(uniformsData.uDepth);
        gsap.killTweensOf(uniformsData.uScatter);
        gsap.killTweensOf(uniformsData.uSize);

        const SCATTER_DUR = 0.65;
        const SWAP_AT = SCATTER_DUR * 0.5;

        gsap
          .timeline()
          .to(uniformsData.uDepth, {
            duration: SCATTER_DUR,
            value: 30.0,
            ease: "sine.inOut",
          })
          .to(
            uniformsData.uScatter,
            { duration: SCATTER_DUR, value: 1.0, ease: "sine.inOut" },
            "<",
          )
          .to(
            uniformsData.uSize,
            { duration: SCATTER_DUR, value: 0.3, ease: "sine.inOut" },
            "<",
          )
          .call(
            () => {
              if (!instanceMeshRef.current) return;
              instanceMeshRef.current.material.uniforms.uTexture.value = tex;
              uniformsData.uTexture.value = tex;
              uniformsData.uTextureSize.value.set(
                PARTICLE_IMG_SIZE,
                PARTICLE_IMG_SIZE,
              );
              showParticles(0.0, 0.92, 0.0, undefined, false);
            },
            [],
            SWAP_AT,
          );
      } else {
        isFirstLoad.current = false;
        uniformsData.uTexture.value = tex;
        uniformsData.uTextureSize.value.set(
          PARTICLE_IMG_SIZE,
          PARTICLE_IMG_SIZE,
        );
        uniformsData.uDepth.value = 30.0;
        uniformsData.uScatter.value = 1.0;
        uniformsData.uSize.value = 0.3;

        showParticles(0.0, 0.92, 0.0);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [src, showParticles, uniformsData]);

  // Create dot positions once
  const { dots, sIndices, sPositions } = useMemo(() => {
    const totalDots = PARTICLE_IMG_SIZE * PARTICLE_IMG_SIZE;

    const indices = new Float32Array(totalDots);
    const positions = new Float32Array(totalDots * 3);

    for (let i = 0; i < totalDots; i++) {
      indices[i] = i;
      positions[i * 3 + 0] = i % PARTICLE_IMG_SIZE;
      positions[i * 3 + 1] = Math.floor(i / PARTICLE_IMG_SIZE);
      positions[i * 3 + 2] = 0;
    }

    return { dots: totalDots, sIndices: indices, sPositions: positions };
  }, []);

  useLayoutEffect(() => {
    if (!instanceMeshRef.current || dots === 0) return;

    const tempObject = new Object3D();
    for (let index = 0; index < dots; index++) {
      tempObject.position.set(
        sPositions[index * 3 + 0],
        sPositions[index * 3 + 1],
        sPositions[index * 3 + 2],
      );
      tempObject.updateMatrix();
      instanceMeshRef.current.setMatrixAt(index, tempObject.matrix);
    }
    instanceMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [dots, sPositions]);

  useFrame(({ clock }) => {
    if (instanceMeshRef.current?.material?.uniforms) {
      instanceMeshRef.current.material.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <React.Fragment>
      <instancedMesh
        ref={instanceMeshRef}
        args={[null as any, null as any, dots]}
      >
        <planeGeometry args={[2.0, 2.0, 1, 1]}>
          <instancedBufferAttribute
            attach="attributes-offset"
            args={[sPositions, 3]}
          />
          <instancedBufferAttribute
            attach="attributes-index"
            args={[sIndices, 1]}
          />
        </planeGeometry>
        <shaderMaterial
          attach="material"
          uniforms={uniformsData}
          fragmentShader={fragment}
          vertexShader={vertex}
          transparent={true}
          depthTest={false}
        />
      </instancedMesh>
      {/* Invisible plane for catching mouse rays */}
      <mesh onPointerMove={({ uv }) => addTouch({ x: uv!.x, y: uv!.y })}>
        <planeGeometry args={[PARTICLE_IMG_SIZE * 2, PARTICLE_IMG_SIZE * 2]} />
        <meshBasicMaterial attach="material" transparent={true} opacity={0.0} />
      </mesh>
    </React.Fragment>
  );
}

// ─── ParticleCanvas (R3F Wrapper) ───────────────────────────────────────────
function ParticleCanvas({
  src,
  width,
  height,
}: {
  src: string;
  width: number;
  height: number;
}) {
  const processedSrc = useProcessedImage(src);

  if (!processedSrc) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "rgba(255,255,255,0.3)",
            borderRadius: "50%",
            animation: "particleSpin .75s linear infinite",
          }}
        />
        <style>{`@keyframes particleSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const FOV = 75;
  const fovRad = (FOV * Math.PI) / 180;
  const aspect = width / Math.max(height, 1);
  const zForHeight = PARTICLE_IMG_SIZE / 2 / Math.tan(fovRad / 2);
  const zForWidth = PARTICLE_IMG_SIZE / 2 / (Math.tan(fovRad / 2) * aspect);
  // Pull camera back slightly for optimal sizing
  const cameraZ = Math.max(zForHeight, zForWidth) * 1.15;

  const cameraProps = {
    fov: FOV,
    near: 0.1,
    far: 3000,
    position: [0, 0, cameraZ] as const,
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <Canvas
        dpr={[1, 2]}
        camera={cameraProps}
        style={{ pointerEvents: "auto", width: "100%", height: "100%" }}
      >
        <React.Suspense fallback={null}>
          <ParticleSystem src={processedSrc} width={width} height={height} />
        </React.Suspense>
      </Canvas>
    </div>
  );
}

// ─── Social icons ───────────────────────────────────────────────────────────
const iconStyle = { width: 14, height: 14 };
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}
function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}
function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

// ─── Frame Corner Decoration ────────────────────────────────────────────────
function FrameCorner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const size = 28;
  const color = "rgba(255,255,255,0.1)";
  const base: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    pointerEvents: "none",
    zIndex: 5,
  };
  const map: Record<string, React.CSSProperties> = {
    tl: {
      top: 0,
      left: 0,
      borderTop: `1px solid ${color}`,
      borderLeft: `1px solid ${color}`,
    },
    tr: {
      top: 0,
      right: 0,
      borderTop: `1px solid ${color}`,
      borderRight: `1px solid ${color}`,
    },
    bl: {
      bottom: 0,
      left: 0,
      borderBottom: `1px solid ${color}`,
      borderLeft: `1px solid ${color}`,
    },
    br: {
      bottom: 0,
      right: 0,
      borderBottom: `1px solid ${color}`,
      borderRight: `1px solid ${color}`,
    },
  };
  return <div className="corner-deco" style={{ ...base, ...map[position] }} />;
}

// ─── Data Sphere Card (redesigned member card) ──────────────────────────────
function DataSphereCard({
  member,
  onHover,
  isActive,
  index,
}: {
  member: Member;
  onHover: (member: Member) => void;
  isActive: boolean;
  index: number;
}) {
  return (
    <div
      className={`dsphere-card${isActive ? " dsphere-active" : ""}`}
      onMouseEnter={() => onHover(member)}
      style={{
        position: "relative",
        overflow: "hidden",
        background: isActive
          ? "rgba(255,255,255,0.04)"
          : "rgba(255,255,255,0.015)",
        border: `1px solid ${isActive ? "rgba(34,211,238,0.25)" : "rgba(255,255,255,0.04)"}`,
        borderRadius: "12px",
        padding: "18px 24px 18px 28px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "14px",
      }}
    >
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: isActive ? "#fff" : "rgba(255,255,255,0.75)",
            transition: "color 0.3s",
            lineHeight: 1.3,
          }}
        >
          {member.name}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: isActive ? "rgba(34,211,238,0.7)" : "rgba(255,255,255,0.35)",
            textTransform: "capitalize",
            fontWeight: 400,
            marginTop: 2,
            transition: "color 0.3s",
          }}
        >
          {member.role}
        </div>
      </div>

      {/* Arrow indicator */}
      <div
        style={{
          opacity: isActive ? 0.6 : 0,
          transition: "opacity 0.3s",
          color: "#22d3ee",
          fontSize: "14px",
          flexShrink: 0,
        }}
      >
        →
      </div>

      {/* Social icons */}
      {member.socials && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "8px",
            alignItems: "center",
            zIndex: 2,
          }}
        >
          {member.socials.linkedin && (
            <a
              href={member.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                color: isActive
                  ? "rgba(255,255,255,0.5)"
                  : "rgba(255,255,255,0.2)",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
              }}
            >
              <LinkedInIcon />
            </a>
          )}
          {member.socials.twitter && (
            <a
              href={member.socials.twitter}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                color: isActive
                  ? "rgba(255,255,255,0.5)"
                  : "rgba(255,255,255,0.2)",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
              }}
            >
              <TwitterIcon />
            </a>
          )}
          {member.socials.instagram && (
            <a
              href={member.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                color: isActive
                  ? "rgba(255,255,255,0.5)"
                  : "rgba(255,255,255,0.2)",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
              }}
            >
              <InstagramIcon />
            </a>
          )}
          {member.socials.github && (
            <a
              href={member.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                color: isActive
                  ? "rgba(255,255,255,0.5)"
                  : "rgba(255,255,255,0.2)",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
              }}
            >
              <GitHubIcon />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Particle Viewport (Right Column) ───────────────────────────────────────
function ParticleViewport({
  activeSrc,
  activeMember,
}: {
  activeSrc: string;
  activeMember?: Member | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 500, h: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let rafId: number | null = null;
    const update = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const r = el.getBoundingClientRect();
        const w = Math.floor(r.width);
        const h = Math.floor(r.height);
        setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: 480,
        height: 480,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.35)",
        flexShrink: 0,
      }}
    >
      <AmbientParticles width={size.w} height={size.h} />

      {/* Vignette overlay — draws focus to center */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(4,4,12,0.6) 100%)",
          zIndex: 3,
        }}
      />

      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          zIndex: 2,
        }}
      />

      {/* Frame corners */}
      <FrameCorner position="tl" />
      <FrameCorner position="tr" />
      <FrameCorner position="bl" />
      <FrameCorner position="br" />

      {/* Member name overlay (bottom centre) */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: 0,
          right: 0,
          textAlign: "center",
          pointerEvents: "none",
          zIndex: 4,
        }}
      >
        {activeMember ? (
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "14px 36px",
              borderRadius: 14,
              background: "rgba(8,8,20,0.88)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              {activeMember.name}
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "rgba(34,211,238,0.6)",
                textTransform: "capitalize",
                fontWeight: 400,
              }}
            >
              {activeMember.role}
            </span>
          </div>
        ) : (
          <div
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.15)",
              fontWeight: 400,
            }}
          >
            Hover a member to preview
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          top: 0,
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {size.w > 0 && size.h > 36 && (
          <ParticleCanvas
            src={activeSrc}
            width={Math.max(size.w - 100, 100)}
            height={Math.max(size.h - 156, 100)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function PrivateAIMembersPage() {
  const allMembers = useMembers();
  const isDesktop = useIsTrueDesktop();
  const [mounted, setMounted] = useState(false);
  const [activeSrc, setActiveSrc] = useState<string>(GRAVITY_LOGO_SRC);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load JetBrains Mono font
  useEffect(() => {
    const href =
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap";
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  }, []);

  const { coordinators, regularMembers } = useMemo(() => {
    const list = allMembers.filter(
      (m) =>
        isSameWing(m.wing, WING_FILTER) &&
        !m.isOverallCoordinator &&
        !m.isFacultyCoordinator,
    );
    return {
      coordinators: list.filter((m) => m.role === "coordinator"),
      regularMembers: list.filter((m) => m.role === "member"),
    };
  }, [allMembers]);

  const activeMember = useMemo(
    () => allMembers.find((m) => m.id === activeMemberId),
    [allMembers, activeMemberId],
  );

  const handleHover = useCallback((member: Member | null) => {
    if (member) {
      setActiveSrc(member.image || GRAVITY_LOGO_SRC);
      setActiveMemberId(member.id);
    } else {
      setActiveSrc(GRAVITY_LOGO_SRC);
      setActiveMemberId(null);
    }
  }, []);

  if (!mounted) return null;

  // ── Mobile layout: standard scrollable page ──────────────────────────────
  if (!isDesktop) {
    return (
      <div style={{ position: "relative", minHeight: "100vh" }}>
        <style>{NEURAL_CSS}</style>
        <Navigation />
        <main style={{ padding: "80px 16px 40px" }}>
          <div
            className="stealth-heading-container"
            style={{ marginBottom: 40, marginTop: 20 }}
          >
            <div
              style={{
                fontFamily: MONO,
                fontSize: "10px",
                letterSpacing: "0.5em",
                color: "rgba(255,255,255,0.2)",
                textTransform: "uppercase",
                marginBottom: -10,
                zIndex: 1,
              }}
            >
              Confidential Protocol
            </div>

            <div className="stealth-title-wrapper" style={{ padding: "10px" }}>
              <div className="scanline-overlay" />
              <div className="redacted-reveal-bar" />
              <h1
                className="stealth-title-text"
                style={{
                  fontSize: "clamp(28px, 8vw, 42px)",
                  whiteSpace: "nowrap",
                }}
              >
                PRIVATE{" "}
                <span
                  style={{
                    color: "transparent",
                    WebkitTextStroke: "1px #fff",
                    opacity: 0.8,
                  }}
                >
                  AI
                </span>{" "}
                WING
              </h1>
            </div>
          </div>
          {coordinators.length > 0 && (
            <div className="mb-10">
              <h2 className="text-3xl font-bold mb-8 flex items-center justify-center gap-2 text-center text-white">
                <span className="text-2xl">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#fff"
                      d="M7.475 21Q5.2 21 3.6 19.4T2 15.525q0-2.15 1.438-3.713t3.587-1.737L3 2h7l2 4l2-4h7l-4 8.025q2.125.2 3.563 1.763T22 15.5q0 2.3-1.6 3.9T16.5 21q-.225 0-.462-.012t-.463-.063q1.375-.9 2.15-2.337T18.5 15.5q0-2.725-1.888-4.612T12 9t-4.612 1.888T5.5 15.5q0 1.7.7 3.2t2.2 2.225q-.225.05-.462.063T7.475 21M12 20q-1.875 0-3.187-1.312T7.5 15.5t1.313-3.187T12 11t3.188 1.313T16.5 15.5t-1.312 3.188T12 20m-1.85-1.75l1.85-1.4l1.85 1.4l-.7-2.275L15 14.65h-2.275L12 12.25l-.725 2.4H9l1.85 1.325z"
                    />
                  </svg>
                </span>
                <span>Coordinators</span>
              </h2>
              <div className="flex flex-wrap gap-4 justify-center">
                {coordinators.map((m) => (
                  <div key={m.id} className="fade-in-up">
                    <ProfileCard
                      name={m.name}
                      title={m.bio || m.wing}
                      handle={
                        m.name?.toLowerCase().replace(/\s+/g, "") ||
                        "coordinator"
                      }
                      status={m.role}
                      contactText="Contact"
                      avatarUrl={m.image || "/gravity-logo.png"}
                      socials={{
                        linkedin: m.socials?.linkedin,
                        x: m.socials?.twitter,
                      }}
                      showUserInfo={true}
                      enableTilt={true}
                      enableMobileTilt={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {regularMembers.length > 0 && (
            <div className="mb-10">
              <h2 className="text-3xl font-bold mb-8 flex items-center justify-center gap-2 text-center text-white">
                <span className="text-2xl">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 448 512"
                  >
                    <path
                      fill="#fff"
                      d="M224.3 128L139.7-12.9c-6.5-10.8-20.1-14.7-31.3-9.1L21.8 21.3C9.9 27.2 5.1 41.6 11 53.5l69.6 139.1C50.5 226.5 32.3 271.1 32.3 320c0 106 86 192 192 192s192-86 192-192c0-48.9-18.3-93.5-48.3-127.4l69.6-139.1c5.9-11.9 1.1-26.3-10.7-32.2l-86.7-43.4c-11.2-5.6-24.9-1.6-31.3 9.1zm30.8 142.5c1.4 2.8 4 4.7 7 5.1l50.1 7.3c7.7 1.1 10.7 10.5 5.2 16l-36.3 35.4c-2.2 2.2-3.2 5.2-2.7 8.3l8.6 49.9c1.3 7.6-6.7 13.5-13.6 9.9l-44.8-23.6c-2.7-1.4-6-1.4-8.7 0l-44.8 23.6c-6.9 3.6-14.9-2.2-13.6-9.9l8.6-49.9c.5-3-.5-6.1-2.7-8.3l-36.3-35.4c-5.6-5.4-2.5-14.8 5.2-16l50.1-7.3c3-.4 5.7-2.4 7-5.1l22.4-45.4c3.4-7 13.3-7 16.8 0l22.4 45.4z"
                    />
                  </svg>
                </span>
                <span>Members</span>
              </h2>
              <div className="flex flex-wrap gap-4 justify-center">
                {regularMembers.map((m) => (
                  <div key={m.id} className="fade-in-up">
                    <ProfileCard
                      name={m.name}
                      title={m.bio || m.wing}
                      handle={
                        m.name?.toLowerCase().replace(/\s+/g, "") || "member"
                      }
                      status={m.role}
                      contactText="Contact"
                      avatarUrl={m.image || "/placeholder-avatar.svg"}
                      socials={{
                        linkedin: m.socials?.linkedin,
                        instagram: m.socials?.instagram,
                        x: m.socials?.twitter,
                      }}
                      showUserInfo={true}
                      enableTilt={true}
                      enableMobileTilt={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  // ── Desktop layout: full-viewport split pane, footer below fold ──────────
  return (
    <div style={{ position: "relative", background: "rgba(4,4,12,0.97)" }}>
      <style>{NEURAL_CSS}</style>

      {/* Page-level neural lattice — behind everything */}
      <NeuralLatticeBackground />

      {/* Navigation renders itself as position:fixed — just render it */}
      <Navigation />

      {/* ── Main viewport section (exactly 100vh) ── */}
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Spacer for fixed nav */}
        <div style={{ flexShrink: 0, height: 68 }} />

        {/* Stealth Heading Section */}
        <div
          className="stealth-heading-container"
          style={{ flexShrink: 0, paddingTop: 20, marginBottom: 20 }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: "12px",
              letterSpacing: "0.8em",
              color: "rgba(255,255,255,0.2)",
              textTransform: "uppercase",
              marginBottom: -20,
              zIndex: 1,
            }}
          >
            Confidential Protocol
          </div>

          <div className="stealth-title-wrapper">
            <div className="scanline-overlay" />
            <div className="redacted-reveal-bar" />
            <h1 className="stealth-title-text">
              PRIVATE{" "}
              <span
                style={{
                  color: "transparent",
                  WebkitTextStroke: "2px #fff",
                  opacity: 0.8,
                }}
              >
                AI
              </span>{" "}
              WING
            </h1>
          </div>
        </div>

        {/* Main split pane — takes ALL remaining vertical space */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
            padding: "0 24px 20px",
            gap: 24,
            minHeight: 0,
          }}
        >
          {/* ── LEFT COLUMN: Members list ─────────────────────────────── */}
          <div
            style={{
              flex: "0 0 40%",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Scrollable card list */}
            <div
              className="neural-scroll"
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                paddingRight: 4,
              }}
            >
              {coordinators.length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.45)",
                      padding: "4px 0 12px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Coordinators
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {coordinators.map((m, i) => (
                      <DataSphereCard
                        key={m.id}
                        member={m}
                        onHover={handleHover}
                        isActive={activeMemberId === m.id}
                        index={i}
                      />
                    ))}
                  </div>
                </div>
              )}

              {regularMembers.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.45)",
                      padding: "8px 0 12px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Members
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {regularMembers.map((m, i) => (
                      <DataSphereCard
                        key={m.id}
                        member={m}
                        onHover={handleHover}
                        isActive={activeMemberId === m.id}
                        index={coordinators.length + i}
                      />
                    ))}
                  </div>
                </div>
              )}

              {coordinators.length === 0 && regularMembers.length === 0 && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.2)",
                    textAlign: "center",
                    paddingTop: 60,
                    fontWeight: 400,
                  }}
                >
                  Loading members…
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Focus Area ─────────────────────────────── */}
          <div style={{ flex: "1 1 60%", minWidth: 0, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ParticleViewport
              activeSrc={activeSrc}
              activeMember={activeMember}
            />
          </div>
        </div>
      </div>

      {/* Footer below the fold — scroll to see it */}
      <Footer />
    </div>
  );
}
