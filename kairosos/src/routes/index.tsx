import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState, useCallback } from "react";
import { MobileTopBar } from "@/components/mobile/MobileTopBar";
import { BottomNav } from "@/components/mobile/BottomNav";
import { useBlocks, type BlockDef } from "@/lib/blocks-store";
import { loadNote } from "./notes";
import currentFocusVideo from "@/assets/Current focus.mp4";
import quoteSectionImage from "@/assets/quote-bg.png";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Kairos — Master Your Time" },
      { name: "description", content: "A personal operating system for mastery. Discipline. Focus. Purpose." },
    ],
  }),
});

type BlockState = "done" | "partial" | "missed" | null;

const STOIC_QUOTES = [
  { q: "The obstacle is the way. The time is now.", a: "Marcus Aurelius" },
  { q: "Waste no more time arguing what a good man should be. Be one.", a: "Marcus Aurelius" },
  { q: "We suffer more often in imagination than in reality.", a: "Seneca" },
  { q: "First say to yourself what you would be; then do what you have to do.", a: "Epictetus" },
  { q: "He who is brave is free.", a: "Seneca" },
];

const WISDOM = [
  { q: "Discipline is the bridge between goals and accomplishment.", a: "Jim Rohn" },
  { q: "What stands in the way becomes the way.", a: "Marcus Aurelius" },
  { q: "Mastery is not a function of genius. It is a function of time.", a: "Robert Greene" },
  { q: "The successful warrior is the average man, with laser-like focus.", a: "Bruce Lee" },
];

function greetingFor(h: number) {
  if (h < 5) return "Good night,";
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  if (h < 21) return "Good evening,";
  return "Good night,";
}

