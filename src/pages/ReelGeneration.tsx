import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

const ReelGeneration = () => {
  const [deviceHeight, setDeviceHeight] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Calculate and set fixed device height
  useEffect(() => {
    const updateHeight = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      setDeviceHeight(height);
    };
    
    updateHeight();
    
    // Listen for viewport changes (keyboard, etc.)
    window.visualViewport?.addEventListener('resize', updateHeight);
    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Timer and progress animation
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    // Simulate progress - faster at start, slower as it approaches 95%
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        const remaining = 95 - prev;
        const increment = Math.max(0.5, remaining * 0.02);
        return Math.min(95, prev + increment);
      });
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearInterval(progressInterval);
    };
  }, []);

  // Check if generation is complete and navigate back
  useEffect(() => {
    const state = location.state as { isComplete?: boolean } | null;
    if (state?.isComplete) {
      setProgress(100);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    }
  }, [location.state, navigate]);

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle close button
  const handleClose = () => {
    navigate(-1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ 
        height: deviceHeight > 0 ? `${deviceHeight}px` : '100dvh', 
        minHeight: '-webkit-fill-available' 
      }}
    >
      {/* Liquid Glass Background with animated glow */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl">
        {/* Animated glow orbs */}
        <motion.div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 35%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)'
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 55%, rgba(59, 130, 246, 0.12) 0%, transparent 45%)'
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1.1, 0.95, 1.1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 70% 45%, rgba(236, 72, 153, 0.1) 0%, transparent 40%)'
          }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </div>

      {/* Close Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        onClick={handleClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all"
        style={{ marginTop: 'env(safe-area-inset-top)' }}
      >
        <X className="w-5 h-5" />
      </motion.button>

      {/* Content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-xs mx-6 flex flex-col items-center"
      >
        {/* GIF Animation */}
        <motion.div 
          className="relative w-32 h-32 mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        >
          <img 
            src="/images/ai-star-loader.gif" 
            alt="AI generating"
            className="w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 0 24px rgba(139, 92, 246, 0.5))' }}
          />
        </motion.div>
        
        {/* Main title */}
        <motion.h2 
          className="text-2xl font-semibold text-white text-center mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Generating your ai recap
        </motion.h2>
        
        {/* Subtitle */}
        <motion.p 
          className="text-base text-white/40 text-center mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          This usually takes 1-2 minutes
        </motion.p>

        {/* Progress Section */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Progress Bar */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm mb-3">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8))',
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Timer and Percentage */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/50 font-medium tabular-nums">
              {formatTime(elapsedSeconds)}
            </span>
            <span className="text-white/50 font-medium tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ReelGeneration;
