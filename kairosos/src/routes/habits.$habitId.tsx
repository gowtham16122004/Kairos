import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Habit, loadHabits, loadCompletions, getReflection, setReflection,
  statusOn, dayKey, currentStreak, bestStreak, updateHabit, saveHabits
} from "@/lib/habits-store";
import { ICON_MAP, ICONS } from "./habits";

export const Route = createFileRoute("/habits/$habitId")({
  component: PillarDetailPage,
});

const BG       = "#040508";
const MARBLE   = "linear-gradient(145deg, rgba(20,16,10,0.95), rgba(12,10,6,0.98))";
const BORDER   = "rgba(200,167,106,0.2)";
const GOLD     = "rgba(200,167,106,0.8)";
const BRIGHT   = "rgba(220,185,110,1)";
const DISPLAY  = "var(--font-sanctuary-display)";
const UI       = "var(--font-sanctuary-ui)";

type HabitCategory = "Vitality" | "Wisdom" | "Mastery" | "Character" | "Legacy";
type Frequency = "Daily" | "Weekdays" | "Weekends" | "Custom";
type Difficulty = "Initiate" | "Guardian" | "Spartan";

const CATEGORIES: HabitCategory[] = ["Vitality", "Wisdom", "Mastery", "Character", "Legacy"];
const FREQS: Frequency[] = ["Daily", "Weekdays", "Weekends", "Custom"];
const DIFFS: Difficulty[] = ["Initiate", "Guardian", "Spartan"];

