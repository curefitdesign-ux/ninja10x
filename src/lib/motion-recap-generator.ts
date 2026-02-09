/**
 * Premium Motion Recap Generator v5 — Real Music + Bold Typography
 *
 * Structure per day:
 *   1. Metric card (2.8s) — Extra-bold layout with large readable stats
 *   2. Photo hold (3.5s) — Cinematic Ken Burns with soft overlays
 *   Intro (2.2s) + Outro (2.8s)
 *
 * Audio: Fetches real royalty-free music from Pixabay matched to activity type.
 * Falls back to rich synthesized EDM if no track is found.
 * 9:16 ratio (720×1280), 24fps.
 */

import { supabase } from '@/integrations/supabase/client';

// ============ TYPES ============

export interface DayMetric {
  label: string;
  value: string;
}

export interface DayState {
  dayLabel: string;
  dayNumber: number;
  activityType: string;
  metricA: DayMetric;
  metricB: DayMetric;
  metricC?: DayMetric;
  calories?: string;
  intensity?: string;
  asset: {
    type: 'photo' | 'video';
    src: string;
  };
}

export interface MotionRecapOptions {
  dayStates: DayState[];
  userName?: string;
  weekNumber?: number;
  onProgress?: (percent: number, phase: string) => void;
}

// ============ CONSTANTS ============

const FPS = 24;
const WIDTH = 720;
const HEIGHT = 1280;

const TIMING = {
  INTRO: 1.8,
  METRIC_DURATION: 2.2,
  PHOTO_DURATION: 2.8,
  CROSSFADE: 0.3,
  OUTRO: 2.0,
  OUTRO_FADE: 0.5,
  KEN_BURNS_SCALE: 0.03,
};

const DAY_SLOT = TIMING.METRIC_DURATION + TIMING.PHOTO_DURATION;

// ── EXTRA BOLD FONTS — heavier weights, larger sizes ──
const FONTS = {
  HERO_NUMBER: '900 120px -apple-system, "SF Pro Display", system-ui, sans-serif',
  HERO_UNIT: '700 22px -apple-system, "SF Pro Display", system-ui, sans-serif',
  LABEL_SM: '600 18px -apple-system, "SF Pro Text", system-ui, sans-serif',
  LABEL_MD: '700 22px -apple-system, "SF Pro Text", system-ui, sans-serif',
  DAY_PILL: '800 20px -apple-system, "SF Pro Display", system-ui, sans-serif',
  ACTIVITY: '700 22px -apple-system, "SF Pro Display", system-ui, sans-serif',
  STAT_VALUE: '900 40px -apple-system, "SF Pro Display", system-ui, sans-serif',
  STAT_LABEL: '600 14px -apple-system, "SF Pro Text", system-ui, sans-serif',
  INTRO_TITLE: '900 56px -apple-system, "SF Pro Display", system-ui, sans-serif',
  INTRO_SUB: '400 20px -apple-system, "SF Pro Text", system-ui, sans-serif',
  OUTRO_BIG: '900 72px -apple-system, "SF Pro Display", system-ui, sans-serif',
  OUTRO_LABEL: '500 22px -apple-system, "SF Pro Text", system-ui, sans-serif',
  PHOTO_ACTIVITY: '900 36px -apple-system, "SF Pro Display", system-ui, sans-serif',
  PHOTO_METRIC: '700 20px -apple-system, "SF Pro Text", system-ui, sans-serif',
  CALORIES: '900 36px -apple-system, "SF Pro Display", system-ui, sans-serif',
  CALORIES_LABEL: '600 14px -apple-system, "SF Pro Text", system-ui, sans-serif',
};

// Activity accent colors (HSL hue)
const ACTIVITY_HUES: Record<string, number> = {
  running: 16, cycling: 200, yoga: 280, boxing: 0, swimming: 190,
  trekking: 140, basketball: 30, football: 120, cricket: 45, default: 265,
};

// Music mood per activity — expanded for richer contextual scoring
type MusicMood = 'energetic' | 'calm' | 'rhythmic' | 'ambient' | 'intense' | 'groovy';
const ACTIVITY_MOOD: Record<string, MusicMood> = {
  running: 'rhythmic', cycling: 'groovy', yoga: 'calm', boxing: 'intense',
  swimming: 'ambient', trekking: 'ambient', basketball: 'energetic',
  football: 'energetic', cricket: 'rhythmic', badminton: 'groovy',
  tennis: 'groovy', meditation: 'calm', stretching: 'calm',
  walking: 'ambient', hiking: 'ambient', default: 'rhythmic',
};

function getActivityHue(activity: string): number {
  const key = activity.toLowerCase();
  for (const [name, hue] of Object.entries(ACTIVITY_HUES)) {
    if (key.includes(name)) return hue;
  }
  return ACTIVITY_HUES.default;
}

function getDominantMood(dayStates: DayState[]): MusicMood {
  const counts: Record<MusicMood, number> = { energetic: 0, calm: 0, rhythmic: 0, ambient: 0, intense: 0, groovy: 0 };
  for (const s of dayStates) {
    const key = s.activityType.toLowerCase();
    let mood: MusicMood = ACTIVITY_MOOD.default;
    for (const [name, m] of Object.entries(ACTIVITY_MOOD)) {
      if (key.includes(name)) { mood = m; break; }
    }
    counts[mood]++;
  }
  let best: MusicMood = 'rhythmic';
  let max = 0;
  for (const [m, c] of Object.entries(counts)) {
    if (c > max) { max = c; best = m as MusicMood; }
  }
  return best;
}

// ============ EASING ============

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function easeOutBack(t: number): number {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

// ============ HIGH-ENERGY MUSIC ENGINE ============
// EDM/Workout-style: punchy kicks, sidechained bass, risers,
// drop sections, supersaw pads, pluck melodies, driving percussion

const N: Record<string, number> = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
};

// Deterministic pseudo-random for consistent noise patterns
function seededRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// ============ PER-GENERATION UNIQUE SEED ============
let _genSeed = 0;

/** Seeded random that stays consistent within a generation */
function genRand(slot: number): number {
  return seededRand(_genSeed * 1000 + slot);
}

// Soft clipping for warmer saturation
function softClip(x: number): number {
  if (x > 1) return 1 - Math.exp(-(x - 1));
  if (x < -1) return -(1 - Math.exp(-(-x - 1)));
  return x;
}

// Supersaw: multiple detuned saws for thick EDM pad
function supersaw(freq: number, t: number, numVoices = 7): number {
  const detunes = [-0.012, -0.008, -0.004, 0, 0.004, 0.008, 0.012];
  let sum = 0;
  const voices = Math.min(numVoices, detunes.length);
  for (let v = 0; v < voices; v++) {
    const f = freq * (1 + detunes[v]);
    const phase = (f * t) % 1;
    sum += phase * 2 - 1;
  }
  return sum / voices;
}

interface TrackConfig {
  bpm: number;
  chords: number[][];
  bass: number[];
  lead: number[];
  dropIntensity: number;
  swingAmount: number; // 0-1 groove swing
  filterCutoff: number; // 0-1 brightness
  reverbMix: number; // 0-1
}

