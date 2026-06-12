import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioEngine, type TrackId } from "@/lib/audio-engine";
import { BottomNav } from "@/components/mobile/BottomNav";
import statueImg from "@/assets/Statue icon.png";
import chamberImg from "@/assets/Focus chamber.png";

export const Route = createFileRoute("/deep")({
  component: DeepPage,
  head: () => ({
    meta: [
      { title: "Focus Chamber — Kairos" },
      { name: "description", content: "Enter the chamber. A sacred space for deep work and mastery." },
    ],
  }),
});

// ─── DATA ──────────────────────────────────────────────────────────────────────

const DURATION_PRESETS = [
  { min: 15, label: "Focused Sprint",   sub: "SPRINT"    },
  { min: 25, label: "Deep Work Chamber",sub: "DEEP WORK" },
  { min: 45, label: "Extended Flow",    sub: "FLOW"      },
  { min: 60, label: "Immersion",        sub: "IMMERSION" },
] as const;

const TRACKS: { id: TrackId; label: string; icon: string }[] = [
  { id: "rain",      label: "Temple Rain",       icon: "🌧" },
  { id: "brown",     label: "Oracle Winds",      icon: "〰" },
  { id: "focus",     label: "Sacred Forest",     icon: "🍃" },
  { id: "deepspace", label: "Cosmos Depth",      icon: "◎" },
  { id: "neural40hz",label: "Ancient Resonance", icon: "〜" },
];

type Stage = { name: string; threshold: number };
const STAGES: Stage[] = [
  { name: "Building Focus",  threshold: 0    },
  { name: "Established",     threshold: 0.25 },
  { name: "Peak Flow",       threshold: 0.55 },
  { name: "Flow State",      threshold: 0.8  },
];

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

