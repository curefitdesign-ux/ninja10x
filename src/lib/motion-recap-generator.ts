/**
 * Premium Motion Recap Generator — Canvas-Drawn Metric Transitions + Photo
 * 
 * For each day:
 *   1. Metric Transition (1.2s) — Premium canvas-drawn data card (Apple Fitness+ style)
 *   2. Original Photo/Video (3s) — Ken Burns with subtle overlays
 * 
 * 100% local, no API calls. Free, instant, reliable.
 * 9:16 ratio (720×1280), 24fps, canvas-based direct-to-stream.
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
  METRIC_DURATION: 1.2,
  PHOTO_DURATION: 3.0,
  CROSSFADE: 0.4,
  INTRO_FADE: 0.5,
  OUTRO_FADE: 0.6,
  KEN_BURNS_SCALE: 0.035,
};

const DAY_SLOT = TIMING.METRIC_DURATION + TIMING.PHOTO_DURATION;

const FONTS = {
  DAY_TAG: '600 14px -apple-system, "SF Pro Text", system-ui, sans-serif',
  ACTIVITY: 'bold 28px -apple-system, "SF Pro Display", system-ui, sans-serif',
  METRIC_LABEL: '500 14px -apple-system, "SF Pro Text", system-ui, sans-serif',
  METRIC_VALUE: 'bold 80px -apple-system, "SF Pro Display", system-ui, sans-serif',
  METRIC_UNIT: '300 24px -apple-system, "SF Pro Display", system-ui, sans-serif',
};

// Activity accent colors (hue values for HSL)
const ACTIVITY_HUES: Record<string, number> = {
  running: 16,      // warm orange
  cycling: 200,     // blue
  yoga: 280,        // purple
  boxing: 0,        // red
  swimming: 190,    // teal
  trekking: 140,    // green
  basketball: 30,   // amber
  football: 120,    // green
  cricket: 45,      // gold
  default: 265,     // violet
};

function getActivityHue(activity: string): number {
  const key = activity.toLowerCase();
  for (const [name, hue] of Object.entries(ACTIVITY_HUES)) {
    if (key.includes(name)) return hue;
  }
  return ACTIVITY_HUES.default;
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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
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
    imageData.data[i + 3] = 12;
  }
  gCtx.putImageData(imageData, 0, 0);
  return grainCanvas;
}

// ============ PREMIUM METRIC TRANSITION ============

function drawMetricTransition(
  ctx: CanvasRenderingContext2D,
  state: DayState,
  progress: number,
  globalAlpha: number
) {
  ctx.save();
  ctx.globalAlpha = globalAlpha;

  const hue = getActivityHue(state.activityType);

  // ── Background gradient ──
  const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bgGrad.addColorStop(0, `hsl(${hue}, 8%, 5%)`);
  bgGrad.addColorStop(0.5, `hsl(${hue}, 6%, 4%)`);
  bgGrad.addColorStop(1, `hsl(${hue}, 10%, 3%)`);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ── Central radial glow ──
  const glowProgress = easeOutExpo(Math.min(progress * 2, 1));
  ctx.save();
  ctx.globalAlpha = 0.18 * glowProgress;
  const glowGrad = ctx.createRadialGradient(
    WIDTH / 2, HEIGHT * 0.42, 0,
    WIDTH / 2, HEIGHT * 0.42, 380
  );
  glowGrad.addColorStop(0, `hsla(${hue}, 70%, 55%, 0.7)`);
  glowGrad.addColorStop(0.35, `hsla(${hue}, 60%, 45%, 0.25)`);
  glowGrad.addColorStop(0.7, `hsla(${hue}, 50%, 35%, 0.05)`);
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();

  // ── Secondary ambient glow ──
  ctx.save();
  ctx.globalAlpha = 0.06 * glowProgress;
  const ambientGrad = ctx.createRadialGradient(
    WIDTH * 0.3, HEIGHT * 0.7, 0,
    WIDTH * 0.3, HEIGHT * 0.7, 300
  );
  ambientGrad.addColorStop(0, `hsla(${(hue + 30) % 360}, 50%, 50%, 0.4)`);
  ambientGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = ambientGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();

  // ── Grain overlay ──
  ctx.save();
  ctx.globalAlpha = 0.035;
  const grain = getGrainTexture();
  for (let y = 0; y < HEIGHT; y += 256) {
    for (let x = 0; x < WIDTH; x += 256) {
      ctx.drawImage(grain, x, y);
    }
  }
  ctx.restore();

  // ── Subtle ring decoration ──
  const ringProgress = easeOutCubic(Math.min(progress * 1.8, 1));
  ctx.save();
  ctx.globalAlpha = 0.06 * ringProgress;
  ctx.strokeStyle = `hsla(${hue}, 50%, 60%, 0.5)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(WIDTH / 2, HEIGHT * 0.42, 160 * ringProgress, 0, Math.PI * 2 * ringProgress);
  ctx.stroke();
  ctx.restore();

  // ── Thin accent line ──
  const lineProgress = easeOutExpo(Math.min((progress - 0.1) * 2.5, 1));
  if (lineProgress > 0) {
    ctx.save();
    ctx.globalAlpha = 0.12 * lineProgress;
    const lineW = 120 * lineProgress;
    const lineGrad = ctx.createLinearGradient(
      WIDTH / 2 - lineW / 2, 0, WIDTH / 2 + lineW / 2, 0
    );
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.5, `hsla(${hue}, 60%, 65%, 1)`);
    lineGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(WIDTH / 2 - lineW / 2, HEIGHT * 0.42 + 55, lineW, 1.5);
    ctx.restore();
  }

  const centerY = HEIGHT * 0.42;

  // ── Staggered animation timings ──
  const dayTagT = easeOutCubic(Math.min(progress * 4, 1));
  const metricT = easeOutExpo(Math.min(Math.max(progress - 0.08, 0) * 3, 1));
  const labelT = easeOutCubic(Math.min(Math.max(progress - 0.2, 0) * 3.5, 1));
  const activityT = easeOutCubic(Math.min(Math.max(progress - 0.3, 0) * 3, 1));

  // ── DAY pill ──
  if (dayTagT > 0) {
    ctx.save();
    ctx.globalAlpha = dayTagT * globalAlpha;
    const tagY = lerp(centerY - 95, centerY - 75, dayTagT);
    ctx.font = FONTS.DAY_TAG;
    const dayText = `DAY ${state.dayNumber}`;
    const textW = ctx.measureText(dayText).width;
    const pillW = textW + 32;
    const pillH = 30;
    const pillX = (WIDTH - pillW) / 2;

    // Pill background
    ctx.fillStyle = `hsla(${hue}, 55%, 50%, 0.15)`;
    ctx.beginPath();
    ctx.roundRect(pillX, tagY - pillH / 2, pillW, pillH, 15);
    ctx.fill();

    // Pill border
    ctx.strokeStyle = `hsla(${hue}, 55%, 55%, 0.25)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(pillX, tagY - pillH / 2, pillW, pillH, 15);
    ctx.stroke();

    // Pill text
    ctx.fillStyle = `hsla(${hue}, 60%, 75%, 0.95)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dayText, WIDTH / 2, tagY);
    ctx.restore();
  }

  // ── Hero metric value with count-up ──
  if (metricT > 0) {
    ctx.save();
    ctx.globalAlpha = metricT * globalAlpha;
    const scale = lerp(0.6, 1, metricT);
    const slideY = lerp(30, 0, metricT);

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

    // Subtle text shadow glow
    ctx.shadowColor = `hsla(${hue}, 60%, 60%, 0.3)`;
    ctx.shadowBlur = 30;
    ctx.font = FONTS.METRIC_VALUE;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayValue, 0, 0);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Metric label ──
  if (labelT > 0) {
    ctx.save();
    ctx.globalAlpha = labelT * globalAlpha * 0.6;
    const labelY = lerp(centerY + 58, centerY + 48, labelT);
    ctx.font = FONTS.METRIC_LABEL;
    ctx.fillStyle = `hsla(0, 0%, 100%, 0.55)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '3px';
    ctx.fillText(state.metricA.label.toUpperCase(), WIDTH / 2, labelY);
    ctx.letterSpacing = '0px';
    ctx.restore();
  }

  // ── Activity name ──
  if (activityT > 0) {
    ctx.save();
    ctx.globalAlpha = activityT * globalAlpha * 0.25;
    const actY = lerp(centerY + 105, centerY + 95, activityT);
    ctx.font = FONTS.ACTIVITY;
    ctx.fillStyle = `hsla(${hue}, 30%, 70%, 0.5)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.activityType.toUpperCase(), WIDTH / 2, actY);
    ctx.restore();
  }

  // ── MetricB (secondary stat) ──
  if (state.metricB.value !== '--' && activityT > 0) {
    ctx.save();
    ctx.globalAlpha = activityT * globalAlpha * 0.3;
    const mbY = centerY + 145;
    ctx.font = FONTS.METRIC_UNIT;
    ctx.fillStyle = `hsla(0, 0%, 100%, 0.35)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.metricB.label}: ${state.metricB.value}`, WIDTH / 2, mbY);
    ctx.restore();
  }

  // ── Exit fade ──
  if (progress > 0.75) {
    const exitT = (progress - 0.75) / 0.25;
    ctx.fillStyle = `rgba(0, 0, 0, ${easeInOutCubic(exitT) * 0.7})`;
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
  const bottomGrad = ctx.createLinearGradient(0, HEIGHT - 300, 0, HEIGHT);
  bottomGrad.addColorStop(0, 'transparent');
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, HEIGHT - 300, WIDTH, 300);

  const topGrad = ctx.createLinearGradient(0, 0, 0, 180);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
  topGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, WIDTH, 180);

  if (textOpacity <= 0) return;

  ctx.save();
  ctx.globalAlpha = textOpacity;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;

  ctx.font = FONTS.DAY_TAG;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`DAY ${state.dayNumber}`, WIDTH - 48, 54);

  ctx.font = FONTS.ACTIVITY;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(state.activityType.toUpperCase(), 48, HEIGHT - 100);

  ctx.font = FONTS.METRIC_LABEL;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${state.metricA.label}: ${state.metricA.value}`, 48, HEIGHT - 68);

  ctx.restore();
}

// ============ MAIN GENERATOR ============

export async function generateMotionRecap(options: MotionRecapOptions): Promise<string> {
  const { dayStates, onProgress } = options;

  if (dayStates.length < 3) throw new Error('Need at least 3 days for recap');

  console.log('[MotionRecap] Starting with', dayStates.length, 'days');
  onProgress?.(5, 'Loading photos...');

  // Load all photos
  const images = await loadImages(dayStates);
  console.log('[MotionRecap] All photos loaded');
  onProgress?.(15, 'Preparing video...');

  // Create canvas and setup recorder
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;
  if (!ctx) throw new Error('Canvas context failed');

  const totalDuration = TIMING.INTRO_FADE +
    dayStates.length * DAY_SLOT +
    TIMING.OUTRO_FADE;
  const totalFrames = Math.ceil(totalDuration * FPS);

  console.log('[MotionRecap] Duration:', totalDuration.toFixed(1), 's, Frames:', totalFrames);

  const stream = canvas.captureStream(FPS);
  const mimeTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  const selectedMimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  console.log('[MotionRecap] Codec:', selectedMimeType);

  const mediaRecorder = new MediaRecorder(stream, {
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
    }, 90_000);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    let stopFallback: ReturnType<typeof setTimeout>;

    const finalize = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(safetyTimeout);
      clearTimeout(stopFallback);
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
      console.error('[MotionRecap] Recorder error:', e);
      reject(new Error('Video encoding failed'));
    };

    mediaRecorder.start(200);

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

      // Global intro/outro opacity
      const introOpacity = Math.min(1, time / TIMING.INTRO_FADE);
      const outroStart = totalDuration - TIMING.OUTRO_FADE;
      const outroOpacity = time > outroStart ? Math.max(0, 1 - (time - outroStart) / TIMING.OUTRO_FADE) : 1;
      const globalOpacity = Math.min(introOpacity, outroOpacity);

      const contentTime = Math.max(0, time - TIMING.INTRO_FADE);
      const dayIndex = Math.min(Math.floor(contentTime / DAY_SLOT), dayStates.length - 1);
      const timeInSlot = contentTime - dayIndex * DAY_SLOT;
      const inMetricPhase = timeInSlot < TIMING.METRIC_DURATION;

      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      if (inMetricPhase) {
        const metricProgress = timeInSlot / TIMING.METRIC_DURATION;
        drawMetricTransition(ctx, dayStates[dayIndex], metricProgress, globalOpacity);
      } else {
        const photoTime = timeInSlot - TIMING.METRIC_DURATION;
        const photoProgress = photoTime / TIMING.PHOTO_DURATION;

        const kbScale = lerp(1.0, 1.0 + TIMING.KEN_BURNS_SCALE, photoProgress);
        const kbPanY = lerp(-3, 3, photoProgress);

        const photoFadeIn = Math.min(1, photoTime / TIMING.CROSSFADE);
        const timeToEnd = TIMING.PHOTO_DURATION - photoTime;
        const photoFadeOut = Math.min(1, timeToEnd / TIMING.CROSSFADE);
        const photoAlpha = globalOpacity * easeOutCubic(photoFadeIn) * photoFadeOut;

        ctx.save();
        ctx.globalAlpha = photoAlpha;
        drawImageCover(ctx, images[dayIndex], kbScale, 0, kbPanY);
        drawPhotoOverlays(ctx, dayStates[dayIndex], easeOutCubic(Math.min(photoTime / 0.5, 1)));
        ctx.restore();
      }

      frameIndex++;

      if (frameIndex % 6 === 0) {
        const pct = 15 + Math.floor((frameIndex / totalFrames) * 80);
        const currentDay = Math.min(dayIndex + 1, dayStates.length);
        const phase = inMetricPhase ? 'Metric' : 'Photo';
        onProgress?.(Math.min(pct, 94), `Day ${currentDay} — ${phase}`);
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

    return {
      dayLabel: `DAY ${photo.dayNumber}`,
      dayNumber: photo.dayNumber,
      activityType: photo.activity || 'Workout',
      metricA: {
        label: isDistanceActivity ? 'Distance' : 'Duration',
        value: photo.duration || photo.distance || '--',
      },
      metricB: {
        label: photo.pr ? 'Personal Best' : (isDistanceActivity ? 'Duration' : 'Calories'),
        value: photo.pr || (isDistanceActivity ? photo.duration : '--') || '--',
      },
      asset: {
        type: photo.isVideo ? 'video' : 'photo',
        src: photo.imageUrl,
      },
    };
  });
}

export { WIDTH, HEIGHT, FPS };
export const FRAMES = { DAY_HOLD: Math.ceil(TIMING.PHOTO_DURATION * FPS) };
