 /**
  * Premium Motion Recap Generator
  * Remotion-style frame-based animation system for fitness reels
  * 
  * Architecture:
  * - DayScene controller manages timeline
  * - Individual components: HeroAsset, ActivityLabel, MetricRow, DayIndicator
  * - Frame-based interpolation with premium easing
  * - Choreographed transitions (max 2 elements animating simultaneously)
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
 
 const FPS = 30;
 const WIDTH = 1080;
 const HEIGHT = 1920;
 
 // Timing constants (in frames at 30fps)
 const FRAMES = {
   // Text transitions
   TEXT_EXIT: 7,      // 6-8 frames for text exit
   TEXT_ENTER: 9,     // 8-10 frames for text enter
   
   // Metric value morphs
   METRIC_MORPH: 10,  // 8-12 frames for value transition
   METRIC_STAGGER: 5, // 4-6 frames stagger between metrics
   
   // Asset transitions
   ASSET_TRANSITION: 15, // 14-16 frames for hero asset
   
   // Day label
   DAY_EXIT: 7,
   DAY_ENTER: 9,
   
   // Scene timing
   DAY_INTRO_SETTLE: 15,  // 12-18 frames initial settle
   DAY_HOLD: 45,          // ~1.5 sec per day state display
   DAY_OUTRO_HOLD: 12,    // 10-14 frame end hold
   
   // Transition start offsets (choreography)
   OFFSET_METRIC_B: 0,
   OFFSET_METRIC_A: 5,
   OFFSET_DAY_LABEL: 8,
   OFFSET_ASSET: 4,
   OFFSET_ACTIVITY: 12,
 };
 
 // Layout constants (safe margins for reels)
 const LAYOUT = {
   MARGIN_X: 64,
   MARGIN_TOP: 120,
   MARGIN_BOTTOM: 200,
   
   ACTIVITY_Y: 160,
   METRICS_Y: 1480,
   METRIC_ROW_HEIGHT: 90,
   DAY_INDICATOR_Y: 180,
 };
 
 // Typography
 const FONTS = {
   ACTIVITY: 'bold 42px "SF Pro Display", -apple-system, system-ui, sans-serif',
   METRIC_LABEL: '500 22px "SF Pro Text", -apple-system, system-ui, sans-serif',
   METRIC_VALUE: 'bold 56px "SF Pro Display", -apple-system, system-ui, sans-serif',
   DAY_LABEL: '600 20px "SF Pro Text", -apple-system, system-ui, sans-serif',
   DAY_NUMBER: 'bold 28px "SF Pro Display", -apple-system, system-ui, sans-serif',
 };
 
 // Colors
 const COLORS = {
   TEXT_PRIMARY: '#FFFFFF',
   TEXT_SECONDARY: 'rgba(255, 255, 255, 0.7)',
   TEXT_MUTED: 'rgba(255, 255, 255, 0.5)',
   ACCENT: '#22C55E', // Emerald
   OVERLAY_TOP: 'rgba(0, 0, 0, 0.4)',
   OVERLAY_BOTTOM: 'rgba(0, 0, 0, 0.65)',
 };
 
 // ============ EASING FUNCTIONS ============
 
 // Premium easing - ease-out for entering
 function easeOutQuart(t: number): number {
   return 1 - Math.pow(1 - t, 4);
 }
 
 // Premium easing - ease-in for exiting
 function easeInQuart(t: number): number {
   return t * t * t * t;
 }
 
 // Subtle ease for settle animations
 function easeOutQuint(t: number): number {
   return 1 - Math.pow(1 - t, 5);
 }
 
 // Interpolate between values
 function interpolate(
   frame: number, 
   inputRange: [number, number], 
   outputRange: [number, number],
   easing: (t: number) => number = easeOutQuart
 ): number {
   const [startFrame, endFrame] = inputRange;
   const [startValue, endValue] = outputRange;
   
   if (frame <= startFrame) return startValue;
   if (frame >= endFrame) return endValue;
   
   const progress = (frame - startFrame) / (endFrame - startFrame);
   const easedProgress = easing(progress);
   
   return startValue + (endValue - startValue) * easedProgress;
 }
 
 // Multi-step interpolation for complex animations
 function interpolateMulti(
   progress: number,
   inputRange: number[],
   outputRange: number[]
 ): number {
   if (progress <= inputRange[0]) return outputRange[0];
   if (progress >= inputRange[inputRange.length - 1]) return outputRange[outputRange.length - 1];
   
   for (let i = 0; i < inputRange.length - 1; i++) {
     if (progress >= inputRange[i] && progress <= inputRange[i + 1]) {
       const segmentProgress = (progress - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
       return outputRange[i] + (outputRange[i + 1] - outputRange[i]) * segmentProgress;
     }
   }
   
   return outputRange[outputRange.length - 1];
 }
 
 // Clamp value
 function clamp(value: number, min: number, max: number): number {
   return Math.max(min, Math.min(max, value));
 }
 
 // ============ IMAGE LOADING ============
 
 async function loadImages(dayStates: DayState[]): Promise<HTMLImageElement[]> {
   return Promise.all(
     dayStates.map(
       (state) =>
         new Promise<HTMLImageElement>((resolve) => {
           const img = new Image();
           img.crossOrigin = 'anonymous';
           img.onload = () => resolve(img);
           img.onerror = () => {
             // Create placeholder on error
             const canvas = document.createElement('canvas');
             canvas.width = WIDTH;
             canvas.height = HEIGHT;
             const ctx = canvas.getContext('2d')!;
             ctx.fillStyle = '#1a1a1a';
             ctx.fillRect(0, 0, WIDTH, HEIGHT);
             const placeholder = new Image();
             placeholder.src = canvas.toDataURL();
             placeholder.onload = () => resolve(placeholder);
           };
           img.src = state.asset.src;
         })
     )
   );
 }
 
 // ============ DRAWING COMPONENTS ============
 
 // Draw image with cover mode (preserve aspect ratio, fill frame)
 function drawHeroAsset(
   ctx: CanvasRenderingContext2D,
   img: HTMLImageElement,
   opacity: number,
   scale: number,
   offsetY: number,
   maskProgress: number = 1 // 0-1, diagonal mask reveal
 ) {
   if (opacity <= 0) return;
   
   ctx.save();
   ctx.globalAlpha = opacity;
   
   // Apply mask if not fully revealed
   if (maskProgress < 1) {
     ctx.beginPath();
     // Diagonal mask from top-right to bottom-left
     const maskWidth = WIDTH * 1.5 * maskProgress;
     ctx.moveTo(WIDTH, 0);
     ctx.lineTo(WIDTH, HEIGHT);
     ctx.lineTo(WIDTH - maskWidth, HEIGHT);
     ctx.lineTo(WIDTH - maskWidth + HEIGHT * 0.3, 0);
     ctx.closePath();
     ctx.clip();
   }
   
   // Center and scale
   ctx.translate(WIDTH / 2, HEIGHT / 2 + offsetY);
   ctx.scale(scale, scale);
   
   // Draw with cover mode
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
   
   ctx.drawImage(img, sx, sy, sw, sh, -WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);
   ctx.restore();
 }
 
 // Draw gradient overlays for text readability
 function drawOverlays(ctx: CanvasRenderingContext2D) {
   // Top gradient
   const topGrad = ctx.createLinearGradient(0, 0, 0, 350);
   topGrad.addColorStop(0, COLORS.OVERLAY_TOP);
   topGrad.addColorStop(1, 'transparent');
   ctx.fillStyle = topGrad;
   ctx.fillRect(0, 0, WIDTH, 350);
   
   // Bottom gradient
   const bottomGrad = ctx.createLinearGradient(0, HEIGHT - 450, 0, HEIGHT);
   bottomGrad.addColorStop(0, 'transparent');
   bottomGrad.addColorStop(1, COLORS.OVERLAY_BOTTOM);
   ctx.fillStyle = bottomGrad;
   ctx.fillRect(0, HEIGHT - 450, WIDTH, 450);
 }
 
 // Draw activity type label (top-left)
 function drawActivityLabel(
   ctx: CanvasRenderingContext2D,
   text: string,
   opacity: number,
   offsetX: number,
   offsetY: number
 ) {
   if (opacity <= 0) return;
   
   ctx.save();
   ctx.globalAlpha = opacity;
   ctx.font = FONTS.ACTIVITY;
   ctx.fillStyle = COLORS.TEXT_PRIMARY;
   ctx.textAlign = 'left';
   ctx.textBaseline = 'top';
   
   // Add subtle text shadow for depth
   ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
   ctx.shadowBlur = 8;
   ctx.shadowOffsetY = 2;
   
   ctx.fillText(
     text.toUpperCase(),
     LAYOUT.MARGIN_X + offsetX,
     LAYOUT.ACTIVITY_Y + offsetY
   );
   ctx.restore();
 }
 
 // Draw metric row (label + value)
 function drawMetricRow(
   ctx: CanvasRenderingContext2D,
   label: string,
   value: string,
   y: number,
   opacity: number,
   scale: number,
   labelOpacity: number = 1
 ) {
   if (opacity <= 0) return;
   
   ctx.save();
   ctx.globalAlpha = opacity;
   
   const x = LAYOUT.MARGIN_X;
   
   // Label (smaller, muted)
   ctx.save();
   ctx.globalAlpha = opacity * labelOpacity;
   ctx.font = FONTS.METRIC_LABEL;
   ctx.fillStyle = COLORS.TEXT_SECONDARY;
   ctx.textAlign = 'left';
   ctx.textBaseline = 'top';
   ctx.fillText(label.toUpperCase(), x, y);
   ctx.restore();
   
   // Value (larger, bold, with scale emphasis)
   ctx.save();
   const valueY = y + 28;
   ctx.translate(x, valueY);
   ctx.scale(scale, scale);
   ctx.translate(-x, -valueY);
   
   ctx.font = FONTS.METRIC_VALUE;
   ctx.fillStyle = COLORS.TEXT_PRIMARY;
   ctx.textAlign = 'left';
   ctx.textBaseline = 'top';
   
   ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
   ctx.shadowBlur = 6;
   ctx.shadowOffsetY = 2;
   
   ctx.fillText(value, x, valueY);
   ctx.restore();
   
   ctx.restore();
 }
 
 // Draw day indicator (top-right)
 function drawDayIndicator(
   ctx: CanvasRenderingContext2D,
   dayNumber: number,
   opacity: number,
   offsetY: number
 ) {
   if (opacity <= 0) return;
   
   ctx.save();
   ctx.globalAlpha = opacity;
   
   const x = WIDTH - LAYOUT.MARGIN_X;
   const y = LAYOUT.DAY_INDICATOR_Y + offsetY;
   
   // "DAY" label
   ctx.font = FONTS.DAY_LABEL;
   ctx.fillStyle = COLORS.TEXT_MUTED;
   ctx.textAlign = 'right';
   ctx.textBaseline = 'top';
   ctx.fillText('DAY', x, y);
   
   // Day number (with accent color)
   ctx.font = FONTS.DAY_NUMBER;
   ctx.fillStyle = COLORS.ACCENT;
   ctx.fillText(String(dayNumber), x, y + 26);
   
   ctx.restore();
 }
 
 // ============ SCENE TIMELINE ============
 
 interface SceneState {
   currentDay: number;
   prevDay: number | null;
   transitionFrame: number;
   isTransitioning: boolean;
 }
 
 function calculateSceneState(frame: number, totalDays: number): SceneState {
   const framesPerDay = FRAMES.DAY_HOLD + FRAMES.ASSET_TRANSITION + FRAMES.OFFSET_ACTIVITY;
   const totalTransitionFrames = FRAMES.ASSET_TRANSITION + FRAMES.OFFSET_ACTIVITY;
   
   // First day intro
   if (frame < FRAMES.DAY_INTRO_SETTLE) {
     return {
       currentDay: 0,
       prevDay: null,
       transitionFrame: frame,
       isTransitioning: false,
     };
   }
   
   const adjustedFrame = frame - FRAMES.DAY_INTRO_SETTLE;
   const dayIndex = Math.floor(adjustedFrame / framesPerDay);
   const frameInDay = adjustedFrame % framesPerDay;
   
   // Check if we're in transition period
   const isTransitioning = frameInDay >= FRAMES.DAY_HOLD && dayIndex < totalDays - 1;
   
   return {
     currentDay: Math.min(dayIndex, totalDays - 1),
     prevDay: isTransitioning ? dayIndex : (dayIndex > 0 ? dayIndex - 1 : null),
     transitionFrame: isTransitioning ? frameInDay - FRAMES.DAY_HOLD : 0,
     isTransitioning,
   };
 }
 
 // ============ FRAME RENDERER ============
 
 function renderFrame(
   ctx: CanvasRenderingContext2D,
   frame: number,
   dayStates: DayState[],
   images: HTMLImageElement[],
   totalFrames: number
 ) {
   const sceneState = calculateSceneState(frame, dayStates.length);
   const { currentDay, prevDay, transitionFrame, isTransitioning } = sceneState;
   
   const currentState = dayStates[currentDay];
   const prevState = prevDay !== null ? dayStates[prevDay] : null;
   const currentImage = images[currentDay];
   const prevImage = prevDay !== null ? images[prevDay] : null;
   
   // Clear canvas
   ctx.fillStyle = '#0a0a0a';
   ctx.fillRect(0, 0, WIDTH, HEIGHT);
   
   // ===== HERO ASSET =====
   if (isTransitioning && prevImage && prevState) {
     const assetProgress = clamp(
       (transitionFrame - FRAMES.OFFSET_ASSET) / FRAMES.ASSET_TRANSITION,
       0, 1
     );
     
     // Previous image fades out with slight scale down
     const prevOpacity = interpolate(
       assetProgress, [0, 1], [1, 0], easeInQuart
     );
     const prevScale = interpolate(
       assetProgress, [0, 1], [1, 0.97], easeInQuart
     );
     drawHeroAsset(ctx, prevImage, prevOpacity, prevScale, 0, 1);
     
     // Current image fades in with diagonal mask reveal
     const currOpacity = interpolate(
       assetProgress, [0, 1], [0, 1], easeOutQuart
     );
     const currScale = interpolate(
       assetProgress, [0, 1], [1.03, 1], easeOutQuint
     );
     const maskProgress = interpolate(
       assetProgress, [0, 1], [0, 1], easeOutQuart
     );
     drawHeroAsset(ctx, currentImage, currOpacity, currScale, 0, maskProgress);
   } else {
     // Subtle Ken Burns effect during hold
     const holdFrame = frame % (FRAMES.DAY_HOLD + FRAMES.ASSET_TRANSITION);
     const breathe = Math.sin(holdFrame / FRAMES.DAY_HOLD * Math.PI) * 0.01;
     drawHeroAsset(ctx, currentImage, 1, 1 + breathe, 0, 1);
   }
   
   // Draw overlays
   drawOverlays(ctx);
   
   // ===== ACTIVITY LABEL =====
   if (isTransitioning && prevState && prevState.activityType !== currentState.activityType) {
     const activityProgress = clamp(
       (transitionFrame - FRAMES.OFFSET_ACTIVITY) / FRAMES.TEXT_ENTER,
       0, 1
     );
     
     // Previous activity exits down-left
     const prevActivityOpacity = interpolate(
       activityProgress, [0, 0.5], [1, 0], easeInQuart
     );
     const prevActivityX = interpolate(
       activityProgress, [0, 0.5], [0, -30], easeInQuart
     );
     const prevActivityY = interpolate(
       activityProgress, [0, 0.5], [0, 20], easeInQuart
     );
     drawActivityLabel(ctx, prevState.activityType, prevActivityOpacity, prevActivityX, prevActivityY);
     
     // Current activity enters from up-right
     const currActivityOpacity = interpolate(
       activityProgress, [0.3, 1], [0, 1], easeOutQuart
     );
     const currActivityX = interpolate(
       activityProgress, [0.3, 1], [30, 0], easeOutQuart
     );
     const currActivityY = interpolate(
       activityProgress, [0.3, 1], [-20, 0], easeOutQuart
     );
     drawActivityLabel(ctx, currentState.activityType, currActivityOpacity, currActivityX, currActivityY);
   } else {
     drawActivityLabel(ctx, currentState.activityType, 1, 0, 0);
   }
   
   // ===== METRICS =====
   const metricBaseY = LAYOUT.METRICS_Y;
   
   if (isTransitioning && prevState) {
     // MetricB animates first
     const metricBProgress = clamp(
       (transitionFrame - FRAMES.OFFSET_METRIC_B) / FRAMES.METRIC_MORPH,
       0, 1
     );
     
     // MetricA animates with stagger
     const metricAProgress = clamp(
       (transitionFrame - FRAMES.OFFSET_METRIC_A) / FRAMES.METRIC_MORPH,
       0, 1
     );
     
     // Metric A (first row)
     const metricAScale = metricAProgress > 0 && metricAProgress < 1
       ? 1 + Math.sin(metricAProgress * Math.PI) * 0.04
       : 1;
     const metricAOpacity = interpolateMulti(metricAProgress, [0, 0.3, 0.7, 1], [1, 0.7, 0.7, 1]);
     const metricALabelOpacity = prevState.metricA.label !== currentState.metricA.label
       ? interpolateMulti(metricAProgress, [0, 0.4, 0.6, 1], [1, 0, 0, 1])
       : 1;
     const displayMetricA = metricAProgress < 0.5 ? prevState.metricA : currentState.metricA;
     drawMetricRow(ctx, displayMetricA.label, displayMetricA.value, metricBaseY, 1, metricAScale, metricALabelOpacity);
     
     // Metric B (second row)
     const metricBScale = metricBProgress > 0 && metricBProgress < 1
       ? 1 + Math.sin(metricBProgress * Math.PI) * 0.04
       : 1;
     const displayMetricB = metricBProgress < 0.5 ? prevState.metricB : currentState.metricB;
     const metricBLabelOpacity = prevState.metricB.label !== currentState.metricB.label
       ? interpolateMulti(metricBProgress, [0, 0.4, 0.6, 1], [1, 0, 0, 1])
       : 1;
     drawMetricRow(ctx, displayMetricB.label, displayMetricB.value, metricBaseY + LAYOUT.METRIC_ROW_HEIGHT, 1, metricBScale, metricBLabelOpacity);
   } else {
     drawMetricRow(ctx, currentState.metricA.label, currentState.metricA.value, metricBaseY, 1, 1);
     drawMetricRow(ctx, currentState.metricB.label, currentState.metricB.value, metricBaseY + LAYOUT.METRIC_ROW_HEIGHT, 1, 1);
   }
   
   // ===== DAY INDICATOR =====
   if (isTransitioning && prevState && prevState.dayNumber !== currentState.dayNumber) {
     const dayProgress = clamp(
       (transitionFrame - FRAMES.OFFSET_DAY_LABEL) / FRAMES.DAY_ENTER,
       0, 1
     );
     
     // Previous day slides up and fades
     const prevDayOpacity = interpolate(dayProgress, [0, 0.5], [1, 0], easeInQuart);
     const prevDayY = interpolate(dayProgress, [0, 0.5], [0, -15], easeInQuart);
     drawDayIndicator(ctx, prevState.dayNumber, prevDayOpacity, prevDayY);
     
     // Current day snaps in from below
     const currDayOpacity = interpolate(dayProgress, [0.3, 1], [0, 1], easeOutQuart);
     const currDayY = interpolate(dayProgress, [0.3, 1], [15, 0], easeOutQuart);
     drawDayIndicator(ctx, currentState.dayNumber, currDayOpacity, currDayY);
   } else {
     drawDayIndicator(ctx, currentState.dayNumber, 1, 0);
   }
 }
 
 // ============ MAIN GENERATOR ============
 
 export async function generateMotionRecap(options: MotionRecapOptions): Promise<string> {
   const { dayStates, onProgress } = options;
   
   if (dayStates.length === 0) throw new Error('No day states provided');
   if (dayStates.length < 3) throw new Error('Need at least 3 days for recap');
   
   console.log('[MotionRecap] Starting generation with', dayStates.length, 'days');
   onProgress?.(0, 'Loading assets...');
   
   // Load all images
   const images = await loadImages(dayStates);
   console.log('[MotionRecap] Assets loaded:', images.length);
   
   onProgress?.(10, 'Preparing canvas...');
   
   // Create canvas
   const canvas = document.createElement('canvas');
   canvas.width = WIDTH;
   canvas.height = HEIGHT;
   const ctx = canvas.getContext('2d', { willReadFrequently: true });
   if (!ctx) throw new Error('Failed to get canvas context');
   
   // Calculate total frames
   // ~2 seconds per day + intro settle + outro hold
   const framesPerDay = FRAMES.DAY_HOLD + FRAMES.ASSET_TRANSITION + FRAMES.OFFSET_ACTIVITY;
   const totalFrames = FRAMES.DAY_INTRO_SETTLE + (dayStates.length * framesPerDay) + FRAMES.DAY_OUTRO_HOLD;
   const durationSeconds = totalFrames / FPS;
   
   console.log('[MotionRecap] Total frames:', totalFrames, 'Duration:', durationSeconds.toFixed(1), 's');
   
   onProgress?.(15, 'Rendering frames...');
   
   // Pre-render all frames
   const frameDataUrls: string[] = [];
   
   for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
     renderFrame(ctx, frameIndex, dayStates, images, totalFrames);
     frameDataUrls.push(canvas.toDataURL('image/webp', 0.9));
     
     if (frameIndex % 5 === 0) {
       const progress = 15 + (frameIndex / totalFrames) * 55;
       const currentDay = Math.min(
         Math.floor((frameIndex - FRAMES.DAY_INTRO_SETTLE) / framesPerDay) + 1,
         dayStates.length
       );
       onProgress?.(Math.floor(progress), `Rendering Day ${Math.max(1, currentDay)}...`);
     }
   }
   
   console.log('[MotionRecap] All frames rendered:', frameDataUrls.length);
   onProgress?.(70, 'Encoding video...');
   
   // Encode video using MediaRecorder
   const stream = canvas.captureStream(FPS);
   
   const mimeTypes = [
     'video/webm;codecs=vp9',
     'video/webm;codecs=vp8',
     'video/webm',
   ];
   
   let selectedMimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
   console.log('[MotionRecap] Using codec:', selectedMimeType);
   
   const mediaRecorder = new MediaRecorder(stream, {
     mimeType: selectedMimeType,
     videoBitsPerSecond: 8000000, // 8 Mbps for quality
   });
   
  const chunks: Blob[] = [];
  let isComplete = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return new Promise((resolve, reject) => {
    // Safety timeout - if encoding takes more than 60 seconds, force complete
    const safetyTimeout = setTimeout(() => {
      if (!isComplete) {
        console.warn('[MotionRecap] Safety timeout reached, forcing completion');
        try {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        } catch (e) {
          console.error('[MotionRecap] Error stopping recorder:', e);
        }
      }
    }, 60000);
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    mediaRecorder.onstop = () => {
      isComplete = true;
      clearTimeout(safetyTimeout);
      console.log('[MotionRecap] Encoding complete, chunks:', chunks.length);
      const videoBlob = new Blob(chunks, { type: selectedMimeType.split(';')[0] });
      const url = URL.createObjectURL(videoBlob);
      console.log('[MotionRecap] Video URL:', url);
      onProgress?.(100, 'Complete!');
      resolve(url);
    };
    
    mediaRecorder.onerror = (e) => {
      isComplete = true;
      clearTimeout(safetyTimeout);
      console.error('[MotionRecap] MediaRecorder error:', e);
      reject(e);
    };
    
    mediaRecorder.start(100);
    
    // Play back pre-rendered frames
    let frameIndex = 0;
    const frameInterval = 1000 / FPS;
    
    const renderNextFrame = () => {
      if (isComplete) return; // Abort if already complete
      
      if (frameIndex >= frameDataUrls.length) {
        console.log('[MotionRecap] All frames played, stopping encoder');
        onProgress?.(98, 'Finalizing...');
        
        setTimeout(() => {
          if (!isComplete && mediaRecorder.state !== 'inactive') {
            console.log('[MotionRecap] Stopping encoder');
            try {
              mediaRecorder.stop();
            } catch (e) {
              console.error('[MotionRecap] Error stopping recorder:', e);
              // Force resolve if stop fails
              isComplete = true;
              clearTimeout(safetyTimeout);
              const videoBlob = new Blob(chunks, { type: selectedMimeType.split(';')[0] });
              resolve(URL.createObjectURL(videoBlob));
            }
          }
        }, 300);
        return;
      }
      
      const img = new Image();
      
      // Timeout for individual frame loading
      const frameTimeout = setTimeout(() => {
        console.warn('[MotionRecap] Frame load timeout, skipping frame:', frameIndex);
        frameIndex++;
        renderNextFrame();
      }, 500);
      
      img.onload = () => {
        clearTimeout(frameTimeout);
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
        
        frameIndex++;
        
        if (frameIndex % 15 === 0) {
          const progress = 70 + (frameIndex / frameDataUrls.length) * 25;
          onProgress?.(Math.floor(progress), 'Encoding video...');
        }
        
        // Use requestAnimationFrame for smoother playback
        timeoutId = setTimeout(renderNextFrame, frameInterval);
      };
      
      img.onerror = () => {
        clearTimeout(frameTimeout);
        console.warn('[MotionRecap] Frame load error, skipping:', frameIndex);
        frameIndex++;
        timeoutId = setTimeout(renderNextFrame, frameInterval);
      };
      
      img.src = frameDataUrls[frameIndex];
    };
    
    setTimeout(() => {
      console.log('[MotionRecap] Starting playback');
      renderNextFrame();
    }, 100);
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
   return photos.map((photo, index) => {
     // Determine metric labels based on activity type
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
 
 export { WIDTH, HEIGHT, FPS, FRAMES };