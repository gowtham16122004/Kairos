import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AudioEngine, speak, cancelSpeech, type TrackId } from "@/lib/audio-engine";
import { BottomNav } from "@/components/mobile/BottomNav";
import sanctuaryImg from "@/assets/recovery scantuary.png";
import enterSanctuaryImg from "@/assets/enter recovery sanctuary.png";

export const Route = createFileRoute("/recovery")({
  component: RecoveryPage,
  head: () => ({
    meta: [
      { title: "Recovery Sanctuary — Kairos" },
      { name: "description", content: "Enter the sanctuary. A sacred space for stillness, restoration and deep recovery." },
    ],
  }),
});

// ─── DATA ──────────────────────────────────────────────────────────────────────

type Phase = { name: "Inhale" | "Hold" | "Exhale" | "Rest"; seconds: number };
type Protocol = { id: string; name: string; description: string; icon: React.ReactNode; phases: Phase[] };

const PROTOCOLS: Protocol[] = [
  { id: "478",      name: "4-7-8 Recovery",      description: "Deep nervous system calm.",             
    icon: <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 21Q10 14 21 3"/><path d="M12 12Q8 8 10 5"/><path d="M16 10Q13 5 18 4"/><path d="M9 15Q5 13 4 17"/></svg>, 
    phases: [{name:"Inhale",seconds:4},{name:"Hold",seconds:7},{name:"Exhale",seconds:8}] 
  },
  { id: "box",      name: "Box Breathing",        description: "Even, steady, contained.",              
    icon: <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 10L12 4L21 10"/><path d="M5 10V20M9 10V20M15 10V20M19 10V20"/><path d="M3 20H21"/></svg>, 
    phases: [{name:"Inhale",seconds:4},{name:"Hold",seconds:4},{name:"Exhale",seconds:4},{name:"Rest",seconds:4}] 
  },
  { id: "coherent", name: "Resonant Coherence",   description: "5.5 breaths per minute.",              
    icon: <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12c4-4 8-4 18 0"/><path d="M3 17c4-4 8-4 18 0"/><path d="M3 7c4-4 8-4 18 0"/></svg>, 
    phases: [{name:"Inhale",seconds:5},{name:"Exhale",seconds:5}] 
  },
  { id: "deep",     name: "Deep Recovery",        description: "Long exhale for parasympathetic activation.", 
    icon: <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M3 15c4-2 8-2 18 0"/><path d="M3 19c4-2 8-2 18 0"/></svg>, 
    phases: [{name:"Inhale",seconds:4},{name:"Hold",seconds:2},{name:"Exhale",seconds:10}] 
  },
  { id: "sigh",     name: "Cleansing Sigh",       description: "Double inhale, long exhale.",          
    icon: <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h12a2 2 0 000-4h-4"/><path d="M4 17h8a2 2 0 010 4h-2"/><path d="M4 7h6"/></svg>, 
    phases: [{name:"Inhale",seconds:3},{name:"Inhale",seconds:1},{name:"Exhale",seconds:8}] 
  },
];