function PillarDetailPage() {
  const { habitId } = Route.useParams();
  const navigate = useNavigate();
  
  const [habit, setHabit] = useState<Habit | undefined>(() => loadHabits().find(h => h.id === habitId));
  const [comps, setComps] = useState(() => loadCompletions().filter(c => c.habitId === habitId));
  const [today] = useState(() => new Date());
  
  const [reflection, setReflectionText] = useState("");
  const [saved, setSaved] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Listen for habit changes
  useEffect(() => {
    const onChange = () => {
      setHabit(loadHabits().find(h => h.id === habitId));
      setComps(loadCompletions().filter(c => c.habitId === habitId));
    };
    window.addEventListener("habits:changed", onChange);
    return () => window.removeEventListener("habits:changed", onChange);
  }, [habitId]);

  useEffect(() => {
    const todayStr = dayKey(today);
    const r = getReflection(habitId, todayStr);
    if (r) setReflectionText(r.content);
  }, [habitId, today]);

  // Auto-save reflection with indicator
  useEffect(() => {
    const todayStr = dayKey(today);
    const timer = setTimeout(() => {
      setReflection(habitId, todayStr, reflection);
      if (reflection.trim()) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [reflection, habitId, today]);

  const handleSaveEdit = useCallback((data: Omit<Habit, "id" | "createdAt" | "color">) => {
    updateHabit(habitId, data);
    setShowEdit(false);
    if ("vibrate" in navigator) try { navigator.vibrate([15, 60, 15]); } catch {}
  }, [habitId]);

  if (!habit) {
    return (
      <div style={{ height: "100vh", background: BG, color: BRIGHT, display: "grid", placeItems: "center", fontFamily: DISPLAY }}>
        <div style={{ textAlign: "center" }}>
          <svg width={60} height={60} viewBox="0 0 24 24" fill="none" stroke="rgba(220,185,110,0.4)" strokeWidth={1} style={{ marginBottom: 16 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p style={{ fontSize: 18, marginBottom: 16 }}>Pillar not found.</p>
          <button onClick={() => navigate({ to: '/habits' })} style={{ background: "transparent", border: `1px solid ${BRIGHT}`, color: BRIGHT, padding: "12px 24px", borderRadius: 10, fontFamily: DISPLAY, fontSize: 14, cursor: "pointer" }}>Return to Pillars</button>
        </div>
      </div>
    );
  }

  const streak = currentStreak(comps, habit.id, today);
  const longestStreak = bestStreak(comps, habit.id);
  const totalCompletions = comps.filter(c => c.status === "done").length;
  const createdDate = new Date(habit.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const daysSinceCreation = Math.max(1, Math.floor((today.getTime() - habit.createdAt) / 86400000) + 1);
  const completionRate = Math.round((totalCompletions / daysSinceCreation) * 100);

  // Calculate past 30 days history
  const history = useMemo(() => {
    const days = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      const st = statusOn(comps, habit.id, k);
      days.push({
        date: d,
        key: k,
        status: st,
        displayDate: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      });
    }
    return days;
  }, [comps, habit.id, today]);

  const visibleHistory = showHistory ? history : history.slice(0, 7);

  return (
    <div style={{
      height: "100vh", background: BG, color: "rgba(230,220,200,0.92)",
      fontFamily: UI, position: "relative", overflowX: "hidden", overflowY: "auto",
      paddingBottom: 40
    }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(4,5,8,0.9)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <button onClick={() => navigate({ to: '/habits' })} style={{ background: "none", border: "none", color: BRIGHT, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: 0 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span style={{ fontFamily: DISPLAY, fontSize: 13, letterSpacing: "0.1em" }}>BACK</span>
        </button>
        <div style={{ fontFamily: DISPLAY, fontSize: 14, letterSpacing: "0.15em", color: BRIGHT, textShadow: "0 0 10px rgba(220,185,110,0.3)" }}>
          PILLAR DETAIL
        </div>
        <button onClick={() => setShowEdit(true)} style={{ background: "none", border: `1px solid rgba(200,167,106,0.3)`, borderRadius: "50%", width: 36, height: 36, display: "grid", placeItems: "center", color: BRIGHT, cursor: "pointer", transition: "all 0.2s" }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </button>
      </header>

      <main style={{ padding: "24px 20px" }}>
        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{
          background: MARBLE, borderRadius: 24, border: `1px solid ${BORDER}`,
          padding: 36, display: "flex", flexDirection: "column", alignItems: "center",
          boxShadow: "0 10px 40px rgba(0,0,0,0.6), inset 0 2px 10px rgba(255,255,255,0.05)",
          marginBottom: 32, position: "relative", overflow: "hidden"
        }}>
          {/* Ambient glow */}
          <motion.div 
            animate={{ opacity: [0.03, 0.07, 0.03], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 200, height: 200, background: `radial-gradient(circle, rgba(220,185,110,0.12), transparent 70%)`, borderRadius: "50%" }} 
          />
          
          <div style={{ width: 80, height: 80, borderRadius: "50%", border: `1px solid ${BRIGHT}`, display: "grid", placeItems: "center", color: BRIGHT, boxShadow: `0 0 30px rgba(220,185,110,0.2), inset 0 2px 10px rgba(0,0,0,0.5)`, marginBottom: 20, background: "rgba(10,8,6,0.8)", position: "relative", zIndex: 1 }}>
            <div style={{ width: 40, height: 40 }}>{ICON_MAP[habit.icon] || ICON_MAP.mastery}</div>
          </div>
          
          <h1 style={{ fontFamily: DISPLAY, fontSize: 28, margin: "0 0 6px", color: "rgba(255,250,240,0.95)", letterSpacing: "0.08em", textShadow: "0 2px 10px rgba(0,0,0,0.8)", textAlign: "center", position: "relative", zIndex: 1 }}>{habit.name.toUpperCase()}</h1>
          <div style={{ fontSize: 10, letterSpacing: "0.25em", color: GOLD, textTransform: "uppercase", marginBottom: 28, position: "relative", zIndex: 1 }}>
            {habit.category}
          </div>
          
          {/* Stat trio */}
          <div style={{ display: "flex", gap: 0, width: "100%", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <div style={{ flex: 1, textAlign: "center", borderRight: `1px solid ${BORDER}` }}>
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }} style={{ fontFamily: DISPLAY, fontSize: 28, color: BRIGHT, textShadow: `0 0 15px rgba(220,185,110,0.4)` }}>{streak}</motion.div>
              <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "rgba(160,150,130,0.7)", textTransform: "uppercase", marginTop: 4 }}>Current Streak</div>
            </div>
            <div style={{ flex: 1, textAlign: "center", borderRight: `1px solid ${BORDER}` }}>
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: "spring" }} style={{ fontFamily: DISPLAY, fontSize: 28, color: BRIGHT, textShadow: `0 0 15px rgba(220,185,110,0.4)` }}>{longestStreak}</motion.div>
              <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "rgba(160,150,130,0.7)", textTransform: "uppercase", marginTop: 4 }}>Longest Streak</div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: "spring" }} style={{ fontFamily: DISPLAY, fontSize: 28, color: BRIGHT, textShadow: `0 0 15px rgba(220,185,110,0.4)` }}>{completionRate}%</motion.div>
              <div style={{ fontSize: 8, letterSpacing: "0.15em", color: "rgba(160,150,130,0.7)", textTransform: "uppercase", marginTop: 4 }}>Completion</div>
            </div>
          </div>
        </motion.div>

        {/* Discipline Statistics */}
        <SectionTitle title="Discipline Statistics" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 40 }}>
          <StatCard
            icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={BRIGHT} strokeWidth={1.5} strokeLinecap="round"><path d="M8 10c0-4 4-8 4-8s4 4 4 8c0 3-2 5-4 5s-4-2-4-5z"/><path d="M10 15v7h4v-7"/></svg>}
            label="Current Streak"
            value={`${streak} ${streak === 1 ? 'Day' : 'Days'}`}
          />
          <StatCard
            icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={BRIGHT} strokeWidth={1.5} strokeLinecap="round"><path d="M12 2v20M8 6h8M6 22h12M12 2l-4 4M12 2l4 4" /></svg>}
            label="Longest Streak"
            value={`${longestStreak} ${longestStreak === 1 ? 'Day' : 'Days'}`}
          />
          <StatCard
            icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={BRIGHT} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
            label="Total Completions"
            value={String(totalCompletions)}
          />
          <StatCard
            icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={BRIGHT} strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
            label="Forged On"
            value={createdDate}
            smallValue
          />
        </div>

        {/* Today's Reflection */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <SectionTitle title="Today's Reflection" noMargin />
          <AnimatePresence>
            {saved && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                style={{ fontSize: 10, color: BRIGHT, fontFamily: DISPLAY, letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 4 }}
              >
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={BRIGHT} strokeWidth={2} strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                Saved
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div style={{ marginBottom: 40, position: "relative" }}>
          <textarea
            value={reflection}
            onChange={e => setReflectionText(e.target.value)}
            placeholder="Record your thoughts after completing this discipline..."
            style={{
              width: "100%", minHeight: 120, background: "rgba(10,8,6,0.6)", border: `1px solid ${BORDER}`,
              borderRadius: 16, color: "rgba(255,250,240,0.9)", fontFamily: UI, fontSize: 14, padding: "20px",
              outline: "none", resize: "none", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)", transition: "border 0.3s",
              lineHeight: 1.6
            }}
            onFocus={e => e.target.style.borderColor = BRIGHT}
            onBlur={e => e.target.style.borderColor = BORDER}
          />
        </div>

        {/* Ancient Discipline Archive */}
        <SectionTitle title="Ancient Discipline Archive" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {visibleHistory.map((day, i) => (
            <motion.div 
              key={day.key} 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: i * 0.03, duration: 0.3 }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(10,8,6,0.5)", border: `1px solid ${day.status === "done" ? "rgba(200,167,106,0.15)" : "rgba(100,80,60,0.1)"}`, 
                borderRadius: 12, padding: "14px 18px",
                transition: "border 0.3s"
              }}
            >
              <div>
                <div style={{ fontFamily: UI, fontSize: 13, color: "rgba(255,250,240,0.8)" }}>
                  {day.displayDate}
                </div>
                <div style={{ fontSize: 11, marginTop: 4, color: day.status === "done" ? BRIGHT : "rgba(255,100,100,0.6)", fontFamily: DISPLAY, letterSpacing: "0.02em" }}>
                  {day.status === "done" ? "Discipline Completed" : day.status === "partial" ? "Partial Completion" : "Missed Discipline"}
                </div>
              </div>
              <div style={{ 
                width: 14, height: 14, borderRadius: "50%", 
                background: day.status === "done" ? BRIGHT : day.status === "partial" ? "rgba(200,167,106,0.4)" : "rgba(30,20,20,0.8)", 
                boxShadow: day.status === "done" ? `0 0 10px rgba(220,185,110,0.5)` : "inset 0 2px 4px rgba(0,0,0,0.8)",
                border: day.status === "done" ? "none" : `1px solid rgba(200,167,106,0.1)`,
                transition: "all 0.3s"
              }} />
            </motion.div>
          ))}
        </div>

        {/* Show More / Less Toggle */}
        {history.length > 7 && (
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              style={{ 
                background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 10,
                color: GOLD, fontFamily: DISPLAY, fontSize: 12, letterSpacing: "0.1em",
                padding: "10px 28px", cursor: "pointer", transition: "all 0.2s"
              }}
            >
              {showHistory ? "Show Less" : `Show All ${history.length} Days`}
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "30px 0 20px", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: 14, color: "rgba(220,205,175,0.6)", textShadow: "0 0 10px rgba(0,0,0,0.5)" }}>
            Every day you show up is a victory.
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {showEdit && habit && (
        <EditPillarSheet 
          isOpen={showEdit} 
          onClose={() => setShowEdit(false)} 
          onSave={handleSaveEdit} 
          initialHabit={habit} 
        />
      )}
    </div>
  );
}

