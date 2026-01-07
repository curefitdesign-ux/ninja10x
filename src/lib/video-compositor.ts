/**
 * Frontend Video Compositor
 * Creates montage videos from multiple images with transitions, film grain, and effects
 */

export interface CompositorPhoto {
  imageUrl: string;
  activity?: string;
  dayNumber?: number;
}

export interface CompositorOptions {
  photos: CompositorPhoto[];
  durationPerPhoto?: number; // seconds per photo
  transitionDuration?: number; // seconds for transition
  fps?: number;
  width?: number;
  height?: number;
  style?: 'brutalist' | 'neon' | 'vintage' | 'minimal' | 'grunge';
  onProgress?: (percent: number, phase: string) => void;
}

type TransitionType = 'glitch' | 'flash' | 'slide' | 'zoom' | 'split';

const TRANSITION_TYPES: TransitionType[] = ['glitch', 'flash', 'slide', 'zoom', 'split'];

// Preload images
async function loadImages(urls: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        })
    )
  );
}

// Draw image to fill canvas (cover mode)
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

// Apply film grain effect
function applyFilmGrain(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number = 0.15) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const grainAmount = intensity * 255;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * grainAmount;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }

  ctx.putImageData(imageData, 0, 0);
}

// Apply vignette effect
function applyVignette(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number = 0.4) {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

// Apply high contrast B&W with color flash
function applyBrutalistStyle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  flashIntensity: number = 0
) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale with high contrast
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const contrast = 1.5;
    const adjusted = ((gray / 255 - 0.5) * contrast + 0.5) * 255;
    const clamped = Math.min(255, Math.max(0, adjusted));

    // Mix in yellow flash
    data[i] = Math.min(255, clamped + flashIntensity * 255); // R
    data[i + 1] = Math.min(255, clamped + flashIntensity * 200); // G
    data[i + 2] = clamped * (1 - flashIntensity * 0.8); // B
  }

  ctx.putImageData(imageData, 0, 0);
}

// Glitch effect
function applyGlitch(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
  if (intensity < 0.1) return;

  const sliceCount = Math.floor(5 + Math.random() * 10);
  const imageData = ctx.getImageData(0, 0, w, h);

  for (let i = 0; i < sliceCount; i++) {
    const y = Math.floor(Math.random() * h);
    const sliceHeight = Math.floor(5 + Math.random() * 30);
    const offset = Math.floor((Math.random() - 0.5) * intensity * 100);

    const slice = ctx.getImageData(0, y, w, Math.min(sliceHeight, h - y));
    ctx.putImageData(slice, offset, y);
  }

  // RGB shift
  const rgbShift = Math.floor(intensity * 10);
  if (rgbShift > 0) {
    const shifted = ctx.getImageData(0, 0, w, h);
    const original = ctx.getImageData(0, 0, w, h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const redIdx = (y * w + Math.min(w - 1, x + rgbShift)) * 4;
        const blueIdx = (y * w + Math.max(0, x - rgbShift)) * 4;

        shifted.data[idx] = original.data[redIdx]; // R from right
        shifted.data[idx + 2] = original.data[blueIdx + 2]; // B from left
      }
    }

    ctx.putImageData(shifted, 0, 0);
  }
}

