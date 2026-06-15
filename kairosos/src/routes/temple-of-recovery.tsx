import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Wind } from "lucide-react";
import { MobileTopBar } from "@/components/mobile/MobileTopBar";

// @ts-ignore
import bgImage from "@/assets/analytics mode background.png";

export const Route = createFileRoute("/temple-of-recovery")({
  component: TempleOfRecoveryPage,
});

const MARBLE   = "linear-gradient(145deg, rgba(22,18,14,0.95), rgba(12,10,8,0.98))";
const BORDER   = "rgba(200,167,106,0.2)";
const BRIGHT   = "rgba(220,185,110,1)";
const DISPLAY  = "var(--font-sanctuary-display)";
const UI       = "var(--font-sanctuary-ui)";

interface RecoveryEntry {
  type: string;
  durationMins: number;
  dateString: string;
  timestamp: number;
  notes?: string;
}

function TempleOfRecoveryPage() {
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<RecoveryEntry[]>([]);

  useEffect(() => {
    setMounted(true);
    try {
      const data = localStorage.getItem("rec_log");
      if (data) {
        const parsed = JSON.parse(data) as RecoveryEntry[];
        setEntries(parsed.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch {}
  }, []);

  if (!mounted) return null;

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
              TEMPLE OF RECOVERY
            </h1>
          </div>
        </div>

        {entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: MARBLE, borderRadius: 20, border: `1px solid ${BORDER}` }}>
            <h2 style={{ fontFamily: DISPLAY, fontSize: 24, color: BRIGHT, marginBottom: 12 }}>Sanctuary of Rest</h2>
            <p style={{ fontFamily: UI, fontSize: 14, color: "rgba(200,180,150,0.6)", fontStyle: "italic", margin: 0 }}>
              No recovery rituals have yet been completed.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {entries.map((entry, index) => {
              const date = new Date(entry.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
              return (
                <div key={index} style={{ display: "flex", alignItems: "flex-start", padding: "20px", borderRadius: 16, background: "rgba(20,18,14,0.4)", border: `1px solid ${BORDER}`, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(220,185,110,0.1)", border: `1px solid rgba(220,185,110,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 16, flexShrink: 0 }}>
                    <Wind size={20} color={BRIGHT} />
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 18, color: "rgba(255,250,240,0.9)", marginBottom: 6 }}>
                      {entry.type}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, fontFamily: UI, fontSize: 12, color: "rgba(200,180,150,0.6)" }}>
                      <span>{date}</span>
                      <span>•</span>
                      <span>{entry.durationMins} Minutes</span>
                    </div>
                    {entry.notes && (
                      <div style={{ marginTop: 8, fontFamily: UI, fontSize: 12, color: "rgba(200,180,150,0.8)", fontStyle: "italic", background: "rgba(0,0,0,0.2)", padding: "8px 12px", borderRadius: 8 }}>
                        "{entry.notes}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
