import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { isVideoUrl } from '@/lib/media';
import type { GenerationStep } from './ReelGenerationOverlay';

interface ReelProgressWidgetProps {
  isGenerating: boolean;
  currentStep: GenerationStep;
  progress: number;
  photos: Array<{
    imageUrl: string;
    activity: string;
    dayNumber: number;
    isVideo?: boolean;
  }>;
  onViewReel?: () => void;
  reelReady?: boolean;
  weekNumber?: number;
  weekTitle?: string;
}

// Media thumbnail with video frame extraction
const MediaThumbnail = ({ url, activity, isVideo }: { url: string; activity: string; isVideo?: boolean }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const shouldExtractFrame = isVideo || isVideoUrl(url);

  useEffect(() => {
    if (!shouldExtractFrame) {
      setThumbnail(url);
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    video.onloadeddata = () => { video.currentTime = 0.1; };
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 100;
        canvas.height = video.videoHeight || 140;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setThumbnail(canvas.toDataURL('image/jpeg', 0.7));
        }
      } catch { setError(true); }
    };
    video.onerror = () => setError(true);
    video.src = url;
    return () => { video.src = ''; };
  }, [url, shouldExtractFrame]);

  if (error || !thumbnail) {
    return shouldExtractFrame ? (
      <video src={url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
    ) : (
      <div className="w-full h-full bg-white/5 flex items-center justify-center">
        <span className="text-white/40 text-[6px]">{activity}</span>
      </div>
    );
  }

  return <img src={thumbnail} alt={activity} className="w-full h-full object-cover" onError={() => setError(true)} />;
};

// Compact stacked photo
const StackedPhoto = ({ photo, index, total }: { 
  photo: { imageUrl: string; activity: string; dayNumber: number; isVideo?: boolean }; 
  index: number; total: number;
}) => {
  const rotation = (index - 1) * 10;
  const xOffset = index * 12;
  
  return (
    <motion.div
      className="absolute rounded-md overflow-hidden shadow-lg"
      style={{
        width: '36px',
        height: '48px',
        left: xOffset,
        zIndex: total - index,
        border: '1px solid rgba(255,255,255,0.15)',
      }}
      initial={{ opacity: 0, scale: 0.8, rotate: rotation }}
      animate={{ opacity: 1, scale: 1, rotate: rotation }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 350, damping: 28 }}
    >
      <MediaThumbnail url={photo.imageUrl} activity={photo.activity} isVideo={photo.isVideo} />
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-0.5 pt-2">
        <p className="text-white text-[5px] font-medium truncate">{photo.activity}</p>
      </div>
    </motion.div>
  );
};

// Progress bar
const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="relative w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
    <motion.div 
      className="absolute inset-y-0 left-0 rounded-full"
      style={{ background: 'linear-gradient(90deg, #fbbf24, #f97316, #ec4899)' }}
      initial={{ width: '0%' }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    />
  </div>
);

const ReelProgressWidget = ({
  isGenerating,
  currentStep,
  progress,
  photos,
  onViewReel,
  reelReady,
  weekNumber: propWeekNumber,
  weekTitle,
}: ReelProgressWidgetProps) => {
  if (photos.length < 3 && !isGenerating) return null;

  const displayPhotos = photos.slice(0, 3);
  const weekNumber = propWeekNumber ?? Math.ceil(Math.max(...displayPhotos.map(p => p.dayNumber)) / 3);
  
  const statusText = (() => {
    if (reelReady) return 'Your reel is ready!';
    switch (currentStep) {
      case 'narration': return 'Creating narration...';
      case 'voiceover': return 'Generating voiceover...';
      case 'video': return 'Stitching your week activity...';
      case 'complete': return 'Your reel is ready!';
      default: return 'Preparing your reel...';
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="w-full px-4"
    >
      {/* Apple Liquid Glass Container */}
      <div 
        className="relative w-full rounded-2xl p-3 flex items-center gap-3 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
        onClick={onViewReel}
      >
        {/* Subtle inner highlight */}
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 40%)',
          }}
        />
        
        {/* Stacked Photos */}
        <div className="relative h-[52px] w-[68px] flex-shrink-0">
          {displayPhotos.map((photo, index) => (
            <StackedPhoto key={photo.dayNumber} photo={photo} index={index} total={displayPhotos.length} />
          ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 relative z-10">
          <h3 className="text-white/90 font-semibold text-sm leading-tight mb-0.5">
            Week {weekNumber} • {weekTitle || 'Conquer will power'}
          </h3>
          <p className="text-white/40 text-[10px] mb-1.5 truncate">
            {statusText}
          </p>
          <ProgressBar progress={progress} />
        </div>
        
        {/* Play Button - Liquid Glass */}
        <motion.button
          className="relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.2)',
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); onViewReel?.(); }}
        >
          <Play className="w-4 h-4 text-white/80 ml-0.5" fill="currentColor" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ReelProgressWidget;
