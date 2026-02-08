/**
 * Premium Motion Recap Generator v4 — Rich Contextual Music, Bold Typography, Cinematic
 *
 * Structure per day:
 *   1. Metric card (2.8s) — Bold layout with large readable stats
 *   2. Photo hold (3.5s) — Cinematic Ken Burns with soft overlays
 *   Intro (2.2s) + Outro (2.8s)
 *
 * Audio: Rich contextual synthesized music with chord progressions,
 * arpeggios, melodies, and layered percussion per activity mood.
 * 100% local, no API calls. 9:16 ratio (720×1280), 24fps.
 */

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
  onProgress?: (percent: number, phase: string) => void;
}

// ============ CONSTANTS ============

const FPS = 24;
const WIDTH = 720;
const HEIGHT = 1280;

const TIMING = {
  INTRO: 2.2,
  METRIC_DURATION: 2.8,
  PHOTO_DURATION: 3.5,
  CROSSFADE: 0.5,
  OUTRO: 2.8,
  OUTRO_FADE: 0.8,
  KEN_BURNS_SCALE: 0.04,
};

const DAY_SLOT = TIMING.METRIC_DURATION + TIMING.PHOTO_DURATION;

// ── BIGGER FONTS — ~40% larger across the board ──
const FONTS = {
  HERO_NUMBER: 'bold 156px -apple-system, "SF Pro Display", system-ui, sans-serif',
  HERO_UNIT: '200 28px -apple-system, "SF Pro Display", system-ui, sans-serif',
  LABEL_SM: '500 16px -apple-system, "SF Pro Text", system-ui, sans-serif',
  LABEL_MD: '500 19px -apple-system, "SF Pro Text", system-ui, sans-serif',
  DAY_PILL: '700 18px -apple-system, "SF Pro Text", system-ui, sans-serif',
  ACTIVITY: '600 22px -apple-system, "SF Pro Display", system-ui, sans-serif',
  STAT_VALUE: 'bold 42px -apple-system, "SF Pro Display", system-ui, sans-serif',
  STAT_LABEL: '400 14px -apple-system, "SF Pro Text", system-ui, sans-serif',
  INTRO_TITLE: 'bold 56px -apple-system, "SF Pro Display", system-ui, sans-serif',
  INTRO_SUB: '300 20px -apple-system, "SF Pro Text", system-ui, sans-serif',
  OUTRO_BIG: 'bold 80px -apple-system, "SF Pro Display", system-ui, sans-serif',
  OUTRO_LABEL: '400 20px -apple-system, "SF Pro Text", system-ui, sans-serif',
  PHOTO_ACTIVITY: 'bold 34px -apple-system, "SF Pro Display", system-ui, sans-serif',
  PHOTO_METRIC: '600 18px -apple-system, "SF Pro Text", system-ui, sans-serif',
  CALORIES: 'bold 36px -apple-system, "SF Pro Display", system-ui, sans-serif',
  CALORIES_LABEL: '400 13px -apple-system, "SF Pro Text", system-ui, sans-serif',
};

// Activity accent colors (HSL hue)
const ACTIVITY_HUES: Record<string, number> = {
  running: 16, cycling: 200, yoga: 280, boxing: 0, swimming: 190,
  trekking: 140, basketball: 30, football: 120, cricket: 45, default: 265,
};

// Music mood per activity
type MusicMood = 'energetic' | 'calm' | 'rhythmic' | 'ambient';
const ACTIVITY_MOOD: Record<string, MusicMood> = {
  running: 'rhythmic', cycling: 'rhythmic', yoga: 'calm', boxing: 'energetic',
  swimming: 'ambient', trekking: 'ambient', basketball: 'energetic',
  football: 'energetic', cricket: 'rhythmic', default: 'rhythmic',
};

function getActivityHue(activity: string): number {
  const key = activity.toLowerCase();
  for (const [name, hue] of Object.entries(ACTIVITY_HUES)) {
    if (key.includes(name)) return hue;
  }
  return ACTIVITY_HUES.default;
}

