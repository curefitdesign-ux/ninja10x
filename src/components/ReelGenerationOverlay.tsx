import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import Lottie from 'lottie-react';

export type GenerationStep = 'narration' | 'video' | 'complete';

interface ReelGenerationOverlayProps {
  isVisible: boolean;
  currentStep: GenerationStep;
  progress?: number; // 0-100 real progress
  onClose?: () => void;
}

// Lazy load lottie data
const useLottieData = () => {
  const [data, setData] = useState<object | null>(null);
  
  useEffect(() => {
    fetch('/lottie/ai-star.json')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);
  
  return data;
};

const ReelGenerationOverlay = ({ isVisible, currentStep, progress = 0 }: ReelGenerationOverlayProps) => {
  const lottieData = useLottieData();

  const getStepLabel = () => {
    if (progress >= 100) return 'Finishing up...';
    if (currentStep === 'video') return 'Creating your recap...';
    return 'Preparing media...';
  };

  const displayProgress = currentStep === 'complete' ? 100 : progress;

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
            className="relative z-10 w-full max-w-xs mx-6"
          >
            {/* Liquid Glass Card */}
            <div
              className="p-8 rounded-[32px] relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                backdropFilter: 'blur(60px) saturate(200%)',
                WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: `
                  0 40px 80px rgba(0,0,0,0.5), 
                  inset 0 1px 0 rgba(255,255,255,0.15),
                  inset 0 -1px 0 rgba(255,255,255,0.05)
                `
              }}
            >
              {/* Inner glow effect */}
              <div 
                className="absolute inset-0 rounded-[32px] pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 50%)',
                }}
              />

              {/* AI Star Animation */}
              <div className="relative w-28 h-28 mx-auto mb-2">
                {/* Outer glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, transparent 70%)',
                  }}
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.4, 0.7, 0.4],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                
                {/* Lottie animation */}
                {lottieData && (
                  <Lottie 
                    animationData={lottieData}
                    loop
                    className="w-full h-full relative z-10"
                    style={{ filter: 'drop-shadow(0 0 24px rgba(255, 255, 255, 0.4))' }}
                  />
                )}
              </div>
              
              {/* Progress percentage */}
              <motion.div 
                className="text-center mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.span 
                  className="text-5xl font-bold bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                  }}
                  key={Math.floor(displayProgress)}
                >
                  {Math.round(displayProgress)}%
                </motion.span>
              </motion.div>
              
              {/* Step label */}
              <motion.p 
                className="text-sm text-white/60 text-center mb-6"
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {getStepLabel()}
              </motion.p>
              
              {/* Progress bar */}
              <div className="relative w-full h-2 rounded-full overflow-hidden mb-4"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                }}
              >
                {/* Animated shimmer background */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
                  }}
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
                
                {/* Progress fill */}
                <motion.div
                  className="h-full rounded-full relative"
                  style={{
                    background: 'linear-gradient(90deg, rgba(139, 92, 246, 1) 0%, rgba(59, 130, 246, 1) 50%, rgba(236, 72, 153, 1) 100%)',
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.6), 0 0 8px rgba(59, 130, 246, 0.4)',
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${displayProgress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {/* Glowing tip */}
                  {displayProgress > 0 && displayProgress < 100 && (
                    <motion.div
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                      style={{
                        background: 'white',
                        boxShadow: '0 0 12px rgba(255,255,255,0.9), 0 0 24px rgba(139, 92, 246, 0.6)',
                      }}
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.8, 1, 0.8],
                      }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              </div>
              
              {/* Step indicators */}
              <div className="flex justify-between items-center px-1">
                {['Prepare', 'Create', 'Done'].map((label, idx) => {
                  const stepThresholds = [0, 20, 100];
                  const isComplete = displayProgress >= stepThresholds[idx];
                  const isActive = idx === 0 ? displayProgress > 0 && displayProgress < 20 : 
                                   idx === 1 ? displayProgress >= 20 && displayProgress < 100 :
                                   displayProgress >= 100;
                  
                  return (
                    <motion.div 
                      key={label}
                      className="flex flex-col items-center gap-1.5"
                      animate={{
                        opacity: isComplete || isActive ? 1 : 0.4,
                      }}
                    >
                      <motion.div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                        style={{
                          background: isComplete && displayProgress >= stepThresholds[idx]
                            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)'
                            : isActive
                              ? 'rgba(255,255,255,0.15)'
                              : 'rgba(255,255,255,0.05)',
                          border: isActive && !isComplete ? '1px solid rgba(139, 92, 246, 0.5)' : 'none',
                          boxShadow: isComplete ? '0 0 14px rgba(139, 92, 246, 0.5)' : 'none',
                        }}
                        animate={isActive && !isComplete ? {
                          boxShadow: ['0 0 0px rgba(139, 92, 246, 0)', '0 0 14px rgba(139, 92, 246, 0.5)', '0 0 0px rgba(139, 92, 246, 0)'],
                        } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {isComplete && displayProgress >= stepThresholds[idx] ? (
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        ) : (
                          <span className="text-white/60">{idx + 1}</span>
                        )}
                      </motion.div>
                      <span className={`text-[10px] font-medium ${isComplete || isActive ? 'text-white/80' : 'text-white/30'}`}>
                        {label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReelGenerationOverlay;
