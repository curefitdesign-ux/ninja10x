import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
const MAX_PHOTOS = 30;
const MIN_PHOTOS = 3;
const MAX_STRING_LENGTH = 200;
const MAX_URL_LENGTH = 2000;
const MAX_TASK_ID_LENGTH = 100;

// Allowed voice IDs for ElevenLabs
const ALLOWED_VOICE_IDS = [
  "JBFqnCBsd6RMkjVDRZzb", // George
  "21m00Tcm4TlvDq8ikWAM", // Rachel
  "EXAVITQu4vr4xnSDxMaL", // Bella
];

interface PhotoData {
  id: string;
  imageUrl: string;
  activity: string;
  duration?: string;
  distance?: string;
  pr?: string;
  uploadDate: string;
  dayNumber: number;
  isVideo?: boolean;
}

interface GenerateReelRequest {
  photos?: PhotoData[];
  stylePrompt?: string;
  styleId?: string;
  action?: 'create' | 'status';
  taskId?: string;
}

// Validation functions
function validateString(value: unknown, maxLength: number, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
  }
  return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

function validateUrl(value: unknown, fieldName: string): string {
  const str = validateString(value, MAX_URL_LENGTH, fieldName);
  if (!str.startsWith('data:') && !str.startsWith('http://') && !str.startsWith('https://')) {
    throw new Error(`${fieldName} must be a valid URL`);
  }
  return str;
}

function validatePhoto(photo: unknown, index: number): PhotoData {
  if (!photo || typeof photo !== 'object') {
    throw new Error(`Photo ${index} is invalid`);
  }
  
  const p = photo as Record<string, unknown>;
  
  return {
    id: validateString(p.id, 100, `Photo ${index} id`),
    imageUrl: validateUrl(p.imageUrl, `Photo ${index} imageUrl`),
    activity: validateString(p.activity, 50, `Photo ${index} activity`),
    duration: p.duration ? validateString(p.duration, 50, `Photo ${index} duration`) : undefined,
    distance: p.distance ? validateString(p.distance, 50, `Photo ${index} distance`) : undefined,
    pr: p.pr ? validateString(p.pr, 100, `Photo ${index} pr`) : undefined,
    uploadDate: validateString(p.uploadDate, 50, `Photo ${index} uploadDate`),
    dayNumber: typeof p.dayNumber === 'number' && p.dayNumber >= 1 && p.dayNumber <= 365 
      ? p.dayNumber 
      : (() => { throw new Error(`Photo ${index} dayNumber must be between 1 and 365`); })(),
    isVideo: typeof p.isVideo === 'boolean' ? p.isVideo : false,
  };
}

function validateRequest(body: unknown): GenerateReelRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be an object');
  }
  
  const req = body as Record<string, unknown>;
  const result: GenerateReelRequest = {};
  
  if (req.action !== undefined) {
    if (req.action !== 'create' && req.action !== 'status') {
      throw new Error('action must be "create" or "status"');
    }
    result.action = req.action;
  }
  
  if (req.taskId !== undefined) {
    result.taskId = validateString(req.taskId, MAX_TASK_ID_LENGTH, 'taskId');
  }
  
  if (req.photos !== undefined) {
    if (!Array.isArray(req.photos)) {
      throw new Error('photos must be an array');
    }
    if (req.photos.length > MAX_PHOTOS) {
      throw new Error(`Maximum ${MAX_PHOTOS} photos allowed`);
    }
    result.photos = req.photos.map((p, i) => validatePhoto(p, i));
  }
  
  if (req.stylePrompt !== undefined) {
    result.stylePrompt = validateString(req.stylePrompt, MAX_STRING_LENGTH, 'stylePrompt');
  }
  if (req.styleId !== undefined) {
    result.styleId = validateString(req.styleId, 50, 'styleId');
  }
  
  return result;
}

// Authenticate user
async function authenticateRequest(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid Authorization header');
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('Auth error:', error?.message);
    throw new Error('Unauthorized: Invalid token');
  }

  return user.id;
}

