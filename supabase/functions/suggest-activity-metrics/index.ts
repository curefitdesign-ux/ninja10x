import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { activityName } = await req.json();
    if (!activityName || typeof activityName !== "string") {
      return new Response(JSON.stringify({ error: "activityName required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              'You suggest fitness metric labels for activity tracking. Respond ONLY with valid JSON: {"primaryMetric":"<label>","primaryUnit":"<unit>","secondaryMetric":"<label>","secondaryUnit":"<unit>"}. Primary is always a time-based metric like Duration. Secondary is the most relevant performance metric for that activity (e.g. Distance for running, Laps for swimming, Rounds for boxing). Keep labels short (1-2 words). Units should be abbreviated (min, km, m, laps, sets, reps, rounds, goals, etc).',
          },
          {
            role: "user",
            content: `Suggest tracking metrics for: "${activityName}"`,
          },
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const metrics = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify(metrics), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback
    return new Response(
      JSON.stringify({
        primaryMetric: "Duration",
        primaryUnit: "min",
        secondaryMetric: "Session",
        secondaryUnit: "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        primaryMetric: "Duration",
        primaryUnit: "min",
        secondaryMetric: "Session",
        secondaryUnit: "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
