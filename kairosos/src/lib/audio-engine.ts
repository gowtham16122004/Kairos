// Web Audio synthesis primitives — zero external audio files.
// All tracks generated procedurally so they work offline forever.

export type TrackId =
  | "neural40hz"
  | "rain"
  | "brown"
  | "deepspace"
  | "focus"
  | "ocean"
  | "forest"
  | "tone432"
  | "night";

type Stop = () => void;

let ctx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function makeNoiseBuffer(c: AudioContext, seconds = 4, type: "white" | "brown" = "white") {
  const len = c.sampleRate * seconds;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  if (type === "white") {
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  } else {
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buf;
}

function noiseSource(c: AudioContext, type: "white" | "brown") {
  const src = c.createBufferSource();
  src.buffer = makeNoiseBuffer(c, 6, type);
  src.loop = true;
  return src;
}

function startRain(c: AudioContext, gain: GainNode): Stop {
  const src = noiseSource(c, "white");
  const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 600;
  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4200;
  src.connect(hp).connect(lp).connect(gain);
  src.start();
  return () => { try { src.stop(); } catch {} };
}

function startBrown(c: AudioContext, gain: GainNode): Stop {
  const src = noiseSource(c, "brown");
  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 800;
  src.connect(lp).connect(gain);
  src.start();
  return () => { try { src.stop(); } catch {} };
}

function startOcean(c: AudioContext, gain: GainNode): Stop {
  const src = noiseSource(c, "brown");
  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 500;
  const mod = c.createOscillator(); mod.frequency.value = 0.12; // slow swell
  const modGain = c.createGain(); modGain.gain.value = 0.6;
  mod.connect(modGain).connect(gain.gain);
  src.connect(lp).connect(gain);
  src.start(); mod.start();
  return () => { try { src.stop(); mod.stop(); } catch {} };
}

function startForest(c: AudioContext, gain: GainNode): Stop {
  const src = noiseSource(c, "white");
  const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.5;
  src.connect(bp).connect(gain);
  src.start();
  // Occasional bird chirps
  const chirpTimer = setInterval(() => {
    const o = c.createOscillator(); o.type = "sine"; o.frequency.value = 1800 + Math.random() * 1400;
    const g = c.createGain(); g.gain.value = 0;
    o.connect(g).connect(gain);
    const t = c.currentTime;
    g.gain.linearRampToValueAtTime(0.04, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.start(t); o.stop(t + 0.2);
  }, 7000);
  return () => { try { src.stop(); } catch {}; clearInterval(chirpTimer); };
}

function startDeepSpace(c: AudioContext, gain: GainNode): Stop {
  const stops: Stop[] = [];
  [55, 82.5, 110].forEach((f, i) => {
    const o = c.createOscillator(); o.type = "sine"; o.frequency.value = f;
    const g = c.createGain(); g.gain.value = 0.08 / (i + 1);
    const lfo = c.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03;
    const lfoG = c.createGain(); lfoG.gain.value = 0.04;
    lfo.connect(lfoG).connect(g.gain);
    o.connect(g).connect(gain);
    o.start(); lfo.start();
    stops.push(() => { try { o.stop(); lfo.stop(); } catch {} });
  });
  return () => stops.forEach(s => s());
}

function startTone(c: AudioContext, gain: GainNode, freq: number): Stop {
  const o = c.createOscillator(); o.type = "sine"; o.frequency.value = freq;
  o.connect(gain);
  o.start();
  return () => { try { o.stop(); } catch {} };
}

function startBinaural(c: AudioContext, gain: GainNode, base = 200, beat = 40): Stop {
  // Two oscillators panned L/R, difference = beat
  const merger = c.createChannelMerger(2);
  const oL = c.createOscillator(); oL.type = "sine"; oL.frequency.value = base;
  const oR = c.createOscillator(); oR.type = "sine"; oR.frequency.value = base + beat;
  const gL = c.createGain(); gL.gain.value = 0.18;
  const gR = c.createGain(); gR.gain.value = 0.18;
  oL.connect(gL).connect(merger, 0, 0);
  oR.connect(gR).connect(merger, 0, 1);
  merger.connect(gain);
  oL.start(); oR.start();
  return () => { try { oL.stop(); oR.stop(); } catch {} };
}

function startNight(c: AudioContext, gain: GainNode): Stop {
  const src = noiseSource(c, "brown");
  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1400;
  src.connect(lp).connect(gain);
  src.start();
  // Sparse cricket
  const t = setInterval(() => {
    const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = 4200;
    const g = c.createGain(); g.gain.value = 0;
    o.connect(g).connect(gain);
    const now = c.currentTime;
    for (let i = 0; i < 3; i++) {
      g.gain.setValueAtTime(0, now + i * 0.12);
      g.gain.linearRampToValueAtTime(0.02, now + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.08);
    }
    o.start(now); o.stop(now + 0.5);
  }, 9000);
  return () => { try { src.stop(); } catch {}; clearInterval(t); };
}

export class AudioEngine {
  private active = new Map<TrackId, { stop: Stop; gain: GainNode }>();
  private master: GainNode | null = null;
  private _volume = 0.45;

  private ensureMaster(c: AudioContext) {
    if (!this.master) {
      this.master = c.createGain();
      this.master.gain.value = this._volume;
      this.master.connect(c.destination);
    }
    return this.master;
  }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this._volume;
  }

  get volume() { return this._volume; }

  toggle(id: TrackId) {
    if (this.active.has(id)) this.stop(id);
    else this.play(id);
  }

  isPlaying(id: TrackId) { return this.active.has(id); }

  play(id: TrackId) {
    if (this.active.has(id)) return;
    const c = getCtx();
    const master = this.ensureMaster(c);
    const g = c.createGain(); g.gain.value = 0;
    g.connect(master);
    let stop: Stop;
    switch (id) {
      case "rain": stop = startRain(c, g); break;
      case "brown": stop = startBrown(c, g); break;
      case "ocean": stop = startOcean(c, g); break;
      case "forest": stop = startForest(c, g); break;
      case "deepspace": stop = startDeepSpace(c, g); break;
      case "focus": stop = startTone(c, g, 528); break;
      case "tone432": stop = startTone(c, g, 432); break;
      case "neural40hz": stop = startBinaural(c, g, 200, 40); break;
      case "night": stop = startNight(c, g); break;
    }
    const now = c.currentTime;
    g.gain.linearRampToValueAtTime(0.7, now + 1.2);
    this.active.set(id, { stop, gain: g });
  }

  stop(id: TrackId) {
    const e = this.active.get(id);
    if (!e) return;
    const c = getCtx();
    const now = c.currentTime;
    e.gain.gain.cancelScheduledValues(now);
    e.gain.gain.linearRampToValueAtTime(0, now + 0.6);
    setTimeout(() => { e.stop(); }, 700);
    this.active.delete(id);
  }

  stopAll() {
    Array.from(this.active.keys()).forEach(k => this.stop(k));
  }

  // Cinematic chime — sine wave at freq with natural decay
  chime(freq = 528, duration = 4) {
    const c = getCtx();
    const master = this.ensureMaster(c);
    const o = c.createOscillator(); o.type = "sine"; o.frequency.value = freq;
    const g = c.createGain(); g.gain.value = 0;
    o.connect(g).connect(master);
    const t = c.currentTime;
    g.gain.linearRampToValueAtTime(0.3, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.start(t); o.stop(t + duration + 0.1);
  }
}

// Voice (Web Speech API)
export function speak(text: string, opts: { rate?: number; pitch?: number; volume?: number } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts.rate ?? 0.85;
    u.pitch = opts.pitch ?? 0.95;
    u.volume = opts.volume ?? 0.7;
    window.speechSynthesis.speak(u);
  } catch {}
}

export function cancelSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try { window.speechSynthesis.cancel(); } catch {}
  }
}