// Generate simple narration locally (no external API needed)
function generateLocalNarration(photos: PhotoData[]): string {
  const totalDays = photos.length;
  const activities = [...new Set(photos.map(p => p.activity))];
  const hasPRs = photos.some(p => p.pr);
  const hasDuration = photos.some(p => p.duration);
  
  const activityList = activities.length === 1 
    ? activities[0] 
    : activities.slice(0, -1).join(', ') + ' and ' + activities.slice(-1);
  
  const phrases = [
    `${totalDays} days. ${activityList}. You showed up.`,
    `Day by day, rep by rep. ${activityList} conquered.`,
    `${totalDays} sessions logged. ${hasPRs ? 'Personal records crushed.' : 'Progress made.'}`,
    `No excuses. Just ${activityList}. Pure dedication.`,
    `Week ${Math.ceil(photos[0]?.dayNumber / 7) || 1} locked in. ${hasDuration ? 'Every minute counts.' : 'Every session counts.'}`,
  ];
  
  return phrases[Math.floor(Math.random() * phrases.length)];
}

serve(async (req) => {
  console.log("Generate fitness reel request received");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    let userId: string;
    try {
      userId = await authenticateRequest(req);
      console.log("Authenticated user:", userId);
    } catch (authError) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    let body: GenerateReelRequest;
    try {
      const rawBody = await req.json().catch(() => ({}));
      body = validateRequest(rawBody);
    } catch (validationError) {
      console.error("Validation failed:", validationError);
      return new Response(
        JSON.stringify({ error: validationError instanceof Error ? validationError.message : 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const action = body.action ?? (body.taskId ? 'status' : 'create');
    const RUNWAYML_API_KEY = Deno.env.get("RUNWAYML_API_KEY");

    // ---- Task status proxy ----
    if (action === 'status') {
      if (!RUNWAYML_API_KEY) throw new Error("RUNWAYML_API_KEY is not configured");
      if (!body.taskId) {
        return new Response(
          JSON.stringify({ error: 'taskId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const taskRes = await fetch(`https://api.dev.runwayml.com/v1/tasks/${body.taskId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${RUNWAYML_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06',
        },
      });

      const taskText = await taskRes.text();
      if (!taskRes.ok) {
        console.error('Runway task status error:', taskText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch task status' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const task = JSON.parse(taskText);
      const output = task?.output;
      const videoUrl = Array.isArray(output) ? output[0] : (typeof output === 'string' ? output : null);

      return new Response(
        JSON.stringify({ success: true, status: task?.status ?? 'UNKNOWN', videoUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ---- Create ----
    const { photos = [] } = body;

    if (photos.length < MIN_PHOTOS) {
      return new Response(
        JSON.stringify({ error: `At least ${MIN_PHOTOS} photos are required` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${photos.length} photos for user ${userId}`);

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!RUNWAYML_API_KEY) throw new Error("RUNWAYML_API_KEY is not configured");

    // Step 1: Generate narration locally (no external AI API needed)
    console.log("Step 1: Generating narration locally...");
    const narrationText = generateLocalNarration(photos);
    console.log("Generated narration:", narrationText);

    // Step 2: Generate voiceover audio with ElevenLabs (optional)
    console.log("Step 2: Generating voiceover with ElevenLabs...");
    
    let audioBase64: string | null = null;
    let audioSize = 0;

    if (ELEVENLABS_API_KEY) {
      try {
        const voiceId = ALLOWED_VOICE_IDS[0];
        const voiceResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: narrationText,
              model_id: "eleven_turbo_v2_5",
              voice_settings: {
                stability: 0.4,
                similarity_boost: 0.75,
                style: 0.6,
                use_speaker_boost: true,
                speed: 1.1,
              },
            }),
          }
        );

        if (voiceResponse.ok) {
          const audioBuffer = await voiceResponse.arrayBuffer();
          audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer).slice(0, 50000)));
          audioSize = audioBuffer.byteLength;
          console.log("Voiceover generated successfully, size:", audioSize);
        } else {
          const errorText = await voiceResponse.text();
          console.warn("ElevenLabs error (continuing without audio):", errorText);
        }
      } catch (voiceError) {
        console.warn("ElevenLabs failed (continuing without audio):", voiceError);
      }
    } else {
      console.log("ElevenLabs API key not configured, skipping voiceover");
    }

    // Step 3: Select best image for RunwayML
    console.log("Step 3: Selecting primary image for RunwayML...");
    
    const imagePhotos = photos.filter(p => !p.isVideo);
    const primaryPhoto = imagePhotos.length > 0 ? imagePhotos[0] : photos[0];
    const primaryPhotoUrl = primaryPhoto.imageUrl;
    
    console.log("Using primary image:", primaryPhotoUrl.substring(0, 80) + "...");
    
    // Step 4: Generate AI video with RunwayML
    // Following user's detailed spec: minimal motion, preserve original, clean fitness recap
    console.log("Step 4: Submitting to RunwayML for AI video generation...");
    
    // Build scene descriptions for each photo
    const sceneDescriptions = photos.map((p, i) => {
      const metrics: string[] = [];
      if (p.duration) metrics.push(`Duration: ${p.duration}`);
      if (p.distance) metrics.push(`Distance: ${p.distance}`);
      if (p.pr) metrics.push(`PR: ${p.pr}`);
      const metricsStr = metrics.length > 0 ? metrics.join(', ') : p.activity;
      return `Day ${p.dayNumber}: ${p.activity}${metrics.length > 0 ? ' - ' + metricsStr : ''}`;
    }).join('. ');
    
    // Clean, minimal fitness recap prompt per user's spec
    const runwayPrompt = `Create a short vertical fitness recap video. 
Style: Clean, minimal, premium fitness recap. Very subtle motion only.
Do NOT change faces, body, background, clothing, or environment.
Preserve the original photo exactly. No stylization, no cinematic effects, no filters.

Motion: Gentle camera push-in or slight parallax. Soft floating motion. No aggressive movement. No zoom jumps. No scene distortion.

This is a weekly progress recap showing: ${sceneDescriptions}

Typography style: Modern, clean, bold numbers. Minimal text. High contrast. Text must remain sharp and readable.
Transitions: Simple fade or soft dissolve. No flashy transitions.
Overall: Looks like a weekly progress recap. Professional product-style video. Designed for mobile apps.`;

    console.log("RunwayML prompt:", runwayPrompt.substring(0, 200) + "...");

    const runwayResponse = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RUNWAYML_API_KEY}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: "gen4_turbo",
        promptImage: primaryPhotoUrl,
        promptText: runwayPrompt,
        duration: 5, // 5 seconds per the user spec
        ratio: "720:1280", // 9:16 vertical
      }),
    });

    if (!runwayResponse.ok) {
      const errorText = await runwayResponse.text();
      console.error("RunwayML submission failed:", errorText);
      
      // Parse error for better messaging
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.includes('insufficient') || errorData.error?.includes('credit')) {
          throw new Error("Generation failed - please try again later");
        }
      } catch (parseError) {
        // Ignore parse errors
      }
      
      throw new Error("Failed to submit video to RunwayML");
    }

    const runwayData = await runwayResponse.json();
    const videoTaskId = runwayData.id;
    console.log("RunwayML task submitted:", videoTaskId);

    return new Response(
      JSON.stringify({
        success: true,
        narration: narrationText,
        audioBase64: audioBase64 ? audioBase64.substring(0, 1000) + "..." : null,
        audioSize,
        videoTaskId,
        photos: photos.map(p => ({
          dayNumber: p.dayNumber,
          activity: p.activity,
          duration: p.duration,
          pr: p.pr,
        })),
        message: "Video rendering started! This takes 1-2 minutes.",
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error generating fitness reel:", error);
    const message = error instanceof Error ? error.message : 'An error occurred while processing your request';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
