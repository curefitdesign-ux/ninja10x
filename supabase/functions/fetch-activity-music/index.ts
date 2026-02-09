const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Curated library of royalty-free music from Pixabay (Content License — free for commercial use)
// Each track has a direct CDN download URL, categorized by mood/activity context
const MUSIC_LIBRARY: Record<string, Array<{ url: string; title: string; artist: string; duration: number }>> = {
  energetic: [
    { url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_33f0d90acf.mp3', title: 'Energy', artist: 'Pixabay', duration: 126 },
    { url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', title: 'Powerful Beat', artist: 'Pixabay', duration: 116 },
    { url: 'https://cdn.pixabay.com/audio/2023/07/30/audio_e5765c4e06.mp3', title: 'Pump It', artist: 'Pixabay', duration: 132 },
    { url: 'https://cdn.pixabay.com/audio/2023/10/08/audio_9a0f531cc2.mp3', title: 'Sport Motivation', artist: 'Pixabay', duration: 149 },
    { url: 'https://cdn.pixabay.com/audio/2024/01/16/audio_94e2e38e4e.mp3', title: 'Workout Energy', artist: 'Pixabay', duration: 120 },
    { url: 'https://cdn.pixabay.com/audio/2023/04/07/audio_15aa1fa605.mp3', title: 'Action Sports', artist: 'Pixabay', duration: 117 },
  ],
  rhythmic: [
    { url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3', title: 'Running Beat', artist: 'Pixabay', duration: 112 },
    { url: 'https://cdn.pixabay.com/audio/2023/09/04/audio_3401e5f0ae.mp3', title: 'Jogging Rhythm', artist: 'Pixabay', duration: 148 },
    { url: 'https://cdn.pixabay.com/audio/2022/12/13/audio_1e8cc2da2a.mp3', title: 'Upbeat Fun', artist: 'Pixabay', duration: 125 },
    { url: 'https://cdn.pixabay.com/audio/2023/05/16/audio_166b15a20c.mp3', title: 'Motivational', artist: 'Pixabay', duration: 135 },
    { url: 'https://cdn.pixabay.com/audio/2024/03/18/audio_a1e8b4ea1a.mp3', title: 'Pulse Runner', artist: 'Pixabay', duration: 118 },
  ],
  calm: [
    { url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_a0abc04f8e.mp3', title: 'Yoga Flow', artist: 'Pixabay', duration: 140 },
    { url: 'https://cdn.pixabay.com/audio/2022/01/20/audio_d0a25f5b0f.mp3', title: 'Meditation Peace', artist: 'Pixabay', duration: 178 },
    { url: 'https://cdn.pixabay.com/audio/2022/10/09/audio_d7a13b5804.mp3', title: 'Gentle Morning', artist: 'Pixabay', duration: 152 },
    { url: 'https://cdn.pixabay.com/audio/2023/02/08/audio_69a61cd6d6.mp3', title: 'Zen Garden', artist: 'Pixabay', duration: 165 },
    { url: 'https://cdn.pixabay.com/audio/2023/08/20/audio_2cd28f2e09.mp3', title: 'Inner Peace', artist: 'Pixabay', duration: 190 },
  ],
  ambient: [
    { url: 'https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3', title: 'Nature Walk', artist: 'Pixabay', duration: 160 },
    { url: 'https://cdn.pixabay.com/audio/2022/09/08/audio_9c5a44e5e1.mp3', title: 'Deep Ambient', artist: 'Pixabay', duration: 174 },
    { url: 'https://cdn.pixabay.com/audio/2023/01/10/audio_cb8d84c59a.mp3', title: 'Floating', artist: 'Pixabay', duration: 145 },
    { url: 'https://cdn.pixabay.com/audio/2023/06/14/audio_3e5a8dfbe0.mp3', title: 'Ocean Breeze', artist: 'Pixabay', duration: 155 },
  ],
  intense: [
    { url: 'https://cdn.pixabay.com/audio/2023/03/14/audio_5a73dd7b83.mp3', title: 'Fight Mode', artist: 'Pixabay', duration: 128 },
    { url: 'https://cdn.pixabay.com/audio/2022/11/22/audio_febc508520.mp3', title: 'Dark Power', artist: 'Pixabay', duration: 136 },
    { url: 'https://cdn.pixabay.com/audio/2023/11/06/audio_a1b7e0e1d0.mp3', title: 'Beast Mode', artist: 'Pixabay', duration: 142 },
    { url: 'https://cdn.pixabay.com/audio/2024/02/12/audio_e3c1a7f2b5.mp3', title: 'Aggressive Beat', artist: 'Pixabay', duration: 115 },
  ],
  groovy: [
    { url: 'https://cdn.pixabay.com/audio/2022/04/27/audio_67bcbb2e2e.mp3', title: 'Funky Ride', artist: 'Pixabay', duration: 130 },
    { url: 'https://cdn.pixabay.com/audio/2023/02/24/audio_4d03b0c9f8.mp3', title: 'Groove Machine', artist: 'Pixabay', duration: 122 },
    { url: 'https://cdn.pixabay.com/audio/2022/07/15/audio_aef2c2b8ab.mp3', title: 'Cycling Beats', artist: 'Pixabay', duration: 118 },
    { url: 'https://cdn.pixabay.com/audio/2023/12/01/audio_c5e2f1a9d3.mp3', title: 'Street Flow', artist: 'Pixabay', duration: 140 },
  ],
};

// Activity → mood mapping
const ACTIVITY_MOOD: Record<string, string> = {
  boxing: 'intense', basketball: 'energetic', football: 'energetic',
  running: 'rhythmic', cycling: 'groovy', cricket: 'rhythmic',
  badminton: 'groovy', tennis: 'groovy',
  yoga: 'calm', meditation: 'calm', stretching: 'calm',
  swimming: 'ambient', trekking: 'ambient', hiking: 'ambient', walking: 'ambient',
  workout: 'energetic',
};

function getMood(activity: string): string {
  const key = activity.toLowerCase();
  for (const [name, mood] of Object.entries(ACTIVITY_MOOD)) {
    if (key.includes(name)) return mood;
  }
  return 'rhythmic';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { activity, seed } = await req.json();
    const mood = getMood(activity || 'workout');
    const tracks = MUSIC_LIBRARY[mood] || MUSIC_LIBRARY.rhythmic;

    // Use seed for deterministic-but-unique selection per reel
    const pickSeed = seed || Date.now();
    const pickIndex = Math.abs(pickSeed) % tracks.length;
    const pick = tracks[pickIndex];

    console.log(`[fetch-activity-music] Activity: "${activity}", Mood: ${mood}, Track: "${pick.title}" (#${pickIndex + 1}/${tracks.length}), Seed: ${pickSeed}`);

    return new Response(
      JSON.stringify({
        success: true,
        track: {
          url: pick.url,
          title: pick.title,
          artist: pick.artist,
          duration: pick.duration,
          mood,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[fetch-activity-music] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackToSynth: true,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