// 12 distinct musical keys — seed picks one
const SCALE_ROOTS = [
  { name: 'Am', root: N.A2, offsets: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Em', root: N.E2, offsets: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Dm', root: N.D2, offsets: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Cm', root: N.C2, offsets: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Gm', root: N.G2, offsets: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Fm', root: N.F2, offsets: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'C',  root: N.C2, offsets: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'G',  root: N.G2, offsets: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'D',  root: N.D2, offsets: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'F',  root: N.F2, offsets: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Bb', root: N.B2 / 1.059463, offsets: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Eb', root: N.E2 * 1.059463, offsets: [0, 2, 3, 5, 7, 8, 10] },
];

// Chord progression templates (scale degree indices)
const PROGRESSIONS = [
  [0, 5, 3, 4], // i - VI - iv - v
  [0, 3, 5, 4], // i - iv - VI - v
  [0, 4, 5, 3], // i - v - VI - iv
  [5, 3, 0, 4], // VI - iv - i - v
  [0, 2, 5, 4], // i - iii - VI - v
  [3, 5, 0, 4], // iv - VI - i - v
  [0, 5, 4, 3], // i - VI - v - iv
  [5, 0, 3, 4], // VI - i - iv - v
];

function freqFromScaleDegree(rootFreq: number, offsets: number[], degree: number, octave = 0): number {
  const semitones = offsets[degree % offsets.length] + 12 * (Math.floor(degree / offsets.length) + octave);
  return rootFreq * Math.pow(2, semitones / 12);
}

function buildChords(rootFreq: number, offsets: number[], prog: number[]): number[][] {
  return prog.map(deg => {
    const oct2 = freqFromScaleDegree(rootFreq, offsets, deg, 1);
    const oct3 = freqFromScaleDegree(rootFreq, offsets, deg, 2);
    return [
      oct2,
      freqFromScaleDegree(rootFreq, offsets, (deg + 2) % 7, 1),
      freqFromScaleDegree(rootFreq, offsets, (deg + 4) % 7, 1),
      oct3,
    ];
  });
}

function buildBassLine(rootFreq: number, offsets: number[], prog: number[]): number[] {
  const bass: number[] = [];
  for (const deg of prog) {
    bass.push(freqFromScaleDegree(rootFreq, offsets, deg, 0));
    bass.push(freqFromScaleDegree(rootFreq, offsets, deg, 0));
  }
  return bass;
}

function buildLeadLine(rootFreq: number, offsets: number[], seed: number): number[] {
  const lead: number[] = [];
  let deg = Math.floor(seededRand(seed * 3 + 1) * 5);
  for (let i = 0; i < 8; i++) {
    lead.push(freqFromScaleDegree(rootFreq, offsets, deg, 2));
    const step = Math.floor(seededRand(seed * 7 + i) * 5) - 2;
    deg = Math.max(0, Math.min(6, deg + step));
  }
  return lead;
}

function getTrackConfig(mood: MusicMood, seed: number): TrackConfig {
  // Seed-based selection of key, progression, and BPM
  const keyIdx = Math.floor(seededRand(seed * 11 + 1) * SCALE_ROOTS.length);
  const progIdx = Math.floor(seededRand(seed * 13 + 2) * PROGRESSIONS.length);
  const scale = SCALE_ROOTS[keyIdx];
  const prog = PROGRESSIONS[progIdx];
  
  const chords = buildChords(scale.root, scale.offsets, prog);
  const bass = buildBassLine(scale.root, scale.offsets, prog);
  const lead = buildLeadLine(scale.root, scale.offsets, seed);

  // BPM ranges per mood with seed jitter
  const jitter = seededRand(seed * 17 + 3) * 16 - 8; // ±8 BPM
  
  switch (mood) {
    case 'intense':
      return { bpm: Math.round(132 + jitter), chords, bass, lead, dropIntensity: 1.0, swingAmount: 0, filterCutoff: 0.9, reverbMix: 0.15 };
    case 'energetic':
      return { bpm: Math.round(126 + jitter), chords, bass, lead, dropIntensity: 0.9, swingAmount: 0.05, filterCutoff: 0.8, reverbMix: 0.2 };
    case 'groovy':
      return { bpm: Math.round(118 + jitter), chords, bass, lead, dropIntensity: 0.75, swingAmount: 0.15, filterCutoff: 0.7, reverbMix: 0.25 };
    case 'rhythmic':
      return { bpm: Math.round(120 + jitter), chords, bass, lead, dropIntensity: 0.85, swingAmount: 0.08, filterCutoff: 0.75, reverbMix: 0.2 };
    case 'calm':
      return { bpm: Math.round(95 + jitter), chords, bass, lead, dropIntensity: 0.35, swingAmount: 0.12, filterCutoff: 0.4, reverbMix: 0.5 };
    case 'ambient':
      return { bpm: Math.round(105 + jitter), chords, bass, lead, dropIntensity: 0.5, swingAmount: 0.1, filterCutoff: 0.5, reverbMix: 0.45 };
  }
}

function generateContextualAudio(durationSec: number, mood: MusicMood, dayStates?: DayState[]): AudioBuffer {
  const sampleRate = 44100;
  const length = Math.ceil(sampleRate * durationSec);
  const buffer = new AudioBuffer({ length, sampleRate, numberOfChannels: 2 });
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const cfg = getTrackConfig(mood, _genSeed);
  const beatDur = 60 / cfg.bpm;
  const barDur = beatDur * 4;
  const totalBars = Math.ceil(durationSec / barDur);
  const chordCount = cfg.chords.length;
  const di = cfg.dropIntensity;

  // Per-day mood configs for musical sections (if we have day data)
  const dayMoods: MusicMood[] = dayStates
    ? dayStates.map(s => {
        const key = s.activityType.toLowerCase();
        for (const [name, m] of Object.entries(ACTIVITY_MOOD)) {
          if (key.includes(name)) return m;
        }
        return mood;
      })
    : [mood, mood, mood];

  // Calculate which bars correspond to which day
  const introBars = Math.max(1, Math.floor(totalBars * 0.08));
  const outroBars = Math.max(1, Math.floor(totalBars * 0.12));
  const contentBars = totalBars - introBars - outroBars;
  const barsPerDay = Math.floor(contentBars / Math.max(1, dayMoods.length));

  // Seed-based pattern variations
  const kickPattern = Math.floor(seededRand(_genSeed * 19 + 1) * 4); // 4 kick patterns
  const hatPattern = Math.floor(seededRand(_genSeed * 23 + 2) * 3); // 3 hat patterns
  const arpOctave = 1 + Math.floor(seededRand(_genSeed * 29 + 3) * 2); // 1 or 2 octaves up

  console.log(`[MotionRecap] 🎵 Music: ${cfg.bpm}BPM, key=${SCALE_ROOTS[Math.floor(seededRand(_genSeed * 11 + 1) * SCALE_ROOTS.length)].name}, mood=${mood}, days=${dayMoods.join('→')}`);

  const getSection = (bar: number): 'intro' | 'buildup' | 'drop' | 'sustain' | 'breakdown' | 'outro' => {
    const pct = bar / totalBars;
    if (pct < 0.08) return 'intro';
    if (pct < 0.18) return 'buildup';
    if (pct < 0.5) return 'drop';
    if (pct < 0.7) return 'sustain';
    if (pct < 0.85) return 'breakdown';
    return 'outro';
  };

  // Determine per-bar intensity based on which day's activity we're in
  const getDayIntensity = (bar: number): number => {
    if (bar < introBars || bar >= totalBars - outroBars) return 0.5;
    const dayIdx = Math.min(Math.floor((bar - introBars) / barsPerDay), dayMoods.length - 1);
    const dayMood = dayMoods[dayIdx];
    switch (dayMood) {
      case 'intense': return 1.0;
      case 'energetic': return 0.9;
      case 'groovy': return 0.75;
      case 'rhythmic': return 0.8;
      case 'calm': return 0.4;
      case 'ambient': return 0.5;
    }
  };

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const barPos = t / barDur;
    const currentBar = Math.floor(barPos);
    const posInBar = barPos - currentBar;
    const chordIdx = currentBar % chordCount;
    const chord = cfg.chords[chordIdx];
    const beatPhase = (t % beatDur) / beatDur;
    const beatNum = Math.floor(posInBar * 4);
    const section = getSection(currentBar);
    const dayIntensity = getDayIntensity(currentBar);

    let sample = 0;

    const isDropOrSustain = section === 'drop' || section === 'sustain';
    const isBuild = section === 'buildup';
    const isBreakdown = section === 'breakdown';
    const isIntro = section === 'intro';
    const isOutro = section === 'outro';
    const buildProgress = isBuild ? (barPos - totalBars * 0.08) / (totalBars * 0.1) : 0;
    const effectiveDI = di * dayIntensity;

    // ── 1. KICK — seed-varied patterns ──
    const kickActive = isDropOrSustain || isBuild || isOutro;
    let shouldKick = false;
    if (kickPattern === 0) shouldKick = beatNum === 0 || beatNum === 2; // four-on-floor
    else if (kickPattern === 1) shouldKick = beatNum === 0 || (beatNum === 2 && beatPhase < 0.15); // broken
    else if (kickPattern === 2) shouldKick = beatNum === 0 || beatNum === 1 || beatNum === 3; // syncopated
    else shouldKick = posInBar < 0.25 || (posInBar > 0.45 && posInBar < 0.55); // offbeat
    
    if (kickActive && shouldKick) {
      const kickEnv = Math.exp(-beatPhase * 25);
      const kickSweep = 50 * (1 + 5 * Math.exp(-beatPhase * 15));
      const kickBody = Math.sin(2 * Math.PI * kickSweep * t) * kickEnv;
      const kickClick = Math.exp(-beatPhase * 80) * 0.3;
      sample += (kickBody + kickClick) * 0.38 * effectiveDI;
    }

    // ── 2. SNARE / CLAP ──
    const snareActive = isDropOrSustain || (isBuild && buildProgress > 0.3);
    if (snareActive && (beatNum === 1 || beatNum === 3)) {
      const snareEnv = Math.exp(-beatPhase * 18);
      const snareBody = Math.sin(2 * Math.PI * (180 + seededRand(_genSeed * 31) * 40) * t) * snareEnv * 0.35;
      const snareNoise = seededRand(i) * 2 - 1;
      const snareRattle = snareNoise * Math.exp(-beatPhase * 25) * 0.5;
      const clapDelay = beatPhase - 0.01;
      const clapEnv = clapDelay > 0 ? Math.exp(-clapDelay * 30) : 0;
      const clap = (seededRand(i + 7777) * 2 - 1) * clapEnv * 0.25;
      sample += (snareBody + snareRattle + clap) * 0.22 * effectiveDI;
    }

    // Build snare roll
    if (isBuild && buildProgress > 0.6) {
      const rollSpeed = lerp(4, 16, (buildProgress - 0.6) / 0.4);
      const rollPhase = (t * rollSpeed / beatDur) % 1;
      if (rollPhase < 0.3) {
        sample += (seededRand(i + 3333) * 2 - 1) * Math.exp(-rollPhase * 15) * 0.12 * effectiveDI;
      }
    }

    // ── 3. HI-HATS — seed-varied patterns ──
    const hatActive = isDropOrSustain || (isBuild && buildProgress > 0.2) || isBreakdown;
    if (hatActive) {
      const sixteenthDur = beatDur / 4;
      const hatPhase = (t % sixteenthDur) / sixteenthDur;
      const sixteenthIdx = Math.floor(posInBar * 16) % 16;
      
      let hatPlay = true;
      if (hatPattern === 1) hatPlay = sixteenthIdx % 2 === 0; // 8th notes only
      else if (hatPattern === 2) hatPlay = sixteenthIdx % 4 !== 3; // skip every 4th

      if (hatPlay) {
        // Swing feel
        const swungPhase = hatPhase + (sixteenthIdx % 2 === 1 ? cfg.swingAmount * 0.15 : 0);
        const accent = (sixteenthIdx % 4 === 2) ? 1.3 : (sixteenthIdx % 2 === 0 ? 0.7 : 1.0);
        const hatEnv = Math.exp(-swungPhase * (sixteenthIdx % 4 === 0 ? 15 : 40));
        const hat = (seededRand(i + sixteenthIdx * 1000) * 2 - 1) * hatEnv * accent;
        const hatVol = isBreakdown ? 0.03 : 0.055;
        sample += hat * hatVol * effectiveDI;
      }
    }

    // ── 4. SUPERSAW PAD ──
    const padActive = isDropOrSustain || isBreakdown || isOutro;
    if (padActive) {
      let padSum = 0;
      for (const freq of chord) {
        padSum += supersaw(freq, t, isDropOrSustain ? 7 : 5);
      }
      padSum /= chord.length;
      
      const pumpPhase = (t % beatDur) / beatDur;
      const sidechain = isDropOrSustain
        ? 0.15 + 0.85 * Math.min(1, pumpPhase * 4)
        : 0.5 + 0.5 * Math.min(1, pumpPhase * 3);
      
      // Filter effect based on config brightness
      const brightness = cfg.filterCutoff;
      const filteredPad = softClip(padSum * (1 + brightness));
      
      const padVol = isDropOrSustain ? 0.045 : (isBreakdown ? 0.06 : 0.03);
      sample += filteredPad * padVol * sidechain * effectiveDI;
    }

    // Intro/buildup pad
    if (isIntro || isBuild) {
      let filteredPad = 0;
      for (const freq of chord) {
        filteredPad += Math.sin(2 * Math.PI * freq * t);
        filteredPad += Math.sin(2 * Math.PI * freq * 1.005 * t) * 0.5;
      }
      filteredPad /= chord.length;
      const filterOpen = isBuild ? buildProgress : 0.3;
      sample += filteredPad * 0.04 * filterOpen;
    }

    // ── 5. BASS ──
    const bassActive = isDropOrSustain || (isBuild && buildProgress > 0.5) || isOutro;
    if (bassActive) {
      const bassIdx = Math.floor(posInBar * 2) % cfg.bass.length;
      const bassFreq = cfg.bass[bassIdx];
      const sub = Math.sin(2 * Math.PI * bassFreq * t);
      const midBassPhase = (bassFreq * t) % 1;
      const midBass = softClip((midBassPhase * 2 - 1) * 2) * 0.4;
      const bassPump = (beatNum === 0 || beatNum === 2) ? Math.min(1, beatPhase * 5) : 1;
      sample += (sub * 0.20 + midBass * 0.08) * bassPump * effectiveDI;
    }

    // ── 6. LEAD MELODY ──
    const leadActive = isDropOrSustain || isBreakdown;
    if (leadActive) {
      const eighthDur = beatDur / 2;
      const leadBeat = Math.floor(t / eighthDur);
      const leadPhase = (t % eighthDur) / eighthDur;
      const leadIdx = leadBeat % cfg.lead.length;
      const shouldPlay = (leadBeat % 3 !== 2);
      
      if (shouldPlay) {
        const freq = cfg.lead[leadIdx];
        const pluckEnv = Math.exp(-leadPhase * 8);
        const osc1 = Math.sin(2 * Math.PI * freq * t);
        const osc2 = Math.sin(2 * Math.PI * freq * 2.01 * t) * 0.3;
        const osc3 = Math.sin(2 * Math.PI * freq * 3 * t) * 0.1;
        const leadSig = (osc1 + osc2 + osc3) * pluckEnv;
        const leadVol = isBreakdown ? 0.05 : 0.04;
        sample += leadSig * leadVol * effectiveDI;
      }
    }

    // ── 7. ARPEGGIOS ──
    if (isDropOrSustain) {
      const sixteenthDur = beatDur / 4;
      const arpPhase = (t % sixteenthDur) / sixteenthDur;
      const arpBeat = Math.floor(t / sixteenthDur);
      const arpIdx = arpBeat % chord.length;
      const arpFreq = chord[arpIdx] * arpOctave;
      const arpEnv = Math.exp(-arpPhase * 12);
      const arpOsc = Math.sin(2 * Math.PI * arpFreq * t) * 0.6 +
                     Math.sin(2 * Math.PI * arpFreq * 1.5 * t) * 0.3;
      const arpVol = 0.025 * effectiveDI;
      const arpPan = Math.sin(arpBeat * 0.7) * 0.3;
      left[i] += arpOsc * arpEnv * arpVol * (1 + arpPan);
      right[i] += arpOsc * arpEnv * arpVol * (1 - arpPan);
    }

    // ── 8. RISER / BUILD FX ──
    if (isBuild) {
      const riserVol = buildProgress * buildProgress * 0.08 * effectiveDI;
      sample += (seededRand(i + 5555) * 2 - 1) * riserVol;
      const sweepFreq = lerp(200, 2000, buildProgress * buildProgress);
      sample += Math.sin(2 * Math.PI * sweepFreq * t) * buildProgress * 0.02 * effectiveDI;
    }

    // ── 9. DROP IMPACT ──
    if (section === 'drop' && currentBar === Math.floor(totalBars * 0.18)) {
      const dropTime = posInBar * barDur;
      if (dropTime < 0.3) {
        const impactEnv = Math.exp(-dropTime * 12);
        sample += Math.sin(2 * Math.PI * 40 * t) * impactEnv * 0.3 * effectiveDI;
        sample += (seededRand(i + 9999) * 2 - 1) * Math.exp(-dropTime * 20) * 0.15 * effectiveDI;
      }
    }

    // ── 10. SHIMMER ──
    const shimmerVol = isBreakdown ? 0.012 : (isDropOrSustain ? 0.005 : 0.008);
    const shimmer = Math.sin(2 * Math.PI * 2200 * t + Math.sin(2 * Math.PI * 0.2 * t) * 6)
      * shimmerVol * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.06 * t));
    sample += shimmer;

    // ── 11. REVERB TAIL (simple comb delay) ──
    const reverbDelay = Math.floor(sampleRate * 0.08); // 80ms
    if (i > reverbDelay && cfg.reverbMix > 0) {
      const delayed = (left[i - reverbDelay] + right[i - reverbDelay]) * 0.5;
      sample += delayed * cfg.reverbMix * 0.3;
    }

    // ── MASTER PROCESSING ──
    sample = softClip(sample * 1.8) * 0.55;
    const fadeIn = Math.min(1, t / 0.8);
    const fadeOut = Math.min(1, (durationSec - t) / 1.5);
    const masterEnv = fadeIn * fadeOut;

    const stereoW = Math.sin(t * 1.3) * 0.08;
    left[i] += sample * masterEnv * (1 + stereoW);
    right[i] += sample * masterEnv * (1 - stereoW);
    left[i] += shimmer * 0.3 * masterEnv;
    right[i] -= shimmer * 0.2 * masterEnv;
  }

  return buffer;
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const blockAlign = numChannels * bitsPerSample / 8;
  const byteRate = sampleRate * blockAlign;
  const dataLength = buffer.length * blockAlign;
  const totalLength = 44 + dataLength;

  const ab = new ArrayBuffer(totalLength);
  const v = new DataView(ab);
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };

  ws(0, 'RIFF'); v.setUint32(4, totalLength - 8, true); ws(8, 'WAVE');
  ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, numChannels, true); v.setUint32(24, sampleRate, true);
  v.setUint32(28, byteRate, true); v.setUint16(32, blockAlign, true);
  v.setUint16(34, bitsPerSample, true); ws(36, 'data'); v.setUint32(40, dataLength, true);

  const channels = [];
  for (let ch = 0; ch < numChannels; ch++) channels.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const s = Math.max(-1, Math.min(1, channels[ch][i]));
      v.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }
  return ab;
}

// ============ IMAGE LOADING ============

