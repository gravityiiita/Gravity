"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import MagicButton from "@/components/magic-button";
import { useState, useRef, useEffect, useCallback } from "react";

/* ─────────────── reusable network-web background hook ─────────────── */
function useWebEffect() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [size, setSize] = useState({ w: 400, h: 300 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);

  return { ref, pos, hovering, setHovering, size, onMove };
}

/* static node positions (%) */
const NODES = [
  { x: 10, y: 15 },
  { x: 30, y: 8 },
  { x: 50, y: 20 },
  { x: 70, y: 12 },
  { x: 90, y: 18 },
  { x: 15, y: 35 },
  { x: 40, y: 40 },
  { x: 65, y: 32 },
  { x: 85, y: 38 },
  { x: 8, y: 55 },
  { x: 25, y: 60 },
  { x: 55, y: 52 },
  { x: 75, y: 58 },
  { x: 92, y: 50 },
  { x: 20, y: 78 },
  { x: 45, y: 72 },
  { x: 60, y: 82 },
  { x: 80, y: 75 },
  { x: 95, y: 85 },
  { x: 12, y: 92 },
  { x: 35, y: 88 },
  { x: 68, y: 95 },
  { x: 88, y: 90 },
];

const CONNS: { f: number; t: number }[] = [];
NODES.forEach((a, i) =>
  NODES.forEach((b, j) => {
    if (i < j && Math.hypot(a.x - b.x, a.y - b.y) < 30)
      CONNS.push({ f: i, t: j });
  }),
);

/** Renders the interactive SVG web + ambient gradients */
function NetworkBg({
  pos,
  hovering,
  size,
}: {
  pos: { x: number; y: number };
  hovering: boolean;
  size: { w: number; h: number };
}) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* ambient blobs */}
      <div
        className="absolute -top-[20%] -right-[20%] w-[70%] h-[70%] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at center,rgba(139,92,246,.2) 0%,rgba(124,58,237,.08) 40%,transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-[15%] -left-[15%] w-[60%] h-[60%] rounded-full opacity-25"
        style={{
          background:
            "radial-gradient(ellipse at center,rgba(167,139,250,.18) 0%,rgba(139,92,246,.06) 45%,transparent 70%)",
        }}
      />

      {/* SVG mesh */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: hovering ? 0.86 : 0.28,
          transition: "opacity .5s ease",
        }}
      >
        {CONNS.map((c, i) => {
          const a = NODES[c.f],
            b = NODES[c.t];
          const mx = ((a.x + b.x) / 200) * size.w,
            my = ((a.y + b.y) / 200) * size.h;
          const d = Math.hypot(pos.x - mx, pos.y - my);
          const t = hovering ? Math.max(0, 1 - d / 120) : 0;
          return (
            <line
              key={i}
              x1={`${a.x}%`}
              y1={`${a.y}%`}
              x2={`${b.x}%`}
              y2={`${b.y}%`}
              stroke={`rgba(167,139,250,${0.05 + t * 0.3})`}
              strokeWidth={0.55 + t * 0.9}
              style={{ transition: "stroke .15s,stroke-width .15s" }}
            />
          );
        })}
        {NODES.map((n, i) => {
          const nx = (n.x / 100) * size.w,
            ny = (n.y / 100) * size.h;
          const d = Math.hypot(pos.x - nx, pos.y - ny);
          const t = hovering ? Math.max(0, 1 - d / 100) : 0;
          return (
            <g key={i}>
              {t > 0.1 && (
                <circle
                  cx={`${n.x}%`}
                  cy={`${n.y}%`}
                  r={5 + t * 10}
                  fill={`rgba(167,139,250,${t * 0.18})`}
                  style={{ transition: "all .2s" }}
                />
              )}
              <circle
                cx={`${n.x}%`}
                cy={`${n.y}%`}
                r={1.2 + t * 1.8}
                fill={`rgba(196,181,253,${0.18 + t * 0.55})`}
                style={{ transition: "all .15s" }}
              />
            </g>
          );
        })}
      </svg>

      {/* cursor spotlight */}
      {hovering && (
        <div
          className="absolute w-48 h-48 rounded-full pointer-events-none"
          style={{
            left: pos.x - 96,
            top: pos.y - 96,
            background:
              "radial-gradient(circle at center,rgba(139,92,246,.06) 0%,rgba(167,139,250,.03) 40%,transparent 70%)",
            opacity: 0.65,
          }}
        />
      )}

      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.1) 100%)",
        }}
      />
    </div>
  );
}

