/**
 * Premium Motion Recap Generator — "Apple Memories" style
 * 
 * Renders directly to a canvas stream (no pre-rendered data URLs).
 * Uses smooth crossfades, Ken Burns, and clean typography overlays.
 * Optimized for mobile: 720x1280 @ 24fps for fast, flicker-free encoding.
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

// Timing in seconds (easier to reason about)
const TIMING = {
  FADE_DURATION: 0.6,     // crossfade between days
  HOLD_DURATION: 2.2,     // how long each day is shown
  INTRO_FADE: 0.8,        // initial fade in
  OUTRO_FADE: 0.8,        // final fade out
  KEN_BURNS_SCALE: 0.04,  // subtle zoom range (1.0 → 1.04)
};

// Layout
const LAYOUT = {
  MARGIN_X: 48,
  ACTIVITY_Y: 120,
  METRICS_Y: HEIGHT - 280,
  METRIC_ROW_GAP: 64,
  DAY_INDICATOR_Y: 130,
};

// Fonts
const FONTS = {
  ACTIVITY: 'bold 32px -apple-system, "SF Pro Display", system-ui, sans-serif',
  METRIC_LABEL: '500 16px -apple-system, "SF Pro Text", system-ui, sans-serif',
  METRIC_VALUE: 'bold 42px -apple-system, "SF Pro Display", system-ui, sans-serif',
  DAY_LABEL: '600 15px -apple-system, "SF Pro Text", system-ui, sans-serif',
  DAY_NUMBER: 'bold 22px -apple-system, "SF Pro Display", system-ui, sans-serif',
};

// ============ EASING ============

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

// ============ IMAGE LOADING ============

async function loadImages(dayStates: DayState[]): Promise<HTMLImageElement[]> {
  const results: HTMLImageElement[] = [];
  
  for (const state of dayStates) {
    const img = await new Promise<HTMLImageElement>((resolve) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        console.warn('[MotionRecap] Image load timeout:', state.asset.src?.slice(0, 60));
        // Create black placeholder
        const c = document.createElement('canvas');
        c.width = WIDTH; c.height = HEIGHT;
        const cx = c.getContext('2d')!;
        cx.fillStyle = '#111';
        cx.fillRect(0, 0, WIDTH, HEIGHT);
        const placeholder = new Image();
        placeholder.src = c.toDataURL('image/jpeg');
        placeholder.onload = () => resolve(placeholder);
      }, 8000);
      
      el.onload = () => { clearTimeout(timeout); resolve(el); };
      el.onerror = () => {
        clearTimeout(timeout);
        const c = document.createElement('canvas');
        c.width = WIDTH; c.height = HEIGHT;
        const cx = c.getContext('2d')!;
        cx.fillStyle = '#111';
        cx.fillRect(0, 0, WIDTH, HEIGHT);
        const placeholder = new Image();
        placeholder.src = c.toDataURL('image/jpeg');
        placeholder.onload = () => resolve(placeholder);
      };
      el.src = state.asset.src;
    });
    results.push(img);
  }
  
  return results;
}

// ============ DRAWING HELPERS ============

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

function drawOverlays(ctx: CanvasRenderingContext2D) {
  // Top gradient
  const topGrad = ctx.createLinearGradient(0, 0, 0, 300);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
  topGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, WIDTH, 300);

  // Bottom gradient
  const bottomGrad = ctx.createLinearGradient(0, HEIGHT - 380, 0, HEIGHT);
  bottomGrad.addColorStop(0, 'transparent');
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, HEIGHT - 380, WIDTH, 380);
}

function drawActivityLabel(ctx: CanvasRenderingContext2D, text: string, opacity: number) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = FONTS.ACTIVITY;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8;
  ctx.fillText(text.toUpperCase(), LAYOUT.MARGIN_X, LAYOUT.ACTIVITY_Y);
  ctx.restore();
}

function drawMetrics(ctx: CanvasRenderingContext2D, metricA: DayMetric, metricB: DayMetric, opacity: number) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 6;

  // Metric A
  ctx.font = FONTS.METRIC_LABEL;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(metricA.label.toUpperCase(), LAYOUT.MARGIN_X, LAYOUT.METRICS_Y);
  ctx.font = FONTS.METRIC_VALUE;
  ctx.fillStyle = '#fff';
  ctx.fillText(metricA.value, LAYOUT.MARGIN_X, LAYOUT.METRICS_Y + 22);

  // Metric B
  const metricBY = LAYOUT.METRICS_Y + LAYOUT.METRIC_ROW_GAP;
  ctx.font = FONTS.METRIC_LABEL;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(metricB.label.toUpperCase(), LAYOUT.MARGIN_X, metricBY);
  ctx.font = FONTS.METRIC_VALUE;
  ctx.fillStyle = '#fff';
  ctx.fillText(metricB.value, LAYOUT.MARGIN_X, metricBY + 22);

  ctx.restore();
}

function drawDayIndicator(ctx: CanvasRenderingContext2D, dayNumber: number, opacity: number) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  const x = WIDTH - LAYOUT.MARGIN_X;
  ctx.font = FONTS.DAY_LABEL;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('DAY', x, LAYOUT.DAY_INDICATOR_Y);
  ctx.font = FONTS.DAY_NUMBER;
  ctx.fillStyle = '#22C55E';
  ctx.fillText(String(dayNumber), x, LAYOUT.DAY_INDICATOR_Y + 22);
  ctx.restore();
}

// ============ MAIN GENERATOR ============

export async function generateMotionRecap(options: MotionRecapOptions): Promise<string> {
  const { dayStates, onProgress } = options;

  if (dayStates.length < 3) throw new Error('Need at least 3 days for recap');

  console.log('[MotionRecap] Starting with', dayStates.length, 'days');
  onProgress?.(2, 'Loading photos...');

  // Load all images
  const images = await loadImages(dayStates);
  console.log('[MotionRecap] All images loaded');
  onProgress?.(15, 'Preparing video...');

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;
  if (!ctx) throw new Error('Canvas context failed');

  // Calculate total duration
  const totalDuration = TIMING.INTRO_FADE + 
    dayStates.length * TIMING.HOLD_DURATION + 
    (dayStates.length - 1) * TIMING.FADE_DURATION + 
    TIMING.OUTRO_FADE;
  const totalFrames = Math.ceil(totalDuration * FPS);

  console.log('[MotionRecap] Duration:', totalDuration.toFixed(1), 's, Frames:', totalFrames);

  // Setup MediaRecorder on canvas stream
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

    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      if (!resolved) {
        console.warn('[MotionRecap] Safety timeout — forcing completion');
        try { if (mediaRecorder.state !== 'inactive') mediaRecorder.stop(); } catch {}
      }
    }, 90_000);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

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

    // Fallback: if onstop never fires after stop() is called, finalize after 3s
    let stopFallback: ReturnType<typeof setTimeout>;

    mediaRecorder.onstop = finalize;

    mediaRecorder.onerror = (e) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(safetyTimeout);
      console.error('[MotionRecap] Recorder error:', e);
      reject(new Error('Video encoding failed'));
    };

    // Start recording
    mediaRecorder.start(200); // collect data every 200ms

    // Render loop — directly paint to canvas at FPS interval
    let frameIndex = 0;

    const renderLoop = () => {
      if (resolved || frameIndex >= totalFrames) {
        // Finished all frames — stop recording after a brief flush
        onProgress?.(95, 'Finalizing...');
        setTimeout(() => {
          try {
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
              // If onstop doesn't fire within 3s, force finalize
              stopFallback = setTimeout(() => {
                console.warn('[MotionRecap] onstop never fired — forcing finalize');
                finalize();
              }, 3000);
            } else {
              // Already inactive, finalize directly
              finalize();
            }
          } catch {
            finalize();
          }
        }, 400);
        return;
      }

      const time = frameIndex / FPS; // current time in seconds

      // === Determine which day(s) to show ===
      // Each day occupies HOLD_DURATION, with FADE_DURATION crossfade between them
      const daySlotDuration = TIMING.HOLD_DURATION; // time per slot (overlapping fade)
      
      // Effective time (after intro fade)
      const contentTime = time - TIMING.INTRO_FADE;
      
      // Calculate intro/outro opacity
      const introOpacity = Math.min(1, time / TIMING.INTRO_FADE);
      const outroStart = totalDuration - TIMING.OUTRO_FADE;
      const outroOpacity = time > outroStart ? Math.max(0, 1 - (time - outroStart) / TIMING.OUTRO_FADE) : 1;
      const globalOpacity = Math.min(introOpacity, outroOpacity);

      // Calculate current day index and crossfade progress
      const dayProgress = Math.max(0, contentTime) / daySlotDuration;
      const currentDayIdx = Math.min(Math.floor(dayProgress), dayStates.length - 1);
      const nextDayIdx = Math.min(currentDayIdx + 1, dayStates.length - 1);
      const fractional = dayProgress - currentDayIdx;

      // Crossfade: last FADE_DURATION/HOLD_DURATION fraction of each slot
      const fadeStart = 1 - (TIMING.FADE_DURATION / TIMING.HOLD_DURATION);
      const isCrossfading = fractional > fadeStart && currentDayIdx < dayStates.length - 1;
      const crossfadeT = isCrossfading
        ? easeInOutCubic((fractional - fadeStart) / (1 - fadeStart))
        : 0;

      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Ken Burns parameters
      const kenBurnsProgress = fractional; // 0-1 within current day
      const scale1 = lerp(1.0, 1.0 + TIMING.KEN_BURNS_SCALE, kenBurnsProgress);
      const panY1 = lerp(-5, 5, kenBurnsProgress);

      // Draw current day (or outgoing day during crossfade)
      ctx.save();
      ctx.globalAlpha = globalOpacity * (isCrossfading ? (1 - crossfadeT) : 1);
      drawImageCover(ctx, images[currentDayIdx], scale1, 0, panY1);
      ctx.restore();

      // Draw incoming day during crossfade
      if (isCrossfading && nextDayIdx !== currentDayIdx) {
        const scale2 = lerp(1.0 + TIMING.KEN_BURNS_SCALE * 0.5, 1.0, crossfadeT);
        ctx.save();
        ctx.globalAlpha = globalOpacity * crossfadeT;
        drawImageCover(ctx, images[nextDayIdx], scale2, 0, 0);
        ctx.restore();
      }

      // Overlays
      ctx.save();
      ctx.globalAlpha = globalOpacity;
      drawOverlays(ctx);

      // Text overlays (use the dominant day during crossfade)
      const textDayIdx = crossfadeT > 0.5 ? nextDayIdx : currentDayIdx;
      const textOpacity = isCrossfading
        ? (crossfadeT > 0.5 ? easeInOutCubic((crossfadeT - 0.5) * 2) : easeInOutCubic(1 - crossfadeT * 2))
        : 1;
      const state = dayStates[textDayIdx];

      drawActivityLabel(ctx, state.activityType, textOpacity);
      drawMetrics(ctx, state.metricA, state.metricB, textOpacity);
      drawDayIndicator(ctx, state.dayNumber, textOpacity);
      ctx.restore();

      frameIndex++;

      // Progress update
      if (frameIndex % 6 === 0) {
        const pct = 15 + Math.floor((frameIndex / totalFrames) * 80);
        const currentDay = Math.min(currentDayIdx + 1, dayStates.length);
        onProgress?.(Math.min(pct, 94), `Rendering Day ${currentDay}...`);
      }

      // Schedule next frame at FPS interval
      setTimeout(renderLoop, 1000 / FPS);
    };

    // Kick off rendering after a brief settle
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
export const FRAMES = { DAY_HOLD: Math.ceil(TIMING.HOLD_DURATION * FPS) };
