import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
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

// Helper to detect video URLs
const isVideoUrl = (url: string): boolean => {
  return /\.(mp4|webm|mov|avi|mkv|m4v)($|\?)/i.test(url);
};

// Horizontal Gradient Progress Bar with Glow
const GradientProgressBar = ({ progress }: { progress: number }) => {
  return (
    <div className="relative w-full h-3 mb-4">
      {/* Glow effect behind the bar */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(90deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)',
          filter: 'blur(12px)',
          opacity: 0.6,
          transform: 'scaleY(2)',
        }}
      />
      
      {/* Background track */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
        }}
      />
      
      {/* Progress fill */}
      <motion.div 
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: 'linear-gradient(90deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)',
          boxShadow: '0 0 20px rgba(249, 115, 22, 0.5)',
        }}
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
};

// Video thumbnail component that extracts first frame
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
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const shouldUseVideoThumbnail = isVideo || isVideoUrl(url);

  useEffect(() => {
    if (!shouldUseVideoThumbnail) {
      setThumbnail(url);
      return;
    }

    // For videos, extract first frame
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    video.onloadeddata = () => {
      video.currentTime = 0.1; // Seek to 0.1s for first frame
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
    
    video.onerror = () => {
      setError(true);
    };
    
    video.src = url;
    
    return () => {
      video.src = '';
    };
  }, [url, shouldUseVideoThumbnail]);

  if (error || !thumbnail) {
    // Fallback: show video element directly for videos, or placeholder
    if (shouldUseVideoThumbnail) {
      return (
        <video
          ref={videoRef}
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

// Single Photo Card Component
const PhotoCard = ({ 
  photo, 
  index 
}: { 
  photo: { imageUrl: string; activity: string; dayNumber: number; isVideo?: boolean }; 
  index: number;
}) => {
  return (
    <motion.div
      className="relative w-[72px] h-[96px] rounded-xl overflow-hidden flex-shrink-0"
      style={{
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Gradient Border */}
      <div 
        className="absolute inset-0 rounded-xl pointer-events-none z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(236,72,153,0.5) 0%, rgba(139,92,246,0.5) 50%, rgba(59,130,246,0.5) 100%)',
          padding: '1.5px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'xor',
          WebkitMaskComposite: 'xor',
        }}
      />
      
      {/* Media thumbnail */}
      <MediaThumbnail 
        url={photo.imageUrl} 
        activity={photo.activity}
        isVideo={photo.isVideo}
      />
      
      {/* Video/Camera indicator icon */}
      <div className="absolute top-1.5 right-1.5 z-20">
        <div 
          className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {photo.isVideo || isVideoUrl(photo.imageUrl) ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" fill="white" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          )}
        </div>
      </div>
      
      {/* Activity label at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 pt-4 z-20">
        <p className="text-white text-[10px] font-semibold leading-tight truncate">{photo.activity}</p>
        <p className="text-white/50 text-[8px]">Day {photo.dayNumber}</p>
      </div>
    </motion.div>
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full px-4 py-4"
      onClick={onViewReel}
    >
      {/* Gradient Progress Bar with Glow */}
      <GradientProgressBar progress={progress} />
      
      {/* Horizontal Photo Cards Row */}
      <div className="flex items-center gap-2">
        {displayPhotos.map((photo, index) => (
          <PhotoCard key={photo.dayNumber} photo={photo} index={index} />
        ))}
      </div>
    </motion.div>
  );
};

export default ReelProgressWidget;
