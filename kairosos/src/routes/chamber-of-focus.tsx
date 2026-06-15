import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Hourglass } from "lucide-react";
import { MobileTopBar } from "@/components/mobile/MobileTopBar";
import { loadHistory, type SessionRecord } from "@/lib/ai-core";

// @ts-ignore
import bgImage from "@/assets/analytics mode background.png";

export const Route = createFileRoute("/chamber-of-focus")({
  component: ChamberOfFocusPage,
});

const MARBLE   = "linear-gradient(145deg, rgba(22,18,14,0.95), rgba(12,10,8,0.98))";
const BORDER   = "rgba(200,167,106,0.2)";
const BRIGHT   = "rgba(220,185,110,1)";
const DISPLAY  = "var(--font-sanctuary-display)";
const UI       = "var(--font-sanctuary-ui)";

function ChamberOfFocusPage() {
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    setMounted(true);
    setSessions(loadHistory().filter(s => s.type === "deep-work" || s.type === "learning").sort((a, b) => b.startTime - a.startTime));
  }, []);

  if (!mounted) return null;

  // Group by date
  const grouped: Record<string, SessionRecord[]> = {};
  sessions.forEach(s => {
    const d = new Date(s.startTime).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(s);
  });

  return (
    <div style={{ minHeight: "100vh", background: "#040508", color: "rgba(230,220,200,0.92)", fontFamily: UI, paddingBottom: 120, position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.05, pointerEvents: "none", zIndex: 0 }} />
      <MobileTopBar showSettings={false} />

      <main style={{ padding: "80px 20px 32px", maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 10 }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 40 }}>
          <Link to="/settings" style={{ color: BRIGHT, display: "flex", alignItems: "center", background: "transparent", border: "none", padding: 0, cursor: "pointer", marginRight: 16 }}>
            <ChevronLeft size={28} />
          </Link>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1 style={{ fontFamily: DISPLAY, fontWeight: 300, fontSize: 28, margin: 0, color: "rgba(255,250,240,1)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              CHAMBER OF FOCUS
            </h1>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: MARBLE, borderRadius: 20, border: `1px solid ${BORDER}` }}>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 24, color: BRIGHT, marginBottom: 12 }}>The Chamber Awaits</h2>
            <p style={{ fontFamily: UI, fontSize: 14, color: "rgba(200,180,150,0.6)", fontStyle: "italic", margin: 0 }}>
              No focus sessions have yet been recorded.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: DISPLAY, fontSize: 11, letterSpacing: "0.25em", color: "rgba(200,167,106,0.7)", margin: "0 0 16px 0", textTransform: "uppercase" }}>
                {date}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {items.map((s, i) => {
                  const start = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const end = new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", padding: "20px", borderRadius: 16, background: "rgba(20,18,14,0.4)", border: `1px solid rgba(255,255,255,0.05)`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(220,185,110,0.1)", border: `1px solid rgba(220,185,110,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                        <Hourglass size={18} color={BRIGHT} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: DISPLAY, fontSize: 16, color: "rgba(255,250,240,0.9)", marginBottom: 4 }}>
                          {start} – {end}
                        </div>
                        <div style={{ fontFamily: UI, fontSize: 12, color: "rgba(200,180,150,0.6)" }}>
                          {s.durationMins} Minutes • Focus Score: {s.focusScore}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

      </main>
    </div>
  );
}
