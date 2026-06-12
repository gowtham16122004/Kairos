import { motion } from "framer-motion";
import { Settings, ChevronDown, Flame, Focus, Search, Sparkles, Wifi } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useOS } from "@/lib/os-store";
import kairosLogo from "@/assets/kairous logo.png";

export function HeaderBar() {
  const { setCmdOpen, focusMode, setFocusMode, mode, setMode, rightPanel, setRightPanel } = useOS();
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-3 z-30 mx-3 mb-4 flex items-center gap-2 rounded-2xl glass-strong ring-soft px-2.5 py-2"
    >
      {/* Workspace switcher – Kairos logo */}
      <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-medium hover:bg-white/[0.04] transition-all">
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: "50%",
            overflow: "hidden",
            background: "rgba(200,167,106,0.06)",
            border: "1px solid rgba(200,167,106,0.25)",
            boxShadow:
              "0 0 12px rgba(200,167,106,0.30), 0 0 28px rgba(200,167,106,0.12), inset 0 0 8px rgba(200,167,106,0.05)",
            flexShrink: 0,
          }}
        >
          <img
            src={kairosLogo}
            alt="Kairos"
            style={{
              width: 30,
              height: 30,
              objectFit: "cover",
              objectPosition: "center",
              borderRadius: "50%",
              display: "block",
            }}
          />
        </span>
        <span
          className="hidden sm:inline"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 13,
            fontWeight: 400,
            letterSpacing: "0.12em",
            color: "rgba(220,192,138,0.90)",
          }}
        >
          Kairos
        </span>
        <ChevronDown className="h-3 w-3 opacity-50" style={{ color: "rgba(200,167,106,0.7)" }} />
      </button>

      <span className="mx-0.5 h-5 w-px bg-border/60" />

      {/* Mode selector */}
      <div className="hidden md:flex items-center gap-0.5 rounded-lg bg-white/[0.03] ring-1 ring-border/50 p-0.5 relative">
        {(["operator","deep","recovery"] as const).map(m => {
          const isActive = mode === m;
          return (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                if (m === "deep") {
                  setFocusMode(true);
                } else {
                  setFocusMode(false);
                }
              }}
              className={`relative rounded-md px-2.5 py-1 text-[10.5px] font-medium capitalize transition-colors ${
                isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="header-active-mode"
                  className="absolute inset-0 rounded-md bg-primary/15 ring-1 ring-primary/35"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{m}</span>
            </button>
          );
        })}
      </div>

      {/* Command bar - center */}
      <button
        onClick={() => setCmdOpen(true)}
        className="group mx-auto flex max-w-xl flex-1 items-center gap-2 rounded-xl bg-white/[0.025] ring-1 ring-border/60 px-3 py-1.5 text-left text-[12px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 truncate">Search commands, analytics, routines, AI insights…</span>
        <span className="flex items-center gap-0.5">
          <kbd className="kbd">⌘</kbd><kbd className="kbd">K</kbd>
        </span>
      </button>

      {/* Right cluster */}
      <button
        onClick={() => setFocusMode(!focusMode)}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors ${
          focusMode ? "bg-primary/15 text-foreground ring-1 ring-primary/40" : "text-muted-foreground hover:bg-white/[0.04]"
        }`}
      >
        <Focus className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Focus</span>
      </button>

      <div className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground">
        <Flame className="h-3 w-3 text-amber-300" />
        <span className="font-mono">Live</span>
      </div>

      <Link to="/habits" className="relative grid h-7 w-7 place-items-center rounded-lg hover:bg-white/[0.04]">
        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
      </Link>

      <button
        onClick={() => setRightPanel(!rightPanel)}
        className={`hidden lg:grid h-7 w-7 place-items-center rounded-lg ${rightPanel ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-white/[0.04]"}`}
        title="Toggle context panel"
      >
        <Sparkles className="h-3.5 w-3.5" />
      </button>

      <div className="hidden xl:flex items-center gap-2 px-2 text-[10.5px] text-muted-foreground border-l border-border/60">
        <Wifi className="h-3 w-3 text-emerald-400" />
        Synced · {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </motion.div>
  );
}