function getDominantMood(dayStates: DayState[]): MusicMood {
  const counts: Record<MusicMood, number> = { energetic: 0, calm: 0, rhythmic: 0, ambient: 0 };
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

interface TrackConfig {
  bpm: number;
  chords: number[][];
  bass: number[];
  lead: number[];
  dropIntensity: number; // 0-1 how hard the drop hits
}

function getTrackConfig(mood: MusicMood): TrackConfig {
  switch (mood) {
    case 'energetic':
      return {
        bpm: 128, // Classic EDM tempo
        // Am - F - C - G (Avicii/Chainsmokers-style progression)
        chords: [
          [N.A3, N.C4, N.E4, N.A4],
          [N.F3, N.A3, N.C4, N.F4],
          [N.C4, N.E4, N.G4, N.C5],
          [N.G3, N.B3, N.D4, N.G4],
        ],
        bass: [N.A2, N.A2, N.F2, N.F2, N.C3, N.C3, N.G2, N.G2],
        lead: [N.E5, N.E5, N.D5, N.C5, N.C5, N.D5, N.E5, N.G5],
        dropIntensity: 1.0,
      };
    case 'rhythmic':
      return {
        bpm: 120,
        // Em - C - G - D (uplifting workout)
        chords: [
          [N.E3, N.G3, N.B3, N.E4],
          [N.C4, N.E4, N.G4, N.C5],
          [N.G3, N.B3, N.D4, N.G4],
          [N.D4, N.F4, N.A4, N.D5],
        ],
        bass: [N.E2, N.E2, N.C3, N.C3, N.G2, N.G2, N.D3, N.D3],
        lead: [N.B4, N.E5, N.D5, N.B4, N.G5, N.E5, N.D5, N.E5],
        dropIntensity: 0.85,
      };
    case 'calm':
      return {
        bpm: 100,
        chords: [
          [N.C4, N.E4, N.G4, N.B4],
          [N.A3, N.C4, N.E4, N.A4],
          [N.F3, N.A3, N.C4, N.F4],
          [N.G3, N.B3, N.D4, N.G4],
        ],
        bass: [N.C2, N.C2, N.A2, N.A2, N.F2, N.F2, N.G2, N.G2],
        lead: [N.G4, N.E5, N.D5, N.C5, N.E5, N.D5, N.C5, N.B4],
        dropIntensity: 0.4,
      };
    case 'ambient':
      return {
        bpm: 110,
        chords: [
          [N.E3, N.G3, N.B3, N.D4],
          [N.C4, N.E4, N.G4, N.B4],
          [N.A3, N.C4, N.E4, N.A4],
          [N.F3, N.A3, N.C4, N.E4],
        ],
        bass: [N.E2, N.E2, N.C3, N.C3, N.A2, N.A2, N.F2, N.F2],
        lead: [N.E5, N.D5, N.B4, N.G4, N.D5, N.E5, N.G5, N.E5],
        dropIntensity: 0.55,
      };
  }
}

// Deterministic pseudo-random for consistent noise patterns
function seededRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
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
    sum += phase * 2 - 1; // Sawtooth wave
  }
  return sum / voices;
}

