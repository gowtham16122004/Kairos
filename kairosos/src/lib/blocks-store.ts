import { useEffect, useState } from "react";

export type NeuralLoad = "LIGHT" | "MODERATE" | "HEAVY";
export type Energy = "RECHARGING" | "STABLE" | "DRAINING";

export type BlockDef = {
  id: string;
  time: string;
  start: number; // minutes since midnight
  end: number;
  label: string;
  neuralLoad: NeuralLoad;
  energy: Energy;
};

export const NEURAL_LOADS: NeuralLoad[] = ["LIGHT", "MODERATE", "HEAVY"];
export const ENERGIES: Energy[] = ["RECHARGING", "STABLE", "DRAINING"];

export const DEFAULT_BLOCKS: BlockDef[] = [
  { id: "b1",  start: 360,  end: 420,  time: "6:00 – 7:00 AM",   label: "Wake up + Planning",             neuralLoad: "LIGHT",    energy: "RECHARGING" },
  { id: "b2",  start: 420,  end: 570,  time: "7:00 – 9:30 AM",   label: "AI Learning",                    neuralLoad: "HEAVY",    energy: "STABLE" },
  { id: "b3",  start: 570,  end: 600,  time: "9:30 – 10:00 AM",  label: "Communication Practice",         neuralLoad: "MODERATE", energy: "STABLE" },
  { id: "b4",  start: 600,  end: 660,  time: "10:00 – 11:00 AM", label: "Breakfast + Rest",               neuralLoad: "LIGHT",    energy: "RECHARGING" },
  { id: "b5",  start: 660,  end: 720,  time: "11:00 – 12:00 PM", label: "Communication Practice",         neuralLoad: "MODERATE", energy: "STABLE" },
  { id: "b6",  start: 720,  end: 870,  time: "12:00 – 2:30 PM",  label: "Project Work + AI",              neuralLoad: "HEAVY",    energy: "DRAINING" },
  { id: "b7",  start: 870,  end: 930,  time: "2:30 – 3:30 PM",   label: "Lunch + Rest",                   neuralLoad: "LIGHT",    energy: "RECHARGING" },
  { id: "b8",  start: 930,  end: 1050, time: "3:30 – 5:30 PM",   label: "AI Project Coding",              neuralLoad: "HEAVY",    energy: "DRAINING" },
  { id: "b9",  start: 1050, end: 1080, time: "5:30 – 6:00 PM",   label: "Break + Walk",                   neuralLoad: "LIGHT",    energy: "RECHARGING" },
  { id: "b10", start: 1080, end: 1140, time: "6:00 – 7:00 PM",   label: "Advanced AI / DSA / Full Stack", neuralLoad: "HEAVY",    energy: "STABLE" },
  { id: "b11", start: 1140, end: 1200, time: "7:00 – 8:00 PM",   label: "Workout",                        neuralLoad: "MODERATE", energy: "RECHARGING" },
  { id: "b12", start: 1200, end: 1230, time: "8:00 – 8:30 PM",   label: "Dinner + Relax",                 neuralLoad: "LIGHT",    energy: "RECHARGING" },
  { id: "b13", start: 1230, end: 1320, time: "8:30 – 10:00 PM",  label: "Movie / Light Learning",         neuralLoad: "LIGHT",    energy: "RECHARGING" },
  { id: "b14", start: 1320, end: 1350, time: "10:00 – 10:30 PM", label: "Night Routine",                  neuralLoad: "LIGHT",    energy: "RECHARGING" },
];

const KEY = "os_blocks_v1";
const EVT = "os:blocks-changed";

export function loadBlocks(): BlockDef[] {
  if (typeof window === "undefined") return DEFAULT_BLOCKS;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as BlockDef[];
    }
  } catch {}
  return DEFAULT_BLOCKS;
}

export function saveBlocks(b: BlockDef[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {}
}

export function useBlocks(): [BlockDef[], (b: BlockDef[]) => void] {
  const [blocks, setBlocks] = useState<BlockDef[]>(DEFAULT_BLOCKS);
  useEffect(() => {
    setBlocks(loadBlocks());
    const h = () => setBlocks(loadBlocks());
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  const update = (n: BlockDef[]) => { setBlocks(n); saveBlocks(n); };
  return [blocks, update];
}

export function parseTimeRange(s: string): { start: number; end: number } | null {
  const norm = s.replace(/[–—−]/g, "-").trim();
  const m = norm.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!m) return null;
  const h1 = parseInt(m[1], 10);
  const mm1 = parseInt(m[2] ?? "0", 10);
  const ap1 = m[3]?.toUpperCase();
  const h2 = parseInt(m[4], 10);
  const mm2 = parseInt(m[5] ?? "0", 10);
  const ap2 = m[6]?.toUpperCase();
  const effAp2 = ap2 ?? ap1;
  const effAp1 = ap1 ?? effAp2;
  const to24 = (h: number, ap?: string) => {
    if (!ap) return h;
    if (ap === "PM" && h !== 12) return h + 12;
    if (ap === "AM" && h === 12) return 0;
    return h;
  };
  return { start: to24(h1, effAp1) * 60 + mm1, end: to24(h2, effAp2) * 60 + mm2 };
}

export function genBlockId() {
  return "b" + Math.random().toString(36).slice(2, 8);
}

export function cycle<T>(arr: T[], cur: T): T {
  const i = arr.indexOf(cur);
  return arr[(i + 1) % arr.length];
}
