const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Curated royalty-free music library (Pixabay Content License) ──
// Organized by mood/energy for AI-driven contextual matching
const MUSIC_LIBRARY: Array<{
  url: string; title: string; artist: string; duration: number;
  mood: string; energy: 'low' | 'medium' | 'high';
  tags: string[];
}> = [
  // ENERGETIC / HIGH ENERGY
  { url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_33f0d90acf.mp3', title: 'Energy', artist: 'Pixabay', duration: 126, mood: 'energetic', energy: 'high', tags: ['workout', 'pump', 'power', 'gym', 'lifting'] },
  { url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', title: 'Powerful Beat', artist: 'Pixabay', duration: 116, mood: 'energetic', energy: 'high', tags: ['strong', 'intense', 'bass', 'drop'] },
  { url: 'https://cdn.pixabay.com/audio/2023/07/30/audio_e5765c4e06.mp3', title: 'Pump It', artist: 'Pixabay', duration: 132, mood: 'energetic', energy: 'high', tags: ['edm', 'festival', 'hype', 'dance'] },
  { url: 'https://cdn.pixabay.com/audio/2023/10/08/audio_9a0f531cc2.mp3', title: 'Sport Motivation', artist: 'Pixabay', duration: 149, mood: 'energetic', energy: 'high', tags: ['sports', 'motivation', 'victory', 'champion'] },
  { url: 'https://cdn.pixabay.com/audio/2024/01/16/audio_94e2e38e4e.mp3', title: 'Workout Energy', artist: 'Pixabay', duration: 120, mood: 'energetic', energy: 'high', tags: ['fitness', 'cardio', 'hiit', 'crossfit'] },
  { url: 'https://cdn.pixabay.com/audio/2023/04/07/audio_15aa1fa605.mp3', title: 'Action Sports', artist: 'Pixabay', duration: 117, mood: 'energetic', energy: 'high', tags: ['action', 'extreme', 'adrenaline'] },

  // INTENSE / AGGRESSIVE
  { url: 'https://cdn.pixabay.com/audio/2023/03/14/audio_5a73dd7b83.mp3', title: 'Fight Mode', artist: 'Pixabay', duration: 128, mood: 'intense', energy: 'high', tags: ['boxing', 'mma', 'fight', 'combat', 'warrior'] },
  { url: 'https://cdn.pixabay.com/audio/2022/11/22/audio_febc508520.mp3', title: 'Dark Power', artist: 'Pixabay', duration: 136, mood: 'intense', energy: 'high', tags: ['dark', 'heavy', 'aggressive', 'beast'] },
  { url: 'https://cdn.pixabay.com/audio/2023/11/06/audio_a1b7e0e1d0.mp3', title: 'Beast Mode', artist: 'Pixabay', duration: 142, mood: 'intense', energy: 'high', tags: ['beast', 'relentless', 'power', 'grind'] },
  { url: 'https://cdn.pixabay.com/audio/2024/02/12/audio_e3c1a7f2b5.mp3', title: 'Aggressive Beat', artist: 'Pixabay', duration: 115, mood: 'intense', energy: 'high', tags: ['trap', 'hard', 'raw', 'brutal'] },

  // RHYTHMIC / RUNNING
  { url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3', title: 'Running Beat', artist: 'Pixabay', duration: 112, mood: 'rhythmic', energy: 'medium', tags: ['running', 'jogging', 'pace', 'stride', 'marathon'] },
  { url: 'https://cdn.pixabay.com/audio/2023/09/04/audio_3401e5f0ae.mp3', title: 'Jogging Rhythm', artist: 'Pixabay', duration: 148, mood: 'rhythmic', energy: 'medium', tags: ['jog', 'steady', 'endurance', 'road'] },
  { url: 'https://cdn.pixabay.com/audio/2022/12/13/audio_1e8cc2da2a.mp3', title: 'Upbeat Fun', artist: 'Pixabay', duration: 125, mood: 'rhythmic', energy: 'medium', tags: ['upbeat', 'fun', 'happy', 'positive'] },
  { url: 'https://cdn.pixabay.com/audio/2023/05/16/audio_166b15a20c.mp3', title: 'Motivational', artist: 'Pixabay', duration: 135, mood: 'rhythmic', energy: 'medium', tags: ['motivational', 'inspiring', 'journey', 'progress'] },
  { url: 'https://cdn.pixabay.com/audio/2024/03/18/audio_a1e8b4ea1a.mp3', title: 'Pulse Runner', artist: 'Pixabay', duration: 118, mood: 'rhythmic', energy: 'medium', tags: ['pulse', 'heartbeat', 'tempo', 'drive'] },

  // GROOVY / CYCLING
  { url: 'https://cdn.pixabay.com/audio/2022/04/27/audio_67bcbb2e2e.mp3', title: 'Funky Ride', artist: 'Pixabay', duration: 130, mood: 'groovy', energy: 'medium', tags: ['cycling', 'ride', 'funky', 'groove', 'spin'] },
  { url: 'https://cdn.pixabay.com/audio/2023/02/24/audio_4d03b0c9f8.mp3', title: 'Groove Machine', artist: 'Pixabay', duration: 122, mood: 'groovy', energy: 'medium', tags: ['groove', 'bounce', 'cool', 'smooth'] },
  { url: 'https://cdn.pixabay.com/audio/2022/07/15/audio_aef2c2b8ab.mp3', title: 'Cycling Beats', artist: 'Pixabay', duration: 118, mood: 'groovy', energy: 'medium', tags: ['bike', 'pedal', 'road', 'adventure'] },
  { url: 'https://cdn.pixabay.com/audio/2023/12/01/audio_c5e2f1a9d3.mp3', title: 'Street Flow', artist: 'Pixabay', duration: 140, mood: 'groovy', energy: 'medium', tags: ['street', 'urban', 'flow', 'chill-hop'] },

  // CALM / YOGA
  { url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_a0abc04f8e.mp3', title: 'Yoga Flow', artist: 'Pixabay', duration: 140, mood: 'calm', energy: 'low', tags: ['yoga', 'flow', 'stretch', 'flexibility', 'breathe'] },
  { url: 'https://cdn.pixabay.com/audio/2022/01/20/audio_d0a25f5b0f.mp3', title: 'Meditation Peace', artist: 'Pixabay', duration: 178, mood: 'calm', energy: 'low', tags: ['meditation', 'peace', 'mindful', 'zen'] },
  { url: 'https://cdn.pixabay.com/audio/2022/10/09/audio_d7a13b5804.mp3', title: 'Gentle Morning', artist: 'Pixabay', duration: 152, mood: 'calm', energy: 'low', tags: ['morning', 'gentle', 'sunrise', 'fresh'] },
  { url: 'https://cdn.pixabay.com/audio/2023/02/08/audio_69a61cd6d6.mp3', title: 'Zen Garden', artist: 'Pixabay', duration: 165, mood: 'calm', energy: 'low', tags: ['zen', 'garden', 'tranquil', 'serene'] },
  { url: 'https://cdn.pixabay.com/audio/2023/08/20/audio_2cd28f2e09.mp3', title: 'Inner Peace', artist: 'Pixabay', duration: 190, mood: 'calm', energy: 'low', tags: ['inner', 'peace', 'spiritual', 'healing'] },

  // AMBIENT / TREKKING
  { url: 'https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3', title: 'Nature Walk', artist: 'Pixabay', duration: 160, mood: 'ambient', energy: 'low', tags: ['nature', 'walk', 'hiking', 'trekking', 'outdoor'] },
  { url: 'https://cdn.pixabay.com/audio/2022/09/08/audio_9c5a44e5e1.mp3', title: 'Deep Ambient', artist: 'Pixabay', duration: 174, mood: 'ambient', energy: 'low', tags: ['deep', 'atmospheric', 'space', 'dreamy'] },
  { url: 'https://cdn.pixabay.com/audio/2023/01/10/audio_cb8d84c59a.mp3', title: 'Floating', artist: 'Pixabay', duration: 145, mood: 'ambient', energy: 'low', tags: ['floating', 'weightless', 'ethereal', 'swimming'] },
  { url: 'https://cdn.pixabay.com/audio/2023/06/14/audio_3e5a8dfbe0.mp3', title: 'Ocean Breeze', artist: 'Pixabay', duration: 155, mood: 'ambient', energy: 'low', tags: ['ocean', 'beach', 'breeze', 'water'] },

  // CELEBRATORY / ACHIEVEMENT
  { url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8cb6e22fd3.mp3', title: 'Victory Anthem', artist: 'Pixabay', duration: 130, mood: 'celebratory', energy: 'high', tags: ['victory', 'win', 'achievement', 'celebration', 'milestone'] },
  { url: 'https://cdn.pixabay.com/audio/2023/04/20/audio_d4e1c9f7b2.mp3', title: 'Champion Rise', artist: 'Pixabay', duration: 118, mood: 'celebratory', energy: 'high', tags: ['champion', 'rise', 'glory', 'success', 'streak'] },
];

// Build the AI prompt with full library context
function buildMusicLibraryContext(): string {
  return MUSIC_LIBRARY.map((t, i) =>
    `[${i}] "${t.title}" — mood:${t.mood}, energy:${t.energy}, tags:[${t.tags.join(',')}]`
  ).join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { activity, seed, journeyData } = await req.json();

    // journeyData contains rich context: activities[], durations[], streakDays, weekNumber, userName
    const journeyContext = journeyData || {};
    const activities: string[] = journeyContext.activities || [activity || 'workout'];
    const durations: string[] = journeyContext.durations || [];
    const streakDays: number = journeyContext.streakDays || activities.length;
    const weekNumber: number = journeyContext.weekNumber || 1;
    const userName: string = journeyContext.userName || 'User';
    const intensities: string[] = journeyContext.intensities || [];
    const prs: string[] = journeyContext.prs || [];

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    let selectedTrackIndex: number | null = null;

    // ── AI-POWERED SELECTION via Gemini ──
    if (LOVABLE_API_KEY) {
      try {
        const libraryContext = buildMusicLibraryContext();

        const userJourneySummary = `
User: ${userName}
Week: ${weekNumber}, Streak: ${streakDays} days
Activities this week: ${activities.join(', ')}
Durations: ${durations.join(', ')}
Intensities: ${intensities.join(', ')}
Personal Records: ${prs.filter(Boolean).join(', ') || 'None'}
Overall vibe: ${streakDays >= 6 ? 'Incredible streak, celebratory' : streakDays >= 3 ? 'Building momentum, motivated' : 'Just getting started, encouraging'}
`.trim();

        const prompt = `You are a music curator for a fitness journey recap video. Based on the user's workout data, pick THE SINGLE BEST track from this library.

MUSIC LIBRARY:
${libraryContext}

USER JOURNEY:
${userJourneySummary}

Rules:
- If user did boxing/MMA → prefer intense tracks
- If user did yoga/meditation → prefer calm tracks  
- If user hit a long streak (6+ days) → consider celebratory tracks
- If user did running → prefer rhythmic tracks with good pace
- If user did cycling → prefer groovy tracks
- If mix of high-energy activities → prefer energetic tracks
- Match the ENERGY of their journey — don't pick calm music for intense workouts
- Consider personal records — if they set PRs, lean celebratory/intense

Return ONLY the track index number (e.g. "5"). Nothing else.`;

        console.log('[AI Music] Asking Gemini for contextual track selection...');

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages: [
              { role: 'system', content: 'You are a music selection AI. Return ONLY a single number — the index of the best track. No explanation.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 10,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content?.trim() || '';
          const parsed = parseInt(content, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < MUSIC_LIBRARY.length) {
            selectedTrackIndex = parsed;
            console.log(`[AI Music] ✨ Gemini selected track #${parsed}: "${MUSIC_LIBRARY[parsed].title}" for journey: ${activities.join('+')}`);
          } else {
            console.warn('[AI Music] Gemini returned invalid index:', content);
          }
        } else {
          const errText = await aiResponse.text();
          console.warn('[AI Music] Gemini API error:', aiResponse.status, errText);
        }
      } catch (aiErr) {
        console.warn('[AI Music] AI selection failed, falling back:', aiErr);
      }
    }

    // ── FALLBACK: seed-based selection with mood matching ──
    if (selectedTrackIndex === null) {
      // Simple mood-based fallback
      const activityStr = activities.join(' ').toLowerCase();
      let targetMood = 'rhythmic';
      if (activityStr.includes('box') || activityStr.includes('mma')) targetMood = 'intense';
      else if (activityStr.includes('yoga') || activityStr.includes('meditat')) targetMood = 'calm';
      else if (activityStr.includes('cycl') || activityStr.includes('spin')) targetMood = 'groovy';
      else if (activityStr.includes('trek') || activityStr.includes('hik') || activityStr.includes('swim')) targetMood = 'ambient';
      else if (activityStr.includes('basket') || activityStr.includes('football')) targetMood = 'energetic';

      // If long streak, bias towards celebratory
      if (streakDays >= 6) targetMood = 'celebratory';

      const moodTracks = MUSIC_LIBRARY.map((t, i) => ({ ...t, idx: i })).filter(t => t.mood === targetMood);
      const pool = moodTracks.length > 0 ? moodTracks : MUSIC_LIBRARY.map((t, i) => ({ ...t, idx: i }));

      const pickSeed = seed || Date.now();
      const pickIndex = Math.abs(pickSeed) % pool.length;
      selectedTrackIndex = pool[pickIndex].idx;

      console.log(`[AI Music] Fallback selection: mood=${targetMood}, track #${selectedTrackIndex}: "${MUSIC_LIBRARY[selectedTrackIndex].title}"`);
    }

    const pick = MUSIC_LIBRARY[selectedTrackIndex];

    // ── Use seed to add slight randomness when AI picks same track ──
    // If seed changes, and AI returns same track, rotate to next in same mood
    const pickSeed = seed || Date.now();
    const sameModTracks = MUSIC_LIBRARY.filter(t => t.mood === pick.mood);
    const rotateOffset = Math.abs(pickSeed) % Math.max(1, sameModTracks.length);
    const finalTrack = sameModTracks.length > 1 && rotateOffset > 0
      ? sameModTracks[rotateOffset]
      : pick;

    console.log(`[AI Music] 🎵 Final: "${finalTrack.title}" (mood:${finalTrack.mood}, energy:${finalTrack.energy})`);

    return new Response(
      JSON.stringify({
        success: true,
        track: {
          url: finalTrack.url,
          title: finalTrack.title,
          artist: finalTrack.artist,
          duration: finalTrack.duration,
          mood: finalTrack.mood,
          energy: finalTrack.energy,
          tags: finalTrack.tags,
          aiSelected: selectedTrackIndex !== null,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[AI Music] Error:', error);
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
