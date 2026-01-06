import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, Film, Check } from 'lucide-react';

export type GenerationStep = 'narration' | 'voiceover' | 'video' | 'complete';

interface ReelGenerationOverlayProps {
  isVisible: boolean;
  currentStep: GenerationStep;
  onClose?: () => void;
}

const steps = [
  { id: 'narration', label: 'Writing Script', icon: Sparkles, description: 'AI is crafting your story...', duration: 8 },
  { id: 'voiceover', label: 'Recording Voice', icon: Mic, description: 'Generating voiceover...', duration: 12 },
  { id: 'video', label: 'Creating Video', icon: Film, description: 'Rendering your reel...', duration: 45 },
];

const TOTAL_ESTIMATED_TIME = 65; // seconds

const ReelGenerationOverlay = ({ isVisible, currentStep, onClose }: ReelGenerationOverlayProps) => {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isVisible && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      setElapsedTime(0);
    } else if (!isVisible) {
      startTimeRef.current = null;
      setElapsedTime(0);
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    if (currentStep === 'voiceover') {
      setCompletedSteps(new Set(['narration']));
    } else if (currentStep === 'video') {
      setCompletedSteps(new Set(['narration', 'voiceover']));
    } else if (currentStep === 'complete') {
      setCompletedSteps(new Set(['narration', 'voiceover', 'video']));
    } else if (currentStep === 'narration') {
      setCompletedSteps(new Set());
    }
  }, [currentStep]);

  const getStepStatus = (stepId: string) => {
    if (completedSteps.has(stepId)) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  // Calculate progress percentage based on current step
  const getProgressPercentage = () => {
    if (currentStep === 'complete') return 100;
    
    const stepIndex = steps.findIndex(s => s.id === currentStep);
    if (stepIndex === -1) return 0;
    
    // Base progress from completed steps
    let baseProgress = 0;
    for (let i = 0; i < stepIndex; i++) {
      baseProgress += (steps[i].duration / TOTAL_ESTIMATED_TIME) * 100;
    }
    
    // Add partial progress within current step
    const currentStepData = steps[stepIndex];
    const stepProgress = Math.min(elapsedTime / currentStepData.duration, 0.9) * (currentStepData.duration / TOTAL_ESTIMATED_TIME) * 100;
    
    return Math.min(Math.round(baseProgress + stepProgress), 95);
  };

  // Calculate ETA
  const getETA = () => {
    const remaining = Math.max(TOTAL_ESTIMATED_TIME - elapsedTime, 5);
    if (remaining >= 60) {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      return `~${mins}m ${secs}s`;
    }
    return `~${remaining}s`;
  };

  const progress = getProgressPercentage();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Brutalist background with film grain */}
          <div className="absolute inset-0 bg-black">
            {/* Noise texture overlay */}
            <div 
              className="absolute inset-0 opacity-30 mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />
            {/* Yellow accent line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute top-0 left-0 right-0 h-1 bg-yellow-400 origin-left"
            />
            {/* Glitch lines */}
            <motion.div
              animate={{
                opacity: [0, 1, 0],
                y: [0, 100, 200],
              }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="absolute left-0 right-0 h-px bg-yellow-400/50"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 w-full max-w-sm mx-4">
            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                Creating
              </h2>
              <h2 className="text-3xl font-black uppercase tracking-tight text-yellow-400">
                Your Reel
              </h2>
              
              {/* Progress percentage */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 flex items-center justify-center gap-3"
              >
                <span className="text-4xl font-black text-yellow-400">{progress}%</span>
                <div className="text-left">
                  <p className="text-xs text-white/50 uppercase tracking-wider">Time left</p>
                  <p className="text-sm font-bold text-white">{getETA()}</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Steps */}
            <div className="space-y-6">
              {steps.map((step, index) => {
                const status = getStepStatus(step.id);
                const Icon = step.icon;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="relative"
                  >
                    <div className={`
                      flex items-center gap-4 p-4 border-2 transition-all duration-300
                      ${status === 'active' 
                        ? 'border-yellow-400 bg-yellow-400/10' 
                        : status === 'completed'
                          ? 'border-white/30 bg-white/5'
                          : 'border-white/10 bg-transparent'
                      }
                    `}>
                      {/* Icon container */}
                      <div className={`
                        w-12 h-12 flex items-center justify-center transition-all duration-300
                        ${status === 'active' 
                          ? 'bg-yellow-400 text-black' 
                          : status === 'completed'
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-white/40'
                        }
                      `}>
                        {status === 'completed' ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1">
                        <p className={`
                          font-bold uppercase tracking-wide text-sm transition-colors duration-300
                          ${status === 'active' 
                            ? 'text-yellow-400' 
                            : status === 'completed'
                              ? 'text-white'
                              : 'text-white/40'
                          }
                        `}>
                          {step.label}
                        </p>
                        {status === 'active' && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-white/60 mt-1"
                          >
                            {step.description}
                          </motion.p>
                        )}
                      </div>

                      {/* Active indicator */}
                      {status === 'active' && (
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-3 h-3 bg-yellow-400"
                        />
                      )}
                    </div>

                    {/* Connector line */}
                    {index < steps.length - 1 && (
                      <div className={`
                        absolute left-8 top-full w-0.5 h-6 -translate-x-1/2 transition-colors duration-300
                        ${completedSteps.has(step.id) ? 'bg-white/30' : 'bg-white/10'}
                      `} />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12"
            >
              <div className="h-2 bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-yellow-400"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between mt-3">
                <p className="text-xs text-white/40 uppercase tracking-widest">
                  ~15 sec reel
                </p>
                <p className="text-xs text-white/60">
                  {elapsedTime}s elapsed
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReelGenerationOverlay;
