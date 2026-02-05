import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';

export type GenerationStep = 'narration' | 'video' | 'complete';

interface ReelGenerationOverlayProps {
  isVisible: boolean;
  currentStep: GenerationStep;
  progress?: number; // 0-100 real progress
  onClose?: () => void;
}

const ReelGenerationOverlay = ({ isVisible, currentStep }: ReelGenerationOverlayProps) => {
  const lottieRef = useRef<any>(null);
  const [lottieData, setLottieData] = useState<object | null>(null);
  
  // Debug logging
  useEffect(() => {
    console.log('[ReelGenerationOverlay] visibility changed:', { isVisible, currentStep });
  }, [isVisible, currentStep]);
  
  // Load Lottie animation
  useEffect(() => {
    fetch('/lottie/ai-star-loader.json')
      .then(res => res.json())
      .then(data => {
        console.log('[Lottie] Animation loaded successfully');
        setLottieData(data);
      })
      .catch(err => console.error('[Lottie] Failed to load:', err));
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
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

          {/* Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-xs mx-6 flex flex-col items-center"
          >
            {/* Lottie Animation - Circular loader style */}
            <div className="relative w-24 h-24 mb-8">
              {lottieData ? (
                <Lottie 
                  lottieRef={lottieRef}
                  animationData={lottieData}
                  loop={true}
                  autoplay={true}
                  className="w-full h-full"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))' }}
                />
              ) : (
                <motion.div 
                  className="w-full h-full rounded-full border-[3px] border-white/10 border-t-blue-400"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </div>
            
            {/* Main title */}
            <motion.h2 
              className="text-2xl font-semibold text-white text-center mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Generating your weekly recap...
            </motion.h2>
            
            {/* Subtitle */}
            <motion.p 
              className="text-base text-white/40 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              This usually takes 1-2 minutes
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReelGenerationOverlay;