async function loadImage(src: string, timeoutMs = 8000): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    const timeout = setTimeout(() => { resolve(createBlackPlaceholder()); }, timeoutMs);
    el.onload = () => { clearTimeout(timeout); resolve(el); };
    el.onerror = () => { clearTimeout(timeout); resolve(createBlackPlaceholder()); };
    el.src = src;
  });
}

/** Extract a frame from a video URL as an HTMLImageElement */
async function extractVideoFrame(src: string, timeoutMs = 12000): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('[MotionRecap] Video frame extraction timed out:', src.slice(0, 60));
      resolve(createBlackPlaceholder());
    }, timeoutMs);

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'auto';
    video.playsInline = true;

    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      video.removeEventListener('loadeddata', onLoaded);
    };

    const captureFrame = () => {
      try {
        const c = document.createElement('canvas');
        c.width = video.videoWidth || WIDTH;
        c.height = video.videoHeight || HEIGHT;
        const cx = c.getContext('2d')!;
        cx.drawImage(video, 0, 0, c.width, c.height);
        const img = new Image();
        img.onload = () => { cleanup(); resolve(img); };
        img.onerror = () => { cleanup(); resolve(createBlackPlaceholder()); };
        img.src = c.toDataURL('image/jpeg', 0.9);
      } catch (err) {
        console.warn('[MotionRecap] Video frame capture failed:', err);
        cleanup();
        resolve(createBlackPlaceholder());
      }
    };

    const onSeeked = () => captureFrame();
    const onError = () => { cleanup(); resolve(createBlackPlaceholder()); };
    const onLoaded = () => {
      // Seek to 0.5s or 10% of duration for a meaningful frame
      const seekTo = Math.min(0.5, video.duration * 0.1);
      video.currentTime = seekTo;
    };

    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.addEventListener('loadeddata', onLoaded, { once: true });
    video.src = src;
    video.load();
  });
}

function createBlackPlaceholder(): HTMLImageElement {
  const c = document.createElement('canvas');
  c.width = WIDTH; c.height = HEIGHT;
  const cx = c.getContext('2d')!;
  cx.fillStyle = '#08080c';
  cx.fillRect(0, 0, WIDTH, HEIGHT);
  const img = new Image();
  img.src = c.toDataURL('image/jpeg');
  return img;
}

async function loadImages(dayStates: DayState[]): Promise<HTMLImageElement[]> {
  const results: HTMLImageElement[] = [];
  for (const state of dayStates) {
    if (state.asset.type === 'video') {
      console.log('[MotionRecap] Extracting frame from video:', state.asset.src.slice(0, 60));
      results.push(await extractVideoFrame(state.asset.src));
    } else {
      results.push(await loadImage(state.asset.src));
    }
  }
  return results;
}

// ============ GRAIN TEXTURE ============

let grainCanvas: HTMLCanvasElement | null = null;
function getGrainTexture(): HTMLCanvasElement {
  if (grainCanvas) return grainCanvas;
  grainCanvas = document.createElement('canvas');
  grainCanvas.width = 256;
  grainCanvas.height = 256;
  const gCtx = grainCanvas.getContext('2d')!;
  const imageData = gCtx.createImageData(256, 256);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = Math.random() * 255;
    imageData.data[i] = v; imageData.data[i + 1] = v;
    imageData.data[i + 2] = v; imageData.data[i + 3] = 10;
  }
  gCtx.putImageData(imageData, 0, 0);
  return grainCanvas;
}

function drawGrain(ctx: CanvasRenderingContext2D, opacity = 0.03) {
  ctx.save();
  ctx.globalAlpha = opacity;
  const grain = getGrainTexture();
  for (let y = 0; y < HEIGHT; y += 256)
    for (let x = 0; x < WIDTH; x += 256)
      ctx.drawImage(grain, x, y);
  ctx.restore();
}

// ============ DRAWING HELPERS ============

function drawDarkBg(ctx: CanvasRenderingContext2D, hue: number) {
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, `hsl(${hue}, 12%, 4%)`);
  bg.addColorStop(0.5, `hsl(${hue}, 8%, 3%)`);
  bg.addColorStop(1, `hsl(${hue}, 14%, 2%)`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, hue: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, `hsla(${hue}, 70%, 50%, 0.55)`);
  g.addColorStop(0.35, `hsla(${hue}, 55%, 40%, 0.15)`);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

function drawThinLine(ctx: CanvasRenderingContext2D, y: number, hue: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const lg = ctx.createLinearGradient(WIDTH * 0.15, 0, WIDTH * 0.85, 0);
  lg.addColorStop(0, 'transparent');
  lg.addColorStop(0.25, `hsla(${hue}, 40%, 60%, 0.4)`);
  lg.addColorStop(0.75, `hsla(${hue}, 40%, 60%, 0.4)`);
  lg.addColorStop(1, 'transparent');
  ctx.strokeStyle = lg;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(WIDTH * 0.15, y);
  ctx.lineTo(WIDTH * 0.85, y);
  ctx.stroke();
  ctx.restore();
}

// ============ CINEMATIC TRANSITIONS — SMOOTH & PREMIUM ============
// Removed shaking/glitchy transitions: glitchSlice, motionBlur

type TransitionStyle = 
  | 'radialWipe' | 'lightStreak' | 'geometricShards' | 'diamondReveal' 
  | 'horizontalBlinds' | 'spiralReveal' | 'rippleWave'
  | 'zoomBurst' | 'pixelDissolve' | 'curtainDrop'
  | 'crossHatch' | 'smokeWipe' | 'filmBurn' | 'diagonalSlice';

const TRANSITION_STYLES: TransitionStyle[] = [
  'radialWipe', 'lightStreak', 'geometricShards', 'diamondReveal',
  'horizontalBlinds', 'spiralReveal', 'rippleWave',
  'zoomBurst', 'pixelDissolve', 'curtainDrop',
  'crossHatch', 'smokeWipe', 'filmBurn', 'diagonalSlice',
];

// Shuffle array using Fisher-Yates with optional seed for reproducibility within a generation
function shuffleArray<T>(arr: T[], seed?: number): T[] {
  const a = [...arr];
  let s = seed ?? Math.random() * 99999;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647; // LCG
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pre-shuffled transition order per generation — guarantees no repeats
let _shuffledTransitions: TransitionStyle[] = [];
let _transitionCursor = 0;

function resetTransitionPool() {
  _shuffledTransitions = shuffleArray(TRANSITION_STYLES, _genSeed * 7 + 1);
  _transitionCursor = 0;
}

function getRandomTransition(_index: number): TransitionStyle {
  if (_transitionCursor >= _shuffledTransitions.length) {
    _shuffledTransitions = shuffleArray(TRANSITION_STYLES, _genSeed * 13 + _transitionCursor);
    _transitionCursor = 0;
  }
  return _shuffledTransitions[_transitionCursor++];
}

function drawCrossFade(ctx: CanvasRenderingContext2D, progress: number) {
  if (progress <= 0 || progress >= 1) return;
  const t = Math.sin(progress * Math.PI);
  ctx.save();
  ctx.globalAlpha = t * 0.25;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();
}

// ── Original transitions ──

function drawRadialWipeTransition(ctx: CanvasRenderingContext2D, progress: number, hue: number) {
  const t = easeOutCubic(progress);
  const maxRadius = Math.sqrt(WIDTH * WIDTH + HEIGHT * HEIGHT) / 2;
  const radius = maxRadius * t;
  ctx.save();
  const ringWidth = 40;
  const grad = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, Math.max(0, radius - ringWidth), WIDTH / 2, HEIGHT / 2, radius);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.5, `hsla(${hue}, 70%, 65%, ${0.4 * (1 - t)})`);
  grad.addColorStop(0.8, `hsla(${hue}, 80%, 80%, ${0.6 * (1 - t)})`);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();
}

function drawLightStreakTransition(ctx: CanvasRenderingContext2D, progress: number, hue: number) {
  const t = easeOutExpo(progress);
  ctx.save();
  const numStreaks = 5;
  for (let i = 0; i < numStreaks; i++) {
    const streakT = Math.max(0, Math.min(1, (t - i * 0.08) * 2.5));
    if (streakT <= 0) continue;
    const x = WIDTH * (-0.3 + streakT * 1.6);
    const w = 30 + i * 15;
    const alpha = (1 - streakT) * 0.5;
    ctx.globalAlpha = alpha;
    const grad = ctx.createLinearGradient(x - w, 0, x + w, 0);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.3, `hsla(${hue + i * 20}, 60%, 75%, 0.6)`);
    grad.addColorStop(0.5, `hsla(${hue + i * 10}, 80%, 90%, 0.9)`);
    grad.addColorStop(0.7, `hsla(${hue + i * 20}, 60%, 75%, 0.6)`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.save();
    ctx.translate(WIDTH / 2, HEIGHT / 2);
    ctx.rotate(-0.4);
    ctx.translate(-WIDTH / 2, -HEIGHT / 2);
    ctx.fillRect(x - w, -100, w * 2, HEIGHT + 200);
    ctx.restore();
  }
  ctx.restore();
}

function drawGeometricShardsTransition(ctx: CanvasRenderingContext2D, progress: number, hue: number) {
  const t = easeOutCubic(progress);
  ctx.save();
  const shards = [
    { x: 0, y: 0, points: [[0,0],[WIDTH*0.6,0],[0,HEIGHT*0.4]] },
    { x: WIDTH, y: 0, points: [[0,0],[-WIDTH*0.5,0],[0,HEIGHT*0.5]] },
    { x: 0, y: HEIGHT, points: [[0,0],[WIDTH*0.7,0],[WIDTH*0.3,-HEIGHT*0.5]] },
    { x: WIDTH, y: HEIGHT, points: [[0,0],[-WIDTH*0.4,0],[-WIDTH*0.2,-HEIGHT*0.6]] },
    { x: WIDTH*0.5, y: HEIGHT*0.5, points: [[-100,-200],[100,-100],[0,200]] },
  ];
  for (let i = 0; i < shards.length; i++) {
    const delay = i * 0.06;
    const shardT = Math.max(0, Math.min(1, (t - delay) * 3));
    if (shardT <= 0) continue;
    ctx.globalAlpha = (1 - shardT) * 0.25;
    ctx.fillStyle = `hsla(${hue + i * 30}, 50%, 60%, 0.4)`;
    ctx.save();
    ctx.translate(shards[i].x, shards[i].y);
    ctx.scale(0.3 + shardT * 0.7, 0.3 + shardT * 0.7);
    ctx.beginPath();
    ctx.moveTo(shards[i].points[0][0], shards[i].points[0][1]);
    for (let p = 1; p < shards[i].points.length; p++) ctx.lineTo(shards[i].points[p][0], shards[i].points[p][1]);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawDiamondRevealTransition(ctx: CanvasRenderingContext2D, progress: number, hue: number) {
  const t = easeOutExpo(progress);
  const size = Math.max(WIDTH, HEIGHT) * t * 1.2;
  ctx.save();
  ctx.globalAlpha = (1 - t) * 0.35;
  ctx.translate(WIDTH / 2, HEIGHT / 2);
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = `hsla(${hue}, 70%, 70%, ${(1 - t) * 0.8})`;
  ctx.lineWidth = 3;
  ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.6)`;
  ctx.shadowBlur = 30;
  ctx.strokeRect(-size / 2, -size / 2, size, size);
  ctx.fillStyle = `hsla(${hue}, 60%, 55%, ${(1 - t) * 0.08})`;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawHorizontalBlindsTransition(ctx: CanvasRenderingContext2D, progress: number, hue: number) {
  const t = easeOutCubic(progress);
  const numBlinds = 8;
  const blindH = HEIGHT / numBlinds;
  ctx.save();
  for (let i = 0; i < numBlinds; i++) {
    const delay = i * 0.04;
    const blindT = Math.max(0, Math.min(1, (t - delay) * 3));
    if (blindT <= 0) continue;
    ctx.globalAlpha = (1 - blindT) * 0.3;
    const grad = ctx.createLinearGradient(0, i * blindH, 0, i * blindH + blindH);
    grad.addColorStop(0, `hsla(${hue}, 50%, 60%, 0.5)`);
    grad.addColorStop(0.5, `hsla(${hue}, 70%, 80%, 0.7)`);
    grad.addColorStop(1, `hsla(${hue}, 50%, 60%, 0.5)`);
    ctx.fillStyle = grad;
    const w = WIDTH * blindT;
    const x = i % 2 === 0 ? 0 : WIDTH - w;
    ctx.fillRect(x, i * blindH, w, blindH * 0.85);
  }
  ctx.restore();
}

function drawSpiralRevealTransition(ctx: CanvasRenderingContext2D, progress: number, hue: number) {
  const t = easeOutExpo(progress);
  ctx.save();
  const cx = WIDTH / 2, cy = HEIGHT / 2;
  const arms = 3, totalDots = 40;
  for (let a = 0; a < arms; a++) {
    const armOffset = (a / arms) * Math.PI * 2;
    for (let i = 0; i < totalDots; i++) {
      const dotT = Math.max(0, Math.min(1, (t - i * 0.015) * 3));
      if (dotT <= 0) continue;
      const dist = 20 + i * 18 * dotT;
      const angle = armOffset + i * 0.35 + t * Math.PI * 3;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      const size = (3 + i * 0.15) * (1 - dotT * 0.5);
      ctx.globalAlpha = (1 - dotT) * 0.6;
      ctx.fillStyle = `hsla(${(hue + i * 8) % 360}, 75%, 70%, 1)`;
      ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (t < 0.4) {
    const flashAlpha = (1 - t / 0.4) * 0.5;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200 * t);
    grad.addColorStop(0, `hsla(${hue}, 80%, 90%, ${flashAlpha})`);
    grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  ctx.restore();
}

function drawRippleWaveTransition(ctx: CanvasRenderingContext2D, progress: number, hue: number) {
  const t = easeOutCubic(progress);
  ctx.save();
  const cx = WIDTH / 2, cy = HEIGHT / 2;
  const maxR = Math.sqrt(WIDTH * WIDTH + HEIGHT * HEIGHT) * 0.6;
  const numWaves = 5;
  for (let i = 0; i < numWaves; i++) {
    const waveT = Math.max(0, Math.min(1, (t - i * 0.08) * 2.5));
    if (waveT <= 0) continue;
    const radius = maxR * waveT;
    const alpha = (1 - waveT) * 0.35;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `hsla(${(hue + i * 25) % 360}, 65%, 70%, 1)`;
    ctx.lineWidth = (25 - i * 3) * (1 - waveT * 0.6);
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
    if (i === 0) {
      const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius);
      glowGrad.addColorStop(0, 'transparent');
      glowGrad.addColorStop(1, `hsla(${hue}, 60%, 60%, ${alpha * 0.3})`);
      ctx.fillStyle = glowGrad; ctx.fill();
    }
  }
  ctx.restore();
}

// (glitchSlice and motionBlur removed — too shaky/distracting)

// Zoom Burst — radial speed lines from center
function drawZoomBurstTransition(ctx: CanvasRenderingContext2D, progress: number, hue: number) {
  const t = easeOutExpo(progress);
  ctx.save();
  const cx = WIDTH / 2, cy = HEIGHT / 2;
  const numRays = 24;
  for (let i = 0; i < numRays; i++) {
    const rayT = Math.max(0, Math.min(1, (t - i * 0.01) * 2.5));
    if (rayT <= 0) continue;
    const angle = (i / numRays) * Math.PI * 2;
    const innerR = 30 * rayT;
    const outerR = Math.sqrt(WIDTH * WIDTH + HEIGHT * HEIGHT) * 0.5 * rayT;
    const spread = (Math.PI / numRays) * 0.6;
    ctx.globalAlpha = (1 - rayT) * 0.25;
    ctx.fillStyle = `hsla(${(hue + i * 15) % 360}, 60%, 70%, 0.7)`;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle - spread) * innerR, cy + Math.sin(angle - spread) * innerR);
    ctx.lineTo(cx + Math.cos(angle - spread * 0.3) * outerR, cy + Math.sin(angle - spread * 0.3) * outerR);
    ctx.lineTo(cx + Math.cos(angle + spread * 0.3) * outerR, cy + Math.sin(angle + spread * 0.3) * outerR);
    ctx.lineTo(cx + Math.cos(angle + spread) * innerR, cy + Math.sin(angle + spread) * innerR);
    ctx.closePath();
    ctx.fill();
  }
  // Central flash
  if (t < 0.3) {
    const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 150);
    fg.addColorStop(0, `hsla(${hue}, 90%, 95%, ${(1 - t / 0.3) * 0.6})`);
    fg.addColorStop(1, 'transparent');
    ctx.globalAlpha = 1;
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  ctx.restore();
}

// Pixel Dissolve — blocks that fade in/out randomly
function drawPixelDissolveTransition(ctx: CanvasRenderingContext2D, progress: number, hue: number) {
  const t = easeOutCubic(progress);
  ctx.save();
  const blockSize = 40;
  const cols = Math.ceil(WIDTH / blockSize);
  const rows = Math.ceil(HEIGHT / blockSize);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = seededRand(r * cols + c + 42);
      const blockT = Math.max(0, Math.min(1, (t - seed * 0.5) * 3));
      if (blockT <= 0 || blockT >= 1) continue;
      const alpha = Math.sin(blockT * Math.PI) * 0.4;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsla(${(hue + seed * 60) % 360}, 50%, ${50 + seed * 30}%, 0.6)`;
      ctx.fillRect(c * blockSize, r * blockSize, blockSize - 1, blockSize - 1);
    }
  }
  ctx.restore();
}