function generateContextualAudio(durationSec: number, mood: MusicMood): AudioBuffer {
  const sampleRate = 44100;
  const length = Math.ceil(sampleRate * durationSec);
  const buffer = new AudioBuffer({ length, sampleRate, numberOfChannels: 2 });
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const cfg = getTrackConfig(mood);
  const beatDur = 60 / cfg.bpm;
  const barDur = beatDur * 4;
  const totalBars = Math.ceil(durationSec / barDur);
  const chordCount = cfg.chords.length;
  const di = cfg.dropIntensity;

  // Arrangement: intro → buildup → drop → sustain → breakdown → outro
  const getSection = (bar: number): 'intro' | 'buildup' | 'drop' | 'sustain' | 'breakdown' | 'outro' => {
    const pct = bar / totalBars;
    if (pct < 0.08) return 'intro';
    if (pct < 0.18) return 'buildup';
    if (pct < 0.5) return 'drop';
    if (pct < 0.7) return 'sustain';
    if (pct < 0.82) return 'breakdown';
    return 'outro';
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

    let sample = 0;

    // Section-based intensity multipliers
    const isDropOrSustain = section === 'drop' || section === 'sustain';
    const isBuild = section === 'buildup';
    const isBreakdown = section === 'breakdown';
    const isIntro = section === 'intro';
    const isOutro = section === 'outro';

    const buildProgress = isBuild ? (barPos - totalBars * 0.08) / (totalBars * 0.1) : 0;

    // ── 1. KICK — punchy 808-style ──
    const kickActive = isDropOrSustain || isBuild || isOutro;
    const kickPattern = isDropOrSustain
      ? (beatNum === 0 || beatNum === 2 || (di > 0.7 && beatPhase < 0.1)) // four-on-floor for high energy
      : (beatNum === 0 || beatNum === 2);
    
    if (kickActive && kickPattern) {
      const kickEnv = Math.exp(-beatPhase * 25);
      const kickSweep = 50 * (1 + 5 * Math.exp(-beatPhase * 15)); // pitch sweep down
      const kickBody = Math.sin(2 * Math.PI * kickSweep * t) * kickEnv;
      const kickClick = Math.exp(-beatPhase * 80) * 0.3; // transient click
      sample += (kickBody + kickClick) * 0.38 * di;
    }

    // ── 2. SNARE / CLAP — layered ──
    const snareActive = isDropOrSustain || (isBuild && buildProgress > 0.3);
    if (snareActive && (beatNum === 1 || beatNum === 3)) {
      const snareEnv = Math.exp(-beatPhase * 18);
      const snareBody = Math.sin(2 * Math.PI * 200 * t) * snareEnv * 0.35;
      const snareNoise = seededRand(i) * 2 - 1;
      const snareRattle = snareNoise * Math.exp(-beatPhase * 25) * 0.5;
      // Clap layer — slightly delayed
      const clapDelay = beatPhase - 0.01;
      const clapEnv = clapDelay > 0 ? Math.exp(-clapDelay * 30) : 0;
      const clap = (seededRand(i + 7777) * 2 - 1) * clapEnv * 0.25;
      sample += (snareBody + snareRattle + clap) * 0.22 * di;
    }

    // Build snare roll (fills) — accelerating hits
    if (isBuild && buildProgress > 0.6) {
      const rollSpeed = lerp(4, 16, (buildProgress - 0.6) / 0.4); // accelerates
      const rollPhase = (t * rollSpeed / beatDur) % 1;
      if (rollPhase < 0.3) {
        sample += (seededRand(i + 3333) * 2 - 1) * Math.exp(-rollPhase * 15) * 0.12 * di;
      }
    }

    // ── 3. HI-HATS — 16th note groove ──
    const hatActive = isDropOrSustain || (isBuild && buildProgress > 0.2) || isBreakdown;
    if (hatActive) {
      const sixteenthDur = beatDur / 4;
      const hatPhase = (t % sixteenthDur) / sixteenthDur;
      const sixteenthIdx = Math.floor(posInBar * 16) % 16;
      // Accent pattern: louder on off-beats for groove
      const accent = (sixteenthIdx % 4 === 2) ? 1.3 : (sixteenthIdx % 2 === 0 ? 0.7 : 1.0);
      const hatEnv = Math.exp(-hatPhase * (sixteenthIdx % 4 === 0 ? 15 : 40)); // open hat on beats
      const hat = (seededRand(i + sixteenthIdx * 1000) * 2 - 1) * hatEnv * accent;
      const hatVol = isBreakdown ? 0.03 : 0.055;
      sample += hat * hatVol * di;
    }

    // ── 4. SUPERSAW PAD — thick EDM chords ──
    const padActive = isDropOrSustain || isBreakdown || isOutro;
    if (padActive) {
      let padSum = 0;
      for (const freq of chord) {
        padSum += supersaw(freq, t, isDropOrSustain ? 7 : 5);
      }
      padSum /= chord.length;
      
      // Sidechain compression feel — pump effect
      const pumpPhase = (t % beatDur) / beatDur;
      const sidechain = isDropOrSustain
        ? 0.15 + 0.85 * Math.min(1, pumpPhase * 4) // aggressive pump
        : 0.5 + 0.5 * Math.min(1, pumpPhase * 3);
      
      const padVol = isDropOrSustain ? 0.045 : (isBreakdown ? 0.06 : 0.03);
      sample += softClip(padSum * 1.5) * padVol * sidechain * di;
    }

    // Intro/buildup pad — filtered, slowly opening
    if (isIntro || isBuild) {
      let filteredPad = 0;
      for (const freq of chord) {
        // Simple low-pass effect: fewer harmonics
        filteredPad += Math.sin(2 * Math.PI * freq * t);
        filteredPad += Math.sin(2 * Math.PI * freq * 1.005 * t) * 0.5;
      }
      filteredPad /= chord.length;
      const filterOpen = isBuild ? buildProgress : 0.3;
      sample += filteredPad * 0.04 * filterOpen;
    }

    // ── 5. BASS — sub + mid-bass, sidechained ──
    const bassActive = isDropOrSustain || (isBuild && buildProgress > 0.5) || isOutro;
    if (bassActive) {
      const bassIdx = Math.floor(posInBar * 2) % cfg.bass.length;
      const bassFreq = cfg.bass[bassIdx];
      
      // Sub bass (sine)
      const sub = Math.sin(2 * Math.PI * bassFreq * t);
      // Mid-bass (slightly distorted saw for presence)
      const midBassPhase = (bassFreq * t) % 1;
      const midBass = softClip((midBassPhase * 2 - 1) * 2) * 0.4;
      
      // Sidechain duck on kick
      const bassPump = (beatNum === 0 || beatNum === 2) 
        ? Math.min(1, beatPhase * 5) 
        : 1;
      
      sample += (sub * 0.20 + midBass * 0.08) * bassPump * di;
    }

    // ── 6. LEAD MELODY — plucky synth ──
    const leadActive = isDropOrSustain || isBreakdown;
    if (leadActive) {
      const eighthDur = beatDur / 2;
      const leadBeat = Math.floor(t / eighthDur);
      const leadPhase = (t % eighthDur) / eighthDur;
      const leadIdx = leadBeat % cfg.lead.length;
      // Play on select beats for musicality
      const shouldPlay = (leadBeat % 3 !== 2); // skip every 3rd for breathing
      
      if (shouldPlay) {
        const freq = cfg.lead[leadIdx];
        const pluckEnv = Math.exp(-leadPhase * 8); // sharp pluck
        // Two oscillators for richness
        const osc1 = Math.sin(2 * Math.PI * freq * t);
        const osc2 = Math.sin(2 * Math.PI * freq * 2.01 * t) * 0.3; // octave shimmer
        const osc3 = Math.sin(2 * Math.PI * freq * 3 * t) * 0.1; // brightness
        const leadSig = (osc1 + osc2 + osc3) * pluckEnv;
        const leadVol = isBreakdown ? 0.05 : 0.04;
        sample += leadSig * leadVol * di;
      }
    }

    // ── 7. ARPEGGIOS — 16th note patterns on drop ──
    if (isDropOrSustain) {
      const sixteenthDur = beatDur / 4;
      const arpPhase = (t % sixteenthDur) / sixteenthDur;
      const arpBeat = Math.floor(t / sixteenthDur);
      const arpIdx = arpBeat % chord.length;
      const arpFreq = chord[arpIdx] * 2; // octave up
      const arpEnv = Math.exp(-arpPhase * 12);
      const arpOsc = Math.sin(2 * Math.PI * arpFreq * t) * 0.6 +
                     Math.sin(2 * Math.PI * arpFreq * 1.5 * t) * 0.3;
      // Pan arps slightly for width
      const arpVol = 0.025 * di;
      const arpPan = Math.sin(arpBeat * 0.7) * 0.3;
      left[i] += arpOsc * arpEnv * arpVol * (1 + arpPan);
      right[i] += arpOsc * arpEnv * arpVol * (1 - arpPan);
    }

    // ── 8. RISER / BUILD FX ──
    if (isBuild) {
      // White noise riser — gets louder toward drop
      const riserVol = buildProgress * buildProgress * 0.08 * di;
      sample += (seededRand(i + 5555) * 2 - 1) * riserVol;
      
      // Pitch-rising sine sweep
      const sweepFreq = lerp(200, 2000, buildProgress * buildProgress);
      sample += Math.sin(2 * Math.PI * sweepFreq * t) * buildProgress * 0.02 * di;
    }

    // ── 9. DROP IMPACT ──
    if (section === 'drop' && currentBar === Math.floor(totalBars * 0.18)) {
      const dropTime = posInBar * barDur;
      if (dropTime < 0.3) {
        // Impact: low boom + noise burst
        const impactEnv = Math.exp(-dropTime * 12);
        sample += Math.sin(2 * Math.PI * 40 * t) * impactEnv * 0.3 * di;
        sample += (seededRand(i + 9999) * 2 - 1) * Math.exp(-dropTime * 20) * 0.15 * di;
      }
    }

    // ── 10. HIGH SHIMMER / ATMOSPHERE ──
    const shimmerVol = isBreakdown ? 0.012 : (isDropOrSustain ? 0.005 : 0.008);
    const shimmer = Math.sin(2 * Math.PI * 2200 * t + Math.sin(2 * Math.PI * 0.2 * t) * 6)
      * shimmerVol * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.06 * t));
    sample += shimmer;

    // ── MASTER PROCESSING ──
    // Soft clip for warmth/loudness
    sample = softClip(sample * 1.8) * 0.55;

    // Master envelope
    const fadeIn = Math.min(1, t / 0.8);
    const fadeOut = Math.min(1, (durationSec - t) / 1.5);
    const masterEnv = fadeIn * fadeOut;

    // Stereo widening
    const stereoW = Math.sin(t * 1.3) * 0.08;
    left[i] += sample * masterEnv * (1 + stereoW);
    right[i] += sample * masterEnv * (1 - stereoW);
    
    // Add stereo shimmer
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
  for (const state of dayStates) results.push(await loadImage(state.asset.src));
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

