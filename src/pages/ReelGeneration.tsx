import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { generateMotionRecap, photosToDAyStates, type DayState } from '@/lib/motion-recap-generator';
import { getRecapFromCache, saveRecapToCache } from '@/hooks/use-recap-cache';

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
];

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
    toast.success('Your recap video is ready!');
    setTimeout(() => {
      navigate('/reel', {
        replace: true,
        state: { weekRecapVideo: videoUrl, weekNumber },
      });
    }, 800);
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
      if (!forceRegenerate) {
        setPhase('Looking for your saved story...');
        const cachedBlob = await getRecapFromCache(weekNumber);
        if (cachedBlob) {
          const cachedUrl = URL.createObjectURL(cachedBlob);
          navigateToReel(cachedUrl, weekNumber);
          return;
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
          onProgress: (percent, phaseName) => {
            setProgress(percent);
            setPhase(phaseName);
          },
        });

        try {
          const response = await fetch(videoUrl);
          const blob = await response.blob();
          await saveRecapToCache(weekNumber, blob);
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
      <div className="relative z-20 px-4 pt-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Main Card */}
      <div className="relative z-10 flex-1 flex flex-col px-4 pb-4 min-h-0">
        <div
          className="flex-1 flex flex-col items-center justify-center rounded-3xl relative overflow-hidden min-h-0"
          style={{
            background: 'linear-gradient(180deg, rgba(20, 10, 40, 0.6) 0%, rgba(0, 0, 0, 0.8) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 0 60px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)' }} />

          {/* AI Star icon */}
          <div className="relative mb-8">
            <img
              src="/images/ai-star-loader.gif"
              alt="AI generating"
              className="w-28 h-28 object-contain"
              style={{ filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.6))' }}
            />
          </div>

          {/* Title */}
          <h2
            className="text-[28px] font-bold text-center leading-tight mb-auto"
            style={{
              background: 'linear-gradient(180deg, #C4B5FD 0%, #818CF8 50%, #6366F1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {error ? 'Generation failed' : (
              <>Generating<br />your week journey</>
            )}
          </h2>

          {/* Spacer to push motivational text and progress to bottom */}
          <div className="flex-1" />

          {/* Motivational phrase */}
          <p className="text-lg text-white/80 text-center font-medium mb-6 px-6">
            {error || motivationalPhrase}
          </p>

          {/* Progress bar inside card */}
          {!error && (
            <div className="w-full px-6 pb-6">
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.4) 100%)',
                    transition: 'width 0.4s ease-out',
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="pb-6">
              <button
                onClick={handleClose}
                className="px-6 py-2 rounded-full text-white/80 text-sm font-medium"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReelGeneration;