// Curtain Drop — vertical strips falling from top
function drawCurtainDropTransition(ctx: CanvasRenderingContext2D, progress: number, hue: number) {
  const t = easeOutCubic(progress);
  ctx.save();
  const numStrips = 10;
  const stripW = WIDTH / numStrips;
  for (let i = 0; i < numStrips; i++) {
    const delay = Math.abs(i - numStrips / 2) * 0.04;
    const stripT = Math.max(0, Math.min(1, (t - delay) * 2.5));
    if (stripT <= 0) continue;
    const h = HEIGHT * stripT;
    const alpha = (1 - stripT) * 0.35;
    ctx.globalAlpha = alpha;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `hsla(${hue + i * 10}, 50%, 55%, 0.5)`);
    grad.addColorStop(0.8, `hsla(${hue + i * 10}, 65%, 70%, 0.7)`);
    grad.addColorStop(1, `hsla(${hue}, 80%, 85%, 0.3)`);
    ctx.fillStyle = grad;
    ctx.fillRect(i * stripW, 0, stripW - 2, h);
  }
  ctx.restore();
}

// Cross Hatch — diagonal lines crossing
function drawCrossHatchTransition(ctx: CanvasRenderingContext2D, progress: number, hue: number) {
  const t = easeOutExpo(progress);
  ctx.save();
  const numLines = 20;
  const spacing = (WIDTH + HEIGHT) / numLines;
  // Forward diagonals
  for (let i = 0; i < numLines; i++) {
    const lineT = Math.max(0, Math.min(1, (t - i * 0.02) * 2.5));
    if (lineT <= 0) continue;
    ctx.globalAlpha = (1 - lineT) * 0.3;
    ctx.strokeStyle = `hsla(${hue}, 60%, 70%, 0.7)`;
    ctx.lineWidth = 2 + (1 - lineT) * 4;
    const offset = i * spacing - HEIGHT;
    ctx.beginPath();
    ctx.moveTo(offset * lineT, 0);
    ctx.lineTo((offset + HEIGHT) * lineT, HEIGHT);
    ctx.stroke();
  }
  // Backward diagonals (delayed)
  for (let i = 0; i < numLines; i++) {
    const lineT = Math.max(0, Math.min(1, (t - 0.15 - i * 0.02) * 2.5));
    if (lineT <= 0) continue;
    ctx.globalAlpha = (1 - lineT) * 0.2;
    ctx.strokeStyle = `hsla(${(hue + 40) % 360}, 55%, 65%, 0.6)`;
    ctx.lineWidth = 1.5 + (1 - lineT) * 3;
    const offset = i * spacing;
    ctx.beginPath();
    ctx.moveTo(WIDTH - offset * lineT, 0);
    ctx.lineTo(WIDTH - (offset + HEIGHT) * lineT, HEIGHT);
    ctx.stroke();
  }
  ctx.restore();
}