function todayKey() {
  const d = new Date();
  return `os_completions_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const BG = "#050505";
const SURFACE = "#0A0A0A";
const BORDER = "#1a1710";
const GOLD = "#C8A76A";
const SOFT_GOLD = "#DCC08A";
const BRONZE = "#8A6A3A";
const MARBLE = "#E9E2D8";
const MUTED = "#8E8578";
const DIM = "#3a3530";
const SERIF = "var(--font-sanctuary-display)";
const SANS = "var(--font-sanctuary-ui)";

function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date(2026, 0, 1, 9, 0, 0));
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const [blocks] = useBlocks();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const activeBlock = useMemo<BlockDef | null>(
    () => blocks.find(b => minutesNow >= b.start && minutesNow < b.end) ?? null,
    [minutesNow, blocks]
  );

  const [completions, setCompletions] = useState<Record<string, BlockState>>({});
  useEffect(() => {
    try { const raw = localStorage.getItem(todayKey()); if (raw) setCompletions(JSON.parse(raw)); } catch {}
  }, []);
  const setState = useCallback((id: string, target: NonNullable<BlockState>) => {
    setCompletions(prev => {
      const updated = { ...prev, [id]: prev[id] === target ? null : target };
      try { localStorage.setItem(todayKey(), JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const doneCount = Object.values(completions).filter(v => v === "done").length;
  const totalBlocks = blocks.length;
  const completionPct = totalBlocks ? Math.round((doneCount / totalBlocks) * 100) : 0;

  const [streak, setStreak] = useState<number>(0);
  const [deepSessions, setDeepSessions] = useState<number>(0);
  useEffect(() => {
    try { setStreak(parseInt(localStorage.getItem("os_streak") ?? "0", 10) || 0); } catch {}
    try { setDeepSessions(parseInt(localStorage.getItem("dm_cycles_week") ?? "0", 10) || 0); } catch {}
    try { loadNote(new Date()); } catch {}
  }, []);

  const dayIndex = Math.floor(now.getTime() / 86400000);
  const stoic = STOIC_QUOTES[dayIndex % STOIC_QUOTES.length];
  const wisdom = WISDOM[dayIndex % WISDOM.length];

  const remaining = activeBlock ? activeBlock.end - minutesNow : 0;

  const upNextBlocks = useMemo(() => {
    return blocks
      .filter(b => b.start > minutesNow && completions[b.id] !== "done")
      .slice(0, 3);
  }, [blocks, minutesNow, completions]);

  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);

  const scrollToBlock = useCallback((id: string) => {
    const el = document.getElementById(`block-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedBlockId(id);
      setTimeout(() => setHighlightedBlockId(null), 3000);
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        color: MARBLE,
        fontFamily: SANS,
        paddingBottom: 100,
      }}
    >
      <MobileTopBar background="rgba(5,5,5,0.85)" />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* HERO with statue */}
        <section style={{ position: "relative", padding: "28px 22px 0", marginBottom: -10 }}>
          {/* Statue background */}
          <div style={{
            position: "absolute",
            top: -10,
            right: 0,
            bottom: -80,
            width: "85%",
            zIndex: 0,
            pointerEvents: "none",
            WebkitMaskImage: "linear-gradient(to left, black 60%, transparent 100%)",
            maskImage: "linear-gradient(to left, black 60%, transparent 100%)",
          }}>
            <img
              src="/statue.png"
              alt="Stoic Statue"
              style={{
                width: "100%",
                height: "100%",
                paddingRight: "5%",
                paddingTop: "1%",
                objectFit: "contain",
                objectPosition: "right top",
                opacity: 1,
                filter: "drop-shadow(-4px 6px 14px rgba(200,167,106,0.2)) contrast(1.35) brightness(1.05) grayscale(0.2)",
              }}
            />
          </div>
          
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(180deg, transparent 0%, transparent 50%, ${BG} 100%)`,
            pointerEvents: "none",
            zIndex: 1,
          }} />

          <div style={{ position: "relative", zIndex: 2, paddingTop: 40, paddingBottom: 50 }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
            >
              <div style={{
                fontFamily: SERIF, fontSize: 22, fontWeight: 400,
                color: MARBLE, letterSpacing: "-0.01em",
              }}>
                {mounted ? greetingFor(now.getHours()) : "Welcome,"}
              </div>
              <h1 style={{
                fontFamily: SERIF, fontSize: 56, lineHeight: 1, fontWeight: 400,
                margin: "6px 0 0", color: MARBLE, letterSpacing: "-0.02em",
                textShadow: "0 4px 20px rgba(0,0,0,0.5)"
              }}>
                Operator
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.6 }}
              style={{ marginTop: 40, maxWidth: 300 }}
            >
              <p style={{
                fontFamily: SERIF, fontSize: 24,
                lineHeight: 1.35, color: MARBLE, margin: 0,
                fontWeight: 400, textShadow: "0 2px 14px rgba(0,0,0,0.8)"
              }}>
                &ldquo;The obstacle is the way.<br />The time is now.&rdquo;
              </p>
              <div style={{
                marginTop: 20, display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ width: 30, height: 1, background: GOLD, boxShadow: "0 0 10px rgba(200,167,106,0.6)" }} />
                <span style={{
                  fontFamily: SERIF, fontSize: 13, letterSpacing: "0.35em",
                  color: GOLD, textTransform: "uppercase", fontWeight: 500,
                  textShadow: "0 2px 8px rgba(0,0,0,0.6)"
                }}>
                  MARCUS AURELIUS
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CURRENT CHAMBER */}
        <CurrentChamberCard block={activeBlock} remaining={remaining} />

        {/* STAT TILES */}
        <section style={{ padding: "20px 18px 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <StatTile value={<AnimatedCounter value={completionPct} suffix="%" />} label="Today's Progress" ornament={<ProgressRing pct={completionPct} />} />
          <StatTile value={<AnimatedCounter value={streak} />} label="Day Streak" ornament={<TorchIcon />} />
          <StatTile value={<AnimatedCounter value={deepSessions} />} label="Focus Chambers" ornament={<ColumnIcon />} />
        </section>

        {/* WISDOM QUOTE */}
        <section style={{ padding: "22px 18px 0" }}>
          <motion.div
            whileHover="hover"
            style={{
              position: "relative",
              padding: "22px 22px 22px 26px",
              background: SURFACE,
              border: "1px solid rgba(200,167,106,0.10)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <span style={{
              position: "absolute", top: 8, left: 12,
              fontFamily: SERIF, fontSize: 44, lineHeight: 1, color: GOLD, opacity: 0.55,
            }}>
              &ldquo;
            </span>
            <StoicBust />
            <AnimatePresence mode="wait">
              <motion.div
                key={wisdom.q}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                style={{ paddingLeft: 14, paddingTop: 6, position: "relative", zIndex: 2 }}
              >
                <p style={{
                  fontFamily: SERIF, fontSize: 18, lineHeight: 1.4,
                  color: MARBLE, margin: 0, fontWeight: 400,
                  textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}>
                  {wisdom.q}
                </p>
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 18, height: 1, background: BRONZE }} />
                  <span style={{
                    fontFamily: SERIF, fontSize: 11, letterSpacing: "0.32em",
                    color: GOLD, textTransform: "uppercase",
                  }}>
                    {wisdom.a}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </section>

        {/* UP NEXT */}
        <section style={{ padding: "22px 18px 0" }}>
          <div style={{
            padding: "0 4px 14px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <span style={{
              fontFamily: SERIF, fontSize: 12, letterSpacing: "0.35em",
              color: GOLD, textTransform: "uppercase", fontWeight: 500,
            }}>Up Next</span>
            <span style={{ flex: 1, height: 1, background: "linear-gradient(to right, rgba(200,167,106,0.2), transparent)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
            {upNextBlocks.length === 0 && (
              <div style={{ padding: "16px 6px", fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: MUTED }}>
                Nothing more on the path today.
              </div>
            )}
            {upNextBlocks.map((b, i) => (
              <UpNextRow key={b.id} block={b} index={i} onClick={() => scrollToBlock(b.id)} />
            ))}
          </div>
        </section>

        {/* TODAY'S BLOCKS */}
        <section style={{ padding: "26px 18px 0" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            marginBottom: 14,
          }}>
            <span style={{
              fontFamily: SERIF, fontSize: 12, fontWeight: 500,
              letterSpacing: "0.35em", color: GOLD,
              textTransform: "uppercase",
            }}>
              Today's Blocks
            </span>
            <span style={{ flex: 1, height: 1, background: "linear-gradient(to right, rgba(200,167,106,0.2), transparent)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {blocks.map(b => (
              <BlockRow
                key={b.id}
                block={b}
                state={completions[b.id] ?? null}
                isCurrent={activeBlock?.id === b.id}
                isHighlighted={highlightedBlockId === b.id}
                onSet={s => setState(b.id, s)}
              />
            ))}
          </div>
        </section>
      </motion.main>

      <BottomNav />
    </div>
  );
}

/* ===== Current Chamber ===== */
function CurrentChamberCard({ block, remaining }: { block: BlockDef | null; remaining: number }) {
  if (!block) {
    return (
      <section style={{ padding: "0 16px" }}>
        <div style={{
          position: "relative", overflow: "hidden",
          padding: 24, background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          boxShadow: "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(200,167,106,0.06)",
        }}>
          {/* Quiet chamber — faint video still plays */}
          <video autoPlay muted loop playsInline
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", opacity: 0.06, zIndex: 0,
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 40%, black 80%, transparent 100%)",
              maskImage: "linear-gradient(to right, transparent 0%, black 40%, black 80%, transparent 100%)",
            }}
          >
            <source src={currentFocusVideo} type="video/mp4" />
          </video>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontFamily: SANS, fontSize: 10, letterSpacing: "0.32em", color: GOLD, opacity: 0.7 }}>
              THE CHAMBER IS QUIET
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, color: MARBLE, marginTop: 8 }}>
              Rest. Reflect.
            </div>
          </div>
        </div>
      </section>
    );
  }
  const [startStr, endStr] = block.time.split(/[–-]/).map(s => s.trim());
  return (
    <section style={{ padding: "0 16px" }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          position: "relative",
          background: SURFACE,
          border: `1px solid rgba(200,167,106,0.14)`,
          borderLeft: `3px solid ${GOLD}`,
          borderRadius: 16,
          overflow: "hidden",
          minHeight: 160,
          boxShadow:
            `0 0 0 1px rgba(200,167,106,0.06) inset,
             0 12px 48px rgba(0,0,0,0.7),
             0 0 60px -20px rgba(200,167,106,0.10)`,
        }}
      >
        {/* ── Video Layer ── */}
        <video
          autoPlay muted loop playsInline
          style={{
            position: "absolute",
            top: 0, right: 0,
            width: "62%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
            opacity: 0.38,
            zIndex: 0,
            /* Mask: fade from transparent on left → fully visible → fade on right/top/bottom */
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 30%, black 60%, black 90%, transparent 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 30%, black 60%, black 90%, transparent 100%)",
            filter: "brightness(0.75) saturate(0.85) contrast(1.1)",
          }}
        >
          <source src={currentFocusVideo} type="video/mp4" />
        </video>

        {/* ── Content protection overlay (keeps text readable) ── */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background:
            "linear-gradient(to right, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.88) 38%, rgba(10,10,10,0.45) 65%, rgba(10,10,10,0.22) 100%)",
        }} />

        {/* ── Gold shimmer top edge ── */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1, zIndex: 2,
          background: "linear-gradient(to right, rgba(200,167,106,0.6), rgba(200,167,106,0.15) 60%, transparent)",
        }} />

        {/* ── Bottom vignette ── */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 48, zIndex: 2,
          background: "linear-gradient(to top, rgba(10,10,10,0.95), transparent)",
        }} />

        <OrbitOrnament />

        {/* ── Content ── */}
        <div style={{ position: "relative", zIndex: 3, padding: "20px 22px" }}>
          {/* Header row */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* live pulse */}
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: GOLD,
                  boxShadow: "0 0 10px rgba(200,167,106,0.85), 0 0 20px rgba(200,167,106,0.35)",
                  flexShrink: 0,
                }}
              />
              <span style={{
                fontFamily: SANS, fontSize: 8, fontWeight: 600,
                letterSpacing: "0.28em", color: GOLD, textTransform: "uppercase",
              }}>Current Focus</span>
            </div>
            {/* Time badge */}
            <span style={{
              fontFamily: SANS, fontSize: 10, fontWeight: 400,
              color: "rgba(200,167,106,0.65)", letterSpacing: "0.08em",
              background: "rgba(200,167,106,0.06)",
              border: "1px solid rgba(200,167,106,0.14)",
              borderRadius: 6, padding: "2px 8px",
            }}>{startStr} – {endStr}</span>
          </div>

          {/* Task name */}
          <div style={{
            fontFamily: SERIF, fontSize: 34, color: MARBLE,
            lineHeight: 1.08, fontWeight: 400,
            marginBottom: 10,
            letterSpacing: "-0.01em",
            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          }}>
            {block.label}
          </div>

          {/* Remaining time row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: SANS, fontSize: 12, fontWeight: 300, color: MUTED,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            {Math.max(0, remaining)} min remaining

            {/* thin gold progress bar */}
            <div style={{
              flex: 1, height: 1, maxWidth: 80, marginLeft: 8,
              background: "rgba(200,167,106,0.12)",
              borderRadius: 2, overflow: "hidden",
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, 100 - (remaining / (block.end - block.start)) * 100))}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ height: "100%", background: GOLD, borderRadius: 2 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function OrbitOrnament() {
  return (
    <svg
      width="220" height="220" viewBox="0 0 220 220"
      style={{ position: "absolute", right: -30, top: -10, zIndex: 1, pointerEvents: "none" }}
    >
      <ellipse cx="150" cy="120" rx="100" ry="32" stroke={GOLD} strokeOpacity="0.06" fill="none" />
      <ellipse cx="150" cy="120" rx="80" ry="22" stroke={GOLD} strokeOpacity="0.06" fill="none" />
      <ellipse cx="150" cy="120" rx="60" ry="14" stroke={GOLD} strokeOpacity="0.06" fill="none" />
    </svg>
  );
}

/* ===== Stat tiles ===== */
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = performance.now();
    let rAF: number;
    const duration = 1200;
    const animateCount = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(easeOut * value));
      if (progress < 1) {
        rAF = requestAnimationFrame(animateCount);
      }
    };
    rAF = requestAnimationFrame(animateCount);
    return () => cancelAnimationFrame(rAF);
  }, [value]);
  return <>{display}{suffix}</>;
}

function StatTile({ value, label, ornament }: { value: React.ReactNode; label: string; ornament: React.ReactNode }) {
  return (
    <motion.div
      whileHover="hover"
      initial="initial"
      variants={{
        initial: { y: 0, boxShadow: "0 4px 14px rgba(0,0,0,0.4)", borderColor: "rgba(200,167,106,0.08)" },
        hover: { y: -4, boxShadow: "0 16px 32px rgba(0,0,0,0.6)", borderColor: "rgba(200,167,106,0.3)" }
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        padding: "16px 12px 14px", 
        background: `linear-gradient(135deg, rgba(20,20,20,0.8) 0%, rgba(10,10,10,0.95) 100%)`,
        border: "1px solid",
        borderRadius: 14,
        textAlign: "center", 
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)"
      }}
    >
      {/* Subtle black marble texture using noise/gradient */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.03,
        background: `url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noise)" opacity="1"/></svg>')`,
        mixBlendMode: "overlay"
      }} />
      
      {/* Ambient gold illumination on hover */}
      <motion.div
        variants={{ initial: { opacity: 0 }, hover: { opacity: 1 } }}
        transition={{ duration: 0.4 }}
        style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "radial-gradient(circle at top right, rgba(200,167,106,0.1) 0%, transparent 60%)"
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", placeItems: "center", height: 32, marginBottom: 12 }}>
          {ornament}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: MARBLE, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{
          fontFamily: SANS, fontSize: 9, letterSpacing: "0.22em", color: MUTED,
          textTransform: "uppercase", marginTop: 8,
        }}>
          {label}
        </div>
      </div>
    </motion.div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 11, c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div style={{ position: "relative", width: 28, height: 28 }}>
      {/* Soft gold glow based on completion */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: pct > 0 ? 0.4 : 0 }}
        transition={{ duration: 1.5 }}
        style={{
          position: "absolute", inset: -4, background: GOLD, 
          filter: "blur(10px)", borderRadius: "50%", zIndex: 0
        }}
      />
      <svg width="28" height="28" viewBox="0 0 28 28" style={{ position: "relative", zIndex: 1 }}>
        <circle cx="14" cy="14" r={r} fill="none" stroke={BRONZE} strokeOpacity="0.2" strokeWidth="1.5" />
        <motion.circle cx="14" cy="14" r={r} fill="none" stroke={GOLD} strokeWidth="1.5"
          strokeDasharray={c} 
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          strokeLinecap="round"
          transform="rotate(-90 14 14)" 
        />
      </svg>
      {/* Orbiting particle */}
      {pct > 0 && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", inset: 0, zIndex: 2 }}
        >
          <div style={{
            position: "absolute", top: 1, left: "50%", width: 3, height: 3,
            background: "#FFF", borderRadius: "50%", transform: "translate(-50%, -50%)",
            boxShadow: "0 0 6px #FFF, 0 0 10px #DCC08A"
          }} />
        </motion.div>
      )}
    </div>
  );
}

