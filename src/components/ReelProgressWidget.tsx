import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
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

// Liquid Glass Circular Progress Ring with translucent play button
const LiquidGlassProgressRing = ({ progress, size = 56 }: { progress: number; size?: number }) => {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer glow effect */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%)',
          filter: 'blur(8px)',
          transform: 'scale(1.3)',
        }}
      />
      
      {/* Glassmorphic background */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      />
      
      {/* SVG Progress ring */}
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring with gradient */}
        <defs>
          <linearGradient id="liquidProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
          stroke="url(#liquidProgressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.5))',
          }}
        />
      </svg>
      
      {/* Translucent liquid glass play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 200, 100, 0.6) 0%, rgba(249, 115, 22, 0.5) 50%, rgba(236, 72, 153, 0.4) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          <Play className="w-4 h-4 text-white fill-white ml-0.5 drop-shadow-sm" />
        </div>
      </div>
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
                  
                  {/* Media thumbnail - handles both images and videos */}
                  <MediaThumbnail 
                    url={photo.imageUrl} 
                    activity={photo.activity}
                    isVideo={photo.isVideo}
                  />
                  
                  {/* Activity label at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-1 pt-3 z-20">
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

          {/* Liquid Glass Circular Progress Play Button */}
          <motion.div 
            className="flex-shrink-0 cursor-pointer"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LiquidGlassProgressRing progress={progress} size={56} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReelProgressWidget;
