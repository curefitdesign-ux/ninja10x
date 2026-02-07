/**
 * Premium Motion Recap Generator v2 — Futuristic, Bold, Sound-Enabled
 * 
 * For each day:
 *   1. Metric Transition (2.2s) — Activity-specific unique visual representation
 *   2. Original Photo/Video (3.2s) — Ken Burns with cinematic overlays
 *   3. Intro title card (1.5s) + Outro summary card (2s)
 * 
 * Features: Synthetic audio beat, particle effects, glitch transitions,
 * unique metric visualizations per activity type, multiple data points.
 * 
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
  INTRO_TITLE: 1.5,
  METRIC_DURATION: 2.2,
  PHOTO_DURATION: 3.2,
  CROSSFADE: 0.35,
  INTRO_FADE: 0.4,
  OUTRO_CARD: 2.0,
  OUTRO_FADE: 0.6,
  KEN_BURNS_SCALE: 0.045,
};

const DAY_SLOT = TIMING.METRIC_DURATION + TIMING.PHOTO_DURATION;

const FONTS = {
  INTRO_TITLE: 'bold 42px -apple-system, "SF Pro Display", system-ui, sans-serif',
  INTRO_SUB: '300 18px -apple-system, "SF Pro Text", system-ui, sans-serif',
  DAY_TAG: '700 16px -apple-system, "SF Pro Text", system-ui, sans-serif',
  ACTIVITY: 'bold 22px -apple-system, "SF Pro Display", system-ui, sans-serif',
  METRIC_LABEL: '500 15px -apple-system, "SF Pro Text", system-ui, sans-serif',
  METRIC_VALUE: 'bold 110px -apple-system, "SF Pro Display", system-ui, sans-serif',
  METRIC_UNIT: '300 20px -apple-system, "SF Pro Display", system-ui, sans-serif',
  STAT_VALUE: 'bold 36px -apple-system, "SF Pro Display", system-ui, sans-serif',
  STAT_LABEL: '400 13px -apple-system, "SF Pro Text", system-ui, sans-serif',
  OUTRO_BIG: 'bold 56px -apple-system, "SF Pro Display", system-ui, sans-serif',
  OUTRO_LABEL: '400 16px -apple-system, "SF Pro Text", system-ui, sans-serif',
};

// Activity accent colors (hue values for HSL)
const ACTIVITY_HUES: Record<string, number> = {
  running: 16,
  cycling: 200,
  yoga: 280,
  boxing: 0,
  swimming: 190,
  trekking: 140,
  basketball: 30,
  football: 120,
  cricket: 45,
  default: 265,
};

// Activity-specific visual mode
type VisualMode = 'ring' | 'bars' | 'pulse' | 'wave' | 'grid';

const ACTIVITY_VISUALS: Record<string, VisualMode> = {
  running: 'ring',
  cycling: 'bars',
  yoga: 'wave',
  boxing: 'pulse',
  swimming: 'wave',
  trekking: 'grid',
  basketball: 'pulse',
  football: 'bars',
  cricket: 'grid',
  default: 'ring',
};

function getActivityHue(activity: string): number {
  const key = activity.toLowerCase();
  for (const [name, hue] of Object.entries(ACTIVITY_HUES)) {
    if (key.includes(name)) return hue;
  }
  return ACTIVITY_HUES.default;
}

function getVisualMode(activity: string): VisualMode {
  const key = activity.toLowerCase();
  for (const [name, mode] of Object.entries(ACTIVITY_VISUALS)) {
    if (key.includes(name)) return mode;
  }
  return ACTIVITY_VISUALS.default;
}

// ============ EASING ============

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeOutBack(t: number): number {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

// ============ AUDIO GENERATION ============

function generateAudioTrack(durationSec: number): AudioBuffer {
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);

  // We'll create a buffer manually with a deep bass pulse + rhythmic hi-hat
  const buffer = ctx.createBuffer(2, sampleRate * durationSec, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const bpm = 95;
  const beatInterval = 60 / bpm;
  const totalSamples = left.length;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const beatPhase = (t % beatInterval) / beatInterval;

    // Deep sub-bass kick on each beat
    const kickEnv = Math.exp(-beatPhase * 18);
    const kickFreq = 55 * (1 + 2 * Math.exp(-beatPhase * 12));
    const kick = Math.sin(2 * Math.PI * kickFreq * t) * kickEnv * 0.35;

    // Hi-hat on off-beats
    const halfBeat = (t % (beatInterval / 2)) / (beatInterval / 2);
    const isOffBeat = Math.floor(t / (beatInterval / 2)) % 2 === 1;
    const hihatEnv = isOffBeat ? Math.exp(-halfBeat * 25) : 0;
    const hihat = (Math.random() * 2 - 1) * hihatEnv * 0.06;

    // Ambient pad — slow evolving sine
    const pad = Math.sin(2 * Math.PI * 110 * t) * 0.03 *
      (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.15 * t));

    // Subtle shimmer
    const shimmer = Math.sin(2 * Math.PI * 880 * t + Math.sin(2 * Math.PI * 0.5 * t) * 3)
      * 0.012 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.08 * t));

    const sample = kick + hihat + pad + shimmer;
    
    // Fade in/out
    const fadeIn = Math.min(1, t / 0.8);
    const fadeOut = Math.min(1, (durationSec - t) / 1.2);
    const envelope = fadeIn * fadeOut;

    left[i] = sample * envelope;
    right[i] = sample * envelope * 0.95 + shimmer * 0.05;
  }

  return buffer;
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;
  const blockAlign = numChannels * bitsPerSample / 8;
  const byteRate = sampleRate * blockAlign;
  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Interleave channels
  const channels = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

// ============ IMAGE LOADING ============

async function loadImage(src: string, timeoutMs = 8000): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    const timeout = setTimeout(() => {
      console.warn('[MotionRecap] Image load timeout:', src?.slice(0, 60));
      resolve(createBlackPlaceholder());
    }, timeoutMs);
    el.onload = () => { clearTimeout(timeout); resolve(el); };
    el.onerror = () => { clearTimeout(timeout); resolve(createBlackPlaceholder()); };
    el.src = src;
  });
}

function createBlackPlaceholder(): HTMLImageElement {
  const c = document.createElement('canvas');
  c.width = WIDTH; c.height = HEIGHT;
  const cx = c.getContext('2d')!;
  cx.fillStyle = '#0a0a0f';
  cx.fillRect(0, 0, WIDTH, HEIGHT);
  const img = new Image();
  img.src = c.toDataURL('image/jpeg');
  return img;
}

async function loadImages(dayStates: DayState[]): Promise<HTMLImageElement[]> {
  const results: HTMLImageElement[] = [];
  for (const state of dayStates) {
    results.push(await loadImage(state.asset.src));
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
    imageData.data[i] = v;
    imageData.data[i + 1] = v;
    imageData.data[i + 2] = v;
    imageData.data[i + 3] = 14;
  }
  gCtx.putImageData(imageData, 0, 0);
  return grainCanvas;
}

// ============ PARTICLES ============

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
  life: number;
}

function createParticles(hue: number, count: number = 20): Particle[] {
  return Array.from({ length: count }, () => ({
    x: WIDTH / 2 + (Math.random() - 0.5) * 300,
    y: HEIGHT * 0.42 + (Math.random() - 0.5) * 200,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -Math.random() * 2 - 0.5,
    size: Math.random() * 3 + 1,
    alpha: Math.random() * 0.5 + 0.2,
    hue: hue + (Math.random() - 0.5) * 30,
    life: Math.random(),
  }));
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], progress: number) {
  const spawnT = easeOutCubic(Math.min(progress * 3, 1));
  if (spawnT <= 0) return;

  ctx.save();
  for (const p of particles) {
    const age = (progress * 2 + p.life) % 1;
    const fadeIn = Math.min(age * 5, 1);
    const fadeOut = Math.max(0, 1 - (age - 0.7) / 0.3);
    const a = p.alpha * spawnT * fadeIn * fadeOut;
    if (a <= 0) continue;

    const x = p.x + p.vx * progress * 60;
    const y = p.y + p.vy * progress * 60;

    ctx.globalAlpha = a;
    ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, 1)`;
    ctx.beginPath();
    ctx.arc(x, y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ============ UNIQUE VISUAL ELEMENTS ============

function drawRingVisual(ctx: CanvasRenderingContext2D, hue: number, progress: number, centerY: number) {
  // Circular progress ring — great for Running, default
  const ringT = easeOutExpo(Math.min(progress * 2.5, 1));
  const arcAngle = Math.PI * 2 * ringT * 0.75;
  const radius = 160;

  ctx.save();
  ctx.globalAlpha = 0.12 * ringT;
  ctx.strokeStyle = `hsla(${hue}, 50%, 40%, 0.3)`;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(WIDTH / 2, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.5 * ringT;
  ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.9)`;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(WIDTH / 2, centerY, radius, -Math.PI / 2, -Math.PI / 2 + arcAngle);
  ctx.stroke();

  // Glow dot at end
  if (arcAngle > 0.1) {
    const dotX = WIDTH / 2 + Math.cos(-Math.PI / 2 + arcAngle) * radius;
    const dotY = centerY + Math.sin(-Math.PI / 2 + arcAngle) * radius;
    ctx.globalAlpha = 0.8 * ringT;
    const dotGlow = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 18);
    dotGlow.addColorStop(0, `hsla(${hue}, 80%, 70%, 0.8)`);
    dotGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = dotGlow;
    ctx.fillRect(dotX - 18, dotY - 18, 36, 36);
    ctx.fillStyle = `hsla(${hue}, 80%, 80%, 1)`;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBarsVisual(ctx: CanvasRenderingContext2D, hue: number, progress: number, centerY: number) {
  // Vertical equalizer bars — great for Cycling/Football
  const barCount = 7;
  const barW = 16;
  const gap = 12;
  const totalW = barCount * barW + (barCount - 1) * gap;
  const startX = (WIDTH - totalW) / 2;
  const maxH = 120;
  const baseY = centerY + 170;

  ctx.save();
  for (let i = 0; i < barCount; i++) {
    const delay = i * 0.06;
    const t = easeOutBack(Math.min(Math.max(progress - delay, 0) * 3, 1));
    const h = maxH * t * (0.4 + 0.6 * Math.sin((i * 1.8 + progress * 8) * 0.5) * 0.5 + 0.5);
    const x = startX + i * (barW + gap);

    const barGrad = ctx.createLinearGradient(x, baseY, x, baseY - h);
    barGrad.addColorStop(0, `hsla(${hue}, 60%, 50%, 0.15)`);
    barGrad.addColorStop(1, `hsla(${hue}, 70%, 65%, 0.5)`);
    ctx.fillStyle = barGrad;
    ctx.globalAlpha = 0.7 * t;
    ctx.beginPath();
    ctx.roundRect(x, baseY - h, barW, h, 4);
    ctx.fill();
  }
  ctx.restore();
}

function drawPulseVisual(ctx: CanvasRenderingContext2D, hue: number, progress: number, centerY: number) {
  // Expanding pulse rings — great for Boxing/Basketball
  const pulseCount = 3;
  ctx.save();
  for (let i = 0; i < pulseCount; i++) {
    const offset = i * 0.25;
    const t = ((progress * 2 + offset) % 1);
    const r = 40 + t * 180;
    const a = (1 - t) * 0.25;
    ctx.globalAlpha = a;
    ctx.strokeStyle = `hsla(${hue}, 65%, 60%, 0.8)`;
    ctx.lineWidth = 2.5 - t * 1.5;
    ctx.beginPath();
    ctx.arc(WIDTH / 2, centerY, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWaveVisual(ctx: CanvasRenderingContext2D, hue: number, progress: number, centerY: number) {
  // Flowing sine wave — great for Yoga/Swimming
  const waveT = easeOutCubic(Math.min(progress * 2, 1));
  const waveY = centerY + 165;

  ctx.save();
  ctx.globalAlpha = 0.2 * waveT;
  ctx.strokeStyle = `hsla(${hue}, 60%, 65%, 0.7)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 60; x < WIDTH - 60; x += 2) {
    const nx = (x - 60) / (WIDTH - 120);
    const y = waveY + Math.sin(nx * Math.PI * 4 + progress * 12) * 20 * waveT
      + Math.sin(nx * Math.PI * 2 + progress * 6) * 10 * waveT;
    if (x === 60) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Second wave, offset
  ctx.globalAlpha = 0.1 * waveT;
  ctx.beginPath();
  for (let x = 60; x < WIDTH - 60; x += 2) {
    const nx = (x - 60) / (WIDTH - 120);
    const y = waveY + 15 + Math.sin(nx * Math.PI * 3 + progress * 8 + 1) * 15 * waveT;
    if (x === 60) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawGridVisual(ctx: CanvasRenderingContext2D, hue: number, progress: number, centerY: number) {
  // Dot matrix grid — great for Trekking/Cricket
  const gridT = easeOutCubic(Math.min(progress * 2.5, 1));
  const cols = 8;
  const rows = 4;
  const spacing = 24;
  const startX = (WIDTH - (cols - 1) * spacing) / 2;
  const startY = centerY + 150;

  ctx.save();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const delay = (r * cols + c) * 0.015;
      const t = easeOutExpo(Math.min(Math.max(progress - delay, 0) * 4, 1));
      const x = startX + c * spacing;
      const y = startY + r * spacing;
      const active = Math.random() > 0.3;
      ctx.globalAlpha = (active ? 0.5 : 0.1) * gridT * t;
      ctx.fillStyle = `hsla(${hue}, 60%, ${active ? 65 : 40}%, 1)`;
      ctx.beginPath();
      ctx.arc(x, y, active ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawActivityVisual(ctx: CanvasRenderingContext2D, mode: VisualMode, hue: number, progress: number, centerY: number) {
  switch (mode) {
    case 'ring': drawRingVisual(ctx, hue, progress, centerY); break;
    case 'bars': drawBarsVisual(ctx, hue, progress, centerY); break;
    case 'pulse': drawPulseVisual(ctx, hue, progress, centerY); break;
    case 'wave': drawWaveVisual(ctx, hue, progress, centerY); break;
    case 'grid': drawGridVisual(ctx, hue, progress, centerY); break;
  }
}

// ============ GLITCH TRANSITION ============

function drawGlitchTransition(ctx: CanvasRenderingContext2D, progress: number) {
  // Brief digital glitch between phases
  if (progress <= 0 || progress >= 1) return;
  const intensity = Math.sin(progress * Math.PI) * 0.6;

  ctx.save();
  ctx.globalAlpha = intensity * 0.15;

  // Horizontal slice displacement
  const sliceCount = 6;
  for (let i = 0; i < sliceCount; i++) {
    const y = Math.random() * HEIGHT;
    const h = 2 + Math.random() * 8;
    const shift = (Math.random() - 0.5) * 30 * intensity;
    ctx.fillStyle = `hsla(${Math.random() * 360}, 80%, 60%, 0.3)`;
    ctx.fillRect(shift, y, WIDTH, h);
  }

  // Scan line
  const scanY = (progress * HEIGHT * 2) % HEIGHT;
  ctx.globalAlpha = intensity * 0.4;
  const scanGrad = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2);
  scanGrad.addColorStop(0, 'transparent');
  scanGrad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
  scanGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = scanGrad;
  ctx.fillRect(0, scanY - 2, WIDTH, 4);

  ctx.restore();
}

// ============ INTRO TITLE CARD ============

function drawIntroCard(ctx: CanvasRenderingContext2D, progress: number, totalDays: number) {
  ctx.save();

  // Dark background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bgGrad.addColorStop(0, '#050508');
  bgGrad.addColorStop(0.5, '#0a0a12');
  bgGrad.addColorStop(1, '#050508');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Central glow
  const glowT = easeOutExpo(Math.min(progress * 2, 1));
  ctx.globalAlpha = 0.2 * glowT;
  const glow = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.45, 0, WIDTH / 2, HEIGHT * 0.45, 350);
  glow.addColorStop(0, 'hsla(265, 70%, 55%, 0.5)');
  glow.addColorStop(0.5, 'hsla(265, 50%, 40%, 0.15)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Title
  const titleT = easeOutBack(Math.min(Math.max(progress - 0.1, 0) * 3, 1));
  if (titleT > 0) {
    ctx.globalAlpha = titleT;
    const scale = lerp(0.7, 1, titleT);
    ctx.translate(WIDTH / 2, HEIGHT * 0.43);
    ctx.scale(scale, scale);
    ctx.font = FONTS.INTRO_TITLE;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'hsla(265, 70%, 60%, 0.4)';
    ctx.shadowBlur = 40;
    ctx.fillText('YOUR WEEK', 0, -24);
    ctx.fillText('IN MOTION', 0, 24);
    ctx.shadowColor = 'transparent';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Subtitle
  const subT = easeOutCubic(Math.min(Math.max(progress - 0.35, 0) * 3, 1));
  if (subT > 0) {
    ctx.globalAlpha = subT * 0.5;
    const subY = lerp(HEIGHT * 0.55 + 10, HEIGHT * 0.55, subT);
    ctx.font = FONTS.INTRO_SUB;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${totalDays} days · ${totalDays} activities`, WIDTH / 2, subY);
  }

  // Grain
  ctx.globalAlpha = 0.03;
  const grain = getGrainTexture();
  for (let y = 0; y < HEIGHT; y += 256) {
    for (let x = 0; x < WIDTH; x += 256) {
      ctx.drawImage(grain, x, y);
    }
  }

  // Exit fade
  if (progress > 0.7) {
    const exitT = (progress - 0.7) / 0.3;
    ctx.globalAlpha = easeInOutCubic(exitT);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  ctx.restore();
}

// ============ OUTRO SUMMARY CARD ============

function drawOutroCard(ctx: CanvasRenderingContext2D, progress: number, dayStates: DayState[]) {
  ctx.save();

  const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bgGrad.addColorStop(0, '#050508');
  bgGrad.addColorStop(1, '#0a0a12');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Central glow
  const glowT = easeOutExpo(Math.min(progress * 2, 1));
  ctx.globalAlpha = 0.15 * glowT;
  const glow = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.38, 0, WIDTH / 2, HEIGHT * 0.38, 300);
  glow.addColorStop(0, 'hsla(140, 60%, 50%, 0.4)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Big number
  const numT = easeOutBack(Math.min(Math.max(progress - 0.05, 0) * 3, 1));
  if (numT > 0) {
    ctx.globalAlpha = numT;
    ctx.translate(WIDTH / 2, HEIGHT * 0.36);
    ctx.scale(lerp(0.5, 1, numT), lerp(0.5, 1, numT));
    ctx.font = FONTS.OUTRO_BIG;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'hsla(140, 60%, 50%, 0.3)';
    ctx.shadowBlur = 30;
    ctx.fillText(`${dayStates.length} DAYS`, 0, 0);
    ctx.shadowColor = 'transparent';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // "CRUSHED IT" label
  const labelT = easeOutCubic(Math.min(Math.max(progress - 0.2, 0) * 3, 1));
  if (labelT > 0) {
    ctx.globalAlpha = labelT * 0.5;
    ctx.font = FONTS.OUTRO_LABEL;
    ctx.fillStyle = 'hsla(140, 50%, 70%, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('WEEK COMPLETE ✦', WIDTH / 2, HEIGHT * 0.44);
  }

  // Activity icons row
  const rowT = easeOutCubic(Math.min(Math.max(progress - 0.35, 0) * 3, 1));
  if (rowT > 0) {
    const uniqueActivities = [...new Set(dayStates.map(d => d.activityType))];
    const total = uniqueActivities.length;
    const chipW = 90;
    const chipGap = 12;
    const totalRowW = total * chipW + (total - 1) * chipGap;
    const startX = (WIDTH - totalRowW) / 2;

    for (let i = 0; i < total; i++) {
      const delay = i * 0.08;
      const t = easeOutCubic(Math.min(Math.max(progress - 0.35 - delay, 0) * 4, 1));
      if (t <= 0) continue;

      const x = startX + i * (chipW + chipGap);
      const y = HEIGHT * 0.52;
      const hue = getActivityHue(uniqueActivities[i]);

      ctx.globalAlpha = t * 0.8;
      ctx.fillStyle = `hsla(${hue}, 40%, 20%, 0.6)`;
      ctx.beginPath();
      ctx.roundRect(x, y, chipW, 32, 16);
      ctx.fill();

      ctx.strokeStyle = `hsla(${hue}, 50%, 50%, 0.3)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, chipW, 32, 16);
      ctx.stroke();

      ctx.font = FONTS.STAT_LABEL;
      ctx.fillStyle = `hsla(${hue}, 50%, 75%, 0.9)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const name = uniqueActivities[i].length > 8
        ? uniqueActivities[i].slice(0, 7) + '.'
        : uniqueActivities[i];
      ctx.fillText(name.toUpperCase(), x + chipW / 2, y + 16);
    }
  }

  // Grain
  ctx.globalAlpha = 0.03;
  const grain = getGrainTexture();
  for (let y = 0; y < HEIGHT; y += 256) {
    for (let x = 0; x < WIDTH; x += 256) {
      ctx.drawImage(grain, x, y);
    }
  }

  // Fade out
  if (progress > 0.7) {
    const exitT = (progress - 0.7) / 0.3;
    ctx.globalAlpha = easeInOutCubic(exitT);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  ctx.restore();
}

// ============ PREMIUM METRIC TRANSITION v2 ============

function drawMetricTransition(
  ctx: CanvasRenderingContext2D,
  state: DayState,
  progress: number,
  globalAlpha: number
) {
  ctx.save();
  ctx.globalAlpha = globalAlpha;

  const hue = getActivityHue(state.activityType);
  const mode = getVisualMode(state.activityType);

  // ── Background gradient ──
  const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bgGrad.addColorStop(0, `hsl(${hue}, 10%, 4%)`);
  bgGrad.addColorStop(0.5, `hsl(${hue}, 8%, 3%)`);
  bgGrad.addColorStop(1, `hsl(${hue}, 12%, 2%)`);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ── Large radial glow (bigger) ──
  const glowProgress = easeOutExpo(Math.min(progress * 2, 1));
  ctx.save();
  ctx.globalAlpha = 0.25 * glowProgress;
  const glowGrad = ctx.createRadialGradient(
    WIDTH / 2, HEIGHT * 0.40, 0,
    WIDTH / 2, HEIGHT * 0.40, 500
  );
  glowGrad.addColorStop(0, `hsla(${hue}, 75%, 55%, 0.6)`);
  glowGrad.addColorStop(0.3, `hsla(${hue}, 65%, 45%, 0.2)`);
  glowGrad.addColorStop(0.6, `hsla(${hue}, 50%, 35%, 0.05)`);
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();

  // ── Secondary ambient glow ──
  ctx.save();
  ctx.globalAlpha = 0.08 * glowProgress;
  const ambGrad = ctx.createRadialGradient(WIDTH * 0.25, HEIGHT * 0.65, 0, WIDTH * 0.25, HEIGHT * 0.65, 350);
  ambGrad.addColorStop(0, `hsla(${(hue + 40) % 360}, 50%, 50%, 0.3)`);
  ambGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = ambGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();

  // ── Grain overlay ──
  ctx.save();
  ctx.globalAlpha = 0.04;
  const grain = getGrainTexture();
  for (let y = 0; y < HEIGHT; y += 256) {
    for (let x = 0; x < WIDTH; x += 256) {
      ctx.drawImage(grain, x, y);
    }
  }
  ctx.restore();

  // ── Activity-specific visual element ──
  const centerY = HEIGHT * 0.40;
  drawActivityVisual(ctx, mode, hue, progress, centerY);

  // ── Particles ──
  const particles = createParticles(hue, 15);
  drawParticles(ctx, particles, progress);

  // ── Staggered animation timings ──
  const dayTagT = easeOutCubic(Math.min(progress * 3.5, 1));
  const metricT = easeOutExpo(Math.min(Math.max(progress - 0.06, 0) * 2.8, 1));
  const labelT = easeOutCubic(Math.min(Math.max(progress - 0.15, 0) * 3, 1));
  const activityT = easeOutCubic(Math.min(Math.max(progress - 0.25, 0) * 2.8, 1));
  const statsT = easeOutCubic(Math.min(Math.max(progress - 0.35, 0) * 2.5, 1));

  // ── DAY pill (larger) ──
  if (dayTagT > 0) {
    ctx.save();
    ctx.globalAlpha = dayTagT * globalAlpha;
    const tagY = lerp(centerY - 120, centerY - 100, dayTagT);
    ctx.font = FONTS.DAY_TAG;
    const dayText = `DAY ${state.dayNumber}`;
    const textW = ctx.measureText(dayText).width;
    const pillW = textW + 40;
    const pillH = 34;
    const pillX = (WIDTH - pillW) / 2;

    ctx.fillStyle = `hsla(${hue}, 55%, 50%, 0.2)`;
    ctx.beginPath();
    ctx.roundRect(pillX, tagY - pillH / 2, pillW, pillH, 17);
    ctx.fill();

    ctx.strokeStyle = `hsla(${hue}, 55%, 55%, 0.35)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(pillX, tagY - pillH / 2, pillW, pillH, 17);
    ctx.stroke();

    ctx.fillStyle = `hsla(${hue}, 65%, 78%, 1)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dayText, WIDTH / 2, tagY);
    ctx.restore();
  }

  // ── Hero metric value with count-up (BIGGER) ──
  if (metricT > 0) {
    ctx.save();
    ctx.globalAlpha = metricT * globalAlpha;
    const scale = lerp(0.5, 1, metricT);
    const slideY = lerp(40, 0, metricT);

    ctx.translate(WIDTH / 2, centerY + slideY);
    ctx.scale(scale, scale);

    const rawValue = state.metricA.value;
    const numericMatch = rawValue.match(/^(\d+)/);
    let displayValue = rawValue;
    if (numericMatch && metricT < 0.85) {
      const targetNum = parseInt(numericMatch[1]);
      const currentNum = Math.round(targetNum * Math.min(metricT / 0.8, 1));
      displayValue = rawValue.replace(/^\d+/, String(currentNum));
    }

    ctx.shadowColor = `hsla(${hue}, 70%, 60%, 0.5)`;
    ctx.shadowBlur = 50;
    ctx.font = FONTS.METRIC_VALUE;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayValue, 0, 0);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Metric label ──
  if (labelT > 0) {
    ctx.save();
    ctx.globalAlpha = labelT * globalAlpha * 0.65;
    const labelY = lerp(centerY + 70, centerY + 58, labelT);
    ctx.font = FONTS.METRIC_LABEL;
    ctx.fillStyle = `hsla(0, 0%, 100%, 0.6)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '4px';
    ctx.fillText(state.metricA.label.toUpperCase(), WIDTH / 2, labelY);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  // ── Activity name ──
  if (activityT > 0) {
    ctx.save();
    ctx.globalAlpha = activityT * globalAlpha * 0.35;
    const actY = lerp(centerY + 108, centerY + 96, activityT);
    ctx.font = FONTS.ACTIVITY;
    ctx.fillStyle = `hsla(${hue}, 35%, 72%, 0.6)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.activityType.toUpperCase(), WIDTH / 2, actY);
    ctx.restore();
  }

  // ── Secondary stats row (multiple metrics) ──
  if (statsT > 0) {
    const stats: { label: string; value: string }[] = [];
    if (state.metricB.value !== '--') stats.push({ label: state.metricB.label, value: state.metricB.value });
    if (state.calories && state.calories !== '--') stats.push({ label: 'Calories', value: state.calories });
    if (state.intensity) stats.push({ label: 'Intensity', value: state.intensity });
    if (state.metricC && state.metricC.value !== '--') stats.push({ label: state.metricC.label, value: state.metricC.value });

    if (stats.length > 0) {
      const chipGap = 20;
      const maxStats = Math.min(stats.length, 3);
      const chipW = 130;
      const totalW = maxStats * chipW + (maxStats - 1) * chipGap;
      const startX = (WIDTH - totalW) / 2;

      for (let i = 0; i < maxStats; i++) {
        const delay = i * 0.08;
        const t = easeOutCubic(Math.min(Math.max(progress - 0.35 - delay, 0) * 3, 1));
        if (t <= 0) continue;

        const x = startX + i * (chipW + chipGap);
        const y = HEIGHT * 0.62;

        ctx.save();
        ctx.globalAlpha = t * globalAlpha * 0.8;

        // Glass chip background
        ctx.fillStyle = `hsla(${hue}, 30%, 25%, 0.2)`;
        ctx.beginPath();
        ctx.roundRect(x, y, chipW, 60, 14);
        ctx.fill();

        ctx.strokeStyle = `hsla(${hue}, 40%, 50%, 0.15)`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.roundRect(x, y, chipW, 60, 14);
        ctx.stroke();

        // Stat value
        ctx.font = FONTS.STAT_VALUE;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stats[i].value, x + chipW / 2, y + 22);

        // Stat label
        ctx.font = FONTS.STAT_LABEL;
        ctx.fillStyle = `hsla(0, 0%, 100%, 0.4)`;
        ctx.fillText(stats[i].label.toUpperCase(), x + chipW / 2, y + 46);

        ctx.restore();
      }
    }
  }

  // ── Horizontal scan line (futuristic) ──
  const scanT = (progress * 3) % 1;
  ctx.save();
  ctx.globalAlpha = 0.06;
  const scanY = scanT * HEIGHT;
  const scanGrad = ctx.createLinearGradient(0, scanY - 1, 0, scanY + 1);
  scanGrad.addColorStop(0, 'transparent');
  scanGrad.addColorStop(0.5, `hsla(${hue}, 60%, 70%, 0.5)`);
  scanGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = scanGrad;
  ctx.fillRect(0, scanY - 1, WIDTH, 2);
  ctx.restore();

  // ── Exit fade ──
  if (progress > 0.8) {
    const exitT = (progress - 0.8) / 0.2;
    ctx.fillStyle = `rgba(0, 0, 0, ${easeInOutCubic(exitT) * 0.8})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  ctx.restore();
}

// ============ DRAWING: PHOTO PHASE ============

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  scale: number = 1,
  panX: number = 0,
  panY: number = 0
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
  // Bottom gradient (stronger)
  const bottomGrad = ctx.createLinearGradient(0, HEIGHT - 350, 0, HEIGHT);
  bottomGrad.addColorStop(0, 'transparent');
  bottomGrad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, HEIGHT - 350, WIDTH, 350);

  // Top gradient
  const topGrad = ctx.createLinearGradient(0, 0, 0, 200);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.35)');
  topGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, WIDTH, 200);

  if (textOpacity <= 0) return;

  const hue = getActivityHue(state.activityType);

  ctx.save();
  ctx.globalAlpha = textOpacity;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 12;

  // Day badge top right
  ctx.font = FONTS.DAY_TAG;
  ctx.fillStyle = `hsla(${hue}, 60%, 75%, 0.8)`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`DAY ${state.dayNumber}`, WIDTH - 48, 54);

  // Activity name bottom
  ctx.font = 'bold 32px -apple-system, "SF Pro Display", system-ui, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(state.activityType.toUpperCase(), 48, HEIGHT - 110);

  // Primary metric
  ctx.font = FONTS.METRIC_LABEL;
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${state.metricA.label}: ${state.metricA.value}`, 48, HEIGHT - 78);

  // Secondary metric
  if (state.metricB.value !== '--') {
    ctx.fillText(`${state.metricB.label}: ${state.metricB.value}`, 48, HEIGHT - 56);
  }

  ctx.restore();
}

// ============ MAIN GENERATOR ============

export async function generateMotionRecap(options: MotionRecapOptions): Promise<string> {
  const { dayStates, onProgress } = options;

  if (dayStates.length < 3) throw new Error('Need at least 3 days for recap');

  console.log('[MotionRecap] Starting v2 with', dayStates.length, 'days');
  onProgress?.(3, 'Loading photos...');

  // Load all photos
  const images = await loadImages(dayStates);
  console.log('[MotionRecap] All photos loaded');
  onProgress?.(12, 'Generating audio...');

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;
  if (!ctx) throw new Error('Canvas context failed');

  const totalDuration = TIMING.INTRO_TITLE +
    dayStates.length * DAY_SLOT +
    TIMING.OUTRO_CARD +
    TIMING.OUTRO_FADE;
  const totalFrames = Math.ceil(totalDuration * FPS);

  console.log('[MotionRecap] Duration:', totalDuration.toFixed(1), 's, Frames:', totalFrames);

  // Generate audio
  const audioBuffer = generateAudioTrack(totalDuration);
  const wavData = audioBufferToWav(audioBuffer);
  console.log('[MotionRecap] Audio generated:', (wavData.byteLength / 1024).toFixed(0), 'KB');
  onProgress?.(16, 'Preparing video...');

  // Setup MediaRecorder with audio
  const videoStream = canvas.captureStream(FPS);

  // Create audio source and connect to stream
  const audioCtx = new AudioContext({ sampleRate: 44100 });
  const audioSource = audioCtx.createBufferSource();
  const realtimeBuffer = audioCtx.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    realtimeBuffer.copyToChannel(audioBuffer.getChannelData(ch), ch);
  }
  audioSource.buffer = realtimeBuffer;

  const dest = audioCtx.createMediaStreamDestination();
  audioSource.connect(dest);

  // Combine video + audio streams
  const combinedStream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mimeTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  const selectedMimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  console.log('[MotionRecap] Codec:', selectedMimeType);

  const mediaRecorder = new MediaRecorder(combinedStream, {
    mimeType: selectedMimeType,
    videoBitsPerSecond: 5_000_000,
  });

  const chunks: Blob[] = [];

  // Pre-generate particle sets for each day (to avoid random re-generation per frame)
  const dayParticles: Particle[][] = dayStates.map(s => createParticles(getActivityHue(s.activityType), 18));

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

      // Global fade
      const outroStart = totalDuration - TIMING.OUTRO_FADE;
      const outroOpacity = time > outroStart ? Math.max(0, 1 - (time - outroStart) / TIMING.OUTRO_FADE) : 1;

      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Phase: Intro title card
      if (time < TIMING.INTRO_TITLE) {
        const introProgress = time / TIMING.INTRO_TITLE;
        drawIntroCard(ctx, introProgress, dayStates.length);
      }
      // Phase: Day slots
      else if (time < TIMING.INTRO_TITLE + dayStates.length * DAY_SLOT) {
        const contentTime = time - TIMING.INTRO_TITLE;
        const dayIndex = Math.min(Math.floor(contentTime / DAY_SLOT), dayStates.length - 1);
        const timeInSlot = contentTime - dayIndex * DAY_SLOT;
        const inMetricPhase = timeInSlot < TIMING.METRIC_DURATION;

        if (inMetricPhase) {
          const metricProgress = timeInSlot / TIMING.METRIC_DURATION;
          drawMetricTransition(ctx, dayStates[dayIndex], metricProgress, outroOpacity);

          // Use pre-generated particles for consistency
          drawParticles(ctx, dayParticles[dayIndex], metricProgress);
        } else {
          const photoTime = timeInSlot - TIMING.METRIC_DURATION;
          const photoProgress = photoTime / TIMING.PHOTO_DURATION;

          // Ken Burns (bigger scale)
          const kbScale = lerp(1.0, 1.0 + TIMING.KEN_BURNS_SCALE, photoProgress);
          const kbPanX = lerp(-4, 4, photoProgress) * (dayIndex % 2 === 0 ? 1 : -1);
          const kbPanY = lerp(-5, 5, photoProgress);

          const photoFadeIn = Math.min(1, photoTime / TIMING.CROSSFADE);
          const timeToEnd = TIMING.PHOTO_DURATION - photoTime;
          const photoFadeOut = Math.min(1, timeToEnd / TIMING.CROSSFADE);
          const photoAlpha = outroOpacity * easeOutCubic(photoFadeIn) * photoFadeOut;

          ctx.save();
          ctx.globalAlpha = photoAlpha;
          drawImageCover(ctx, images[dayIndex], kbScale, kbPanX, kbPanY);
          drawPhotoOverlays(ctx, dayStates[dayIndex], easeOutCubic(Math.min(photoTime / 0.5, 1)));
          ctx.restore();

          // Glitch transition at the boundaries
          if (photoTime < 0.15) {
            drawGlitchTransition(ctx, photoTime / 0.15);
          }
        }
      }
      // Phase: Outro summary
      else {
        const outroTime = time - TIMING.INTRO_TITLE - dayStates.length * DAY_SLOT;
        const outroProgress = outroTime / TIMING.OUTRO_CARD;
        drawOutroCard(ctx, Math.min(outroProgress, 1), dayStates);
      }

      frameIndex++;

      if (frameIndex % 6 === 0) {
        const pct = 16 + Math.floor((frameIndex / totalFrames) * 79);
        const contentTime = Math.max(0, time - TIMING.INTRO_TITLE);
        const dayIndex = Math.min(Math.floor(contentTime / DAY_SLOT), dayStates.length - 1);
        const timeInSlot = contentTime - dayIndex * DAY_SLOT;
        const inMetricPhase = timeInSlot < TIMING.METRIC_DURATION;

        let phaseName: string;
        if (time < TIMING.INTRO_TITLE) phaseName = 'Intro';
        else if (time >= TIMING.INTRO_TITLE + dayStates.length * DAY_SLOT) phaseName = 'Summary';
        else phaseName = `Day ${dayIndex + 1} — ${inMetricPhase ? 'Metric' : 'Photo'}`;

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

    // Estimate calories based on activity + duration
    const durationMin = parseDurationToMinutes(photo.duration);
    const calorieRate = getCalorieRate(photo.activity);
    const estCalories = durationMin > 0 ? Math.round(durationMin * calorieRate) : 0;

    // Determine intensity
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
