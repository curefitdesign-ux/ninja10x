/**
 * Replicate API Service for Image-to-Video Generation
 * Uses Stable Video Diffusion for high-quality video generation
 */

const REPLICATE_API_URL = 'https://api.replicate.com/v1';

export interface DayData {
  dayNumber: number;
  activity: string;
  imageUrl: string;
  file?: File;
  mediaType: 'image' | 'video';
  distanceKm?: number;
  durationMinutes?: number;
  calories?: number;
}

export interface GenerationResult {
  dayNumber: number;
  activity: string;
  imageUrl: string;
  videoUrl: string;
  taskId: string;
  metadata: {
    distanceKm?: number;
    durationMinutes?: number;
    calories?: number;
  };
}

/**
 * Convert a File to base64 data URL
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Fetch any URL and convert to base64 data URL
 */
export async function urlToBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  
  const response = await fetch(url);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Start a video generation prediction using Replicate's Stable Video Diffusion
 */
export async function startVideoGeneration(
  imageUrl: string,
  apiKey: string
): Promise<string> {
  // Convert to base64 if needed
  const base64Image = await urlToBase64(imageUrl);
  
  console.log(`Starting Replicate prediction, image length: ${base64Image.length}`);

  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Stable Video Diffusion model - generates 25 frames (about 3 sec at 8fps)
      version: 'dc7b5c7e0c2b1d7d3e0f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
      input: {
        input_image: base64Image,
        video_length: 'short', // ~3 seconds
        sizing_strategy: 'maintain_aspect_ratio',
        motion_bucket_id: 127, // Higher = more motion
        cond_aug: 0.02,
        decoding_t: 7,
        seed: Math.floor(Math.random() * 1000000),
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Replicate API error:', errorText);
    
    if (response.status === 401) {
      throw new Error('Invalid Replicate API key');
    }
    if (response.status === 422) {
      // Try alternative model if first one fails
      return await startVideoGenerationAlternative(base64Image, apiKey);
    }
    
    throw new Error(`Replicate API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.id) {
    throw new Error('No prediction ID returned');
  }

  console.log(`Prediction started: ${data.id}`);
  return data.id;
}

/**
 * Alternative model - AnimateDiff for motion generation
 */
async function startVideoGenerationAlternative(
  base64Image: string,
  apiKey: string
): Promise<string> {
  console.log('Trying alternative model: AnimateDiff');
  
  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // AnimateDiff with image input
      version: '5b7e9e9e0c2b1d7d3e0f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
      input: {
        image: base64Image,
        prompt: 'cinematic motion, smooth camera movement, high quality',
        num_frames: 24,
        fps: 8,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Alternative model error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Poll for prediction completion
 */
export async function pollPrediction(
  predictionId: string,
  apiKey: string,
  onStatusChange?: (status: string) => void,
  maxAttempts = 120,
  intervalMs = 3000
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${REPLICATE_API_URL}/predictions/${predictionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check prediction: ${response.status}`);
    }

    const prediction = await response.json();
    const status = prediction.status;
    
    onStatusChange?.(status);

    if (status === 'succeeded') {
      const output = prediction.output;
      // Output can be string URL or array of URLs
      const videoUrl = Array.isArray(output) ? output[0] : output;
      
      if (!videoUrl) {
        throw new Error('No video URL in completed prediction');
      }
      
      return videoUrl;
    }

    if (status === 'failed' || status === 'canceled') {
      throw new Error(prediction.error || `Prediction ${status}`);
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error('Timeout waiting for video generation');
}

/**
 * Generate videos for all days
 */
export async function generateVideosForAllDays(
  days: DayData[],
  apiKey: string,
  onProgress?: (completed: number, total: number, result?: GenerationResult) => void
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];
  
  const imageDays = days.filter(d => d.mediaType === 'image');
  const videoDays = days.filter(d => d.mediaType === 'video');
  
  const total = days.length;
  let completed = 0;

  console.log(`=== REPLICATE GENERATION START ===`);
  console.log(`Total days: ${total}, Images: ${imageDays.length}, Videos: ${videoDays.length}`);

  // Process images through Replicate
  for (const day of imageDays) {
    console.log(`\n--- Processing Day ${day.dayNumber}: ${day.activity} ---`);
    
    try {
      let imageUrl = day.imageUrl;
      
      if (day.file) {
        console.log(`Converting file to base64...`);
        imageUrl = await fileToBase64(day.file);
      }
      
      const predictionId = await startVideoGeneration(imageUrl, apiKey);
      console.log(`Prediction ID: ${predictionId}`);
      
      const videoUrl = await pollPrediction(predictionId, apiKey, (status) => {
        console.log(`Day ${day.dayNumber} status: ${status}`);
      });
      
      console.log(`✓ Day ${day.dayNumber} complete`);
      
      const result: GenerationResult = {
        dayNumber: day.dayNumber,
        activity: day.activity,
        imageUrl: day.imageUrl,
        videoUrl,
        taskId: predictionId,
        metadata: {
          distanceKm: day.distanceKm,
          durationMinutes: day.durationMinutes,
          calories: day.calories,
        },
      };
      
      results.push(result);
      completed++;
      onProgress?.(completed, total, result);
      
      // Delay between requests
      if (imageDays.indexOf(day) < imageDays.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`✗ Failed Day ${day.dayNumber}:`, error);
      throw error;
    }
  }

  // Pass through videos directly
  for (const day of videoDays) {
    console.log(`\n--- Day ${day.dayNumber}: VIDEO pass-through ---`);
    
    const result: GenerationResult = {
      dayNumber: day.dayNumber,
      activity: day.activity,
      imageUrl: day.imageUrl,
      videoUrl: day.imageUrl,
      taskId: 'original-video',
      metadata: {
        distanceKm: day.distanceKm,
        durationMinutes: day.durationMinutes,
        calories: day.calories,
      },
    };
    
    results.push(result);
    completed++;
    onProgress?.(completed, total, result);
  }

  results.sort((a, b) => a.dayNumber - b.dayNumber);
  
  console.log(`\n=== GENERATION COMPLETE: ${results.length} videos ===`);
  
  return results;
}

/**
 * Validate Replicate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  // Replicate keys start with r8_ and are about 40 chars
  return key.startsWith('r8_') && key.length > 20;
}