function TorchIcon() {
  return (
    <div style={{ position: "relative", width: 22, height: 28 }}>
      {/* Spark effects */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -15], opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
          style={{
            position: "absolute", top: 10, left: 8 + i * 2, width: 2, height: 2,
            background: GOLD, borderRadius: "50%", boxShadow: "0 0 4px #DCC08A"
          }}
        />
      ))}
      <svg width="22" height="28" viewBox="0 0 22 28" fill="none" style={{ position: "relative", zIndex: 1 }}>
        <motion.path 
          animate={{ opacity: [0.85, 1, 0.85], scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          d="M11 2 C8 6 5 7 5 12 C5 16 8 18 11 18 C14 18 17 16 17 12 C17 7 14 6 11 2 Z" 
          fill={GOLD} 
          style={{ transformOrigin: "center 12px" }}
        />
        <rect x="9" y="18" width="4" height="6" fill={BRONZE} />
        <rect x="8" y="22" width="6" height="2" fill={GOLD} />
      </svg>
    </div>
  );
}

function ColumnIcon() {
  return (
    <div style={{ position: "relative", width: 22, height: 26, overflow: "hidden" }}>
      {/* Vault chamber ambient glow */}
      <motion.div
        animate={{ opacity: [0.15, 0.4, 0.15] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", top: 4, left: 4, right: 4, bottom: 4,
          background: GOLD, filter: "blur(6px)", zIndex: 0
        }}
      />
      <svg width="22" height="26" viewBox="0 0 22 26" fill="none" stroke={GOLD} strokeWidth="1" style={{ position: "relative", zIndex: 1 }}>
        <rect x="3" y="3" width="16" height="2" fill={GOLD} />
        <rect x="2" y="5" width="18" height="1.5" fill={GOLD} />
        <line x1="6" y1="7" x2="6" y2="21" />
        <line x1="11" y1="7" x2="11" y2="21" />
        <line x1="16" y1="7" x2="16" y2="21" />
        <rect x="2" y="21" width="18" height="1.5" fill={GOLD} />
        <rect x="3" y="22.5" width="16" height="2" fill={GOLD} />
      </svg>
      {/* Sweeping highlight */}
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
        style={{
          position: "absolute", top: 0, bottom: 0, left: 0, width: "100%",
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)",
          transform: "skewX(-20deg)", zIndex: 2, pointerEvents: "none"
        }}
      />
    </div>
  );
}
function StoicBust() {
  return (
    <div style={{
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: "100%",
      pointerEvents: "none",
      zIndex: 0,
      overflow: "hidden"
    }}>
      {/* Base gradient to blend into the card left side and protect text readability */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "linear-gradient(to right, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.85) 30%, rgba(10,10,10,0.4) 60%, transparent 100%)",
      }} />
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "linear-gradient(to top, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0) 40%)",
      }} />
      
      {/* Floating particles effect */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, overflow: "hidden" }}>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: Math.random() * 20 + 10, x: Math.random() * 50 - 25 }}
            animate={{ 
              opacity: [0, 0.5, 0],
              y: [Math.random() * 20 + 10, -30],
              x: [Math.random() * 50 - 25, Math.random() * 50 - 25]
            }}
            transition={{
              duration: Math.random() * 4 + 5,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "linear"
            }}
            style={{
              position: "absolute",
              bottom: "10%",
              right: 10 + Math.random() * 80 + "%",
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              backgroundColor: "#DCC08A",
              borderRadius: "50%",
              boxShadow: "0 0 6px #C8A76A",
            }}
          />
        ))}
      </div>

      <motion.img
        variants={{
          hover: { scale: 1.03, opacity: 0.95 }
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        src={quoteSectionImage}
        alt="Stoic Bust"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 20%",
          filter: "contrast(1.15) brightness(0.9) sepia(0.1) hue-rotate(350deg)",
        }}
      />
    </div>
  );
}

