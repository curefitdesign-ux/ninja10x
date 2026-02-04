import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Check, Clock } from 'lucide-react';
import Lottie from 'lottie-react';
import { useEffect, useState, useRef } from 'react';

export type LoaderType = 'uploading' | 'generating';
export type GenerationStep = 'narration' | 'video' | 'complete';

interface LiquidGlassLoaderProps {
  isVisible: boolean;
  type: LoaderType;
  currentStep?: GenerationStep;
  uploadProgress?: number;
  generationProgress?: number; // 0-100 for generation progress
}

// Lazy load lottie data
const useLottieData = () => {
  const [data, setData] = useState<object | null>(null);
  
  useEffect(() => {
    fetch('/lottie/ai-star.json')
      .then(res => res.json())
      .then(data => {
        console.log('[Lottie] LiquidGlass animation loaded');
        setData(data);
      })
      .catch(err => console.error('[Lottie] Failed:', err));
  }, []);
  
  return data;
};

// Elapsed time hook
const useElapsedTime = (isRunning: boolean) => {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      setElapsed(0);
      
      const interval = setInterval(() => {
        if (startTimeRef.current) {
          setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      startTimeRef.current = null;
    }
  }, [isRunning]);
  
  return elapsed;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const LiquidGlassLoader = ({ 
  isVisible, 
  type, 
  currentStep = 'narration', 
  uploadProgress = 0,
  generationProgress = 0 
}: LiquidGlassLoaderProps) => {
  const lottieData = useLottieData();
  const lottieRef = useRef<any>(null);
  const elapsedTime = useElapsedTime(isVisible && type === 'generating' && currentStep !== 'complete');
  
  const getStepLabel = () => {
    switch (currentStep) {
      case 'narration': return 'Preparing your media...';
      case 'video': return 'Creating your recap...';
      case 'complete': return 'Almost done...';
      default: return 'Processing...';
    }
  };

  const displayProgress = type === 'uploading' ? uploadProgress : generationProgress;

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
                background: 'radial-gradient(ellipse at 50% 35%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)'
              }}
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at 30% 60%, rgba(59, 130, 246, 0.1) 0%, transparent 40%)'
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [1.1, 1, 1.1],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
            <motion.div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at 70% 50%, rgba(236, 72, 153, 0.08) 0%, transparent 35%)'
              }}
              animate={{
                opacity: [0.4, 0.8, 0.4],
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

              {type === 'uploading' ? (
                // Upload State
                <div className="text-center relative z-10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                    }}
                  >
                    <Upload className="w-7 h-7 text-white/80" />
                  </motion.div>
                  
                  <h3 className="text-lg font-semibold text-white mb-1">Uploading</h3>
                  <p className="text-sm text-white/50 mb-6">Preparing your photos...</p>
                  
                  {/* Progress bar */}
                  <div 
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.8) 0%, rgba(59, 130, 246, 0.9) 50%, rgba(236, 72, 153, 0.8) 100%)',
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
                      }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              ) : (
                // Generation State - Futuristic
                <div className="relative z-10">
                  {/* AI Star Animation */}
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    {/* Outer glow ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
                      }}
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    
                    {/* Lottie animation */}
                    {lottieData ? (
                      <Lottie 
                        lottieRef={lottieRef}
                        animationData={lottieData}
                        loop={true}
                        autoplay={true}
                        className="w-full h-full relative z-10"
                        style={{ filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))' }}
                      />
                    ) : (
                      <motion.div 
                        className="w-full h-full flex items-center justify-center"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      >
                        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white/80" />
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Progress percentage */}
                  <motion.div 
                    className="text-center mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.span 
                      className="text-4xl font-bold bg-clip-text text-transparent"
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
                    className="text-sm text-white/60 text-center mb-2"
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {getStepLabel()}
                  </motion.p>
                  
                  {/* Elapsed time display */}
                  <motion.div 
                    className="flex items-center justify-center gap-1.5 mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Clock className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-xs font-mono text-white/50 tabular-nums">
                      {formatTime(elapsedTime)}
                    </span>
                  </motion.div>
                  
                  {/* Circular progress ring */}
                  <div className="relative w-full h-1.5 rounded-full overflow-hidden mb-2"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Animated shimmer background */}
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
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
                        boxShadow: '0 0 24px rgba(139, 92, 246, 0.6), 0 0 8px rgba(59, 130, 246, 0.4)',
                      }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${displayProgress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                      {/* Glowing tip */}
                      <motion.div
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                        style={{
                          background: 'white',
                          boxShadow: '0 0 12px rgba(255,255,255,0.8), 0 0 24px rgba(139, 92, 246, 0.6)',
                        }}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.8, 1, 0.8],
                        }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    </motion.div>
                  </div>
                  
                  {/* Step indicators */}
                  <div className="flex justify-between items-center mt-4 px-2">
                    {['Prepare', 'Create', 'Done'].map((label, idx) => {
                      const stepThresholds = [0, 33, 100];
                      const isComplete = displayProgress >= stepThresholds[idx];
                      const isActive = idx === 0 ? displayProgress < 33 : 
                                       idx === 1 ? displayProgress >= 33 && displayProgress < 100 :
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
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                            style={{
                              background: isComplete 
                                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)'
                                : isActive
                                  ? 'rgba(255,255,255,0.15)'
                                  : 'rgba(255,255,255,0.05)',
                              border: isActive && !isComplete ? '1px solid rgba(139, 92, 246, 0.5)' : 'none',
                              boxShadow: isComplete ? '0 0 12px rgba(139, 92, 246, 0.4)' : 'none',
                            }}
                            animate={isActive && !isComplete ? {
                              boxShadow: ['0 0 0px rgba(139, 92, 246, 0)', '0 0 12px rgba(139, 92, 246, 0.4)', '0 0 0px rgba(139, 92, 246, 0)'],
                            } : {}}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            {isComplete && displayProgress >= stepThresholds[idx] ? (
                              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
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
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LiquidGlassLoader;