// ─── Stat Card Component ────────────────────────────────────────────────────

function StatCard({ icon, label, value, smallValue }: { icon: React.ReactNode; label: string; value: string; smallValue?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ 
        background: MARBLE, borderRadius: 16, border: `1px solid ${BORDER}`, 
        padding: 20, boxShadow: "0 4px 15px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
        display: "flex", flexDirection: "column", gap: 12
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid rgba(200,167,106,0.25)`, display: "grid", placeItems: "center", background: "rgba(220,185,110,0.04)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)" }}>
          {icon}
        </div>
        <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(200,167,106,0.6)", textTransform: "uppercase" }}>{label}</div>
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: smallValue ? 13 : 22, color: smallValue ? "rgba(220,205,175,0.9)" : BRIGHT, textShadow: smallValue ? "none" : `0 0 8px rgba(220,185,110,0.3)` }}>{value}</div>
    </motion.div>
  );
}

// ─── Section Title ──────────────────────────────────────────────────────────

function SectionTitle({ title, noMargin }: { title: string; noMargin?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: noMargin ? 0 : 20 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.2em", color: BRIGHT, textTransform: "uppercase", textShadow: "0 0 8px rgba(220,185,110,0.3)" }}>{title}</div>
      <div style={{ height: 1, flex: 1, background: "linear-gradient(to right, rgba(220,185,110,0.3), transparent)" }} />
    </div>
  );
}

// ─── Inline Edit Pillar Sheet ───────────────────────────────────────────────
// Simplified version of AddPillarSheet from habits.tsx, embedded here to avoid circular imports

function EditPillarSheet({ isOpen, onClose, onSave, initialHabit }: { isOpen: boolean; onClose: () => void; onSave: (h: Omit<Habit, "id" | "createdAt" | "color">) => void; initialHabit: Habit; }) {
  const [name, setName] = useState(initialHabit.name);
  const [icon, setIcon] = useState(initialHabit.icon);
  const [category, setCategory] = useState<HabitCategory>(initialHabit.category as HabitCategory);
  const [frequency, setFrequency] = useState<Frequency>(initialHabit.frequency as Frequency);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialHabit.difficulty as Difficulty);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(initialHabit.name);
      setIcon(initialHabit.icon);
      setCategory(initialHabit.category as HabitCategory);
      setFrequency(initialHabit.frequency as Frequency);
      setDifficulty(initialHabit.difficulty as Difficulty);
      setError("");
    }
  }, [isOpen, initialHabit]);

  const handleSave = () => {
    if (!name.trim()) {
      setError("A pillar must have a name.");
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
            <div style={{ textAlign: "center", marginBottom: 30, position: "relative" }}>
              <button onClick={onClose} style={{ position: "absolute", right: 0, top: -8, background: "rgba(20,16,10,0.8)", border: `1px solid ${BORDER}`, borderRadius: "50%", width: 36, height: 36, color: BRIGHT, cursor: "pointer", display: "grid", placeItems: "center" }}>✕</button>
              <h3 style={{ fontFamily: DISPLAY, fontWeight: 300, fontSize: 24, margin: "0 0 8px", color: BRIGHT, letterSpacing: "0.15em" }}>EDIT PILLAR</h3>
              <p style={{ fontFamily: DISPLAY, fontSize: 12, color: "rgba(200,167,106,0.7)", fontStyle: "italic", margin: 0 }}>Modify the structure of this discipline.</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 16 }}>
                <div style={{ height: 1, width: 40, background: "linear-gradient(to right, transparent, rgba(220,185,110,0.5))" }} />
                <svg width={16} height={10} viewBox="0 0 20 12" fill="none">
                  <path d="M2 6 L10 2 L18 6" stroke={BRIGHT} strokeWidth={1} />
                  <path d="M2 6 L10 10 L18 6" stroke={BRIGHT} strokeWidth={1} />
                </svg>
                <div style={{ height: 1, width: 40, background: "linear-gradient(to left, transparent, rgba(220,185,110,0.5))" }} />
              </div>
            </div>

            {/* Pillar Name */}
            <FieldLabel>PILLAR NAME</FieldLabel>
            <div style={{ marginBottom: error ? 12 : 28 }}>
              <input
                autoFocus value={name} onChange={e => { setName(e.target.value); setError(""); }}
                placeholder="Enter pillar name"
                style={{
                  width: "100%", background: "rgba(10,8,5,0.7)", border: `1px solid ${error ? "#ff4a4a" : BORDER}`,
                  borderRadius: 12, color: "rgba(255,250,240,0.95)",
                  fontFamily: UI, fontSize: 16, padding: "16px 18px", outline: "none",
                  boxShadow: "inset 0 2px 10px rgba(0,0,0,0.6)", transition: "all 0.3s"
                }}
                onFocus={e => !error && (e.target.style.borderColor = BRIGHT)}
                onBlur={e => !error && (e.target.style.borderColor = BORDER)}
              />
            </div>
            {error && <div style={{ color: "#ff6b6b", fontSize: 11, fontFamily: DISPLAY, marginBottom: 20 }}>{error}</div>}

            {/* Category */}
            <FieldLabel>CATEGORY</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{
                  flex: "1 1 auto", padding: "12px 0", borderRadius: 10,
                  background: c === category ? "rgba(220,185,110,0.12)" : "rgba(10,8,5,0.6)",
                  border: `1px solid ${c === category ? BRIGHT : BORDER}`,
                  color: c === category ? BRIGHT : "rgba(200,167,106,0.5)",
                  fontFamily: DISPLAY, fontSize: 12, cursor: "pointer", transition: "all 0.3s",
                }}>
                  {c}
                </button>
              ))}
            </div>

            {/* Icon */}
            <FieldLabel>ICON</FieldLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px 10px", marginBottom: 28 }}>
              {ICONS.map(({ key, label, svg }) => {
                const active = key === icon;
                return (
                  <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <button onClick={() => setIcon(key)} style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: active ? "linear-gradient(145deg, rgba(220,185,110,0.15), rgba(10,8,5,0.8))" : "rgba(10,8,5,0.6)",
                      border: `1px solid ${active ? BRIGHT : BORDER}`,
                      color: active ? BRIGHT : "rgba(180,150,110,0.5)", cursor: "pointer",
                      display: "grid", placeItems: "center", padding: 12,
                      boxShadow: active ? `0 0 15px rgba(220,185,110,0.2)` : "inset 0 2px 5px rgba(0,0,0,0.5)",
                      transition: "all 0.3s"
                    }}>
                      {svg}
                    </button>
                    <span style={{ fontSize: 8, fontFamily: DISPLAY, color: active ? BRIGHT : "rgba(150,140,120,0.6)" }}>{label}</span>
                  </div>
                );
              })}
            </div>

            {/* Frequency */}
            <FieldLabel>FREQUENCY</FieldLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 28 }}>
              {FREQS.map(f => {
                const active = frequency === f;
                return (
                  <button key={f} onClick={() => setFrequency(f)} style={{
                    padding: "14px 6px", borderRadius: 10,
                    background: active ? "rgba(220,185,110,0.12)" : "rgba(10,8,5,0.6)",
                    border: `1px solid ${active ? BRIGHT : BORDER}`,
                    color: active ? BRIGHT : "rgba(200,167,106,0.5)",
                    fontFamily: DISPLAY, fontSize: 11, cursor: "pointer", textAlign: "center",
                    transition: "all 0.3s"
                  }}>
                    {f}
                  </button>
                );
              })}
            </div>

            {/* Difficulty */}
            <FieldLabel>DISCIPLINE LEVEL</FieldLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 32 }}>
              {DIFFS.map((d, i) => {
                const active = difficulty === d;
                return (
                  <button key={d} onClick={() => setDifficulty(d)} style={{
                    padding: "16px 8px", borderRadius: 12,
                    background: active ? "rgba(220,185,110,0.12)" : "rgba(10,8,5,0.6)",
                    border: `1px solid ${active ? BRIGHT : BORDER}`,
                    color: active ? BRIGHT : "rgba(200,167,106,0.5)",
                    cursor: "pointer", textAlign: "center",
                    fontFamily: DISPLAY, fontSize: 13, letterSpacing: "0.05em",
                    transition: "all 0.3s"
                  }}>
                    {d}
                  </button>
                );
              })}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              style={{
                width: "100%", height: 64, borderRadius: 14,
                background: "linear-gradient(145deg, rgba(20,16,10,0.95), rgba(12,10,6,0.98))",
                border: `1px solid ${BRIGHT}`,
                color: BRIGHT,
                fontFamily: DISPLAY, fontSize: 16, letterSpacing: "0.2em",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                boxShadow: "0 0 30px rgba(220,185,110,0.15), inset 0 2px 5px rgba(255,255,255,0.1)",
                position: "relative", overflow: "hidden", transition: "all 0.3s"
              }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              SAVE CHANGES
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "rgba(200,167,106,0.7)", marginBottom: 12, textTransform: "uppercase", fontFamily: DISPLAY }}>{children}</div>;
}
