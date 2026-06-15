import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { BottomNav } from "@/components/mobile/BottomNav";
import {
  Habit, HabitCategory, Frequency, Difficulty, CompletionStatus,
  loadHabits, saveHabits, loadCompletions, setStatus, statusOn,
  isScheduled, currentStreak, bestStreak, completionRateForDay, dayKey,
  updateHabit, deleteHabit
} from "@/lib/habits-store";
import heroImage from "@/assets/Habit tracker.png";

export const Route = createFileRoute("/habits")({
  component: AscensionPage,
  head: () => ({
    meta: [
      { title: "Ascension Path — Kairos" },
      { name: "description", content: "Forge your character. Build pillars of discipline." },
    ],
  }),
});

// ─── PREMIUM ICONS ──────────────────────────────────────────────────────────

export const ICONS = [
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
export const ICON_MAP = Object.fromEntries(ICONS.map(i => [i.key, i.svg]));

const CATEGORIES: HabitCategory[] = ["Vitality", "Wisdom", "Mastery", "Character", "Legacy"];
const FREQS: Frequency[]   = ["Daily", "Weekdays", "Weekends", "Custom"];
const DIFFS: Difficulty[]  = ["Initiate", "Guardian", "Spartan"];

const BG       = "#040508";
const MARBLE   = "linear-gradient(145deg, rgba(20,16,10,0.95), rgba(12,10,6,0.98))";
const BORDER   = "rgba(200,167,106,0.2)";
const GOLD     = "rgba(200,167,106,0.8)";
const BRIGHT   = "rgba(220,185,110,1)";
const DISPLAY  = "var(--font-sanctuary-display)";
const UI       = "var(--font-sanctuary-ui)";

function nextStatus(s: CompletionStatus | null): CompletionStatus | null {
  if (s === null) return "done";
  if (s === "done") return "partial";
  return null;
}

function AscensionPage() {
  const [mounted, setMounted] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [comps, setComps]   = useState(() => loadCompletions());
  const [today]             = useState(() => new Date());
  const [viewDate, setViewDate] = useState<string>(dayKey(new Date()));
  const [sheetOpen, setSheetOpen] = useState(false);
  const navigate = useNavigate();
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [actionHabit, setActionHabit] = useState<Habit | null>(null);
  const [confirmDeleteHabit, setConfirmDeleteHabit] = useState<Habit | null>(null);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState<{ habitName: string; streak: number } | null>(null);
  
  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
  const archivedHabits = useMemo(() => habits.filter(h => h.archived), [habits]);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: containerRef });
  const yHero = useTransform(scrollY, [0, 400], [0, 150]);
  const opacityHero = useTransform(scrollY, [0, 300], [1, 0.2]);

  useEffect(() => {
    setMounted(true);
    setHabits(loadHabits());
    setComps(loadCompletions());
    const onChange = () => { setHabits(loadHabits()); setComps(loadCompletions()); };
    window.addEventListener("habits:changed", onChange);
    return () => window.removeEventListener("habits:changed", onChange);
  }, []);

  const todayKey = dayKey(today);
  const isToday = viewDate === todayKey;

  const scheduledToday = useMemo(
    () => activeHabits.filter(h => isScheduled(h, new Date(viewDate + "T00:00:00"))),
    [activeHabits, viewDate]
  );

  const doneCount = scheduledToday.filter(h => statusOn(comps, h.id, viewDate) === "done").length;
  const totalCount = scheduledToday.length;

  const sortedHabits = useMemo(() => {
    const list = [...scheduledToday];
    if (!isToday) return list;
    return list.sort((a, b) => {
      const sa = statusOn(comps, a.id, viewDate);
      const sb = statusOn(comps, b.id, viewDate);
      const wa = sa === "done" ? 2 : sa === "partial" ? 1 : 0;
      const wb = sb === "done" ? 2 : sb === "partial" ? 1 : 0;
      return wa - wb;
    });
  }, [scheduledToday, comps, viewDate, isToday]);

  const overallStreak = useMemo(() => {
    let streak = 0;
    const d = new Date(today);
    while (true) {
      const k = dayKey(d);
      const any = comps.some(c => c.date === k && c.status === "done");
      if (any) { streak++; d.setDate(d.getDate() - 1); } else break;
      if (streak > 365) break;
    }
    return streak;
  }, [comps, today]);
  
  const bestOverall = useMemo(() => activeHabits.length > 0 ? Math.max(0, ...activeHabits.map(h => bestStreak(comps, h.id))) : 0, [activeHabits, comps]);

  const weekDays = useMemo(() => {
    const arr: { date: Date; key: string; letter: string; rate: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const k = dayKey(d);
      arr.push({
        date: d, key: k,
        letter: d.toLocaleDateString(undefined, { weekday: "narrow" }).toUpperCase(),
        rate: completionRateForDay(activeHabits, comps, k),
      });
    }
    return arr;
  }, [activeHabits, comps, today]);

  const monthDots = useMemo(() => {
    const arr: { key: string; rate: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const k = dayKey(d);
      arr.push({ key: k, rate: completionRateForDay(activeHabits, comps, k) });
    }
    return arr;
  }, [activeHabits, comps, today]);

  const habitStats = useMemo(() => activeHabits.map(h => {
    const last30 = monthDots.map(d => statusOn(comps, h.id, d.key));
    const done = last30.filter(s => s === "done").length;
    return { habit: h, done, rate: done / 30, streak: currentStreak(comps, h.id, today), max: bestStreak(comps, h.id) };
  }), [activeHabits, comps, monthDots, today]);

  const bestHabit = useMemo(() => [...habitStats].sort((a,b) => b.rate - a.rate)[0], [habitStats]);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef(false);

  const handlePointerDown = (h: Habit) => {
    isLongPressing.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressing.current = true;
      setActionHabit(h);
      if ("vibrate" in navigator) try { navigator.vibrate(20); } catch {}
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  function cycleStatus(h: Habit) {
    if (isLongPressing.current) return;
    if (!isToday) return;
    const cur = statusOn(comps, h.id, viewDate);
    const next = nextStatus(cur);
    const updated = setStatus(h.id, viewDate, next);
    setComps(updated);
    if (next === "done") {
      setPulseId(h.id);
      setTimeout(() => setPulseId(null), 600);
      if ("vibrate" in navigator) try { navigator.vibrate(15); } catch {}
      // Show premium toast
      const streak = currentStreak(updated, h.id, today);
      setToast({ habitName: h.name, streak });
      setTimeout(() => setToast(null), 2800);
    }
  }

  function addHabit(h: Omit<Habit, "id" | "createdAt" | "color">) {
    const generateId = () => {
      if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
      return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    };
    
    const next = [...habits, { ...h, color: "#dcb96e", id: generateId(), createdAt: Date.now() }];
    setHabits(next);
    saveHabits(next);

    setSheetOpen(false);
    setShowSuccess(true);
    if ("vibrate" in navigator) try { navigator.vibrate([15, 60, 15]); } catch {}
    setTimeout(() => {
      setShowSuccess(false);
    }, 1800);
  }

  return (
    <div ref={containerRef} style={{
      height: "100vh", background: BG, color: "rgba(230,220,200,0.92)",
      fontFamily: UI, position: "relative", overflowX: "hidden", overflowY: "auto"
    }}>
      {/* ── ALIVE HERO SECTION ── */}
      <div style={{ position: "relative", width: "100%", height: 380, overflow: "hidden", flexShrink: 0 }}>
        <motion.div style={{
          position: "absolute", inset: -20,
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center 10%",
          y: yHero, opacity: opacityHero,
          filter: "contrast(1.1) brightness(0.9)",
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(4,5,8,0.1) 0%, rgba(4,5,8,0.6) 40%, #040508 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center 30%, transparent 20%, rgba(4,5,8,0.85) 100%)" }} />
        
        {/* Parallax Floating Dust */}
        <motion.div 
          animate={{ y: [0, -100] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", inset: -100, opacity: 0.6, backgroundImage: "radial-gradient(circle, rgba(220,185,110,0.2) 1px, transparent 1px)", backgroundSize: "40px 40px" }} 
        />
        <motion.div 
          animate={{ y: [0, -80] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", inset: -100, opacity: 0.4, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "30px 30px", backgroundPosition: "15px 15px" }} 
        />

        {/* Top Header */}
        <header style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 0", zIndex: 10 }}>
          <motion.div whileHover={{ scale: 1.05 }} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(200,167,106,0.4)", display: "grid", placeItems: "center", background: "rgba(10,8,6,0.6)", backdropFilter: "blur(8px)", boxShadow: "0 0 10px rgba(200,167,106,0.2)" }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(220,185,110,0.9)" strokeWidth={1.2} strokeLinecap="round">
              <path d="M3 10L12 4L21 10M5 10v8M9 10v8M15 10v8M19 10v8M3 18h18" />
            </svg>
          </motion.div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 300, letterSpacing: "0.08em", color: "rgba(255,250,240,1)", textShadow: "0 0 15px rgba(255,255,255,0.2)" }}>
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ fontSize: 8, letterSpacing: "0.4em", color: BRIGHT, marginTop: 2, filter: "drop-shadow(0 0 4px rgba(220,185,110,0.5))" }}>
              - ASCENSION -
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} style={{ width: 36, height: 36, display: "grid", placeItems: "center" }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={BRIGHT} strokeWidth={1} style={{ filter: "drop-shadow(0 0 6px rgba(220,185,110,0.4))" }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </motion.div>
        </header>

        {/* Hero Titles */}
        <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, padding: "0 24px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: "easeOut" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 300, letterSpacing: "0.15em", color: BRIGHT, textShadow: "0 4px 30px rgba(0,0,0,0.9), 0 0 10px rgba(220,185,110,0.3)" }}>
              ASCENSION PATH
            </div>
            <div style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: 14, color: "rgba(220,205,175,0.8)", marginTop: 8, letterSpacing: "0.04em", maxWidth: "70%" }}>
              Small actions become<br/>great destinies.
            </div>
            {/* Elegant Engraved Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
              <div style={{ height: 1, width: 40, background: "linear-gradient(to right, transparent, rgba(220,185,110,0.6))" }} />
              <svg width={20} height={12} viewBox="0 0 20 12" fill="none" style={{ filter: "drop-shadow(0 0 4px rgba(220,185,110,0.4))" }}>
                <path d="M2 6 Q5 2 10 6 Q15 2 18 6" stroke={BRIGHT} strokeWidth={1} />
                <path d="M2 6 Q5 10 10 6 Q15 10 18 6" stroke={BRIGHT} strokeWidth={1} />
              </svg>
              <div style={{ height: 1, width: 40, background: "linear-gradient(to left, transparent, rgba(220,185,110,0.6))" }} />
            </div>
          </motion.div>
        </div>
      </div>

      <motion.main
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
        style={{ padding: "0 16px 120px", position: "relative", zIndex: 5, marginTop: -20 }}
      >
        {/* ── ASCENSION STATS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 40 }}>
          <StatBox label="TODAY'S ASCENSION" value={`${doneCount}/${totalCount}`} sub="Pillars Completed">
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={BRIGHT} strokeWidth={1.2} strokeLinecap="round">
              <path d="M3 10L12 4L21 10M5 10v10M9 10v10M15 10v10M19 10v10M3 20h18" />
            </svg>
          </StatBox>
          <StatBox label="DISCIPLINE STREAK" value={`${overallStreak}`} sub="Days">
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={BRIGHT} strokeWidth={1.2} strokeLinecap="round">
              <path d="M6 10c0-4 4-7 4-7s-1 3-1 6c0 3 3 5 3 5s-2 2-4 2c-1.5 0-3-1-3-3s1-3 1-3z" />
              <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
            </svg>
          </StatBox>
          <StatBox label="LEGACY RECORD" value={`${bestOverall}d`} sub="Longest Streak">
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={BRIGHT} strokeWidth={1.2} strokeLinecap="round">
              <path d="M12 2v20M8 6h8M6 22h12M12 2l-4 4M12 2l4 4" />
            </svg>
          </StatBox>
        </div>

        {/* ── STONE DISCIPLINE TABLETS (WEEK) ── */}
        <SectionDivider title="WEEK OF DISCIPLINE" />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 44 }}>
          {weekDays.map(d => {
            const active = d.key === viewDate;
            const completed = d.rate === 1;
            const partial = d.rate > 0 && d.rate < 1;
            return (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={d.key}
                onClick={() => setViewDate(d.key)}
                style={{
                  flex: 1, height: 64,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                  borderRadius: 12,
                  background: active ? "linear-gradient(180deg, rgba(220,185,110,0.15), rgba(10,8,6,0.9))" : "rgba(16,14,12,0.6)",
                  border: `1px solid ${active ? BRIGHT : "rgba(200,167,106,0.15)"}`,
                  boxShadow: active ? `0 0 20px rgba(220,185,110,0.2), inset 0 2px 5px rgba(255,255,255,0.1)` : "inset 0 2px 5px rgba(0,0,0,0.5)",
                  cursor: "pointer", position: "relative", overflow: "hidden"
                }}
              >
                {active && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: BRIGHT, boxShadow: `0 0 10px ${BRIGHT}` }} />}
                <span style={{ fontFamily: DISPLAY, fontSize: 14, color: active ? BRIGHT : "rgba(160,150,130,0.7)" }}>
                  {d.letter}
                </span>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: completed ? BRIGHT : partial ? "rgba(200,167,106,0.5)" : "rgba(100,90,80,0.3)",
                  boxShadow: completed ? `0 0 10px ${BRIGHT}` : "none",
                }} />
              </motion.button>
            );
          })}
        </div>

        {/* ── DISCIPLINE PILLARS ── */}
        <SectionDivider title="DISCIPLINE PILLARS" />
        {!mounted ? null : activeHabits.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: "50px 20px", background: MARBLE, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)", marginBottom: 40 }}>
            <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="rgba(220,185,110,0.6)" strokeWidth={1} style={{ filter: "drop-shadow(0 0 10px rgba(220,185,110,0.2))", marginBottom: 16 }}>
              <path d="M4 22h16M4 2h16M6 2v20M10 2v20M14 2v20M18 2v20" strokeLinecap="round" />
            </svg>
            <p style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: 16, color: "rgba(220,185,110,0.8)", margin: "0 0 8px" }}>
              Every empire begins with a single pillar.
            </p>
            <p style={{ fontSize: 11, color: "rgba(180,160,130,0.5)", letterSpacing: "0.1em" }}>
              FORGE YOUR FIRST DISCIPLINE BELOW
            </p>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 44 }}>
            {sortedHabits.map(h => {
              const s = statusOn(comps, h.id, viewDate);
              const streak = currentStreak(comps, h.id, today);
              const isDone = s === "done";
              const iconSvg = ICON_MAP[h.icon] || ICON_MAP.mastery;

              return (
                <motion.div
                  key={h.id} layout
                  whileHover={{ scale: isToday ? 1.02 : 1, y: isToday ? -2 : 0 }}
                  animate={{ scale: pulseId === h.id ? [1, 1.05, 1] : 1 }}
                  style={{
                    display: "flex", alignItems: "stretch",
                    background: isDone ? "linear-gradient(145deg, rgba(20,16,10,0.9), rgba(12,10,6,0.95))" : MARBLE,
                    border: `1px solid ${isDone ? BRIGHT : BORDER}`,
                    borderRadius: 16,
                    boxShadow: isDone ? `0 4px 20px rgba(220,185,110,0.15), inset 0 1px 0 rgba(220,185,110,0.2)` : "0 4px 15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
                    overflow: "hidden", cursor: isToday ? "pointer" : "default",
                    position: "relative",
                    userSelect: "none", WebkitUserSelect: "none",
                  }}
                  onClick={() => cycleStatus(h)}
                  onPointerDown={() => handlePointerDown(h)}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  {isDone && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, background: BRIGHT, boxShadow: `0 0 10px ${BRIGHT}` }} />}
                  {/* Left Icon Panel */}
                  <div 
                    style={{ width: 72, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.4)", borderRight: `1px solid ${BORDER}` }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${isDone ? BRIGHT : "rgba(200,167,106,0.4)"}`, display: "grid", placeItems: "center", color: isDone ? BRIGHT : GOLD, boxShadow: isDone ? `0 0 15px rgba(220,185,110,0.3)` : "inset 0 2px 4px rgba(0,0,0,0.5)", transition: "all 0.3s" }}>
                      <div style={{ width: 22, height: 22 }}>{iconSvg}</div>
                    </div>
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, padding: "16px 18px" }}>
                    <div style={{ fontFamily: UI, fontSize: 17, color: "rgba(255,250,240,0.95)", marginBottom: 6, textShadow: isDone ? "0 0 8px rgba(255,255,255,0.2)" : "none" }}>
                      {h.name}
                    </div>
                    <div style={{ fontSize: 9, letterSpacing: "0.25em", color: isDone ? BRIGHT : "rgba(200,167,106,0.6)", marginBottom: 8, textTransform: "uppercase" }}>
                      {h.category}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(160,150,130,0.6)" }}>
                      Build the character. Strengthen the mind.
                    </div>
                  </div>
                  {/* Right Streak Panel */}
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderLeft: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.2)", position: "relative" }}>
                    {/* Three-dot menu indicator */}
                    <div style={{ position: "absolute", top: 8, right: 8 }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="rgba(200,167,106,0.4)">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </div>
                    <div style={{ fontFamily: DISPLAY, fontSize: 24, color: BRIGHT, textShadow: `0 0 10px rgba(220,185,110,0.4)` }}>{streak}</div>
                    <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "rgba(200,167,106,0.6)", textTransform: "uppercase" }}>Streak</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── CEREMONIAL FORGE BUTTON ── */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: 15, color: "rgba(220,185,110,0.8)", marginBottom: 18, filter: "drop-shadow(0 0 5px rgba(220,185,110,0.2))" }}>
            Greatness is built in silence.
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="forge-btn-main"
            style={{
              width: "100%", height: 72,
              borderRadius: 36,
              border: `1px solid ${BRIGHT}`,
              background: "linear-gradient(145deg, rgba(20,16,10,0.98), rgba(12,10,6,1))",
              color: BRIGHT,
              fontFamily: DISPLAY, fontSize: 18, letterSpacing: "0.2em",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
              cursor: "pointer", position: "relative", overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(220,185,110,0.2), inset 0 1px 2px rgba(255,255,255,0.1)",
              transition: "all 0.3s"
            }}
          >
            <div className="forge-sweep" style={{ position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(220,185,110,0.2), transparent)", animation: "sweep 3s infinite" }} />
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
              <path d="M3 10L12 4L21 10M5 10v10M9 10v10M15 10v10M19 10v10M3 20h18" />
            </svg>
            FORGE NEW PILLAR
          </button>
          {activeHabits.length > 0 && (
            <div style={{ marginTop: 16, fontSize: 11, fontFamily: DISPLAY, fontStyle: "italic", color: "rgba(200,167,106,0.6)", letterSpacing: "0.05em" }}>
              Long press a pillar to manage it.
            </div>
          )}
          <style>{`
            @keyframes sweep { 0% { left: -100%; } 50% { left: 200%; } 100% { left: 200%; } }
            .forge-btn-main:hover { border-color: #fff !important; box-shadow: 0 10px 40px rgba(0,0,0,0.9), 0 0 30px rgba(220,185,110,0.4), inset 0 2px 5px rgba(255,255,255,0.2) !important; text-shadow: 0 0 10px rgba(220,185,110,0.8); }
          `}</style>
        </div>

        {/* ── ANCIENT DISCIPLINE ARCHIVE (Heatmap) ── */}
        <SectionDivider title="ANCIENT DISCIPLINE ARCHIVE" />
        <div style={{ background: MARBLE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
          <div style={{ textAlign: "center", fontSize: 10, letterSpacing: "0.2em", color: "rgba(200,167,106,0.7)", marginBottom: 20 }}>LAST 30 DAYS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 8 }}>
            {monthDots.map(d => {
              const bg = d.rate === 1 ? "rgba(220,185,110,0.9)" : d.rate > 0 ? "rgba(200,167,106,0.4)" : "rgba(30,25,20,0.8)";
              const shadow = d.rate === 1 ? "0 0 12px rgba(220,185,110,0.5)" : "inset 0 1px 3px rgba(0,0,0,0.8)";
              return (
                <div key={d.key} style={{ aspectRatio: "1", borderRadius: 6, background: bg, boxShadow: shadow, border: `1px solid rgba(220,185,110,0.15)`, transition: "all 0.3s" }} />
              );
            })}
          </div>
        </div>

        {/* ── PATH OF DISCIPLINE & GREATEST PILLAR ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
          <div style={{ background: MARBLE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: BRIGHT, textAlign: "center", marginBottom: 20 }}>PATH OF DISCIPLINE<br/><span style={{fontSize: 7, color: "rgba(200,167,106,0.5)"}}>LAST 7 DAYS</span></div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 80 }}>
              {weekDays.map(d => (
                <div key={d.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(d.rate * 100, 5)}%` }} transition={{ duration: 1, ease: "easeOut" }} style={{ width: 10, background: d.rate > 0 ? "linear-gradient(to top, rgba(220,185,110,0.4), rgba(220,185,110,1))" : "rgba(200,167,106,0.15)", borderRadius: 4, boxShadow: d.rate > 0 ? `0 0 10px rgba(220,185,110,0.4)` : "inset 0 1px 2px rgba(0,0,0,0.5)" }} />
                  <div style={{ fontSize: 8, color: "rgba(200,167,106,0.6)" }}>{d.letter}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ background: MARBLE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: BRIGHT, textAlign: "center", marginBottom: 16 }}>GREATEST PILLAR</div>
            {bestHabit ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ position: "relative", width: 56, height: 56 }}>
                  <svg width="56" height="56" viewBox="0 0 56 56" style={{ position: "absolute", inset: 0 }}>
                    <circle cx="28" cy="28" r="24" stroke="rgba(200,167,106,0.2)" strokeWidth="3" fill="none" />
                    <motion.circle initial={{ strokeDashoffset: 150 }} animate={{ strokeDashoffset: 150 - (150 * bestHabit.rate) }} transition={{ duration: 1.5, ease: "easeOut" }} cx="28" cy="28" r="24" stroke={BRIGHT} strokeWidth="3" fill="none" strokeDasharray="150" transform="rotate(-90 28 28)" style={{ filter: `drop-shadow(0 0 6px ${BRIGHT})` }} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: BRIGHT }}>
                    <div style={{ width: 24, height: 24 }}>{ICON_MAP[bestHabit.habit.icon] || ICON_MAP.mastery}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: UI, fontSize: 14, color: "rgba(255,250,240,0.95)", marginBottom: 2 }}>{bestHabit.habit.name}</div>
                  <div style={{ fontSize: 10, color: "rgba(200,167,106,0.7)", letterSpacing: "0.05em" }}>{bestHabit.max}d Legacy</div>
                  <div style={{ fontSize: 12, color: BRIGHT, marginTop: 4, fontFamily: DISPLAY }}>{Math.round(bestHabit.rate * 100)}%</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="rgba(200,167,106,0.3)" strokeWidth={1} style={{ filter: "drop-shadow(0 0 5px rgba(200,167,106,0.1))" }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <div style={{ fontSize: 11, color: "rgba(200,167,106,0.5)", fontStyle: "italic", textAlign: "center" }}>Your greatest pillar<br/>awaits.</div>
              </div>
            )}
          </div>
        </div>

        {/* ── RELICS OF DISCIPLINE (MUSEUM DISPLAY) ── */}
        <SectionDivider title="RELICS OF DISCIPLINE" />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 50 }}>
          <Relic icon="🌿" days={7} title="Bronze Laurel" achieved={overallStreak >= 7} />
          <Relic icon="🥈" days={30} title="Silver Laurel" achieved={overallStreak >= 30} />
          <Relic icon="👑" days={100} title="Golden Crown" achieved={overallStreak >= 100} />
          <Relic icon="🏛️" days={365} title="Immortal Pillar" achieved={overallStreak >= 365} />
        </div>

        {/* ── ARCHIVED PILLARS ── */}
        {archivedHabits.length > 0 && (
          <div style={{ marginBottom: 50 }}>
            <SectionDivider title="ARCHIVED PILLARS" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {archivedHabits.map(h => {
                const iconSvg = ICON_MAP[h.icon] || ICON_MAP.mastery;
                const archiveDate = h.archivedAt ? new Date(h.archivedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown';
                const prevStreak = bestStreak(comps, h.id);
                return (
                  <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
                    background: MARBLE, border: `1px solid ${BORDER}`, borderRadius: 16,
                    overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", padding: "18px 16px", gap: 14 }}>
                      {/* Icon */}
                      <div style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid rgba(200,167,106,0.3)`, display: "grid", placeItems: "center", color: "rgba(200,167,106,0.5)", background: "rgba(10,8,6,0.6)", flexShrink: 0, boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}>
                        <div style={{ width: 22, height: 22, opacity: 0.6 }}>{iconSvg}</div>
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: UI, fontSize: 15, color: "rgba(220,205,175,0.85)", marginBottom: 4 }}>{h.name}</div>
                        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(200,167,106,0.5)", textTransform: "uppercase", marginBottom: 4 }}>{h.category}</div>
                        <div style={{ fontSize: 10, color: "rgba(160,150,130,0.5)" }}>Archived on {archiveDate}</div>
                      </div>
                      {/* Streak */}
                      <div style={{ textAlign: "center", flexShrink: 0 }}>
                        <div style={{ fontFamily: DISPLAY, fontSize: 20, color: "rgba(200,167,106,0.6)" }}>{prevStreak}d</div>
                        <div style={{ fontSize: 7, letterSpacing: "0.15em", color: "rgba(160,150,130,0.4)", textTransform: "uppercase" }}>Longest Streak</div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div style={{ display: "flex", borderTop: `1px solid ${BORDER}` }}>
                      <button onClick={() => updateHabit(h.id, { archived: false })} style={{ flex: 1, padding: "12px", background: "transparent", color: BRIGHT, fontSize: 12, fontFamily: DISPLAY, letterSpacing: "0.1em", border: "none", cursor: "pointer", borderRight: `1px solid ${BORDER}`, transition: "background 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,167,106,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >Restore</button>
                      <button onClick={() => { setConfirmDeleteHabit(h); }} style={{ flex: 1, padding: "12px", background: "transparent", color: "rgba(255,100,100,0.7)", fontSize: 12, fontFamily: DISPLAY, letterSpacing: "0.1em", border: "none", cursor: "pointer", transition: "background 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,74,74,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >Delete</button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "30px 0 50px", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: 16, color: "rgba(220,205,175,0.8)", textShadow: "0 0 10px rgba(0,0,0,0.5)" }}>
            We become what we repeatedly do.
          </div>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "rgba(200,167,106,0.6)", marginTop: 10 }}>
            — ARISTOTLE
          </div>
        </div>
      </motion.main>

      <BottomNav />

      {/* ── PREMIUM TOAST NOTIFICATION ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
              zIndex: 200, display: "flex", alignItems: "center", gap: 14,
              background: "linear-gradient(145deg, rgba(16,14,10,0.95), rgba(8,6,4,0.98))",
              border: `1px solid ${GOLD}`,
              borderRadius: 16, padding: "14px 24px",
              backdropFilter: "blur(20px)",
              boxShadow: `0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(220,185,110,0.15), inset 0 1px 0 rgba(255,255,255,0.08)`,
              minWidth: 240, maxWidth: "calc(100vw - 40px)"
            }}
          >
            {/* Check icon */}
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${BRIGHT}`, display: "grid", placeItems: "center", flexShrink: 0, boxShadow: `0 0 15px rgba(220,185,110,0.25)`, background: "rgba(220,185,110,0.08)" }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={BRIGHT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: DISPLAY, fontSize: 14, color: BRIGHT, letterSpacing: "0.05em", marginBottom: 3 }}>
                Discipline recorded.
              </div>
              <div style={{ fontSize: 11, color: "rgba(200,167,106,0.7)", fontFamily: UI }}>
                Streak: {toast.streak} {toast.streak === 1 ? 'Day' : 'Days'}
              </div>
            </div>
            {/* Sweep animation */}
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: "200%" }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(90deg, transparent, rgba(220,185,110,0.08), transparent)", pointerEvents: "none", borderRadius: 16 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUCCESS OVERLAY ── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              display: "grid", placeItems: "center",
              background: "rgba(4,5,8,0.92)", backdropFilter: "blur(12px)"
            }}
          >
            <div style={{ textAlign: "center" }}>
              <motion.div 
                initial={{ scale: 0.5, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 14, stiffness: 200 }}
                style={{ fontSize: 64, marginBottom: 16, filter: `drop-shadow(0 0 30px ${BRIGHT})` }}
              >
                <svg width={90} height={90} viewBox="0 0 24 24" fill="none" stroke={BRIGHT} strokeWidth={1} strokeLinecap="round" style={{ margin: "0 auto" }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                style={{ fontFamily: DISPLAY, fontSize: 26, letterSpacing: "0.25em", color: BRIGHT, textShadow: `0 0 15px ${BRIGHT}` }}
              >
                PILLAR FORGED
              </motion.div>
              <motion.div
                initial={{ x: "-100%" }} animate={{ x: "200%" }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, transparent, rgba(220,185,110,0.15), transparent)", pointerEvents: "none" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PILLAR ACTIONS SHEET ── */}
      <AnimatePresence>
        {actionHabit && (
          <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActionHabit(null)} style={{ position: "absolute", inset: 0, background: "rgba(4,5,8,0.85)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} style={{ position: "relative", background: MARBLE, borderTop: `1px solid ${GOLD}`, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "24px 16px calc(24px + env(safe-area-inset-bottom, 0px))", boxShadow: "0 -10px 40px rgba(0,0,0,0.8)" }}>
              {/* Handle bar */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ width: 40, height: 4, background: "rgba(200,167,106,0.3)", borderRadius: 2, margin: "0 auto 16px" }} />
                <div style={{ fontSize: 10, letterSpacing: "0.25em", color: "rgba(200,167,106,0.5)", marginBottom: 8, textTransform: "uppercase" }}>PILLAR ACTIONS</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 4 }}>
                  <div style={{ height: 1, width: 30, background: "linear-gradient(to right, transparent, rgba(220,185,110,0.3))" }} />
                  <svg width={12} height={8} viewBox="0 0 12 8" fill="none">
                    <path d="M1 4L6 1L11 4" stroke={BRIGHT} strokeWidth={0.8} />
                    <path d="M1 4L6 7L11 4" stroke={BRIGHT} strokeWidth={0.8} />
                  </svg>
                  <div style={{ height: 1, width: 30, background: "linear-gradient(to left, transparent, rgba(220,185,110,0.3))" }} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <ActionBtn 
                  icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                  label="View Details" 
                  description="Explore your discipline journey"
                  onClick={() => { navigate({ to: '/habits/$habitId', params: { habitId: actionHabit.id } }); setActionHabit(null); }} 
                />
                <ActionBtn 
                  icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>}
                  label="Edit Pillar" 
                  description="Modify your pillar details"
                  onClick={() => { setEditHabit(actionHabit); setActionHabit(null); }} 
                />
                <ActionBtn 
                  icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></svg>}
                  label="Archive Pillar" 
                  description="Archive and hide from active pillars"
                  onClick={() => { updateHabit(actionHabit.id, { archived: true }); setActionHabit(null); if ("vibrate" in navigator) try { navigator.vibrate(10); } catch {} }} 
                />
                <ActionBtn 
                  icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>}
                  label="Delete Pillar" 
                  description="Permanently delete this pillar"
                  danger 
                  onClick={() => { setConfirmDeleteHabit(actionHabit); setActionHabit(null); }} 
                />
              </div>
              {/* Cancel */}
              <button 
                onClick={() => setActionHabit(null)} 
                style={{ 
                  width: "100%", padding: 16, marginTop: 12,
                  background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 12,
                  color: "rgba(200,167,106,0.7)", fontFamily: DISPLAY, fontSize: 14, 
                  letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.2s"
                }}
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {confirmDeleteHabit && (
          <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "grid", placeItems: "center", padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDeleteHabit(null)} style={{ position: "absolute", inset: 0, background: "rgba(4,5,8,0.9)", backdropFilter: "blur(8px)" }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ position: "relative", width: "100%", maxWidth: 320, background: "linear-gradient(145deg, rgba(30,10,10,0.95), rgba(15,5,5,0.98))", border: "1px solid rgba(255,74,74,0.3)", borderRadius: 20, padding: 28, boxShadow: "0 20px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,74,74,0.08)", border: "1px solid rgba(255,74,74,0.2)", display: "grid", placeItems: "center", margin: "0 auto 20px", boxShadow: "0 0 20px rgba(255,74,74,0.1)" }}>
                <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </div>
              <h4 style={{ fontFamily: DISPLAY, fontSize: 22, color: "rgba(255,220,220,0.95)", margin: "0 0 10px", letterSpacing: "0.05em" }}>Delete Pillar?</h4>
              <p style={{ fontSize: 13, color: "rgba(255,200,200,0.6)", margin: "0 0 28px", lineHeight: 1.5 }}>
                Deleting this pillar will permanently erase its progress, streak history, and all records.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => { deleteHabit(confirmDeleteHabit.id); setConfirmDeleteHabit(null); if ("vibrate" in navigator) try { navigator.vibrate(20); } catch {} }} style={{ width: "100%", padding: 16, borderRadius: 12, background: "rgba(255,74,74,0.12)", color: "#ff6b6b", border: "1px solid rgba(255,74,74,0.35)", fontFamily: DISPLAY, fontSize: 15, letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.2s" }}>
                  Delete Permanently
                </button>
                <button onClick={() => setConfirmDeleteHabit(null)} style={{ width: "100%", padding: 16, borderRadius: 12, background: "rgba(200,167,106,0.08)", color: BRIGHT, border: `1px solid rgba(200,167,106,0.25)`, fontFamily: DISPLAY, fontSize: 15, letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.2s" }}>
                  Keep Pillar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FORGE MODAL WRAPPED SAFE ── */}
      <AddPillarSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} onSave={addHabit} />
      {editHabit && (
        <AddPillarSheet 
          isOpen={!!editHabit} 
          onClose={() => setEditHabit(null)} 
          onSave={(data) => {
            updateHabit(editHabit.id, data);
            setEditHabit(null);
            if ("vibrate" in navigator) try { navigator.vibrate([15, 60, 15]); } catch {}
          }} 
          initialHabit={editHabit} 
        />
      )}

    </div>
  );
}

