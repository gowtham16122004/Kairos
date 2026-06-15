import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, GripVertical, Plus, Trash2, Volume2, Clock, Moon, Sun, Briefcase, Zap, ShieldAlert, Heart, BellRing, Hourglass } from "lucide-react";
import { MobileTopBar } from "@/components/mobile/MobileTopBar";
import { BottomNav } from "@/components/mobile/BottomNav";
import { speak } from "@/lib/audio-engine";
import {
  useBlocks,
  type BlockDef,
  type NeuralLoad,
  type Energy,
  NEURAL_LOADS,
  ENERGIES,
  DEFAULT_BLOCKS,
  parseTimeRange,
  genBlockId,
  cycle,
} from "@/lib/blocks-store";

import bgImage from "@/assets/analytics mode background.png";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — Routine OS" },
      { name: "description", content: "Configure your operating system." },
    ],
  }),
});

const MARBLE   = "linear-gradient(145deg, rgba(22,18,14,0.95), rgba(12,10,8,0.98))";
const BORDER   = "rgba(200,167,106,0.2)";
const GOLD     = "rgba(200,167,106,0.8)";
const BRIGHT   = "rgba(220,185,110,1)";
const DISPLAY  = "var(--font-sanctuary-display)";
const UI       = "var(--font-sanctuary-ui)";

