/**
 * Local Recap Video Generator
  * Creates animated fitness recap videos with day cards and transitions
  * Uses WebM encoding via MediaRecorder with frame-by-frame rendering
 */

export interface RecapPhoto {
  imageUrl: string;
  activity: string;
  duration?: string;
  distance?: string;
  pr?: string;
  dayNumber: number;
  isVideo?: boolean;
}

export interface RecapOptions {
  photos: RecapPhoto[];
  onProgress?: (percent: number, phase: string) => void;
}

interface AnimationKeyframe {
  type: 'data-card' | 'transition' | 'media';
  photoIndex: number;
  progress: number; // 0-1 within this keyframe
}

// Timing configuration (in seconds)
const DATA_CARD_DURATION = 1.5;
const TRANSITION_DURATION = 0.8;
const MEDIA_DURATION = 2.5;
 const FPS = 24; // Lower FPS for better browser compatibility
const WIDTH = 720;
const HEIGHT = 1280;

// Color palette
const COLORS = {
  background: '#0a0a0a',
  cardBg: 'rgba(20, 20, 20, 0.95)',
  accent: '#22c55e', // emerald-500
  accentGlow: 'rgba(34, 197, 94, 0.3)',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(255, 255, 255, 0.1)',
};

// Font configuration
const FONTS = {
  display: 'bold 72px "SF Pro Display", -apple-system, sans-serif',
  metric: 'bold 48px "SF Pro Display", -apple-system, sans-serif',
  label: '500 24px "SF Pro Display", -apple-system, sans-serif',
  day: 'bold 32px "SF Pro Display", -apple-system, sans-serif',
};

// Preload images
async function loadImages(photos: RecapPhoto[]): Promise<HTMLImageElement[]> {
  return Promise.all(
    photos.map(
      (photo) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => {
            // Create placeholder on error
            const canvas = document.createElement('canvas');
            canvas.width = WIDTH;
            canvas.height = HEIGHT;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = COLORS.background;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            const placeholderImg = new Image();
            placeholderImg.src = canvas.toDataURL();
            placeholderImg.onload = () => resolve(placeholderImg);
          };
          img.src = photo.imageUrl;
        })
    )
  );
}