// Render a single frame
function renderFrame(
  ctx: CanvasRenderingContext2D,
  images: HTMLImageElement[],
  frameIndex: number,
  totalFrames: number,
  framesPerPhoto: number,
  transitionFrames: number,
  w: number,
  h: number,
  style: string
) {
  const photoCount = images.length;
  const effectiveFramesPerPhoto = framesPerPhoto + transitionFrames;
  
  // Calculate which photo we're on and position within that photo
  const currentPhotoIndex = Math.floor(frameIndex / effectiveFramesPerPhoto);
  const frameInPhoto = frameIndex % effectiveFramesPerPhoto;
  
  const safePhotoIndex = Math.min(currentPhotoIndex, photoCount - 1);
  const nextPhotoIndex = Math.min(safePhotoIndex + 1, photoCount - 1);
  
  const isInTransition = frameInPhoto >= framesPerPhoto && safePhotoIndex < photoCount - 1;
  const transitionProgress = isInTransition 
    ? (frameInPhoto - framesPerPhoto) / transitionFrames 
    : 0;

  // Clear
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  if (isInTransition) {
    // Pick a transition type
    const transitionType = TRANSITION_TYPES[safePhotoIndex % TRANSITION_TYPES.length];
    
    switch (transitionType) {
      case 'glitch':
        drawImageCover(ctx, images[safePhotoIndex], 0, 0, w, h);
        applyGlitch(ctx, w, h, transitionProgress);
        if (transitionProgress > 0.5) {
          ctx.globalAlpha = (transitionProgress - 0.5) * 2;
          drawImageCover(ctx, images[nextPhotoIndex], 0, 0, w, h);
          ctx.globalAlpha = 1;
        }
        break;

      case 'flash':
        if (transitionProgress < 0.3) {
          drawImageCover(ctx, images[safePhotoIndex], 0, 0, w, h);
          ctx.fillStyle = `rgba(250,204,21,${transitionProgress / 0.3})`;
          ctx.fillRect(0, 0, w, h);
        } else if (transitionProgress < 0.5) {
          ctx.fillStyle = '#FACC15';
          ctx.fillRect(0, 0, w, h);
        } else {
          drawImageCover(ctx, images[nextPhotoIndex], 0, 0, w, h);
          const fade = 1 - (transitionProgress - 0.5) / 0.5;
          ctx.fillStyle = `rgba(250,204,21,${fade * 0.5})`;
          ctx.fillRect(0, 0, w, h);
        }
        break;

      case 'slide':
        const slideOffset = transitionProgress * w;
        drawImageCover(ctx, images[safePhotoIndex], -slideOffset, 0, w, h);
        drawImageCover(ctx, images[nextPhotoIndex], w - slideOffset, 0, w, h);
        break;

      case 'zoom':
        const scale = 1 + transitionProgress * 0.5;
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(scale, scale);
        ctx.globalAlpha = 1 - transitionProgress;
        drawImageCover(ctx, images[safePhotoIndex], -w / 2, -h / 2, w, h);
        ctx.restore();
        ctx.globalAlpha = transitionProgress;
        drawImageCover(ctx, images[nextPhotoIndex], 0, 0, w, h);
        ctx.globalAlpha = 1;
        break;

      case 'split':
        // Horizontal split
        const splitY = h * transitionProgress;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, w, h - splitY);
        ctx.clip();
        drawImageCover(ctx, images[safePhotoIndex], 0, 0, w, h);
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, h - splitY, w, splitY);
        ctx.clip();
        drawImageCover(ctx, images[nextPhotoIndex], 0, 0, w, h);
        ctx.restore();
        break;
    }
  } else {
    // Regular frame with subtle motion
    const breathe = Math.sin((frameInPhoto / framesPerPhoto) * Math.PI * 2) * 0.02;
    const scale = 1.05 + breathe;
    const offsetX = (1 - scale) * w / 2;
    const offsetY = (1 - scale) * h / 2;
    
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(scale, scale);
    drawImageCover(ctx, images[safePhotoIndex], -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  // Apply style effects
  if (style === 'brutalist') {
    const flashIntensity = isInTransition && transitionProgress > 0.4 && transitionProgress < 0.6 ? 0.3 : 0;
    applyBrutalistStyle(ctx, w, h, flashIntensity);
    applyFilmGrain(ctx, w, h, 0.12);
  } else if (style === 'vintage') {
    // Sepia tone
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }
    ctx.putImageData(imageData, 0, 0);
    applyFilmGrain(ctx, w, h, 0.2);
  } else if (style === 'grunge') {
    // Desaturate
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = data[i] * 0.5 + avg * 0.5;
      data[i + 1] = data[i + 1] * 0.5 + avg * 0.5;
      data[i + 2] = data[i + 2] * 0.5 + avg * 0.5;
    }
    ctx.putImageData(imageData, 0, 0);
    applyFilmGrain(ctx, w, h, 0.25);
  } else if (style === 'neon') {
    // Boost contrast and saturation
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * 1.2);
      data[i + 1] = Math.min(255, data[i + 1] * 1.1);
      data[i + 2] = Math.min(255, data[i + 2] * 1.3);
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // Always add vignette
  applyVignette(ctx, w, h, 0.5);

  // Add scanlines for extra grit
  ctx.fillStyle = 'rgba(0,0,0,0.03)';
  for (let y = 0; y < h; y += 4) {
    ctx.fillRect(0, y, w, 2);
  }
}

/**
 * Compose a video from photos using Canvas
 * Returns a Blob URL to the final video
 */
export async function composeVideo(options: CompositorOptions): Promise<string> {
  const {
    photos,
    durationPerPhoto = 1.5,
    transitionDuration = 0.3,
    fps = 24,
    width = 720,
    height = 1280,
    style = 'brutalist',
    onProgress,
  } = options;

  if (photos.length === 0) throw new Error('No photos provided');

  onProgress?.(0, 'Loading images...');

  // Load all images
  const imageUrls = photos.map((p) => p.imageUrl);
  const images = await loadImages(imageUrls);

  onProgress?.(10, 'Preparing canvas...');

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to get canvas context');

  // Calculate frames
  const framesPerPhoto = Math.floor(fps * durationPerPhoto);
  const transitionFrames = Math.floor(fps * transitionDuration);
  const totalFrames = photos.length * framesPerPhoto + (photos.length - 1) * transitionFrames;

  onProgress?.(15, 'Rendering frames...');

  // Capture frames
  const frames: Blob[] = [];

  for (let i = 0; i < totalFrames; i++) {
    renderFrame(ctx, images, i, totalFrames, framesPerPhoto, transitionFrames, width, height, style);

    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/webp', 0.85);
    });
    frames.push(blob);

    if (i % 10 === 0) {
      const progress = 15 + (i / totalFrames) * 70;
      onProgress?.(progress, `Rendering frame ${i + 1}/${totalFrames}...`);
    }
  }

  onProgress?.(85, 'Encoding video...');

  // Use MediaRecorder with canvas stream to create video
  const stream = canvas.captureStream(fps);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 5000000,
  });

  const chunks: Blob[] = [];

  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(videoBlob);
      onProgress?.(100, 'Complete!');
      resolve(url);
    };

    mediaRecorder.onerror = (e) => reject(e);

    mediaRecorder.start();

    // Play through frames
    let frameIndex = 0;
    const frameInterval = 1000 / fps;

    const playFrames = () => {
      if (frameIndex >= frames.length) {
        mediaRecorder.stop();
        return;
      }

      // Redraw frame
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        frameIndex++;
        setTimeout(playFrames, frameInterval);
      };
      img.src = URL.createObjectURL(frames[frameIndex]);
    };

    playFrames();
  });
}