function ActionBtn({ icon, label, description, onClick, danger }: { icon: React.ReactNode, label: string, description?: string, onClick: () => void, danger?: boolean }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: danger ? "rgba(255,74,74,0.06)" : "rgba(10,8,6,0.5)", border: `1px solid ${danger ? "rgba(255,74,74,0.15)" : BORDER}`, borderRadius: 14, color: danger ? "#ff6b6b" : "rgba(255,250,240,0.9)", fontSize: 15, fontFamily: UI, cursor: "pointer", textAlign: "left", transition: "background 0.2s" }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: danger ? "rgba(255,74,74,0.08)" : "rgba(200,167,106,0.06)", border: `1px solid ${danger ? "rgba(255,74,74,0.15)" : "rgba(200,167,106,0.15)"}`, display: "grid", placeItems: "center", flexShrink: 0, color: danger ? "#ff6b6b" : GOLD }}>
        {icon}
      </div>
      <div>
        <div>{label}</div>
        {description && <div style={{ fontSize: 11, color: danger ? "rgba(255,150,150,0.5)" : "rgba(200,167,106,0.5)", marginTop: 2 }}>{description}</div>}
      </div>
    </motion.button>
  );
}

function StatBox({ label, value, sub, children }: { label: string; value: string; sub: string; children: React.ReactNode }) {
  return (
    <motion.div whileHover={{ y: -2 }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", background: MARBLE, padding: "16px 8px", borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: "0 10px 25px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
      <div style={{ fontSize: 8, letterSpacing: "0.2em", color: "rgba(200,167,106,0.7)", marginBottom: 16 }}>{label}</div>
      <div style={{ width: 52, height: 52, borderRadius: "50%", border: `1px solid rgba(220,185,110,0.4)`, display: "grid", placeItems: "center", background: "rgba(10,8,6,0.8)", marginBottom: 16, boxShadow: "0 0 15px rgba(220,185,110,0.15), inset 0 2px 4px rgba(0,0,0,0.5)" }}>
        {children}
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 26, color: BRIGHT, marginBottom: 6, textShadow: "0 0 10px rgba(220,185,110,0.3)" }}>{value}</div>
      <div style={{ fontSize: 9, color: "rgba(160,150,130,0.7)", letterSpacing: "0.05em" }}>{sub}</div>
    </motion.div>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
      <div style={{ height: 1, flex: 1, background: "linear-gradient(to right, transparent, rgba(220,185,110,0.3))" }} />
      <div style={{ fontSize: 11, letterSpacing: "0.25em", color: BRIGHT, textShadow: "0 0 8px rgba(220,185,110,0.3)" }}>{title}</div>
      <div style={{ height: 1, flex: 1, background: "linear-gradient(to left, transparent, rgba(220,185,110,0.3))" }} />
    </div>
  );
}