// Draw image with cover mode
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.width / img.height;
  const canvasRatio = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;

  if (imgRatio > canvasRatio) {
    sw = img.height * canvasRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / canvasRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// Easing functions
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// Draw animated data card
function drawDataCard(
  ctx: CanvasRenderingContext2D,
  photo: RecapPhoto,
  animationProgress: number, // 0-1, how revealed the card is
  w: number,
  h: number
) {
  // Background with subtle gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#0f0f0f');
  gradient.addColorStop(1, '#050505');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Animated elements with staggered reveals
  const dayProgress = easeOutBack(Math.min(1, animationProgress * 2));
  const activityProgress = easeOutCubic(Math.min(1, Math.max(0, (animationProgress - 0.15) * 2)));
  const metricsProgress = easeOutCubic(Math.min(1, Math.max(0, (animationProgress - 0.3) * 2)));

  // Center card container
  const cardWidth = w * 0.85;
  const cardHeight = h * 0.5;
  const cardX = (w - cardWidth) / 2;
  const cardY = (h - cardHeight) / 2;

  // Card background with glass effect
  ctx.save();
  ctx.globalAlpha = activityProgress;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 32);
  ctx.fillStyle = COLORS.cardBg;
  ctx.fill();
  
  // Card border with glow
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Accent glow at top
  const glowGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + 100);
  glowGradient.addColorStop(0, COLORS.accentGlow);
  glowGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGradient;
  ctx.fill();
  ctx.restore();

  // Day label with animated entry
  ctx.save();
  const dayY = cardY + 80;
  ctx.globalAlpha = dayProgress;
  ctx.translate(w / 2, dayY);
  ctx.scale(dayProgress, dayProgress);
  
  ctx.font = FONTS.day;
  ctx.fillStyle = COLORS.accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`DAY ${photo.dayNumber}`, 0, 0);
  ctx.restore();

  // Activity name
  ctx.save();
  const activityY = cardY + 160;
  ctx.globalAlpha = activityProgress;
  ctx.translate(w / 2, activityY);
  const activityScale = 0.8 + activityProgress * 0.2;
  ctx.scale(activityScale, activityScale);
  
  ctx.font = FONTS.display;
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(photo.activity?.toUpperCase() || 'WORKOUT', 0, 0);
  ctx.restore();

  // Metrics container
  const metrics: { label: string; value: string }[] = [];
  if (photo.duration) metrics.push({ label: 'DURATION', value: photo.duration });
  if (photo.distance) metrics.push({ label: 'DISTANCE', value: photo.distance });
  if (photo.pr) metrics.push({ label: 'PR', value: photo.pr });

  if (metrics.length > 0) {
    const metricStartY = cardY + 280;
    const metricSpacing = 90;

    metrics.forEach((metric, index) => {
      const metricDelay = index * 0.15;
      const metricProgress = easeOutCubic(Math.min(1, Math.max(0, (metricsProgress - metricDelay) * 2)));
      
      ctx.save();
      const metricY = metricStartY + index * metricSpacing;
      ctx.globalAlpha = metricProgress;
      ctx.translate(w / 2, metricY);
      const slideX = (1 - metricProgress) * 50;
      ctx.translate(slideX, 0);

      // Label
      ctx.font = FONTS.label;
      ctx.fillStyle = COLORS.textMuted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(metric.label, 0, 0);

      // Value
      ctx.font = FONTS.metric;
      ctx.fillStyle = COLORS.text;
      ctx.fillText(metric.value, 0, 45);
      
      ctx.restore();
    });
  }

  // Decorative animated ring
  ctx.save();
  ctx.globalAlpha = activityProgress * 0.3;
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const ringRadius = 200 + Math.sin(animationProgress * Math.PI * 2) * 10;
  ctx.arc(w / 2, h / 2, ringRadius, 0, Math.PI * 2 * animationProgress);
  ctx.stroke();
  ctx.restore();
}

// Draw transition from data card to media
function drawTransition(
  ctx: CanvasRenderingContext2D,
  photo: RecapPhoto,
  img: HTMLImageElement,
  progress: number, // 0-1
  w: number,
  h: number
) {
  const easedProgress = easeInOutQuad(progress);
  
  // Background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, w, h);

  // Zoom and fade in the image
  const scale = 1.2 - easedProgress * 0.2; // Start zoomed, end at 1.0
  const imageOpacity = easedProgress;
  
  ctx.save();
  ctx.globalAlpha = imageOpacity;
  ctx.translate(w / 2, h / 2);
  ctx.scale(scale, scale);
  drawImageCover(ctx, img, -w / 2, -h / 2, w, h);
  ctx.restore();

  // Circular reveal mask
  if (progress < 0.7) {
    const maskProgress = progress / 0.7;
    const maxRadius = Math.sqrt(w * w + h * h);
    const currentRadius = maxRadius * maskProgress;
    
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, currentRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Day badge overlay that fades out
  if (progress < 0.5) {
    const badgeOpacity = 1 - progress * 2;
    ctx.save();
    ctx.globalAlpha = badgeOpacity;
    
    // Badge background
    const badgeWidth = 200;
    const badgeHeight = 60;
    const badgeX = (w - badgeWidth) / 2;
    const badgeY = h * 0.15;
    
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 30);
    ctx.fillStyle = COLORS.accent;
    ctx.fill();
    
    ctx.font = FONTS.day;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`DAY ${photo.dayNumber}`, w / 2, badgeY + badgeHeight / 2);
    ctx.restore();
  }
}

