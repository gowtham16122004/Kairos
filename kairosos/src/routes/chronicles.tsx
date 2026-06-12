import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { MobileTopBar } from "@/components/mobile/MobileTopBar";
import { Search, X, Bookmark, ChevronLeft, ChevronRight, Edit2, Trash2, Plus, Share2 } from "lucide-react";

// @ts-ignore
import notesBg from "../assets/notes background.png";
// @ts-ignore
import dailyNotesBg from "../assets/daily notes.png";
// @ts-ignore
import writeAChronicleImg from "../assets/Write a Chronicle.png";
// @ts-ignore
import statueImg from "../assets/CHRONICLES statue.png";

export const Route = createFileRoute("/chronicles")({
  component: ChroniclesPage,
  head: () => ({
    meta: [
      { title: "The Chronicles — KairosOS" },
      { name: "description", content: "Capture thoughts. Preserve wisdom." },
    ],
  }),
});

/* ───────────── fonts & palette ───────────── */
const SERIF = `"Cormorant Garamond", ui-serif, Georgia, serif`;
const SANS  = `"Inter", ui-sans-serif, system-ui, sans-serif`;

const C = {
  bg:        "#050505",
  surface:   "#0A0A0A",
  card:      "rgba(14, 14, 14, 0.75)",
  border:    "rgba(200, 167, 106, 0.12)",
  gold:      "#C8A76A",
  goldDim:   "#8A7042",
  marble:    "#E9E2D8",
  muted:     "#8E8578",
  darkMuted: "#3A3530",
};

/* ───────────── types & utils ───────────── */
export interface Chronicle {
  id: string;
  createdAt: number;
  dateString: string; // YYYY-MM-DD
  title: string;
  content: string;
  tags: string[];
}

const CHRONICLES_KEY = "kairos_chronicles";
const DRAFT_KEY = "kairos_chronicle_draft";

