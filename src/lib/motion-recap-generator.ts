/**
 * Premium Motion Recap Generator — Metric Transition + Photo Style
 * 
 * For each day:
 *   1. Metric Transition (1s) — Abstract data visualization with bold numbers,
 *      count-up animation, dark background with grain, slide/scale motion
 *   2. Original Photo/Video (3s) — Ken Burns with subtle overlays
 * 
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
  METRIC_DURATION: 1.0,   // 1s metric transition card
  PHOTO_DURATION: 3.0,    // 3s photo/video hold
  CROSSFADE: 0.4,         // crossfade between metric→photo and photo→next metric
  INTRO_FADE: 0.5,        // initial fade in
  OUTRO_FADE: 0.6,        // final fade out
  KEN_BURNS_SCALE: 0.035, // subtle zoom
};

// Day slot = metric + photo
const DAY_SLOT = TIMING.METRIC_DURATION + TIMING.PHOTO_DURATION; // 4s per day

const FONTS = {
  DAY_TAG: '600 14px -apple-system, "SF Pro Text", system-ui, sans-serif',
  ACTIVITY: 'bold 28px -apple-system, "SF Pro Display", system-ui, sans-serif',
  METRIC_LABEL: '500 13px -apple-system, "SF Pro Text", system-ui, sans-serif',
  METRIC_VALUE: 'bold 72px -apple-system, "SF Pro Display", system-ui, sans-serif',
  METRIC_UNIT: '300 20px -apple-system, "SF Pro Text", system-ui, sans-serif',
  BRANDING: '500 12px -apple-system, "SF Pro Text", system-ui, sans-serif',
};

// ============ EASING ============

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

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
    imageData.data[i + 3] = 12; // very subtle
  }
  gCtx.putImageData(imageData, 0, 0);
  return grainCanvas;
}

// ============ DRAWING: METRIC TRANSITION ============

function drawMetricTransition(
  ctx: CanvasRenderingContext2D,
  state: DayState,
  progress: number, // 0→1 through the 1s metric phase
  globalAlpha: number
) {
  ctx.save();
  ctx.globalAlpha = globalAlpha;

  // Dark background with subtle gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bgGrad.addColorStop(0, '#0a0a0f');
  bgGrad.addColorStop(0.5, '#0d0d14');
  bgGrad.addColorStop(1, '#08080c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle accent glow
  const accentProgress = easeOutCubic(Math.min(progress * 1.5, 1));
  ctx.save();
  ctx.globalAlpha = 0.12 * accentProgress;
  const glowGrad = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.4, 0, WIDTH / 2, HEIGHT * 0.4, 350);
  glowGrad.addColorStop(0, 'rgba(139, 92, 246, 0.6)');
  glowGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.15)');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();

  // Grain overlay
  ctx.save();
  ctx.globalAlpha = 0.04;
  const grain = getGrainTexture();
  for (let y = 0; y < HEIGHT; y += 256) {
    for (let x = 0; x < WIDTH; x += 256) {
      ctx.drawImage(grain, x, y);
    }
  }
  ctx.restore();

  // Animated elements with staggered timing
  const dayTagProgress = easeOutCubic(Math.min(progress * 3, 1));       // 0–0.33s
  const metricProgress = easeOutCubic(Math.min((progress - 0.15) * 2.5, 1)); // 0.15–0.55s
  const labelProgress = easeOutCubic(Math.min((progress - 0.3) * 2.5, 1));   // 0.3–0.7s

  // Center Y for the whole block
  const centerY = HEIGHT * 0.42;

  // DAY tag — slides down from above
  if (dayTagProgress > 0) {
    ctx.save();
    ctx.globalAlpha = dayTagProgress * globalAlpha;
    const tagY = lerp(centerY - 100, centerY - 70, dayTagProgress);
    
    // Pill background
    ctx.font = FONTS.DAY_TAG;
    const dayText = `DAY ${state.dayNumber}`;
    const textW = ctx.measureText(dayText).width;
    const pillW = textW + 28;
    const pillH = 28;
    const pillX = (WIDTH - pillW) / 2;
    
    ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.beginPath();
    ctx.roundRect(pillX, tagY - pillH / 2, pillW, pillH, 14);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dayText, WIDTH / 2, tagY);
    ctx.restore();
  }

  // Main metric value — count-up + scale in
  if (metricProgress > 0) {
    ctx.save();
    ctx.globalAlpha = metricProgress * globalAlpha;
    
    const metricY = centerY;
    const scale = lerp(0.7, 1, metricProgress);
    const slideY = lerp(20, 0, metricProgress);
    
    ctx.translate(WIDTH / 2, metricY + slideY);
    ctx.scale(scale, scale);
    
    // Animated count-up for numeric values
    const rawValue = state.metricA.value;
    const numericMatch = rawValue.match(/^(\d+)/);
    let displayValue = rawValue;
    if (numericMatch && metricProgress < 0.9) {
      const targetNum = parseInt(numericMatch[1]);
      const currentNum = Math.round(targetNum * Math.min(metricProgress / 0.85, 1));
      displayValue = rawValue.replace(/^\d+/, String(currentNum));
    }
    
    ctx.font = FONTS.METRIC_VALUE;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayValue, 0, 0);
    
    ctx.restore();
  }

  // Metric label — slides up
  if (labelProgress > 0) {
    ctx.save();
    ctx.globalAlpha = labelProgress * globalAlpha * 0.5;
    const labelY = lerp(centerY + 55, centerY + 45, labelProgress);
    
    ctx.font = FONTS.METRIC_LABEL;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.metricA.label.toUpperCase(), WIDTH / 2, labelY);
    ctx.restore();
  }

  // Activity name — bottom area
  if (labelProgress > 0) {
    ctx.save();
    ctx.globalAlpha = labelProgress * globalAlpha * 0.4;
    const actY = lerp(centerY + 100, centerY + 90, labelProgress);
    
    ctx.font = FONTS.ACTIVITY;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.activityType.toUpperCase(), WIDTH / 2, actY);
    ctx.restore();
  }

  // Exit animation — soft opacity fade + slight scale for last 20% of the metric phase
  if (progress > 0.8) {
    const exitT = (progress - 0.8) / 0.2;
    const fadeOut = 1 - easeInOutCubic(exitT);
    // Apply as overlay black
    ctx.fillStyle = `rgba(0, 0, 0, ${(1 - fadeOut) * 0.6})`;
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
  // Subtle bottom gradient only
  const bottomGrad = ctx.createLinearGradient(0, HEIGHT - 300, 0, HEIGHT);
  bottomGrad.addColorStop(0, 'transparent');
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, HEIGHT - 300, WIDTH, 300);

  // Top subtle gradient
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

  // Day indicator — top right
  ctx.font = FONTS.DAY_TAG;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`DAY ${state.dayNumber}`, WIDTH - 48, 54);

  // Activity — bottom left
  ctx.font = FONTS.ACTIVITY;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(state.activityType.toUpperCase(), 48, HEIGHT - 100);

  // Metric under activity
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
  onProgress?.(2, 'Loading photos...');

  const images = await loadImages(dayStates);
  console.log('[MotionRecap] All images loaded');
  onProgress?.(15, 'Preparing video...');

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;
  if (!ctx) throw new Error('Canvas context failed');

  // Total duration: intro + (metric + photo) per day + outro
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

      // Content time (after intro)
      const contentTime = Math.max(0, time - TIMING.INTRO_FADE);

      // Which day and phase?
      const dayIndex = Math.min(Math.floor(contentTime / DAY_SLOT), dayStates.length - 1);
      const timeInSlot = contentTime - dayIndex * DAY_SLOT;

      // Phase: metric (0 → METRIC_DURATION) or photo (METRIC_DURATION → DAY_SLOT)
      const inMetricPhase = timeInSlot < TIMING.METRIC_DURATION;

      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      if (inMetricPhase) {
        // ---- METRIC TRANSITION ----
        const metricProgress = timeInSlot / TIMING.METRIC_DURATION; // 0→1
        drawMetricTransition(ctx, dayStates[dayIndex], metricProgress, globalOpacity);
      } else {
        // ---- PHOTO PHASE ----
        const photoTime = timeInSlot - TIMING.METRIC_DURATION;
        const photoProgress = photoTime / TIMING.PHOTO_DURATION; // 0→1

        // Ken Burns
        const kbScale = lerp(1.0, 1.0 + TIMING.KEN_BURNS_SCALE, photoProgress);
        const kbPanY = lerp(-3, 3, photoProgress);

        // Fade in from metric
        const photoFadeIn = Math.min(1, photoTime / TIMING.CROSSFADE);
        // Fade out to next metric (or outro)
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
