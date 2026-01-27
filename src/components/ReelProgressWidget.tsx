import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import { isVideoUrl } from '@/lib/media';
import type { GenerationStep } from './ReelGenerationOverlay';

interface ReelProgressWidgetProps {
  isGenerating: boolean;
  currentStep: GenerationStep;
  progress: number; // 0-100
  photos: Array<{
    imageUrl: string;
    activity: string;
    dayNumber: number;
    isVideo?: boolean;
  }>;
  onViewReel?: () => void;
  reelReady?: boolean;
}

// Media thumbnail component that extracts first frame from videos
const MediaThumbnail = ({ 
  url, 
  activity,
  isVideo 
}: { 
  url: string; 
  activity: string;
  isVideo?: boolean;
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [error, setError] = useState(false);
  
  const shouldUseVideoThumbnail = isVideo || isVideoUrl(url);

  useEffect(() => {
    if (!shouldUseVideoThumbnail) {
      setThumbnail(url);
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    video.onloadeddata = () => {
      video.currentTime = 0.1;
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 200;
        canvas.height = video.videoHeight || 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setThumbnail(canvas.toDataURL('image/jpeg', 0.8));
        }
      } catch (e) {
        console.log('Could not extract video thumbnail');
        setError(true);
      }
    };
    
    video.onerror = () => setError(true);
    video.src = url;
    
    return () => { video.src = ''; };
  }, [url, shouldUseVideoThumbnail]);

  if (error || !thumbnail) {
    if (shouldUseVideoThumbnail) {
      return (
        <video
          src={url}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      );
    }
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
        <span className="text-white/60 text-[8px]">{activity}</span>
      </div>
    );
  }

  return (
    <img
      src={thumbnail}
      alt={activity}
      className="w-full h-full object-cover"
      onError={() => setError(true)}
    />
  );
};

// Stacked Photo Card
const StackedPhotoCard = ({ 
  photo, 
  index,
  total
}: { 
  photo: { imageUrl: string; activity: string; dayNumber: number; isVideo?: boolean }; 
  index: number;
  total: number;
}) => {
  // Fan out effect - cards spread from left
  const rotation = (index - 1) * 8; // -8, 0, 8 degrees
  const xOffset = index * 18; // Horizontal spread
  const zIndex = total - index;
  
  return (
    <motion.div
      className="absolute rounded-lg overflow-hidden"
      style={{
        width: '52px',
        height: '72px',
        left: xOffset,
        zIndex,
        transformOrigin: 'bottom center',
      }}
      initial={{ opacity: 0, scale: 0.8, rotate: rotation }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        rotate: rotation,
      }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Gradient Border */}
      <div 
        className="absolute inset-0 rounded-lg pointer-events-none z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(236,72,153,0.6) 0%, rgba(139,92,246,0.6) 100%)',
          padding: '1.5px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'xor',
          WebkitMaskComposite: 'xor',
        }}
      />
      
      {/* Media */}
      <MediaThumbnail 
        url={photo.imageUrl} 
        activity={photo.activity}
        isVideo={photo.isVideo}
      />
      
      {/* Activity label overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 pt-3 z-20">
        <p className="text-white text-[8px] font-semibold leading-tight truncate">{photo.activity}</p>
        <p className="text-white/50 text-[6px]">Day {photo.dayNumber}</p>
      </div>
    </motion.div>
  );
};

// Progress Bar
const GradientProgressBar = ({ progress }: { progress: number }) => {
  return (
    <div className="relative w-full h-2 rounded-full overflow-hidden">
      {/* Background track */}
      <div className="absolute inset-0 bg-white/10 rounded-full" />
      
      {/* Progress fill */}
      <motion.div 
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: 'linear-gradient(90deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)',
        }}
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
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
  if (photos.length < 3 && !isGenerating) return null;

  const displayPhotos = photos.slice(0, 3);
  
  // Calculate week number from day numbers
  const weekNumber = Math.ceil(Math.max(...displayPhotos.map(p => p.dayNumber)) / 3);
  
  // Status text based on current step
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full px-4"
    >
      <div 
        className="relative w-full rounded-2xl p-4 flex items-center gap-4"
        style={{
          background: 'rgba(30, 35, 50, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
        onClick={onViewReel}
      >
        {/* Left: Stacked Photos */}
        <div className="relative h-[76px] w-[90px] flex-shrink-0">
          {displayPhotos.map((photo, index) => (
            <StackedPhotoCard 
              key={photo.dayNumber} 
              photo={photo} 
              index={index}
              total={displayPhotos.length}
            />
          ))}
        </div>
        
        {/* Center: Title & Progress */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base mb-0.5">
            Week {weekNumber} • Conquer will power
          </h3>
          <p className="text-white/50 text-xs mb-2 truncate">
            {getStatusText()}
          </p>
          <GradientProgressBar progress={progress} />
        </div>
        
        {/* Right: Play Button */}
        <motion.button
          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onViewReel?.();
          }}
        >
          <Play className="w-5 h-5 text-white/70 ml-0.5" fill="currentColor" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ReelProgressWidget;
