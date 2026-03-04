import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { generateMotionRecap, photosToDAyStates, type DayState } from '@/lib/motion-recap-generator';
import { getRecapFromCache, saveRecapToCache, deleteRecapFromCache, clearAllRecapCache } from '@/hooks/use-recap-cache';
import { useProfile } from '@/hooks/use-profile';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';

interface PhotoData {
  id: string;
  imageUrl: string;
  activity: string;
  duration?: string;
  distance?: string;
  pr?: string;
  uploadDate: string;
  dayNumber: number;
  isVideo?: boolean;
}

interface LocationState {
  weekPhotos?: PhotoData[];
  weekNumber?: number;
  forceRegenerate?: boolean;
}

const MOTIVATIONAL_PHRASES = [
  'Conquer will power',
  'Embrace the grind',
  'Stronger every day',
  'Push your limits',
  'Unleash your fire',
  'Own the moment',
  'Rise and shine',
  'Fuel the hustle',
  'Break barriers',
  'One rep at a time',
  'No excuses today',
  'Chase greatness',
];

/** Upload generated reel blob to Supabase storage for cross-device access */
async function uploadReelToStorage(blob: Blob, userId: string, weekNumber: number): Promise<string | null> {
  try {
    const path = `reels/${userId}/week-${weekNumber}.webm`;
    // Remove old file first (ignore errors)
    await supabase.storage.from('journey-uploads').remove([path]);
    const { error } = await supabase.storage
      .from('journey-uploads')
      .upload(path, blob, { contentType: 'video/webm', upsert: true });
    if (error) {
      console.warn('[ReelUpload] Storage upload failed:', error.message);
      return null;
    }
    const { data: urlData } = supabase.storage.from('journey-uploads').getPublicUrl(path);
    console.log('[ReelUpload] Uploaded reel to storage:', path);
    return urlData.publicUrl;
  } catch (err) {
    console.warn('[ReelUpload] Upload error:', err);
    return null;
  }
}

