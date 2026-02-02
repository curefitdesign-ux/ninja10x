import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Hand } from 'lucide-react';

const STORAGE_KEY = 'story-hint-shown';

interface StoryHintProps {
  hasMultipleStories: boolean;
  hasMultipleUsers: boolean;
}

export default function StoryHint({ hasMultipleStories, hasMultipleUsers }: StoryHintProps) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // Check if hint was already shown
    const hintShown = localStorage.getItem(STORAGE_KEY);
    if (hintShown) return;

    // Only show if there's something to hint about
    if (!hasMultipleStories && !hasMultipleUsers) return;

    // Show hint after a brief delay
    const showTimer = setTimeout(() => {
      setShowHint(true);
      
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }
    }, 800);

    // Auto-hide after 4 seconds
    const hideTimer = setTimeout(() => {
      setShowHint(false);
      localStorage.setItem(STORAGE_KEY, 'true');
    }, 4800);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [hasMultipleStories, hasMultipleUsers]);

  const handleDismiss = () => {
    setShowHint(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  return (
    <AnimatePresence>
      {showHint && (
        <motion.div
          className="absolute inset-0 z-[100] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Subtle overlay */}
          <motion.div 
            className="absolute inset-0 pointer-events-auto"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            onClick={handleDismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Hint content */}
          <div className="relative flex flex-col items-center gap-6">
            {/* Tap hint for multiple stories */}
            {hasMultipleStories && (
              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Animated tap gesture */}
                <motion.div
                  className="relative"
                  animate={{ 
                    scale: [1, 0.85, 1],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: 2,
                    repeatDelay: 0.3,
                  }}
                >
                  <motion.div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <Hand className="w-7 h-7 text-white" />
                  </motion.div>
                  
                  {/* Ripple effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: '2px solid rgba(255,255,255,0.4)' }}
                    animate={{
                      scale: [1, 1.8],
                      opacity: [0.6, 0],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: 2,
                      repeatDelay: 0.3,
                    }}
                  />
                </motion.div>
                
                <motion.p 
                  className="text-white text-sm font-medium text-center"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
                >
                  Tap for next story
                </motion.p>
              </motion.div>
            )}

            {/* Swipe hint for multiple users */}
            {hasMultipleUsers && (
              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: hasMultipleStories ? 0.5 : 0.2 }}
              >
                {/* Animated swipe gesture */}
                <motion.div
                  className="flex items-center gap-3"
                  animate={{ x: [0, -30, 0] }}
                  transition={{
                    duration: 1,
                    repeat: 2,
                    repeatDelay: 0.4,
                    ease: 'easeInOut',
                  }}
                >
                  <motion.div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </motion.div>
                  
                  {/* Trail effect */}
                  <motion.div
                    className="flex gap-1"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{
                      duration: 1,
                      repeat: 2,
                      repeatDelay: 0.4,
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-white/60"
                        animate={{ 
                          opacity: [0.3, 0.8, 0.3],
                          scale: [0.8, 1, 0.8],
                        }}
                        transition={{
                          duration: 1,
                          repeat: 2,
                          repeatDelay: 0.4,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </motion.div>
                </motion.div>
                
                <motion.p 
                  className="text-white text-sm font-medium text-center"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
                >
                  Swipe left for next user
                </motion.p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
