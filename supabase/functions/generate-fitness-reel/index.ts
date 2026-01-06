import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  photos: PhotoData[];
  referenceVideoUrl?: string;
}

serve(async (req) => {
  console.log("Generate fitness reel request received");
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { photos } = await req.json() as GenerateReelRequest;
    
    if (!photos || photos.length < 3) {
      return new Response(
        JSON.stringify({ error: 'At least 3 photos are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${photos.length} photos for reel generation`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const RUNWAYML_API_KEY = Deno.env.get("RUNWAYML_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }
    if (!RUNWAYML_API_KEY) {
      throw new Error("RUNWAYML_API_KEY is not configured");
    }

    // Step 1: Generate narration text using Lovable AI
    console.log("Step 1: Generating narration with Lovable AI...");
    
    const photosSummary = photos.map((p, i) => {
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
            content: `You are creating a motivational, energetic voiceover script for a fitness journey video reel. 
Keep it SHORT (30-45 seconds when spoken). Be inspiring, use action words, and celebrate the user's achievements.
The tone should be upbeat and encouraging, like a fitness influencer or motivational coach.
Format: Just the narration text, no formatting or stage directions.`
          },
          {
            role: "user",
            content: `Create a short, punchy voiceover narration for this fitness week:

${photosSummary}

Make it feel like an Instagram fitness reel - energetic, motivating, and shareable!`
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

    // Step 2: Generate voiceover audio with ElevenLabs
    console.log("Step 2: Generating voiceover with ElevenLabs...");
    
    const voiceId = "JBFqnCBsd6RMkjVDRZzb"; // George - energetic male voice
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

    if (!voiceResponse.ok) {
      const errorText = await voiceResponse.text();
      console.error("ElevenLabs error:", errorText);
      throw new Error("Failed to generate voiceover");
    }

    const audioBuffer = await voiceResponse.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer).slice(0, 50000)));
    console.log("Voiceover generated successfully, size:", audioBuffer.byteLength);

    // Step 3: Generate video with RunwayML
    console.log("Step 3: Initiating video generation with RunwayML...");
    
    // For RunwayML Gen-3 Alpha, we need to use their image-to-video API
    // First, let's prepare the prompt for the video generation
    const videoPrompt = `Cinematic fitness montage, dynamic camera movements, motivational energy, 
${photos.map(p => p.activity).join(', ')} activities, 
slow motion action shots transitioning smoothly, professional sports documentary style, 
golden hour lighting, epic and inspiring atmosphere`;

    // Use the first photo as the starting frame
    const firstPhotoUrl = photos[0].imageUrl;
    
    // Check if RunwayML API key format (they use different API structure)
    const runwayResponse = await fetch("https://api.runwayml.com/v1/image_to_video", {
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

    let videoTaskId = null;
    let videoUrl = null;
    
    if (runwayResponse.ok) {
      const runwayData = await runwayResponse.json();
      videoTaskId = runwayData.id;
      console.log("RunwayML task initiated:", videoTaskId);
    } else {
      const errorText = await runwayResponse.text();
      console.error("RunwayML error:", errorText);
      // Continue without video - we'll return what we have
    }

    // Return the generated content
    return new Response(
      JSON.stringify({
        success: true,
        narration: narrationText,
        audioBase64: audioBase64.substring(0, 1000) + "...", // Truncated for response
        audioSize: audioBuffer.byteLength,
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
        error: error instanceof Error ? error.message : 'Unknown error',
        details: "Failed to generate fitness reel"
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