/* ===== Up Next row ===== */
function UpNextRow({ block, index, onClick }: { block: BlockDef; index: number; onClick: () => void }) {
  const [startStr, endStr] = block.time.split(/[–-]/).map(s => s.trim());
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(0,0,0,0.5)" }}
      style={{
        display: "grid", gridTemplateColumns: "72px 1fr auto",
        gap: 14, padding: "16px 14px", alignItems: "center",
        background: "linear-gradient(135deg, rgba(18,18,18,0.9) 0%, rgba(12,12,12,0.95) 100%)",
        border: "1px solid rgba(200,167,106,0.06)",
        borderRadius: 14,
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        transition: "border-color 0.3s ease",
        cursor: "pointer",
      }}
      onHoverStart={(e) => {
        const el = e.target as HTMLElement;
        if (el?.style) el.style.borderColor = "rgba(200,167,106,0.18)";
      }}
      onHoverEnd={(e) => {
        const el = e.target as HTMLElement;
        if (el?.style) el.style.borderColor = "rgba(200,167,106,0.06)";
      }}
    >
      {/* Subtle marble texture */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.02,
        background: `url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="1"/></svg>')`,
        mixBlendMode: "overlay"
      }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 8 }}>
        {/* Thin vertical gold separator */}
        <div style={{ width: 1, height: 24, background: "linear-gradient(to bottom, transparent, rgba(200,167,106,0.3), transparent)", flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 400, color: GOLD, letterSpacing: "0.04em" }}>{startStr}</div>
          <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 300, color: DIM, marginTop: 3, letterSpacing: "0.05em" }}>{endStr}</div>
        </div>
      </div>
      <div style={{ minWidth: 0, position: "relative", zIndex: 1 }}>
        <div style={{ fontFamily: SERIF, fontSize: 17, color: MARBLE, fontWeight: 400, letterSpacing: "-0.01em" }}>
          {block.label}
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.1, boxShadow: "0 0 12px rgba(200,167,106,0.25)" }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: 30, height: 30, borderRadius: 8,
          border: "1px solid rgba(200,167,106,0.12)", 
          background: "linear-gradient(135deg, rgba(20,20,20,0.8), rgba(14,14,14,0.95))",
          color: GOLD, display: "grid", placeItems: "center", cursor: "pointer",
          fontFamily: SERIF, fontSize: 18, lineHeight: 1, padding: 0,
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          position: "relative", zIndex: 1,
        }}
        aria-label="Open"
      >
        ›
      </motion.button>
    </motion.div>
  );
}

