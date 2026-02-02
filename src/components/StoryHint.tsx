import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'story-hint-shown';
const INACTIVITY_DELAY = 3000; // 3 seconds of inactivity before showing hint

interface StoryHintProps {
  hasMultipleStories: boolean;
  hasMultipleUsers: boolean;
  onNudge?: () => void;
}

export default function StoryHint({ hasMultipleStories, hasMultipleUsers, onNudge }: StoryHintProps) {
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeType, setNudgeType] = useState<'tap' | 'swipe' | null>(null);

  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([15, 80, 15, 80, 15]);
    }
  }, []);

  useEffect(() => {
    // Check if hint was already shown
    const hintShown = localStorage.getItem(STORAGE_KEY);
    if (hintShown) return;

    // Only show if there's something to hint about
    if (!hasMultipleStories && !hasMultipleUsers) return;

    // Show nudge after inactivity
    const nudgeTimer = setTimeout(() => {
      setNudgeType(hasMultipleUsers ? 'swipe' : 'tap');
      setShowNudge(true);
      triggerHaptic();
      onNudge?.();
      
      // Mark as shown after displaying
      localStorage.setItem(STORAGE_KEY, 'true');
    }, INACTIVITY_DELAY);

    // Auto-hide after showing
    const hideTimer = setTimeout(() => {
      setShowNudge(false);
    }, INACTIVITY_DELAY + 2500);

    return () => {
      clearTimeout(nudgeTimer);
      clearTimeout(hideTimer);
    };
  }, [hasMultipleStories, hasMultipleUsers, triggerHaptic, onNudge]);

  return (
    <AnimatePresence>
      {showNudge && (
        <>
          {/* Floating nudge indicator - no overlay, just subtle visual cues */}
          {nudgeType === 'swipe' && (
            <>
              {/* Left edge animated chevrons */}
              <motion.div
                className="absolute right-4 top-1/2 -translate-y-1/2 z-[100] pointer-events-none flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 2.5,
                  times: [0, 0.1, 0.8, 1],
                }}
              >
                {/* Stacked chevrons with staggered animation */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="text-white/80"
                    animate={{ 
                      x: [0, -12, 0],
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{ 
                      duration: 0.8,
                      repeat: 3,
                      delay: i * 0.15,
                      ease: 'easeInOut',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Floating label */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 bottom-[200px] z-[100] pointer-events-none"
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: [0, 1, 1, 0],
                  y: [10, 0, 0, -10],
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 2.5,
                  times: [0, 0.1, 0.8, 1],
                }}
              >
                <div 
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  <span className="text-white text-sm font-medium whitespace-nowrap">
                    Swipe for more stories
                  </span>
                </div>
              </motion.div>
            </>
          )}

          {nudgeType === 'tap' && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 bottom-[180px] z-[100] pointer-events-none"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10] }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 2,
                times: [0, 0.15, 0.75, 1],
                ease: 'easeOut',
              }}
            >
              <div 
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <motion.div
                  className="w-5 h-5 rounded-full border-2 border-white/60"
                  animate={{ scale: [1, 0.8, 1] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                />
                <span className="text-white text-sm font-medium whitespace-nowrap">
                  Tap to continue
                </span>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to add shake animation to story card container
export function useStoryNudgeAnimation() {
  const [shouldShake, setShouldShake] = useState(false);

  const triggerShake = useCallback(() => {
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 800);
  }, []);

  const shakeAnimation = shouldShake ? {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    rotate: [0, -1, 1, -0.5, 0.5, 0],
  } : {};

  const shakeTransition = {
    duration: 0.6,
    ease: 'easeInOut' as const,
  };

  return { shouldShake, triggerShake, shakeAnimation, shakeTransition };
}