const ReelGeneration = () => {
  const [deviceHeight, setDeviceHeight] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('Setting the stage...');
  const [error, setError] = useState<string | null>(null);
  const [motivationalPhrase] = useState(() =>
    MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)]
  );
  const hasTriggered = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  const { user } = useAuth();
  const locationState = location.state as LocationState | null;

  useEffect(() => {
    const updateHeight = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      setDeviceHeight(height);
    };
    updateHeight();
    window.visualViewport?.addEventListener('resize', updateHeight);
    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight);
    };
  }, []);

  const navigateToReel = useCallback((videoUrl: string, weekNumber: number) => {
    setProgress(100);
    setPhase('Your story is ready ✨');
    // Navigate immediately — no delay for cached reels
    navigate('/reel', {
      replace: true,
      state: { weekRecapVideo: videoUrl, weekNumber },
    });
  }, [navigate]);

  useEffect(() => {
    if (hasTriggered.current) return;

    const photos = locationState?.weekPhotos;
    const weekNumber = locationState?.weekNumber || 1;
    const forceRegenerate = locationState?.forceRegenerate || false;

    if (!photos || photos.length < 3) {
      setError('Need at least 3 photos to generate a reel');
      return;
    }

    hasTriggered.current = true;

    const run = async () => {
      if (forceRegenerate) {
        // NUCLEAR: Clear ALL caches — local IndexedDB + cloud storage
        console.log('[ReelGeneration] 🔥 FORCE REGENERATE — nuking all caches');
        await clearAllRecapCache();
        if (user?.id) {
          const path = `reels/${user.id}/week-${weekNumber}.webm`;
          await supabase.storage.from('journey-uploads').remove([path]).catch(() => {});
          console.log('[ReelGeneration] ☁️ Deleted cloud reel:', path);
        }
        // Skip ALL cache lookups — go straight to generation
        console.log('[ReelGeneration] ⚡ Skipping all caches, generating fresh reel...');
      } else {
        setPhase('Looking for your saved story...');
        // Try local cache first
        const cachedBlob = await getRecapFromCache(weekNumber, user?.id);
        if (cachedBlob) {
          console.log('[ReelGeneration] 💾 Found local cache hit');
          const cachedUrl = URL.createObjectURL(cachedBlob);
          navigateToReel(cachedUrl, weekNumber);
          return;
        }
        // Try cloud storage (add cache buster to avoid stale CDN responses)
        if (user?.id) {
          const cloudPath = `reels/${user.id}/week-${weekNumber}.webm`;
          const { data: urlData } = supabase.storage.from('journey-uploads').getPublicUrl(cloudPath);
          if (urlData?.publicUrl) {
            try {
              const resp = await fetch(`${urlData.publicUrl}?t=${Date.now()}`);
              if (resp.ok && resp.headers.get('content-type')?.includes('video')) {
                const blob = await resp.blob();
                if (blob.size > 1000) {
                  console.log('[ReelGeneration] ☁️ Found cloud cache hit');
                  await saveRecapToCache(weekNumber, blob, user.id);
                  const url = URL.createObjectURL(blob);
                  navigateToReel(url, weekNumber);
                  return;
                }
              }
            } catch { /* fall through to generation */ }
          }
        }
      }

      const dayStates: DayState[] = photosToDAyStates(photos.map(p => ({
        imageUrl: p.imageUrl,
        activity: p.activity || 'Workout',
        duration: p.duration,
        distance: p.distance,
        pr: p.pr,
        dayNumber: p.dayNumber,
        isVideo: p.isVideo,
      })));

      setProgress(5);
      setPhase('Loading photos...');

      try {
        const videoUrl = await generateMotionRecap({
          dayStates,
          userName: profile?.display_name,
          weekNumber,
          onProgress: (percent, phaseName) => {
            setProgress(percent);
            setPhase(phaseName);
          },
        });

        // Save to local cache AND cloud storage
        try {
          const response = await fetch(videoUrl);
          const blob = await response.blob();
          await saveRecapToCache(weekNumber, blob, user?.id);
          // Upload to cloud for cross-device access
          if (user?.id) {
            uploadReelToStorage(blob, user.id, weekNumber); // fire-and-forget
          }
        } catch (cacheErr) {
          console.warn('[ReelGeneration] Failed to cache:', cacheErr);
        }

        navigateToReel(videoUrl, weekNumber);
      } catch (err) {
        console.error('[ReelGeneration] Generation failed:', err);
        const message = err instanceof Error ? err.message : 'Failed to generate reel';
        setError(message);
        toast.error(message);
      }
    };

    run();
  }, [locationState, navigateToReel]);

  const handleClose = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-black"
      style={{
        height: deviceHeight > 0 ? `${deviceHeight}px` : '100dvh',
        minHeight: '-webkit-fill-available',
      }}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 55%, rgba(59, 130, 246, 0.1) 0%, transparent 45%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 45%, rgba(236, 72, 153, 0.08) 0%, transparent 40%)' }} />
      </div>

      {/* Back Button */}
      <div
        className="relative z-20 px-4 pt-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Main Card */}
      <div className="relative z-10 flex-1 flex flex-col px-4 pb-4 min-h-0">
        <motion.div
          className="flex-1 flex flex-col items-center justify-center rounded-3xl relative overflow-hidden min-h-0 max-w-[340px] mx-auto w-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            background: 'linear-gradient(180deg, rgba(20, 10, 40, 0.6) 0%, rgba(0, 0, 0, 0.8) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 0 60px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)' }} />

          {/* Blurred background gif */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <img
              src="/images/ai-star-loader.gif"
              alt=""
              className="w-32 h-32 object-contain opacity-30"
              style={{ filter: 'blur(30px) saturate(150%)' }}
            />
          </div>

          {/* Centered content group */}
          <div className="flex flex-col items-center justify-center flex-1 w-full">
            {/* AI Star icon */}
            <motion.div
              className="relative mb-5"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
            >
              <img
                src="/images/ai-star-loader.gif"
                alt="AI generating"
                className="w-16 h-16 object-contain"
                style={{ filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))' }}
              />
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-lg font-extrabold text-center leading-tight"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.15, ease: 'easeOut' }}
              style={{
                background: 'linear-gradient(180deg, #C4B5FD 0%, #818CF8 50%, #6366F1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {error ? 'Generation failed' : (
                <>Generating<br />your week journey</>
              )}
            </motion.h2>

            {/* Sub copy — inside centered group when error */}
            {error && (
              <motion.p
                className="text-sm text-white/70 text-center font-semibold px-6 mt-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.p>
            )}
          </div>

          {/* Motivational phrase — below centered group when generating */}
          {!error && (
            <AnimatePresence mode="wait">
              <motion.p
                key={motivationalPhrase}
                className="text-sm text-white/70 text-center font-semibold mb-3 px-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {motivationalPhrase}
              </motion.p>
            </AnimatePresence>
          )}

          {/* Phase label with crossfade */}
          {/* Phase label */}
          {!error && (
            <AnimatePresence mode="wait">
              <motion.p
                key={phase}
                className="text-xs text-white/40 text-center font-medium mb-4 px-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {phase}
              </motion.p>
            </AnimatePresence>
          )}

          {/* Progress bar */}
          {!error && (
            <div className="w-full px-6 pb-6">
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.35) 100%)',
                    width: `${progress}%`,
                    transition: 'width 0.3s ease-out',
                  }}
                />
              </div>
              <p className="text-[10px] text-white/30 text-right mt-2 font-medium tabular-nums">
                {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <></>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ReelGeneration;
