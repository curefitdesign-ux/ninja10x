import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { GenerationStep } from './ReelGenerationOverlay';

interface ReelProgressWidgetProps {
  isGenerating: boolean;
  currentStep: GenerationStep;
  progress: number; // 0-100
  photos: Array<{
    imageUrl: string;
    activity: string;
    dayNumber: number;
  }>;
  onViewReel?: () => void;
  reelReady?: boolean;
}

const stepLabels: Record<GenerationStep, string> = {
  narration: 'Creating narration...',
  voiceover: 'Generating voiceover...',
  video: 'Stitching your reel...',
  complete: 'Reel ready!',
};

const ReelProgressWidget = ({
  isGenerating,
  currentStep,
  progress,
  photos,
  onViewReel,
  reelReady,
}: ReelProgressWidgetProps) => {
  // Only show if we have 3+ photos or actively generating
  if (photos.length < 3 && !isGenerating) return null;

  const displayPhotos = photos.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Main Card */}
      <div className="relative bg-black/80 backdrop-blur-2xl rounded-3xl p-5 border border-white/10 overflow-hidden">
        {/* Glow effect at progress position */}
        <div
          className="absolute top-0 h-full w-32 pointer-events-none opacity-60"
          style={{
            left: `${progress}%`,
            transform: 'translateX(-50%)',
            background: 'radial-gradient(ellipse at center, rgba(134, 239, 172, 0.4) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />

        {/* Header Row */}
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <Loader2 className="w-5 h-5 text-white/70 animate-spin" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <span className="text-white/80 text-sm font-medium">
              {isGenerating ? stepLabels[currentStep] : 'Your Journey Reel'}
            </span>
          </div>
          <span className="text-white font-bold text-2xl">{Math.round(progress)}%</span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-5">
          {/* Gradient progress fill */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #22c55e 0%, #4ade80 50%, #86efac 100%)',
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
          
          {/* Glowing orb at progress edge */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(134,239,172,0.8) 50%, transparent 70%)',
              boxShadow: '0 0 12px rgba(134, 239, 172, 0.8)',
            }}
            initial={{ left: '0%' }}
            animate={{ left: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>

        {/* Stacked Photo Cards */}
        <div className="flex items-center gap-4">
          {/* Photos Stack */}
          <div className="relative flex-shrink-0 w-28 h-36">
            {displayPhotos.map((photo, index) => {
              const rotation = (index - 1) * 8; // -8, 0, 8 degrees
              const xOffset = (index - 1) * -8; // Stack offset
              
              return (
                <motion.div
                  key={photo.dayNumber}
                  className="absolute top-0 left-0 w-20 rounded-xl overflow-hidden border-2 border-white/20"
                  style={{
                    aspectRatio: '9/16',
                    zIndex: index,
                  }}
                  initial={{ opacity: 0, rotate: rotation - 10, x: xOffset - 20 }}
                  animate={{ 
                    opacity: 1, 
                    rotate: rotation, 
                    x: xOffset,
                  }}
                  transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.activity}
                    className="w-full h-full object-cover"
                  />
                  {/* Day label */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-white text-[10px] font-bold">{photo.activity}</p>
                    <p className="text-white/70 text-[8px]">Day {photo.dayNumber}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Gradient Timeline */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div 
              className="w-full h-2 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #fcd34d 0%, #fb923c 50%, #f87171 100%)',
              }}
            />
            <p className="text-white/50 text-[10px] mt-2 text-center">
              {photos.length} activities logged
            </p>
          </div>
        </div>

        {/* More Details Button */}
        {(reelReady || !isGenerating) && onViewReel && (
          <motion.button
            onClick={onViewReel}
            className="mt-4 ml-auto flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-white/90 text-sm font-medium">More details</span>
            <span className="text-white/70">→</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default ReelProgressWidget;
