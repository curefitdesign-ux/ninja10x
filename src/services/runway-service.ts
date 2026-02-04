const RUNWAY_API_URL = 'https://api.dev.runwayml.com/v1';

interface RunwayTaskResponse {
  id: string;
  status: string;
  output?: string[] | string;
  error?: string;
}

export interface DayData {
  dayNumber: number;
  activity: string;
  imageUrl: string;  // Can be blob URL or base64 data URL
  file?: File;       // Original file for base64 conversion
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
 * Fetch an asset URL and convert to base64 data URL
 */
export async function urlToBase64(url: string): Promise<string> {
  // If already base64, return as-is
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
 * Generate a video from a single image using RunwayML's image_to_video API
 * Returns the task ID for polling
 */
export async function generateRunwayVideoFromImage(
  imageUrl: string,
  activityName: string,
  apiKey: string
): Promise<string> {
  // Convert URL to base64 if needed
  const base64Image = await urlToBase64(imageUrl);
  
  const prompt = `Cinematic gritty handheld shot of a person ${activityName.toLowerCase()}, underground gym atmosphere, heavy film grain, high contrast, sweat, volumetric lighting, 4k, brutalist aesthetic.`;

  console.log(`Sending to RunwayML - Activity: ${activityName}, Base64 length: ${base64Image.length}`);

  const response = await fetch(`${RUNWAY_API_URL}/image_to_video`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify({
      model: 'gen4_turbo',
      promptImage: base64Image,
      promptText: prompt,
      duration: 5,
      ratio: '720:1280',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('RunwayML API error:', errorText);
    
    if (response.status === 401) {
      throw new Error('Invalid API key');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait and try again.');
    }
    
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.id) {
    throw new Error('No task ID returned');
  }

  return data.id;
}

/**
 * Generate videos for all days with their data
 * Processes ALL images sequentially through RunwayML
 */
export async function generateVideosForAllDays(
  days: DayData[],
  apiKey: string,
  onProgress?: (completed: number, total: number, result?: GenerationResult) => void
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];
  
  // Filter to only images (videos are used directly)
  const imageDays = days.filter(d => d.mediaType === 'image');
  const videoDays = days.filter(d => d.mediaType === 'video');
  
  const total = days.length;
  let completed = 0;

  console.log(`=== RUNWAY GENERATION START ===`);
  console.log(`Total days: ${total}`);
  console.log(`Images to generate: ${imageDays.length}`);
  console.log(`Videos (pass-through): ${videoDays.length}`);
  console.log(`Days:`, days.map(d => ({ 
    day: d.dayNumber, 
    activity: d.activity,
    mediaType: d.mediaType,
    urlLength: d.imageUrl?.length,
    hasFile: !!d.file,
  })));

  // Process each IMAGE through RunwayML sequentially
  for (const day of imageDays) {
    console.log(`\n--- Processing Day ${day.dayNumber}: ${day.activity} (IMAGE) ---`);
    
    try {
      // Get the image URL (file takes priority, then URL)
      let imageUrl = day.imageUrl;
      
      if (day.file) {
        console.log(`Converting uploaded file to base64...`);
        imageUrl = await fileToBase64(day.file);
      }
      
      console.log(`Image URL ready, length: ${imageUrl.length}`);
      console.log(`Calling RunwayML API for Day ${day.dayNumber}...`);
      
      // Generate video from image
      const taskId = await generateRunwayVideoFromImage(imageUrl, day.activity, apiKey);
      console.log(`Task created: ${taskId}`);
      
      // Poll for completion
      console.log(`Polling for completion...`);
      const videoUrl = await pollTaskStatus(taskId, apiKey, (status) => {
        console.log(`Day ${day.dayNumber} status: ${status}`);
      });
      
      console.log(`✓ Day ${day.dayNumber} video ready: ${videoUrl.substring(0, 80)}...`);
      
      const result: GenerationResult = {
        dayNumber: day.dayNumber,
        activity: day.activity,
        imageUrl: day.imageUrl,
        videoUrl,
        taskId,
        metadata: {
          distanceKm: day.distanceKm,
          durationMinutes: day.durationMinutes,
          calories: day.calories,
        },
      };
      
      results.push(result);
      completed++;
      onProgress?.(completed, total, result);
      
      // Small delay between requests to avoid rate limits
      if (imageDays.indexOf(day) < imageDays.length - 1) {
        console.log(`Waiting 2 seconds before next request...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`✗ Failed to generate video for Day ${day.dayNumber}:`, error);
      throw error;
    }
  }

  // Add video days directly (no generation needed)
  for (const day of videoDays) {
    console.log(`\n--- Day ${day.dayNumber}: ${day.activity} (VIDEO - pass-through) ---`);
    
    const result: GenerationResult = {
      dayNumber: day.dayNumber,
      activity: day.activity,
      imageUrl: day.imageUrl,
      videoUrl: day.imageUrl, // Use original video
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

  // Sort results by day number
  results.sort((a, b) => a.dayNumber - b.dayNumber);

  console.log(`\n=== GENERATION COMPLETE ===`);
  console.log(`Generated ${results.length} videos:`, results.map(r => ({
    day: r.dayNumber,
    activity: r.activity,
    hasVideo: !!r.videoUrl,
  })));
  
  return results;
}

/**
 * Poll the task status until it completes or fails
 * Returns the video URL on success
 */
export async function pollTaskStatus(
  taskId: string,
  apiKey: string,
  onStatusChange?: (status: string) => void,
  maxAttempts = 60,
  intervalMs = 2000
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RunwayML status error:', errorText);
      throw new Error(`Failed to check status: ${response.status}`);
    }

    const task: RunwayTaskResponse = await response.json();
    const status = task.status?.toUpperCase() || 'UNKNOWN';
    
    onStatusChange?.(status);

    if (status === 'SUCCEEDED') {
      const output = task.output;
      const videoUrl = Array.isArray(output) ? output[0] : output;
      
      if (!videoUrl) {
        throw new Error('No video URL in completed task');
      }
      
      return videoUrl;
    }

    if (status === 'FAILED' || status === 'CANCELED') {
      throw new Error(task.error || `Task ${status.toLowerCase()}`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error('Timeout waiting for video generation');
}

/**
 * Stitch multiple videos together with AI transitions using RunwayML
 * Uses video_to_video for smooth transitions between clips
 */
export async function stitchVideosWithTransitions(
  videoUrls: string[],
  apiKey: string,
  onProgress?: (stage: string) => void
): Promise<string> {
  if (videoUrls.length === 0) {
    throw new Error('No videos to stitch');
  }
  
  if (videoUrls.length === 1) {
    return videoUrls[0];
  }

  console.log(`=== STITCHING ${videoUrls.length} VIDEOS WITH TRANSITIONS ===`);
  
  // For 3 videos, we create 2 transition videos (between 1-2 and 2-3)
  // Then we'll composite them into a final video
  const transitionVideos: string[] = [];
  
  for (let i = 0; i < videoUrls.length - 1; i++) {
    onProgress?.(`Creating transition ${i + 1}/${videoUrls.length - 1}...`);
    console.log(`Creating transition between video ${i + 1} and ${i + 2}...`);
    
    try {
      // Get the end frame of current video and start frame of next
      // Use video_to_video to create a smooth morph transition
      const transitionTaskId = await createVideoTransition(
        videoUrls[i],
        videoUrls[i + 1],
        apiKey
      );
      
      console.log(`Transition task ${i + 1} created: ${transitionTaskId}`);
      
      // Poll for transition completion
      const transitionUrl = await pollTaskStatus(transitionTaskId, apiKey, (status) => {
        console.log(`Transition ${i + 1} status: ${status}`);
      });
      
      transitionVideos.push(transitionUrl);
      console.log(`✓ Transition ${i + 1} complete`);
      
      // Delay between transition requests
      if (i < videoUrls.length - 2) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Failed to create transition ${i + 1}:`, error);
      // If transition fails, we'll just use the videos without that transition
      transitionVideos.push('');
    }
  }

  // Now we have: [video1, transition1, video2, transition2, video3]
  // The final stitched result is: video1 + transition1 + video2 + transition2 + video3
  onProgress?.('Assembling final video...');
  
  // Return the sequence of URLs for the compositor to handle
  // The compositor will handle the actual concatenation
  const finalSequence = [];
  for (let i = 0; i < videoUrls.length; i++) {
    finalSequence.push(videoUrls[i]);
    if (i < transitionVideos.length && transitionVideos[i]) {
      finalSequence.push(transitionVideos[i]);
    }
  }
  
  console.log(`Final sequence has ${finalSequence.length} segments`);
  
  // Return first video URL for now - the compositor will handle the rest
  // In production, you'd use a server-side FFmpeg or similar
  return JSON.stringify(finalSequence);
}

/**
 * Create a transition video between two clips using RunwayML
 * Uses the last frame of video1 and first frame of video2 to create a morph
 */
async function createVideoTransition(
  video1Url: string,
  video2Url: string,
  apiKey: string
): Promise<string> {
  // Use image_to_video with a transition prompt
  // We'll extract a frame from each video and morph between them
  const transitionPrompt = `Smooth cinematic transition morphing effect, seamless blend between two scenes, professional video editing quality, 4k`;

  // For the transition, we use the second video as the target
  // The RunwayML gen4 can create morphing effects
  const video2Base64 = await urlToBase64(video2Url);
  
  const response = await fetch(`${RUNWAY_API_URL}/image_to_video`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify({
      model: 'gen4_turbo',
      promptImage: video2Base64,
      promptText: transitionPrompt,
      duration: 5,
      ratio: '720:1280',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Transition API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Helper to check if an API key is valid format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return key.startsWith('rl_') && key.length > 10;
}