function Relic({ icon, days, title, achieved }: { icon: string; days: number; title: string; achieved: boolean }) {
  return (
    <motion.div whileHover={{ scale: achieved ? 1.05 : 1, y: achieved ? -4 : 0 }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", opacity: achieved ? 1 : 0.3, filter: achieved ? "none" : "grayscale(100%)", background: MARBLE, padding: "20px 8px", borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: achieved ? "0 10px 30px rgba(220,185,110,0.15), inset 0 1px 0 rgba(255,255,255,0.05)" : "none" }}>
      <div style={{ fontSize: 34, marginBottom: 12, filter: achieved ? "drop-shadow(0 0 15px rgba(220,185,110,0.6))" : "none" }}>{icon}</div>
      <div style={{ fontSize: 10, letterSpacing: "0.15em", color: BRIGHT, textShadow: achieved ? "0 0 8px rgba(220,185,110,0.4)" : "none" }}>{days} DAYS</div>
      <div style={{ fontSize: 9, color: "rgba(180,160,130,0.8)", marginTop: 6, textAlign: "center", fontFamily: DISPLAY }}>{title}</div>
    </motion.div>
  );
}

// ─── PREMIUM FORGE PILLAR MODAL ───────────────────────────────────────────────────────

function AddPillarSheet({ isOpen, onClose, onSave, initialHabit }: { isOpen: boolean; onClose: () => void; onSave: (h: Omit<Habit, "id" | "createdAt" | "color">) => void; initialHabit?: Habit | null; }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICONS[0].key);
  const [category, setCategory] = useState<HabitCategory>("Vitality");
  const [frequency, setFrequency] = useState<Frequency>("Daily");
  const [difficulty, setDifficulty] = useState<Difficulty>("Initiate");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(initialHabit?.name || "");
      setIcon(initialHabit?.icon || ICONS[0].key);
      setCategory(initialHabit?.category || "Vitality");
      setFrequency(initialHabit?.frequency || "Daily");
      setDifficulty(initialHabit?.difficulty || "Initiate");
      setError("");
    }
  }, [isOpen, initialHabit]);

  const handleForge = () => {
    if (!name.trim()) {
      setError("A pillar must have a name to stand the test of time.");
      if ("vibrate" in navigator) try { navigator.vibrate(20); } catch {}
      return;
    }
    setError("");
    onSave({ name: name.trim(), icon, category, frequency, difficulty });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={onClose} 
            style={{ position: "absolute", inset: 0, background: "rgba(4,5,8,0.85)", backdropFilter: "blur(10px)" }} 
          />
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }}
            style={{
              position: "relative",
              background: MARBLE, borderTop: `1px solid ${GOLD}`,
              borderTopLeftRadius: 32, borderTopRightRadius: 32,
              padding: "32px 24px calc(40px + env(safe-area-inset-bottom, 0px))",
              maxHeight: "92vh", overflowY: "auto",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 36, position: "relative" }}>
              <button onClick={onClose} style={{ position: "absolute", right: 0, top: -8, background: "rgba(20,16,10,0.8)", border: `1px solid ${BORDER}`, borderRadius: "50%", width: 36, height: 36, color: BRIGHT, cursor: "pointer", display: "grid", placeItems: "center", transition: "all 0.2s", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>✕</button>
              
              <h3 style={{ fontFamily: DISPLAY, fontWeight: 300, fontSize: 26, margin: "0 0 10px", color: BRIGHT, letterSpacing: "0.15em", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>{initialHabit ? "EDIT PILLAR" : "FORGE NEW PILLAR"}</h3>
              <p style={{ fontFamily: DISPLAY, fontSize: 13, color: "rgba(200,167,106,0.7)", fontStyle: "italic", margin: 0 }}>{initialHabit ? "Modify the structure of this discipline." : "Create a discipline that shapes your future."}</p>
              
              {/* Ornamental Divider */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 18 }}>
                <div style={{ height: 1, width: 40, background: "linear-gradient(to right, transparent, rgba(220,185,110,0.5))" }} />
                <svg width={20} height={12} viewBox="0 0 20 12" fill="none">
                  <path d="M2 6 L10 2 L18 6" stroke={BRIGHT} strokeWidth={1} />
                  <path d="M2 6 L10 10 L18 6" stroke={BRIGHT} strokeWidth={1} />
                </svg>
                <div style={{ height: 1, width: 40, background: "linear-gradient(to left, transparent, rgba(220,185,110,0.5))" }} />
              </div>
            </div>

            <SectionLabel>PILLAR NAME</SectionLabel>
            <div style={{ position: "relative", marginBottom: error ? 12 : 36 }}>
              <input
                autoFocus value={name} onChange={e => { setName(e.target.value); setError(""); }}
                placeholder="Enter pillar name"
                style={{
                  width: "100%", background: "rgba(10,8,5,0.7)", border: `1px solid ${error ? "#ff4a4a" : BORDER}`,
                  borderRadius: 12, color: "rgba(255,250,240,0.95)",
                  fontFamily: UI, fontSize: 16, padding: "18px 20px", outline: "none",
                  boxShadow: error ? "0 0 10px rgba(255,74,74,0.2), inset 0 2px 10px rgba(0,0,0,0.6)" : "inset 0 2px 10px rgba(0,0,0,0.6)", 
                  transition: "all 0.3s"
                }}
                onFocus={e => !error && (e.target.style.borderColor = BRIGHT)}
                onBlur={e => !error && (e.target.style.borderColor = BORDER)}
              />
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ color: "#ff6b6b", fontSize: 11, fontFamily: DISPLAY, letterSpacing: "0.05em", marginBottom: 24, padding: "0 12px", display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <SectionLabel>PILLAR ARCHETYPES</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px 12px", marginBottom: 36 }}>
              {ICONS.map(({ key, label, svg }) => {
                const active = key === icon;
                return (
                  <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <button onClick={() => setIcon(key)} style={{
                      width: 56, height: 56, borderRadius: "50%",
                      background: active ? "linear-gradient(145deg, rgba(220,185,110,0.15), rgba(10,8,5,0.8))" : "rgba(10,8,5,0.6)",
                      border: `1px solid ${active ? BRIGHT : BORDER}`,
                      color: active ? BRIGHT : "rgba(180,150,110,0.5)", cursor: "pointer",
                      display: "grid", placeItems: "center", padding: 14,
                      boxShadow: active ? `0 0 20px rgba(220,185,110,0.25), inset 0 2px 5px rgba(0,0,0,0.5)` : "inset 0 2px 5px rgba(0,0,0,0.5)", 
                      transition: "all 0.3s"
                    }}>
                      {svg}
                    </button>
                    <span style={{ fontSize: 9, fontFamily: DISPLAY, color: active ? BRIGHT : "rgba(150,140,120,0.6)", letterSpacing: "0.05em" }}>{label}</span>
                  </div>
                );
              })}
            </div>

            <SectionLabel>DOMAIN</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 36 }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{
                  flex: "1 1 auto", padding: "14px 0", borderRadius: 12,
                  background: c === category ? "rgba(220,185,110,0.12)" : "rgba(10,8,5,0.6)",
                  border: `1px solid ${c === category ? BRIGHT : BORDER}`,
                  color: c === category ? BRIGHT : "rgba(200,167,106,0.5)",
                  fontFamily: DISPLAY, fontSize: 13, cursor: "pointer", transition: "all 0.3s",
                  boxShadow: c === category ? "0 0 15px rgba(220,185,110,0.15)" : "inset 0 2px 5px rgba(0,0,0,0.5)",
                }}>{c}</button>
              ))}
            </div>

            <SectionLabel>RHYTHM OF PRACTICE</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 36 }}>
              {FREQS.map((f, i) => {
                const active = frequency === f;
                return (
                  <button key={f} onClick={() => setFrequency(f)} style={{
                    padding: "20px 8px", borderRadius: 12,
                    background: active ? "linear-gradient(180deg, rgba(220,185,110,0.15), rgba(10,8,5,0.8))" : "rgba(10,8,5,0.6)",
                    border: `1px solid ${active ? BRIGHT : BORDER}`,
                    color: active ? BRIGHT : "rgba(200,167,106,0.5)",
                    fontFamily: DISPLAY, fontSize: 12, cursor: "pointer", textAlign: "center",
                    boxShadow: active ? `0 0 20px rgba(220,185,110,0.15), inset 0 2px 5px rgba(0,0,0,0.5)` : "inset 0 2px 5px rgba(0,0,0,0.5)",
                    transition: "all 0.3s", position: "relative", overflow: "hidden"
                  }}>
                    {active && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: BRIGHT, boxShadow: `0 0 10px ${BRIGHT}` }} />}
                    <div style={{ fontSize: 18, marginBottom: 8, color: active ? BRIGHT : "rgba(200,167,106,0.3)" }}>
                      {i === 0 ? "☀️" : i === 1 ? "🏛️" : i === 2 ? "🌿" : "⚙️"}
                    </div>
                    {f}
                  </button>
                );
              })}
            </div>

            <SectionLabel>DISCIPLINE LEVEL</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 36 }}>
              {DIFFS.map((d, i) => {
                const active = difficulty === d;
                return (
                  <button key={d} onClick={() => setDifficulty(d)} style={{
                    padding: "24px 10px", borderRadius: 14,
                    background: active ? "linear-gradient(180deg, rgba(220,185,110,0.15), rgba(10,8,5,0.8))" : "rgba(10,8,5,0.6)",
                    border: `1px solid ${active ? BRIGHT : BORDER}`,
                    color: active ? BRIGHT : "rgba(200,167,106,0.5)",
                    cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                    boxShadow: active ? `0 0 25px rgba(220,185,110,0.15), inset 0 2px 5px rgba(0,0,0,0.5)` : "inset 0 2px 5px rgba(0,0,0,0.5)",
                    transition: "all 0.3s", position: "relative"
                  }}>
                    {active && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: BRIGHT, boxShadow: `0 0 10px ${BRIGHT}` }} />}
                    <div style={{ display: "flex", gap: 4, height: 32, alignItems: "flex-end" }}>
                      {Array.from({ length: i + 1 }).map((_, idx) => (
                        <svg key={idx} width={14} height={32} viewBox="0 0 14 32" fill="none" stroke={active ? BRIGHT : "rgba(200,167,106,0.4)"} strokeWidth={1.5}>
                          <path d="M2 2h10M4 2v28M10 2v28M2 30h10" />
                        </svg>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontFamily: DISPLAY, fontSize: 15, letterSpacing: "0.1em" }}>{d.toUpperCase()}</span>
                      <span style={{ fontSize: 9, color: active ? "rgba(220,185,110,0.8)" : "rgba(150,140,120,0.5)", fontFamily: UI }}>
                        {i === 0 ? "Light" : i === 1 ? "Moderate" : "Intense"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <SectionLabel>SCROLL OF INTENTION (OPTIONAL)</SectionLabel>
            <textarea
              value={purpose} onChange={e => setPurpose(e.target.value)}
              placeholder="Why must this pillar exist in your life?"
              style={{
                width: "100%", minHeight: 100, background: "rgba(10,8,5,0.7)", border: `1px solid ${BORDER}`,
                borderRadius: 12, color: "rgba(255,250,240,0.95)",
                fontFamily: DISPLAY, fontStyle: "italic", fontSize: 15, padding: "18px 20px", outline: "none",
                marginBottom: 40, boxShadow: "inset 0 2px 10px rgba(0,0,0,0.6)", resize: "none",
                transition: "border 0.3s"
              }}
              onFocus={e => e.target.style.borderColor = BRIGHT}
              onBlur={e => e.target.style.borderColor = BORDER}
            />

            <button
              className="forge-submit-btn"
              onClick={handleForge}
              style={{
                width: "100%", height: 72, borderRadius: 16,
                background: "linear-gradient(145deg, rgba(20,16,10,0.95), rgba(12,10,6,0.98))",
                border: `1px solid ${BRIGHT}`,
                color: BRIGHT,
                fontFamily: DISPLAY, fontSize: 18, letterSpacing: "0.2em",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
                boxShadow: "0 0 40px rgba(220,185,110,0.2), inset 0 2px 5px rgba(255,255,255,0.1)",
                position: "relative", overflow: "hidden", transition: "all 0.3s"
              }}
            >
              <div className="forge-sweep" style={{ position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(220,185,110,0.2), transparent)", animation: "sweep 3s infinite" }} />
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                <path d="M3 10L12 4L21 10M5 10v10M9 10v10M15 10v10M19 10v10M3 20h18" />
              </svg>
              {initialHabit ? "SAVE CHANGES" : "FORGE PILLAR"}
            </button>
            <style>{`
              .forge-submit-btn:hover { border-color: #fff !important; box-shadow: 0 0 50px rgba(220,185,110,0.4), inset 0 2px 10px rgba(255,255,255,0.15) !important; text-shadow: 0 0 10px rgba(220,185,110,0.8); }
            `}</style>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, letterSpacing: "0.25em", color: "rgba(200,167,106,0.7)", marginBottom: 14, textTransform: "uppercase", fontFamily: DISPLAY }}>{children}</div>;
}