// Draw the media with subtle motion
function drawMedia(
  ctx: CanvasRenderingContext2D,
  photo: RecapPhoto,
  img: HTMLImageElement,
  progress: number,
  w: number,
  h: number
) {
  // Subtle Ken Burns effect
  const breathe = Math.sin(progress * Math.PI) * 0.02;
  const scale = 1.0 + breathe;
  const panX = Math.sin(progress * Math.PI * 0.5) * 15;
  const panY = Math.cos(progress * Math.PI * 0.5) * 10;
  
  ctx.save();
  ctx.translate(w / 2 + panX, h / 2 + panY);
  ctx.scale(scale, scale);
  drawImageCover(ctx, img, -w / 2, -h / 2, w, h);
  ctx.restore();

  // Minimal overlay with day info
  ctx.save();
  
  // Bottom gradient for text legibility
  const bottomGradient = ctx.createLinearGradient(0, h * 0.7, 0, h);
  bottomGradient.addColorStop(0, 'transparent');
  bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
  ctx.fillStyle = bottomGradient;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);

  // Day and activity text
  const textY = h - 100;
  ctx.font = FONTS.day;
  ctx.fillStyle = COLORS.accent;
  ctx.textAlign = 'center';
  ctx.fillText(`DAY ${photo.dayNumber}`, w / 2, textY);
  
  ctx.font = FONTS.label;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(photo.activity?.toUpperCase() || '', w / 2, textY + 40);
  
  ctx.restore();

  // Subtle vignette
  const vignette = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

// Calculate which keyframe we're on based on frame number
function getKeyframe(frameIndex: number, totalPhotos: number, fps: number): AnimationKeyframe {
  const dataCardFrames = Math.floor(DATA_CARD_DURATION * fps);
  const transitionFrames = Math.floor(TRANSITION_DURATION * fps);
  const mediaFrames = Math.floor(MEDIA_DURATION * fps);
  const framesPerPhoto = dataCardFrames + transitionFrames + mediaFrames;
  
  const photoIndex = Math.floor(frameIndex / framesPerPhoto);
  const frameInPhoto = frameIndex % framesPerPhoto;
  
  if (photoIndex >= totalPhotos) {
    return { type: 'media', photoIndex: totalPhotos - 1, progress: 1 };
  }
  
  if (frameInPhoto < dataCardFrames) {
    return { type: 'data-card', photoIndex, progress: frameInPhoto / dataCardFrames };
  } else if (frameInPhoto < dataCardFrames + transitionFrames) {
    return { type: 'transition', photoIndex, progress: (frameInPhoto - dataCardFrames) / transitionFrames };
  } else {
    return { type: 'media', photoIndex, progress: (frameInPhoto - dataCardFrames - transitionFrames) / mediaFrames };
  }
}

/**
 * Generate a local recap video with animated data cards and transitions
 * Returns a Blob URL to the final video
 */
