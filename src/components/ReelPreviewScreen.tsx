import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Download, Share2, RotateCcw } from 'lucide-react';

// Instagram icon component
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface ReelPreviewScreenProps {
  isVisible: boolean;
  videoUrl?: string | null;
  narration: string;
  audioUrl?: string | null;
  onClose: () => void;
  onRetry?: () => void;
}

const ReelPreviewScreen = ({ 
  isVisible, 
  videoUrl, 
  narration, 
  audioUrl,
  onClose,
  onRetry 
}: ReelPreviewScreenProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        audioRef.current?.pause();
      } else {
        videoRef.current.play();
        audioRef.current?.play();
      }
      setIsPlaying(!isPlaying);
    } else if (audioRef.current) {
      // Audio only mode
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = async () => {
    try {
      if (videoUrl) {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitness-reel-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleShare = async (platform: 'instagram' | 'tiktok' | 'native') => {
    setShowShareMenu(false);
    
    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: 'My Fitness Reel',
          text: narration,
          url: videoUrl || window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
      return;
    }

    // For Instagram/TikTok, we'll open their apps with a deep link
    // Since direct posting requires their official APIs, we'll guide users
    if (platform === 'instagram') {
      // Copy to clipboard and open Instagram
      if (videoUrl) {
        try {
          await navigator.clipboard.writeText(narration);
        } catch {}
      }
      window.open('instagram://library', '_blank');
    } else if (platform === 'tiktok') {
      window.open('tiktok://');
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black"
        >
          {/* Noise texture */}
          <div 
            className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-12"
          >
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-lg font-bold text-white uppercase tracking-wide">Your Reel</h2>
            <div className="w-10" />
          </motion.div>

          {/* Video/Preview Area */}
          <div className="absolute inset-0 flex items-center justify-center pt-20 pb-32 px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative w-full max-w-sm aspect-[9/16] bg-white/5 border-2 border-white/20 overflow-hidden"
            >
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  onEnded={() => setIsPlaying(false)}
                />
              ) : (
                // Placeholder when video is still processing
                <div className="w-full h-full flex flex-col items-center justify-center p-6">
                  <div className="w-16 h-16 border-2 border-yellow-400 flex items-center justify-center mb-4">
                    <Play className="w-8 h-8 text-yellow-400 ml-1" />
                  </div>
                  <p className="text-white/60 text-center text-sm mb-4">
                    Video is being rendered...
                  </p>
                  <p className="text-white/40 text-center text-xs">
                    Audio preview available
                  </p>
                </div>
              )}

              {/* Hidden audio element for voiceover */}
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                />
              )}

              {/* Play/Pause overlay */}
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-yellow-400 flex items-center justify-center"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-black" />
                  ) : (
                    <Play className="w-8 h-8 text-black ml-1" />
                  )}
                </motion.div>
              </button>

              {/* Narration text overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-sm font-medium leading-relaxed">
                  "{narration}"
                </p>
              </div>
            </motion.div>
          </div>

          {/* Bottom Actions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-0 left-0 right-0 p-6 pb-10"
          >
            {/* Share Menu */}
            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="mb-4 p-4 bg-white/10 backdrop-blur-xl border border-white/20"
                >
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-4">Share to</p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => handleShare('instagram')}
                      className="flex flex-col items-center gap-2 p-3 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                        <InstagramIcon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-white text-xs">Instagram</span>
                    </button>
                    <button
                      onClick={() => handleShare('tiktok')}
                      className="flex flex-col items-center gap-2 p-3 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-black border border-white/30 flex items-center justify-center">
                        <TikTokIcon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-white text-xs">TikTok</span>
                    </button>
                    {navigator.share && (
                      <button
                        onClick={() => handleShare('native')}
                        className="flex flex-col items-center gap-2 p-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <Share2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white text-xs">More</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-white/20 text-white font-bold uppercase tracking-wide hover:bg-white/5 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Retry
                </button>
              )}
              {videoUrl && (
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-white/20 text-white font-bold uppercase tracking-wide hover:bg-white/5 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Save
                </button>
              )}
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex-[2] flex items-center justify-center gap-2 py-4 bg-yellow-400 text-black font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReelPreviewScreen;
