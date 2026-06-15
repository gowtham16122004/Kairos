// Local-first habits store. Falls back to localStorage (no Supabase wired yet).
export type HabitCategory = "Vitality" | "Wisdom" | "Mastery" | "Character" | "Legacy";
export type Frequency = "Daily" | "Weekdays" | "Weekends" | "Custom";
export type Difficulty = "Initiate" | "Guardian" | "Spartan";
export type CompletionStatus = "done" | "partial";

export interface Habit {
  id: string;
  name: string;
  icon: string;        // lucide icon key
  color: string;       // hex
  category: HabitCategory;
  frequency: Frequency;
  customDays?: number[]; // 0..6 if Custom
  difficulty: Difficulty;
  createdAt: number;
  archived?: boolean;
  archivedAt?: number;  // timestamp when archived
}

export interface Completion {
  habitId: string;
  date: string;        // YYYY-MM-DD
  status: CompletionStatus;
  completedAt: number;
}

export interface Reflection {
  habitId: string;
  date: string;
  content: string;
  updatedAt: number;
}

const HABITS_KEY = "routine-os:habits-v1";
const COMP_KEY   = "routine-os:habit-completions-v1";
const REFLECTIONS_KEY = "routine-os:habit-reflections-v1";

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function loadHabits(): Habit[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HABITS_KEY) ?? "[]"); } catch { return []; }
}
export function saveHabits(habits: Habit[]) {
  try { localStorage.setItem(HABITS_KEY, JSON.stringify(habits)); } catch {}
  try { window.dispatchEvent(new CustomEvent("habits:changed")); } catch {}
}

export function updateHabit(id: string, updates: Partial<Habit>) {
  const habits = loadHabits();
  const index = habits.findIndex(h => h.id === id);
  if (index !== -1) {
    // Auto-manage archivedAt timestamp
    if (updates.archived === true && !habits[index].archived) {
      updates.archivedAt = Date.now();
    } else if (updates.archived === false) {
      updates.archivedAt = undefined;
    }
    habits[index] = { ...habits[index], ...updates };
    saveHabits(habits);
  }
}

export function deleteHabit(id: string) {
  const habits = loadHabits().filter(h => h.id !== id);
  saveHabits(habits);
  
  const comps = loadCompletions().filter(c => c.habitId !== id);
  saveCompletions(comps);
}

export function loadCompletions(): Completion[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(COMP_KEY) ?? "[]"); } catch { return []; }
}
export function saveCompletions(c: Completion[]) {
  try { localStorage.setItem(COMP_KEY, JSON.stringify(c)); } catch {}
  try { window.dispatchEvent(new CustomEvent("habits:changed")); } catch {}
}

export function setStatus(habitId: string, date: string, status: CompletionStatus | null) {
  const all = loadCompletions().filter(c => !(c.habitId === habitId && c.date === date));
  if (status) all.push({ habitId, date, status, completedAt: Date.now() });
  saveCompletions(all);
  return all;
}

export function statusOn(comps: Completion[], habitId: string, date: string): CompletionStatus | null {
  const f = comps.find(c => c.habitId === habitId && c.date === date);
  return f?.status ?? null;
}

export function isScheduled(habit: Habit, d = new Date()): boolean {
  const dow = d.getDay();
  switch (habit.frequency) {
    case "Daily":    return true;
    case "Weekdays": return dow >= 1 && dow <= 5;
    case "Weekends": return dow === 0 || dow === 6;
    case "Custom":   return habit.customDays?.includes(dow) ?? true;
  }
}

export function currentStreak(comps: Completion[], habitId: string, today = new Date()): number {
  let streak = 0;
  const d = new Date(today);
  while (true) {
    const key = dayKey(d);
    const s = comps.find(c => c.habitId === habitId && c.date === key);
    if (s && s.status === "done") { streak++; d.setDate(d.getDate() - 1); }
    else break;
    if (streak > 999) break;
  }
  return streak;
}

export function bestStreak(comps: Completion[], habitId: string): number {
  const dates = comps
    .filter(c => c.habitId === habitId && c.status === "done")
    .map(c => c.date)
    .sort();
  if (!dates.length) return 0;
  let best = 1, cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + "T00:00:00");
    const curD = new Date(dates[i]    + "T00:00:00");
    const diff = Math.round((+curD - +prev) / 86400000);
    if (diff === 1) { cur++; best = Math.max(best, cur); }
    else cur = 1;
  }
  return best;
}

export function completionRateForDay(habits: Habit[], comps: Completion[], date: string): number {
  const d = new Date(date + "T00:00:00");
  const scheduled = habits.filter(h => isScheduled(h, d));
  if (!scheduled.length) return 0;
  let score = 0;
  for (const h of scheduled) {
    const s = statusOn(comps, h.id, date);
    if (s === "done") score += 1;
    else if (s === "partial") score += 0.5;
  }
  return score / scheduled.length;
}

export function loadReflections(): Reflection[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(REFLECTIONS_KEY) ?? "[]"); } catch { return []; }
}

export function saveReflections(r: Reflection[]) {
  try { localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(r)); } catch {}
  try { window.dispatchEvent(new CustomEvent("reflections:changed")); } catch {}
}

export function getReflection(habitId: string, date: string): Reflection | undefined {
  return loadReflections().find(r => r.habitId === habitId && r.date === date);
}

export function setReflection(habitId: string, date: string, content: string) {
  const all = loadReflections().filter(r => !(r.habitId === habitId && r.date === date));
  if (content.trim()) {
    all.push({ habitId, date, content, updatedAt: Date.now() });
  }
  saveReflections(all);
}
