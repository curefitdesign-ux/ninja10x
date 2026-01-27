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
      case 'video': return 'Stitching your these week activity..';
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
      className="w-full px-4 py-4"
      onClick={onViewReel}
    >
      {/* Glassmorphic Container */}
      <div 
        className="relative rounded-3xl p-4 overflow-hidden"
        style={{
          background: 'rgba(30, 35, 50, 0.7)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center gap-4">
          {/* Stacked Photo Cards */}
          <div className="relative flex-shrink-0 w-28 h-28">
            {displayPhotos.map((photo, index) => {
              const rotations = [-15, -8, 0];
              const xOffsets = [-4, 8, 20];
              const zIndexes = [1, 2, 3];
              
              return (
                <motion.div
                  key={photo.dayNumber}
                  className="absolute top-0 left-0 w-20 h-24 rounded-xl overflow-hidden"
                  style={{
                    zIndex: zIndexes[index],
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}
                  initial={{ opacity: 0, rotate: rotations[index] - 10, x: xOffsets[index] - 10 }}
                  animate={{ 
                    opacity: 1, 
                    rotate: rotations[index], 
                    x: xOffsets[index],
                  }}
                  transition={{ delay: index * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
                >
                  {/* Gradient Border */}
                  <div 
                    className="absolute inset-0 rounded-xl pointer-events-none z-10"
                    style={{
                      background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
                      padding: '2px',
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
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-1.5 pt-4">
                    <p className="text-white text-[10px] font-medium leading-tight truncate">{photo.activity}</p>
                    <p className="text-white/60 text-[8px]">Day {photo.dayNumber}</p>
                  </div>
                </motion.div>
              );
            })}
            
            {/* Play Button - positioned on top card */}
            <motion.div 
              className="absolute top-1 right-0 z-10 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-lg cursor-pointer"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-3.5 h-3.5 text-gray-800 fill-gray-800 ml-0.5" />
            </motion.div>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg leading-tight mb-1">
              Week {weekNumber} • Conquer will power
            </h3>
            <p className="text-white/60 text-sm mb-3">
              {getStatusText()}
            </p>
            
            {/* Progress Bar */}
            <div className="relative h-2 rounded-full overflow-hidden bg-white/10">
              <motion.div 
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #22c55e 0%, #fbbf24 50%, #f97316 100%)',
                  boxShadow: '0 0 12px rgba(251, 146, 60, 0.5)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReelProgressWidget;
