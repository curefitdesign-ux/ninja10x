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
 * Generate a video from a single image using RunwayML's image_to_video API
 * Returns the task ID for polling
 */
export async function generateRunwayVideoFromImage(
  imageUrl: string,
  activityName: string,
  apiKey: string
): Promise<string> {
  const prompt = `Cinematic gritty handheld shot of a person ${activityName.toLowerCase()}, underground gym atmosphere, heavy film grain, high contrast, sweat, volumetric lighting, 4k, brutalist aesthetic.`;

  const response = await fetch(`${RUNWAY_API_URL}/image_to_video`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify({
      model: 'gen4_turbo',
      promptImage: imageUrl,
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
    if (response.status === 402) {
      throw new Error('Insufficient credits');
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
 * Processes sequentially and returns results with full metadata
 */
export async function generateVideosForAllDays(
  days: DayData[],
  apiKey: string,
  onProgress?: (completed: number, total: number, result?: GenerationResult) => void
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];
  const total = days.length;

  console.log(`Starting generation for ${total} days:`, days.map(d => ({ 
    day: d.dayNumber, 
    activity: d.activity,
    mediaType: d.mediaType,
    hasFile: !!d.file,
  })));

  // Process days sequentially to avoid rate limits
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    
    console.log(`Processing Day ${day.dayNumber}: ${day.activity} (${day.mediaType})`);
    
    try {
      // Convert file to base64 if available, otherwise use the URL
      let mediaUrl = day.imageUrl;
      
      if (day.file) {
        console.log(`Converting file to base64 for Day ${day.dayNumber}...`);
        mediaUrl = await fileToBase64(day.file);
        console.log(`Base64 conversion complete for Day ${day.dayNumber}, length: ${mediaUrl.length}`);
      }
      
      // For videos, we skip generation and use the original
      if (day.mediaType === 'video') {
        console.log(`Day ${day.dayNumber} is a video, using original`);
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
        onProgress?.(i + 1, total, result);
        continue;
      }
      
      // Generate video from this day's image
      console.log(`Sending to RunwayML for Day ${day.dayNumber}...`);
      const taskId = await generateRunwayVideoFromImage(mediaUrl, day.activity, apiKey);
      console.log(`Task created for Day ${day.dayNumber}: ${taskId}`);
      
      // Poll for completion
      const videoUrl = await pollTaskStatus(taskId, apiKey);
      console.log(`Video ready for Day ${day.dayNumber}: ${videoUrl}`);
      
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
      onProgress?.(i + 1, total, result);
    } catch (error) {
      console.error(`Failed to generate video for Day ${day.dayNumber}:`, error);
      throw error;
    }
  }

  console.log(`Generation complete! ${results.length} results:`, results);
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
 * Helper to check if an API key is valid format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return key.startsWith('rl_') && key.length > 10;
}
