import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Film, Share2, Download, Trash2 } from 'lucide-react';
import type { ReelResult } from '@/hooks/use-fitness-reel';

interface ReelHistoryGalleryProps {
  isOpen: boolean;
  reelHistory: ReelResult[];
  onClose: () => void;
  onSelectReel: (index: number) => void;
  onClearHistory: () => void;
}

const ReelHistoryGallery = ({
  isOpen,
  reelHistory,
  onClose,
  onSelectReel,
  onClearHistory,
}: ReelHistoryGalleryProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleDownload = async (reel: ReelResult, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!reel.videoUrl) return;
    try {
      const response = await fetch(reel.videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness-reel-${reel.style}-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-black"
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
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-12 border-b border-white/10"
          >
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                Your Reels
              </h2>
              <p className="text-xs text-white/50">
                {reelHistory.length} {reelHistory.length === 1 ? 'reel' : 'reels'} created
              </p>
            </div>
            {reelHistory.length > 0 ? (
              <button
                onClick={onClearHistory}
                className="w-10 h-10 flex items-center justify-center bg-red-500/20 backdrop-blur-sm rounded-full"
              >
                <Trash2 className="w-5 h-5 text-red-400" />
              </button>
            ) : (
              <div className="w-10" />
            )}
          </motion.div>

          {/* Content */}
          <div className="absolute inset-0 pt-28 pb-6 px-4 overflow-y-auto">
            {reelHistory.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Film className="w-10 h-10 text-white/30" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No reels yet</h3>
                <p className="text-white/50 text-sm max-w-[240px]">
                  Generate your first fitness reel to see it here
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {reelHistory.map((reel, index) => (
                  <motion.div
                    key={reel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelectReel(index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="relative aspect-[9/16] bg-white/5 border-2 border-white/10 overflow-hidden cursor-pointer group hover:border-yellow-400/50 transition-colors"
                  >
                    {/* Video thumbnail or placeholder */}
                    {reel.videoUrl ? (
                      <video
                        src={reel.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
                        <Film className="w-8 h-8 text-white/30" />
                      </div>
                    )}

                    {/* Overlay on hover */}
                    <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${hoveredIndex === index ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="w-12 h-12 bg-yellow-400 flex items-center justify-center">
                        <Play className="w-6 h-6 text-black ml-0.5" />
                      </div>
                    </div>

                    {/* Style badge */}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm">
                      <p className="text-[10px] text-yellow-400 uppercase font-bold tracking-wider">
                        {reel.style}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm">
                      <p className="text-[10px] text-white/70">
                        {formatDate(reel.createdAt)}
                      </p>
                    </div>

                    {/* Bottom actions */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-white/60 line-clamp-1 flex-1 mr-2">
                          "{reel.narration?.slice(0, 40)}..."
                        </p>
                        <div className="flex gap-1">
                          {reel.videoUrl && (
                            <button
                              onClick={(e) => handleDownload(reel, e)}
                              className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5 text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReelHistoryGallery;