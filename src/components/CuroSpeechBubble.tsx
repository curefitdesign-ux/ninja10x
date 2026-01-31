import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";

interface CuroSpeechBubbleProps {
  photosCount: number;
  currentWeek: number;
  userName?: string;
}

const CuroSpeechBubble = ({ photosCount, currentWeek, userName }: CuroSpeechBubbleProps) => {
  // Use first name only for conversational feel
  const firstName = userName?.split(' ')[0] || 'there';
  
  // Calculate contextual state
  const dayInWeek = photosCount % 3; // 0 = start of week, 1 = day 2, 2 = day 3
  const isWeekComplete = dayInWeek === 0 && photosCount > 0;
  const isJourneyComplete = photosCount >= 12;
  const daysLeft = 3 - dayInWeek;
  
  // Get single contextual message based on exact state
  const getMessage = (): string => {
    // Journey complete
    if (isJourneyComplete) {
      return `${firstName}, you crushed it! 🏆 12 days — habit unlocked!`;
    }
    
    // Week just completed (3, 6, 9 photos)
    if (isWeekComplete) {
      const completedWeek = photosCount / 3;
      const weekMessages: Record<number, string> = {
        1: `${firstName}, Week 1 done! 🔥 Your streak is alive.`,
        2: `Week 2 in the bag! ⚡ ${firstName}, you're on fire.`,
        3: `${firstName}, Week 3 locked! 💪 One more week to go.`,
      };
      return weekMessages[completedWeek] || `Great week, ${firstName}!`;
    }
    
    // First time user
    if (photosCount === 0) {
      return `Hey ${firstName}! 👋 Tap + to log your first workout.`;
    }
    
    // Day 2 of any week (1, 4, 7, 10 photos)
    if (dayInWeek === 1) {
      return `Nice one, ${firstName}! 📸 ${daysLeft} more to complete this week.`;
    }
    
    // Day 3 of any week (2, 5, 8, 11 photos) - about to complete
    if (dayInWeek === 2) {
      return `Almost there, ${firstName}! 🎯 1 more unlocks your reel.`;
    }
    
    return `Keep going, ${firstName}! 💪`;
  };

  const message = getMessage();
  
  // Split message into words for animation
  const words = useMemo(() => {
    return message.split(' ').filter(w => w.length > 0);
  }, [message]);
  
  // Animated word reveal state
  const [visibleWords, setVisibleWords] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  
  // Reset and start word animation when message changes
  useEffect(() => {
    setVisibleWords(0);
    setAnimationKey(prev => prev + 1);
    
    // Reveal words one by one
    const wordDelay = 80; // ms per word
    const timer = setInterval(() => {
      setVisibleWords(prev => {
        if (prev >= words.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, wordDelay);
    
    return () => clearInterval(timer);
  }, [message, words.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-4 relative"
    >
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-60" />
      
      {/* Speech bubble with tail */}
      <div className="relative">
        {/* Bubble tail pointing up to mascot */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 rotate-45"
          style={{
            background: 'rgba(255,255,255,0.1)',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            borderLeft: '1px solid rgba(255,255,255,0.15)',
          }}
        />
        
        {/* Main bubble */}
        <div 
          className="relative bg-white/[0.1] backdrop-blur-xl rounded-2xl px-6 py-3 text-center border border-white/[0.15]"
          style={{
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)',
            minHeight: '52px', // Prevent layout shift
          }}
        >
          <p className="text-sm text-white/90 leading-relaxed">
            <AnimatePresence mode="wait">
              <motion.span
                key={animationKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline"
              >
                {words.map((word, index) => (
                  <motion.span
                    key={`${animationKey}-${index}`}
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={index < visibleWords ? {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    } : {
                      opacity: 0,
                      y: 8,
                      scale: 0.9,
                    }}
                    transition={{
                      duration: 0.25,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className="inline-block mr-[0.25em]"
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.span>
            </AnimatePresence>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CuroSpeechBubble;
