import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { MobileTopBar } from "@/components/mobile/MobileTopBar";
import { BottomNav } from "@/components/mobile/BottomNav";

export const Route = createFileRoute("/notes")({
  component: NotesPage,
  head: () => ({
    meta: [
      { title: "Your Journal — Routine OS" },
      { name: "description", content: "A private journal built into your operating system." },
    ],
  }),
});

/* ───────────── fonts ───────────── */
const SERIF = `"Cormorant Garamond", ui-serif, Georgia, serif`;
const SANS  = `"Inter", ui-sans-serif, system-ui, sans-serif`;

/* ───────────── palette ───────────── */
const C = {
  bg:        "#080d14",
  panel:     "#060c18",
  panelDeep: "#050b16",
  line:      "#0d1825",
  lineSoft:  "#0a1220",
  divider:   "#0f1a28",
  inkHi:     "#d4e0ec",
  inkMid:    "#c4d0dc",
  inkBody:   "#8a9ab5",
  inkBody2:  "#6a8aa5",
  inkLow:    "#2a4a6a",
  inkLow2:   "#1a3a5a",
  inkLow3:   "#1a2535",
  inkLow4:   "#0f1825",
  inkLow5:   "#0d1520",
  blue:      "#4a8fc4",
  teal:      "#1a9aaa",
};

/* ───────────── time / utils ───────────── */
function commandFor(hour: number): string {
  if (hour >= 5 && hour < 7)   return "Your sharpest hours begin now.";
  if (hour >= 7 && hour < 9)   return "Morning anchor. Build the first block.";
  if (hour >= 9 && hour < 12)  return "Peak window is open. Protect this time.";
  if (hour >= 12 && hour < 14) return "Restore. The afternoon session needs you full.";
  if (hour >= 14 && hour < 17) return "Second wind. Momentum compounds here.";
  if (hour >= 17 && hour < 19) return "Deep work closes. Finish strong.";
  if (hour >= 19 && hour < 22) return "Wind down begins. Protect tomorrow.";
  return "Rest is the protocol. Begin recovery.";
}

