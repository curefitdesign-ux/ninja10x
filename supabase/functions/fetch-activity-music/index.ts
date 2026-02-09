const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Curated royalty-free tracks from Pixabay CDN, categorized by mood
// All tracks are free for commercial use, no attribution required
const MUSIC_LIBRARY: Record<string, Array<{ url: string; title: string; artist: string }>> = {
  energetic: [
    { url: 'https://cdn.pixabay.com/audio/2024/11/29/audio_37ceae2544.mp3', title: 'Powerful Beat', artist: 'Pixabay' },
    { url: 'https://cdn.pixabay.com/audio/2024/02/14/audio_8e853db692.mp3', title: 'Energy Surge', artist: 'Pixabay' },
    { url: 'https://cdn.pixabay.com/audio/2023/10/08/audio_d4e6570aee.mp3', title: 'Sport Motivation', artist: 'Pixabay' },
    { url: 'https://cdn.pixabay.com/audio/2024/09/10/audio_6e1de20e3f.mp3', title: 'Pump It Up', artist: 'Pixabay' },
    { url: 'https://cdn.pixabay.com/audio/2023/08/10/audio_89026afbc2.mp3', title: 'Drive Forward', artist: 'Pixabay' },
  ],
  rhythmic: [
    { url: 'https://cdn.pixabay.com/audio/2024/03/14/audio_77cebb5805.mp3', title: 'Running Beat', artist: 'Pixabay' },
    { url: 'https://cdn.pixabay.com/audio/2023/09/24/audio_9ee86cd2e1.mp3', title: 'Workout Rhythm', artist: 'Pixabay' },
    { url: 'https://cdn.pixabay.com/audio/2024/01/18/audio_e79b2f7426.mp3', title: 'Move Forward', artist: 'Pixabay' },
    { url: 'https://cdn.pixabay.com/audio/2023/11/15/audio_0b53cf8e6f.mp3', title: 'Step By Step', artist: 'Pixabay' },
    { url: 'https://cdn.pixabay.com/audio/2024/05/20/audio_bb5d7fd530.mp3', title: 'Keep Going', artist: 'Pixabay' },
  ],
  calm: [
    { url: 'https://cdn.pixabay.com/audio/2024/04/16/audio_53bcca7b77.mp3', title: 'Inner Peace', artist: 'Pixabay' },
    { url: 'https://cdn.pixabay.com/audio/2023/07/19/audio_2d00e88cf5.mp3', title: 'Meditation Flow', artist: 'Pixabay' },
    { url: 'https://cdn.pixabay.com/audio/2024/06/07/audio_38e40a560b.mp3', title: 'Gentle Waves', artist: 'Pixabay' },
    { url: 'https://cdn.pixabay.com/audio/2023/12/04/audio_308b02c3c0.mp3', title: 'Serenity', artist: 'Pixabay' },
  ],
  ambient: [
    { url: 'https://cdn.pixabay.com/audio/2024/08/12/audio_2b9e6c3d4f.mp3', title: 'Nature Trail', artist: 'Pixabay' },
    { url: 'https://cdn.pixabay.com/audio/2023/06/28/audio_1e4c1d8b5a.mp3', title: 'Open Air', artist: 'Pixabay' },
    { url: 'https://cdn.pixabay.com/audio/2024/07/05/audio_4f7e8a9b2c.mp3', title: 'Horizon', artist: 'Pixabay' },
    { url: 'https://cdn.pixabay.com/audio/2023/10/22/audio_5c6d7e8f1a.mp3', title: 'Exploration', artist: 'Pixabay' },
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
  return 'rhythmic'; // default
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

    console.log(`[fetch-activity-music] Activity: ${activity}, Mood: ${mood}, Track: ${pick.title}`);

    // Verify the track URL is accessible
    const headCheck = await fetch(pick.url, { method: 'HEAD' });

    if (headCheck.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          track: {
            url: pick.url,
            title: pick.title,
            artist: pick.artist,
            mood,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If first pick fails, try others
    for (const fallback of tracks) {
      if (fallback.url === pick.url) continue;
      const check = await fetch(fallback.url, { method: 'HEAD' });
      if (check.ok) {
        return new Response(
          JSON.stringify({
            success: true,
            track: {
              url: fallback.url,
              title: fallback.title,
              artist: fallback.artist,
              mood,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'No accessible tracks', fallbackToSynth: true }),
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
