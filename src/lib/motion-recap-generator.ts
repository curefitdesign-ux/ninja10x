/**
 * Premium Motion Recap Generator v3 — Elegant, Contextual, Cinematic
 *
 * Structure per day:
 *   1. Metric card (2.5s) — Clean minimal layout with activity-specific accent
 *   2. Photo hold (3.5s) — Cinematic Ken Burns with soft overlays
 *   Intro (2s) + Outro (2.5s)
 *
 * Audio: Activity-contextual synthesized score (calm/energetic/rhythmic).
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
  INTRO: 2.0,
  METRIC_DURATION: 2.5,
  PHOTO_DURATION: 3.5,
  CROSSFADE: 0.5,
  OUTRO: 2.5,
  OUTRO_FADE: 0.8,
  KEN_BURNS_SCALE: 0.04,
};

const DAY_SLOT = TIMING.METRIC_DURATION + TIMING.PHOTO_DURATION;

const FONTS = {
  HERO_NUMBER: 'bold 120px -apple-system, "SF Pro Display", system-ui, sans-serif',
  HERO_UNIT: '200 22px -apple-system, "SF Pro Display", system-ui, sans-serif',
  LABEL_SM: '500 13px -apple-system, "SF Pro Text", system-ui, sans-serif',
  LABEL_MD: '500 15px -apple-system, "SF Pro Text", system-ui, sans-serif',
  DAY_PILL: '700 14px -apple-system, "SF Pro Text", system-ui, sans-serif',
  ACTIVITY: '600 18px -apple-system, "SF Pro Display", system-ui, sans-serif',
  STAT_VALUE: 'bold 32px -apple-system, "SF Pro Display", system-ui, sans-serif',
  STAT_LABEL: '400 11px -apple-system, "SF Pro Text", system-ui, sans-serif',
  INTRO_TITLE: 'bold 44px -apple-system, "SF Pro Display", system-ui, sans-serif',
  INTRO_SUB: '300 16px -apple-system, "SF Pro Text", system-ui, sans-serif',
  OUTRO_BIG: 'bold 64px -apple-system, "SF Pro Display", system-ui, sans-serif',
  OUTRO_LABEL: '400 15px -apple-system, "SF Pro Text", system-ui, sans-serif',
  PHOTO_ACTIVITY: 'bold 28px -apple-system, "SF Pro Display", system-ui, sans-serif',
  PHOTO_METRIC: '500 14px -apple-system, "SF Pro Text", system-ui, sans-serif',
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

// ============ CONTEXTUAL AUDIO SYNTHESIS ============

function generateContextualAudio(durationSec: number, mood: MusicMood): AudioBuffer {
  const sampleRate = 44100;
  const buffer = new AudioBuffer({ length: Math.ceil(sampleRate * durationSec), sampleRate, numberOfChannels: 2 });
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const configs: Record<MusicMood, {
    bpm: number; kickVol: number; hihatVol: number; padFreq: number;
    padVol: number; bassFreq: number; shimmerVol: number; subVol: number;
  }> = {
    energetic: { bpm: 115, kickVol: 0.35, hihatVol: 0.08, padFreq: 130, padVol: 0.02, bassFreq: 65, shimmerVol: 0.008, subVol: 0.15 },
    rhythmic:  { bpm: 100, kickVol: 0.28, hihatVol: 0.06, padFreq: 110, padVol: 0.035, bassFreq: 55, shimmerVol: 0.012, subVol: 0.12 },
    calm:      { bpm: 72,  kickVol: 0.10, hihatVol: 0.02, padFreq: 220, padVol: 0.06, bassFreq: 55, shimmerVol: 0.02, subVol: 0.05 },
    ambient:   { bpm: 80,  kickVol: 0.12, hihatVol: 0.03, padFreq: 165, padVol: 0.05, bassFreq: 55, shimmerVol: 0.018, subVol: 0.08 },
  };

  const c = configs[mood];
  const beatInterval = 60 / c.bpm;

  for (let i = 0; i < left.length; i++) {
    const t = i / sampleRate;
    const beatPhase = (t % beatInterval) / beatInterval;

    // Sub-bass kick
    const kickEnv = Math.exp(-beatPhase * 20);
    const kickFreq = c.bassFreq * (1 + 2.5 * Math.exp(-beatPhase * 14));
    const kick = Math.sin(2 * Math.PI * kickFreq * t) * kickEnv * c.kickVol;

    // Sub-bass layer (continuous low hum)
    const sub = Math.sin(2 * Math.PI * c.bassFreq * 0.5 * t) * c.subVol
      * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.1 * t));

    // Hi-hat on off-beats
    const halfBeat = (t % (beatInterval / 2)) / (beatInterval / 2);
    const isOffBeat = Math.floor(t / (beatInterval / 2)) % 2 === 1;
    const hihatEnv = isOffBeat ? Math.exp(-halfBeat * 30) : 0;
    const hihat = (Math.random() * 2 - 1) * hihatEnv * c.hihatVol;

    // Warm pad chord — two detuned oscillators
    const padA = Math.sin(2 * Math.PI * c.padFreq * t);
    const padB = Math.sin(2 * Math.PI * c.padFreq * 1.005 * t); // slight detune for warmth
    const padC = Math.sin(2 * Math.PI * c.padFreq * 1.498 * t); // fifth
    const padEnv = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.12 * t);
    const pad = (padA + padB * 0.7 + padC * 0.3) * c.padVol * padEnv;

    // High shimmer — gentle sparkle
    const shimmer = Math.sin(2 * Math.PI * 880 * t + Math.sin(2 * Math.PI * 0.3 * t) * 4)
      * c.shimmerVol * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.06 * t));

    // Percussion accent every 4 beats (for energetic/rhythmic)
    let perc = 0;
    if (mood === 'energetic' || mood === 'rhythmic') {
      const barPhase = (t % (beatInterval * 4)) / (beatInterval * 4);
      if (barPhase < 0.02) {
        perc = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-barPhase * 200) * 0.08;
      }
    }

    const sample = kick + sub + hihat + pad + shimmer + perc;

    // Smooth fade in/out
    const fadeIn = Math.min(1, t / 1.2);
    const fadeOut = Math.min(1, (durationSec - t) / 1.5);
    const envelope = fadeIn * fadeOut;

    // Slight stereo width
    left[i] = sample * envelope;
    right[i] = (sample * 0.92 + shimmer * 0.08 + pad * 0.05 * Math.sin(t * 0.7)) * envelope;
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
  g.addColorStop(0, `hsla(${hue}, 70%, 50%, 0.5)`);
  g.addColorStop(0.4, `hsla(${hue}, 55%, 40%, 0.12)`);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

// Elegant thin divider line
function drawThinLine(ctx: CanvasRenderingContext2D, y: number, hue: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const lg = ctx.createLinearGradient(WIDTH * 0.2, 0, WIDTH * 0.8, 0);
  lg.addColorStop(0, 'transparent');
  lg.addColorStop(0.3, `hsla(${hue}, 40%, 60%, 0.35)`);
  lg.addColorStop(0.7, `hsla(${hue}, 40%, 60%, 0.35)`);
  lg.addColorStop(1, 'transparent');
  ctx.strokeStyle = lg;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(WIDTH * 0.2, y);
  ctx.lineTo(WIDTH * 0.8, y);
  ctx.stroke();
  ctx.restore();
}

// ============ CINEMATIC TRANSITIONS ============

function drawCrossFade(ctx: CanvasRenderingContext2D, progress: number) {
  // Smooth directional wipe — elegant alternative to glitch
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

  // Central soft glow
  const glowT = easeOutExpo(Math.min(progress * 1.8, 1));
  drawGlow(ctx, WIDTH / 2, HEIGHT * 0.44, 400, 265, 0.18 * glowT);

  // Title — slide up + fade
  const titleT = easeOutBack(Math.min(Math.max(progress - 0.08, 0) * 2.5, 1));
  if (titleT > 0) {
    ctx.globalAlpha = titleT;
    const slideY = lerp(20, 0, titleT);
    ctx.translate(WIDTH / 2, HEIGHT * 0.42 + slideY);

    ctx.font = FONTS.INTRO_TITLE;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'hsla(265, 60%, 55%, 0.35)';
    ctx.shadowBlur = 50;
    ctx.fillText('YOUR WEEK', 0, -26);
    ctx.fillText('IN MOTION', 0, 26);
    ctx.shadowColor = 'transparent';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Thin accent line
  const lineT = easeOutCubic(Math.min(Math.max(progress - 0.25, 0) * 3, 1));
  drawThinLine(ctx, HEIGHT * 0.50, 265, lineT * 0.6);

  // Subtitle
  const subT = easeOutCubic(Math.min(Math.max(progress - 0.3, 0) * 3, 1));
  if (subT > 0) {
    ctx.globalAlpha = subT * 0.45;
    const subY = lerp(HEIGHT * 0.535 + 8, HEIGHT * 0.535, subT);
    ctx.font = FONTS.INTRO_SUB;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '3px';
    ctx.fillText(`${totalDays} DAYS  ·  ${totalDays} ACTIVITIES`, WIDTH / 2, subY);
    ctx.letterSpacing = '0px';
  }

  drawGrain(ctx, 0.025);

  // Exit: smooth fade to black
  if (progress > 0.72) {
    const exitT = (progress - 0.72) / 0.28;
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

  // Warm central glow
  const glowT = easeOutExpo(Math.min(progress * 2, 1));
  drawGlow(ctx, WIDTH / 2, HEIGHT * 0.38, 350, 150, 0.14 * glowT);

  // Big number — scale in
  const numT = easeOutBack(Math.min(Math.max(progress - 0.03, 0) * 2.5, 1));
  if (numT > 0) {
    ctx.globalAlpha = numT;
    ctx.translate(WIDTH / 2, HEIGHT * 0.36);
    ctx.scale(lerp(0.6, 1, numT), lerp(0.6, 1, numT));
    ctx.font = FONTS.OUTRO_BIG;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'hsla(150, 50%, 50%, 0.25)';
    ctx.shadowBlur = 40;
    ctx.fillText(`${dayStates.length} DAYS`, 0, 0);
    ctx.shadowColor = 'transparent';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // "WEEK COMPLETE" label
  const labelT = easeOutCubic(Math.min(Math.max(progress - 0.15, 0) * 3, 1));
  if (labelT > 0) {
    ctx.globalAlpha = labelT * 0.45;
    ctx.font = FONTS.OUTRO_LABEL;
    ctx.fillStyle = 'hsla(150, 40%, 70%, 0.7)';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '5px';
    ctx.fillText('WEEK COMPLETE', WIDTH / 2, HEIGHT * 0.435);
    ctx.letterSpacing = '0px';
  }

  // Thin divider
  const divT = easeOutCubic(Math.min(Math.max(progress - 0.22, 0) * 3, 1));
  drawThinLine(ctx, HEIGHT * 0.465, 150, divT * 0.5);

  // Activity chips row
  const rowT = easeOutCubic(Math.min(Math.max(progress - 0.28, 0) * 2.5, 1));
  if (rowT > 0) {
    const unique = [...new Set(dayStates.map(d => d.activityType))];
    const chipW = 85;
    const chipGap = 10;
    const totalW = unique.length * chipW + (unique.length - 1) * chipGap;
    const startX = (WIDTH - totalW) / 2;

    for (let i = 0; i < unique.length; i++) {
      const delay = i * 0.06;
      const t = easeOutCubic(Math.min(Math.max(progress - 0.28 - delay, 0) * 3.5, 1));
      if (t <= 0) continue;

      const x = startX + i * (chipW + chipGap);
      const y = HEIGHT * 0.50;
      const hue = getActivityHue(unique[i]);

      ctx.globalAlpha = t * 0.75;
      ctx.fillStyle = `hsla(${hue}, 35%, 18%, 0.5)`;
      ctx.beginPath();
      ctx.roundRect(x, y, chipW, 30, 15);
      ctx.fill();

      ctx.strokeStyle = `hsla(${hue}, 45%, 50%, 0.2)`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.roundRect(x, y, chipW, 30, 15);
      ctx.stroke();

      ctx.font = FONTS.STAT_LABEL;
      ctx.fillStyle = `hsla(${hue}, 45%, 75%, 0.85)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const name = unique[i].length > 9 ? unique[i].slice(0, 8) + '.' : unique[i];
      ctx.fillText(name.toUpperCase(), x + chipW / 2, y + 15);
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

// ============ METRIC CARD — CLEAN & PREMIUM ============

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

  // Large ambient glow centered on metric
  const glowP = easeOutExpo(Math.min(progress * 2, 1));
  drawGlow(ctx, WIDTH / 2, HEIGHT * 0.38, 450, hue, 0.22 * glowP);

  // Secondary glow for depth
  drawGlow(ctx, WIDTH * 0.3, HEIGHT * 0.6, 300, (hue + 40) % 360, 0.06 * glowP);

  drawGrain(ctx, 0.03);

  // ── Staggered timings (no more than 2 animating at once) ──
  const dayT   = easeOutCubic(Math.min(progress * 4, 1));
  const heroT  = easeOutExpo(Math.min(Math.max(progress - 0.08, 0) * 2.5, 1));
  const unitT  = easeOutCubic(Math.min(Math.max(progress - 0.18, 0) * 3, 1));
  const actT   = easeOutCubic(Math.min(Math.max(progress - 0.28, 0) * 3, 1));
  const statsT = easeOutCubic(Math.min(Math.max(progress - 0.38, 0) * 2.5, 1));

  const centerY = HEIGHT * 0.38;

  // ── DAY pill — minimal rounded tag ──
  if (dayT > 0) {
    ctx.save();
    ctx.globalAlpha = dayT * globalAlpha * 0.85;
    const pillY = lerp(centerY - 130, centerY - 115, dayT);
    const text = `DAY ${state.dayNumber}`;
    ctx.font = FONTS.DAY_PILL;
    const tw = ctx.measureText(text).width;
    const pw = tw + 32;
    const ph = 28;
    const px = (WIDTH - pw) / 2;

    ctx.fillStyle = `hsla(${hue}, 50%, 50%, 0.15)`;
    ctx.beginPath();
    ctx.roundRect(px, pillY - ph / 2, pw, ph, 14);
    ctx.fill();

    ctx.strokeStyle = `hsla(${hue}, 50%, 55%, 0.25)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.roundRect(px, pillY - ph / 2, pw, ph, 14);
    ctx.stroke();

    ctx.fillStyle = `hsla(${hue}, 55%, 78%, 1)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, WIDTH / 2, pillY);
    ctx.restore();
  }

  // ── Hero metric — big number with count-up ──
  if (heroT > 0) {
    ctx.save();
    ctx.globalAlpha = heroT * globalAlpha;
    const scale = lerp(0.6, 1, heroT);
    const slideY = lerp(30, 0, heroT);

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

    ctx.shadowColor = `hsla(${hue}, 65%, 55%, 0.4)`;
    ctx.shadowBlur = 60;
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
    ctx.globalAlpha = unitT * globalAlpha * 0.55;
    const unitY = lerp(centerY + 60, centerY + 52, unitT);
    ctx.font = FONTS.HERO_UNIT;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '5px';
    ctx.fillText(state.metricA.label.toUpperCase(), WIDTH / 2, unitY);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  // ── Activity name ──
  if (actT > 0) {
    ctx.save();
    ctx.globalAlpha = actT * globalAlpha * 0.3;
    const actY = lerp(centerY + 88, centerY + 80, actT);
    ctx.font = FONTS.ACTIVITY;
    ctx.fillStyle = `hsla(${hue}, 30%, 70%, 0.55)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '3px';
    ctx.fillText(state.activityType.toUpperCase(), WIDTH / 2, actY);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  // ── Thin divider ──
  if (statsT > 0) {
    drawThinLine(ctx, HEIGHT * 0.555, hue, statsT * 0.4);
  }

  // ── Secondary stats — clean horizontal row ──
  if (statsT > 0) {
    const stats: { label: string; value: string }[] = [];
    if (state.metricB.value !== '--') stats.push({ label: state.metricB.label, value: state.metricB.value });
    if (state.calories && state.calories !== '--') stats.push({ label: 'Cal', value: state.calories });
    if (state.intensity) stats.push({ label: 'Effort', value: state.intensity });
    if (state.metricC && state.metricC.value !== '--') stats.push({ label: state.metricC.label, value: state.metricC.value });

    const maxStats = Math.min(stats.length, 3);
    if (maxStats > 0) {
      // Evenly spaced columns
      const sectionW = WIDTH * 0.7;
      const colW = sectionW / maxStats;
      const startX = (WIDTH - sectionW) / 2;

      for (let i = 0; i < maxStats; i++) {
        const delay = i * 0.06;
        const t = easeOutCubic(Math.min(Math.max(progress - 0.38 - delay, 0) * 3, 1));
        if (t <= 0) continue;

        const cx = startX + colW * (i + 0.5);
        const baseY = HEIGHT * 0.59;

        ctx.save();
        ctx.globalAlpha = t * globalAlpha * 0.85;

        // Value
        ctx.font = FONTS.STAT_VALUE;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stats[i].value, cx, baseY);

        // Label below
        ctx.font = FONTS.STAT_LABEL;
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.letterSpacing = '2px';
        ctx.fillText(stats[i].label.toUpperCase(), cx, baseY + 22);
        ctx.letterSpacing = '0px';

        ctx.restore();

        // Vertical separator between stats
        if (i < maxStats - 1) {
          const sepX = startX + colW * (i + 1);
          ctx.save();
          ctx.globalAlpha = t * 0.12;
          ctx.strokeStyle = `hsla(${hue}, 30%, 60%, 0.5)`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(sepX, baseY - 16);
          ctx.lineTo(sepX, baseY + 28);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  // ── Exit crossfade ──
  if (progress > 0.82) {
    const exitT = (progress - 0.82) / 0.18;
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
  // Bottom gradient — elegant cinematic
  const bottomGrad = ctx.createLinearGradient(0, HEIGHT - 320, 0, HEIGHT);
  bottomGrad.addColorStop(0, 'transparent');
  bottomGrad.addColorStop(0.4, 'rgba(0,0,0,0.25)');
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, HEIGHT - 320, WIDTH, 320);

  // Top subtle vignette
  const topGrad = ctx.createLinearGradient(0, 0, 0, 160);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
  topGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, WIDTH, 160);

  if (textOpacity <= 0) return;

  const hue = getActivityHue(state.activityType);

  ctx.save();
  ctx.globalAlpha = textOpacity;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;

  // Day badge — top right, minimal
  ctx.font = FONTS.DAY_PILL;
  ctx.fillStyle = `hsla(${hue}, 50%, 75%, 0.7)`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = '2px';
  ctx.fillText(`DAY ${state.dayNumber}`, WIDTH - 40, 48);
  ctx.letterSpacing = '0px';

  // Activity name — bottom left
  ctx.font = FONTS.PHOTO_ACTIVITY;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(state.activityType.toUpperCase(), 40, HEIGHT - 95);

  // Metrics — one line, clean
  ctx.font = FONTS.PHOTO_METRIC;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  const metricLine = `${state.metricA.label}: ${state.metricA.value}`;
  const secondMetric = state.metricB.value !== '--' ? `  ·  ${state.metricB.label}: ${state.metricB.value}` : '';
  ctx.fillText(metricLine + secondMetric, 40, HEIGHT - 68);

  ctx.restore();
}

// ============ MAIN GENERATOR ============

export async function generateMotionRecap(options: MotionRecapOptions): Promise<string> {
  const { dayStates, onProgress } = options;

  if (dayStates.length < 3) throw new Error('Need at least 3 days for recap');

  console.log('[MotionRecap] Starting v3 with', dayStates.length, 'days');
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

  // Generate contextual audio
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

          // Smooth Ken Burns
          const kbScale = lerp(1.0, 1.0 + TIMING.KEN_BURNS_SCALE, photoProgress);
          const kbPanX = lerp(-3, 3, photoProgress) * (dayIndex % 2 === 0 ? 1 : -1);
          const kbPanY = lerp(-4, 4, photoProgress);

          // Elegant cross-fade in and out
          const fadeIn = easeOutCubic(Math.min(photoTime / TIMING.CROSSFADE, 1));
          const timeToEnd = TIMING.PHOTO_DURATION - photoTime;
          const fadeOut = Math.min(1, timeToEnd / TIMING.CROSSFADE);
          const photoAlpha = outroOpacity * fadeIn * fadeOut;

          ctx.save();
          ctx.globalAlpha = photoAlpha;
          drawImageCover(ctx, images[dayIndex], kbScale, kbPanX, kbPanY);
          drawPhotoOverlays(ctx, dayStates[dayIndex], easeOutCubic(Math.min(photoTime / 0.6, 1)));
          ctx.restore();

          // Subtle cross-fade transition
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