function DeepPage() {
  const [mission, setMission]         = useState("");
  const [running, setRunning]         = useState(false);
  const [elapsed, setElapsed]         = useState(0);
  const [done, setDone]               = useState(false);
  const [thoughts, setThoughts]       = useState<{ t: number; text: string }[]>([]);
  const [thoughtOpen, setThoughtOpen] = useState(false);
  const [thoughtDraft, setThoughtDraft] = useState("");
  const [active, setActive]           = useState<Set<TrackId>>(new Set());
  const [volume, setVolume]           = useState(0.45);
  const [durationMin, setDurationMin] = useState(25);
  const [customDraft, setCustomDraft] = useState("");
  const [now, setNow]                 = useState(() => new Date());
  const [mousePos, setMousePos]       = useState({ x: 0.5, y: 0.5 });

  const SESSION_MS = durationMin * 60 * 1000;

  // Persist duration
  useEffect(() => {
    try {
      const v = parseInt(localStorage.getItem("dm_duration_min") ?? "25", 10);
      if (v >= 5 && v <= 180) setDurationMin(v);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("dm_duration_min", String(durationMin)); } catch {}
  }, [durationMin]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Mouse parallax
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const engineRef      = useRef<AudioEngine | null>(null);
  const startedAtRef   = useRef<number | null>(null);
  const rafRef         = useRef<number | null>(null);
  const canvasRef      = useRef<HTMLCanvasElement | null>(null);

  // Persist mission + thoughts
  useEffect(() => {
    try { setMission(localStorage.getItem("dm_mission") ?? ""); } catch {}
    try {
      const raw = localStorage.getItem("dm_thoughts");
      if (raw) setThoughts(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("dm_mission", mission); } catch {} }, [mission]);
  useEffect(() => { try { localStorage.setItem("dm_thoughts", JSON.stringify(thoughts.slice(-50))); } catch {} }, [thoughts]);

  // Audio engine
  useEffect(() => {
    engineRef.current = new AudioEngine();
    return () => { engineRef.current?.stopAll(); engineRef.current = null; };
  }, []);
  useEffect(() => { engineRef.current?.setVolume(volume); }, [volume]);

  const toggleTrack = (id: TrackId) => {
    const e = engineRef.current; if (!e) return;
    e.toggle(id);
    setActive(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Timer
  useEffect(() => {
    if (!running) return;
    startedAtRef.current = performance.now() - elapsed;
    const loop = () => {
      const start = startedAtRef.current ?? performance.now();
      const e = performance.now() - start;
      if (e >= SESSION_MS) {
        setElapsed(SESSION_MS);
        setRunning(false);
        setDone(true);
        engineRef.current?.chime(528, 5);
        try {
          const c = parseInt(localStorage.getItem("dm_cycles_week") ?? "0", 10) || 0;
          localStorage.setItem("dm_cycles_week", String(c + 1));
        } catch {}
        return;
      }
      setElapsed(e);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running, SESSION_MS]);

  // Keyboard: T = thought
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (ev.key === "t" || ev.key === "T") setThoughtOpen(true);
      if (ev.key === "Escape") setThoughtOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Canvas — ancient observatory atmosphere (warm gold / dark marble)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Floating gold dust particles
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random(), y: Math.random(),
      r: 0.4 + Math.random() * 1.2,
      vx: (Math.random() - 0.5) * 0.06,
      vy: -0.04 - Math.random() * 0.08,
      alpha: Math.random(),
      phase: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    const t0 = performance.now();
    const draw = () => {
      const t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, W, H);

      // Subtle warm marble veins
      ctx.globalAlpha = 0.018;
      for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = `rgba(200,167,106,1)`;
        ctx.lineWidth = 0.6 + Math.random() * 0.4;
        ctx.beginPath();
        const yv = H * (0.1 + i * 0.14 + Math.sin(t * 0.05 + i) * 0.02);
        ctx.moveTo(0, yv);
        for (let x = 0; x <= W; x += 20) {
          ctx.lineTo(x, yv + Math.sin(x * 0.012 + i * 2) * 18);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Central gold ambient glow (warm halo)
      const cx = W / 2, cy = H * 0.38;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.45);
      glow.addColorStop(0, `rgba(200,140,60,${0.04 + Math.sin(t * 0.4) * 0.01})`);
      glow.addColorStop(0.5, `rgba(160,100,40,0.02)`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Floating gold dust
      particles.forEach(p => {
        p.x += p.vx / W * 0.5; p.y += p.vy / H * 0.5; p.phase += 0.02;
        if (p.y < -0.02) p.y = 1.02;
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02) p.x = -0.02;
        const glow2 = 0.4 + Math.sin(p.phase) * 0.4;
        ctx.globalAlpha = glow2 * 0.5;
        ctx.fillStyle = `rgba(220,180,90,1)`;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  // Derived
  const progress     = elapsed / SESSION_MS;
  const remainingMs  = Math.max(0, SESSION_MS - elapsed);
  const mm           = Math.floor(remainingMs / 60000);
  const ss           = Math.floor((remainingMs % 60000) / 1000);
  const stage        = STAGES.slice().reverse().find(s => progress >= s.threshold) ?? STAGES[0];
  const flow         = Math.min(100, Math.round(60 + progress * 40 + Math.sin(elapsed / 1500) * 4));
  const depth        = Math.min(100, Math.round(40 + progress * 55));
  const reserve      = Math.max(20, Math.round(95 - progress * 50));
  const selectedPreset = DURATION_PRESETS.find(p => p.min === durationMin);

  const startSession = () => { setDone(false); setElapsed(0); setRunning(true); };
  const stopSession  = () => setRunning(false);
  const resetSession = () => { setRunning(false); setElapsed(0); setDone(false); };

  const captureThought = () => {
    if (!thoughtDraft.trim()) { setThoughtOpen(false); return; }
    setThoughts(t => [...t, { t: Date.now(), text: thoughtDraft.trim() }]);
    setThoughtDraft(""); setThoughtOpen(false);
  };

  const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Parallax shift values for running mode
  const parallaxX = (mousePos.x - 0.5) * 18;
  const parallaxY = (mousePos.y - 0.5) * 10;

  return (
    <div style={{ position: "fixed", inset: 0, background: running ? "#000" : "#050505", color: "rgba(233,226,216,0.92)", overflow: "hidden", fontFamily: "var(--font-sanctuary-ui)" }}>

      {/* ── CHAMBER IMAGE BACKGROUND (active session only) ── */}
      <AnimatePresence>
        {running && (
          <motion.div
            key="chamber-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}
          >
            {/* Temple image with parallax */}
            <div
              style={{
                position: "absolute",
                inset: "-20px",
                backgroundImage: `url(${chamberImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center center",
                backgroundRepeat: "no-repeat",
                transform: `translate(${parallaxX}px, ${parallaxY}px) scale(1.06)`,
                transition: "transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                willChange: "transform",
              }}
            />

            {/* Dark gradient overlay — top heavy for header readability */}
            <div style={{
              position: "absolute", inset: 0,
              background: `
                linear-gradient(
                  to bottom,
                  rgba(0,0,0,0.78) 0%,
                  rgba(0,0,0,0.55) 30%,
                  rgba(0,0,0,0.45) 50%,
                  rgba(0,0,0,0.55) 70%,
                  rgba(0,0,0,0.82) 100%
                )
              `,
            }} />

            {/* Vignette — radial dark edges */}
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.85) 100%)",
            }} />

            {/* Warm gold atmospheric haze */}
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at 50% 45%, rgba(180,130,50,0.06) 0%, transparent 65%)",
              animation: "chamberHaze 6s ease-in-out infinite",
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background canvas — particles + subtle glow only (no solid fill, so chamber image shows) */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", zIndex: 1 }}
      />

      <style>{`
        @keyframes chamberHaze {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Main scrollable content */}
      <div style={{ position: "relative", zIndex: 5, height: "100%", overflowY: "auto", paddingBottom: running ? 0 : 80 }}>

        {/* ── HEADER ── */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: "1px solid rgba(200,167,106,0.08)" }}>
          {/* Left: back + temple icon */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link to="/" style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(200,167,106,0.18)", background: "rgba(200,167,106,0.04)", color: "var(--k-gold)", textDecoration: "none", fontSize: 16 }}>
              ‹
            </Link>
            {/* Temple SVG icon */}
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(200,167,106,0.7)" strokeWidth={1.1} strokeLinecap="round">
              <path d="M3 10L12 4L21 10" />
              <path d="M5 10V18M8 10V18M12 10V18M16 10V18M19 10V18" />
              <path d="M3 20H21" />
            </svg>
          </div>

          {/* Center: time + label */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-sanctuary-display)", fontSize: 28, fontWeight: 400, letterSpacing: "0.06em", color: "var(--k-marble)", lineHeight: 1 }}>
              {timeString}
            </div>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(200,167,106,0.55)", marginTop: 3 }}>
              CURRENT CHAMBER
            </div>
          </div>

          {/* Right: compass / focus icon */}
          <svg width={36} height={36} viewBox="0 0 36 36" fill="none">
            <circle cx={18} cy={18} r={17} stroke="rgba(200,167,106,0.2)" strokeWidth={1} />
            <circle cx={18} cy={18} r={12} stroke="rgba(200,167,106,0.12)" strokeWidth={0.6} />
            <line x1={18} y1={2} x2={18} y2={6}  stroke="rgba(200,167,106,0.5)" strokeWidth={1} />
            <line x1={18} y1={30} x2={18} y2={34} stroke="rgba(200,167,106,0.5)" strokeWidth={1} />
            <line x1={2}  y1={18} x2={6}  y2={18} stroke="rgba(200,167,106,0.5)" strokeWidth={1} />
            <line x1={30} y1={18} x2={34} y2={18} stroke="rgba(200,167,106,0.5)" strokeWidth={1} />
            <polygon points="18,8 20,18 18,16 16,18" fill="rgba(200,167,106,0.8)" />
            <polygon points="18,28 20,18 18,20 16,18" fill="rgba(200,167,106,0.3)" />
            <circle cx={18} cy={18} r={2} fill="rgba(200,167,106,0.7)" />
          </svg>
        </header>

        {/* ── HERO STATUE ── */}
        {!running && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 20px 0", overflow: "visible" }}
          >
            {/* Sacred archway backdrop */}
            <div style={{
              position: "absolute",
              top: 0, left: "50%",
              transform: "translateX(-50%)",
              width: 260,
              height: 220,
              pointerEvents: "none",
            }}>
              <svg width="260" height="220" viewBox="0 0 260 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0 }}>
                {/* Archway outer frame */}
                <path
                  d="M20 215 L20 90 Q20 20 130 20 Q240 20 240 90 L240 215"
                  stroke="rgba(200,167,106,0.09)" strokeWidth="1.5" fill="none"
                />
                {/* Inner arch */}
                <path
                  d="M40 215 L40 95 Q40 42 130 42 Q220 42 220 95 L220 215"
                  stroke="rgba(200,167,106,0.06)" strokeWidth="1" fill="none"
                />
                {/* Subtle celestial geometry — circle */}
                <circle cx="130" cy="110" r="70" stroke="rgba(200,167,106,0.04)" strokeWidth="0.8" fill="none" />
                <circle cx="130" cy="110" r="88" stroke="rgba(200,167,106,0.03)" strokeWidth="0.5" fill="none" />
                {/* Keystone ornament */}
                <path d="M118 20 L130 6 L142 20" stroke="rgba(200,167,106,0.12)" strokeWidth="1" fill="none" />
                <line x1="130" y1="6" x2="130" y2="20" stroke="rgba(200,167,106,0.1)" strokeWidth="0.8" />
                {/* Column base lines */}
                <line x1="10" y1="215" x2="50" y2="215" stroke="rgba(200,167,106,0.1)" strokeWidth="1" />
                <line x1="210" y1="215" x2="250" y2="215" stroke="rgba(200,167,106,0.1)" strokeWidth="1" />
                {/* Marble texture hint — horizontal lines */}
                <line x1="22" y1="160" x2="238" y2="160" stroke="rgba(200,167,106,0.025)" strokeWidth="0.5" />
                <line x1="22" y1="185" x2="238" y2="185" stroke="rgba(200,167,106,0.025)" strokeWidth="0.5" />
                {/* Celestial cross geometry */}
                <line x1="130" y1="42" x2="130" y2="178" stroke="rgba(200,167,106,0.025)" strokeWidth="0.5" />
                <line x1="62" y1="110" x2="198" y2="110" stroke="rgba(200,167,106,0.025)" strokeWidth="0.5" />
              </svg>

              {/* Ambient gold glow behind statue */}
              <div style={{
                position: "absolute",
                top: "30%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: "radial-gradient(ellipse at center, rgba(200,150,60,0.07) 0%, rgba(160,110,40,0.03) 50%, transparent 75%)",
                filter: "blur(18px)",
                animation: "statueGlowPulse 4s ease-in-out infinite",
              }} />
            </div>

            {/* Gold rim light — left edge */}
            <div style={{
              position: "absolute",
              top: 18, left: "calc(50% - 48px)",
              width: 2,
              height: 170,
              background: "linear-gradient(to bottom, transparent, rgba(200,167,106,0.18), rgba(200,167,106,0.08), transparent)",
              borderRadius: 2,
              filter: "blur(2px)",
              pointerEvents: "none",
            }} />
            {/* Gold rim light — right edge */}
            <div style={{
              position: "absolute",
              top: 18, right: "calc(50% - 48px)",
              width: 2,
              height: 170,
              background: "linear-gradient(to bottom, transparent, rgba(200,167,106,0.18), rgba(200,167,106,0.08), transparent)",
              borderRadius: 2,
              filter: "blur(2px)",
              pointerEvents: "none",
            }} />

            {/* The statue */}
            <img
              src={statueImg}
              alt="Sacred Greek Statue — Focus Guardian"
              style={{
                position: "relative",
                zIndex: 2,
                height: "clamp(110px, 22vw, 170px)",
                width: "auto",
                objectFit: "contain",
                display: "block",
                filter: "drop-shadow(0 0 18px rgba(200,160,70,0.22)) drop-shadow(0 8px 28px rgba(0,0,0,0.7))",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />

            {/* Floating gold dust particles (CSS-only) */}
            <div className="statue-dust-layer" style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
              {[...Array(7)].map((_, i) => (
                <span
                  key={i}
                  className="statue-dust-particle"
                  style={{
                    left: `${20 + i * 10}%`,
                    animationDelay: `${i * 0.65}s`,
                    animationDuration: `${3 + i * 0.5}s`,
                    width: i % 2 === 0 ? 2 : 1.5,
                    height: i % 2 === 0 ? 2 : 1.5,
                  }}
                />
              ))}
            </div>

            <style>{`
              @keyframes statueGlowPulse {
                0%, 100% { opacity: 0.7; transform: translate(-50%,-50%) scale(1); }
                50% { opacity: 1; transform: translate(-50%,-50%) scale(1.08); }
              }
              .statue-dust-particle {
                position: absolute;
                bottom: 20%;
                border-radius: 50%;
                background: rgba(220,180,80,0.7);
                animation: statueDustFloat linear infinite;
              }
              @keyframes statueDustFloat {
                0% { transform: translateY(0) scale(1); opacity: 0; }
                20% { opacity: 0.8; }
                80% { opacity: 0.4; }
                100% { transform: translateY(-120px) scale(0.5); opacity: 0; }
              }
            `}</style>
          </motion.div>
        )}

        {/* ── HERO TITLE ── */}
        {!running && (
          <div style={{ textAlign: "center", padding: "10px 20px 0" }}>
            <div style={{ fontFamily: "var(--font-sanctuary-display)", fontSize: 30, fontWeight: 400, letterSpacing: "0.14em", color: "var(--k-marble)" }}>
              ENTER THE CHAMBER
            </div>
            {/* Gold ornamental divider */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "6px 0 4px" }}>
              <div style={{ height: 1, width: 40, background: "linear-gradient(to right, transparent, rgba(200,167,106,0.5))" }} />
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(200,167,106,0.6)" strokeWidth={1.1} strokeLinecap="round">
                <path d="M3 10L12 4L21 10" />
                <path d="M5 10V17M12 10V17M19 10V17" />
                <path d="M3 19H21" />
              </svg>
              <div style={{ height: 1, width: 40, background: "linear-gradient(to left, transparent, rgba(200,167,106,0.5))" }} />
            </div>
            <div style={{ fontFamily: "var(--font-sanctuary-display)", fontStyle: "italic", fontSize: 14, color: "rgba(200,167,106,0.45)", letterSpacing: "0.04em" }}>
              Guard this moment.
            </div>
          </div>
        )}

        {/* ── CENTERPIECE TIMER ── */}
        <div style={{ display: "flex", justifyContent: "center", padding: running ? "32px 20px 16px" : "10px 20px 8px" }}>
          <ChamberTimer
            progress={progress}
            mm={mm}
            ss={ss}
            stageName={stage.name}
            chamberLabel={selectedPreset?.sub ?? "CUSTOM"}
            running={running}
          />
        </div>

        {/* ── MISSION (when not running) ── */}
        {!running && (
          <div style={{ padding: "0 20px 8px", display: "flex", justifyContent: "center" }}>
            <input
              value={mission}
              onChange={e => setMission(e.target.value)}
              placeholder="What are you here to do?"
              style={{
                width: "100%", maxWidth: 360,
                background: "transparent",
                border: "none",
                borderBottom: "1px solid rgba(200,167,106,0.18)",
                color: "var(--k-marble)",
                fontFamily: "var(--font-sanctuary-display)",
                fontWeight: 300,
                fontSize: 16,
                textAlign: "center",
                padding: "8px 0",
                outline: "none",
                letterSpacing: "0.04em",
              }}
            />
          </div>
        )}

        {/* ── SESSION DURATION ── */}
        {!running && !done && (
          <div style={{ padding: "12px 16px 0" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.32em", color: "rgba(200,167,106,0.45)", textAlign: "center", marginBottom: 10 }}>
              SESSION DURATION
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {DURATION_PRESETS.map(p => {
                const selected = durationMin === p.min;
                return (
                  <button
                    key={p.min}
                    onClick={() => setDurationMin(p.min)}
                    style={{
                      padding: "12px 6px",
                      borderRadius: 12,
                      border: `1px solid ${selected ? "rgba(200,167,106,0.5)" : "rgba(255,255,255,0.07)"}`,
                      background: selected
                        ? "linear-gradient(145deg, rgba(200,167,106,0.1), rgba(200,167,106,0.04))"
                        : "rgba(10,10,10,0.6)",
                      boxShadow: selected ? "0 0 16px rgba(200,167,106,0.15), inset 0 1px 0 rgba(200,167,106,0.08)" : "none",
                      color: selected ? "var(--k-soft-gold)" : "var(--k-muted)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-sanctuary-display)", fontWeight: 400, fontSize: 22, lineHeight: 1, color: selected ? "var(--k-soft-gold)" : "var(--k-marble)" }}>
                      {p.min === 60 ? "∞" : p.min}
                    </span>
                    <span style={{ fontSize: 8, letterSpacing: "0.18em", opacity: 0.7 }}>MIN</span>
                    {/* Laurel ornament on active */}
                    {selected && (
                      <span style={{ fontSize: 8, color: "rgba(200,167,106,0.5)", letterSpacing: "0.1em" }}>
                        ⸗ {p.sub} ⸗
                      </span>
                    )}
                    {!selected && (
                      <span style={{ fontSize: 8, color: "var(--k-muted)", opacity: 0.6, letterSpacing: "0.06em" }}>
                        {p.sub}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PRIMARY ACTION ── */}
        {!running && !done && (
          <div style={{ padding: "16px 16px 0" }}>
            <button
              onClick={startSession}
              style={{
                width: "100%",
                minHeight: 56,
                borderRadius: 28,
                border: "1px solid rgba(200,167,106,0.4)",
                background: "linear-gradient(145deg, rgba(200,167,106,0.08), rgba(200,167,106,0.03))",
                color: "var(--k-soft-gold)",
                fontSize: 13,
                letterSpacing: "0.3em",
                fontWeight: 400,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                boxShadow: "0 0 24px rgba(200,167,106,0.08), inset 0 1px 0 rgba(200,167,106,0.1)",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
              }}
              className="kairos-chamber-btn"
            >
              {/* Light sweep animation */}
              <span className="kairos-chamber-sweep" />
              {/* Temple icon left */}
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="rgba(200,167,106,0.7)" strokeWidth={1.1} strokeLinecap="round">
                <path d="M3 10L12 4L21 10" />
                <path d="M5 10V17M9 10V17M12 10V17M15 10V17M19 10V17" />
                <path d="M3 19H21" />
              </svg>
              ENTER CHAMBER
              {/* Temple icon right */}
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="rgba(200,167,106,0.7)" strokeWidth={1.1} strokeLinecap="round">
                <path d="M3 10L12 4L21 10" />
                <path d="M5 10V17M9 10V17M12 10V17M15 10V17M19 10V17" />
                <path d="M3 19H21" />
              </svg>
            </button>
            <style>{`
              .kairos-chamber-sweep {
                position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(200,167,106,0.08), transparent);
                animation: chamberSweep 3s ease-in-out infinite;
              }
              @keyframes chamberSweep {
                0% { left: -100%; }
                50% { left: 150%; }
                100% { left: 150%; }
              }
              .kairos-chamber-btn:hover {
                border-color: rgba(200,167,106,0.6) !important;
                background: linear-gradient(145deg, rgba(200,167,106,0.14), rgba(200,167,106,0.06)) !important;
                box-shadow: 0 0 32px rgba(200,167,106,0.15), inset 0 1px 0 rgba(200,167,106,0.14) !important;
              }
              .kairos-chamber-btn:active {
                transform: scale(0.98);
              }
            `}</style>
          </div>
        )}

        {/* ── RUNNING: MISSION LABEL ── */}
        {running && mission && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{ textAlign: "center", padding: "0 24px 8px" }}
          >
            <div style={{
              display: "inline-block",
              fontSize: 12,
              fontFamily: "var(--font-sanctuary-display)",
              fontStyle: "italic",
              color: "rgba(200,167,106,0.6)",
              letterSpacing: "0.06em",
              padding: "6px 16px",
              borderRadius: 20,
              border: "1px solid rgba(200,167,106,0.12)",
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(6px)",
            }}>
              "{mission}"
            </div>
          </motion.div>
        )}

        {/* ── END SESSION (while running) ── */}
        {running && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            style={{ padding: "0 16px 16px", display: "flex", gap: 10 }}
          >
            <button
              onClick={stopSession}
              style={{
                flex: 1, minHeight: 48,
                borderRadius: 24,
                border: "1px solid rgba(200,80,80,0.25)",
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(8px)",
                color: "rgba(240,160,160,0.75)",
                fontSize: 11, letterSpacing: "0.28em",
                cursor: "pointer",
              }}
            >
              END SESSION
            </button>
          </motion.div>
        )}

        {/* ── AMBIENT ATMOSPHERE ── */}
        {!running && (
          <div style={{ padding: "24px 16px 0" }}>
            <div style={{ fontSize: 8, letterSpacing: "0.35em", color: "rgba(200,167,106,0.38)", marginBottom: 12, textTransform: "uppercase" }}>
              Ambient Atmosphere
            </div>
            <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
              {TRACKS.map(tr => {
                const on = active.has(tr.id);
                return (
                  <button
                    key={tr.id}
                    onClick={() => toggleTrack(tr.id)}
                    className={on ? "atm-card atm-card--on" : "atm-card"}
                    style={{
                      flexShrink: 0,
                      minWidth: 78,
                      padding: "10px 8px 9px",
                      borderRadius: 8,
                      border: on
                        ? "1px solid rgba(200,167,106,0.55)"
                        : "1px solid rgba(200,167,106,0.13)",
                      background: on
                        ? "linear-gradient(160deg, rgba(200,167,106,0.11) 0%, rgba(160,120,60,0.06) 100%)"
                        : "rgba(8,7,6,0.82)",
                      boxShadow: on
                        ? "0 0 18px rgba(200,167,106,0.12), inset 0 1px 0 rgba(200,167,106,0.1)"
                        : "none",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      transition: "all 0.25s ease",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Icon */}
                    <span style={{
                      fontSize: 15,
                      lineHeight: 1,
                      filter: on ? "drop-shadow(0 0 4px rgba(200,167,106,0.5))" : "none",
                      transition: "filter 0.25s",
                    }}>{tr.icon}</span>
                    {/* Label */}
                    <span style={{
                      fontSize: 7.5,
                      letterSpacing: "0.18em",
                      color: on ? "rgba(220,185,110,0.95)" : "rgba(200,167,106,0.38)",
                      textAlign: "center",
                      lineHeight: 1.3,
                      transition: "color 0.25s",
                      whiteSpace: "nowrap",
                    }}>{tr.label.toUpperCase()}</span>
                    {/* Active shimmer line at top */}
                    {on && (
                      <span style={{
                        position: "absolute", top: 0, left: "15%", right: "15%",
                        height: 1,
                        background: "linear-gradient(to right, transparent, rgba(200,167,106,0.8), transparent)",
                        borderRadius: 1,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
            <style>{`
              .atm-card:hover {
                border-color: rgba(200,167,106,0.28) !important;
                background: rgba(200,167,106,0.04) !important;
              }
              .atm-card--on:hover {
                border-color: rgba(200,167,106,0.7) !important;
                box-shadow: 0 0 24px rgba(200,167,106,0.18), inset 0 1px 0 rgba(200,167,106,0.14) !important;
              }
            `}</style>
          </div>
        )}

        {/* ── THOUGHT VAULT ── */}
        {!running && (
          <div style={{ padding: "20px 16px 0" }}>
            <div style={{ fontSize: 8, letterSpacing: "0.35em", color: "rgba(200,167,106,0.38)", marginBottom: 12 }}>
              THOUGHT VAULT
            </div>
            <button
              onClick={() => setThoughtOpen(true)}
              className="vault-panel"
              style={{
                width: "100%",
                minHeight: 52,
                borderRadius: 8,
                border: "1px solid rgba(200,167,106,0.16)",
                background: "rgba(8,7,5,0.85)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "0 18px",
                textAlign: "left",
                transition: "all 0.25s ease",
                boxShadow: "inset 0 1px 0 rgba(200,167,106,0.05)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Manuscript icon */}
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="rgba(200,167,106,0.5)" strokeWidth={1.2} strokeLinecap="round" style={{ flexShrink: 0 }}>
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                <line x1="8" y1="8" x2="16" y2="8" />
                <line x1="8" y1="12" x2="14" y2="12" />
              </svg>
              <span style={{
                fontFamily: "var(--font-sanctuary-display)",
                fontStyle: "italic",
                fontSize: 13,
                color: "rgba(200,167,106,0.32)",
                letterSpacing: "0.03em",
                fontWeight: 300,
              }}>
                Record wisdom before it fades...
              </span>
              {/* Top engraved line */}
              <span style={{
                position: "absolute", top: 0, left: "10%", right: "10%",
                height: 1,
                background: "linear-gradient(to right, transparent, rgba(200,167,106,0.25), transparent)",
              }} />
            </button>
            <style>{`
              .vault-panel:hover {
                border-color: rgba(200,167,106,0.3) !important;
                background: rgba(200,167,106,0.03) !important;
                box-shadow: 0 0 20px rgba(200,167,106,0.06), inset 0 1px 0 rgba(200,167,106,0.08) !important;
              }
            `}</style>
          </div>
        )}

        {/* ── CHAMBER METRICS (compact inline row) ── */}
        {!running && (
          <div style={{ padding: "22px 16px 28px" }}>
            {/* Thin engraved divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(200,167,106,0.12))" }} />
              <svg width={8} height={8} viewBox="0 0 8 8" fill="none">
                <rect x="3" y="0" width="2" height="2" fill="rgba(200,167,106,0.35)" transform="rotate(45 4 4)" />
              </svg>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(200,167,106,0.12))" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>

              {/* FOCUS STABILITY */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(200,167,106,0.55)" strokeWidth={1.1}>
                  <path d="M12 2l1.4 4.2L18 8l-4.6 1.8L12 14l-1.4-4.2L6 8l4.6-1.8z" />
                  <path d="M19 14.5l.7 2.2L22 18l-2.3.3L19 21l-.7-2.2L16 18l2.3-.3z" />
                </svg>
                <div style={{ width: "100%", height: 1.5, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
                  <motion.div
                    animate={{ width: `${flow}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    style={{
                      position: "absolute", left: 0, top: 0, height: "100%",
                      background: "linear-gradient(to right, rgba(200,167,106,0.4), rgba(220,185,100,0.85))",
                      borderRadius: 2,
                      boxShadow: "0 0 6px rgba(200,167,106,0.4)",
                    }}
                  />
                </div>
                <div style={{ fontSize: 7, letterSpacing: "0.22em", color: "rgba(200,167,106,0.38)", textAlign: "center" }}>FOCUS STABILITY</div>
              </div>

              {/* Separator */}
              <div style={{ width: 1, background: "rgba(200,167,106,0.08)", alignSelf: "stretch", margin: "4px 0" }} />

              {/* MENTAL DEPTH */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(200,167,106,0.55)" strokeWidth={1.1}>
                  <path d="M3 10L12 4L21 10" />
                  <path d="M5 10V17M8 10V17M12 10V17M16 10V17M19 10V17" />
                  <path d="M3 19H21" />
                </svg>
                <div style={{ width: "100%", height: 1.5, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
                  <motion.div
                    animate={{ width: `${depth}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    style={{
                      position: "absolute", left: 0, top: 0, height: "100%",
                      background: "linear-gradient(to right, rgba(200,167,106,0.4), rgba(220,185,100,0.85))",
                      borderRadius: 2,
                      boxShadow: "0 0 6px rgba(200,167,106,0.4)",
                    }}
                  />
                </div>
                <div style={{ fontSize: 7, letterSpacing: "0.22em", color: "rgba(200,167,106,0.38)", textAlign: "center" }}>MENTAL DEPTH</div>
              </div>

              {/* Separator */}
              <div style={{ width: 1, background: "rgba(200,167,106,0.08)", alignSelf: "stretch", margin: "4px 0" }} />

              {/* ENERGY RESERVE */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(200,167,106,0.55)" strokeWidth={1.1}>
                  <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
                </svg>
                <div style={{ width: "100%", height: 1.5, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
                  <motion.div
                    animate={{ width: `${reserve}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    style={{
                      position: "absolute", left: 0, top: 0, height: "100%",
                      background: "linear-gradient(to right, rgba(200,167,106,0.4), rgba(220,185,100,0.85))",
                      borderRadius: 2,
                      boxShadow: "0 0 6px rgba(200,167,106,0.4)",
                    }}
                  />
                </div>
                <div style={{ fontSize: 7, letterSpacing: "0.22em", color: "rgba(200,167,106,0.38)", textAlign: "center" }}>ENERGY RESERVE</div>
              </div>

            </div>
          </div>
        )}

      </div>{/* /main scroll */}

      {/* ── THOUGHT MODAL ── */}
      <AnimatePresence>
        {thoughtOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(5,5,5,0.85)", backdropFilter: "blur(12px)", zIndex: 60, display: "grid", placeItems: "center", padding: 20 }}
            onClick={() => setThoughtOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 380, padding: 20, borderRadius: 16, background: "rgba(10,10,10,0.97)", border: "1px solid rgba(200,167,106,0.2)", boxShadow: "0 0 40px rgba(200,167,106,0.08)" }}
            >
              {/* Ornamental header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(200,167,106,0.6)" strokeWidth={1.3} strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(200,167,106,0.6)" }}>THOUGHT VAULT</div>
              </div>
              <textarea
                autoFocus
                value={thoughtDraft}
                onChange={e => setThoughtDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && e.metaKey) captureThought(); }}
                placeholder="Record wisdom before it fades..."
                rows={4}
                style={{
                  width: "100%", padding: "12px",
                  borderRadius: 10, border: "1px solid rgba(200,167,106,0.15)",
                  background: "rgba(20,15,10,0.8)", color: "var(--k-marble)",
                  fontFamily: "var(--font-sanctuary-display)", fontSize: 15,
                  lineHeight: 1.6, resize: "none", outline: "none",
                  letterSpacing: "0.02em",
                }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={() => setThoughtOpen(false)} style={{ flex: 1, minHeight: 44, borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "var(--k-muted)", fontSize: 11, letterSpacing: "0.16em", cursor: "pointer" }}>DISMISS</button>
                <button onClick={captureThought} style={{ flex: 1, minHeight: 44, borderRadius: 10, border: "1px solid rgba(200,167,106,0.35)", background: "rgba(200,167,106,0.08)", color: "var(--k-soft-gold)", fontSize: 11, letterSpacing: "0.16em", cursor: "pointer" }}>INSCRIBE</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COMPLETION SCREEN ── */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(5,5,5,0.92)", backdropFilter: "blur(24px)", zIndex: 70, display: "grid", placeItems: "center", padding: 24 }}
          >
            <div style={{ textAlign: "center", maxWidth: 340 }}>
              {/* Gold ornament */}
              <div style={{ fontSize: 32, marginBottom: 16, opacity: 0.6 }}>𓂀</div>
              <div style={{ fontSize: 9, letterSpacing: "0.4em", color: "rgba(200,167,106,0.7)" }}>SESSION COMPLETE</div>
              <h2 style={{ fontFamily: "var(--font-sanctuary-display)", fontWeight: 300, fontSize: 40, margin: "16px 0 8px", color: "var(--k-marble)" }}>
                You emerged.
              </h2>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ height: 1, width: 40, background: "linear-gradient(to right, transparent, rgba(200,167,106,0.4))" }} />
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="rgba(200,167,106,0.5)" strokeWidth={1.2}><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z" /></svg>
                <div style={{ height: 1, width: 40, background: "linear-gradient(to left, transparent, rgba(200,167,106,0.4))" }} />
              </div>
              <p style={{ fontSize: 13, color: "var(--k-muted)", margin: 0, lineHeight: 1.6 }}>
                {Math.round(elapsed / 60000)} minutes in the chamber.
                {mission ? <><br /><em style={{ color: "rgba(200,167,106,0.55)" }}>"{mission}"</em></> : ""}
              </p>
              <p style={{ fontSize: 11, color: "rgba(200,167,106,0.4)", marginTop: 12, letterSpacing: "0.08em" }}>
                STABILITY {flow}% · DEPTH {depth}% · RESERVE {reserve}%<br />
                {thoughts.length} inscription{thoughts.length === 1 ? "" : "s"} recorded
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 28, justifyContent: "center" }}>
                <button onClick={resetSession} style={{ flex: 1, minHeight: 48, borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "var(--k-muted)", fontSize: 11, letterSpacing: "0.2em", cursor: "pointer" }}>RESET</button>
                <Link to="/" style={{ flex: 1, minHeight: 48, borderRadius: 12, border: "1px solid rgba(200,167,106,0.35)", background: "rgba(200,167,106,0.08)", color: "var(--k-soft-gold)", fontSize: 11, letterSpacing: "0.2em", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>DASHBOARD</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!running && !done && <BottomNav />}
    </div>
  );
}

// ─── CHAMBER TIMER ─────────────────────────────────────────────────────────────

function ChamberTimer({
  progress, mm, ss, stageName, chamberLabel, running,
}: {
  progress: number; mm: number; ss: number;
  stageName: string; chamberLabel: string; running: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const SIZE = 260;
  const CX = SIZE / 2;
  const C = 2 * Math.PI;

  // Animated particles orbiting the ring
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr; canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const ORBS = 4;
    let raf = 0;
    const t0 = performance.now();

    const draw = () => {
      const t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, SIZE, SIZE);

      // Outer orbital ring
      const outerR = SIZE / 2 - 8;
      ctx.strokeStyle = `rgba(200,167,106,${0.12 + progress * 0.08})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.arc(CX, CX, outerR, 0, C); ctx.stroke();

      // Second orbital ring
      const midR = SIZE / 2 - 22;
      ctx.strokeStyle = `rgba(200,167,106,0.06)`;
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.arc(CX, CX, midR, 0, C); ctx.stroke();

      // Inner decorative rings
      [SIZE / 2 - 36, SIZE / 2 - 52].forEach((r, i) => {
        ctx.strokeStyle = `rgba(200,167,106,${0.04 - i * 0.01})`;
        ctx.lineWidth = 0.4;
        ctx.beginPath(); ctx.arc(CX, CX, r, 0, C); ctx.stroke();
      });

      // Progress arc (main gold ring)
      const pR = SIZE / 2 - 14;
      const pC = 2 * Math.PI * pR;
      ctx.strokeStyle = "rgba(200,167,106,0.18)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(CX, CX, pR, 0, C); ctx.stroke();

      // Glowing progress
      ctx.strokeStyle = "rgba(220,185,100,0.9)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(200,167,106,0.8)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(CX, CX, pR, -Math.PI / 2, -Math.PI / 2 + C * progress);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Tick marks on outer ring (12 marks like a clock)
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * C - Math.PI / 2;
        const r1 = outerR - 3, r2 = outerR + 3;
        const x1 = CX + Math.cos(angle) * r1;
        const y1 = CX + Math.sin(angle) * r1;
        const x2 = CX + Math.cos(angle) * r2;
        const y2 = CX + Math.sin(angle) * r2;
        ctx.strokeStyle = "rgba(200,167,106,0.35)";
        ctx.lineWidth = i % 3 === 0 ? 1.5 : 0.6;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }

      // Orbiting gold particles
      for (let i = 0; i < ORBS; i++) {
        const angle = t * 0.25 + (i / ORBS) * C;
        const orbitR = outerR - 1;
        const px = CX + Math.cos(angle) * orbitR;
        const py = CX + Math.sin(angle) * orbitR;
        const glow = 0.5 + Math.sin(t * 2 + i) * 0.3;
        ctx.fillStyle = `rgba(220,185,100,${glow * 0.9})`;
        ctx.shadowColor = "rgba(200,167,106,1)";
        ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, C); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Slower secondary particle set
      for (let i = 0; i < 2; i++) {
        const angle = -t * 0.15 + (i / 2) * C + 0.8;
        const orbitR = midR;
        const px = CX + Math.cos(angle) * orbitR;
        const py = CX + Math.sin(angle) * orbitR;
        ctx.fillStyle = `rgba(200,167,106,0.5)`;
        ctx.beginPath(); ctx.arc(px, py, 1.5, 0, C); ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  return (
    <div style={{ position: "relative", width: SIZE, height: SIZE }}>
      {/* Animated canvas rings + particles */}
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        style={{ position: "absolute", inset: 0, width: SIZE, height: SIZE }}
      />

      {/* Inner glow disk */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: SIZE - 60,
        height: SIZE - 60,
        borderRadius: "50%",
        background: "radial-gradient(ellipse at 40% 35%, rgba(30,20,8,0.95), rgba(8,6,4,0.98))",
        boxShadow: `
          inset 0 0 40px rgba(0,0,0,0.8),
          0 0 ${20 + progress * 40}px rgba(200,167,106,${0.12 + progress * 0.2}),
          0 0 ${60 + progress * 80}px rgba(160,120,50,${0.05 + progress * 0.1})
        `,
        border: "1px solid rgba(200,167,106,0.08)",
      }} />

      {/* Timer digits */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 2,
      }}>
        <div style={{
          fontFamily: "var(--font-sanctuary-display)",
          fontWeight: 300,
          fontSize: 58,
          color: "var(--k-marble)",
          letterSpacing: "0.04em",
          lineHeight: 1,
          textShadow: "0 0 20px rgba(200,167,106,0.2)",
        }}>
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </div>
        <div style={{ fontSize: 9, letterSpacing: "0.28em", color: "rgba(200,167,106,0.55)", marginTop: 6 }}>
          {chamberLabel} CHAMBER
        </div>
        {/* Laurel ornament */}
        <div style={{ fontSize: 12, color: "rgba(200,167,106,0.3)", marginTop: 2, letterSpacing: "0.2em" }}>
          ꙮ
        </div>
        {running && (
          <div style={{ fontSize: 8, letterSpacing: "0.2em", color: "rgba(200,167,106,0.35)", marginTop: 4 }}>
            {stageName.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FOCUS METRIC CARD (kept for backwards compat but no longer rendered) ──────

// Backwards-compat export kept for any old imports
export function Placeholder({ label, title, sub }: { label: string; title: string; sub: string }) {
  return (
    <main style={{ minHeight: "100vh", background: "#050505", color: "rgba(210,225,240,0.92)", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "rgba(200,167,106,0.6)" }}>{label}</div>
        <h1 style={{ fontFamily: "var(--font-sanctuary-display)", fontWeight: 300, fontSize: 40, margin: "12px 0" }}>{title}</h1>
        <p style={{ fontSize: 13, color: "var(--k-muted)" }}>{sub}</p>
        <Link to="/" style={{ marginTop: 16, display: "inline-block", fontSize: 11, letterSpacing: "0.2em", color: "rgba(200,167,106,0.7)" }}>← DASHBOARD</Link>
      </div>
    </main>
  );
}
