const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Google Sheet CSV URL for the music library
const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSULjLQtj5rUcU4yD50ps-XJ_bwPiz0bZ_9llwjBT156XwkRxRu_7v9mUu4Bta4-_ZNRYXkETdxeWOX/pub?output=csv';

// In-memory cache so we don't fetch the sheet on every request
let cachedTracks: Array<Record<string, string>> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Parse CSV ──
function parseCsv(csv: string): Array<Record<string, string>> {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  // Split respecting quoted fields
  const splitLine = (line: string): string[] =>
    line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/g).map(c => c.trim().replace(/^"|"$/g, ''));

  const headers = splitLine(lines[0]).map(h => h.toLowerCase().trim());
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

// ── Fetch and cache tracks from Google Sheet ──
async function fetchSheetTracks(): Promise<Array<Record<string, string>>> {
  const now = Date.now();
  if (cachedTracks && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedTracks;
  }

  console.log('[Music Sheet] Fetching tracks from Google Sheet...');
  const resp = await fetch(SHEET_CSV_URL);
  if (!resp.ok) {
    console.error('[Music Sheet] Failed to fetch CSV:', resp.status);
    throw new Error(`Sheet fetch failed: ${resp.status}`);
  }

  const csv = await resp.text();
  const rows = parseCsv(csv);
  console.log(`[Music Sheet] Parsed ${rows.length} tracks. Columns: ${rows.length > 0 ? Object.keys(rows[0]).join(', ') : 'none'}`);

  cachedTracks = rows;
  cacheTimestamp = now;
  return rows;
}

