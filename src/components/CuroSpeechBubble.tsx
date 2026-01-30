import { motion } from "framer-motion";

interface CuroSpeechBubbleProps {
  photosCount: number;
  currentWeek: number;
}

const CuroSpeechBubble = ({ photosCount, currentWeek }: CuroSpeechBubbleProps) => {
  // Calculate contextual state
  const dayInWeek = photosCount % 3; // 0 = start of week, 1 = day 2, 2 = day 3
  const isWeekComplete = dayInWeek === 0 && photosCount > 0;
  const isJourneyComplete = photosCount >= 12;
  
  // Get single contextual message based on exact state
  const getMessage = (): string => {
    // Journey complete
    if (isJourneyComplete) {
      return "🏆 12 days strong!\nYou've built an incredible habit!";
    }
    
    // Week just completed (3, 6, 9 photos)
    if (isWeekComplete) {
      const completedWeek = photosCount / 3;
      const weekMessages: Record<number, string> = {
        1: "Week 1 done! 🔥\nYour willpower is unlocked!",
        2: "Week 2 crushed! ⚡\nEnergy levels rising!",
        3: "Week 3 complete! 💪\nStamina mode activated!",
      };
      return weekMessages[completedWeek] || "Amazing week! Keep going!";
    }
    
    // First time user
    if (photosCount === 0) {
      return "Hey, I'm Curo! 👋\nTap + to log your first workout!";
    }
    
    // Day 2 of any week (1, 4, 7, 10 photos)
    if (dayInWeek === 1) {
      return "Great start! 📸\nOne more to complete the week!";
    }
    
    // Day 3 of any week (2, 5, 8, 11 photos) - about to complete
    if (dayInWeek === 2) {
      return "Almost there! 🎯\nOne more unlocks your reel!";
    }
    
    return "Keep the momentum! 💪";
  };

  const message = getMessage();

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
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-white/90 whitespace-pre-line"
          >
            {message}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default CuroSpeechBubble;
