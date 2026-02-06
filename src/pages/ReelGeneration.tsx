import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useFitnessReel } from '@/hooks/use-fitness-reel';

interface LocationState {
  weekPhotos?: Array<{
    id: string;
    imageUrl: string;
    activity: string;
    duration?: string;
    distance?: string;
    pr?: string;
    uploadDate: string;
    dayNumber: number;
    isVideo?: boolean;
  }>;
  weekNumber?: number;
  isComplete?: boolean;
}

const ReelGeneration = () => {
  const [deviceHeight, setDeviceHeight] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggered = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  const {
    generateReel,
    isGenerating,
    generationProgress,
    currentReel,
  } = useFitnessReel();

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

  // Trigger actual generation once
  useEffect(() => {
    if (hasTriggered.current) return;
    const photos = locationState?.weekPhotos;
    if (photos && photos.length >= 3) {
      hasTriggered.current = true;
      console.log('[ReelGeneration] Triggering generateReel with', photos.length, 'photos');
      generateReel(photos);
    }
  }, [locationState, generateReel]);

  // When generation completes, navigate to reel viewer
  useEffect(() => {
    if (!isGenerating && currentReel?.videoUrl && hasTriggered.current && generationProgress >= 100) {
      const timer = setTimeout(() => {
        navigate('/reel', {
          replace: true,
          state: {
            weekRecapVideo: currentReel.videoUrl,
            weekNumber: locationState?.weekNumber || 1,
          },
        });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, currentReel, generationProgress, navigate, locationState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Use real progress from the generator
  const displayProgress = Math.round(generationProgress);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
      style={{
        height: deviceHeight > 0 ? `${deviceHeight}px` : '100dvh',
        minHeight: '-webkit-fill-available',
      }}
    >
      {/* Static background — no animated scale to prevent flickering */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 35%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 55%, rgba(59, 130, 246, 0.08) 0%, transparent 45%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 70% 45%, rgba(236, 72, 153, 0.07) 0%, transparent 40%)',
          }}
        />
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all"
        style={{ marginTop: 'env(safe-area-inset-top)' }}
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
          Generating your ai recap
        </h2>

        {/* Subtitle */}
        <p className="text-base text-white/40 text-center mb-8">
          This usually takes 1-2 minutes
        </p>

        {/* Progress Section */}
        <div className="w-full">
          {/* Progress Bar — GPU-accelerated scaleX */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full origin-left"
              style={{
                background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8))',
                transform: `scaleX(${displayProgress / 100})`,
                transition: 'transform 0.4s ease-out',
                willChange: 'transform',
              }}
            />
          </div>

          {/* Timer and Percentage */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/50 font-medium tabular-nums">
              {formatTime(elapsedSeconds)}
            </span>
            <span className="text-white/50 font-medium tabular-nums">
              {displayProgress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelGeneration;