export function noteKey(d: Date) {
  return `notes-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function loadNote(d: Date): string {
  try { return localStorage.getItem(noteKey(d)) ?? ""; } catch { return ""; }
}
const moodKey = (d: Date) => `${noteKey(d)}-mood`;

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function daysAgoLabel(d: Date, today: Date): string {
  const diff = Math.round((+new Date(today.toDateString()) - +new Date(d.toDateString())) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

/* Pull every persisted note from localStorage */
interface DayMap { [iso: string]: { content: string; words: number } }
function loadAllNotes(): DayMap {
  const out: DayMap = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const m = key.match(/^notes-(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) continue;
      const content = localStorage.getItem(key) ?? "";
      if (!content.trim()) continue;
      out[`${m[1]}-${m[2]}-${m[3]}`] = { content, words: content.trim().split(/\s+/).length };
    }
  } catch {}
  return out;
}
const isoFor = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

/* Compute current streak ending today (consecutive days with notes, today counts if written) */
function computeStreak(today: Date, map: DayMap): number {
  let n = 0;
  const cursor = new Date(today);
  for (;;) {
    const has = !!map[isoFor(cursor)];
    if (!has) {
      if (isSameDay(cursor, today)) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

const MOODS = ["Low", "Okay", "Good", "Great", "Peak"] as const;
type Mood = typeof MOODS[number];

/* ───────────── component ───────────── */
function NotesPage() {
  const [mounted, setMounted] = useState(false);
  const [today] = useState(() => new Date());
  const [text, setText] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [mood, setMood] = useState<Mood | null>(null);
  const [calMonth, setCalMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [calDir, setCalDir] = useState<1 | -1>(1);
  const [selected, setSelected] = useState<Date | null>(null);
  const [allNotes, setAllNotes] = useState<DayMap>({});
  const writerRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    setText(loadNote(today));
    try {
      const m = localStorage.getItem(moodKey(today));
      if (m && (MOODS as readonly string[]).includes(m)) setMood(m as Mood);
    } catch {}
    setAllNotes(loadAllNotes());
  }, [today]);

  /* autosave */
  useEffect(() => {
    if (!mounted) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(noteKey(today), text);
        setAllNotes(loadAllNotes());
        setSavedFlash(true);
        if (flashTimer.current) clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setSavedFlash(false), 2000);
      } catch {}
    }, 1200);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [text, mounted, today]);

  const setMoodPersist = (m: Mood) => {
    setMood(m);
    try { localStorage.setItem(moodKey(today), m); } catch {}
  };

  const dateLabel = useMemo(
    () => today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
    [today]
  );
  const commanding = mounted ? commandFor(today.getHours()) : "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const streak     = useMemo(() => computeStreak(today, allNotes), [today, allNotes]);
  const totalNotes = Object.keys(allNotes).length;
  const thisMonth  = useMemo(() => {
    const prefix = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-`;
    return Object.keys(allNotes).filter(k => k.startsWith(prefix)).length;
  }, [today, allNotes]);

  /* calendar grid */
  const cal = useMemo(() => {
    const first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
    const startDay = first.getDay(); // 0 Sun
    const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
    const cells: ({ date: Date } | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(calMonth.getFullYear(), calMonth.getMonth(), d) });
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calMonth]);

  const monthLabel = calMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const shiftMonth = (delta: number) => {
    setCalDir(delta > 0 ? 1 : -1);
    setCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  /* panel content */
  const panelEntry = selected ? allNotes[isoFor(selected)] : null;
  const isToday    = selected ? isSameDay(selected, today) : false;

  const scrollToWriter = () => {
    setSelected(null);
    setTimeout(() => {
      writerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      writerRef.current?.focus();
    }, 220);
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.inkBody,
      fontFamily: SANS, paddingBottom: 110, position: "relative", overflowX: "hidden",
    }}>
      <MobileTopBar />

      <motion.main
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ padding: "18px 18px 32px", position: "relative", zIndex: 1 }}
      >
        {/* ───────── TODAY HEADER ───────── */}
        <header style={{ marginBottom: 22 }}>
          <div style={{
            fontFamily: SANS, fontSize: 9, fontWeight: 500,
            letterSpacing: "0.25em", color: C.blue, marginBottom: 6,
          }}>
            TODAY
          </div>
          <h1 style={{
            fontFamily: SERIF, fontWeight: 300, fontSize: 36,
            color: C.inkHi, lineHeight: 1, margin: 0,
          }}>
            {dateLabel}
          </h1>
          {commanding && (
            <p style={{
              fontFamily: SERIF, fontWeight: 300, fontStyle: "italic",
              fontSize: 15, color: C.inkLow, lineHeight: 1.5, margin: "12px 0 0",
            }}>
              {commanding}
            </p>
          )}
          <div style={{ height: 1, background: C.divider, opacity: 0.6, marginTop: 16 }} />
        </header>

        {/* ───────── WRITING AREA ───────── */}
        <section style={{ position: "relative", marginBottom: 14 }}>
          <div aria-hidden style={{
            position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.8,
            backgroundImage: `radial-gradient(${C.lineSoft} 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
            maskImage: "linear-gradient(to bottom, black 70%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent)",
          }} />
          <textarea
            ref={writerRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What's on your mind today..."
            rows={8}
            className="notes-writer"
            style={{
              position: "relative", width: "100%", minHeight: 180,
              padding: "6px 2px 12px", background: "transparent",
              border: "none", outline: "none", resize: "vertical",
              caretColor: C.blue,
              fontFamily: SANS, fontWeight: 300, fontSize: 15,
              lineHeight: 1.9, color: C.inkBody,
            }}
          />
          <style>{`.notes-writer::placeholder{font-family:${SERIF};font-style:italic;font-weight:300;font-size:18px;color:${C.inkLow3};}`}</style>
        </section>

        {/* writing footer */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontFamily: SANS, fontSize: 10, fontWeight: 300,
          letterSpacing: "0.05em", marginBottom: 28, height: 14,
        }}>
          <span style={{ color: C.inkLow2 }}>{words} words</span>
          <AnimatePresence>
            {savedFlash && (
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{ color: C.teal }}
              >
                Saved ✓
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* ───────── MOOD ───────── */}
        <section style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: SANS, fontSize: 8, fontWeight: 500,
            letterSpacing: "0.2em", color: C.inkLow2, marginBottom: 10,
          }}>
            TODAY'S ENERGY
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MOODS.map(m => {
              const active = mood === m;
              return (
                <motion.button
                  key={m}
                  onClick={() => setMoodPersist(m)}
                  animate={{ scale: active ? 1.04 : 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  style={{
                    fontFamily: SANS, fontSize: 11, fontWeight: 300,
                    padding: "8px 16px", borderRadius: 20,
                    background: active ? "#060f1e" : "transparent",
                    border: `1px solid ${active ? C.blue : C.divider}`,
                    color: active ? C.blue : C.inkLow2,
                    boxShadow: active ? "0 0 10px rgba(74,143,196,0.1)" : "none",
                    cursor: "pointer", transition: "color .25s, border-color .25s, background .25s",
                  }}
                >
                  {m}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ───────── STAT STRIP ───────── */}
        <section style={{ margin: "0 0 30px" }}>
          <div style={{ height: 1, background: C.lineSoft }} />
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            alignItems: "center", padding: "16px 0",
          }}>
            {[
              { n: streak,     l: "DAY STREAK",  hi: true  },
              { n: totalNotes, l: "TOTAL NOTES", hi: false },
              { n: thisMonth,  l: "THIS MONTH",  hi: false },
            ].map((s, i) => (
              <div key={s.l} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                borderLeft: i === 0 ? "none" : `1px solid ${C.divider}`,
                padding: "2px 4px",
              }}>
                <div style={{
                  fontFamily: SERIF, fontWeight: 300, fontSize: 28, lineHeight: 1,
                  color: s.hi ? C.blue : C.inkLow,
                }}>
                  {s.n}
                </div>
                <div style={{
                  fontFamily: SANS, fontSize: 8, fontWeight: 400,
                  letterSpacing: "0.12em", color: C.inkLow2, marginTop: 6,
                }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: C.lineSoft }} />
        </section>

        {/* ───────── JOURNAL HEADER ───────── */}
        <section style={{ marginBottom: 14 }}>
          <div style={{
            fontFamily: SANS, fontSize: 8, fontWeight: 500,
            letterSpacing: "0.25em", color: C.inkLow2, marginBottom: 6,
          }}>
            YOUR JOURNAL
          </div>
          <h2 style={{
            fontFamily: SERIF, fontWeight: 300, fontStyle: "italic",
            fontSize: 24, color: C.inkLow, margin: 0,
          }}>
            Every day, a page.
          </h2>
        </section>

        {/* ───────── CALENDAR ───────── */}
        <section style={{
          background: C.panel, border: `1px solid ${C.line}`,
          borderRadius: 20, padding: "22px 18px", marginBottom: 20,
          overflow: "hidden",
        }}>
          {/* header row */}
          <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", alignItems: "center" }}>
            <ArrowBtn dir="left"  onClick={() => shiftMonth(-1)} />
            <div style={{
              textAlign: "center",
              fontFamily: SERIF, fontWeight: 300, fontSize: 22,
              color: C.inkMid, letterSpacing: "0.02em",
            }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={monthLabel}
                  initial={{ opacity: 0, x: calDir * 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -calDir * 12 }}
                  transition={{ duration: 0.2 }}
                >
                  {monthLabel}
                </motion.div>
              </AnimatePresence>
            </div>
            <ArrowBtn dir="right" onClick={() => shiftMonth(1)} />
          </div>

          {/* day labels */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
            paddingTop: 14, paddingBottom: 8,
            borderBottom: `1px solid ${C.lineSoft}`,
          }}>
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <div key={i} style={{
                textAlign: "center",
                fontFamily: SANS, fontSize: 9, fontWeight: 400,
                letterSpacing: "0.08em", color: C.inkLow2,
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* date grid */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={monthLabel + "-grid"}
              initial={{ opacity: 0, x: calDir * 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -calDir * 18 }}
              transition={{ duration: 0.2 }}
              style={{
                display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
                rowGap: 4, paddingTop: 8,
              }}
            >
              {cal.map((cell, i) => {
                if (!cell) return <div key={i} style={{ height: 44 }} />;
                const d = cell.date;
                const iso = isoFor(d);
                const has = !!allNotes[iso];
                const isFuture = +new Date(d.toDateString()) > +new Date(today.toDateString());
                const isTodayCell = isSameDay(d, today);
                const isSelected = selected ? isSameDay(selected, d) : false;

                let numColor: string = C.inkLow3;
                let weight = 300;
                if (has) { numColor = C.inkBody; weight = 400; }
                if (isTodayCell) { numColor = C.blue; weight = 500; }
                if (isFuture) { numColor = "#0d1520"; weight = 200; }
                if (isSelected) { numColor = C.inkMid; }

                const dotColor = isTodayCell && has ? C.teal : C.blue;

                return (
                  <button
                    key={i}
                    disabled={isFuture}
                    onClick={() => { if (!isFuture) setSelected(d); }}
                    style={{
                      height: 44, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      background: "transparent", border: "none", padding: 0,
                      cursor: isFuture ? "default" : "pointer",
                      position: "relative",
                    }}
                  >
                    {isSelected && !isTodayCell && (
                      <motion.div
                        layoutId="cal-sel"
                        style={{
                          position: "absolute", inset: "2px 6px",
                          background: "#0a1828", border: `1px solid ${C.inkLow2}`,
                          borderRadius: 10,
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    {isTodayCell && (
                      <div style={{
                        position: "absolute", top: "50%", left: "50%",
                        width: 28, height: 28, marginLeft: -14,
                        marginTop: has ? -16 : -14,
                        borderRadius: 14, background: "#060f1e",
                        border: `1px solid ${C.blue}`,
                        boxShadow: "0 0 12px rgba(74,143,196,0.15)",
                      }} />
                    )}
                    <span style={{
                      position: "relative", zIndex: 1,
                      fontFamily: SANS, fontSize: 14, fontWeight: weight,
                      color: numColor, lineHeight: 1,
                    }}>
                      {d.getDate()}
                    </span>
                    {has && (
                      <span style={{
                        position: "relative", zIndex: 1, marginTop: 5,
                        width: 3, height: 3, borderRadius: 2,
                        background: dotColor,
                        boxShadow: `0 0 4px ${dotColor === C.teal ? "rgba(26,154,170,0.6)" : "rgba(74,143,196,0.5)"}`,
                      }} />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ───────── EMPTY STATE ───────── */}
        {totalNotes === 0 && (
          <section style={{
            textAlign: "center", padding: "24px 8px 8px",
          }}>
            <div aria-hidden style={{
              display: "grid", gridTemplateColumns: "repeat(4, 2px)",
              gridTemplateRows: "repeat(4, 2px)", gap: 16,
              width: 56, margin: "0 auto 18px",
            }}>
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} style={{ width: 2, height: 2, background: C.lineSoft, borderRadius: 1 }} />
              ))}
            </div>
            <div style={{
              fontFamily: SERIF, fontWeight: 300, fontStyle: "italic",
              fontSize: 22, color: C.inkLow3,
            }}>
              Your journal begins here.
            </div>
            <div style={{
              fontFamily: SANS, fontWeight: 300, fontSize: 12,
              color: C.inkLow4, marginTop: 8, lineHeight: 1.9,
            }}>
              Write something today.<br />
              Come back tomorrow.<br />
              Watch it grow.
            </div>
          </section>
        )}
      </motion.main>

      <BottomNav />

      {/* ───────── DATE PANEL ───────── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(2,6,14,0.55)", zIndex: 70 }}
            />
            <motion.div
              key="panel"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => { if (info.offset.y > 80) setSelected(null); }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              style={{
                position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 71,
                background: C.panelDeep, borderTop: `1px solid ${C.line}`,
                borderRadius: "24px 24px 0 0",
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)",
                maxHeight: "78vh", display: "flex", flexDirection: "column",
              }}
            >
              <div style={{
                width: 32, height: 3, background: C.divider, borderRadius: 2,
                margin: "10px auto 14px",
              }} />
              <div style={{ padding: "0 22px 18px", flex: 1, overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{
                      fontFamily: SERIF, fontWeight: 300, fontSize: 26,
                      color: C.inkHi, lineHeight: 1.1,
                    }}>
                      {selected.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                    </div>
                    {panelEntry ? (
                      <div style={{
                        fontFamily: SANS, fontSize: 10, fontWeight: 300,
                        color: C.inkLow2, marginTop: 6, letterSpacing: "0.04em",
                      }}>
                        {daysAgoLabel(selected, today)} · {panelEntry.words} words · {Math.max(1, Math.round(panelEntry.words / 220))} min read
                      </div>
                    ) : (
                      <div style={{
                        fontFamily: SANS, fontSize: 10, fontWeight: 300,
                        color: C.inkLow2, marginTop: 6, letterSpacing: "0.04em",
                      }}>
                        {isToday ? "open" : daysAgoLabel(selected, today)}
                      </div>
                    )}
                  </div>
                  {(() => {
                    try {
                      const m = localStorage.getItem(moodKey(selected));
                      if (!m) return null;
                      return (
                        <div style={{
                          fontFamily: SANS, fontSize: 9, fontWeight: 300,
                          padding: "5px 10px", borderRadius: 14,
                          border: `1px solid ${C.blue}`, color: C.blue,
                        }}>
                          {m}
                        </div>
                      );
                    } catch { return null; }
                  })()}
                </div>

                <div style={{ height: 1, background: C.divider, margin: "18px 0" }} />

                {panelEntry ? (
                  <>
                    <p style={{
                      whiteSpace: "pre-wrap",
                      fontFamily: SANS, fontWeight: 300, fontSize: 14,
                      lineHeight: 1.9, color: C.inkBody2, margin: 0,
                    }}>
                      {panelEntry.content}
                    </p>
                    <div style={{ height: 1, background: C.divider, margin: "22px 0 12px" }} />
                    <div style={{
                      fontFamily: SERIF, fontStyle: "italic", fontWeight: 300,
                      fontSize: 12, color: C.divider, textAlign: "center",
                    }}>
                      Written on {selected.toLocaleDateString(undefined, { month: "long", day: "numeric" })}. Preserved.
                    </div>
                  </>
                ) : isToday ? (
                  <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
                    <div style={{
                      fontFamily: SERIF, fontStyle: "italic", fontWeight: 300,
                      fontSize: 20, color: C.inkLow2,
                    }}>
                      Today is still open.
                    </div>
                    <button
                      onClick={scrollToWriter}
                      style={{
                        marginTop: 14, background: "transparent", border: "none",
                        fontFamily: SANS, fontSize: 11, fontWeight: 300,
                        color: C.blue, cursor: "pointer", letterSpacing: "0.05em",
                      }}
                    >
                      Write now →
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "26px 0 8px" }}>
                    <div style={{
                      fontFamily: SERIF, fontStyle: "italic", fontWeight: 300,
                      fontSize: 20, color: C.inkLow3,
                    }}>
                      Nothing written this day.
                    </div>
                    <div style={{
                      fontFamily: SANS, fontSize: 12, fontWeight: 300,
                      color: C.inkLow4, marginTop: 6,
                    }}>
                      Some days pass without words.
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────── arrow button ───────────── */
function ArrowBtn({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  const [active, setActive] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setActive(true)}
      onPointerUp={() => setActive(false)}
      onPointerLeave={() => setActive(false)}
      aria-label={dir === "left" ? "Previous month" : "Next month"}
      style={{
        width: 44, height: 44, background: "transparent", border: "none",
        display: "flex", alignItems: "center", justifyContent: dir === "left" ? "flex-start" : "flex-end",
        fontFamily: SANS, fontSize: 16, fontWeight: 300,
        color: active ? C.blue : C.inkLow2,
        cursor: "pointer", transition: "color .2s",
      }}
    >
      {dir === "left" ? "←" : "→"}
    </button>
  );
}