function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  
  // Existing Preferences
  const [voice, setVoice] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [autosheet, setAutosheet] = useState(true);
  
  // New Configurations
  const [wakeTime, setWakeTime] = useState("06:00");
  const [sleepTime, setSleepTime] = useState("22:00");
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:00");
  const [focusLength, setFocusLength] = useState("45");
  const [strictMode, setStrictMode] = useState(false);
  const [recoveryLength, setRecoveryLength] = useState("15");
  const [reminders, setReminders] = useState(true);

  // Stats / Data
  const [streak, setStreak] = useState(0);
  const [deepCycles, setDeepCycles] = useState(0);
  const [thoughtCount, setThoughtCount] = useState(0);
  const [logCount, setLogCount] = useState(0);

  // UI State
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [time, setTime] = useState(new Date());

  const [blocks, setBlocks] = useBlocks();

  const flashSaved = () => {
    setSavedFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(false), 2000);
  };

  const updateBlock = (id: string, patch: Partial<BlockDef>) => {
    setBlocks(blocks.map(b => (b.id === id ? { ...b, ...patch } : b)));
    flashSaved();
  };
  
  const onTimeBlur = (id: string, timeStr: string) => {
    const parsed = parseTimeRange(timeStr);
    if (parsed) updateBlock(id, { time: timeStr, start: parsed.start, end: parsed.end });
    else updateBlock(id, { time: timeStr });
  };
  
  const addBlock = () => {
    const last = blocks[blocks.length - 1];
    const start = last ? last.end : 6 * 60;
    const end = Math.min(start + 60, 24 * 60);
    const fmt = (m: number) => {
      const h24 = Math.floor(m / 60), mm = m % 60;
      const h12 = ((h24 + 11) % 12) + 1;
      const ap = h24 >= 12 ? "PM" : "AM";
      return `${h12}:${String(mm).padStart(2, "0")} ${ap}`;
    };
    const timeStr = `${fmt(start)} – ${fmt(end)}`;
    setBlocks([
      ...blocks,
      { id: genBlockId(), start, end, time: timeStr, label: "New Routine Block", neuralLoad: "LIGHT", energy: "STABLE" },
    ]);
    flashSaved();
  };
  
  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    flashSaved();
  };
  
  const resetBlocks = () => {
    if (!confirm("Restore Imperial Blueprint? All customized habits will be lost.")) return;
    setBlocks(DEFAULT_BLOCKS);
    flashSaved();
  };

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setTime(new Date()), 1000);
    
    try {
      setVoice(localStorage.getItem("st_voice") !== "0");
      setHaptics(localStorage.getItem("st_haptics") !== "0");
      setAutosheet(localStorage.getItem("st_autosheet") !== "0");
      
      setWakeTime(localStorage.getItem("st_wakeTime") || "06:00");
      setSleepTime(localStorage.getItem("st_sleepTime") || "22:00");
      setWorkStart(localStorage.getItem("st_workStart") || "09:00");
      setWorkEnd(localStorage.getItem("st_workEnd") || "17:00");
      setFocusLength(localStorage.getItem("st_focusLength") || "45");
      setStrictMode(localStorage.getItem("st_strictMode") === "1");
      setRecoveryLength(localStorage.getItem("st_recoveryLength") || "15");
      setReminders(localStorage.getItem("st_reminders") !== "0");

      setStreak(parseInt(localStorage.getItem("os_streak") ?? "0", 10) || 0);
      setDeepCycles(parseInt(localStorage.getItem("dm_cycles_week") ?? "0", 10) || 0);
      const t = JSON.parse(localStorage.getItem("dm_thoughts") ?? "[]");
      setThoughtCount(Array.isArray(t) ? t.length : 0);
      const r = JSON.parse(localStorage.getItem("rec_log") ?? "[]");
      setLogCount(Array.isArray(r) ? r.length : 0);
    } catch {}

    return () => clearInterval(interval);
  }, []);

  const persist = (k: string, v: string | boolean) => {
    try {
      if (typeof v === "boolean") {
        localStorage.setItem(k, v ? "1" : "0");
      } else {
        localStorage.setItem(k, v);
      }
      flashSaved();
    } catch {}
  };

  const clearAll = () => {
    if (!confirm("Burn the Archive? All records of your empire will turn to ash. This cannot be undone.")) return;
    try {
      Object.keys(localStorage).forEach(k => {
        if (
          k.startsWith("os_") ||
          k.startsWith("dm_") ||
          k.startsWith("rec_") ||
          k.startsWith("st_") ||
          k.startsWith("notes-")
        ) {
          localStorage.removeItem(k);
        }
      });
      window.location.reload();
    } catch {}
  };

  const testVoice = () => speak("The Oracle is listening.", { rate: 0.85, volume: 0.7 });

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#040508", color: "rgba(230,220,200,0.92)", fontFamily: UI, paddingBottom: 120, position: "relative", overflowX: "hidden" }}>
      
      {/* ── AMBIENT BACKGROUND ── */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.04, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(circle at 50% -20%, rgba(200,167,106,0.05) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />
      <motion.div animate={{ y: [0, -100] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", inset: -100, opacity: 0.2, backgroundImage: "radial-gradient(circle, rgba(220,185,110,0.4) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 1 }} />

      <MobileTopBar showSettings={false} />

      <AnimatePresence>
        {savedFlash && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", zIndex: 100, padding: "8px 24px", borderRadius: 30, background: "rgba(20,18,14,0.9)", border: `1px solid ${BRIGHT}`, fontSize: 10, letterSpacing: "0.2em", color: BRIGHT, fontFamily: DISPLAY, boxShadow: "0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(220,185,110,0.2)", backdropFilter: "blur(8px)" }}
          >
            ENGRAVED
          </motion.div>
        )}
      </AnimatePresence>

      <main style={{ padding: "40px 16px 32px", maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 10 }}>
        
        {/* ── LUXURY HEADER ── */}
        <header style={{ textAlign: "center", marginBottom: 50 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 13, letterSpacing: "0.25em", color: BRIGHT, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ width: 30, height: 1, background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <div style={{ width: 30, height: 1, background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 300, fontSize: 38, margin: "0 0 16px 0", color: "rgba(255,250,240,1)", letterSpacing: "0.15em", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 0 15px rgba(220,185,110,0.2)", textTransform: "uppercase" }}>
            IMPERIAL CHAMBER
          </h1>
          <p style={{ fontSize: 13, color: "rgba(200,180,150,0.8)", fontStyle: "italic", margin: 0, fontFamily: DISPLAY, letterSpacing: "0.05em" }}>
            "Shape the architecture of your discipline."
          </p>
        </header>

        {/* ─── CYCLE OF RESTORATION ─── */}
        <Section title="CYCLE OF RESTORATION" icon={<Moon size={16} color={BRIGHT} />}>
          <div className="responsive-grid-2col">
            <ConfigInput 
              label="DAWN ASCENSION" 
              type="time" 
              value={wakeTime} 
              onChange={e => { setWakeTime(e.target.value); persist("st_wakeTime", e.target.value); }} 
            />
            <ConfigInput 
              label="NIGHT DESCENT" 
              type="time" 
              value={sleepTime} 
              onChange={e => { setSleepTime(e.target.value); persist("st_sleepTime", e.target.value); }} 
            />
          </div>
        </Section>

        {/* ─── HOURS OF MASTERY ─── */}
        <Section title="HOURS OF MASTERY" icon={<Sun size={16} color={BRIGHT} />}>
          <div className="responsive-grid-2col">
            <ConfigInput 
              label="BEGINNING OF FOCUS" 
              type="time" 
              value={workStart} 
              onChange={e => { setWorkStart(e.target.value); persist("st_workStart", e.target.value); }} 
            />
            <ConfigInput 
              label="END OF FOCUS" 
              type="time" 
              value={workEnd} 
              onChange={e => { setWorkEnd(e.target.value); persist("st_workEnd", e.target.value); }} 
            />
          </div>
        </Section>

        {/* ─── DISCIPLINE PARAMETERS ─── */}
        <Section title="DISCIPLINE PARAMETERS" icon={<Hourglass size={16} color={BRIGHT} />}>
          <div className="responsive-grid-2col" style={{ marginBottom: 20 }}>
            <ConfigInput 
              label="FOCUS CHAMBER DURATION (MIN)" 
              type="number" 
              value={focusLength} 
              onChange={e => { setFocusLength(e.target.value); persist("st_focusLength", e.target.value); }} 
            />
            <ConfigInput 
              label="RESTORATION CHAMBER (MIN)" 
              type="number" 
              value={recoveryLength} 
              onChange={e => { setRecoveryLength(e.target.value); persist("st_recoveryLength", e.target.value); }} 
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Toggle label="STRICT FOCUS MODE" sub="Seals the chamber. Prevents distraction." on={strictMode} onChange={v => { setStrictMode(v); persist("st_strictMode", v); }} />
            <Toggle label="HABIT REMINDERS" sub="Alerts from the Oracle for upcoming pillars." on={reminders} onChange={v => { setReminders(v); persist("st_reminders", v); }} />
          </div>
        </Section>

        {/* ─── THE DAILY CAMPAIGN ─── */}
        <section style={{ marginBottom: 40, marginTop: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: MARBLE, border: `1px solid ${BORDER}`, display: "grid", placeItems: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
              <Briefcase size={14} color={BRIGHT} />
            </div>
            <div>
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 300, fontSize: 20, margin: 0, color: "rgba(255,250,240,1)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                THE DAILY CAMPAIGN
              </h2>
            </div>
          </div>
          <p style={{ fontFamily: DISPLAY, fontSize: 11, color: "rgba(200,167,106,0.7)", margin: "0 0 24px", fontStyle: "italic" }}>
            The Emperor's Agenda. Shape your blocks of discipline.
          </p>

          <Reorder.Group axis="y" values={blocks} onReorder={(v) => { setBlocks(v); flashSaved(); }} style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            {blocks.map(b => (
              <RoutineCard
                key={b.id}
                block={b}
                onChange={(patch) => updateBlock(b.id, patch)}
                onTimeBlur={(t) => onTimeBlur(b.id, t)}
                onDelete={() => removeBlock(b.id)}
              />
            ))}
          </Reorder.Group>

          <motion.button
            whileHover={{ y: -2, boxShadow: "0 10px 20px rgba(220,185,110,0.15)" }}
            whileTap={{ scale: 0.98 }}
            onClick={addBlock}
            style={{
              marginTop: 20,
              width: "100%",
              minHeight: 64,
              borderRadius: 16,
              border: `1px dashed ${GOLD}`,
              background: "rgba(10,8,6,0.6)",
              color: BRIGHT,
              fontFamily: DISPLAY,
              fontSize: 12,
              letterSpacing: "0.2em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              textTransform: "uppercase",
              backdropFilter: "blur(4px)",
              transition: "all 0.3s"
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: MARBLE, border: `1px solid ${BORDER}`, display: "grid", placeItems: "center" }}>
              <Plus size={14} color={BRIGHT} />
            </div>
            FORGE NEW PILLAR
          </motion.button>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <button
              onClick={resetBlocks}
              style={{
                background: "transparent", border: "none",
                color: "rgba(200,100,100,0.8)", fontSize: 9, fontFamily: DISPLAY,
                letterSpacing: "0.2em", cursor: "pointer", padding: "8px 16px", textTransform: "uppercase",
                transition: "color 0.2s"
              }}
            >
              RESTORE IMPERIAL BLUEPRINT
            </button>
          </div>
        </section>

        {/* ─── ORACLE INTEGRATIONS ─── */}
        <Section title="ORACLE INTEGRATIONS" icon={<ShieldAlert size={16} color={BRIGHT} />}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            <Toggle label="ORACLE VOICE" sub="Ancient spoken guidance for recovery tools." on={voice} onChange={v => { setVoice(v); persist("st_voice", v); }} />
            <Toggle label="TACTILE RESPONSE" sub="Subtle physical vibrations of the empire." on={haptics} onChange={v => { setHaptics(v); persist("st_haptics", v); }} />
            <Toggle label="AUTOMATIC CHAMBER ENTRY" sub="Instantly opens the control sheet." on={autosheet} onChange={v => { setAutosheet(v); persist("st_autosheet", v); }} />
          </div>
          <motion.button 
            whileHover={{ y: -2 }}
            onClick={testVoice} 
            style={{ width: "100%", minHeight: 52, borderRadius: 12, border: `1px solid ${GOLD}`, background: "rgba(220,185,110,0.1)", color: BRIGHT, fontFamily: DISPLAY, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 0 20px rgba(220,185,110,0.1)" }}
          >
            <Volume2 size={16} /> SUMMON THE ORACLE
          </motion.button>
        </Section>

        {/* ─── RECORDS OF THE EMPIRE ─── */}
        <Section title="RECORDS OF THE EMPIRE" icon={<Heart size={16} color={BRIGHT} />}>
          <div className="responsive-grid-2col" style={{ gap: 12 }}>
            <Link to="/streak-archives" style={{ textDecoration: 'none' }}>
              <Stat label="Current Streak" value={`${streak}`} />
            </Link>
            <Link to="/chamber-of-focus" style={{ textDecoration: 'none' }}>
              <Stat label="Deep Sessions" value={`${deepCycles}`} />
            </Link>
            <Link to="/archive-of-thought" style={{ textDecoration: 'none' }}>
              <Stat label="Captured Thoughts" value={`${thoughtCount}`} />
            </Link>
            <Link to="/temple-of-recovery" style={{ textDecoration: 'none' }}>
              <Stat label="Recovery Sessions" value={`${logCount}`} />
            </Link>
          </div>
        </Section>

        {/* ─── DANGER ─── */}
        <section style={{ marginBottom: 60, marginTop: 40 }}>
          <motion.button 
            whileHover={{ y: -2, boxShadow: "0 10px 30px rgba(200,40,40,0.3)" }}
            onClick={clearAll} 
            style={{ width: "100%", minHeight: 60, borderRadius: 16, border: "1px solid rgba(220,60,60,0.5)", background: "linear-gradient(145deg, rgba(40,10,10,0.9), rgba(20,5,5,0.9))", color: "rgba(255,150,150,1)", fontFamily: DISPLAY, fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "inset 0 2px 10px rgba(255,100,100,0.1)" }}
          >
            <Trash2 size={16} /> BURN THE ARCHIVE
          </motion.button>
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <p style={{ fontSize: 10, color: "rgba(200,100,100,0.8)", margin: 0, fontFamily: DISPLAY, letterSpacing: "0.1em" }}>All ancient records will be permanently destroyed.</p>
          </div>
        </section>

      </main>
      <BottomNav />
    </div>
  );
}

// ── UI COMPONENTS ──

const LOAD_COLORS: Record<NeuralLoad, string> = {
  LIGHT:    "rgba(200,167,106,0.85)", // Gold
  MODERATE: "rgba(220,192,138,0.85)", // Soft Gold
  HEAVY:    "rgba(138,106,58,0.85)",  // Bronze
};
const ENERGY_COLORS: Record<Energy, string> = {
  RECHARGING: "rgba(142,133,120,0.85)", // Muted
  STABLE:     "rgba(233,226,216,0.85)", // Marble
  DRAINING:   "rgba(138,106,58,0.85)",  // Bronze
};

function RoutineCard({ block, onChange, onTimeBlur, onDelete }: any) {
  const [focused, setFocused] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <Reorder.Item
      value={block}
      whileDrag={{ scale: 1.02, boxShadow: "0 20px 50px rgba(0,0,0,0.9), 0 0 20px rgba(220,185,110,0.2)" }}
      style={{
        listStyle: "none", padding: 20, borderRadius: 16,
        background: MARBLE,
        border: `1px solid ${focused ? GOLD : BORDER}`,
        boxShadow: focused ? "0 0 20px rgba(220,185,110,0.2)" : "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        transition: "all 0.3s", position: "relative"
      }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Roman Column Drag Handle */}
        <div aria-hidden style={{ cursor: "grab", touchAction: "none", display: "flex", flexDirection: "column", gap: 3, padding: "10px 4px" }}>
          <div style={{ width: 4, height: 24, background: "rgba(200,167,106,0.4)", borderRadius: 2 }} />
          <div style={{ width: 4, height: 24, background: "rgba(200,167,106,0.4)", borderRadius: 2 }} />
        </div>

        <div style={{ flex: 1 }}>
          {/* Gold Time Plaque */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <input
              value={block.time}
              onChange={e => onChange({ time: e.target.value })}
              onBlur={e => onTimeBlur(e.target.value)}
              placeholder="09:00 AM - 10:00 AM"
              style={{
                background: "rgba(10,8,6,0.6)", border: `1px solid ${BORDER}`,
                color: BRIGHT, fontFamily: DISPLAY, fontSize: 11, letterSpacing: "0.15em",
                padding: "8px 12px", borderRadius: 8, width: "100%", outline: "none", boxShadow: "inset 0 2px 5px rgba(0,0,0,0.5)"
              }}
            />
            <button
              onClick={() => (confirming ? onDelete() : setConfirming(true))}
              onBlur={() => setConfirming(false)}
              style={{
                background: confirming ? "rgba(200,60,60,0.2)" : "transparent",
                border: `1px solid ${confirming ? "rgba(220,80,80,0.5)" : "transparent"}`,
                color: confirming ? "rgba(255,150,150,0.9)" : "rgba(200,167,106,0.5)",
                cursor: "pointer", width: 36, height: 36, borderRadius: 8, display: "grid", placeItems: "center",
                transition: "all 0.2s"
              }}
            >
              {confirming ? "OK" : <Trash2 size={16} />}
            </button>
          </div>

          {/* Engraved Label */}
          <input
            value={block.label}
            onChange={e => onChange({ label: e.target.value })}
            placeholder="Mission Designation"
            style={{
              width: "100%", background: "transparent", border: "none", borderBottom: `1px solid rgba(255,255,255,0.05)`,
              color: "rgba(255,250,240,0.95)", fontFamily: UI, fontSize: 18, fontWeight: 300, padding: "8px 0", outline: "none", marginBottom: 16
            }}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <TagChip label={`NEURAL LOAD: ${block.neuralLoad}`} color={LOAD_COLORS[block.neuralLoad]} onClick={() => onChange({ neuralLoad: cycle(NEURAL_LOADS, block.neuralLoad) })} />
            <TagChip label={`ENERGY STATE: ${block.energy}`} color={ENERGY_COLORS[block.energy]} onClick={() => onChange({ energy: cycle(ENERGIES, block.energy) })} />
          </div>

          <AnimatePresence>
            {confirming && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ marginTop: 12, fontSize: 10, fontFamily: DISPLAY, letterSpacing: "0.1em", color: "rgba(220,100,100,0.8)", textTransform: "uppercase" }}>
                  Confirm eradication of this pillar.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Reorder.Item>
  );
}

function TagChip({ label, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px", borderRadius: 4, border: `1px solid ${color.replace("0.85", "0.3")}`,
        background: color.replace("0.85", "0.1"), color: color.replace("0.85", "0.9"),
        fontSize: 9, letterSpacing: "0.15em", fontFamily: DISPLAY, cursor: "pointer", textTransform: "uppercase"
      }}
    >
      {label}
    </button>
  );
}

function Section({ title, icon, children }: any) {
  return (
    <section style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: MARBLE, border: `1px solid ${BORDER}`, display: "grid", placeItems: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
          {icon}
        </div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 13, letterSpacing: "0.25em", color: BRIGHT, margin: 0, textTransform: "uppercase" }}>
          {title}
        </h2>
      </div>
      <div style={{ background: MARBLE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: 24, boxShadow: "0 15px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
        {children}
      </div>
    </section>
  );
}

function ConfigInput({ label, type, value, onChange }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 9, fontFamily: DISPLAY, letterSpacing: "0.15em", color: "rgba(200,167,106,0.7)", textTransform: "uppercase" }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange}
        style={{
          background: "rgba(10,8,6,0.6)", border: `1px solid ${BORDER}`,
          color: "rgba(255,250,240,0.95)", fontFamily: DISPLAY, fontSize: 16, letterSpacing: "0.1em",
          padding: "12px 16px", borderRadius: 12, outline: "none", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)", transition: "border-color 0.3s"
        }}
      />
    </div>
  );
}

function Toggle({ label, sub, on, onChange }: any) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderRadius: 12, border: `1px solid ${BORDER}`,
        background: "rgba(20,18,14,0.4)", color: "inherit", textAlign: "left", cursor: "pointer", width: "100%",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)"
      }}
    >
      <div style={{ flex: 1, marginRight: 20 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 12, letterSpacing: "0.1em", color: "rgba(255,250,240,0.9)", textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontFamily: UI, fontSize: 11, color: "rgba(200,180,150,0.6)", marginTop: 6, fontStyle: "italic" }}>{sub}</div>
      </div>
      
      {/* Ancient Lever Design */}
      <span style={{
        width: 48, height: 24, borderRadius: 12,
        background: on ? "linear-gradient(90deg, #8a6a3b, #b8860b)" : "linear-gradient(145deg, #161311, #0a0806)",
        border: `1px solid ${on ? BRIGHT : "rgba(255,255,255,0.1)"}`,
        position: "relative", flexShrink: 0, boxShadow: on ? "0 0 15px rgba(220,185,110,0.4), inset 0 1px 2px rgba(255,255,255,0.5)" : "inset 0 2px 5px rgba(0,0,0,0.8)"
      }}>
        <motion.span 
          animate={{ left: on ? 24 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}
          style={{
            position: "absolute", top: 2, width: 18, height: 18, borderRadius: "50%",
            background: on ? "rgba(255,250,240,1)" : "rgba(100,90,80,0.8)",
            boxShadow: on ? "0 0 10px rgba(255,255,255,0.8)" : "0 2px 4px rgba(0,0,0,0.5)"
          }} 
        />
      </span>
    </button>
  );
}

function Stat({ label, value }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, backgroundColor: "rgba(30,28,24,0.6)", borderColor: GOLD }}
      whileTap={{ scale: 0.98 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", borderRadius: 12, background: "rgba(20,18,14,0.4)", border: `1px solid ${BORDER}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)", cursor: "pointer", transition: "background-color 0.2s, border-color 0.2s" }}
    >
      <span style={{ fontFamily: DISPLAY, fontSize: 8, letterSpacing: "0.15em", color: "rgba(200,167,106,0.7)", textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>{label}</span>
      <span style={{ fontFamily: DISPLAY, fontSize: 28, color: BRIGHT, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>{value}</span>
    </motion.div>
  );
}
