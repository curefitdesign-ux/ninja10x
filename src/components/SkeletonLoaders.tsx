import { motion } from 'framer-motion';

// Base shimmer animation styles
const shimmerStyle = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
};

// Skeleton for the Cult Ninja stacked cards widget
export const CultNinjaCardsSkeleton = () => {
  return (
    <div className="relative w-full flex justify-center items-center" style={{ height: '320px' }}>
      <div className="relative w-full flex justify-center items-center" style={{ height: '280px' }}>
        {/* Stacked cards skeleton */}
        {[0, 1, 2].map((idx) => {
          const isCenter = idx === 1;
          const translateX = idx === 0 ? -70 : idx === 2 ? 70 : 0;
          const scale = isCenter ? 1 : 0.85;
          const rotate = idx === 0 ? -8 : idx === 2 ? 8 : 0;
          const zIndex = isCenter ? 30 : 20;
          const cardWidth = isCenter ? 140 : 120;
          const cardHeight = isCenter ? 248 : 213;

          return (
            <motion.div
              key={idx}
              className="absolute top-1/2 left-1/2 rounded-2xl overflow-hidden"
              style={{
                transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
                zIndex,
                width: cardWidth,
                height: cardHeight,
                background: 'rgba(70, 70, 90, 0.6)',
                border: '3px solid rgba(0,0,0,0.6)',
              }}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.2 }}
            >
              <div className="absolute inset-0" style={shimmerStyle} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Skeleton for activity story cards in horizontal scroll
export const StoryCardSkeleton = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const dimensions = {
    sm: { width: 48, height: 64 },
    md: { width: 64, height: 85 },
    lg: { width: 80, height: 107 },
  };
  const { width, height } = dimensions[size];

  return (
    <motion.div
      className="flex-shrink-0 rounded-xl overflow-hidden"
      style={{
        width,
        height,
        background: 'rgba(255, 255, 255, 0.06)',
        border: '2px solid rgba(255,255,255,0.08)',
      }}
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <div className="absolute inset-0" style={shimmerStyle} />
    </motion.div>
  );
};

// Skeleton for the circular progress ring with mascot
export const MascotProgressSkeleton = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Progress ring skeleton */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: 140,
          height: 140,
          background: 'rgba(255, 255, 255, 0.04)',
          border: '4px solid rgba(255,255,255,0.08)',
        }}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {/* Inner mascot placeholder */}
        <div 
          className="absolute inset-4 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
          }}
        />
        <div className="absolute inset-4 rounded-full overflow-hidden">
          <div className="w-full h-full" style={shimmerStyle} />
        </div>
      </motion.div>
    </div>
  );
};

// Skeleton for stats row (streak, weekly progress)
export const StatsRowSkeleton = () => {
  return (
    <div className="flex items-center justify-center gap-8 px-6">
      {[0, 1].map((idx) => (
        <motion.div
          key={idx}
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.15 }}
        >
          <div 
            className="rounded-lg"
            style={{
              width: 48,
              height: 28,
              background: 'rgba(255, 255, 255, 0.06)',
            }}
          />
          <div 
            className="rounded"
            style={{
              width: 60,
              height: 12,
              background: 'rgba(255, 255, 255, 0.04)',
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

// Skeleton for week progress bar
export const WeekProgressSkeleton = () => {
  return (
    <motion.div
      className="w-full max-w-xs mx-auto rounded-full overflow-hidden"
      style={{
        height: 8,
        background: 'rgba(255, 255, 255, 0.06)',
      }}
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 0.6, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <div className="h-full w-1/3 rounded-full" style={shimmerStyle} />
    </motion.div>
  );
};

// Skeleton for activity grid items
export const ActivityGridSkeleton = () => {
  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {[...Array(6)].map((_, idx) => (
        <motion.div
          key={idx}
          className="aspect-square rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.1 }}
        >
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
            <div 
              className="rounded-full"
              style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.06)' }}
            />
            <div 
              className="rounded"
              style={{ width: '60%', height: 10, background: 'rgba(255,255,255,0.04)' }}
            />
          </div>
          <div className="absolute inset-0" style={shimmerStyle} />
        </motion.div>
      ))}
    </div>
  );
};

// Full Activity page skeleton
export const ActivityPageSkeleton = () => {
  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* Safe area spacer */}
      <div style={{ height: 'env(safe-area-inset-top, 0px)' }} />
      
      {/* Header area */}
      <div className="pt-4 pb-2">
        <StatsRowSkeleton />
      </div>

      {/* Mascot + Progress */}
      <div className="py-6">
        <MascotProgressSkeleton />
      </div>

      {/* Cult Ninja Cards */}
      <div className="flex-1 flex items-center justify-center">
        <CultNinjaCardsSkeleton />
      </div>

      {/* Week progress */}
      <div className="pb-4 px-8">
        <WeekProgressSkeleton />
      </div>
    </div>
  );
};

// Reel viewer skeleton
export const ReelViewerSkeleton = () => {
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #1a1525 0%, #0d0a15 100%)',
        height: '100dvh',
      }}
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 py-3" style={{ height: 60 }}>
        <motion.div
          className="w-8 h-8 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-8 h-8 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              animate={{ opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
        <motion.div
          className="w-8 h-8 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      {/* Media area skeleton */}
      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          className="w-full max-w-sm rounded-3xl overflow-hidden"
          style={{
            aspectRatio: '9/16',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-full h-full" style={shimmerStyle} />
        </motion.div>
      </div>

      {/* Bottom CTA skeleton */}
      <div className="px-6 py-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
        <motion.div
          className="w-full h-14 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    </div>
  );
};

// Progress page skeleton
export const ProgressPageSkeleton = () => {
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #3A2A63 0%, #1A1530 45%, #060608 100%)',
        height: '100dvh',
      }}
    >
      {/* Story strip skeleton */}
      <div className="pt-12 px-4">
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <StoryCardSkeleton key={i} size="md" />
          ))}
        </div>
      </div>

      {/* Progress tiles skeleton */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <motion.div
              key={i}
              className="rounded-xl"
              style={{
                width: 70,
                height: 100,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default {
  CultNinjaCardsSkeleton,
  StoryCardSkeleton,
  MascotProgressSkeleton,
  StatsRowSkeleton,
  WeekProgressSkeleton,
  ActivityGridSkeleton,
  ActivityPageSkeleton,
  ReelViewerSkeleton,
  ProgressPageSkeleton,
};
