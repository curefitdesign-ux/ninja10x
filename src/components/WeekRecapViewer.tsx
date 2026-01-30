import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Loader2 } from 'lucide-react';
import { isVideoUrl } from '@/lib/media';
import weekRecapVideo from '@/assets/demo-videos/week-recap-sample.mp4';

// Reaction badge emojis and counts (mock data)
const REACTION_BADGES = [
  { emoji: '👍', count: 12 },
  { emoji: '❤️', count: 3 },
  { emoji: '👍', count: 2 },
];

interface WeekRecapViewerProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Array<{
    id: string;
    storageUrl: string;
    originalUrl?: string;
    activity?: string;
    dayNumber: number;
    isVideo?: boolean;
  }>;
  weekNumber: number;
}

// Photo card with reaction badge
const PhotoCardWithBadge = ({ 
  photo, 
  index, 
  badge 
}: { 
  photo: { storageUrl: string; originalUrl?: string; activity?: string; dayNumber: number; isVideo?: boolean }; 
  index: number;
  badge: { emoji: string; count: number };
}) => {
  const isVideo = photo.isVideo || isVideoUrl(photo.storageUrl);
  const mediaUrl = photo.originalUrl || photo.storageUrl;
  
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Card */}
      <div 
        className="w-20 h-28 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl"
        style={{
          background: 'rgba(255,255,255,0.1)',
        }}
      >
        {isVideo ? (
          <video
            src={mediaUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            loop
            autoPlay
            preload="metadata"
          />
        ) : (
          <img
            src={mediaUrl}
            alt={photo.activity || `Day ${photo.dayNumber}`}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      
      {/* Reaction badge */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-2 py-0.5 rounded-full"
        style={{
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 + index * 0.1 }}
      >
        <span className="text-sm">{badge.emoji}</span>
        <span className="text-white text-xs font-semibold">+{badge.count}</span>
      </motion.div>
    </motion.div>
  );
};

export default function WeekRecapViewer({ isOpen, onClose, photos, weekNumber }: WeekRecapViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Auto-play video on open
  useEffect(() => {
    if (isOpen && videoRef.current) {
      setIsLoading(true);
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  // Track video progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleLoadedData = () => {
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, []);

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (!isOpen) return null;

  const displayPhotos = photos.slice(0, 3);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Top photo cards */}
        <motion.div 
          className="flex items-end justify-center gap-4 pt-12 pb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {displayPhotos.map((photo, index) => (
            <PhotoCardWithBadge 
              key={photo.id || photo.dayNumber} 
              photo={photo} 
              index={index}
              badge={REACTION_BADGES[index] || { emoji: '👍', count: 0 }}
            />
          ))}
        </motion.div>

        {/* Video container */}
        <motion.div 
          className="flex-1 w-full max-w-md px-4 pb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div 
            className="relative w-full h-full rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(30,30,30,0.95) 0%, rgba(15,15,15,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onClick={togglePlayback}
          >
            {/* Video player */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              src={weekRecapVideo}
              loop
              playsInline
              muted
            />

            {/* Loading overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-black/60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="w-12 h-12 text-white/80 animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Play overlay when paused */}
            <AnimatePresence>
              {!isPlaying && !isLoading && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <Play className="w-8 h-8 text-white ml-1" fill="white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Close button */}
        <motion.button
          className="pb-8 pt-4"
          onClick={onClose}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.9 }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <X className="w-6 h-6 text-white/90" />
          </div>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
