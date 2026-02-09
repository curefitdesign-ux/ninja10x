import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
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

const ReelGeneration = () => {
  const [deviceHeight, setDeviceHeight] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('Setting the stage...');
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggered = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  // Calculate and set fixed device height
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

  // Elapsed timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Navigate to reel viewer with video URL
  const navigateToReel = useCallback((videoUrl: string, weekNumber: number) => {
    setProgress(100);
    setPhase('Your story is ready ✨');
    toast.success('Your recap video is ready!');
    setTimeout(() => {
      navigate('/reel', {
        replace: true,
        state: {
          weekRecapVideo: videoUrl,
          weekNumber,
        },
      });
    }, 800);
  }, [navigate]);

  // Trigger generation once
  useEffect(() => {
    if (hasTriggered.current) return;

    const photos = locationState?.weekPhotos;
    const weekNumber = locationState?.weekNumber || 1;
    const forceRegenerate = locationState?.forceRegenerate || false;

    if (!photos || photos.length < 3) {
      console.warn('[ReelGeneration] Not enough photos:', photos?.length);
      setError('Need at least 3 photos to generate a reel');
      return;
    }

    hasTriggered.current = true;

    // Check cache first (unless force regenerate)
    const run = async () => {
      if (!forceRegenerate) {
        setPhase('Looking for your saved story...');
        const cachedBlob = await getRecapFromCache(weekNumber);
        if (cachedBlob) {
          console.log('[ReelGeneration] Using cached video');
          const cachedUrl = URL.createObjectURL(cachedBlob);
          navigateToReel(cachedUrl, weekNumber);
          return;
        }
      }

      console.log('[ReelGeneration] Starting generation with', photos.length, 'photos');

      // Convert to DayState format
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

        // Save to cache as blob
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
      style={{
        height: deviceHeight > 0 ? `${deviceHeight}px` : '100dvh',
        minHeight: '-webkit-fill-available',
      }}
    >
      {/* Background glows */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 55%, rgba(59, 130, 246, 0.08) 0%, transparent 45%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 45%, rgba(236, 72, 153, 0.07) 0%, transparent 40%)' }} />
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all"
        style={{
          marginTop: 'env(safe-area-inset-top)',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Content */}
      <div className="relative z-10 w-full max-w-xs mx-6 flex flex-col items-center">
        {/* GIF Animation */}
        <div className="relative w-32 h-32 mb-8">
          <img
            src="/images/ai-star-loader.gif"
            alt="AI generating"
            className="w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 0 24px rgba(139, 92, 246, 0.5))' }}
          />
        </div>

        {/* Main title */}
        <h2 className="text-2xl font-semibold text-white text-center mb-3">
          {error ? 'Generation failed' : 'Generating your ai recap'}
        </h2>

        {/* Subtitle */}
        <p className="text-base text-white/40 text-center mb-8">
          {error || phase}
        </p>

        {/* Progress Section */}
        {!error && (
          <div className="w-full">
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full rounded-full origin-left"
                style={{
                  background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8))',
                  transform: `scaleX(${progress / 100})`,
                  transition: 'transform 0.4s ease-out',
                  willChange: 'transform',
                }}
              />
            </div>

            <div className="flex justify-between items-center text-sm mt-3">
              <span className="text-white/50 font-medium tabular-nums">
                {formatTime(elapsedSeconds)}
              </span>
              <span className="text-white/50 font-medium tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        )}

        {/* Retry button on error */}
        {error && (
          <button
            onClick={handleClose}
            className="mt-4 px-6 py-2 rounded-full text-white/80 text-sm font-medium hover:bg-white/20 transition-colors"
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            Go Back
          </button>
        )}
      </div>
    </div>
  );
};

export default ReelGeneration;