function isoFor(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadChronicles(): Chronicle[] {
  try {
    const data = localStorage.getItem(CHRONICLES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveChronicles(chronicles: Chronicle[]) {
  try {
    localStorage.setItem(CHRONICLES_KEY, JSON.stringify(chronicles));
  } catch {}
}

/* ───────────── component ───────────── */
function ChroniclesPage() {
  const [mounted, setMounted] = useState(false);
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  
  // Calendar state
  const [today] = useState(() => new Date());
  const [calMonth, setCalMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Composer state
  const [isComposing, setIsComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [composerTitle, setComposerTitle] = useState("");
  const [composerContent, setComposerContent] = useState("");
  const [composerTags, setComposerTags] = useState<string[]>([]);
  const [draftSaved, setDraftSaved] = useState(false);

  // Detail View State
  const [viewingId, setViewingId] = useState<string | null>(null);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parallax Scroll hook
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 500], [0, -100]);

  useEffect(() => {
    setChronicles(loadChronicles());
    setMounted(true);
    
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.content || parsed.title) {
          setComposerTitle(parsed.title || "");
          setComposerContent(parsed.content || "");
          setComposerTags(parsed.tags || []);
        }
      }
    } catch {}
  }, []);

  /* ───────── AUTO-SAVE DRAFT ───────── */
  useEffect(() => {
    if (!mounted || editingId || (!composerTitle && !composerContent)) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          title: composerTitle,
          content: composerContent,
          tags: composerTags
        }));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      } catch {}
    }, 1000);
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
  }, [composerTitle, composerContent, composerTags, mounted, editingId]);

  /* ───────── CALENDAR LOGIC ───────── */
  const cal = useMemo(() => {
    const first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
    const startDay = first.getDay(); 
    const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
    const cells: ({ date: Date } | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(calMonth.getFullYear(), calMonth.getMonth(), d) });
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calMonth]);

  const monthLabel = calMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" }).toUpperCase();
  
  const shiftMonth = (delta: number) => {
    setCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const datesWithChronicles = useMemo(() => {
    const set = new Set<string>();
    chronicles.forEach(c => set.add(c.dateString));
    return set;
  }, [chronicles]);

  /* ───────── FILTERING & GROUPING ───────── */
  const filteredChronicles = useMemo(() => {
    let result = chronicles;
    
    if (selectedDate && !searchQuery) {
      const targetDate = isoFor(selectedDate);
      result = result.filter(c => c.dateString === targetDate);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.content.toLowerCase().includes(q)
      );
    }
    
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [chronicles, selectedDate, searchQuery]);

  const groupedChronicles = useMemo(() => {
    const groups: { [key: string]: Chronicle[] } = {};
    filteredChronicles.forEach(c => {
      const parts = c.dateString.split("-");
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const dateKey = d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(c);
    });
    return Object.entries(groups).map(([date, items]) => ({ date, items }));
  }, [filteredChronicles]);

  /* ───────── ACTIONS ───────── */
  const handleSaveChronicle = () => {
    if (!composerTitle.trim() && !composerContent.trim()) return;
    
    const now = new Date();
    let targetDateObj = now;
    if (selectedDate && !editingId) {
      targetDateObj = new Date(selectedDate);
      targetDateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    }

    const newChronicle: Chronicle = {
      id: editingId || crypto.randomUUID(),
      createdAt: editingId ? (chronicles.find(c => c.id === editingId)?.createdAt || now.getTime()) : targetDateObj.getTime(),
      dateString: editingId ? (chronicles.find(c => c.id === editingId)?.dateString || isoFor(now)) : isoFor(targetDateObj),
      title: composerTitle.trim() || "Untitled Thought",
      content: composerContent.trim(),
      tags: composerTags
    };
    
    let updated: Chronicle[];
    if (editingId) {
      updated = chronicles.map(c => c.id === editingId ? newChronicle : c);
    } else {
      updated = [...chronicles, newChronicle];
      setSelectedDate(targetDateObj);
    }
    
    setChronicles(updated);
    saveChronicles(updated);
    
    setComposerTitle("");
    setComposerContent("");
    setComposerTags([]);
    setEditingId(null);
    setIsComposing(false);
    
    if (viewingId === newChronicle.id) {
      setViewingId(newChronicle.id);
    }

    localStorage.removeItem(DRAFT_KEY);
  };

  const handleDiscard = () => {
    if (!editingId) {
      setComposerTitle("");
      setComposerContent("");
      setComposerTags([]);
      localStorage.removeItem(DRAFT_KEY);
    }
    setEditingId(null);
    setIsComposing(false);
  };

  const handleEdit = (c: Chronicle) => {
    setComposerTitle(c.title);
    setComposerContent(c.content);
    setComposerTags([...c.tags]);
    setEditingId(c.id);
    setIsComposing(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Archive memory permanently?")) {
      const updated = chronicles.filter(c => c.id !== id);
      setChronicles(updated);
      saveChronicles(updated);
      if (viewingId === id) setViewingId(null);
    }
  };

  if (!mounted) return null;

  const viewingChronicle = viewingId ? chronicles.find(c => c.id === viewingId) : null;

  return (
    <div style={{
      minHeight: "100vh", 
      background: C.bg, 
      color: C.marble,
      fontFamily: SANS, 
      paddingBottom: 110, 
      position: "relative", 
    }}>
      <MobileTopBar background="transparent" />

      {/* ── CHRONICLES MAIN ENTRANCE BACKGROUND ── */}
      <motion.div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, height: "80vh",
        backgroundImage: `url("${notesBg}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
        maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
        opacity: 0.65,
        zIndex: 0, pointerEvents: "none",
        filter: "contrast(1.1) brightness(0.7)",
        y: backgroundY, // Parallax movement
      }} />
      
      {/* Drifting Particles & Shadow Movement */}
      <div className="kairos-drifting-particles" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }} />
      <div className="kairos-shadow-sweep" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }} />

      <motion.main
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
        style={{ position: "relative", zIndex: 1, padding: "70px 16px 32px", maxWidth: 600, margin: "0 auto" }}
      >
        {/* ───────── CURATED HERO ───────── */}
        <header style={{ marginBottom: 24, paddingLeft: 8, position: "relative" }}>
          {/* Warm gold light bloom near the title */}
          <div style={{
            position: "absolute", top: "50%", left: 0, transform: "translateY(-50%)",
            width: 150, height: 150, background: "radial-gradient(circle, rgba(200,167,106,0.2) 0%, transparent 70%)",
            filter: "blur(20px)", zIndex: -1, pointerEvents: "none"
          }} />
          
          <h1 style={{
            fontFamily: SERIF, fontWeight: 400, fontSize: 44, letterSpacing: "-0.01em",
            color: C.marble, margin: "0 0 4px",
            textShadow: "0 4px 20px rgba(0,0,0,0.8)"
          }}>
            THE CHRONICLES
          </h1>
          <p style={{
            fontFamily: SERIF, fontWeight: 300, fontStyle: "italic",
            fontSize: 16, color: C.gold, margin: 0, paddingLeft: 4,
            textShadow: "0 1px 4px rgba(0,0,0,0.5)"
          }}>
            Capture thoughts. Preserve wisdom.
          </p>
        </header>

        {/* ───────── ARCHIVE PORTAL (CALENDAR) ───────── */}
        <section style={{
          background: `linear-gradient(180deg, rgba(20,16,12,.92), rgba(8,8,8,.98))`, 
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${C.border}`, borderTop: `1px solid rgba(200,167,106,0.25)`,
          borderRadius: 24, padding: "20px 16px", marginBottom: 32,
          boxShadow: `0 20px 50px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,215,120,.08)`
        }}>
          {/* Calendar Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "0 8px" }}>
            <button onClick={() => shiftMonth(-1)} style={navBtnStyle}><ChevronLeft size={18} strokeWidth={1.5} /></button>
            <div style={{
              fontFamily: SANS, fontWeight: 600, fontSize: 13,
              color: C.gold, letterSpacing: "0.15em",
            }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={monthLabel}
                  initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.3 }}
                >
                  {monthLabel}
                </motion.span>
              </AnimatePresence>
            </div>
            <button onClick={() => shiftMonth(1)} style={navBtnStyle}><ChevronRight size={18} strokeWidth={1.5} /></button>
          </div>

          {/* Days Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
            marginBottom: 8
          }}>
            {["SUN","MON","TUE","WED","THU","FRI","SAT"].map((d, i) => (
              <div key={i} style={{
                textAlign: "center", fontFamily: SANS, fontSize: 10, fontWeight: 500,
                letterSpacing: "0.1em", color: C.muted,
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={monthLabel + "-grid"}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 6 }}
            >
              {cal.map((cell, i) => {
                if (!cell) return <div key={i} style={{ height: 40 }} />;
                const d = cell.date;
                const iso = isoFor(d);
                const hasChronicle = datesWithChronicles.has(iso);
                const isSelected = selectedDate && isoFor(selectedDate) === iso;
                
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (isSelected) setSelectedDate(null);
                      else {
                        setSelectedDate(d);
                        setSearchQuery(""); // Clear search when picking a date
                      }
                    }}
                    style={{
                      height: 44, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      background: "transparent", border: "none", padding: 0,
                      cursor: "pointer", position: "relative",
                    }}
                  >
                    {/* Premium Selected Pill */}
                    {isSelected && (
                      <motion.div layoutId="calRing" style={{
                        position: "absolute", top: 2, bottom: 2, left: 6, right: 6,
                        background: "rgba(200,167,106,0.15)",
                        border: `1px solid rgba(200, 167, 106, 0.4)`, borderRadius: 12,
                        boxShadow: `0 4px 10px rgba(200,167,106,0.15), inset 0 2px 4px rgba(200,167,106,0.1)`
                      }} />
                    )}
                    
                    <span style={{
                      fontFamily: SANS, fontSize: 15, fontWeight: isSelected ? 500 : 400,
                      color: isSelected ? C.gold : C.marble, zIndex: 1,
                      marginTop: hasChronicle ? -4 : 0,
                      textShadow: isSelected ? "0 1px 4px rgba(0,0,0,0.8)" : "none"
                    }}>
                      {d.getDate()}
                    </span>
                    
                    {hasChronicle && (
                      <span style={{
                        position: "absolute", bottom: 6, zIndex: 2,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        filter: "drop-shadow(0 0 2px rgba(200,167,106,0.8))"
                      }}>
                        <TinyLaurelIndicator />
                      </span>
                    )}
                    {/* Illuminated Seal for selected date */}
                    {isSelected && !hasChronicle && (
                      <span style={{
                        position: "absolute", bottom: 6, zIndex: 2,
                        width: 4, height: 4, borderRadius: "50%", background: C.goldDim,
                        boxShadow: `0 0 4px ${C.gold}`
                      }} />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ───────── SEARCH BAR ───────── */}
        <AnimatePresence>
          {!selectedDate && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden", marginBottom: 24 }}
            >
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "linear-gradient(180deg, rgba(20,16,12,.8), rgba(8,8,8,.9))", border: `1px solid ${C.border}`, borderRadius: 16, padding: "10px 16px"
              }}>
                <Search size={16} color={C.muted} />
                <input 
                  type="text" placeholder="Search the archive..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    color: C.marble, fontFamily: SANS, fontSize: 14
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───────── THE ARCHIVE TIMELINE ───────── */}
        <section>
          {filteredChronicles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted, fontFamily: SANS, fontSize: 14 }}>
              {searchQuery ? "No wisdom matches your search." : "The archive is silent on this day."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {groupedChronicles.map(({ date, items }, groupIndex) => (
                <div key={date}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 4px" }}>
                    <span style={{
                      fontFamily: SANS, fontSize: 11, fontWeight: 600,
                      letterSpacing: "0.15em", color: C.gold, textTransform: "uppercase"
                    }}>
                      {selectedDate && !searchQuery ? `Chronicles from ${date}` : date}
                    </span>
                    <span style={{
                      background: "rgba(200,167,106,0.1)", color: C.gold,
                      fontFamily: SANS, fontSize: 11, fontWeight: 500,
                      padding: "2px 8px", borderRadius: 10
                    }}>
                      {items.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {items.map((chronicle, index) => (
                      <ChronicleCard 
                        key={chronicle.id} 
                        data={chronicle} 
                        index={groupIndex * 10 + index}
                        iconType={index % 2 === 0 ? "laurel" : "pillar"}
                        onTap={() => setViewingId(chronicle.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </motion.main>

      {/* ───────── FLOATING ACTION BUTTON (WAX SEAL) ───────── */}
      <motion.button
        whileHover={{ scale: 1.02, filter: "brightness(1.1)" }} whileTap={{ scale: 0.92 }}
        onClick={() => setIsComposing(true)}
        className="kairos-fab-wax-seal"
        style={{
          position: "fixed", bottom: 84, right: 20, zIndex: 50,
          width: 64, height: 64, borderRadius: 32,
          background: `linear-gradient(135deg, #DFBE7B, #957A47)`,
          color: C.bg, border: "2px solid #EAD19B", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 32px rgba(0,0,0,0.8), inset 0 4px 6px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.3), 0 0 24px rgba(200,167,106,0.3)"
        }}
      >
        <FabWaxSealSvg />
      </motion.button>

      {/* ───────── CHRONICLE DETAIL PAGE OVERLAY ───────── */}
      <AnimatePresence>
        {viewingChronicle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              position: "fixed", inset: 0, zIndex: 90,
              background: C.bg, display: "flex", flexDirection: "column",
              overflowY: "auto"
            }}
          >
            {/* Cinematic Background (50-60% black overlay) */}
            <div style={{
              position: "fixed", inset: 0,
              backgroundImage: `url("${dailyNotesBg}")`, backgroundSize: "cover", backgroundPosition: "center",
              zIndex: 0, pointerEvents: "none"
            }} />
            <div style={{
              position: "fixed", inset: 0,
              background: "linear-gradient(to bottom, rgba(5,5,5,0.5) 0%, rgba(5,5,5,0.65) 100%)",
              zIndex: 0, pointerEvents: "none"
            }} />
            <div style={{
              position: "fixed", inset: 0,
              backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)",
              zIndex: 0, pointerEvents: "none"
            }} />
            
            <div style={{ position: "relative", zIndex: 1, padding: "24px 20px 40px", minHeight: "100%", display: "flex", flexDirection: "column" }}>
              
              {/* HEADER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingTop: "env(safe-area-inset-top)" }}>
                <button onClick={() => setViewingId(null)} style={{ background: "transparent", border: "none", color: C.marble, cursor: "pointer", padding: 0, display: "flex" }}>
                  <ChevronLeft size={28} strokeWidth={1.5} />
                </button>
                <div style={{ fontFamily: SERIF, fontSize: 24, color: C.marble, opacity: 0.9, letterSpacing: "0.02em" }}>
                  Chronicle
                </div>
                <div style={{ width: 28 }} /> {/* Spacer */}
              </div>

              {/* HERO SECTION */}
              <div style={{ marginBottom: 40, position: "relative" }}>
                {/* Gold bloom behind title */}
                <div style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                  width: "100%", height: 100, background: "radial-gradient(circle, rgba(200,167,106,0.15) 0%, transparent 70%)",
                  filter: "blur(30px)", zIndex: -1, pointerEvents: "none"
                }} />

                <h1 style={{ fontFamily: SERIF, fontSize: 40, color: C.marble, fontWeight: 400, margin: "0 0 16px", lineHeight: 1.15, textShadow: "0 2px 10px rgba(0,0,0,0.6)", textAlign: "center" }}>
                  {viewingChronicle.title}
                </h1>
                
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <span style={{ fontFamily: SANS, fontSize: 13, color: C.muted, letterSpacing: "0.02em" }}>
                    {new Date(viewingChronicle.dateString).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.muted }} />
                  <span style={{ fontFamily: SANS, fontSize: 13, color: C.muted, letterSpacing: "0.02em" }}>
                    {new Date(viewingChronicle.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {viewingChronicle.tags.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
                    {viewingChronicle.tags.map(tag => (
                      <span key={tag} style={{ fontFamily: SANS, fontSize: 12, color: C.goldDim, border: `1px solid rgba(200,167,106,0.3)`, padding: "6px 14px", borderRadius: 16, letterSpacing: "0.05em", background: "rgba(10,10,10,0.3)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* CONTENT AREA (Free-flowing manuscript style) */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
                style={{ marginBottom: 60, flex: 1, padding: "0 12px" }}
              >
                <div style={{
                  fontFamily: SERIF, fontSize: 22, lineHeight: 2.0, color: C.marble, 
                  whiteSpace: "pre-wrap", textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                }}>
                  {viewingChronicle.content}
                </div>
              </motion.div>

              {/* BOTTOM ACTIONS */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px", marginTop: "auto" }}>
                {/* Delete (Left, Red) */}
                <button onClick={() => handleDelete(viewingChronicle.id)} style={{
                  width: 50, height: 50, borderRadius: 16, background: "rgba(10,10,10,0.4)",
                  border: `1px solid rgba(170,85,85,0.4)`, color: "#d67", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
                }}>
                  <Trash2 size={20} strokeWidth={1.5} />
                </button>

                {/* Share (Center, Gold) */}
                <button onClick={() => {}} style={{
                  width: 50, height: 50, borderRadius: 16, background: "rgba(10,10,10,0.4)",
                  border: `1px solid ${C.goldDim}`, color: C.gold, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
                }}>
                  <Share2 size={20} strokeWidth={1.5} />
                </button>

                {/* Edit (Right, Gold Prominent) */}
                <button onClick={() => handleEdit(viewingChronicle)} style={{
                  width: 50, height: 50, borderRadius: 16, background: "rgba(10,10,10,0.4)",
                  border: `1px solid ${C.goldDim}`, color: C.gold, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
                }}>
                  <Edit2 size={20} strokeWidth={1.5} />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────── COMPOSER OVERLAY ───────── */}
      <AnimatePresence>
        {isComposing && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: C.bg, display: "flex", flexDirection: "column"
            }}
          >
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", padding: "12px 20px 24px" }}>
              
              {/* COMPACT HEADER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, paddingTop: "env(safe-area-inset-top)" }}>
                <button onClick={handleDiscard} style={{ background: "transparent", border: "none", color: C.marble, cursor: "pointer", padding: 0, display: "flex" }}>
                  <ChevronLeft size={28} strokeWidth={1.5} />
                </button>
                <div style={{ width: 28 }} /> {/* Spacer */}
              </div>

              {/* TIGHTER HERO SECTION */}
              <div style={{ textAlign: "center", marginBottom: 16, position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 4, position: "relative" }}>
                  {/* Warm golden glow behind the statue */}
                  <div style={{ 
                    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", 
                    width: 180, height: 180, background: "radial-gradient(circle, rgba(200,167,106,0.25) 0%, transparent 70%)", 
                    filter: "blur(24px)", zIndex: 0, pointerEvents: "none" 
                  }} />
                  <img 
                    src={statueImg} 
                    alt="Chronicles Statue" 
                    style={{ position: "relative", zIndex: 1, width: 220, height: "auto", filter: "drop-shadow(0 8px 32px rgba(200,167,106,0.5))", opacity: 0.95 }} 
                    draggable={false} 
                  />
                </div>
                <h2 style={{ fontFamily: SERIF, fontSize: 36, color: C.marble, fontWeight: 400, margin: "0 0 12px", textShadow: "0 2px 10px rgba(0,0,0,0.5)", position: "relative", zIndex: 2 }}>
                  {editingId ? "Edit Chronicle" : "Write a Chronicle"}
                </h2>
                <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 18, color: C.gold, margin: "0 0 8px", lineHeight: 1.4, position: "relative", zIndex: 2 }}>
                  "Scribe not for the world,<br/>but for your future self."
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, position: "relative", zIndex: 2 }}>
                  <span style={{ width: 14, height: 1, background: C.goldDim }} />
                  <span style={{ fontFamily: SANS, fontSize: 9, letterSpacing: "0.2em", color: C.goldDim, textTransform: "uppercase", fontWeight: 500 }}>
                    MARCUS AURELIUS
                  </span>
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", paddingBottom: 20 }}>
                
                {/* TIGHTER TITLE INPUT */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", color: C.goldDim, marginBottom: 6, textTransform: "uppercase" }}>
                    TITLE
                  </label>
                  <input
                    type="text"
                    placeholder="Give your thought a title..."
                    value={composerTitle}
                    onChange={e => setComposerTitle(e.target.value)}
                    style={{
                      width: "100%", background: "rgba(10,10,10,0.7)",
                      border: `1px solid ${C.border}`, borderRadius: 12,
                      padding: "14px 16px", outline: "none",
                      fontFamily: SANS, fontSize: 16, color: C.marble,
                      boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)",
                      transition: "all 0.3s"
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = C.goldDim; e.currentTarget.style.boxShadow = `inset 0 2px 10px rgba(0,0,0,0.5), 0 0 8px rgba(200,167,106,0.15)`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = `inset 0 2px 10px rgba(0,0,0,0.5)`; }}
                  />
                </div>
                
                {/* CONTENT AREA */}
                <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", height: "45%" }}>
                  <label style={{ display: "block", fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", color: C.goldDim, marginBottom: 6, textTransform: "uppercase" }}>
                    YOUR CHRONICLE
                  </label>
                  <div style={{
                    flex: 1, position: "relative",
                    backgroundColor: "rgba(10,10,10,0.9)",
                    backgroundImage: `linear-gradient(rgba(5,5,5,0.7), rgba(5,5,5,0.85)), url("${writeAChronicleImg}")`,
                    backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat",
                    border: `1px solid ${C.border}`, borderRadius: 16,
                    boxShadow: "inset 0 2px 20px rgba(0,0,0,0.6)",
                    display: "flex", flexDirection: "column", overflow: "hidden",
                    transition: "all 0.3s"
                  }}>
                    <textarea
                      ref={contentRef}
                      placeholder="Start writing...&#10;What's on your mind today?"
                      value={composerContent}
                      onChange={e => setComposerContent(e.target.value)}
                      onFocus={(e) => { e.currentTarget.parentElement!.style.borderColor = C.goldDim; e.currentTarget.parentElement!.style.boxShadow = `inset 0 2px 20px rgba(0,0,0,0.6), 0 0 12px rgba(200,167,106,0.1)`; }}
                      onBlur={(e) => { e.currentTarget.parentElement!.style.borderColor = C.border; e.currentTarget.parentElement!.style.boxShadow = `inset 0 2px 20px rgba(0,0,0,0.6)`; }}
                      style={{
                        flex: 1, background: "transparent", border: "none", outline: "none",
                        fontFamily: SANS, fontSize: 16, lineHeight: 1.6, color: C.marble,
                        resize: "none", padding: "16px", zIndex: 2, position: "relative"
                      }}
                    />
                    {/* Custom Statue Decoration */}
                    <img 
                      src={statueImg} 
                      alt="" 
                      style={{ 
                        position: "absolute", bottom: 16, right: 16, 
                        width: 80, height: "auto", opacity: 0.1, 
                        pointerEvents: "none", zIndex: 1,
                        filter: "blur(0.5px)" 
                      }} 
                      draggable={false} 
                    />
                  </div>
                </div>

                {/* TAGS */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", color: C.goldDim, marginBottom: 8, textTransform: "uppercase" }}>
                    TAGS (OPTIONAL)
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    {composerTags.map(tag => (
                      <span key={tag} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "rgba(10,10,10,0.6)", border: `1px solid ${C.goldDim}`, borderRadius: 14,
                        padding: "6px 12px", fontFamily: SANS, fontSize: 13, color: C.gold,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
                      }}>
                        {tag}
                        <button onClick={() => setComposerTags(composerTags.filter(t => t !== tag))} style={{ background: "transparent", border: "none", color: C.goldDim, padding: 0, display: "flex", cursor: "pointer" }}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                    <button 
                      onClick={() => {
                        const t = window.prompt("Enter a new tag:");
                        if (t && t.trim() && !composerTags.includes(t.trim())) setComposerTags([...composerTags, t.trim()]);
                      }}
                      style={{
                        width: 30, height: 30, borderRadius: 15,
                        background: "rgba(10,10,10,0.6)", border: `1px dashed ${C.goldDim}`,
                        color: C.goldDim, display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all 0.2s"
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* BOTTOM ACTION BUTTONS */}
                <div style={{ display: "flex", gap: 12, marginBottom: 16, marginTop: "auto" }}>
                  <button 
                    onClick={handleDiscard}
                    style={{
                      flex: 1, padding: "16px", borderRadius: 16,
                      background: "rgba(10,10,10,0.8)", border: `1px solid ${C.goldDim}`,
                      color: C.marble, fontFamily: SANS, fontSize: 15, fontWeight: 500, cursor: "pointer"
                    }}
                  >
                    Discard
                  </button>
                  <button 
                    onClick={handleSaveChronicle}
                    style={{
                      flex: 1.5, padding: "16px", borderRadius: 16,
                      background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`, border: "none",
                      color: C.bg, fontFamily: SANS, fontSize: 15, fontWeight: 600, cursor: "pointer",
                      boxShadow: "0 8px 24px rgba(200,167,106,0.3)",
                      opacity: (!composerTitle && !composerContent) ? 0.5 : 1
                    }}
                  >
                    Save Chronicle
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes floatParticles {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          25% { opacity: 0.3; }
          50% { transform: translateY(-50px) translateX(20px); opacity: 0; }
          100% { transform: translateY(0) translateX(0); opacity: 0; }
        }
        .kairos-drifting-particles {
          background-image: radial-gradient(circle at center, rgba(200,167,106,0.2) 1px, transparent 1px);
          background-size: 80px 80px;
          animation: floatParticles 20s infinite linear;
          opacity: 0.5;
        }
        @keyframes breatheGlow {
          0%, 100% { box-shadow: 0 12px 32px rgba(0,0,0,0.8), inset 0 4px 6px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.3), 0 0 16px rgba(200,167,106,0.1); }
          50% { box-shadow: 0 12px 32px rgba(0,0,0,0.8), inset 0 4px 6px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.3), 0 0 28px rgba(200,167,106,0.4); }
        }
        .kairos-fab-wax-seal {
          animation: breatheGlow 4s infinite ease-in-out;
        }
      `}</style>

      <BottomNav />
    </div>
  );
}

/* ───────────── Subcomponents ───────────── */

function ChronicleCard({ data, iconType, onTap, index }: { data: Chronicle, iconType: "laurel" | "pillar", onTap: () => void, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(200,167,106,0.15)", borderColor: "rgba(200,167,106,0.25)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      style={{
        background: `linear-gradient(135deg, rgba(20,20,20,0.85) 0%, rgba(10,10,10,0.95) 100%)`, 
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${C.border}`, borderRadius: 16,
        overflow: "hidden", position: "relative", cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease"
      }}
    >
      {/* Decorative tiny watermark layer */}
      <div style={{ position: "absolute", top: -10, right: -10, opacity: 0.03, transform: "scale(2) rotate(15deg)", pointerEvents: "none" }}>
        {iconType === "laurel" ? <LaurelCardSvg /> : <PillarCardSvg />}
      </div>

      <div style={{ padding: "16px", display: "flex", gap: 14, alignItems: "center" }}>
        {/* Compressed Left Icon */}
        <div style={{ 
          width: 40, height: 40, borderRadius: 20, border: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          color: C.gold, background: "rgba(200, 167, 106, 0.04)"
        }}>
          {iconType === "laurel" ? <LaurelCardSvg /> : <PillarCardSvg />}
        </div>

        {/* Dense Center Content */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <h4 style={{ fontFamily: SERIF, fontSize: 18, color: C.marble, margin: 0, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {data.title}
          </h4>
          <p style={{
            fontFamily: SANS, fontSize: 12, color: C.muted, lineHeight: 1.4, margin: 0,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: 0.8
          }}>
            {data.content}
          </p>
        </div>

        {/* Right Details */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <Bookmark size={14} color={C.goldDim} strokeWidth={1.5} />
          <span style={{ fontFamily: SANS, fontSize: 10, color: C.darkMuted, fontWeight: 600 }}>
            {new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

const navBtnStyle = {
  background: "transparent", border: "none",
  color: C.goldDim, cursor: "pointer", padding: 4, transition: "color 0.2s"
};

/* ───────────── Custom Icons ───────────── */
function TinyLaurelIndicator() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.goldDim} strokeWidth="1.5">
      <path d="M4 12C4 18 8 22 12 22C16 22 20 18 20 12" />
      <path d="M7 16C7 16 10 14 10 12" />
      <path d="M17 16C17 16 14 14 14 12" />
    </svg>
  );
}

function LaurelHeaderSvg() {
  return (
    <svg width="40" height="20" viewBox="0 0 40 20" fill="none" stroke={C.gold}>
      <path d="M12 18C12 18 6 16 6 10C6 4 16 4 16 4C16 4 10 7 10 12C10 17 12 18 12 18Z" fill="currentColor" fillOpacity="0.3"/>
      <path d="M28 18C28 18 34 16 34 10C34 4 24 4 24 4C24 4 30 7 30 12C30 17 28 18 28 18Z" fill="currentColor" fillOpacity="0.3"/>
      <circle cx="20" cy="16" r="1.5" fill={C.gold} stroke="none"/>
    </svg>
  );
}

function LaurelCardSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M4 12C4 18 8 22 12 22C16 22 20 18 20 12" />
      <path d="M7 16C7 16 10 14 10 12C10 10 7 9 7 9" />
      <path d="M17 16C17 16 14 14 14 12C14 10 17 9 17 9" />
      <path d="M5 12C5 12 8 10 8 8C8 6 5 5 5 5" />
      <path d="M19 12C19 12 16 10 16 8C16 6 19 5 19 5" />
    </svg>
  );
}

function PillarCardSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="4" y="3" width="16" height="2"/>
      <rect x="3" y="5" width="18" height="2"/>
      <line x1="7" y1="7" x2="7" y2="19"/>
      <line x1="12" y1="7" x2="12" y2="19"/>
      <line x1="17" y1="7" x2="17" y2="19"/>
      <rect x="3" y="19" width="18" height="2"/>
    </svg>
  );
}

function FabWaxSealSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" fill="rgba(200,167,106,0.2)" stroke="none" />
      <path d="M12 7V17M7 12H17" strokeWidth="1.5" />
      <path d="M12 7V17M7 12H17" strokeWidth="1.5" transform="rotate(45 12 12)" opacity="0.3" />
    </svg>
  );
}

function OrnamentalDividerSvg() {
  return (
    <svg width="60" height="12" viewBox="0 0 60 12" fill="none" stroke={C.goldDim} strokeWidth="1">
      <line x1="0" y1="6" x2="24" y2="6" />
      <line x1="36" y1="6" x2="60" y2="6" />
      <path d="M28 4L30 2L32 4L30 6L28 4Z" fill="currentColor" />
      <path d="M28 8L30 6L32 8L30 10L28 8Z" fill="currentColor" />
    </svg>
  );
}
