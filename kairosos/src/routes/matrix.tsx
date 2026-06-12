import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/mobile/BottomNav";
import {
  Habit, loadHabits, loadCompletions,
  currentStreak, dayKey, statusOn, isScheduled
} from "@/lib/habits-store";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip as RechartsTooltip, YAxis } from "recharts";

import bgImage from "@/assets/analytics mode background.png";
import settingIcon from "@/assets/Setting Icon.png";
import focusVideo from "@/assets/Current focus.mp4";
import constellationBg from "@/assets/DISCIPLINE CONSTELLATION.png";

export const Route = createFileRoute("/matrix")({
  component: OraclePage,
  head: () => ({
    meta: [
      { title: "The Oracle — Kairos" },
      { name: "description", content: "Your discipline reveals your future." },
    ],
  }),
});

const BG       = "#040508";
const MARBLE   = "linear-gradient(145deg, rgba(22,18,14,0.95), rgba(12,10,8,0.98))";
const BORDER   = "rgba(200,167,106,0.15)";
const GOLD     = "rgba(200,167,106,0.8)";
const BRIGHT   = "rgba(220,185,110,1)";
const DISPLAY  = "var(--font-sanctuary-display)";
const UI       = "var(--font-sanctuary-ui)";

const ICONS = [
  { key: "vitality", label: "Vitality", svg: <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M8 10c0-4 4-8 4-8s4 4 4 8c0 3-2 5-4 5s-4-2-4-5z"/><path d="M10 15v7h4v-7"/></svg> },
  { key: "wisdom", label: "Wisdom", svg: <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 4c-4 0-8 2-8 6 0 4 3 6 4 9h8c1-3 4-5 4-9 0-4-4-6-8-6z"/><path d="M9 19v3h6v-3"/></svg> },
  { key: "mastery", label: "Mastery", svg: <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M4.9 19.1l14.2-14.2"/></svg> },
  { key: "reading", label: "Reading", svg: <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20"/></svg> },
  { key: "meditation", label: "Meditation", svg: <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg> },
  { key: "journal", label: "Journal", svg: <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 2v20h-8l-6-6v-14h14z"/><path d="M14 2v6h6"/></svg> },
  { key: "exercise", label: "Exercise", svg: <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12v4H6z"/><path d="M8 8v12h8V8"/><path d="M4 6h2"/><path d="M18 6h2"/></svg> },
  { key: "hydration", label: "Hydration", svg: <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2s-6 7.5-6 12a6 6 0 0012 0c0-4.5-6-12-6-12z"/></svg> },
  { key: "sleep", label: "Sleep", svg: <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg> },
  { key: "legacy", label: "Legacy", svg: <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
];
const ICON_MAP = Object.fromEntries(ICONS.map(i => [i.key, i.svg]));

function OraclePage() {
  const [mounted, setMounted] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [comps, setComps]   = useState(() => loadCompletions());
  const [time, setTime] = useState(new Date());

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: containerRef });
  const yHero = useTransform(scrollY, [0, 400], [0, 150]);
  const opacityHero = useTransform(scrollY, [0, 300], [1, 0.2]);

  // Modals & Interactivity
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<any | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    setMounted(true);
    setHabits(loadHabits());
    setComps(loadCompletions());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date();
  
  // Base Stats
  const { score, momentum, totalStreak, trendData } = useMemo(() => {
    let done30 = 0, total30 = 0;
    let done60 = 0, total60 = 0;
    let streak = 0;
    const trend = [];
    
    for (let i = 0; i < 60; i++) {
      const d = new Date(); d.setDate(today.getDate() - i);
      const k = dayKey(d);
      const sched = habits.filter(h => isScheduled(h, d));
      
      let dCount = 0;
      if (sched.length > 0) {
        sched.forEach(h => { if (statusOn(comps, h.id, k) === "done") dCount++; });
        if (i < 30) { done30 += dCount; total30 += sched.length; }
        else { done60 += dCount; total60 += sched.length; }
      }
      
      if (i < 14) {
        const rate = sched.length > 0 ? (dCount / sched.length) * 100 : 0;
        trend.unshift({ date: d.getDate().toString(), score: rate });
      }
    }
    
    const d = new Date(today);
    while (true) {
      const k = dayKey(d);
      const any = comps.some(c => c.date === k && c.status === "done");
      if (any) { streak++; d.setDate(d.getDate() - 1); } else break;
      if (streak > 365) break;
    }

    const s30 = total30 > 0 ? Math.round((done30 / total30) * 100) : 0;
    const s60 = total60 > 0 ? Math.round((done60 / total60) * 100) : 0;
    return { score: s30, momentum: s30 - s60, totalStreak: streak, trendData: trend };
  }, [habits, comps, today]);

  const habitStats = useMemo(() => {
    return habits.map(h => {
      let done = 0, total = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(); d.setDate(today.getDate() - i);
        if (isScheduled(h, d)) {
          total++;
          if (statusOn(comps, h.id, dayKey(d)) === "done") done++;
        }
      }
      return { 
        habit: h, 
        rate: total > 0 ? done / total : 0,
        streak: currentStreak(comps, h.id, today)
      };
    }).sort((a,b) => b.rate - a.rate);
  }, [habits, comps, today]);

  const strongest = habitStats.length > 0 ? habitStats[0] : null;
  const topPillars = habitStats.slice(0, 4);

  // Archive of Discipline - Heatmap Data
  const heatmapCols = 16; 
  const heatmapGrid = useMemo(() => {
    const arr = [];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weekOffset * 7));
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const heatmapDays = heatmapCols * 7;
    for (let i = heatmapDays - 1; i >= 0; i--) {
      const d = new Date(startDate); d.setDate(startDate.getDate() - i);
      const k = dayKey(d);
      
      const sched = habits.filter(h => isScheduled(h, d));
      let status: "done" | "partial" | "missed" | "empty" = "empty";
      let dCount = 0;
      
      if (sched.length > 0) {
        sched.forEach(h => { if (statusOn(comps, h.id, k) === "done") dCount++; });
        if (dCount === sched.length) status = "done";
        else if (dCount > 0) status = "partial";
        else if (d.getTime() < today.getTime() || (d.toDateString() === today.toDateString() && dCount === 0)) status = "missed";
      }
      
      arr.push({ date: d, dayKey: k, status, doneCount: dCount, totalCount: sched.length, rate: sched.length > 0 ? Math.round((dCount / sched.length) * 100) : 0 });
    }
    return arr;
  }, [habits, comps, today, weekOffset]);

  const columns = [];
  for (let c = 0; c < heatmapCols; c++) {
    columns.push(heatmapGrid.slice(c * 7, (c + 1) * 7));
  }
  
  const totalGridDataPoints = heatmapGrid.filter(cell => cell.status !== "empty").length;
  const centerDateGrid = heatmapGrid[Math.floor(heatmapGrid.length / 2)]?.date || today;

  return (
    <div ref={containerRef} style={{
      height: "100vh", background: BG, color: "rgba(230,220,200,0.92)",
      fontFamily: UI, position: "relative", overflowX: "hidden", overflowY: "auto",
      paddingBottom: 120
    }}>
      
      {/* ── LUXURY HEADER ── */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, padding: "16px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", zIndex: 50, background: "linear-gradient(to bottom, rgba(4,5,8,0.95) 0%, rgba(4,5,8,0.6) 50%, rgba(4,5,8,0) 100%)", pointerEvents: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", border: `1px solid ${GOLD}`, display: "grid", placeItems: "center", background: "rgba(10,8,6,0.75)", backdropFilter: "blur(8px)", boxShadow: "0 0 15px rgba(220,185,110,0.15)" }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 18, color: BRIGHT, marginTop: 2 }}>K</span>
          </div>
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: 15, letterSpacing: "0.2em", color: "rgba(255,250,240,1)", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>KAIROS</div>
            <div style={{ fontSize: 8, letterSpacing: "0.15em", color: BRIGHT, filter: "drop-shadow(0 0 4px rgba(220,185,110,0.4))" }}>THE ORACLE</div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 2, pointerEvents: "auto" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 17, color: "rgba(255,250,240,1)", letterSpacing: "0.05em", textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: 8, letterSpacing: "0.2em", color: BRIGHT, filter: "drop-shadow(0 0 4px rgba(220,185,110,0.4))" }}>KAIROS TIME</div>
        </div>

        <motion.button whileHover={{ scale: 1.05 }} style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${BORDER}`, background: "rgba(10,8,6,0.75)", display: "grid", placeItems: "center", cursor: "pointer", pointerEvents: "auto", backdropFilter: "blur(8px)" }}>
          <img src={settingIcon} alt="Settings" style={{ width: 16, height: 16, filter: "brightness(0) invert(1) opacity(0.9) sepia(1) hue-rotate(330deg) saturate(3)" }} />
        </motion.button>
      </header>

      {/* ── HERO SECTION ── */}
      <div style={{ position: "relative", width: "100%", height: 480, overflow: "hidden", borderBottom: `1px solid ${BORDER}` }}>
        <motion.div style={{
          position: "absolute", inset: -30,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          y: yHero, opacity: opacityHero,
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(4,5,8,0.3) 0%, rgba(4,5,8,0.7) 60%, #040508 100%)" }} />
        
        {/* Ambient Lighting & Particles */}
        <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%)", width: "150%", height: "150%", background: "radial-gradient(circle, rgba(220,185,110,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
        <motion.div animate={{ y: [0, -100] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", inset: -100, opacity: 0.4, backgroundImage: "radial-gradient(circle, rgba(220,185,110,0.4) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />

        <div style={{ position: "absolute", bottom: 40, left: 24, right: 24, zIndex: 10 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 48, fontWeight: 300, margin: 0, color: "rgba(255,250,240,1)", letterSpacing: "0.15em", textShadow: "0 10px 30px rgba(0,0,0,0.9), 0 0 10px rgba(220,185,110,0.3)" }}>
              THE ORACLE
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "14px 0 20px" }}>
              <div style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${GOLD})` }} />
              <svg width={24} height={12} viewBox="0 0 24 12" fill="none" style={{ filter: "drop-shadow(0 0 4px rgba(220,185,110,0.5))" }}>
                <path d="M2 6 Q6 2 12 6 Q18 2 22 6" stroke={BRIGHT} strokeWidth={1} />
                <path d="M2 6 Q6 10 12 6 Q18 10 22 6" stroke={BRIGHT} strokeWidth={1} />
              </svg>
              <div style={{ height: 1, width: 40, background: `linear-gradient(to left, transparent, ${GOLD})` }} />
            </div>
            <p style={{ fontFamily: DISPLAY, fontSize: 18, color: "rgba(220,200,160,0.9)", fontStyle: "italic", margin: 0, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>
              Your discipline reveals your future.
            </p>
          </motion.div>
        </div>
      </div>

      <main style={{ padding: "32px 16px 0", position: "relative", zIndex: 10, display: "flex", flexDirection: "column", gap: 40 }}>
        
        {/* ── DISCIPLINE OVERVIEW (CINEMATIC HERO CARD) ── */}
        <section>
          <div style={{ fontSize: 10, letterSpacing: "0.25em", color: BRIGHT, textTransform: "uppercase", marginBottom: 16, fontFamily: DISPLAY, filter: "drop-shadow(0 0 8px rgba(220,185,110,0.3))" }}>DISCIPLINE OVERVIEW</div>
          <div style={{ position: "relative", borderRadius: 20, border: `1px solid ${BORDER}`, boxShadow: "0 15px 40px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.1)", overflow: "hidden" }}>
            
            <video src={focusVideo} autoPlay loop muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: "rgba(10,8,6,0.75)", zIndex: 1 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(220,185,110,0.1) 0%, transparent 100%)", zIndex: 1 }} />
            <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 60px rgba(0,0,0,0.8)", zIndex: 1 }} />
            
            <div style={{ position: "relative", zIndex: 2, padding: "28px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", backdropFilter: "blur(2px)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 11, color: "rgba(220,185,110,0.9)", letterSpacing: "0.15em", textTransform: "uppercase", filter: "drop-shadow(0 0 5px rgba(220,185,110,0.3))" }}>Global Mastery</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 44, color: BRIGHT, textShadow: "0 0 20px rgba(220,185,110,0.5), 0 2px 5px rgba(0,0,0,0.8)" }}>{score}%</div>
                <div style={{ fontSize: 12, color: "rgba(255,250,240,0.9)", fontStyle: "italic", fontFamily: DISPLAY }}>Overall completion rate</div>
              </div>

              <div style={{ width: 1, height: 60, background: `linear-gradient(to bottom, transparent, rgba(220,185,110,0.4), transparent)` }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <div style={{ fontSize: 11, color: "rgba(220,185,110,0.9)", letterSpacing: "0.15em", textTransform: "uppercase", filter: "drop-shadow(0 0 5px rgba(220,185,110,0.3))" }}>Current Streak</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 44, color: "rgba(255,250,240,1)", textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>{totalStreak}</div>
                <div style={{ fontSize: 12, color: "rgba(255,250,240,0.9)", fontStyle: "italic", fontFamily: DISPLAY }}>Days of discipline</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ORACLE INSIGHTS ── */}
        <section>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <InsightCard label="CURRENT MOMENTUM" value={`${momentum >= 0 ? '+' : ''}${momentum}%`} sub="vs last 30 days" positive={momentum >= 0} />
            <InsightCard label="STRONGEST PILLAR" value={strongest ? strongest.habit.name.substring(0, 15) : "None"} sub={strongest ? `${Math.round(strongest.rate * 100)}% mastery` : "Awaiting action"} positive={true} />
          </div>
        </section>

        {/* ── DISCIPLINE CONSTELLATION (HERO BANNER REBUILD) ── */}
        <section>
          <div style={{ position: "relative", width: "100%", height: 240, display: "flex", alignItems: "center", justifyContent: "space-between", overflow: "hidden", borderRadius: 20, border: `1px solid ${BORDER}`, boxShadow: "0 10px 30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
            
            {/* Full Bleed Background Image */}
            <img src={constellationBg} alt="Constellation Backdrop" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", opacity: 0.9 }} />
            
            {/* Overlays for depth and readability */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(10,8,6,0.95) 0%, rgba(10,8,6,0.5) 50%, rgba(10,8,6,0.85) 100%)", zIndex: 1 }} />
            <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 60px rgba(0,0,0,0.8)", zIndex: 1 }} />

            {/* Ambient Particles */}
            <motion.div animate={{ y: [0, -40] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", inset: -100, opacity: 0.2, backgroundImage: "radial-gradient(circle, rgba(220,185,110,0.4) 1px, transparent 1px)", backgroundSize: "40px 40px", zIndex: 1 }} />

            {/* Content Layer */}
            <div style={{ position: "relative", zIndex: 2, padding: "24px", width: "100%", height: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              
              {/* Left Side: Title, Description, CTA */}
              <div style={{ flex: 1, paddingRight: 20, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <h2 style={{ fontFamily: DISPLAY, fontSize: 20, margin: "0 0 6px 0", color: "rgba(255,250,240,1)", letterSpacing: "0.15em", textShadow: "0 2px 10px rgba(0,0,0,0.8)", textTransform: "uppercase" }}>
                  DISCIPLINE CONSTELLATION
                </h2>
                <p style={{ fontSize: 11, color: "rgba(200,180,150,0.8)", fontStyle: "italic", margin: "0 0 16px 0", lineHeight: 1.4 }}>
                  Your disciplines form a living map of progress.
                </p>
                <button onClick={() => setIsModalOpen(true)} style={{ background: "rgba(20,18,14,0.7)", border: `1px solid rgba(220,185,110,0.4)`, color: BRIGHT, fontFamily: DISPLAY, padding: "10px 20px", borderRadius: 30, fontSize: 10, letterSpacing: "0.15em", cursor: "pointer", backdropFilter: "blur(4px)", boxShadow: "0 4px 10px rgba(0,0,0,0.5)", width: "fit-content" }}>
                  VIEW CONSTELLATION
                </button>
              </div>

              {/* Right Side: Stacked Statistics Panel */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 120 }}>
                
                {/* Pillars */}
                <div style={{ background: "rgba(10,8,6,0.6)", border: `1px solid rgba(220,185,110,0.15)`, borderRadius: 12, padding: "10px 14px", backdropFilter: "blur(8px)", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
                  <div style={{ fontSize: 9, color: "rgba(200,167,106,0.7)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Pillars</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 18, color: "rgba(255,250,240,0.95)" }}>{habits.length}</div>
                </div>
                
                {/* Streak */}
                <div style={{ background: "rgba(10,8,6,0.6)", border: `1px solid rgba(220,185,110,0.15)`, borderRadius: 12, padding: "10px 14px", backdropFilter: "blur(8px)", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
                  <div style={{ fontSize: 9, color: "rgba(200,167,106,0.7)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Streak</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 18, color: "rgba(255,250,240,0.95)" }}>{totalStreak}</div>
                </div>
                
                {/* Mastery */}
                <div style={{ background: "rgba(10,8,6,0.6)", border: `1px solid rgba(220,185,110,0.15)`, borderRadius: 12, padding: "10px 14px", backdropFilter: "blur(8px)", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
                  <div style={{ fontSize: 9, color: "rgba(200,167,106,0.7)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Mastery</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 18, color: BRIGHT, textShadow: "0 0 10px rgba(220,185,110,0.3)" }}>{score}%</div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ── ARCHIVE OF DISCIPLINE (PREMIUM REBUILD) ── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.25em", color: BRIGHT, textTransform: "uppercase", fontFamily: DISPLAY, filter: "drop-shadow(0 0 8px rgba(220,185,110,0.3))" }}>ARCHIVE OF DISCIPLINE</div>
            
            {/* Monthly Navigation */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button onClick={() => setWeekOffset(prev => prev + 4)} style={{ background: "none", border: "none", color: "rgba(200,167,106,0.8)", cursor: "pointer", padding: 4 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <div style={{ fontSize: 11, color: "rgba(255,250,240,0.9)", fontFamily: DISPLAY, letterSpacing: "0.1em", minWidth: 90, textAlign: "center", textTransform: "uppercase" }}>
                {centerDateGrid.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <button onClick={() => setWeekOffset(prev => Math.max(0, prev - 4))} style={{ background: "none", border: "none", color: "rgba(200,167,106,0.8)", cursor: "pointer", padding: 4, opacity: weekOffset === 0 ? 0.3 : 1 }} disabled={weekOffset === 0}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
          
          <div style={{ background: MARBLE, borderRadius: 24, border: `1px solid ${BORDER}`, padding: "28px 20px", boxShadow: "0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)", position: "relative" }}>
            
            {totalGridDataPoints === 0 && weekOffset === 0 ? (
              // Empty State
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ opacity: 0.5, marginBottom: 20 }}>
                  <img src={constellationBg} alt="Artwork" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: "50%", filter: "sepia(1) hue-rotate(330deg) saturate(2)" }} />
                </div>
                <div style={{ fontSize: 12, color: "rgba(220,185,110,0.8)", fontStyle: "italic", fontFamily: DISPLAY, letterSpacing: "0.1em" }}>Your discipline archive is still being written.</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", position: "relative" }}>
                  {/* Y Axis (Days) */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingRight: 16, paddingBottom: 8, fontSize: 9, color: "rgba(180,160,130,0.6)", fontFamily: DISPLAY, letterSpacing: "0.1em" }}>
                    <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                  </div>

                  {/* Scrollable Grid */}
                  <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", paddingBottom: 10, scrollbarWidth: "none", msOverflowStyle: "none" }}>
                    <style>{`::-webkit-scrollbar { display: none; }`}</style>
                    <div style={{ display: "flex", gap: 6, paddingRight: 10 }}>
                      {columns.map((col, ci) => (
                        <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {col.map((c, i) => {
                            let bg = "linear-gradient(135deg, #181512, #0d0b09)";
                            let shadow = "inset 0 1px 1px rgba(255,255,255,0.03), 0 2px 4px rgba(0,0,0,0.4)";
                            let content = null;
                            
                            if (c.status === "done") { 
                              bg = "linear-gradient(135deg, #dfc385, #b8860b)"; 
                              shadow = "inset 0 1px 3px rgba(255,255,255,0.5), 0 2px 6px rgba(220,185,110,0.3)"; 
                            }
                            if (c.status === "partial") { 
                              bg = "linear-gradient(135deg, #8a6a3b, #4a3518)"; 
                              shadow = "inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.6)"; 
                            }
                            if (c.status === "missed") { 
                              bg = "linear-gradient(135deg, #2a0a0a, #150404)"; 
                              shadow = "inset 0 1px 2px rgba(0,0,0,0.8)"; 
                              content = <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(45deg, transparent 46%, rgba(200,40,40,0.2) 48%, rgba(200,40,40,0.2) 52%, transparent 54%)" }}/>;
                            }

                            return (
                              <motion.div 
                                whileHover={{ scale: 1.3, zIndex: 20 }} 
                                onHoverStart={() => setHoveredCell(c)}
                                onHoverEnd={() => setHoveredCell(null)}
                                key={i} 
                                style={{ 
                                  width: 14, height: 14, 
                                  background: bg, borderRadius: 3, 
                                  boxShadow: shadow, border: "1px solid rgba(0,0,0,0.8)", 
                                  position: "relative", cursor: "pointer" 
                                }}
                              >
                                {content}
                              </motion.div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: "flex", gap: 18, fontSize: 9, color: "rgba(180,160,130,0.8)", fontFamily: UI, marginTop: 16, paddingTop: 16, borderTop: `1px solid rgba(200,167,106,0.1)`, justifyContent: "center" }}>
                  <LegendItem color="linear-gradient(135deg, #dfc385, #b8860b)" label="Forged" />
                  <LegendItem color="linear-gradient(135deg, #8a6a3b, #4a3518)" label="Partial" />
                  <LegendItem color="linear-gradient(135deg, #2a0a0a, #150404)" label="Fractured" />
                </div>
              </>
            )}

            {/* Hover Tooltip Render */}
            <AnimatePresence>
              {hoveredCell && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.15 }}
                  style={{ position: "absolute", bottom: -50, left: "50%", transform: "translateX(-50%)", background: "rgba(10,8,6,0.95)", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 16px", display: "flex", gap: 16, alignItems: "center", backdropFilter: "blur(8px)", boxShadow: "0 10px 30px rgba(0,0,0,0.8)", zIndex: 30, minWidth: 240 }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "rgba(200,167,106,0.8)", fontFamily: DISPLAY, letterSpacing: "0.1em", marginBottom: 4 }}>{hoveredCell.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,250,240,0.9)", fontFamily: UI }}>{hoveredCell.doneCount} / {hoveredCell.totalCount} Pillars</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 18, color: BRIGHT }}>{hoveredCell.rate}%</div>
                    <div style={{ fontSize: 9, color: "rgba(150,130,100,0.7)", textTransform: "uppercase" }}>Completion</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

      </main>

      <BottomNav />

      {/* ── CONSTELLATION MODAL ── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}
          >
            <div onClick={() => setIsModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(4,5,8,0.85)", backdropFilter: "blur(8px)" }} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              style={{ position: "relative", background: MARBLE, borderRadius: 24, border: `1px solid ${GOLD}`, padding: "32px 24px", width: "100%", maxWidth: 400, boxShadow: "0 30px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.1)", zIndex: 101 }}
            >
              <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "rgba(200,167,106,0.8)", cursor: "pointer", padding: 4 }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
              
              <div style={{ textAlign: "center", marginBottom: 30 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.25em", color: BRIGHT, textTransform: "uppercase", marginBottom: 8, fontFamily: DISPLAY }}>ORACLE ANALYSIS</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 24, color: "rgba(255,250,240,1)", letterSpacing: "0.1em", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>DISCIPLINE CONSTELLATION</div>
              </div>

              {habits.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 13, color: "rgba(200,180,150,0.8)", fontStyle: "italic", marginBottom: 20 }}>The Oracle awaits your first pillar to map your constellation.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ background: "rgba(10,8,6,0.6)", borderRadius: 12, padding: "16px", border: `1px solid ${BORDER}`, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "rgba(200,167,106,0.8)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Current Streak</div>
                      <div style={{ fontFamily: DISPLAY, fontSize: 28, color: "rgba(255,250,240,0.95)" }}>{totalStreak}</div>
                    </div>
                    <div style={{ background: "rgba(10,8,6,0.6)", borderRadius: 12, padding: "16px", border: `1px solid ${BORDER}`, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "rgba(200,167,106,0.8)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Mastery</div>
                      <div style={{ fontFamily: DISPLAY, fontSize: 28, color: BRIGHT }}>{score}%</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "rgba(200,167,106,0.8)", marginBottom: 12, fontFamily: DISPLAY }}>TOP HABITS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {topPillars.map((p, idx) => (
                        <div key={p.habit.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,8,6,0.4)", padding: "10px 14px", borderRadius: 8, border: `1px solid rgba(200,167,106,0.1)` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ fontFamily: DISPLAY, fontSize: 11, color: "rgba(150,130,100,0.8)", width: 12 }}>{idx + 1}</div>
                            <div style={{ fontSize: 12, color: "rgba(255,250,240,0.9)", fontFamily: UI }}>{p.habit.name}</div>
                          </div>
                          <div style={{ fontSize: 11, color: BRIGHT, fontFamily: DISPLAY }}>{Math.round(p.rate * 100)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "rgba(200,167,106,0.8)", marginBottom: 12, fontFamily: DISPLAY }}>GROWTH TREND</div>
                    <div style={{ height: 100, background: "rgba(10,8,6,0.4)", borderRadius: 12, border: `1px solid rgba(200,167,106,0.1)`, padding: "10px 0" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <Line type="monotone" dataKey="score" stroke={BRIGHT} strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 4, fill: BRIGHT }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function InsightCard({ label, value, sub, positive }: any) {
  return (
    <motion.div whileHover={{ y: -2 }} style={{ background: MARBLE, borderRadius: 16, border: `1px solid ${BORDER}`, padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
      <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(200,167,106,0.7)", marginBottom: 12, fontFamily: DISPLAY, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 26, color: "rgba(255,250,240,0.95)", marginBottom: 6, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>{value}</div>
      <div style={{ fontSize: 10, color: positive ? "rgba(180,160,130,0.9)" : "rgba(180,120,120,0.9)", display: "flex", alignItems: "center", gap: 4, fontFamily: DISPLAY, fontStyle: "italic" }}>
        {sub}
      </div>
    </motion.div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color, boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.6)", border: "1px solid rgba(0,0,0,0.8)" }} />
      {label}
    </div>
  );
}
