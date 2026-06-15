import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { MobileTopBar } from "@/components/mobile/MobileTopBar";

// @ts-ignore
import bgImage from "@/assets/analytics mode background.png";

export const Route = createFileRoute("/streak-archives")({
  component: StreakArchivesPage,
});

const MARBLE   = "linear-gradient(145deg, rgba(22,18,14,0.95), rgba(12,10,8,0.98))";
const BORDER   = "rgba(200,167,106,0.2)";
const BRIGHT   = "rgba(220,185,110,1)";
const DISPLAY  = "var(--font-sanctuary-display)";
const UI       = "var(--font-sanctuary-ui)";

function StreakArchivesPage() {
  const [mounted, setMounted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useEffect(() => {
    setMounted(true);
    try {
      const current = parseInt(localStorage.getItem("os_streak") ?? "0", 10) || 0;
      setStreak(current);
      // For now, simulate longest streak logic
      const longest = parseInt(localStorage.getItem("os_longest_streak") ?? "0", 10) || current;
      if (current > longest) {
        localStorage.setItem("os_longest_streak", current.toString());
        setLongestStreak(current);
      } else {
        setLongestStreak(longest);
      }
    } catch {}
  }, []);

  if (!mounted) return null;

  const milestones = [
    { days: 3, label: "Initial Dedication" },
    { days: 7, label: "First Cycle" },
    { days: 14, label: "Consistent Force" },
    { days: 21, label: "Habit Formed" },
    { days: 30, label: "Month of Iron" },
  ];

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
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 300, fontSize: 32, margin: 0, color: "rgba(255,250,240,1)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            STREAK ARCHIVES
          </h1>
        </div>

        {/* Current Streak */}
        <div style={{ background: MARBLE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: 40, textAlign: "center", marginBottom: 24, boxShadow: "0 15px 40px rgba(0,0,0,0.6)" }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 11, letterSpacing: "0.2em", color: "rgba(200,167,106,0.7)", textTransform: "uppercase", display: "block", marginBottom: 16 }}>
            CURRENT STREAK
          </span>
          <div style={{ fontFamily: DISPLAY, fontSize: 72, color: BRIGHT, lineHeight: 1, textShadow: "0 4px 20px rgba(220,185,110,0.3)", marginBottom: 8 }}>
            {streak}
          </div>
          <span style={{ fontFamily: DISPLAY, fontSize: 16, color: "rgba(200,180,150,0.8)", fontStyle: "italic", letterSpacing: "0.05em" }}>
            Days
          </span>
        </div>

        {/* Longest Streak */}
        <div style={{ background: MARBLE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: "24px 40px", textAlign: "center", marginBottom: 40, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 10, letterSpacing: "0.2em", color: "rgba(200,167,106,0.6)", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
            LONGEST STREAK
          </span>
          <div style={{ fontFamily: DISPLAY, fontSize: 36, color: "rgba(255,250,240,0.9)", lineHeight: 1, marginBottom: 4 }}>
            {longestStreak}
          </div>
          <span style={{ fontFamily: DISPLAY, fontSize: 12, color: "rgba(200,180,150,0.6)", fontStyle: "italic" }}>
            Days
          </span>
        </div>

        {/* Milestones */}
        <h2 style={{ fontFamily: DISPLAY, fontSize: 13, letterSpacing: "0.25em", color: BRIGHT, margin: "0 0 20px 0", textTransform: "uppercase" }}>
          MILESTONES
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {milestones.map(m => {
            const achieved = streak >= m.days;
            return (
              <div key={m.days} style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderRadius: 16, background: achieved ? "rgba(220,185,110,0.05)" : "rgba(20,18,14,0.4)", border: `1px solid ${achieved ? "rgba(220,185,110,0.3)" : "rgba(255,255,255,0.05)"}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, color: achieved ? BRIGHT : "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                    {m.days} Days
                  </div>
                  <div style={{ fontFamily: UI, fontSize: 11, color: "rgba(200,180,150,0.5)", fontStyle: "italic" }}>
                    {m.label}
                  </div>
                </div>
                {achieved && (
                  <ShieldCheck size={20} color={BRIGHT} />
                )}
              </div>
            );
          })}
        </div>

        {/* Quote */}
        <div style={{ marginTop: 60, textAlign: "center", borderTop: `1px solid ${BORDER}`, paddingTop: 40 }}>
          <p style={{ fontFamily: DISPLAY, fontSize: 16, color: "rgba(200,180,150,0.8)", fontStyle: "italic", lineHeight: 1.6, maxWidth: 300, margin: "0 auto" }}>
            "Discipline is the bridge between who you are and who you are meant to become."
          </p>
        </div>

      </main>
    </div>
  );
}
