import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation constants
const MAX_TEXT_LENGTH = 5000;
const ALLOWED_VOICE_IDS = [
  "JBFqnCBsd6RMkjVDRZzb", // George
  "21m00Tcm4TlvDq8ikWAM", // Rachel
  "EXAVITQu4vr4xnSDxMaL", // Bella
];

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

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  
  if (error || !data?.claims) {
    throw new Error('Unauthorized: Invalid token');
  }

  return data.claims.sub as string;
}

serve(async (req) => {
  console.log("ElevenLabs TTS request received");
  
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

    // Parse and validate input
    let text: string;
    let voiceId: string;

    try {
      const body = await req.json();
      
      // Validate text
      if (!body.text || typeof body.text !== 'string') {
        throw new Error('text is required and must be a string');
      }
      if (body.text.length > MAX_TEXT_LENGTH) {
        throw new Error(`text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`);
      }
      text = body.text.trim();
      if (text.length === 0) {
        throw new Error('text cannot be empty');
      }

      // Validate voiceId
      voiceId = ALLOWED_VOICE_IDS[0]; // Default
      if (body.voiceId !== undefined) {
        if (typeof body.voiceId !== 'string') {
          throw new Error('voiceId must be a string');
        }
        if (!ALLOWED_VOICE_IDS.includes(body.voiceId)) {
          throw new Error('Invalid voiceId');
        }
        voiceId = body.voiceId;
      }
    } catch (validationError) {
      console.error("Validation failed:", validationError);
      return new Response(
        JSON.stringify({ error: validationError instanceof Error ? validationError.message : 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    console.log(`Generating TTS for user ${userId}, text (${text.length} chars) with voice ${voiceId}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
            speed: 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("ElevenLabs API error:", response.status);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log("Audio generated successfully, size:", audioBuffer.byteLength);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });

  } catch (error) {
    console.error("Error in TTS:", error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred while processing your request' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
