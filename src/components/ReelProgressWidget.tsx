import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
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

// Circular Progress Ring component
const CircularProgressRing = ({ progress, size = 56 }: { progress: number; size?: number }) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring with gradient */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            filter: 'drop-shadow(0 0 6px rgba(251, 146, 60, 0.6))',
          }}
        />
      </svg>
      
      {/* Play button in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 flex items-center justify-center shadow-lg">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </div>
      </div>
    </div>
  );
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
  const weekNumber = Math.ceil((displayPhotos[0]?.dayNumber || 1) / 3);

  const getStatusText = () => {
    if (reelReady) return 'Your reel is ready!';
    switch (currentStep) {
      case 'narration': return 'Creating narration...';
      case 'voiceover': return 'Generating voiceover...';
      case 'video': return 'Stitching your week activity...';
      case 'complete': return 'Your reel is ready!';
      default: return 'Preparing your reel...';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full px-2 py-3"
      onClick={onViewReel}
    >
      {/* Compact Glassmorphic Container */}
      <div 
        className="relative rounded-2xl p-3 overflow-hidden"
        style={{
          background: 'rgba(30, 35, 50, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Stacked Photo Cards - Compact */}
          <div className="relative flex-shrink-0 w-20 h-20">
            {displayPhotos.map((photo, index) => {
              const rotations = [-12, -6, 0];
              const xOffsets = [-2, 6, 14];
              const zIndexes = [1, 2, 3];
              
              return (
                <motion.div
                  key={photo.dayNumber}
                  className="absolute top-0 left-0 w-14 h-[72px] rounded-lg overflow-hidden"
                  style={{
                    zIndex: zIndexes[index],
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  }}
                  initial={{ opacity: 0, rotate: rotations[index] - 10, x: xOffsets[index] - 10 }}
                  animate={{ 
                    opacity: 1, 
                    rotate: rotations[index], 
                    x: xOffsets[index],
                  }}
                  transition={{ delay: index * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
                >
                  {/* Gradient Border */}
                  <div 
                    className="absolute inset-0 rounded-lg pointer-events-none z-10"
                    style={{
                      background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
                      padding: '1.5px',
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'xor',
                      WebkitMaskComposite: 'xor',
                    }}
                  />
                  
                  <img
                    src={photo.imageUrl}
                    alt={photo.activity}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Activity label at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-1 pt-3">
                    <p className="text-white text-[8px] font-medium leading-tight truncate">{photo.activity}</p>
                    <p className="text-white/60 text-[6px]">Day {photo.dayNumber}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm leading-tight mb-0.5">
              Week {weekNumber} • Conquer will power
            </h3>
            <p className="text-white/60 text-xs">
              {getStatusText()}
            </p>
          </div>

          {/* Circular Progress Play Button */}
          <motion.div 
            className="flex-shrink-0 cursor-pointer"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CircularProgressRing progress={progress} size={56} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReelProgressWidget;
