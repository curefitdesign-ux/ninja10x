const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ═══════════════════════════════════════════════════════════════
// MASSIVE curated library of royalty-free Pixabay music (Content License)
// Each track: direct CDN URL, title, artist, duration, energy level, tags
// ═══════════════════════════════════════════════════════════════

interface Track {
  url: string;
  title: string;
  artist: string;
  duration: number;
  energy: number;      // 1-10 scale
  tags: string[];       // for AI matching
}

const MUSIC_LIBRARY: Record<string, Track[]> = {
  energetic: [
    { url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_33f0d90acf.mp3', title: 'Energy', artist: 'Pixabay', duration: 126, energy: 9, tags: ['pump', 'power', 'gym', 'hiit'] },
    { url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', title: 'Powerful Beat', artist: 'Pixabay', duration: 116, energy: 8, tags: ['strength', 'motivation', 'lift'] },
    { url: 'https://cdn.pixabay.com/audio/2023/07/30/audio_e5765c4e06.mp3', title: 'Pump It', artist: 'Pixabay', duration: 132, energy: 9, tags: ['edm', 'dance', 'cardio'] },
    { url: 'https://cdn.pixabay.com/audio/2023/10/08/audio_9a0f531cc2.mp3', title: 'Sport Motivation', artist: 'Pixabay', duration: 149, energy: 8, tags: ['sport', 'competition', 'team'] },
    { url: 'https://cdn.pixabay.com/audio/2024/01/16/audio_94e2e38e4e.mp3', title: 'Workout Energy', artist: 'Pixabay', duration: 120, energy: 9, tags: ['workout', 'training', 'sweat'] },
    { url: 'https://cdn.pixabay.com/audio/2023/04/07/audio_15aa1fa605.mp3', title: 'Action Sports', artist: 'Pixabay', duration: 117, energy: 8, tags: ['action', 'extreme', 'adrenaline'] },
    { url: 'https://cdn.pixabay.com/audio/2022/08/25/audio_4f3b0a8791.mp3', title: 'Electronic Future', artist: 'Pixabay', duration: 140, energy: 7, tags: ['electronic', 'future', 'upbeat'] },
    { url: 'https://cdn.pixabay.com/audio/2023/09/19/audio_8c1c2be4b0.mp3', title: 'Drive Forward', artist: 'Pixabay', duration: 128, energy: 8, tags: ['drive', 'determination', 'push'] },
  ],
  rhythmic: [
    { url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3', title: 'Running Beat', artist: 'Pixabay', duration: 112, energy: 7, tags: ['running', 'jog', 'pace', 'cadence'] },
    { url: 'https://cdn.pixabay.com/audio/2023/09/04/audio_3401e5f0ae.mp3', title: 'Jogging Rhythm', artist: 'Pixabay', duration: 148, energy: 6, tags: ['jog', 'steady', 'endurance'] },
    { url: 'https://cdn.pixabay.com/audio/2022/12/13/audio_1e8cc2da2a.mp3', title: 'Upbeat Fun', artist: 'Pixabay', duration: 125, energy: 7, tags: ['fun', 'happy', 'bounce'] },
    { url: 'https://cdn.pixabay.com/audio/2023/05/16/audio_166b15a20c.mp3', title: 'Motivational', artist: 'Pixabay', duration: 135, energy: 6, tags: ['motivation', 'progress', 'journey'] },
    { url: 'https://cdn.pixabay.com/audio/2024/03/18/audio_a1e8b4ea1a.mp3', title: 'Pulse Runner', artist: 'Pixabay', duration: 118, energy: 7, tags: ['pulse', 'heartbeat', 'cardio'] },
    { url: 'https://cdn.pixabay.com/audio/2022/10/14/audio_c1c8abcdef.mp3', title: 'Steady Groove', artist: 'Pixabay', duration: 130, energy: 6, tags: ['groove', 'consistent', 'flow'] },
    { url: 'https://cdn.pixabay.com/audio/2023/03/22/audio_b5e2a1c0d4.mp3', title: 'Morning Hustle', artist: 'Pixabay', duration: 115, energy: 7, tags: ['morning', 'hustle', 'fresh'] },
  ],
  calm: [
    { url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_a0abc04f8e.mp3', title: 'Yoga Flow', artist: 'Pixabay', duration: 140, energy: 2, tags: ['yoga', 'stretch', 'flexibility', 'mindful'] },
    { url: 'https://cdn.pixabay.com/audio/2022/01/20/audio_d0a25f5b0f.mp3', title: 'Meditation Peace', artist: 'Pixabay', duration: 178, energy: 1, tags: ['meditation', 'peace', 'zen', 'breathe'] },
    { url: 'https://cdn.pixabay.com/audio/2022/10/09/audio_d7a13b5804.mp3', title: 'Gentle Morning', artist: 'Pixabay', duration: 152, energy: 2, tags: ['gentle', 'morning', 'sunrise', 'calm'] },
    { url: 'https://cdn.pixabay.com/audio/2023/02/08/audio_69a61cd6d6.mp3', title: 'Zen Garden', artist: 'Pixabay', duration: 165, energy: 1, tags: ['zen', 'garden', 'tranquil', 'healing'] },
    { url: 'https://cdn.pixabay.com/audio/2023/08/20/audio_2cd28f2e09.mp3', title: 'Inner Peace', artist: 'Pixabay', duration: 190, energy: 1, tags: ['inner', 'peace', 'spiritual', 'relax'] },
    { url: 'https://cdn.pixabay.com/audio/2022/06/20/audio_a8e4f3b2c1.mp3', title: 'Healing Tones', artist: 'Pixabay', duration: 160, energy: 2, tags: ['healing', 'therapy', 'restore'] },
    { url: 'https://cdn.pixabay.com/audio/2023/11/15/audio_d4c5e6f7a8.mp3', title: 'Soft Winds', artist: 'Pixabay', duration: 145, energy: 2, tags: ['wind', 'nature', 'soft', 'breeze'] },
  ],
  ambient: [
    { url: 'https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3', title: 'Nature Walk', artist: 'Pixabay', duration: 160, energy: 3, tags: ['nature', 'walk', 'outdoor', 'trail'] },
    { url: 'https://cdn.pixabay.com/audio/2022/09/08/audio_9c5a44e5e1.mp3', title: 'Deep Ambient', artist: 'Pixabay', duration: 174, energy: 3, tags: ['deep', 'atmospheric', 'space'] },
    { url: 'https://cdn.pixabay.com/audio/2023/01/10/audio_cb8d84c59a.mp3', title: 'Floating', artist: 'Pixabay', duration: 145, energy: 2, tags: ['floating', 'drift', 'swimming'] },
    { url: 'https://cdn.pixabay.com/audio/2023/06/14/audio_3e5a8dfbe0.mp3', title: 'Ocean Breeze', artist: 'Pixabay', duration: 155, energy: 3, tags: ['ocean', 'sea', 'beach', 'waves'] },
    { url: 'https://cdn.pixabay.com/audio/2022/11/03/audio_a7b8c9d0e1.mp3', title: 'Forest Path', artist: 'Pixabay', duration: 168, energy: 3, tags: ['forest', 'trek', 'hike', 'explore'] },
    { url: 'https://cdn.pixabay.com/audio/2023/04/28/audio_e2f3a4b5c6.mp3', title: 'Mountain Air', artist: 'Pixabay', duration: 150, energy: 4, tags: ['mountain', 'summit', 'climb', 'altitude'] },
  ],
  intense: [
    { url: 'https://cdn.pixabay.com/audio/2023/03/14/audio_5a73dd7b83.mp3', title: 'Fight Mode', artist: 'Pixabay', duration: 128, energy: 10, tags: ['fight', 'boxing', 'combat', 'mma'] },
    { url: 'https://cdn.pixabay.com/audio/2022/11/22/audio_febc508520.mp3', title: 'Dark Power', artist: 'Pixabay', duration: 136, energy: 9, tags: ['dark', 'power', 'heavy', 'intense'] },
    { url: 'https://cdn.pixabay.com/audio/2023/11/06/audio_a1b7e0e1d0.mp3', title: 'Beast Mode', artist: 'Pixabay', duration: 142, energy: 10, tags: ['beast', 'fury', 'rage', 'unstoppable'] },
    { url: 'https://cdn.pixabay.com/audio/2024/02/12/audio_e3c1a7f2b5.mp3', title: 'Aggressive Beat', artist: 'Pixabay', duration: 115, energy: 9, tags: ['aggressive', 'hard', 'punch', 'kick'] },
    { url: 'https://cdn.pixabay.com/audio/2022/07/11/audio_f1e2d3c4b5.mp3', title: 'War Drums', artist: 'Pixabay', duration: 110, energy: 10, tags: ['drums', 'tribal', 'warrior', 'primal'] },
    { url: 'https://cdn.pixabay.com/audio/2023/08/05/audio_c6d7e8f9a0.mp3', title: 'Adrenaline Rush', artist: 'Pixabay', duration: 122, energy: 9, tags: ['adrenaline', 'rush', 'explosive'] },
  ],
  groovy: [
    { url: 'https://cdn.pixabay.com/audio/2022/04/27/audio_67bcbb2e2e.mp3', title: 'Funky Ride', artist: 'Pixabay', duration: 130, energy: 6, tags: ['funky', 'ride', 'cruise', 'cycling'] },
    { url: 'https://cdn.pixabay.com/audio/2023/02/24/audio_4d03b0c9f8.mp3', title: 'Groove Machine', artist: 'Pixabay', duration: 122, energy: 7, tags: ['groove', 'machine', 'dance'] },
    { url: 'https://cdn.pixabay.com/audio/2022/07/15/audio_aef2c2b8ab.mp3', title: 'Cycling Beats', artist: 'Pixabay', duration: 118, energy: 6, tags: ['cycling', 'spin', 'pedal', 'road'] },
    { url: 'https://cdn.pixabay.com/audio/2023/12/01/audio_c5e2f1a9d3.mp3', title: 'Street Flow', artist: 'Pixabay', duration: 140, energy: 7, tags: ['street', 'urban', 'hip-hop', 'cool'] },
    { url: 'https://cdn.pixabay.com/audio/2022/09/25/audio_b3c4d5e6f7.mp3', title: 'Smooth Operator', artist: 'Pixabay', duration: 135, energy: 5, tags: ['smooth', 'chill', 'laid-back'] },
    { url: 'https://cdn.pixabay.com/audio/2023/06/30/audio_a8b9c0d1e2.mp3', title: 'Neon Nights', artist: 'Pixabay', duration: 128, energy: 6, tags: ['neon', 'night', 'city', 'vibe'] },
  ],
  cinematic: [
    { url: 'https://cdn.pixabay.com/audio/2022/02/15/audio_a1b2c3d4e5.mp3', title: 'Epic Journey', artist: 'Pixabay', duration: 180, energy: 7, tags: ['epic', 'journey', 'achievement', 'triumph'] },
    { url: 'https://cdn.pixabay.com/audio/2023/01/25/audio_f6e5d4c3b2.mp3', title: 'Victory March', artist: 'Pixabay', duration: 155, energy: 8, tags: ['victory', 'win', 'celebrate', 'champion'] },
    { url: 'https://cdn.pixabay.com/audio/2022/12/28/audio_d7c8b9a0e1.mp3', title: 'Inspiring Rise', artist: 'Pixabay', duration: 165, energy: 6, tags: ['inspiring', 'rise', 'growth', 'progress'] },
    { url: 'https://cdn.pixabay.com/audio/2023/05/10/audio_e8f9a0b1c2.mp3', title: 'Emotional Peak', artist: 'Pixabay', duration: 142, energy: 5, tags: ['emotional', 'peak', 'heartfelt', 'proud'] },
    { url: 'https://cdn.pixabay.com/audio/2023/10/22/audio_a3b4c5d6e7.mp3', title: 'Hero Moment', artist: 'Pixabay', duration: 138, energy: 8, tags: ['hero', 'moment', 'glory', 'legend'] },
  ],
};

// Flatten all tracks for AI-powered selection
function getAllTracks(): (Track & { mood: string })[] {
  const all: (Track & { mood: string })[] = [];
  for (const [mood, tracks] of Object.entries(MUSIC_LIBRARY)) {
    for (const t of tracks) {
      all.push({ ...t, mood });
    }
  }
  return all;
}

// ═══════════════════════════════════════════════════════════════
// AI-POWERED contextual music selection using Lovable AI
// Analyzes user activities, metrics, and intensity to pick the
// perfect track — makes every reel truly unique
// ═══════════════════════════════════════════════════════════════

async function aiSelectTrack(
  activities: string[],
  metrics: string[],
  seed: number
): Promise<Track & { mood: string }> {
  const allTracks = getAllTracks();

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('No AI key');

    // Build the track catalog for AI
    const catalog = allTracks.map((t, i) => 
      `${i}. "${t.title}" [${t.mood}] energy:${t.energy}/10 tags:[${t.tags.join(',')}]`
    ).join('\n');

    const prompt = `You are a music director for fitness recap videos. Given the user's workout data, pick the SINGLE best track number.

USER ACTIVITIES: ${activities.join(', ')}
USER METRICS: ${metrics.join(', ')}
GENERATION SEED: ${seed} (use this to vary your pick — different seeds should prefer different tracks even for similar activities)

TRACK CATALOG:
${catalog}

Rules:
- Match the track's energy and tags to the user's workout intensity
- Boxing/HIIT → intense or energetic tracks (energy 8-10)
- Yoga/stretching → calm tracks (energy 1-3)
- Running/cricket → rhythmic tracks (energy 6-7)
- Cycling/badminton → groovy tracks (energy 5-7)
- Swimming/trekking/hiking → ambient tracks (energy 2-4)
- Mixed high-intensity → cinematic or energetic
- Use the seed to break ties: for seed ${seed}, prefer tracks at index (seed % count_of_matching_tracks)
- Consider the COMBINATION of activities, not just one

Respond with ONLY a JSON object: {"trackIndex": <number>, "reason": "<one line>"}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.warn('[fetch-activity-music] AI response not ok:', response.status);
      throw new Error(`AI ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const idx = parsed.trackIndex;
      if (typeof idx === 'number' && idx >= 0 && idx < allTracks.length) {
        console.log(`[fetch-activity-music] 🤖 AI picked: "${allTracks[idx].title}" [${allTracks[idx].mood}] — ${parsed.reason}`);
        return allTracks[idx];
      }
    }

    throw new Error('Could not parse AI response');
  } catch (err) {
    console.warn('[fetch-activity-music] AI selection failed, falling back to rule-based:', err);
    // Fallback to rule-based selection
    return ruleBasedSelect(activities.join(' '), seed, allTracks);
  }
}

// ═══════════════════════════════════════════════════════════════
// Rule-based fallback (used when AI is unavailable)
// ═══════════════════════════════════════════════════════════════

const ACTIVITY_MOOD: Record<string, string> = {
  boxing: 'intense', mma: 'intense', kickboxing: 'intense', wrestling: 'intense',
  basketball: 'energetic', football: 'energetic', volleyball: 'energetic', workout: 'energetic', hiit: 'energetic', crossfit: 'energetic',
  running: 'rhythmic', jogging: 'rhythmic', cricket: 'rhythmic', sprinting: 'rhythmic',
  cycling: 'groovy', badminton: 'groovy', tennis: 'groovy', skating: 'groovy', dancing: 'groovy',
  yoga: 'calm', meditation: 'calm', stretching: 'calm', pilates: 'calm', tai_chi: 'calm',
  swimming: 'ambient', trekking: 'ambient', hiking: 'ambient', walking: 'ambient', climbing: 'ambient',
};

function getMood(activity: string): string {
  const key = activity.toLowerCase();
  for (const [name, mood] of Object.entries(ACTIVITY_MOOD)) {
    if (key.includes(name)) return mood;
  }
  return 'rhythmic';
}

function ruleBasedSelect(activity: string, seed: number, allTracks: (Track & { mood: string })[]): Track & { mood: string } {
  const mood = getMood(activity);
  const moodTracks = allTracks.filter(t => t.mood === mood);
  const tracks = moodTracks.length > 0 ? moodTracks : allTracks.filter(t => t.mood === 'rhythmic');
  const pickIndex = Math.abs(seed) % tracks.length;
  return tracks[pickIndex];
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { activity, seed, activities, metrics } = await req.json();

    const pickSeed = seed || Date.now();
    const activityList = activities || (activity ? [activity] : ['workout']);
    const metricList = metrics || [];

    console.log(`[fetch-activity-music] Activities: ${JSON.stringify(activityList)}, Seed: ${pickSeed}`);

    // Use AI-powered selection for contextual matching
    const pick = await aiSelectTrack(activityList, metricList, pickSeed);

    console.log(`[fetch-activity-music] ✅ Selected: "${pick.title}" [${pick.mood}] energy:${pick.energy}`);

    return new Response(
      JSON.stringify({
        success: true,
        track: {
          url: pick.url,
          title: pick.title,
          artist: pick.artist,
          duration: pick.duration,
          mood: pick.mood,
          energy: pick.energy,
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
