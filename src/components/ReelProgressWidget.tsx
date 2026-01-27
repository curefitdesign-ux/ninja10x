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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full py-6"
      onClick={onViewReel}
    >
      <div className="flex items-end gap-1">
        {/* Stacked Photo Cards */}
        <div className="relative flex-shrink-0 w-32 h-40">
          {displayPhotos.map((photo, index) => {
            // Cards fan out: first card tilted left, second slightly left, third straight
            const rotations = [-12, -6, 0];
            const xOffsets = [0, 16, 32];
            const zIndexes = [1, 2, 3];
            
            return (
              <motion.div
                key={photo.dayNumber}
                className="absolute bottom-0 left-0 w-[72px] rounded-2xl overflow-hidden"
                style={{
                  aspectRatio: '9/16',
                  zIndex: zIndexes[index],
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  border: '2px solid',
                  borderImage: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%) 1',
                  borderImageSlice: 1,
                }}
                initial={{ opacity: 0, rotate: rotations[index] - 10, x: xOffsets[index] - 20 }}
                animate={{ 
                  opacity: 1, 
                  rotate: rotations[index], 
                  x: xOffsets[index],
                }}
                transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
              >
                {/* Pink/Purple gradient border */}
                <div 
                  className="absolute inset-0 rounded-2xl pointer-events-none"
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
                  className="w-full h-full object-cover rounded-xl"
                />
                
                {/* Play icon on top card */}
                {index === 2 && (
                  <motion.div 
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                  >
                    <Play className="w-3 h-3 text-gray-800 fill-gray-800 ml-0.5" />
                  </motion.div>
                )}
                
                {/* Activity label at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 pt-6">
                  <p className="text-white text-xs font-semibold leading-tight">{photo.activity}</p>
                  <p className="text-white/70 text-[10px]">Day {photo.dayNumber}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Gradient Timeline Bar */}
        <div className="flex-1 pb-4">
          <motion.div 
            className="h-2 rounded-full overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, #fbbf24 0%, #f97316 35%, #ef4444 70%, #ec4899 100%)',
              boxShadow: '0 0 20px rgba(251, 146, 60, 0.4)',
            }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ReelProgressWidget;