// Build a compact text summary of the sheet library for the AI prompt
function buildSheetLibraryContext(tracks: Array<Record<string, string>>): string {
  return tracks.map((t, i) => {
    // Adapt to whatever columns exist in the sheet
    const parts = Object.entries(t)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}:${v}`)
      .join(', ');
    return `[${i}] ${parts}`;
  }).join('\n');
}

// ── Hardcoded fallback library (Pixabay, royalty-free) ──
const FALLBACK_LIBRARY = [
  { url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_33f0d90acf.mp3', title: 'Energy', mood: 'energetic' },
  { url: 'https://cdn.pixabay.com/audio/2023/03/14/audio_5a73dd7b83.mp3', title: 'Fight Mode', mood: 'intense' },
  { url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3', title: 'Running Beat', mood: 'rhythmic' },
  { url: 'https://cdn.pixabay.com/audio/2022/04/27/audio_67bcbb2e2e.mp3', title: 'Funky Ride', mood: 'groovy' },
  { url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_a0abc04f8e.mp3', title: 'Yoga Flow', mood: 'calm' },
  { url: 'https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3', title: 'Nature Walk', mood: 'ambient' },
  { url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8cb6e22fd3.mp3', title: 'Victory Anthem', mood: 'celebratory' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { activity, seed, journeyData, previousTrackIndex } = await req.json();

    const journeyContext = journeyData || {};
    const activities: string[] = journeyContext.activities || [activity || 'workout'];
    const durations: string[] = journeyContext.durations || [];
    const streakDays: number = journeyContext.streakDays || activities.length;
    const weekNumber: number = journeyContext.weekNumber || 1;
    const userName: string = journeyContext.userName || 'User';
    const intensities: string[] = journeyContext.intensities || [];
    const prs: string[] = journeyContext.prs || [];
    const prevIdx: number | null = typeof previousTrackIndex === 'number' ? previousTrackIndex : null;

    // ── Step 1: Fetch tracks from Google Sheet ──
    let sheetTracks: Array<Record<string, string>> = [];
    try {
      sheetTracks = await fetchSheetTracks();
    } catch (err) {
      console.warn('[Music] Could not load Google Sheet, will use fallback library:', err);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    // ── Step 2: AI-powered contextual selection via Lovable AI (Gemini) ──
    if (LOVABLE_API_KEY && sheetTracks.length > 0) {
      try {
        const libraryContext = buildSheetLibraryContext(sheetTracks);

        const userJourneySummary = `
User: ${userName}
Week: ${weekNumber}, Streak: ${streakDays} days
Activities this week: ${activities.join(', ')}
Durations: ${durations.join(', ')}
Intensities: ${intensities.join(', ')}
Personal Records: ${prs.filter(Boolean).join(', ') || 'None'}
Overall vibe: ${streakDays >= 6 ? 'Incredible streak, celebratory' : streakDays >= 3 ? 'Building momentum, motivated' : 'Just getting started, encouraging'}
`.trim();

        const avoidClause = prevIdx !== null
          ? `\n- IMPORTANT: Do NOT pick track index ${prevIdx} — that was used last time. Pick a DIFFERENT track.`
          : '';

        const prompt = `You are a music curator for a fitness journey recap video. Pick THE SINGLE BEST track from this library based on the user's workout data and content.

MUSIC LIBRARY (from Google Sheet):
${libraryContext}

USER JOURNEY:
${userJourneySummary}

Rules:
- CRITICAL: Do NOT select any Hindi songs, Bollywood songs, or songs in Hindi/Indian languages. English or instrumental tracks ONLY.${avoidClause}
- Match the song's mood/genre/tags to the user's specific activities and energy level
- Consider the visual content: photos/videos of the user's workouts should feel enhanced by the music
- Boxing/MMA/martial arts → intense, aggressive, hard-hitting electronic or rock tracks
- Yoga/meditation/stretching → calm, ambient, peaceful instrumental tracks
- Running/jogging/sprinting → rhythmic, upbeat, high-BPM tracks with driving energy
- Cycling/spinning → groovy, driving, EDM or electronic tracks
- Weight training/gym → powerful, bass-heavy, motivational tracks
- Swimming → flowing, atmospheric tracks
- Team sports (basketball, football, cricket) → energetic, anthemic, stadium-feel tracks
- Trekking/hiking → epic, cinematic, nature-inspired tracks
- Dancing → funky, groove-heavy, rhythmic tracks
- Long streak (6+ days) → celebratory/triumphant tracks
- If the user set personal records → lean celebratory/intense
- Look at ALL columns in the library — title, mood, genre, tags, category, language — to find the best match
- Prefer instrumental or English-language tracks that work universally

Return ONLY the track index number (e.g. "5"). Nothing else.`;

        console.log('[AI Music] Asking Lovable AI for contextual track selection...');

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
            temperature: 1.2,
            max_tokens: 10,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content?.trim() || '';
          const parsed = parseInt(content, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < sheetTracks.length) {
            const selectedRow = sheetTracks[parsed];
            console.log(`[AI Music] ✨ Selected track #${parsed} from sheet:`, JSON.stringify(selectedRow));

            // Find a URL column (adapt to whatever the sheet columns are named)
            const urlKey = Object.keys(selectedRow).find(k =>
              k.includes('url') || k.includes('link') || k.includes('mp3') || k.includes('source') || k.includes('audio')
            );
            const titleKey = Object.keys(selectedRow).find(k =>
              k.includes('title') || k.includes('name') || k.includes('song') || k.includes('track')
            );
            const moodKey = Object.keys(selectedRow).find(k =>
              k.includes('mood') || k.includes('genre') || k.includes('category') || k.includes('vibe')
            );

            const trackUrl = urlKey ? selectedRow[urlKey] : '';
            const trackTitle = titleKey ? selectedRow[titleKey] : `Track ${parsed + 1}`;
            const trackMood = moodKey ? selectedRow[moodKey] : 'mixed';

            if (trackUrl) {
              return new Response(
                JSON.stringify({
                  success: true,
                  track: {
                    url: trackUrl,
                    title: trackTitle,
                    artist: 'Google Sheet Library',
                    duration: parseInt(selectedRow['duration'] || '120', 10) || 120,
                    mood: trackMood,
                    energy: 'medium',
                    tags: activities,
                    aiSelected: true,
                    source: 'google-sheet',
                    trackIndex: parsed,
                  },
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
              );
            } else {
              console.warn('[AI Music] Selected row has no URL column. Row keys:', Object.keys(selectedRow));
            }
          } else {
            console.warn('[AI Music] AI returned invalid index:', content);
          }
        } else {
          const errText = await aiResponse.text();
          console.warn('[AI Music] Lovable AI error:', aiResponse.status, errText);
        }
      } catch (aiErr) {
        console.warn('[AI Music] AI selection failed, falling back:', aiErr);
      }
    }

    // ── Fallback: simple mood-based selection from Pixabay library ──
    const activityStr = activities.join(' ').toLowerCase();
    let targetMood = 'rhythmic';
    if (activityStr.includes('box') || activityStr.includes('mma')) targetMood = 'intense';
    else if (activityStr.includes('yoga') || activityStr.includes('meditat')) targetMood = 'calm';
    else if (activityStr.includes('cycl') || activityStr.includes('spin')) targetMood = 'groovy';
    else if (activityStr.includes('trek') || activityStr.includes('hik') || activityStr.includes('swim')) targetMood = 'ambient';
    else if (activityStr.includes('basket') || activityStr.includes('football')) targetMood = 'energetic';
    if (streakDays >= 6) targetMood = 'celebratory';

    const moodTracks = FALLBACK_LIBRARY.filter(t => t.mood === targetMood);
    const pool = moodTracks.length > 0 ? moodTracks : FALLBACK_LIBRARY;
    const pickSeed = seed || Date.now();
    const pick = pool[Math.abs(pickSeed) % pool.length];

    console.log(`[AI Music] Fallback: "${pick.title}" (mood:${pick.mood})`);

    return new Response(
      JSON.stringify({
        success: true,
        track: {
          url: pick.url,
          title: pick.title,
          artist: 'Pixabay',
          duration: 120,
          mood: pick.mood,
          energy: 'medium',
          tags: activities,
          aiSelected: false,
          source: 'fallback',
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[AI Music] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackToSynth: true,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
