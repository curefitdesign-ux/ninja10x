import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX, Loader2, Sparkles } from 'lucide-react';
import { useFitnessReel, ReelResult } from '@/hooks/use-fitness-reel';
import { composeVideo, CompositorPhoto } from '@/lib/video-compositor';
import type { GenerationStep } from './ReelGenerationOverlay';

interface AIReelViewerProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Array<{
    id: string;
    storageUrl: string;
    originalUrl?: string;
    activity?: string;
    dayNumber: number;
    duration?: string;
    pr?: string;
  }>;
  autoGenerate?: boolean;
}

// Generation step labels
const STEP_LABELS: Record<GenerationStep, string> = {
  narration: 'Writing script...',
  voiceover: 'Recording voiceover...',
  video: 'Creating your reel...',
  complete: 'Ready!',
};

export default function AIReelViewer({ isOpen, onClose, photos, autoGenerate = true }: AIReelViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [composingProgress, setComposingProgress] = useState(0);
  const [composingPhase, setComposingPhase] = useState('');
  const [useLocalComposition, setUseLocalComposition] = useState(true);

  const {
    generateReel,
    isGenerating,
    currentStep,
    currentReel,
    reelHistory,
  } = useFitnessReel();

  // Check if we have an existing reel for these photos
  const existingReel = reelHistory.find(r => r.videoUrl);

  // Auto-generate or compose on open
  useEffect(() => {
    if (!isOpen || photos.length < 3) return;

    if (existingReel?.videoUrl) {
      // Use existing cloud-generated reel
      setLocalVideoUrl(null);
      return;
    }

    if (useLocalComposition && !localVideoUrl && !isGenerating) {
      // Use client-side composition (free, instant)
      composeLocalVideo();
    } else if (!useLocalComposition && autoGenerate && !isGenerating && !currentReel) {
      // Use cloud AI generation
      const photoData = photos.map(p => ({
        id: p.id,
        imageUrl: p.originalUrl || p.storageUrl,
        activity: p.activity || 'Workout',
        duration: p.duration,
        pr: p.pr,
        uploadDate: new Date().toISOString().split('T')[0],
        dayNumber: p.dayNumber,
      }));
      generateReel(photoData);
    }
  }, [isOpen, photos, existingReel, useLocalComposition, localVideoUrl, isGenerating, autoGenerate]);

  // Client-side video composition
  const composeLocalVideo = async () => {
    try {
      const compositorPhotos: CompositorPhoto[] = photos.map(p => ({
        imageUrl: p.originalUrl || p.storageUrl,
        activity: p.activity,
        dayNumber: p.dayNumber,
      }));

      const videoUrl = await composeVideo({
        photos: compositorPhotos,
        durationPerPhoto: 2,
        transitionDuration: 0.4,
        fps: 24,
        width: 720,
        height: 1280,
        style: 'brutalist',
        onProgress: (percent, phase) => {
          setComposingProgress(percent);
          setComposingPhase(phase);
        },
      });

      setLocalVideoUrl(videoUrl);
    } catch (err) {
      console.error('Local composition failed:', err);
      // Fallback to cloud generation
      setUseLocalComposition(false);
    }
  };

  // Play/pause control
  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Auto-play when video is ready
  useEffect(() => {
    const videoUrl = localVideoUrl || existingReel?.videoUrl || currentReel?.videoUrl;
    if (videoUrl && videoRef.current) {
      videoRef.current.src = videoUrl;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [localVideoUrl, existingReel?.videoUrl, currentReel?.videoUrl]);

  if (!isOpen) return null;

  const videoUrl = localVideoUrl || existingReel?.videoUrl || currentReel?.videoUrl;
  const isLoading = (useLocalComposition && !localVideoUrl) || (!useLocalComposition && isGenerating);
  const progress = useLocalComposition ? composingProgress : (
    currentStep === 'narration' ? 25 :
    currentStep === 'voiceover' ? 50 :
    currentStep === 'video' ? 75 : 100
  );
  const statusText = useLocalComposition ? composingPhase : STEP_LABELS[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] bg-black flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 text-white/90">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">AI Fitness Reel</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center relative">
          {isLoading ? (
            // Loading state
            <div className="flex flex-col items-center gap-6 px-8">
              <motion.div
                className="relative w-24 h-24"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, #fbbf24, #f97316, #ec4899, #8b5cf6, #fbbf24)',
                    mask: 'radial-gradient(transparent 55%, black 55%)',
                    WebkitMask: 'radial-gradient(transparent 55%, black 55%)',
                  }}
                />
                <div className="absolute inset-2 rounded-full bg-black flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white/80 animate-spin" />
                </div>
              </motion.div>

              <div className="text-center">
                <p className="text-white/90 font-medium mb-2">{statusText}</p>
                <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #fbbf24, #f97316, #ec4899)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-white/50 text-xs mt-2">{Math.round(progress)}%</p>
              </div>

              {/* Photo previews */}
              <div className="flex gap-2 mt-4">
                {photos.slice(0, 3).map((photo, i) => (
                  <motion.div
                    key={photo.dayNumber}
                    className="w-16 h-20 rounded-lg overflow-hidden border border-white/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <img
                      src={photo.originalUrl || photo.storageUrl}
                      alt={photo.activity}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : videoUrl ? (
            // Video player
            <motion.div
              className="w-full h-full flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={togglePlayback}
            >
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                loop
                playsInline
                muted={isMuted}
              />

              {/* Play/pause overlay */}
              <AnimatePresence>
                {!isPlaying && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-black/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <Play className="w-10 h-10 text-white ml-1" fill="white" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            // Error/empty state
            <div className="text-center px-8">
              <p className="text-white/60">Unable to generate reel</p>
              <button
                onClick={() => {
                  setLocalVideoUrl(null);
                  if (useLocalComposition) {
                    composeLocalVideo();
                  }
                }}
                className="mt-4 px-6 py-2 bg-white/10 rounded-full text-white text-sm"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer controls */}
        {videoUrl && (
          <div className="absolute bottom-0 left-0 right-0 z-20 px-4 py-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <button
                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                className="p-2 text-white/80"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>

              <div className="flex items-center gap-2">
                {photos.slice(0, 3).map((p) => (
                  <span
                    key={p.dayNumber}
                    className="px-2 py-1 bg-white/10 rounded-full text-white/70 text-xs"
                  >
                    {p.activity || `Day ${p.dayNumber}`}
                  </span>
                ))}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); togglePlayback(); }}
                className="p-2 text-white/80"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
