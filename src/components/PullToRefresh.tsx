import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

const THRESHOLD = 80;
const MAX_PULL = 120;

const PullToRefresh = ({ children, onRefresh, disabled = false }: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  const handlePan = useCallback((_: PointerEvent, info: PanInfo) => {
    if (disabled || isRefreshing) return;
    
    // Only allow pull when at top of scroll
    const container = containerRef.current;
    if (container && container.scrollTop > 0) return;
    
    const distance = Math.max(0, Math.min(info.offset.y, MAX_PULL));
    setPullDistance(distance);
  }, [disabled, isRefreshing]);

  const handlePanEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;
    
    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    controls.start({ y: 0 });
  }, [pullDistance, onRefresh, disabled, isRefreshing, controls]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {/* Pull indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
        style={{
          top: Math.min(pullDistance - 40, 40),
          opacity: showIndicator ? 1 : 0,
        }}
        animate={{
          scale: isRefreshing ? 1 : progress,
        }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          <motion.div
            animate={isRefreshing ? { rotate: 360 } : { rotate: progress * 360 }}
            transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0 }}
          >
            <Loader2 className="w-5 h-5 text-white/80" />
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        animate={controls}
        style={{
          y: isRefreshing ? 50 : pullDistance * 0.5,
        }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;