// ============ CINEMATIC TRANSITIONS ============

function drawCrossFade(ctx: CanvasRenderingContext2D, progress: number) {
  if (progress <= 0 || progress >= 1) return;
  const t = Math.sin(progress * Math.PI);
  ctx.save();
  ctx.globalAlpha = t * 0.25;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();
}

// ============ INTRO CARD ============

function drawIntroCard(ctx: CanvasRenderingContext2D, progress: number, totalDays: number) {
  ctx.save();
  drawDarkBg(ctx, 265);

  // Central glow — larger and brighter
  const glowT = easeOutExpo(Math.min(progress * 1.8, 1));
  drawGlow(ctx, WIDTH / 2, HEIGHT * 0.42, 480, 265, 0.24 * glowT);
  drawGlow(ctx, WIDTH / 2, HEIGHT * 0.42, 250, 290, 0.1 * glowT);

  // Title — big, bold slide up
  const titleT = easeOutBack(Math.min(Math.max(progress - 0.06, 0) * 2.2, 1));
  if (titleT > 0) {
    ctx.globalAlpha = titleT;
    const slideY = lerp(30, 0, titleT);
    ctx.translate(WIDTH / 2, HEIGHT * 0.40 + slideY);

    ctx.font = FONTS.INTRO_TITLE;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'hsla(265, 60%, 55%, 0.4)';
    ctx.shadowBlur = 60;
    ctx.fillText('YOUR WEEK', 0, -34);
    ctx.fillText('IN MOTION', 0, 34);
    ctx.shadowColor = 'transparent';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Accent line
  const lineT = easeOutCubic(Math.min(Math.max(progress - 0.22, 0) * 3, 1));
  drawThinLine(ctx, HEIGHT * 0.50, 265, lineT * 0.6);

  // Subtitle — larger
  const subT = easeOutCubic(Math.min(Math.max(progress - 0.28, 0) * 3, 1));
  if (subT > 0) {
    ctx.globalAlpha = subT * 0.5;
    const subY = lerp(HEIGHT * 0.54 + 10, HEIGHT * 0.54, subT);
    ctx.font = FONTS.INTRO_SUB;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '4px';
    ctx.fillText(`${totalDays} DAYS  ·  ${totalDays} ACTIVITIES`, WIDTH / 2, subY);
    ctx.letterSpacing = '0px';
  }

  drawGrain(ctx, 0.025);

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
    ctx.fillText(`${dayStates.length} DAYS`, 0, 0);
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
    ctx.fillText('WEEK COMPLETE', WIDTH / 2, HEIGHT * 0.42);
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

// ============ METRIC CARD — BOLD & PREMIUM ============

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

  // Larger, brighter glow
  const glowP = easeOutExpo(Math.min(progress * 2, 1));
  drawGlow(ctx, WIDTH / 2, HEIGHT * 0.36, 500, hue, 0.28 * glowP);
  drawGlow(ctx, WIDTH * 0.35, HEIGHT * 0.55, 280, (hue + 40) % 360, 0.08 * glowP);

  drawGrain(ctx, 0.025);

  // ── Staggered timings ──
  const dayT   = easeOutCubic(Math.min(progress * 4, 1));
  const heroT  = easeOutExpo(Math.min(Math.max(progress - 0.06, 0) * 2.2, 1));
  const unitT  = easeOutCubic(Math.min(Math.max(progress - 0.15, 0) * 3, 1));
  const actT   = easeOutCubic(Math.min(Math.max(progress - 0.24, 0) * 3, 1));
  const statsT = easeOutCubic(Math.min(Math.max(progress - 0.34, 0) * 2.5, 1));
  const calT   = easeOutCubic(Math.min(Math.max(progress - 0.44, 0) * 3, 1));

  const centerY = HEIGHT * 0.36;

  // ── DAY pill ──
  if (dayT > 0) {
    ctx.save();
    ctx.globalAlpha = dayT * globalAlpha * 0.9;
    const pillY = lerp(centerY - 145, centerY - 128, dayT);
    const text = `DAY ${state.dayNumber}`;
    ctx.font = FONTS.DAY_PILL;
    const tw = ctx.measureText(text).width;
    const pw = tw + 38;
    const ph = 34;
    const px = (WIDTH - pw) / 2;

    ctx.fillStyle = `hsla(${hue}, 50%, 50%, 0.18)`;
    ctx.beginPath();
    ctx.roundRect(px, pillY - ph / 2, pw, ph, 17);
    ctx.fill();

    ctx.strokeStyle = `hsla(${hue}, 50%, 55%, 0.3)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.roundRect(px, pillY - ph / 2, pw, ph, 17);
    ctx.stroke();

    ctx.fillStyle = `hsla(${hue}, 55%, 80%, 1)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, WIDTH / 2, pillY);
    ctx.restore();
  }

  // ── Hero metric — BIG number ──
  if (heroT > 0) {
    ctx.save();
    ctx.globalAlpha = heroT * globalAlpha;
    const scale = lerp(0.5, 1, heroT);
    const slideY = lerp(40, 0, heroT);

    ctx.translate(WIDTH / 2, centerY + slideY);
    ctx.scale(scale, scale);

    // Count-up animation
    const raw = state.metricA.value;
    const numMatch = raw.match(/^(\d+)/);
    let display = raw;
    if (numMatch && heroT < 0.9) {
      const target = parseInt(numMatch[1]);
      const current = Math.round(target * Math.min(heroT / 0.85, 1));
      display = raw.replace(/^\d+/, String(current));
    }

    ctx.shadowColor = `hsla(${hue}, 65%, 55%, 0.45)`;
    ctx.shadowBlur = 70;
    ctx.font = FONTS.HERO_NUMBER;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(display, 0, 0);
    ctx.shadowColor = 'transparent';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.restore();
  }

  // ── Metric unit label ──
  if (unitT > 0) {
    ctx.save();
    ctx.globalAlpha = unitT * globalAlpha * 0.6;
    const unitY = lerp(centerY + 72, centerY + 62, unitT);
    ctx.font = FONTS.HERO_UNIT;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '6px';
    ctx.fillText(state.metricA.label.toUpperCase(), WIDTH / 2, unitY);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  // ── Activity name ──
  if (actT > 0) {
    ctx.save();
    ctx.globalAlpha = actT * globalAlpha * 0.35;
    const actY = lerp(centerY + 105, centerY + 95, actT);
    ctx.font = FONTS.ACTIVITY;
    ctx.fillStyle = `hsla(${hue}, 30%, 72%, 0.6)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '4px';
    ctx.fillText(state.activityType.toUpperCase(), WIDTH / 2, actY);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  // ── Divider ──
  if (statsT > 0) {
    drawThinLine(ctx, HEIGHT * 0.56, hue, statsT * 0.4);
  }

  // ── Secondary stats row — bigger values ──
  if (statsT > 0) {
    const stats: { label: string; value: string }[] = [];
    if (state.metricB.value !== '--') stats.push({ label: state.metricB.label, value: state.metricB.value });
    if (state.metricC && state.metricC.value !== '--') stats.push({ label: state.metricC.label, value: state.metricC.value });
    if (state.intensity) stats.push({ label: 'Effort', value: state.intensity });

    const maxStats = Math.min(stats.length, 3);
    if (maxStats > 0) {
      const sectionW = WIDTH * 0.75;
      const colW = sectionW / maxStats;
      const startX = (WIDTH - sectionW) / 2;

      for (let i = 0; i < maxStats; i++) {
        const delay = i * 0.05;
        const t = easeOutCubic(Math.min(Math.max(progress - 0.34 - delay, 0) * 3, 1));
        if (t <= 0) continue;

        const cx = startX + colW * (i + 0.5);
        const baseY = HEIGHT * 0.60;

        ctx.save();
        ctx.globalAlpha = t * globalAlpha * 0.9;

        ctx.font = FONTS.STAT_VALUE;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stats[i].value, cx, baseY);

        ctx.font = FONTS.STAT_LABEL;
        ctx.fillStyle = 'rgba(255,255,255,0.38)';
        ctx.letterSpacing = '2px';
        ctx.fillText(stats[i].label.toUpperCase(), cx, baseY + 28);
        ctx.letterSpacing = '0px';

        ctx.restore();

        // Vertical separator
        if (i < maxStats - 1) {
          const sepX = startX + colW * (i + 1);
          ctx.save();
          ctx.globalAlpha = t * 0.14;
          ctx.strokeStyle = `hsla(${hue}, 30%, 60%, 0.5)`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(sepX, baseY - 20);
          ctx.lineTo(sepX, baseY + 35);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  // ── Calories badge (bottom) ──
  if (calT > 0 && state.calories && parseInt(state.calories) > 0) {
    ctx.save();
    ctx.globalAlpha = calT * globalAlpha * 0.7;
    const calY = HEIGHT * 0.70;
    
    // Glass pill background
    const pillW = 160;
    const pillH = 50;
    ctx.fillStyle = `hsla(${hue}, 30%, 20%, 0.35)`;
    ctx.beginPath();
    ctx.roundRect((WIDTH - pillW) / 2, calY - pillH / 2, pillW, pillH, 25);
    ctx.fill();
    ctx.strokeStyle = `hsla(${hue}, 40%, 50%, 0.15)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.roundRect((WIDTH - pillW) / 2, calY - pillH / 2, pillW, pillH, 25);
    ctx.stroke();

    ctx.font = FONTS.CALORIES;
    ctx.fillStyle = `hsla(${(hue + 15) % 360}, 60%, 70%, 0.9)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.calories}`, WIDTH / 2 - 10, calY - 1);
    
    ctx.font = FONTS.CALORIES_LABEL;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.letterSpacing = '2px';
    ctx.fillText('CAL', WIDTH / 2 + 45, calY);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  // ── Exit crossfade ──
  if (progress > 0.80) {
    const exitT = (progress - 0.80) / 0.20;
    ctx.fillStyle = `rgba(0,0,0,${easeInOutCubic(exitT) * 0.85})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
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

function drawPhotoOverlays(ctx: CanvasRenderingContext2D, state: DayState, textOpacity: number) {
  // Bottom gradient
  const bottomGrad = ctx.createLinearGradient(0, HEIGHT - 350, 0, HEIGHT);
  bottomGrad.addColorStop(0, 'transparent');
  bottomGrad.addColorStop(0.35, 'rgba(0,0,0,0.3)');
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, HEIGHT - 350, WIDTH, 350);

  // Top vignette
  const topGrad = ctx.createLinearGradient(0, 0, 0, 180);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.35)');
  topGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, WIDTH, 180);

  if (textOpacity <= 0) return;

  const hue = getActivityHue(state.activityType);

  ctx.save();
  ctx.globalAlpha = textOpacity;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 12;

  // Day badge — top right
  ctx.font = FONTS.DAY_PILL;
  ctx.fillStyle = `hsla(${hue}, 50%, 78%, 0.75)`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = '3px';
  ctx.fillText(`DAY ${state.dayNumber}`, WIDTH - 40, 52);
  ctx.letterSpacing = '0px';

  // Activity name — bottom left, bigger
  ctx.font = FONTS.PHOTO_ACTIVITY;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(state.activityType.toUpperCase(), 40, HEIGHT - 100);

  // Metrics line — bigger
  ctx.font = FONTS.PHOTO_METRIC;
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  const metricLine = `${state.metricA.label}: ${state.metricA.value}`;
  const secondMetric = state.metricB.value !== '--' ? `  ·  ${state.metricB.label}: ${state.metricB.value}` : '';
  const calPart = state.calories && parseInt(state.calories) > 0 ? `  ·  ${state.calories} cal` : '';
  ctx.fillText(metricLine + secondMetric + calPart, 40, HEIGHT - 68);

  ctx.restore();
}

// ============ MAIN GENERATOR ============

export async function generateMotionRecap(options: MotionRecapOptions): Promise<string> {
  const { dayStates, onProgress } = options;

  if (dayStates.length < 3) throw new Error('Need at least 3 days for recap');

  console.log('[MotionRecap] Starting v4 with', dayStates.length, 'days');
  onProgress?.(3, 'Loading photos...');

  const images = await loadImages(dayStates);
  console.log('[MotionRecap] All photos loaded');
  onProgress?.(12, 'Composing score...');

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

  // Generate contextual audio with rich chord progressions
  const mood = getDominantMood(dayStates);
  console.log('[MotionRecap] Music mood:', mood);
  const audioBuffer = generateContextualAudio(totalDuration, mood);
  const wavData = audioBufferToWav(audioBuffer);
  console.log('[MotionRecap] Audio generated:', (wavData.byteLength / 1024).toFixed(0), 'KB');
  onProgress?.(16, 'Preparing video...');

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
      onProgress?.(100, 'Complete!');
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

    let frameIndex = 0;

    const renderLoop = () => {
      if (resolved || frameIndex >= totalFrames) {
        onProgress?.(95, 'Finalizing...');
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
        drawIntroCard(ctx, time / TIMING.INTRO, dayStates.length);
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

          // Ken Burns
          const kbScale = lerp(1.0, 1.0 + TIMING.KEN_BURNS_SCALE, photoProgress);
          const kbPanX = lerp(-3, 3, photoProgress) * (dayIndex % 2 === 0 ? 1 : -1);
          const kbPanY = lerp(-4, 4, photoProgress);

          // Cross-fade in and out
          const fadeIn = easeOutCubic(Math.min(photoTime / TIMING.CROSSFADE, 1));
          const timeToEnd = TIMING.PHOTO_DURATION - photoTime;
          const fadeOut = Math.min(1, timeToEnd / TIMING.CROSSFADE);
          const photoAlpha = outroOpacity * fadeIn * fadeOut;

          ctx.save();
          ctx.globalAlpha = photoAlpha;
          drawImageCover(ctx, images[dayIndex], kbScale, kbPanX, kbPanY);
          drawPhotoOverlays(ctx, dayStates[dayIndex], easeOutCubic(Math.min(photoTime / 0.6, 1)));
          ctx.restore();

          if (photoTime < 0.2) {
            drawCrossFade(ctx, photoTime / 0.2);
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

        let phaseName: string;
        if (time < TIMING.INTRO) phaseName = 'Intro';
        else if (time >= TIMING.INTRO + dayStates.length * DAY_SLOT) phaseName = 'Summary';
        else phaseName = `Day ${dayIndex + 1} — ${inMetric ? 'Metric' : 'Photo'}`;

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