/* ===== Today's Blocks row ===== */
function BlockRow({
  block, state, isCurrent, isHighlighted, onSet,
}: {
  block: BlockDef;
  state: BlockState;
  isCurrent: boolean;
  isHighlighted: boolean;
  onSet: (s: NonNullable<BlockState>) => void;
}) {
  const done = state === "done";
  const [startStr, endStr] = block.time.split(/[–-]/).map(s => s.trim());
  return (
    <motion.div
      id={`block-${block.id}`}
      whileHover={{ y: -2, boxShadow: `0 12px 32px rgba(0,0,0,0.5)${isCurrent ? ", 0 0 30px -8px rgba(200,167,106,0.12)" : ""}` }}
      animate={{
        boxShadow: isHighlighted 
          ? `0 0 0 2px ${GOLD}, 0 0 24px rgba(200,167,106,0.5)` 
          : isCurrent 
            ? "0 6px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(200,167,106,0.06)"
            : "0 4px 14px rgba(0,0,0,0.3)"
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        background: isCurrent 
          ? "linear-gradient(135deg, rgba(18,16,10,0.95) 0%, rgba(12,11,8,0.98) 100%)"
          : "linear-gradient(135deg, rgba(18,18,18,0.85) 0%, rgba(12,12,12,0.95) 100%)",
        border: "1px solid",
        borderColor: isCurrent ? "rgba(200,167,106,0.16)" : "rgba(200,167,106,0.06)",
        borderLeft: isCurrent ? `3px solid ${GOLD}` : "1px solid rgba(200,167,106,0.06)",
        borderRadius: 14, 
        padding: "16px 16px",
        opacity: done ? 0.4 : 1,
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {/* Highlight Overlay */}
      {isHighlighted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 3, ease: "easeInOut" }}
          style={{
            position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none",
            boxShadow: `inset 0 0 0 2px ${GOLD}, inset 0 0 20px rgba(200,167,106,0.3)`,
            borderRadius: 14,
            background: "rgba(200,167,106,0.08)"
          }}
        />
      )}

      {/* Subtle marble texture */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.02,
        background: `url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="1"/></svg>')`,
        mixBlendMode: "overlay"
      }} />

      {/* Animated light sweep on active card */}
      {isCurrent && (
        <motion.div
          animate={{ x: ["-200%", "400%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
          style={{
            position: "absolute", top: 0, bottom: 0, left: 0, width: "30%",
            background: "linear-gradient(to right, transparent, rgba(200,167,106,0.04), transparent)",
            transform: "skewX(-20deg)", zIndex: 0, pointerEvents: "none"
          }}
        />
      )}

      {/* Ambient gold glow for active */}
      {isCurrent && (
        <div style={{
          position: "absolute", top: 0, left: 0, bottom: 0, width: 80,
          background: "linear-gradient(to right, rgba(200,167,106,0.06), transparent)",
          zIndex: 0, pointerEvents: "none"
        }} />
      )}

      {/* Time column with vertical separator */}
      <div style={{ minWidth: 64, position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 8 }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 12, fontWeight: 400, color: isCurrent ? GOLD : "rgba(200,167,106,0.7)", letterSpacing: "0.04em" }}>{startStr}</div>
          <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 300, color: DIM, marginTop: 3, letterSpacing: "0.05em" }}>{endStr}</div>
        </div>
        <div style={{ width: 1, height: 28, background: "linear-gradient(to bottom, transparent, rgba(200,167,106,0.15), transparent)", flexShrink: 0 }} />
      </div>

      {/* Task title */}
      <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: SERIF, fontSize: 17, fontWeight: 400,
          color: done ? DIM : MARBLE,
          textDecoration: done ? "line-through" : undefined,
          letterSpacing: "-0.01em",
          textShadow: isCurrent ? "0 1px 6px rgba(0,0,0,0.4)" : undefined,
        }}>
          {block.label}
        </div>
      </div>

      {/* Status buttons */}
      <div style={{ display: "flex", gap: 5, position: "relative", zIndex: 1 }}>
        <StatusBtn label="✓" active={state === "done"} activeColor={GOLD} activeBg="rgba(200,167,106,0.12)" onClick={() => onSet("done")} />
        <StatusBtn label="½" active={state === "partial"} activeColor={BRONZE} activeBg="rgba(138,106,58,0.12)" onClick={() => onSet("partial")} />
        <StatusBtn label="×" active={state === "missed"} activeColor="#8a3a3a" activeBorder="#6a2a2a" activeBg="rgba(106,42,42,0.12)" onClick={() => onSet("missed")} />
      </div>
    </motion.div>
  );
}

function StatusBtn({
  label, active, activeColor, activeBg, activeBorder, onClick,
}: {
  label: string; active: boolean; activeColor: string; activeBg: string;
  activeBorder?: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, boxShadow: `0 0 10px ${active ? activeColor : "rgba(200,167,106,0.15)"}` }}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      style={{
        width: 30, height: 30, borderRadius: 8,
        border: `1px solid ${active ? (activeBorder ?? activeColor) : "rgba(200,167,106,0.08)"}`,
        background: active ? activeBg : "linear-gradient(135deg, rgba(20,20,20,0.6), rgba(14,14,14,0.8))",
        color: active ? activeColor : DIM,
        fontFamily: SANS, fontSize: 11, cursor: "pointer",
        display: "grid", placeItems: "center", padding: 0,
        lineHeight: 1,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      {label}
    </motion.button>
  );
}