// Smoke Wipe — soft cloudy wipe
function drawSmokeWipeTransition(ctx: CanvasRenderingContext2D, progress: number, hue: number) {
  const t = easeOutCubic(progress);
  ctx.save();
  const numClouds = 15;
  for (let i = 0; i < numClouds; i++) {
    const seed1 = seededRand(i * 17 + 3);
    const seed2 = seededRand(i * 23 + 11);
    const cloudT = Math.max(0, Math.min(1, (t - seed1 * 0.3) * 2));
    if (cloudT <= 0) continue;
    const x = seed1 * WIDTH + lerp(-200, 200, cloudT);
    const y = seed2 * HEIGHT;
    const r = 80 + seed1 * 120;
    const alpha = Math.sin(cloudT * Math.PI) * 0.25;
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `hsla(${hue}, 30%, 70%, 0.5)`);
    grad.addColorStop(0.5, `hsla(${hue}, 20%, 60%, 0.3)`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}

// Film Burn — warm orange/white burn from edges
function drawFilmBurnTransition(ctx: CanvasRenderingContext2D, progress: number, _hue: number) {
  const t = easeOutExpo(progress);
  ctx.save();
  // Edge burns
  const burns = [
    { x: 0, y: HEIGHT * 0.3 },
    { x: WIDTH, y: HEIGHT * 0.6 },
    { x: WIDTH * 0.3, y: 0 },
    { x: WIDTH * 0.7, y: HEIGHT },
  ];
  for (let i = 0; i < burns.length; i++) {
    const burnT = Math.max(0, Math.min(1, (t - i * 0.08) * 2));
    if (burnT <= 0) continue;
    const r = 250 * burnT;
    const alpha = Math.sin(burnT * Math.PI) * 0.5;
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(burns[i].x, burns[i].y, 0, burns[i].x, burns[i].y, r);
    grad.addColorStop(0, 'hsla(40, 100%, 95%, 0.9)');
    grad.addColorStop(0.3, 'hsla(30, 90%, 60%, 0.7)');
    grad.addColorStop(0.6, 'hsla(15, 80%, 40%, 0.4)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(burns[i].x - r, burns[i].y - r, r * 2, r * 2);
  }
  // Flicker
  if (t < 0.3) {
    ctx.globalAlpha = (1 - t / 0.3) * 0.15;
    ctx.fillStyle = 'hsla(45, 100%, 90%, 1)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  ctx.restore();
}

// Diagonal Slice — bold diagonal cut wipe
function drawDiagonalSliceTransition(ctx: CanvasRenderingContext2D, progress: number, hue: number) {
  const t = easeOutCubic(progress);
  ctx.save();
  // Two diagonal wedges closing in
  const offset = lerp(WIDTH * 1.5, 0, t);
  ctx.globalAlpha = (1 - t) * 0.4;
  // Top-left wedge
  ctx.fillStyle = `hsla(${hue}, 60%, 55%, 0.5)`;
  ctx.beginPath();
  ctx.moveTo(-offset, 0);
  ctx.lineTo(WIDTH - offset, 0);
  ctx.lineTo(-offset, HEIGHT);
  ctx.closePath();
  ctx.fill();
  // Bottom-right wedge
  ctx.fillStyle = `hsla(${(hue + 30) % 360}, 55%, 60%, 0.4)`;
  ctx.beginPath();
  ctx.moveTo(WIDTH + offset, HEIGHT);
  ctx.lineTo(offset, HEIGHT);
  ctx.lineTo(WIDTH + offset, 0);
  ctx.closePath();
  ctx.fill();
  // Edge glow line
  ctx.globalAlpha = (1 - t) * 0.7;
  ctx.strokeStyle = `hsla(${hue}, 80%, 80%, 0.8)`;
  ctx.lineWidth = 2;
  ctx.shadowColor = `hsla(${hue}, 80%, 70%, 0.6)`;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.moveTo(WIDTH - offset, 0);
  ctx.lineTo(-offset, HEIGHT);
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.restore();
}

// ── White flash between phases for impact ──
function drawWhiteFlash(ctx: CanvasRenderingContext2D, progress: number, intensity = 0.5) {
  if (progress <= 0 || progress >= 1) return;
  const t = progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85;
  ctx.save();
  ctx.globalAlpha = Math.max(0, t) * intensity;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();
}

// ── Chromatic aberration on photo entry ──
function drawChromaticAberration(ctx: CanvasRenderingContext2D, img: HTMLImageElement, progress: number, scale: number, panX: number, panY: number) {
  if (progress >= 1) return;
  const offset = lerp(8, 0, easeOutCubic(progress));
  if (offset < 0.5) return;
  const imgRatio = img.width / img.height;
  const canvasRatio = WIDTH / HEIGHT;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgRatio > canvasRatio) { sw = img.height * canvasRatio; sx = (img.width - sw) / 2; }
  else { sh = img.width / canvasRatio; sy = (img.height - sh) / 2; }
  ctx.save();
  ctx.globalAlpha = 0.15 * (1 - progress);
  ctx.globalCompositeOperation = 'screen';
  ctx.translate(WIDTH / 2 + panX + offset, HEIGHT / 2 + panY);
  ctx.scale(scale, scale);
  ctx.drawImage(img, sx, sy, sw, sh, -WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.12 * (1 - progress);
  ctx.globalCompositeOperation = 'screen';
  ctx.translate(WIDTH / 2 + panX - offset, HEIGHT / 2 + panY);
  ctx.scale(scale, scale);
  ctx.drawImage(img, sx, sy, sw, sh, -WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);
  ctx.restore();
}

// ── Ambient floating particles during metric phase ──
function drawAmbientParticles(ctx: CanvasRenderingContext2D, progress: number, hue: number) {
  ctx.save();
  const count = 20;
  for (let i = 0; i < count; i++) {
    const seed1 = seededRand(i * 31 + 7);
    const seed2 = seededRand(i * 47 + 13);
    const speed = 0.3 + seed1 * 0.7;
    const x = seed1 * WIDTH;
    const baseY = seed2 * HEIGHT;
    const y = baseY - progress * speed * HEIGHT * 0.4;
    const wrappedY = ((y % HEIGHT) + HEIGHT) % HEIGHT;
    const size = 1 + seed2 * 2.5;
    const alpha = 0.05 + Math.sin(progress * Math.PI * 2 + i) * 0.04;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `hsla(${(hue + i * 18) % 360}, 50%, 70%, 1)`;
    ctx.beginPath(); ctx.arc(x, wrappedY, size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// Master transition dispatcher
function drawGraphicTransition(ctx: CanvasRenderingContext2D, progress: number, dayIndex: number, hue: number) {
  if (progress <= 0 || progress >= 1) return;
  const style = getRandomTransition(dayIndex);
  switch (style) {
    case 'radialWipe': drawRadialWipeTransition(ctx, progress, hue); break;
    case 'lightStreak': drawLightStreakTransition(ctx, progress, hue); break;
    case 'geometricShards': drawGeometricShardsTransition(ctx, progress, hue); break;
    case 'diamondReveal': drawDiamondRevealTransition(ctx, progress, hue); break;
    case 'horizontalBlinds': drawHorizontalBlindsTransition(ctx, progress, hue); break;
    case 'spiralReveal': drawSpiralRevealTransition(ctx, progress, hue); break;
    case 'rippleWave': drawRippleWaveTransition(ctx, progress, hue); break;
    case 'zoomBurst': drawZoomBurstTransition(ctx, progress, hue); break;
    case 'pixelDissolve': drawPixelDissolveTransition(ctx, progress, hue); break;
    case 'curtainDrop': drawCurtainDropTransition(ctx, progress, hue); break;
    case 'crossHatch': drawCrossHatchTransition(ctx, progress, hue); break;
    case 'smokeWipe': drawSmokeWipeTransition(ctx, progress, hue); break;
    case 'filmBurn': drawFilmBurnTransition(ctx, progress, hue); break;
    case 'diagonalSlice': drawDiagonalSliceTransition(ctx, progress, hue); break;
  }
}

// ============ INTRO CARD ============

const WEEK_THEMES: string[][] = [
  ['CONQUER WILL POWER', 'IGNITE YOUR FIRE', 'UNLEASH POTENTIAL'],
  ['BUILD ENERGY', 'RISE AND GRIND', 'FUEL THE HUSTLE'],
  ['INCREASE STAMINA', 'PUSH THE LIMITS', 'BREAK BARRIERS'],
  ['BUILD STRENGTH', 'FORGE YOUR PATH', 'OWN EVERY REP'],
];

function getWeekTheme(weekNum: number): string {
  const pool = WEEK_THEMES[((weekNum - 1) % 4)];
  // Pick a random theme from the pool per generation
  const idx = Math.floor(genRand(900 + weekNum) * pool.length);
  return pool[idx];
}

function drawIntroCard(
  ctx: CanvasRenderingContext2D,
  progress: number,
  totalDays: number,
  userName?: string,
  weekNumber?: number,
) {
  ctx.save();
  drawDarkBg(ctx, 265);

  // Central glow
  const glowT = easeOutExpo(Math.min(progress * 1.8, 1));
  drawGlow(ctx, WIDTH / 2, HEIGHT * 0.38, 400, 265, 0.2 * glowT);

  // ── User name pill — small, subtle, above the main title ──
  const firstName = userName ? userName.split(' ')[0].toUpperCase() : '';
  if (firstName) {
    const nameT = easeOutCubic(Math.min(Math.max(progress - 0.02, 0) * 3, 1));
    if (nameT > 0) {
      ctx.save();
      ctx.globalAlpha = nameT * 0.6;
      const nameY = lerp(HEIGHT * 0.28 + 10, HEIGHT * 0.28, nameT);
      ctx.font = '600 16px -apple-system, "SF Pro Text", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '6px';
      ctx.fillText(`${firstName}'S JOURNEY`, WIDTH / 2, nameY, WIDTH * 0.85);
      ctx.letterSpacing = '0px';
      ctx.restore();
    }
  }

  // ── Main title — contextual per week ──
  const weekNum = weekNumber || 1;
  const theme = getWeekTheme(weekNum);
  const titleLine1 = `WEEK ${weekNum}`;
  const titleLine2 = 'IN MOTION';

  const titleT = easeOutBack(Math.min(Math.max(progress - 0.06, 0) * 2.2, 1));
  if (titleT > 0) {
    ctx.globalAlpha = titleT;
    const slideY = lerp(20, 0, titleT);
    ctx.translate(WIDTH / 2, HEIGHT * 0.40 + slideY);

    ctx.font = FONTS.INTRO_TITLE;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'hsla(265, 60%, 55%, 0.3)';
    ctx.shadowBlur = 40;
    ctx.fillText(titleLine1, 0, -28, WIDTH * 0.9);
    ctx.fillText(titleLine2, 0, 28, WIDTH * 0.9);
    ctx.shadowColor = 'transparent';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Accent line
  const lineT = easeOutCubic(Math.min(Math.max(progress - 0.22, 0) * 3, 1));
  drawThinLine(ctx, HEIGHT * 0.50, 265, lineT * 0.5);

  // ── Theme subtitle — contextual per week ──
  const themeT = easeOutCubic(Math.min(Math.max(progress - 0.26, 0) * 3, 1));
  if (themeT > 0) {
    ctx.save();
    ctx.globalAlpha = themeT * 0.65;
    const themeY = lerp(HEIGHT * 0.53 + 8, HEIGHT * 0.53, themeT);
    ctx.font = '700 18px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = `hsla(265, 60%, 75%, 0.9)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '4px';
    ctx.fillText(theme, WIDTH / 2, themeY, WIDTH * 0.85);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  // ── Stats subtitle ──
  const subT = easeOutCubic(Math.min(Math.max(progress - 0.34, 0) * 3, 1));
  if (subT > 0) {
    ctx.globalAlpha = subT * 0.45;
    const subY = lerp(HEIGHT * 0.58 + 8, HEIGHT * 0.58, subT);
    ctx.font = FONTS.INTRO_SUB;
    ctx.fillStyle = 'rgba(255,255,255,0.50)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '3px';
    ctx.fillText(`${totalDays} DAYS  ·  ${totalDays} ACTIVITIES`, WIDTH / 2, subY, WIDTH * 0.85);
    ctx.letterSpacing = '0px';
  }

  drawGrain(ctx, 0.03);

  // Exit fade
  if (progress > 0.70) {
    const exitT = (progress - 0.70) / 0.30;
    ctx.globalAlpha = easeInOutCubic(exitT);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  ctx.restore();
}

// ============ OUTRO SUMMARY CARD ============

function drawOutroCard(ctx: CanvasRenderingContext2D, progress: number, dayStates: DayState[]) {
  ctx.save();
  drawDarkBg(ctx, 150);

  const glowT = easeOutExpo(Math.min(progress * 2, 1));
  drawGlow(ctx, WIDTH / 2, HEIGHT * 0.36, 400, 150, 0.18 * glowT);

  // Big number — scale in
  const numT = easeOutBack(Math.min(Math.max(progress - 0.03, 0) * 2.5, 1));
  if (numT > 0) {
    ctx.globalAlpha = numT;
    ctx.translate(WIDTH / 2, HEIGHT * 0.34);
    ctx.scale(lerp(0.5, 1, numT), lerp(0.5, 1, numT));
    ctx.font = FONTS.OUTRO_BIG;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'hsla(150, 50%, 50%, 0.3)';
    ctx.shadowBlur = 50;
    ctx.fillText(`${dayStates.length} DAYS`, 0, 0, WIDTH * 0.85);
    ctx.shadowColor = 'transparent';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // "WEEK COMPLETE" label
  const labelT = easeOutCubic(Math.min(Math.max(progress - 0.12, 0) * 3, 1));
  if (labelT > 0) {
    ctx.globalAlpha = labelT * 0.5;
    ctx.font = FONTS.OUTRO_LABEL;
    ctx.fillStyle = 'hsla(150, 40%, 70%, 0.75)';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '6px';
    ctx.fillText('WEEK COMPLETE', WIDTH / 2, HEIGHT * 0.42, WIDTH * 0.85);
    ctx.letterSpacing = '0px';
  }

  // Total calories summary
  const totalCals = dayStates.reduce((sum, d) => sum + (parseInt(d.calories || '0') || 0), 0);
  if (totalCals > 0) {
    const calT = easeOutCubic(Math.min(Math.max(progress - 0.2, 0) * 3, 1));
    if (calT > 0) {
      ctx.globalAlpha = calT * 0.7;
      ctx.font = FONTS.CALORIES;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(`${totalCals} CAL`, WIDTH / 2, HEIGHT * 0.48);
      ctx.font = FONTS.CALORIES_LABEL;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.letterSpacing = '3px';
      ctx.fillText('TOTAL BURNED', WIDTH / 2, HEIGHT * 0.505);
      ctx.letterSpacing = '0px';
    }
  }

  // Divider
  const divT = easeOutCubic(Math.min(Math.max(progress - 0.25, 0) * 3, 1));
  drawThinLine(ctx, HEIGHT * 0.535, 150, divT * 0.5);

  // Activity chips
  const rowT = easeOutCubic(Math.min(Math.max(progress - 0.30, 0) * 2.5, 1));
  if (rowT > 0) {
    const unique = [...new Set(dayStates.map(d => d.activityType))];
    const chipW = 100;
    const chipGap = 12;
    const totalW = unique.length * chipW + (unique.length - 1) * chipGap;
    const startX = (WIDTH - totalW) / 2;

    for (let i = 0; i < unique.length; i++) {
      const delay = i * 0.05;
      const t = easeOutCubic(Math.min(Math.max(progress - 0.30 - delay, 0) * 3.5, 1));
      if (t <= 0) continue;

      const x = startX + i * (chipW + chipGap);
      const y = HEIGHT * 0.565;
      const hue = getActivityHue(unique[i]);

      ctx.globalAlpha = t * 0.8;
      ctx.fillStyle = `hsla(${hue}, 35%, 18%, 0.55)`;
      ctx.beginPath();
      ctx.roundRect(x, y, chipW, 34, 17);
      ctx.fill();

      ctx.strokeStyle = `hsla(${hue}, 45%, 50%, 0.25)`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.roundRect(x, y, chipW, 34, 17);
      ctx.stroke();

      ctx.font = FONTS.STAT_LABEL;
      ctx.fillStyle = `hsla(${hue}, 45%, 78%, 0.9)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const name = unique[i].length > 9 ? unique[i].slice(0, 8) + '.' : unique[i];
      ctx.fillText(name.toUpperCase(), x + chipW / 2, y + 17);
    }
  }

  drawGrain(ctx, 0.025);

  if (progress > 0.72) {
    const exitT = (progress - 0.72) / 0.28;
    ctx.globalAlpha = easeInOutCubic(exitT);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  ctx.restore();
}

// ============ METRIC CARD — 5 PREMIUM VISUAL STYLES WITH DATA ============
// Each day is GUARANTEED a different style within a generation

type MetricStyle = 'typography-wall' | 'centered-hero' | 'split-screen' | 'circular-badge' | 'gradient-stack' | 'bold-diagonal' | 'minimal-strip' | 'neon-frame';

const METRIC_STYLES: MetricStyle[] = [
  'typography-wall', 'centered-hero', 'split-screen', 'circular-badge', 'gradient-stack',
  'bold-diagonal', 'minimal-strip', 'neon-frame',
];

// Pre-assigned metric styles per day — guarantees each day is different
let _assignedMetricStyles: MetricStyle[] = [];

function resetMetricStylePool() {
  // Shuffle all 8 styles, then assign one per day index (wraps if >8 days)
  _assignedMetricStyles = shuffleArray(METRIC_STYLES, _genSeed * 19 + 3);
}

function getMetricStyle(dayIndex: number): MetricStyle {
  return _assignedMetricStyles[dayIndex % _assignedMetricStyles.length];
}

// ── Shared: Draw bottom metric row (duration, calories, intensity) ──
function drawMetricDataRow(ctx: CanvasRenderingContext2D, state: DayState, progress: number, hue: number, baseY: number) {
  const items: { label: string; value: string }[] = [];
  if (state.metricA && state.metricA.value !== '--') items.push(state.metricA);
  if (state.metricB && state.metricB.value !== '--') items.push(state.metricB);
  if (state.calories) items.push({ label: 'Calories', value: `${state.calories}` });

  if (items.length === 0) return;

  const gap = 130;
  const totalW = (items.length - 1) * gap;
  const startX = (WIDTH - totalW) / 2;

  for (let i = 0; i < items.length; i++) {
    const delay = 0.35 + i * 0.06;
    const t = easeOutCubic(Math.min(Math.max(progress - delay, 0) * 3, 1));
    if (t <= 0) continue;

    const x = startX + i * gap;
    const slideY = lerp(12, 0, t);

    // Value — big bold
    ctx.save();
    ctx.globalAlpha = t;
    ctx.font = FONTS.STAT_VALUE;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(items[i].value, x, baseY + slideY, 120);
    ctx.restore();

    // Label — subtle
    ctx.save();
    ctx.globalAlpha = t * 0.5;
    ctx.font = FONTS.STAT_LABEL;
    ctx.fillStyle = `hsla(${hue}, 45%, 70%, 0.9)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '2px';
    ctx.fillText(items[i].label.toUpperCase(), x, baseY + 28 + slideY, 120);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  // Intensity badge
  if (state.intensity) {
    const badgeT = easeOutCubic(Math.min(Math.max(progress - 0.55, 0) * 3, 1));
    if (badgeT > 0) {
      ctx.save();
      ctx.globalAlpha = badgeT * 0.7;
      ctx.font = '600 16px -apple-system, "SF Pro Text", system-ui, sans-serif';
      ctx.fillStyle = `hsla(${hue}, 50%, 70%, 0.8)`;
      ctx.textAlign = 'center';
      ctx.fillText(state.intensity, WIDTH / 2, baseY + 58);
      ctx.restore();
    }
  }
}

// Style 1: Typography Wall — DAY XX repeated vertically with data at bottom
function drawStyleTypographyWall(ctx: CanvasRenderingContext2D, state: DayState, progress: number, hue: number) {
  const dayStr = `DAY ${String(state.dayNumber).padStart(2, '0')}`;
  const font = '900 100px -apple-system, "SF Pro Display", system-ui, sans-serif';
  const lineH = 120;
  const totalLines = 11;
  const centerLine = 4; // shifted up to make room for data
  const scrollOffset = lerp(40, -20, easeInOutCubic(Math.min(progress * 1.5, 1)));
  const startY = (HEIGHT * 0.4) - (centerLine * lineH) + scrollOffset;

  for (let i = 0; i < totalLines; i++) {
    const y = startY + i * lineH;
    if (y < -lineH || y > HEIGHT + lineH) continue;
    const isCenterLine = i === centerLine;
    const distFromCenter = Math.abs(i - centerLine);
    const lineDelay = distFromCenter * 0.03;
    const lineT = easeOutCubic(Math.min(Math.max(progress - lineDelay, 0) * 2.5, 1));
    if (lineT <= 0) continue;
    const slideDir = i % 2 === 0 ? 1 : -1;
    const slideX = lerp(slideDir * 120, 0, lineT);
    ctx.save();
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (isCenterLine) {
      ctx.translate(WIDTH / 2 + slideX, y);
      ctx.globalAlpha = lineT;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = `hsla(${hue}, 70%, 60%, 0.4)`;
      ctx.shadowBlur = 30;
      ctx.fillText(dayStr, 0, 0, WIDTH * 0.9);
      ctx.shadowColor = 'transparent';
    } else {
      const alpha = Math.max(0.08, 0.4 - distFromCenter * 0.06) * lineT;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsla(${hue}, 20%, 40%, 0.6)`;
      ctx.strokeStyle = `hsla(${hue}, 30%, 50%, ${alpha * 0.5})`;
      ctx.lineWidth = 1;
      ctx.translate(WIDTH / 2 + slideX, y);
      ctx.strokeText(dayStr, 0, 0);
    }
    ctx.restore();
  }

  // Activity name — background branding
  const actBgT = easeOutCubic(Math.min(Math.max(progress - 0.2, 0) * 2.5, 1));
  if (actBgT > 0) {
    ctx.save();
    ctx.globalAlpha = actBgT * 0.06;
    ctx.font = '900 180px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = `hsla(${hue}, 40%, 50%, 1)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.activityType.toUpperCase(), WIDTH / 2, HEIGHT * 0.5, WIDTH * 0.95);
    ctx.restore();
  }

  // Data row at bottom
  drawMetricDataRow(ctx, state, progress, hue, HEIGHT * 0.78);
}

// Style 2: Centered Hero — massive day number, activity underneath, data below
function drawStyleCenteredHero(ctx: CanvasRenderingContext2D, state: DayState, progress: number, hue: number) {
  // Ghost "DAY" text
  const ghostT = easeOutCubic(Math.min(progress * 2.5, 1));
  if (ghostT > 0) {
    ctx.save();
    ctx.globalAlpha = ghostT * 0.08;
    ctx.font = '900 200px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = `hsla(${hue}, 40%, 50%, 1)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DAY', WIDTH / 2, HEIGHT * 0.28);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = ghostT * 0.4;
    ctx.font = '600 16px -apple-system, "SF Pro Text", system-ui, sans-serif';
    ctx.fillStyle = `hsla(${hue}, 50%, 70%, 1)`;
    ctx.textAlign = 'center';
    ctx.letterSpacing = '8px';
    ctx.fillText('DAY', WIDTH / 2, HEIGHT * 0.28);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }
  
  // Hero number
  const heroT = easeOutCubic(Math.min(Math.max(progress - 0.1, 0) * 2.5, 1));
  if (heroT > 0) {
    const slideY = lerp(20, 0, heroT);
    ctx.save();
    ctx.globalAlpha = heroT;
    ctx.font = '900 172px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = `hsla(${hue}, 70%, 60%, 0.35)`;
    ctx.shadowBlur = 40;
    ctx.fillText(String(state.dayNumber).padStart(2, '0'), WIDTH / 2, HEIGHT * 0.40 + slideY, WIDTH * 0.85);
    ctx.shadowColor = 'transparent';
    ctx.restore();
  }
  
  // Activity name — bold
  const actT = easeOutCubic(Math.min(Math.max(progress - 0.25, 0) * 3, 1));
  if (actT > 0) {
    ctx.save();
    ctx.globalAlpha = actT * 0.85;
    ctx.font = '800 36px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.activityType.toUpperCase(), WIDTH / 2, HEIGHT * 0.54 + lerp(8, 0, actT), WIDTH * 0.85);
    ctx.restore();
  }

  // Thin divider
  const divT = easeOutCubic(Math.min(Math.max(progress - 0.32, 0) * 3, 1));
  drawThinLine(ctx, HEIGHT * 0.62, hue, divT * 0.4);

  // Data row
  drawMetricDataRow(ctx, state, progress, hue, HEIGHT * 0.72);
}

// Style 3: Split Screen — day on top half, activity + data on bottom
function drawStyleSplitScreen(ctx: CanvasRenderingContext2D, state: DayState, progress: number, hue: number) {
  const splitY = HEIGHT * 0.45;
  
  // Top half tint
  const topT = easeOutCubic(Math.min(progress * 2, 1));
  if (topT > 0) {
    ctx.save();
    ctx.globalAlpha = topT * 0.12;
    ctx.fillStyle = `hsla(${hue}, 40%, 50%, 1)`;
    ctx.fillRect(0, 0, WIDTH, splitY);
    ctx.restore();
  }
  
  // Divider
  const lineT = easeOutCubic(Math.min(Math.max(progress - 0.15, 0) * 3, 1));
  if (lineT > 0) {
    ctx.save();
    ctx.globalAlpha = lineT * 0.3;
    ctx.strokeStyle = `hsla(${hue}, 60%, 70%, 0.8)`;
    ctx.lineWidth = 1;
    const lineW = WIDTH * 0.7 * lineT;
    ctx.beginPath();
    ctx.moveTo((WIDTH - lineW) / 2, splitY);
    ctx.lineTo((WIDTH + lineW) / 2, splitY);
    ctx.stroke();
    ctx.restore();
  }
  
  // "DAY" label
  const numT = easeOutCubic(Math.min(Math.max(progress - 0.03, 0) * 2.5, 1));
  if (numT > 0) {
    ctx.save();
    ctx.globalAlpha = numT * 0.5;
    ctx.font = '600 18px -apple-system, "SF Pro Text", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '6px';
    ctx.fillText('DAY', WIDTH / 2, splitY * 0.25);
    ctx.letterSpacing = '0px';
    ctx.restore();

    // Day number
    ctx.save();
    ctx.globalAlpha = numT;
    ctx.font = '900 140px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(state.dayNumber).padStart(2, '0'), WIDTH / 2, splitY * 0.55 + lerp(-20, 0, numT), WIDTH * 0.85);
    ctx.restore();
  }
  
  // Activity name — bottom half
  const actT = easeOutCubic(Math.min(Math.max(progress - 0.2, 0) * 3, 1));
  if (actT > 0) {
    ctx.save();
    ctx.globalAlpha = actT;
    ctx.font = '900 48px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.activityType.toUpperCase(), WIDTH / 2, splitY + (HEIGHT - splitY) * 0.28 + lerp(10, 0, actT), WIDTH * 0.85);
    ctx.restore();
  }

  // Data in bottom half
  drawMetricDataRow(ctx, state, progress, hue, splitY + (HEIGHT - splitY) * 0.58);
}

// Style 4: Circular Badge — glowing ring with data outside
function drawStyleCircularBadge(ctx: CanvasRenderingContext2D, state: DayState, progress: number, hue: number) {
  const cx = WIDTH / 2, cy = HEIGHT * 0.38;
  const radius = 120;
  
  // Ring animation
  const ringT = easeOutCubic(Math.min(progress * 2.5, 1));
  if (ringT > 0) {
    ctx.save();
    ctx.globalAlpha = ringT * 0.6;
    ctx.strokeStyle = `hsla(${hue}, 60%, 65%, 0.8)`;
    ctx.lineWidth = 3;
    ctx.shadowColor = `hsla(${hue}, 70%, 60%, 0.5)`;
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * ringT, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringT);
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.restore();

    // Inner glow
    if (ringT > 0.5) {
      ctx.save();
      ctx.globalAlpha = (ringT - 0.5) * 0.2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `hsla(${hue}, 50%, 60%, 0.15)`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.restore();
    }
  }
  
  // Day number inside ring
  const numT = easeOutCubic(Math.min(Math.max(progress - 0.12, 0) * 2.5, 1));
  if (numT > 0) {
    ctx.save();
    ctx.globalAlpha = numT;
    ctx.font = '900 88px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(state.dayNumber).padStart(2, '0'), cx, cy + 5);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = numT * 0.5;
    ctx.font = '600 14px -apple-system, "SF Pro Text", system-ui, sans-serif';
    ctx.fillStyle = `hsla(${hue}, 50%, 70%, 1)`;
    ctx.textAlign = 'center';
    ctx.letterSpacing = '6px';
    ctx.fillText('DAY', cx, cy - 50);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }
  
  // Activity below ring
  const actT = easeOutCubic(Math.min(Math.max(progress - 0.28, 0) * 3, 1));
  if (actT > 0) {
    ctx.save();
    ctx.globalAlpha = actT;
    ctx.font = '800 28px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(state.activityType.toUpperCase(), cx, cy + radius + 40 + lerp(8, 0, actT), WIDTH * 0.85);
    ctx.restore();
  }

  // Data row below
  drawMetricDataRow(ctx, state, progress, hue, HEIGHT * 0.75);
}

// Style 5: Gradient Stack — stacked text with data
function drawStyleGradientStack(ctx: CanvasRenderingContext2D, state: DayState, progress: number, hue: number) {
  const items = [
    { text: 'DAY', size: 24, weight: '600', y: 0.28, color: `hsla(${hue}, 50%, 65%, 0.6)`, spacing: '10px' },
    { text: String(state.dayNumber).padStart(2, '0'), size: 160, weight: '900', y: 0.40, color: '#ffffff', spacing: '0px' },
    { text: state.activityType.toUpperCase(), size: 36, weight: '800', y: 0.53, color: `hsla(${(hue + 30) % 360}, 55%, 70%, 1)`, spacing: '2px' },
  ];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const delay = i * 0.07;
    const t = easeOutCubic(Math.min(Math.max(progress - delay, 0) * 2.5, 1));
    if (t <= 0) continue;
    const slideY = lerp(20, 0, t);
    ctx.save();
    ctx.globalAlpha = t;
    ctx.font = `${item.weight} ${item.size}px -apple-system, "SF Pro Display", system-ui, sans-serif`;
    ctx.fillStyle = item.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = item.spacing;
    if (item.size >= 100) {
      ctx.shadowColor = `hsla(${hue}, 60%, 55%, 0.25)`;
      ctx.shadowBlur = 40;
    }
    ctx.fillText(item.text, WIDTH / 2, HEIGHT * item.y + slideY, WIDTH * 0.9);
    ctx.shadowColor = 'transparent';
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  // Divider
  const divT = easeOutCubic(Math.min(Math.max(progress - 0.3, 0) * 3, 1));
  drawThinLine(ctx, HEIGHT * 0.60, hue, divT * 0.4);

  // Data row
  drawMetricDataRow(ctx, state, progress, hue, HEIGHT * 0.72);
}

// Style 6: Bold Diagonal — day number at a dramatic angle with thick stripe
function drawStyleBoldDiagonal(ctx: CanvasRenderingContext2D, state: DayState, progress: number, hue: number) {
  // Diagonal accent stripe
  const stripeT = easeOutCubic(Math.min(progress * 2.5, 1));
  if (stripeT > 0) {
    ctx.save();
    ctx.globalAlpha = stripeT * 0.15;
    ctx.translate(WIDTH / 2, HEIGHT / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.fillStyle = `hsla(${hue}, 50%, 55%, 1)`;
    const stripeW = 180 * stripeT;
    ctx.fillRect(-stripeW / 2, -HEIGHT, stripeW, HEIGHT * 2);
    ctx.restore();
  }

  // Day number — rotated and huge
  const numT = easeOutBack(Math.min(Math.max(progress - 0.05, 0) * 2.5, 1));
  if (numT > 0) {
    ctx.save();
    ctx.globalAlpha = numT;
    ctx.translate(WIDTH * 0.55, HEIGHT * 0.35);
    ctx.rotate(-0.12);
    ctx.font = '900 200px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = `hsla(${hue}, 70%, 55%, 0.4)`;
    ctx.shadowBlur = 50;
    ctx.fillText(String(state.dayNumber).padStart(2, '0'), 0, 0, WIDTH);
    ctx.shadowColor = 'transparent';
    ctx.restore();
  }

  // "DAY" label top-left
  const labelT = easeOutCubic(Math.min(Math.max(progress - 0.15, 0) * 3, 1));
  if (labelT > 0) {
    ctx.save();
    ctx.globalAlpha = labelT * 0.6;
    ctx.font = '800 28px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = `hsla(${hue}, 55%, 70%, 1)`;
    ctx.letterSpacing = '8px';
    ctx.fillText('DAY', WIDTH * 0.12, HEIGHT * 0.18 + lerp(10, 0, labelT));
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  // Activity name — bottom aligned
  const actT = easeOutCubic(Math.min(Math.max(progress - 0.25, 0) * 3, 1));
  if (actT > 0) {
    ctx.save();
    ctx.globalAlpha = actT;
    ctx.font = '900 44px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(state.activityType.toUpperCase(), WIDTH * 0.08, HEIGHT * 0.6 + lerp(8, 0, actT), WIDTH * 0.85);
    ctx.restore();
  }

  drawMetricDataRow(ctx, state, progress, hue, HEIGHT * 0.78);
}

// Style 7: Minimal Strip — clean horizontal bars with data
function drawStyleMinimalStrip(ctx: CanvasRenderingContext2D, state: DayState, progress: number, hue: number) {
  // Three horizontal accent bars
  const bars = [
    { y: HEIGHT * 0.25, w: WIDTH * 0.6, h: 2 },
    { y: HEIGHT * 0.50, w: WIDTH * 0.4, h: 2 },
    { y: HEIGHT * 0.65, w: WIDTH * 0.55, h: 2 },
  ];
  for (let i = 0; i < bars.length; i++) {
    const barT = easeOutCubic(Math.min(Math.max(progress - i * 0.08, 0) * 3, 1));
    if (barT <= 0) continue;
    ctx.save();
    ctx.globalAlpha = barT * 0.25;
    ctx.fillStyle = `hsla(${hue + i * 20}, 50%, 65%, 1)`;
    ctx.fillRect((WIDTH - bars[i].w * barT) / 2, bars[i].y, bars[i].w * barT, bars[i].h);
    ctx.restore();
  }

  // "DAY" — tiny, tracked wide
  const dayLabelT = easeOutCubic(Math.min(progress * 3, 1));
  if (dayLabelT > 0) {
    ctx.save();
    ctx.globalAlpha = dayLabelT * 0.4;
    ctx.font = '600 14px -apple-system, "SF Pro Text", system-ui, sans-serif';
    ctx.fillStyle = `hsla(${hue}, 50%, 70%, 1)`;
    ctx.textAlign = 'center';
    ctx.letterSpacing = '12px';
    ctx.fillText('DAY', WIDTH / 2, HEIGHT * 0.30);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  // Day number — clean, centered
  const numT = easeOutCubic(Math.min(Math.max(progress - 0.08, 0) * 2.5, 1));
  if (numT > 0) {
    ctx.save();
    ctx.globalAlpha = numT;
    ctx.font = '200 160px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(state.dayNumber).padStart(2, '0'), WIDTH / 2, HEIGHT * 0.40 + lerp(12, 0, numT), WIDTH * 0.85);
    ctx.restore();
  }

  // Activity — light weight
  const actT = easeOutCubic(Math.min(Math.max(progress - 0.22, 0) * 3, 1));
  if (actT > 0) {
    ctx.save();
    ctx.globalAlpha = actT * 0.8;
    ctx.font = '300 24px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '4px';
    ctx.fillText(state.activityType.toUpperCase(), WIDTH / 2, HEIGHT * 0.55 + lerp(6, 0, actT), WIDTH * 0.85);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  drawMetricDataRow(ctx, state, progress, hue, HEIGHT * 0.76);
}

// Style 8: Neon Frame — glowing rectangular frame with data inside
function drawStyleNeonFrame(ctx: CanvasRenderingContext2D, state: DayState, progress: number, hue: number) {
  const frameT = easeOutCubic(Math.min(progress * 2, 1));
  const fx = WIDTH * 0.12, fy = HEIGHT * 0.18;
  const fw = WIDTH * 0.76, fh = HEIGHT * 0.55;

  // Draw neon rectangle
  if (frameT > 0) {
    ctx.save();
    ctx.globalAlpha = frameT * 0.7;
    ctx.strokeStyle = `hsla(${hue}, 70%, 65%, 0.9)`;
    ctx.lineWidth = 2;
    ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.8)`;
    ctx.shadowBlur = 40;
    const drawLen = (fw * 2 + fh * 2) * frameT;
    ctx.beginPath();
    // Trace the rectangle progressively
    const perimeter = fw * 2 + fh * 2;
    let remaining = drawLen;
    ctx.moveTo(fx, fy);
    // Top edge
    const topLen = Math.min(remaining, fw); remaining -= topLen;
    ctx.lineTo(fx + topLen, fy);
    // Right edge
    if (remaining > 0) { const rLen = Math.min(remaining, fh); remaining -= rLen; ctx.lineTo(fx + fw, fy + rLen); }
    // Bottom edge
    if (remaining > 0) { const bLen = Math.min(remaining, fw); remaining -= bLen; ctx.lineTo(fx + fw - bLen, fy + fh); }
    // Left edge
    if (remaining > 0) { const lLen = Math.min(remaining, fh); ctx.lineTo(fx, fy + fh - lLen); }
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.restore();

    // Inner glow fill
    ctx.save();
    ctx.globalAlpha = frameT * 0.04;
    ctx.fillStyle = `hsla(${hue}, 50%, 60%, 1)`;
    ctx.fillRect(fx, fy, fw, fh);
    ctx.restore();
  }

  // Day number centered in frame
  const numT = easeOutBack(Math.min(Math.max(progress - 0.15, 0) * 2.5, 1));
  if (numT > 0) {
    ctx.save();
    ctx.globalAlpha = numT;
    ctx.font = '900 130px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(state.dayNumber).padStart(2, '0'), WIDTH / 2, fy + fh * 0.38 + lerp(15, 0, numT));
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = numT * 0.5;
    ctx.font = '600 16px -apple-system, "SF Pro Text", system-ui, sans-serif';
    ctx.fillStyle = `hsla(${hue}, 60%, 75%, 1)`;
    ctx.textAlign = 'center';
    ctx.letterSpacing = '8px';
    ctx.fillText('DAY', WIDTH / 2, fy + fh * 0.15);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  // Activity below center in frame
  const actT = easeOutCubic(Math.min(Math.max(progress - 0.3, 0) * 3, 1));
  if (actT > 0) {
    ctx.save();
    ctx.globalAlpha = actT;
    ctx.font = '800 30px -apple-system, "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(state.activityType.toUpperCase(), WIDTH / 2, fy + fh * 0.72 + lerp(6, 0, actT), fw * 0.9);
    ctx.restore();
  }

  drawMetricDataRow(ctx, state, progress, hue, HEIGHT * 0.82);
}

function drawMetricCard(
  ctx: CanvasRenderingContext2D,
  state: DayState,
  progress: number,
  globalAlpha: number
) {
  ctx.save();
  ctx.globalAlpha = globalAlpha;

  const hue = getActivityHue(state.activityType);
  drawDarkBg(ctx, hue);
  
  // Subtle glow behind center
  const glowP = easeOutExpo(Math.min(progress * 2, 1));
  drawGlow(ctx, WIDTH / 2, HEIGHT * 0.42, 400, hue, 0.12 * glowP);

  drawGrain(ctx, 0.03);
  
  // Draw the day-specific style
  const style = getMetricStyle(state.dayNumber - 1);
  switch (style) {
    case 'typography-wall': drawStyleTypographyWall(ctx, state, progress, hue); break;
    case 'centered-hero': drawStyleCenteredHero(ctx, state, progress, hue); break;
    case 'split-screen': drawStyleSplitScreen(ctx, state, progress, hue); break;
    case 'circular-badge': drawStyleCircularBadge(ctx, state, progress, hue); break;
    case 'gradient-stack': drawStyleGradientStack(ctx, state, progress, hue); break;
    case 'bold-diagonal': drawStyleBoldDiagonal(ctx, state, progress, hue); break;
    case 'minimal-strip': drawStyleMinimalStrip(ctx, state, progress, hue); break;
    case 'neon-frame': drawStyleNeonFrame(ctx, state, progress, hue); break;
  }

  // ── Exit — smooth fade to black with graphic transition ──
  if (progress > 0.78) {
    const exitT = (progress - 0.78) / 0.22;
    ctx.fillStyle = `rgba(0,0,0,${easeInOutCubic(exitT) * 0.9})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    if (exitT > 0.15) {
      drawGraphicTransition(ctx, (exitT - 0.15) / 0.85, state.dayNumber, hue);
    }
  }

  ctx.restore();
}

// ============ PHOTO PHASE ============

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  scale = 1, panX = 0, panY = 0
) {
  const imgRatio = img.width / img.height;
  const canvasRatio = WIDTH / HEIGHT;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;

  if (imgRatio > canvasRatio) {
    sw = img.height * canvasRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / canvasRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.save();
  ctx.translate(WIDTH / 2 + panX, HEIGHT / 2 + panY);
  ctx.scale(scale, scale);
  ctx.drawImage(img, sx, sy, sw, sh, -WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);
  ctx.restore();
}

function drawPhotoOverlays(ctx: CanvasRenderingContext2D, _state: DayState, _textOpacity: number) {
  // Clean photo — NO text overlays. Only subtle cinematic vignettes.
  ctx.save();
  
  // Bottom vignette for cinematic depth
  const bottomGrad = ctx.createLinearGradient(0, HEIGHT - 200, 0, HEIGHT);
  bottomGrad.addColorStop(0, 'transparent');
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, HEIGHT - 200, WIDTH, 200);

  // Top vignette
  const topGrad = ctx.createLinearGradient(0, 0, 0, 100);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.15)');
  topGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, WIDTH, 100);

  ctx.restore();
}

// ============ REAL MUSIC FETCHING ============

function getDominantActivity(dayStates: DayState[]): string {
  const counts: Record<string, number> = {};
  for (const s of dayStates) {
    const key = s.activityType.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  }
  let best = 'workout';
  let max = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > max) { max = v; best = k; }
  }
  return best;
}

async function fetchActivityMusic(activity: string, durationSeconds: number, allActivities?: string[], dayStates?: DayState[], userName?: string, weekNumber?: number): Promise<AudioBuffer | null> {
  try {
    // Use a unique seed per generation so each reel gets a different track
    const seed = _genSeed || Date.now();

    // Build rich journey context for AI-powered music selection
    const journeyData = {
      activities: allActivities || [activity],
      durations: dayStates?.map(d => d.metricA?.value || d.metricB?.value || '').filter(Boolean) || [],
      intensities: dayStates?.map(d => d.intensity || '').filter(Boolean) || [],
      prs: dayStates?.map(d => d.metricC?.value || '').filter(Boolean) || [],
      streakDays: dayStates?.length || 1,
      weekNumber: weekNumber || 1,
      userName: userName || 'User',
    };

    console.log('[MotionRecap] 🤖 AI music selection — activities:', journeyData.activities.join(', '), 'streak:', journeyData.streakDays);
    const { data, error } = await supabase.functions.invoke('fetch-activity-music', {
      body: { activity, seed, journeyData },
    });

    if (error || !data?.success || !data?.track?.url) {
      console.warn('[MotionRecap] Pixabay fetch failed:', error || data?.error);
      return null;
    }

    const trackUrl = data.track.url;
    console.log('[MotionRecap] 🎵 Downloading:', data.track.title, 'by', data.track.artist, `(ID: ${data.track.pixabayId})`);

    const response = await fetch(trackUrl);
    if (!response.ok) {
      console.warn('[MotionRecap] Track download failed:', response.status);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioCtx = new AudioContext({ sampleRate: 44100 });
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    audioCtx.close();

    // Trim or loop to match video duration
    const targetLength = Math.ceil(44100 * durationSeconds);
    const result = new AudioBuffer({
      length: targetLength,
      sampleRate: 44100,
      numberOfChannels: Math.min(decoded.numberOfChannels, 2),
    });

    for (let ch = 0; ch < result.numberOfChannels; ch++) {
      const src = decoded.getChannelData(ch);
      const dst = result.getChannelData(ch);

      for (let i = 0; i < targetLength; i++) {
        const srcIdx = i % src.length;
        let sample = src[srcIdx];

        // Smooth fade in/out
        const fadeIn = Math.min(1, i / (44100 * 0.8));
        const fadeOut = Math.min(1, (targetLength - i) / (44100 * 1.5));
        sample *= fadeIn * fadeOut;

        dst[i] = sample;
      }
    }

    console.log('[MotionRecap] ✅ Real music decoded and trimmed to', durationSeconds.toFixed(1), 's');
    return result;
  } catch (err) {
    console.warn('[MotionRecap] Music fetch error:', err);
    return null;
  }
}

// ============ MAIN GENERATOR ============

export async function generateMotionRecap(options: MotionRecapOptions): Promise<string> {
  const { dayStates, userName, weekNumber, onProgress } = options;

  if (dayStates.length < 3) throw new Error('Need at least 3 days for recap');

  // ── New unique seed per generation — ensures every reel is COMPLETELY different ──
  _genSeed = (Date.now() * 31) ^ (Math.random() * 0xFFFFFFFF >>> 0);
  console.log(`[MotionRecap] 🎬 Starting v8 — ${dayStates.length} days, seed: ${_genSeed}`);

  // Reset ALL pools for unique order each generation (seeded by unique seed)
  resetTransitionPool();
  resetMetricStylePool();
  console.log(`[MotionRecap] 🎨 Metric styles for days: ${_assignedMetricStyles.slice(0, dayStates.length).join(' → ')}`);
  console.log(`[MotionRecap] 🎨 First transitions: ${_shuffledTransitions.slice(0, 4).join(' → ')}`);
  onProgress?.(3, 'Gathering your moments...');

  const images = await loadImages(dayStates);
  console.log('[MotionRecap] All photos loaded');

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;
  if (!ctx) throw new Error('Canvas context failed');

  const totalDuration = TIMING.INTRO +
    dayStates.length * DAY_SLOT +
    TIMING.OUTRO +
    TIMING.OUTRO_FADE;
  const totalFrames = Math.ceil(totalDuration * FPS);

  console.log('[MotionRecap] Duration:', totalDuration.toFixed(1), 's, Frames:', totalFrames);

  // Try to fetch real contextual music from Pixabay, fall back to synthesized
  onProgress?.(10, 'Finding the perfect soundtrack...');
  const dominantActivity = getDominantActivity(dayStates);
  const allActivities = dayStates.map(s => s.activityType);
  let audioBuffer: AudioBuffer;
  let musicSource = 'synthesized';

  try {
    const realMusic = await fetchActivityMusic(dominantActivity, totalDuration, allActivities, dayStates, userName, weekNumber);
    if (realMusic) {
      audioBuffer = realMusic;
      musicSource = 'pixabay';
      console.log('[MotionRecap] 🎵 Using real Pixabay music track');
    } else {
      throw new Error('No track returned');
    }
  } catch (err) {
    console.log('[MotionRecap] Pixabay unavailable, using synthesized audio:', err);
    const mood = getDominantMood(dayStates);
    audioBuffer = generateContextualAudio(totalDuration, mood, dayStates);
  }

  onProgress?.(16, 'Soundtrack locked in 🎵');
  const wavData = audioBufferToWav(audioBuffer);
  console.log('[MotionRecap] Audio ready:', (wavData.byteLength / 1024).toFixed(0), 'KB');
  onProgress?.(18, 'Crafting your story...');

  // Setup MediaRecorder with audio
  const videoStream = canvas.captureStream(FPS);
  const audioCtx = new AudioContext({ sampleRate: 44100 });
  const audioSource = audioCtx.createBufferSource();
  const realtimeBuffer = audioCtx.createBuffer(
    audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate
  );
  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    realtimeBuffer.copyToChannel(audioBuffer.getChannelData(ch), ch);
  }
  audioSource.buffer = realtimeBuffer;

  const dest = audioCtx.createMediaStreamDestination();
  audioSource.connect(dest);

  const combinedStream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mimeTypes = [
    'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4',
  ];
  const selectedMimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  console.log('[MotionRecap] Codec:', selectedMimeType);

  const mediaRecorder = new MediaRecorder(combinedStream, {
    mimeType: selectedMimeType,
    videoBitsPerSecond: 5_000_000,
  });

  const chunks: Blob[] = [];

  return new Promise<string>((resolve, reject) => {
    let resolved = false;

    const safetyTimeout = setTimeout(() => {
      if (!resolved) {
        console.warn('[MotionRecap] Safety timeout — forcing completion');
        try { if (mediaRecorder.state !== 'inactive') mediaRecorder.stop(); } catch {}
      }
    }, 120_000);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    let stopFallback: ReturnType<typeof setTimeout>;

    const finalize = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(safetyTimeout);
      clearTimeout(stopFallback);
      audioSource.stop();
      audioCtx.close();
      const blob = new Blob(chunks, { type: selectedMimeType.split(';')[0] });
      const url = URL.createObjectURL(blob);
      console.log('[MotionRecap] Done! Blob size:', (blob.size / 1024).toFixed(0), 'KB');
      onProgress?.(100, 'Your story is ready ✨');
      resolve(url);
    };

    mediaRecorder.onstop = finalize;

    mediaRecorder.onerror = (e) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(safetyTimeout);
      audioCtx.close();
      console.error('[MotionRecap] Recorder error:', e);
      reject(new Error('Video encoding failed'));
    };

    mediaRecorder.start(200);
    audioSource.start(0);

    // ── Pre-compute Ken Burns directions per day (NOT per frame!) ──
    const KB_ALL_DIRECTIONS = [
      { sx: -4, sy: -3, ex: 4, ey: 3 },
      { sx: 5, sy: -2, ex: -5, ey: 2 },
      { sx: 0, sy: -5, ex: 0, ey: 5 },
      { sx: -5, sy: 0, ex: 5, ey: 0 },
      { sx: 3, sy: 4, ex: -3, ey: -4 },
      { sx: -3, sy: 5, ex: 3, ey: -5 },
      { sx: 5, sy: 3, ex: -5, ey: -3 },
      { sx: -6, sy: -1, ex: 6, ey: 1 },
      { sx: 2, sy: -6, ex: -2, ey: 6 },
      { sx: -4, sy: 4, ex: 4, ey: -4 },
    ];
    const kbShuffled = shuffleArray(KB_ALL_DIRECTIONS, _genSeed * 31 + 11);
    const precomputedKB = dayStates.map((_, i) => kbShuffled[i % kbShuffled.length]);

    // ── Per-generation color hue offset for extra visual variety ──
    const hueOffset = Math.round(genRand(777) * 40 - 20); // ±20° shift

    let frameIndex = 0;

    const renderLoop = () => {
      if (resolved || frameIndex >= totalFrames) {
        onProgress?.(95, 'Adding the finishing touches...');
        setTimeout(() => {
          try {
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
              stopFallback = setTimeout(() => {
                console.warn('[MotionRecap] onstop never fired — forcing finalize');
                finalize();
              }, 3000);
            } else {
              finalize();
            }
          } catch {
            finalize();
          }
        }, 400);
        return;
      }

      const time = frameIndex / FPS;

      // Global fade out
      const outroStart = totalDuration - TIMING.OUTRO_FADE;
      const outroOpacity = time > outroStart ? Math.max(0, 1 - (time - outroStart) / TIMING.OUTRO_FADE) : 1;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // ── Phase: Intro ──
      if (time < TIMING.INTRO) {
        drawIntroCard(ctx, time / TIMING.INTRO, dayStates.length, userName, weekNumber);
      }
      // ── Phase: Day slots ──
      else if (time < TIMING.INTRO + dayStates.length * DAY_SLOT) {
        const contentTime = time - TIMING.INTRO;
        const dayIndex = Math.min(Math.floor(contentTime / DAY_SLOT), dayStates.length - 1);
        const timeInSlot = contentTime - dayIndex * DAY_SLOT;
        const inMetricPhase = timeInSlot < TIMING.METRIC_DURATION;

        if (inMetricPhase) {
          const metricProgress = timeInSlot / TIMING.METRIC_DURATION;
          drawMetricCard(ctx, dayStates[dayIndex], metricProgress, outroOpacity);
        } else {
          const photoTime = timeInSlot - TIMING.METRIC_DURATION;
          const photoProgress = photoTime / TIMING.PHOTO_DURATION;

          // Smooth Ken Burns — pre-computed direction per day per generation
          const kbDir = precomputedKB[dayIndex];
          const kbScale = lerp(1.01, 1.01 + TIMING.KEN_BURNS_SCALE, easeInOutCubic(photoProgress));
          const kbPanX = lerp(kbDir.sx, kbDir.ex, easeInOutCubic(photoProgress));
          const kbPanY = lerp(kbDir.sy, kbDir.ey, easeInOutCubic(photoProgress));

          // Smooth fade entry — no overshoot, no shake
          const fadeIn = easeOutCubic(Math.min(photoTime / TIMING.CROSSFADE, 1));
          const timeToEnd = TIMING.PHOTO_DURATION - photoTime;
          const fadeOut = Math.min(1, timeToEnd / TIMING.CROSSFADE);
          const photoAlpha = outroOpacity * fadeIn * fadeOut;

          ctx.save();
          ctx.globalAlpha = photoAlpha;
          drawImageCover(ctx, images[dayIndex], kbScale, kbPanX, kbPanY);
          drawPhotoOverlays(ctx, dayStates[dayIndex], 0);
          ctx.restore();

          // Quick graphic transition at start
          const transitionDuration = 0.35;
          if (photoTime < transitionDuration) {
            const hue = getActivityHue(dayStates[dayIndex].activityType);
            drawGraphicTransition(ctx, photoTime / transitionDuration, dayIndex, hue);
          }

          // Quick exit transition
          const exitWindow = 0.3;
          const timeToEnd2 = TIMING.PHOTO_DURATION - photoTime;
          if (timeToEnd2 < exitWindow) {
            const exitP = 1 - (timeToEnd2 / exitWindow);
            ctx.save();
            ctx.globalAlpha = easeInOutCubic(exitP) * 0.9;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.restore();
          }
        }
      }
      // ── Phase: Outro ──
      else {
        const outroTime = time - TIMING.INTRO - dayStates.length * DAY_SLOT;
        drawOutroCard(ctx, Math.min(outroTime / TIMING.OUTRO, 1), dayStates);
      }

      frameIndex++;

      if (frameIndex % 6 === 0) {
        const pct = 16 + Math.floor((frameIndex / totalFrames) * 79);
        const contentTime = Math.max(0, time - TIMING.INTRO);
        const dayIndex = Math.min(Math.floor(contentTime / DAY_SLOT), dayStates.length - 1);
        const timeInSlot = contentTime - dayIndex * DAY_SLOT;
        const inMetric = timeInSlot < TIMING.METRIC_DURATION;

        // Storytelling phase names
        const storyVerbs = ['Reliving', 'Capturing', 'Weaving', 'Recalling', 'Revisiting', 'Unveiling'];
        const photoVerbs = ['Polishing', 'Framing', 'Highlighting', 'Composing', 'Grading', 'Enhancing'];
        const sIdx = Math.floor(genRand(dayIndex * 10 + 1) * storyVerbs.length);
        const pIdx = Math.floor(genRand(dayIndex * 10 + 2) * photoVerbs.length);
        const verb = inMetric ? storyVerbs[sIdx] : photoVerbs[pIdx];
        const activity = dayStates[dayIndex]?.activityType || 'moment';
        
        let phaseName: string;
        if (time < TIMING.INTRO) phaseName = 'Setting the scene...';
        else if (time >= TIMING.INTRO + dayStates.length * DAY_SLOT) phaseName = 'Wrapping up your week...';
        else phaseName = `${verb} Day ${dayIndex + 1} — ${activity}`;

        onProgress?.(Math.min(pct, 94), phaseName);
      }

      setTimeout(renderLoop, 1000 / FPS);
    };

    setTimeout(renderLoop, 150);
  });
}

// ============ HELPER TO CONVERT PHOTO DATA ============

export function photosToDAyStates(photos: Array<{
  imageUrl: string;
  activity: string;
  duration?: string;
  distance?: string;
  pr?: string;
  dayNumber: number;
  isVideo?: boolean;
}>): DayState[] {
  return photos.map((photo) => {
    const distanceActivities = ['Running', 'Cycling', 'Trekking', 'Walking', 'Swimming'];
    const isDistanceActivity = distanceActivities.some(a =>
      photo.activity?.toLowerCase().includes(a.toLowerCase())
    );

    const durationMin = parseDurationToMinutes(photo.duration);
    const calorieRate = getCalorieRate(photo.activity);
    const estCalories = durationMin > 0 ? Math.round(durationMin * calorieRate) : 0;
    const intensity = getIntensityLevel(photo.activity, durationMin);

    return {
      dayLabel: `DAY ${photo.dayNumber}`,
      dayNumber: photo.dayNumber,
      activityType: photo.activity || 'Workout',
      metricA: {
        label: isDistanceActivity ? 'Distance' : 'Duration',
        value: photo.duration || photo.distance || '--',
      },
      metricB: {
        label: photo.pr ? 'Personal Best' : (isDistanceActivity ? 'Duration' : 'Streak'),
        value: photo.pr || (isDistanceActivity ? photo.duration : `${photo.dayNumber}d`) || '--',
      },
      metricC: photo.distance && !isDistanceActivity ? { label: 'Reps', value: photo.distance } : undefined,
      calories: estCalories > 0 ? `${estCalories}` : undefined,
      intensity,
      asset: {
        type: photo.isVideo ? 'video' : 'photo',
        src: photo.imageUrl,
      },
    };
  });
}

function parseDurationToMinutes(duration?: string): number {
  if (!duration) return 0;
  const minMatch = duration.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1]);
  const hrMatch = duration.match(/(\d+)\s*h/i);
  if (hrMatch) return parseInt(hrMatch[1]) * 60;
  const numMatch = duration.match(/^(\d+)$/);
  if (numMatch) return parseInt(numMatch[1]);
  return 0;
}

function getCalorieRate(activity: string): number {
  const rates: Record<string, number> = {
    running: 11, cycling: 9, yoga: 4, boxing: 12,
    swimming: 10, trekking: 7, basketball: 9,
    football: 10, cricket: 5, default: 7,
  };
  const key = activity.toLowerCase();
  for (const [name, rate] of Object.entries(rates)) {
    if (key.includes(name)) return rate;
  }
  return rates.default;
}

function getIntensityLevel(activity: string, durationMin: number): string {
  const highIntensity = ['boxing', 'running', 'basketball', 'football', 'swimming'];
  const isHigh = highIntensity.some(a => activity.toLowerCase().includes(a));
  if (durationMin >= 45 || isHigh) return '🔥';
  if (durationMin >= 20) return '⚡';
  return '✦';
}

export { WIDTH, HEIGHT, FPS };
export const FRAMES = { DAY_HOLD: Math.ceil(TIMING.PHOTO_DURATION * FPS) };
