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
  { id: 'narration', label: 'WRITING SCRIPT', icon: Sparkles, duration: 8 },
  { id: 'voiceover', label: 'RECORDING VOICE', icon: Mic, duration: 12 },
  { id: 'video', label: 'CREATING VIDEO', icon: Film, description: 'Rendering your reel...', duration: 45 },
];

const TOTAL_ESTIMATED_TIME = 65;

const ReelGenerationOverlay = ({ isVisible, currentStep }: ReelGenerationOverlayProps) => {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isVisible && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      setCompletedSteps(new Set());
    } else if (!isVisible) {
      startTimeRef.current = null;
      setElapsedTime(0);
      setCompletedSteps(new Set());
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

  const getProgressPercentage = () => {
    if (currentStep === 'complete') return 100;
    
    const stepIndex = steps.findIndex(s => s.id === currentStep);
    if (stepIndex === -1) return 0;
    
    let baseProgress = 0;
    for (let i = 0; i < stepIndex; i++) {
      baseProgress += (steps[i].duration / TOTAL_ESTIMATED_TIME) * 100;
    }
    
    const currentStepData = steps[stepIndex];
    const stepProgress = Math.min(elapsedTime / currentStepData.duration, 0.9) * (currentStepData.duration / TOTAL_ESTIMATED_TIME) * 100;
    
    return Math.min(Math.round(baseProgress + stepProgress), 95);
  };

  const getETA = () => {
    const remaining = Math.max(TOTAL_ESTIMATED_TIME - elapsedTime, 5);
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
          {/* Liquid Glass Background */}
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl">
            {/* Subtle gradient overlay */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.03) 0%, transparent 60%)'
              }}
            />
            {/* Top accent line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent origin-center"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 w-full max-w-sm mx-6 px-2">
            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl font-bold uppercase tracking-tight text-white">
                Creating
              </h2>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-yellow-400">
                Your Reel
              </h2>
              
              {/* Progress percentage and ETA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 flex items-center justify-center gap-4"
              >
                <span className="text-5xl font-black text-yellow-400">{progress}%</span>
                <div className="text-left">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Time left</p>
                  <p className="text-base font-semibold text-white/80">{getETA()}</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Steps - Liquid Glass Cards */}
            <div className="space-y-3">
              {steps.map((step, index) => {
                const status = getStepStatus(step.id);
                const Icon = step.icon;
                const isActive = status === 'active';
                const isCompleted = status === 'completed';

                return (
                  <motion.div
                    key={step.id}
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="relative"
                  >
                    <div 
                      className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-300"
                      style={{
                        background: isActive 
                          ? 'linear-gradient(135deg, rgba(250,204,21,0.15) 0%, rgba(250,204,21,0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: isActive 
                          ? '1px solid rgba(250,204,21,0.4)' 
                          : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: isActive 
                          ? '0 8px 32px rgba(250,204,21,0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.05)'
                      }}
                    >
                      {/* Icon container */}
                      <div 
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300"
                        style={{
                          background: isCompleted 
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,240,240,0.9) 100%)'
                            : isActive 
                              ? 'linear-gradient(135deg, rgba(250,204,21,0.9) 0%, rgba(234,179,8,0.9) 100%)'
                              : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                          boxShadow: isActive || isCompleted
                            ? '0 4px 12px rgba(0,0,0,0.2)'
                            : 'none'
                        }}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5 text-black" strokeWidth={3} />
                        ) : (
                          <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-white/30'}`} />
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1">
                        <p className={`font-semibold uppercase tracking-wider text-xs transition-colors duration-300 ${
                          isActive ? 'text-yellow-400' : isCompleted ? 'text-white/80' : 'text-white/30'
                        }`}>
                          {step.label}
                        </p>
                        {isActive && step.description && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[11px] text-white/50 mt-0.5"
                          >
                            {step.description}
                          </motion.p>
                        )}
                      </div>

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          className="w-2.5 h-2.5 bg-yellow-400 rounded-sm"
                        />
                      )}
                    </div>

                    {/* Connector line */}
                    {index < steps.length - 1 && (
                      <div 
                        className="absolute left-[30px] top-full w-px h-3 transition-colors duration-300"
                        style={{
                          background: isCompleted 
                            ? 'linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(255,255,255,0.1))'
                            : 'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
                        }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Progress bar - Liquid Glass Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-10"
            >
              <div 
                className="h-1.5 rounded-full overflow-hidden"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, rgba(250,204,21,0.9) 0%, rgba(234,179,8,1) 100%)',
                    boxShadow: '0 0 12px rgba(250,204,21,0.5)'
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between mt-3">
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                  ~15 sec reel
                </p>
                <p className="text-[10px] text-white/40 font-medium">
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