export async function generateLocalRecap(options: RecapOptions): Promise<string> {
  const { photos, onProgress } = options;

  if (photos.length === 0) throw new Error('No photos provided');

   console.log('[LocalRecap] Starting generation with', photos.length, 'photos');
  onProgress?.(0, 'Loading images...');

  // Load all images
  const images = await loadImages(photos);
   console.log('[LocalRecap] Images loaded:', images.length);

  onProgress?.(10, 'Preparing animation...');

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to get canvas context');

  // Calculate total frames
  const dataCardFrames = Math.floor(DATA_CARD_DURATION * FPS);
  const transitionFrames = Math.floor(TRANSITION_DURATION * FPS);
  const mediaFrames = Math.floor(MEDIA_DURATION * FPS);
  const framesPerPhoto = dataCardFrames + transitionFrames + mediaFrames;
  const totalFrames = photos.length * framesPerPhoto;
   
   console.log('[LocalRecap] Total frames to render:', totalFrames);

  onProgress?.(15, 'Rendering frames...');

   // Collect all rendered frames as image data first
   const frameDataUrls: string[] = [];
   
   // Render all frames synchronously to avoid timing issues
   for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
     const keyframe = getKeyframe(frameIndex, photos.length, FPS);
     const photo = photos[keyframe.photoIndex];
     const img = images[keyframe.photoIndex];
 
     // Clear canvas
     ctx.clearRect(0, 0, WIDTH, HEIGHT);
 
     // Render based on keyframe type
     switch (keyframe.type) {
       case 'data-card':
         drawDataCard(ctx, photo, keyframe.progress, WIDTH, HEIGHT);
         break;
       case 'transition':
         drawTransition(ctx, photo, img, keyframe.progress, WIDTH, HEIGHT);
         break;
       case 'media':
         drawMedia(ctx, photo, img, keyframe.progress, WIDTH, HEIGHT);
         break;
     }
 
     // Store frame as data URL
     frameDataUrls.push(canvas.toDataURL('image/webp', 0.85));
 
     // Progress update
     if (frameIndex % 5 === 0) {
       const progress = 15 + (frameIndex / totalFrames) * 60;
       const currentDay = keyframe.photoIndex + 1;
       onProgress?.(Math.floor(progress), `Rendering Day ${currentDay}...`);
     }
   }
 
   console.log('[LocalRecap] All frames rendered:', frameDataUrls.length);
   onProgress?.(75, 'Encoding video...');
 
   // Now use MediaRecorder to encode video by playing back frames
  const stream = canvas.captureStream(FPS);
   
   // Check for supported mimeTypes
   const mimeTypes = [
     'video/webm;codecs=vp9',
     'video/webm;codecs=vp8',
     'video/webm',
     'video/mp4',
   ];
   
   let selectedMimeType = '';
   for (const mimeType of mimeTypes) {
     if (MediaRecorder.isTypeSupported(mimeType)) {
       selectedMimeType = mimeType;
       console.log('[LocalRecap] Using mimeType:', mimeType);
       break;
     }
   }
   
   if (!selectedMimeType) {
     console.warn('[LocalRecap] No supported video mimeType found, using default');
     selectedMimeType = 'video/webm';
   }
 
  const mediaRecorder = new MediaRecorder(stream, {
     mimeType: selectedMimeType,
     videoBitsPerSecond: 5000000,
  });

  const chunks: Blob[] = [];

  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
       console.log('[LocalRecap] MediaRecorder stopped, chunks:', chunks.length);
       const videoBlob = new Blob(chunks, { type: selectedMimeType.split(';')[0] });
      const url = URL.createObjectURL(videoBlob);
       console.log('[LocalRecap] Video URL created:', url);
      onProgress?.(100, 'Complete!');
      resolve(url);
    };

     mediaRecorder.onerror = (e) => {
       console.error('[LocalRecap] MediaRecorder error:', e);
       reject(e);
     };

     // Start recording with timeslice to get data periodically
     mediaRecorder.start(100);

     // Play back pre-rendered frames
    let frameIndex = 0;
    const frameInterval = 1000 / FPS;

    const renderNextFrame = () => {
       if (frameIndex >= frameDataUrls.length) {
         // Add a small delay before stopping to ensure all frames are captured
         setTimeout(() => {
           console.log('[LocalRecap] Stopping MediaRecorder');
        mediaRecorder.stop();
         }, 200);
        return;
      }

       // Draw frame from pre-rendered data URL
       const img = new Image();
       img.onload = () => {
         ctx.clearRect(0, 0, WIDTH, HEIGHT);
         ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
         
         frameIndex++;
         
         // Progress update during playback
         if (frameIndex % 10 === 0) {
           const progress = 75 + (frameIndex / frameDataUrls.length) * 20;
           onProgress?.(Math.floor(progress), 'Encoding video...');
         }
         
         setTimeout(renderNextFrame, frameInterval);
       };
       img.onerror = () => {
         console.error('[LocalRecap] Failed to load frame', frameIndex);
         frameIndex++;
         setTimeout(renderNextFrame, frameInterval);
       };
       img.src = frameDataUrls[frameIndex];
     };
 
     // Small delay to ensure MediaRecorder is ready
     setTimeout(() => {
       console.log('[LocalRecap] Starting frame playback');
       renderNextFrame();
     }, 100);
   });
      }

export { WIDTH, HEIGHT, FPS };