/* ─────────────── main page ─────────────── */
export default function AboutPage() {
  const mission = useWebEffect();
  const values = useWebEffect();
  const join = useWebEffect();

  /* ── values data ── */
  const coreValues = [
    {
      title: "Innovation",
      desc: "Pushing boundaries and exploring new technologies",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="36"
          viewBox="0 0 24 24"
        >
          <path
            fill="white"
            d="M2.25 10A8.75 8.75 0 0 1 11 1.25c1.872 0 3.417.436 4.696 1.22c1.275.78 2.244 1.88 3.008 3.142c1.448 2.393 2.22 5.485 2.934 8.349l.09.357l.233.932H19.25v4h-3.5V23h-9.5v-5.65a8.74 8.74 0 0 1-4-7.35m10.181-4.996l.57 1.782l1.828-.397l1.432 2.479l-1.206 1.384l1.206 1.384l-1.432 2.48l-1.828-.398l-.57 1.782H9.57L9 13.718l-1.828.398l-1.432-2.48l1.206-1.384L5.74 8.868l1.432-2.48L9 6.786l.57-1.782zm-.036 5.248a1.392 1.392 0 1 0-2.784 0a1.392 1.392 0 0 0 2.784 0"
          />
        </svg>
      ),
    },
    {
      title: "Collaboration",
      desc: "Working together to achieve greater goals",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="36"
          viewBox="0 0 20 20"
        >
          <path
            fill="white"
            d="M12.5 4.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0m5 .5a2 2 0 1 1-4 0a2 2 0 0 1 4 0m-13 2a2 2 0 1 0 0-4a2 2 0 0 0 0 4M6 9.25C6 8.56 6.56 8 7.25 8h5.5c.69 0 1.25.56 1.25 1.25V14a4 4 0 0 1-8 0zm-1 0c0-.463.14-.892.379-1.25H3.25C2.56 8 2 8.56 2 9.25V13a3 3 0 0 0 3.404 2.973A5 5 0 0 1 5 14zM15 14c0 .7-.144 1.368-.404 1.973Q14.794 16 15 16a3 3 0 0 0 3-3V9.25C18 8.56 17.44 8 16.75 8h-2.129c.24.358.379.787.379 1.25z"
          />
        </svg>
      ),
    },
    {
      title: "Excellence",
      desc: "Striving for the highest quality in everything",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 48 48"
        >
          <defs>
            <mask id="aboutExc">
              <g
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
              >
                <path
                  fill="#fff"
                  stroke="#fff"
                  d="m24 4l5.253 3.832l6.503-.012l1.997 6.188l5.268 3.812L41 24l2.021 6.18l-5.268 3.812l-1.997 6.188l-6.503-.012L24 44l-5.253-3.832l-6.503.012l-1.997-6.188l-5.268-3.812L7 24l-2.021-6.18l5.268-3.812l1.997-6.188l6.503.012z"
                />
                <path stroke="#000" d="m17 24l5 5l10-10" />
              </g>
            </mask>
          </defs>
          <path fill="#fff" d="M0 0h48v48H0z" mask="url(#aboutExc)" />
        </svg>
      ),
    },
    {
      title: "Growth",
      desc: "Continuous learning and personal development",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="36"
          viewBox="0 0 24 24"
        >
          <path
            fill="#fff"
            d="M3 16.359V21h20v2H1V1h2v12.545l2.287-2.263a3 3 0 1 1 5.592-.437l2.757 2.482a3 3 0 0 1 2.256-.192l2.86-5.148a3 3 0 1 1 1.748.972l-2.995 5.39a3 3 0 1 1-5.246.43l-2.561-2.305A3 3 0 0 1 8 13c-.467 0-.91-.107-1.304-.298z"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen mt-10 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-20">
          {/* ━━ Header ━━ */}
          <div className="text-center slide-in-up">
            <p className="text-sm font-medium tracking-widest uppercase text-purple-400 mb-3">
              Who We Are
            </p>
            <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-4 flex flex-wrap items-center justify-center gap-3">
              <span>About</span>
              <img
                src="/GRAVITY_Cover_No_BG(1).png"
                alt="Gravity"
                className="h-8 md:h-18 w-auto object-contain drop-shadow-[0_0_10px_rgba(124,92,255,0.35)]"
              />
            </h1>
            <p className="text-lg text-foreground/60 max-w-xl mx-auto">
              A technical society uniting five wings of innovation
              under one roof.
            </p>
          </div>

          {/* ━━ Mission & Vision ━━ */}
          <div
            ref={mission.ref}
            className="card-glow p-8 md:p-10 slide-in-up relative overflow-hidden rounded-2xl"
            onMouseMove={mission.onMove}
            onMouseEnter={() => mission.setHovering(true)}
            onMouseLeave={() => mission.setHovering(false)}
          >
            <NetworkBg
              pos={mission.pos}
              hovering={mission.hovering}
              size={mission.size}
            />

            <div className="relative z-10 grid md:grid-cols-2 gap-10 md:gap-14">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px w-8 bg-purple-500/60" />
                  <span className="text-xs font-semibold tracking-widest uppercase text-purple-400">
                    Mission
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  Gravity is a technical society dedicated to fostering
                  innovation, collaboration, and excellence in technology. We
                  bring together passionate individuals across five distinct
                  domains to create, learn, and grow together.
                </p>
                <p className="text-foreground/70 leading-relaxed">
                  Whether you&apos;re into competitive programming, web
                  development, design, open-source or AI — Gravity provides the platform and community to
                  achieve your goals.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px w-8 bg-cyan-500/60" />
                  <span className="text-xs font-semibold tracking-widest uppercase text-cyan-400">
                    Vision
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  To create a vibrant ecosystem of tech enthusiasts who push the
                  boundaries of innovation and collaborate to solve real-world
                  problems.
                </p>
                <p className="text-foreground/70 leading-relaxed">
                  We believe in the power of community, continuous learning, and
                  practical application of knowledge. Together, we&apos;re
                  shaping the future of technology.
                </p>
              </div>
            </div>
          </div>

          {/* ━━ Core Values ━━ */}
          <div>
            <div className="text-center mb-10">
              <p className="text-sm font-medium tracking-widest uppercase text-purple-400 mb-2">
                What Drives Us
              </p>
              <h2 className="text-3xl font-bold gradient-text">
                Our Core Values
              </h2>
            </div>

            <div
              ref={values.ref}
              className="card-glow p-6 md:p-10 relative overflow-hidden rounded-2xl slide-in-up"
              onMouseMove={values.onMove}
              onMouseEnter={() => values.setHovering(true)}
              onMouseLeave={() => values.setHovering(false)}
            >
              <NetworkBg
                pos={values.pos}
                hovering={values.hovering}
                size={values.size}
              />
              <div className="relative z-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {coreValues.map((v, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center gap-3 p-4 rounded-xl"
                  >
                    <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/6 flex items-center justify-center">
                      {v.icon}
                    </div>
                    <h3 className="font-bold text-lg">{v.title}</h3>
                    <p className="text-foreground/55 text-sm leading-relaxed">
                      {v.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ━━ Join Our Community ━━ */}
          <div
            ref={join.ref}
            className="card-glow overflow-hidden slide-in-up relative rounded-2xl"
            onMouseMove={join.onMove}
            onMouseEnter={() => join.setHovering(true)}
            onMouseLeave={() => join.setHovering(false)}
          >
            <NetworkBg
              pos={join.pos}
              hovering={join.hovering}
              size={join.size}
            />

            <div className="relative z-10 flex flex-col md:flex-row">
              {/* Left Visual */}
              <div className="md:w-[30%] w-full flex items-center justify-center p-8 md:p-6 min-h-55">
                <svg
                  width="160"
                  height="160"
                  viewBox="0 0 160 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="rgba(167,139,250,0.4)"
                    strokeWidth="1.5"
                    fill="none"
                    strokeDasharray="12 8 4 8"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 80 80"
                      to="360 80 80"
                      dur="25s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx="80"
                    cy="80"
                    r="54"
                    stroke="rgba(138,232,255,0.45)"
                    strokeWidth="1.2"
                    fill="none"
                    strokeDasharray="6 10"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="360 80 80"
                      to="0 80 80"
                      dur="18s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx="80"
                    cy="80"
                    r="42"
                    stroke="rgba(167,139,250,0.35)"
                    strokeWidth="1"
                    fill="none"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 80 80"
                      to="360 80 80"
                      dur="30s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx="80"
                    cy="80"
                    r="30"
                    fill="rgba(167,139,250,0.08)"
                  />
                  <rect
                    x="58"
                    y="66"
                    width="44"
                    height="30"
                    rx="4"
                    fill="rgba(167,139,250,0.15)"
                    stroke="rgba(167,139,250,0.5)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M58 70 L80 86 L102 70"
                    fill="none"
                    stroke="rgba(167,139,250,0.6)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="80" cy="10" r="3" fill="rgba(167,139,250,0.6)">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 80 80"
                      to="360 80 80"
                      dur="25s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle cx="80" cy="26" r="2.5" fill="rgba(138,232,255,0.5)">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="360 80 80"
                      to="0 80 80"
                      dur="18s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              </div>

              {/* Right Content */}
              <div className="md:w-[70%] w-full p-8 flex flex-col items-center md:items-start justify-center text-center md:text-left">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px w-8 bg-purple-500/60" />
                  <span className="text-xs font-semibold tracking-widest uppercase text-purple-400">
                    Get Involved
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
                <p className="text-foreground/70 mb-6 max-w-2xl">
                  Whether you&apos;re a beginner just starting your tech journey
                  or an experienced developer, Gravity welcomes you. Join us in
                  building an amazing tech community!
                </p>
                <MagicButton heightClass="h-11" href="/contact">
                  Get Started Today
                </MagicButton>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
