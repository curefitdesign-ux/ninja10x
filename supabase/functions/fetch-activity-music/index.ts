const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/music-tracks`;

// Real royalty-free music tracks stored in Supabase storage, categorized by mood
const MUSIC_LIBRARY: Record<string, Array<{ path: string; title: string; artist: string }>> = {
  energetic: [
    { path: 'energetic-1.mp3', title: 'Energy', artist: 'Bensound' },
    { path: 'energetic-2.mp3', title: 'High Octane', artist: 'Bensound' },
    { path: 'energetic-3.mp3', title: 'Epic', artist: 'Bensound' },
  ],
  rhythmic: [
    { path: 'rhythmic-1.mp3', title: 'Actionable', artist: 'Bensound' },
    { path: 'rhythmic-2.mp3', title: 'Punky', artist: 'Bensound' },
  ],
  calm: [
    { path: 'calm-1.mp3', title: 'Relaxing', artist: 'Bensound' },
  ],
  ambient: [
    { path: 'ambient-1.mp3', title: 'Evolution', artist: 'Bensound' },
  ],
};

// Activity → mood mapping
const ACTIVITY_MOOD: Record<string, string> = {
  boxing: 'energetic', basketball: 'energetic', football: 'energetic',
  running: 'rhythmic', cycling: 'rhythmic', cricket: 'rhythmic',
  badminton: 'rhythmic', tennis: 'rhythmic',
  yoga: 'calm', meditation: 'calm', stretching: 'calm',
  swimming: 'ambient', trekking: 'ambient', hiking: 'ambient', walking: 'ambient',
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
    const { activity } = await req.json();
    const mood = getMood(activity || 'workout');
    const tracks = MUSIC_LIBRARY[mood] || MUSIC_LIBRARY.rhythmic;

    // Pick a random track for variety
    const pick = tracks[Math.floor(Math.random() * tracks.length)];
    const url = `${STORAGE_BASE}/${pick.path}`;

    console.log(`[fetch-activity-music] Activity: ${activity}, Mood: ${mood}, Track: ${pick.title}, URL: ${url}`);

    return new Response(
      JSON.stringify({
        success: true,
        track: {
          url,
          title: pick.title,
          artist: pick.artist,
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
