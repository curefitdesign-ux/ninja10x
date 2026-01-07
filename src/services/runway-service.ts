const RUNWAY_API_URL = 'https://api.dev.runwayml.com/v1';

interface RunwayTaskResponse {
  id: string;
  status: string;
  output?: string[] | string;
  error?: string;
}

/**
 * Generate a video using RunwayML's image_to_video API
 * Returns the task ID for polling
 */
export async function generateRunwayVideo(
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
