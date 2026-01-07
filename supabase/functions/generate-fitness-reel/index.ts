import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas (manual since zod isn't available in Deno edge by default)
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
  pr?: string;
  uploadDate: string;
  dayNumber: number;
}

interface GenerateReelRequest {
  photos?: PhotoData[];
  stylePrompt?: string;
  styleId?: string;
  action?: 'create' | 'status';
  taskId?: string;
  referenceVideoUrl?: string;
}

// Validation functions
function validateString(value: unknown, maxLength: number, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
  }
  // Basic sanitization - remove potential script tags
  return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

function validateUrl(value: unknown, fieldName: string): string {
  const str = validateString(value, MAX_URL_LENGTH, fieldName);
  // Allow data URIs and http(s) URLs only
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
    pr: p.pr ? validateString(p.pr, 100, `Photo ${index} pr`) : undefined,
    uploadDate: validateString(p.uploadDate, 20, `Photo ${index} uploadDate`),
    dayNumber: typeof p.dayNumber === 'number' && p.dayNumber >= 1 && p.dayNumber <= 365 
      ? p.dayNumber 
      : (() => { throw new Error(`Photo ${index} dayNumber must be between 1 and 365`); })(),
  };
}

function validateRequest(body: unknown): GenerateReelRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be an object');
  }
  
  const req = body as Record<string, unknown>;
  const result: GenerateReelRequest = {};
  
  // Validate action
  if (req.action !== undefined) {
    if (req.action !== 'create' && req.action !== 'status') {
      throw new Error('action must be "create" or "status"');
    }
    result.action = req.action;
  }
  
  // Validate taskId
  if (req.taskId !== undefined) {
    result.taskId = validateString(req.taskId, MAX_TASK_ID_LENGTH, 'taskId');
  }
  
  // Validate photos array
  if (req.photos !== undefined) {
    if (!Array.isArray(req.photos)) {
      throw new Error('photos must be an array');
    }
    if (req.photos.length > MAX_PHOTOS) {
      throw new Error(`Maximum ${MAX_PHOTOS} photos allowed`);
    }
    result.photos = req.photos.map((p, i) => validatePhoto(p, i));
  }
  
  // Validate style fields
  if (req.stylePrompt !== undefined) {
    result.stylePrompt = validateString(req.stylePrompt, MAX_STRING_LENGTH, 'stylePrompt');
  }
  if (req.styleId !== undefined) {
    result.styleId = validateString(req.styleId, 50, 'styleId');
  }
  
  return result;
}

// Authenticate user using JWT
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

  // Use getUser instead of getClaims (which doesn't exist in v2)
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.error('Auth error:', error?.message);
    throw new Error('Unauthorized: Invalid token');
  }

  return user.id;
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
    const { photos = [], stylePrompt, styleId } = body;

    if (photos.length < MIN_PHOTOS) {
      return new Response(
        JSON.stringify({ error: `At least ${MIN_PHOTOS} photos are required` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${photos.length} photos for user ${userId}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY is not configured");
    if (!RUNWAYML_API_KEY) throw new Error("RUNWAYML_API_KEY is not configured");

    const photosSummary = photos.map((p) => {
      let details = `Day ${p.dayNumber}: ${p.activity}`;
      if (p.duration) details += ` for ${p.duration}`;
      if (p.pr) details += ` - Personal Record: ${p.pr}`;
      return details;
    }).join('\n');

    const narrationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are creating a short, punchy voiceover script for a brutalist-style fitness video reel.
Keep it VERY SHORT (10-15 seconds when spoken, max 30 words). Raw, gritty, powerful.
The tone should be intense and underground - like a boxing gym trainer, not a cheerful influencer.
Use short, punchy sentences. No fluff. Just raw energy.
Format: Just the narration text, no formatting or stage directions.`
          },
          {
            role: "user",
            content: `Create a short, intense voiceover for this fitness week:

${photosSummary}

Style: Brutalist, gritty, underground. Think boxing gym, not Instagram fitness. Max 30 words.`
          }
        ],
      }),
    });

    if (!narrationResponse.ok) {
      const errorText = await narrationResponse.text();
      console.error("Narration generation failed:", errorText);
      throw new Error("Failed to generate narration");
    }

    const narrationData = await narrationResponse.json();
    const narrationText = narrationData.choices?.[0]?.message?.content || "Your incredible fitness journey this week!";
    console.log("Generated narration:", narrationText);

    // Step 2: Generate voiceover audio with ElevenLabs (optional - continue if it fails)
    console.log("Step 2: Generating voiceover with ElevenLabs...");
    
    let audioBase64: string | null = null;
    let audioSize = 0;

    try {
      const voiceId = ALLOWED_VOICE_IDS[0]; // Use first allowed voice
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

    // Step 3: Generate video with RunwayML
    console.log("Step 3: Initiating video generation with RunwayML...");

    const chosenStyle = (styleId || 'brutalist').toLowerCase();
    const extraStyle = stylePrompt ? `\nStyle notes: ${stylePrompt}` : '';

    const videoPrompt = `Vertical mobile video, ${chosenStyle} design style, fitness vlog aesthetic.
A gritty cinematic montage of ${photos.map(p => p.activity.toLowerCase()).join(' and ')} training.
Heavy film grain, noise textures, high contrast black and white with flashes of bright yellow.
Split-screen collage effects, fast-paced editing, glitch transitions.
Urban underground atmosphere, raw athletic power, 4k resolution.${extraStyle}`;

    const firstPhotoUrl = photos[0].imageUrl;

    let videoTaskId: string | null = null;
    let videoUrl: string | null = null;

    const isDataUri = firstPhotoUrl?.startsWith('data:');
    
    if (isDataUri) {
      console.log("Photo is a data URI - using text_to_video instead of image_to_video");
      
      const runwayResponse = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RUNWAYML_API_KEY}`,
          "Content-Type": "application/json",
          "X-Runway-Version": "2024-11-06",
        },
        body: JSON.stringify({
          model: "gen3a_turbo",
          promptText: videoPrompt,
          duration: 5,
          watermark: false,
          ratio: "9:16",
        }),
      });

      if (runwayResponse.ok) {
        const runwayData = await runwayResponse.json();
        videoTaskId = runwayData.id;
        console.log("RunwayML text_to_video task initiated:", videoTaskId);
      } else {
        const errorText = await runwayResponse.text();
        console.error("RunwayML text_to_video error:", errorText);
      }
    } else {
      const runwayResponse = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RUNWAYML_API_KEY}`,
          "Content-Type": "application/json",
          "X-Runway-Version": "2024-11-06",
        },
        body: JSON.stringify({
          model: "gen3a_turbo",
          promptImage: firstPhotoUrl,
          promptText: videoPrompt,
          duration: 5,
          watermark: false,
          ratio: "9:16",
        }),
      });

      if (runwayResponse.ok) {
        const runwayData = await runwayResponse.json();
        videoTaskId = runwayData.id;
        console.log("RunwayML image_to_video task initiated:", videoTaskId);
      } else {
        const errorText = await runwayResponse.text();
        console.error("RunwayML image_to_video error:", errorText);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        narration: narrationText,
        audioBase64: audioBase64 ? audioBase64.substring(0, 1000) + "..." : null,
        audioSize,
        videoTaskId,
        videoUrl,
        photos: photos.map(p => ({
          dayNumber: p.dayNumber,
          activity: p.activity,
          duration: p.duration,
          pr: p.pr,
        })),
        message: videoTaskId 
          ? "Video generation started! Check back in 1-2 minutes." 
          : "Narration and voiceover ready! Video generation pending.",
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error generating fitness reel:", error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while processing your request',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
