import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface CuroSpeechBubbleProps {
  photosCount: number;
  currentWeek: number;
}

// Different message categories based on progress
const introMessages = [
  "Hey, I'm Curo!\nLet's build a workout together!",
  "Hello there! 👋\nReady to get moving today?",
  "Hi! I'm Curo, your fitness buddy!\nLet's start this journey!",
];

const encourageMessages = [
  "You're doing great!\nKeep logging those workouts! 💪",
  "One step at a time!\nEvery photo counts! 📸",
  "Consistency is key!\nYou've got this! 🔥",
  "Amazing effort!\nLet's keep the momentum going!",
];

const celebrateMessages = [
  "Woohoo! You're on fire! 🔥\nKeep crushing it!",
  "Look at you go! 🎉\nYour dedication is inspiring!",
  "Incredible progress! ⭐\nYou're unstoppable!",
  "Week completed! 🏆\nYou're a fitness warrior!",
];

const motivateMessages = [
  "Time to log today's activity!\nSnap a photo or video! 📷",
  "Don't break the streak!\nCapture your workout today! 💪",
  "Your future self will thank you!\nLog it now! 🙌",
  "Every rep counts!\nShow me what you've got! 🏋️",
];

const CuroSpeechBubble = ({ photosCount, currentWeek }: CuroSpeechBubbleProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [currentMessages, setCurrentMessages] = useState<string[]>(introMessages);

  // Select message category based on progress
  useEffect(() => {
    if (photosCount === 0) {
      setCurrentMessages(introMessages);
    } else if (photosCount % 3 === 0) {
      // Completed a week
      setCurrentMessages(celebrateMessages);
    } else if (photosCount >= 6) {
      // Advanced user
      setCurrentMessages([...motivateMessages, ...encourageMessages]);
    } else {
      setCurrentMessages([...encourageMessages, ...motivateMessages]);
    }
  }, [photosCount]);

  // Rotate messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % currentMessages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentMessages.length]);

  const message = currentMessages[messageIndex];

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
          }}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-white/90 whitespace-pre-line"
            >
              {message}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default CuroSpeechBubble;