const SANCTUARY_TRACKS: { id: TrackId; label: string; icon: React.ReactNode }[] = [
  { id: "rain",      label: "Temple Rain",         icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round"><path d="M3 10L12 4L21 10M7 10V16M17 10V16M5 20L5 22M12 20L12 22M19 20L19 22"/></svg> },
  { id: "ocean",     label: "Moonlit Ocean",        icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round"><path d="M9 5a6 6 0 108 8M3 16c4-2 8-2 18 0M3 20c4-2 8-2 18 0"/></svg> },
  { id: "forest",    label: "Sacred Forest",        icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round"><path d="M12 2L6 10H9L4 18H20L15 10H18L12 2Z"/></svg> },
  { id: "night",     label: "Mediterranean Night",  icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round"><path d="M12 3a9 9 0 100 18 9 9 0 000-18zM12 3v18M12 12h9M3 12h9"/></svg> },
  { id: "focus",     label: "Olive Grove",          icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round"><path d="M12 4C8 4 4 8 4 12c0 4 8 8 8 8s8-4 8-8c0-4-4-8-8-8zM12 4v16"/></svg> },
  { id: "neural40hz",label: "Ancient Resonance",    icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg> },
  { id: "deepspace", label: "Monastery Silence",    icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round"><path d="M8 8V4h8v4M4 12h16v8H4zM12 12v8"/></svg> },
];

type Tool = { id: string; name: string; intro: string; steps: string[] };
const TOOLS: Tool[] = [
  { id: "breath", name: "Breathwork",
    intro: "Let the breath lead the body.",
    steps: ["Soften the jaw.", "Drop the shoulders.", "Follow the breath. Inhale. Hold. Exhale.", "You are returning to yourself."] },
  { id: "med",    name: "Meditation",
    intro: "A quiet sitting practice.",
    steps: ["Close your eyes.", "Notice the weight of your body.", "Notice the sound furthest from you.", "Return to the breath whenever you drift."] },
  { id: "sleep",  name: "Sleep Preparation",
    intro: "Slowing the system for rest.",
    steps: ["Dim every light around you.", "Lengthen each exhale.", "Release the day. It is finished.", "Sleep is coming. Welcome it."] },
  { id: "scan",   name: "Body Scan",
    intro: "Attention through every region.",
    steps: ["Begin at the crown of the head.", "Move slowly down the face.", "Through the shoulders, arms, and hands.", "Through the chest, belly, hips, legs.", "Down to the feet. Rest there."] },
  { id: "grat",   name: "Gratitude",
    intro: "Three things, slowly named.",
    steps: ["Name something small you noticed today.", "Name a person who supported you.", "Name something your body did for you.", "Hold each one before moving on."] },
];

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

function RecoveryPage() {
  const canvasRef  = useRef<HTMLCanvasElement | null>(null);
  const runningCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [protocolId, setProtocolId] = useState("478");
  const protocol = useMemo(() => PROTOCOLS.find(p => p.id === protocolId)!, [protocolId]);

  const [running, setRunning]           = useState(false);
  const [phaseIdx, setPhaseIdx]         = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [cycles, setCycles]             = useState(0);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [activeTracks, setActiveTracks] = useState<Set<TrackId>>(new Set());
  const [activeTool, setActiveTool]     = useState<Tool | null>(null);
  const [toolStep, setToolStep]         = useState(0);
  const [now, setNow]                   = useState(() => new Date());

  const engineRef          = useRef<AudioEngine | null>(null);
  const rafRef             = useRef<number | null>(null);
  const phaseStartRef      = useRef<number>(0);
  const lastSpokenPhaseRef = useRef<number>(-1);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Audio engine
  useEffect(() => {
    engineRef.current = new AudioEngine();
    return () => { engineRef.current?.stopAll(); engineRef.current = null; cancelSpeech(); };
  }, []);

  const toggleTrack = (id: TrackId) => {
    engineRef.current?.toggle(id);
    setActiveTracks(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // Breathing loop
  useEffect(() => {
    if (!running) return;
    phaseStartRef.current = performance.now();
    lastSpokenPhaseRef.current = -1;
    const loop = () => {
      const phase = protocol.phases[phaseIdx];
      const el = (performance.now() - phaseStartRef.current) / 1000;
      setPhaseElapsed(el);
      if (lastSpokenPhaseRef.current !== phaseIdx) {
        speak(phase.name, { rate: 0.7, volume: 0.55 });
        lastSpokenPhaseRef.current = phaseIdx;
      }
      if (el >= phase.seconds) {
        const next = (phaseIdx + 1) % protocol.phases.length;
        if (next === 0) setCycles(c => c + 1);
        phaseStartRef.current = performance.now();
        setPhaseIdx(next);
        setPhaseElapsed(0);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running, phaseIdx, protocol]);

  const startSession = () => {
    setRunning(true); setPhaseIdx(0); setPhaseElapsed(0); setCycles(0);
    setSessionStart(Date.now());
  };
  const stopSession = () => {
    setRunning(false); cancelSpeech();
    if (sessionStart) {
      try {
        const log = JSON.parse(localStorage.getItem("rec_log") ?? "[]");
        const duration = Math.round((Date.now() - sessionStart) / 1000);
        const coherence = Math.min(100, Math.round((cycles / 10) * 100));
        log.push({ t: sessionStart, duration, cycles, protocol: protocol.name, coherence });
        localStorage.setItem("rec_log", JSON.stringify(log.slice(-30)));
      } catch {}
    }
  };

  // Canvas — gold particles only
  useEffect(() => {
    const canvas = running ? runningCanvasRef.current : canvasRef.current; 
    if (!canvas) return;
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

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random(), y: Math.random(),
      r: 0.3 + Math.random() * 1.2,
      vx: (Math.random() - 0.5) * 0.04,
      vy: -0.03 - Math.random() * 0.08,
      phase: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    const t0 = performance.now();
    const draw = () => {
      const t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, W, H);

      // Soft moonlight shimmer
      const moonG = ctx.createRadialGradient(W * 0.5, H * 0.2, 0, W * 0.5, H * 0.2, H * 0.6);
      moonG.addColorStop(0, `rgba(210,200,170,${0.04 + Math.sin(t * 0.2) * 0.01})`);
      moonG.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = moonG; ctx.fillRect(0, 0, W, H);

      // Floating gold dust
      particles.forEach(p => {
        p.x += p.vx / W * 0.5; p.y += p.vy / H * 0.5; p.phase += 0.015;
        if (p.y < -0.02) p.y = 1.02;
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02)  p.x = -0.02;
        const glow = 0.35 + Math.sin(p.phase) * 0.35;
        ctx.globalAlpha = glow * 0.7;
        ctx.fillStyle = `rgba(215,185,95,1)`;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [running]);

  // Derived
  const currentPhase = protocol.phases[phaseIdx];
  const phaseProgress = Math.min(1, phaseElapsed / currentPhase.seconds);
  const orbScale = currentPhase.name === "Inhale"
    ? 0.6 + phaseProgress * 0.5
    : currentPhase.name === "Exhale"
      ? 1.1 - phaseProgress * 0.5
      : currentPhase.name === "Hold" ? 1.1 : 0.6;

  const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ─── ACTIVE SESSION VIEW ───────────────────────────────────────────────────
  if (running) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#040508", color: "rgba(230,220,200,0.92)", overflow: "hidden", fontFamily: "var(--font-sanctuary-ui)" }}>
        {/* Sanctuary background image (Active Session) */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `url(${enterSanctuaryImg})`,
          backgroundSize: "cover", 
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }} />

        {/* Dark overlay & Vignette */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "linear-gradient(to bottom, rgba(4,5,8,0.2) 0%, rgba(4,5,8,0.5) 70%, rgba(4,5,8,0.85) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.5) 100%)" }} />

        {/* Canvas particles */}
        <canvas ref={runningCanvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", zIndex: 1, pointerEvents: "none" }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "center", padding: "0 20px" }}>

          {/* Phase name */}
          <div style={{ fontSize: 11, letterSpacing: "0.4em", color: "rgba(200,167,106,0.7)", marginBottom: 24, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
            {currentPhase.name.toUpperCase()} · CYCLE {cycles + 1}
          </div>

          {/* Breathing orb */}
          <motion.div
            animate={{ scale: orbScale }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            style={{
              width: 220, height: 220, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, rgba(210,185,120,0.25), rgba(160,120,60,0.1) 50%, transparent 100%)",
              boxShadow: "0 0 60px rgba(200,167,106,0.15), inset 0 0 40px rgba(210,185,120,0.1)",
              border: "1px solid rgba(200,167,106,0.15)",
              display: "grid", placeItems: "center",
              backdropFilter: "blur(4px)",
            }}
          >
            <div style={{ fontFamily: "var(--font-sanctuary-display)", fontWeight: 300, fontSize: 26, letterSpacing: "0.1em", color: "rgba(220,200,160,0.95)", textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
              {currentPhase.name}
            </div>
          </motion.div>

          {/* Progress arc label */}
          <div style={{ marginTop: 36, fontSize: 14, color: "rgba(200,167,106,0.6)", letterSpacing: "0.08em", fontFamily: "var(--font-sanctuary-display)", fontStyle: "italic", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            {protocol.name}
          </div>

          {/* Phase timer bar */}
          <div style={{ marginTop: 24, width: 220, height: 2, background: "rgba(200,167,106,0.1)", borderRadius: 2, overflow: "hidden", boxShadow: "0 0 10px rgba(0,0,0,0.5)" }}>
            <motion.div
              animate={{ width: `${phaseProgress * 100}%` }}
              transition={{ duration: 0.1 }}
              style={{ height: "100%", background: "linear-gradient(to right, rgba(200,167,106,0.4), rgba(220,185,100,0.85))", borderRadius: 2 }}
            />
          </div>

          {/* End button */}
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            onClick={stopSession}
            style={{
              marginTop: 54, padding: "14px 36px",
              borderRadius: 30,
              border: "1px solid rgba(200,167,106,0.25)",
              background: "rgba(10,8,5,0.6)",
              backdropFilter: "blur(12px)",
              color: "rgba(200,167,106,0.8)",
              fontSize: 10, letterSpacing: "0.3em",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}
          >
            LEAVE SANCTUARY
          </motion.button>
        </div>
      </div>
    );
  }

  // ─── LANDING VIEW ──────────────────────────────────────────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, background: "#040508", color: "rgba(230,220,200,0.92)", overflow: "hidden", fontFamily: "var(--font-sanctuary-ui)" }}>

      {/* Canvas particles — zIndex 2, floats above image */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", zIndex: 2, pointerEvents: "none" }} />

      {/* Scrollable body */}
      <div style={{ position: "relative", zIndex: 5, height: "100%", overflowY: "auto", paddingBottom: 80 }}>

        {/* ── HERO SECTION with sanctuary image ── */}
        <div style={{ position: "relative", width: "100%", height: 340, overflow: "hidden", flexShrink: 0 }}>

          {/* Sanctuary background image */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${sanctuaryImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
            backgroundRepeat: "no-repeat",
          }} />

          {/* Gradient overlays */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(4,5,8,0.55) 0%, rgba(4,5,8,0.15) 40%, rgba(4,5,8,0.6) 75%, rgba(4,5,8,1) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 25%, rgba(4,5,8,0.5) 80%)" }} />

          {/* ── HEADER (inside hero) ── */}
          <header style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 0" }}>
            {/* Left: back + temple */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link to="/" style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(200,167,106,0.18)", background: "rgba(200,167,106,0.06)", color: "rgba(200,167,106,0.8)", textDecoration: "none", fontSize: 16 }}>
                ‹
              </Link>
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="rgba(200,167,106,0.65)" strokeWidth={1.1} strokeLinecap="round">
                <path d="M3 10L12 4L21 10" />
                <path d="M5 10V18M8 10V18M12 10V18M16 10V18M19 10V18" />
                <path d="M3 20H21" />
              </svg>
            </div>

            {/* Center */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-sanctuary-display)", fontSize: 28, fontWeight: 400, letterSpacing: "0.06em", color: "rgba(230,220,200,0.95)", lineHeight: 1 }}>
                {timeString}
              </div>
              <div style={{ fontSize: 8, letterSpacing: "0.35em", color: "rgba(200,167,106,0.5)", marginTop: 3 }}>
                RECOVERY SANCTUARY
              </div>
            </div>

            {/* Right: olive branch icon */}
            <svg width={36} height={36} viewBox="0 0 36 36" fill="none">
              <circle cx={18} cy={18} r={17} stroke="rgba(200,167,106,0.18)" strokeWidth={1} />
              <g stroke="rgba(200,167,106,0.65)" strokeWidth={1} strokeLinecap="round">
                <path d="M18 28 Q14 22 14 16 Q14 10 18 8" fill="none" />
                <path d="M14 16 Q11 13 12 10" fill="none" />
                <path d="M15 19 Q12 17 12 14" fill="none" />
                <path d="M16 22 Q13 21 13 18" fill="none" />
                <ellipse cx={12} cy={10} rx={2.5} ry={1.5} fill="rgba(200,167,106,0.4)" transform="rotate(-30 12 10)" />
                <ellipse cx={12} cy={14} rx={2.5} ry={1.5} fill="rgba(200,167,106,0.4)" transform="rotate(-20 12 14)" />
                <ellipse cx={13} cy={18} rx={2.5} ry={1.5} fill="rgba(200,167,106,0.4)" transform="rotate(-15 13 18)" />
              </g>
            </svg>
          </header>

          {/* ── HERO TITLE ── */}
          <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center", padding: "0 24px" }}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <div style={{ fontSize: 9, letterSpacing: "0.5em", color: "rgba(200,167,106,0.55)", marginBottom: 4 }}>
                RECOVERY
              </div>
              <div style={{ fontFamily: "var(--font-sanctuary-display)", fontSize: 48, fontWeight: 400, letterSpacing: "0.12em", color: "rgba(230,222,205,0.98)", lineHeight: 1, textShadow: "0 2px 30px rgba(0,0,0,0.6)" }}>
                SANCTUARY
              </div>
              {/* Laurel ornament */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "8px 0 6px" }}>
                <div style={{ height: 1, width: 32, background: "linear-gradient(to right, transparent, rgba(200,167,106,0.45))" }} />
                <svg width={14} height={10} viewBox="0 0 20 12" fill="none">
                  <path d="M2 6 Q5 2 10 6 Q15 2 18 6" stroke="rgba(200,167,106,0.7)" strokeWidth={1} fill="none" />
                  <path d="M2 6 Q5 10 10 6 Q15 10 18 6" stroke="rgba(200,167,106,0.7)" strokeWidth={1} fill="none" />
                </svg>
                <div style={{ height: 1, width: 32, background: "linear-gradient(to left, transparent, rgba(200,167,106,0.45))" }} />
              </div>
              <div style={{ fontFamily: "var(--font-sanctuary-display)", fontStyle: "italic", fontSize: 14, color: "rgba(200,185,155,0.65)", letterSpacing: "0.04em" }}>
                The mind returns to stillness.
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── QUOTE PANEL ── */}
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{
            position: "relative",
            borderRadius: 30,
            border: "1px solid rgba(200,167,106,0.22)",
            background: "linear-gradient(135deg, rgba(20,16,10,0.9), rgba(12,10,6,0.95))",
            padding: "14px 20px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            boxShadow: "0 0 30px rgba(200,167,106,0.06), inset 0 1px 0 rgba(200,167,106,0.08)",
          }}>
            {/* Laurel left */}
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
              <path d="M16 10 Q12 5 8 10 Q12 15 16 10Z" fill="rgba(200,167,106,0.25)" />
              <path d="M12 7 Q8 3 5 8 Q8 13 12 7Z"     fill="rgba(200,167,106,0.2)" />
              <path d="M12 13 Q8 17 5 12 Q8 7 12 13Z"  fill="rgba(200,167,106,0.2)" />
            </svg>
            <div style={{ fontFamily: "var(--font-sanctuary-display)", fontStyle: "italic", fontSize: 14, color: "rgba(210,190,155,0.8)", textAlign: "center", letterSpacing: "0.03em", lineHeight: 1.5 }}>
              "Silence is a source of great strength."
            </div>
            {/* Laurel right */}
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, transform: "scaleX(-1)" }}>
              <path d="M16 10 Q12 5 8 10 Q12 15 16 10Z" fill="rgba(200,167,106,0.25)" />
              <path d="M12 7 Q8 3 5 8 Q8 13 12 7Z"     fill="rgba(200,167,106,0.2)" />
              <path d="M12 13 Q8 17 5 12 Q8 7 12 13Z"  fill="rgba(200,167,106,0.2)" />
            </svg>
          </div>
        </div>

        {/* ── ENTER SANCTUARY BUTTON ── */}
        <div style={{ padding: "12px 16px 0" }}>
          <button
            onClick={startSession}
            className="sanctuary-cta"
            style={{
              width: "100%", minHeight: 64,
              borderRadius: 32,
              border: "1px solid rgba(200,167,106,0.38)",
              background: "linear-gradient(145deg, rgba(28,22,12,0.98), rgba(18,14,8,0.98))",
              color: "rgba(220,200,160,0.95)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
              position: "relative", overflow: "hidden",
              boxShadow: "0 0 32px rgba(200,167,106,0.1), inset 0 1px 0 rgba(200,167,106,0.12)",
              transition: "all 0.3s ease",
            }}
          >
            <span className="sanctuary-sweep" />
            {/* Temple icon */}
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              border: "1px solid rgba(200,167,106,0.25)",
              background: "rgba(200,167,106,0.08)",
              display: "grid", placeItems: "center", flexShrink: 0,
            }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="rgba(200,167,106,0.75)" strokeWidth={1.2} strokeLinecap="round">
                <path d="M3 10L12 4L21 10" />
                <path d="M5 10V17M9 10V17M12 10V17M15 10V17M19 10V17" />
                <path d="M3 19H21" />
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, letterSpacing: "0.28em", fontWeight: 400 }}>ENTER SANCTUARY</div>
              <div style={{ fontSize: 11, color: "rgba(200,167,106,0.45)", letterSpacing: "0.06em", marginTop: 2, fontStyle: "italic", fontFamily: "var(--font-sanctuary-display)" }}>Leave the noise behind.</div>
            </div>
          </button>
          <style>{`
            .sanctuary-sweep {
              position: absolute; top: 0; left: -100%; width: 55%; height: 100%;
              background: linear-gradient(90deg, transparent, rgba(200,167,106,0.07), transparent);
              animation: sanctuarySweep 3.5s ease-in-out infinite;
            }
            @keyframes sanctuarySweep {
              0% { left: -100%; } 55% { left: 160%; } 100% { left: 160%; }
            }
            .sanctuary-cta:hover {
              border-color: rgba(200,167,106,0.55) !important;
              box-shadow: 0 0 44px rgba(200,167,106,0.18), inset 0 1px 0 rgba(200,167,106,0.16) !important;
            }
            .sanctuary-cta:active { transform: scale(0.985); }
          `}</style>
        </div>

        {/* ── RESTORATION RITUALS ── */}
        <div style={{ padding: "32px 16px 0" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.35em", color: "rgba(200,167,106,0.5)", marginBottom: 16, fontWeight: 500 }}>
            RESTORATION RITUALS
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
            {PROTOCOLS.map(p => {
              const on = p.id === protocolId;
              return (
                <button
                  key={p.id}
                  onClick={() => { setProtocolId(p.id); setPhaseIdx(0); setPhaseElapsed(0); }}
                  className={on ? "ritual-card ritual-card--on" : "ritual-card"}
                  style={{
                    flexShrink: 0,
                    width: 124,
                    padding: "16px 12px",
                    borderRadius: 12,
                    border: on ? "1px solid rgba(200,167,106,0.6)" : "1px solid rgba(200,167,106,0.15)",
                    background: on
                      ? "linear-gradient(160deg, rgba(20,16,10,0.9) 0%, rgba(12,10,6,0.95) 100%)"
                      : "rgba(8,7,5,0.75)",
                    boxShadow: on ? "0 0 24px rgba(200,167,106,0.15), inset 0 1px 0 rgba(200,167,106,0.2)" : "inset 0 1px 0 rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                    transition: "all 0.3s ease",
                    position: "relative", overflow: "hidden",
                    textAlign: "center",
                  }}
                >
                  {on && (
                    <span style={{
                      position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
                      background: "linear-gradient(to right, transparent, rgba(200,167,106,0.8), transparent)",
                    }} />
                  )}
                  <div style={{ 
                    color: on ? "rgba(220,185,110,1)" : "rgba(200,167,106,0.5)",
                    filter: on ? "drop-shadow(0 0 6px rgba(200,167,106,0.5))" : "none", 
                    transition: "all 0.3s" 
                  }}>
                    {p.icon}
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-sanctuary-display)", fontSize: 13, letterSpacing: "0.06em", color: on ? "rgba(220,185,110,0.95)" : "rgba(200,167,106,0.6)", lineHeight: 1.3, transition: "color 0.3s", marginBottom: 6 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(200,167,106,0.35)", lineHeight: 1.4, letterSpacing: "0.04em" }}>
                      {p.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <style>{`
            .ritual-card:hover { border-color: rgba(200,167,106,0.35) !important; background: rgba(12,10,8,0.85) !important; }
            .ritual-card--on:hover { border-color: rgba(200,167,106,0.8) !important; box-shadow: 0 0 30px rgba(200,167,106,0.2), inset 0 1px 0 rgba(200,167,106,0.25) !important; }
          `}</style>
        </div>

        {/* ── SANCTUARY ATMOSPHERES ── */}
        <div style={{ padding: "32px 16px 0" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.35em", color: "rgba(200,167,106,0.5)", marginBottom: 16, fontWeight: 500 }}>
            SANCTUARY ATMOSPHERES
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
            {SANCTUARY_TRACKS.map(tr => {
              const on = activeTracks.has(tr.id);
              return (
                <button
                  key={tr.id}
                  onClick={() => toggleTrack(tr.id)}
                  className={on ? "atm-card atm-card--on" : "atm-card"}
                  style={{
                    flexShrink: 0,
                    minWidth: 84,
                    padding: "14px 8px 12px",
                    borderRadius: 10,
                    border: on ? "1px solid rgba(200,167,106,0.6)" : "1px solid rgba(200,167,106,0.15)",
                    background: on
                      ? "linear-gradient(160deg, rgba(20,16,10,0.9) 0%, rgba(12,10,6,0.95) 100%)"
                      : "rgba(8,7,5,0.75)",
                    boxShadow: on ? "0 0 20px rgba(200,167,106,0.15), inset 0 1px 0 rgba(200,167,106,0.2)" : "inset 0 1px 0 rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    transition: "all 0.3s ease",
                    position: "relative", overflow: "hidden",
                  }}
                >
                  {on && (
                    <span style={{
                      position: "absolute", top: 0, left: "15%", right: "15%", height: 1,
                      background: "linear-gradient(to right, transparent, rgba(200,167,106,0.8), transparent)",
                    }} />
                  )}
                  <div style={{ 
                    color: on ? "rgba(220,185,110,1)" : "rgba(200,167,106,0.5)",
                    filter: on ? "drop-shadow(0 0 6px rgba(200,167,106,0.5))" : "none", 
                    transition: "all 0.3s" 
                  }}>
                    {tr.icon}
                  </div>
                  <div style={{ fontFamily: "var(--font-sanctuary-display)", fontSize: 10, letterSpacing: "0.08em", color: on ? "rgba(220,185,110,0.95)" : "rgba(200,167,106,0.45)", textAlign: "center", lineHeight: 1.3, transition: "color 0.3s", whiteSpace: "nowrap" }}>
                    {tr.label}
                  </div>
                </button>
              );
            })}
          </div>
          <style>{`
            .atm-card:hover { border-color: rgba(200,167,106,0.35) !important; background: rgba(12,10,8,0.85) !important; }
            .atm-card--on:hover { border-color: rgba(200,167,106,0.8) !important; box-shadow: 0 0 24px rgba(200,167,106,0.2), inset 0 1px 0 rgba(200,167,106,0.25) !important; }
          `}</style>
        </div>

        {/* Spacer for bottom nav */}
        <div style={{ height: 32 }} />

      </div>{/* /scroll */}

      {/* ── TOOL MODAL ── */}
      <AnimatePresence>
        {activeTool && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(4,5,8,0.88)", backdropFilter: "blur(16px)", zIndex: 60, display: "grid", placeItems: "center", padding: 20 }}
            onClick={() => { setActiveTool(null); cancelSpeech(); }}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 380, padding: 22, borderRadius: 16, background: "rgba(12,10,6,0.97)", border: "1px solid rgba(200,167,106,0.2)", boxShadow: "0 0 40px rgba(200,167,106,0.08)" }}
            >
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(200,167,106,0.55)", marginBottom: 14 }}>{activeTool.name.toUpperCase()}</div>
              <p style={{ fontFamily: "var(--font-sanctuary-display)", fontWeight: 300, fontSize: 22, color: "rgba(220,210,190,0.95)", margin: "0 0 20px", lineHeight: 1.5 }}>
                {activeTool.steps[toolStep]}
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setActiveTool(null); cancelSpeech(); }} style={{ flex: 1, minHeight: 44, borderRadius: 10, border: "1px solid rgba(200,167,106,0.15)", background: "transparent", color: "rgba(200,167,106,0.55)", fontSize: 11, letterSpacing: "0.16em", cursor: "pointer" }}>DISMISS</button>
                <button
                  onClick={() => {
                    const next = toolStep + 1;
                    if (next >= activeTool.steps.length) { setActiveTool(null); cancelSpeech(); return; }
                    setToolStep(next); cancelSpeech();
                    speak(activeTool.steps[next], { rate: 0.7, volume: 0.6 });
                  }}
                  style={{ flex: 1, minHeight: 44, borderRadius: 10, border: "1px solid rgba(200,167,106,0.35)", background: "rgba(200,167,106,0.08)", color: "rgba(220,185,110,0.9)", fontSize: 11, letterSpacing: "0.16em", cursor: "pointer" }}
                >
                  {toolStep < activeTool.steps.length - 1 ? "CONTINUE" : "COMPLETE"}
                </button>
              </div>
              <div style={{ marginTop: 12, fontSize: 9, color: "rgba(200,167,106,0.3)", letterSpacing: "0.2em" }}>
                STEP {toolStep + 1} / {activeTool.steps.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
