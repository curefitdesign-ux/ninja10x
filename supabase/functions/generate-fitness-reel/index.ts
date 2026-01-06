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
    
    // Brutalist style video prompt - gritty, high contrast, film grain aesthetic
    const videoPrompt = `Vertical mobile video, brutalist graphic design style, fitness vlog aesthetic. 
A gritty cinematic montage of ${photos.map(p => p.activity.toLowerCase()).join(' and ')} training. 
Heavy film grain, noise textures, high contrast black and white with flashes of bright yellow. 
Split-screen collage effects, fast-paced editing, glitch transitions. 
Urban underground atmosphere, raw athletic power, 4k resolution.`;

    // Use the first photo as the starting frame
    const firstPhotoUrl = photos[0].imageUrl;
    
    // RunwayML Gen-3 Alpha image-to-video API - 5 second clips (3 clips = ~15 sec total)
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
        duration: 5, // 5 seconds per clip, we'll request multiple if needed
        watermark: false,
        ratio: "9:16", // Vertical mobile format
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
