import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DayCard {
  dayNumber: number;
  activity: string;
  metricLabel: string;
  metricValue: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { days } = (await req.json()) as { days: DayCard[] };

    if (!days || days.length === 0) {
      return new Response(JSON.stringify({ error: "No days provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `[generate-metric-cards] Generating ${days.length} metric cards`
    );

    // Generate all cards in parallel
    const cardPromises = days.map(async (day) => {
      const prompt = `Create a clean, abstract data visualization graphic in 9:16 portrait ratio for a fitness recap video.

Style: Premium, minimal, modern motion design aesthetic. Dark charcoal/near-black background (#0a0a0f) with very subtle grain texture. No people, no faces, no environments, no realistic elements.

Content to display prominently:
- "DAY ${day.dayNumber}" as a small pill/tag at top center with a subtle purple accent
- The number "${day.metricValue}" as a very large, bold, centered hero number in white
- "${day.metricLabel}" as a subtle label below the number in muted white
- "${day.activity.toUpperCase()}" as faint text lower on the screen

Design details:
- Subtle purple/violet radial glow behind the main number (rgba tone)
- Clean sans-serif typography (SF Pro style)
- Minimalist composition with generous negative space
- Slight abstract geometric accent lines or dots for texture
- The overall feel should be like an Apple Fitness+ data screen or Nike Run Club metric display

This is a data transition card, not a photo. Pure graphic design only.`;

      try {
        const response = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `[generate-metric-cards] AI error for day ${day.dayNumber}:`,
            response.status,
            errorText
          );
          return { dayNumber: day.dayNumber, imageUrl: null, error: `AI error: ${response.status}` };
        }

        const data = await response.json();
        const imageUrl =
          data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrl) {
          console.error(
            `[generate-metric-cards] No image in response for day ${day.dayNumber}`
          );
          return { dayNumber: day.dayNumber, imageUrl: null, error: "No image generated" };
        }

        console.log(
          `[generate-metric-cards] Day ${day.dayNumber} generated (${imageUrl.length} chars)`
        );
        return { dayNumber: day.dayNumber, imageUrl };
      } catch (err) {
        console.error(
          `[generate-metric-cards] Failed for day ${day.dayNumber}:`,
          err
        );
        return { dayNumber: day.dayNumber, imageUrl: null, error: String(err) };
      }
    });

    const results = await Promise.all(cardPromises);

    console.log(
      `[generate-metric-cards] Complete: ${results.filter((r) => r.imageUrl).length}/${results.length} succeeded`
    );

    return new Response(JSON.stringify({ cards: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[generate-metric-cards] Error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
