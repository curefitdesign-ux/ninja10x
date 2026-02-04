import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Upload, Sparkles, Mic, Film, Check } from 'lucide-react';

export type LoaderType = 'uploading' | 'generating';
export type GenerationStep = 'narration' | 'video' | 'complete';

interface LiquidGlassLoaderProps {
  isVisible: boolean;
  type: LoaderType;
  currentStep?: GenerationStep;
  uploadProgress?: number; // 0-100 for upload progress
}

const generationSteps = [
  { id: 'narration', label: 'Preparing', icon: Sparkles },
  { id: 'video', label: 'Creating video', icon: Film },
];

const LiquidGlassLoader = ({ isVisible, type, currentStep = 'narration', uploadProgress = 0 }: LiquidGlassLoaderProps) => {
  const getCompletedSteps = () => {
    if (currentStep === 'video') return new Set(['narration']);
    if (currentStep === 'complete') return new Set(['narration', 'video']);
    return new Set<string>();
  };

  const completedSteps = getCompletedSteps();

  const getStepStatus = (stepId: string) => {
    if (completedSteps.has(stepId)) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

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
          {/* Liquid Glass Background */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl">
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.04) 0%, transparent 60%)'
              }}
            />
          </div>

          {/* Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-xs mx-6"
          >
            {/* Liquid Glass Card */}
            <div
              className="p-8 rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 32px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
              }}
            >
              {type === 'uploading' ? (
                // Upload State
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                    }}
                  >
                    <Upload className="w-6 h-6 text-white/80" />
                  </motion.div>
                  
                  <h3 className="text-lg font-semibold text-white mb-1">Uploading</h3>
                  <p className="text-sm text-white/50 mb-6">Preparing your photos...</p>
                  
                  {/* Progress bar */}
                  <div 
                    className="h-1 rounded-full overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.9) 100%)',
                      }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              ) : (
                // Generation State
                <div>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-white">Creating Reel</h3>
                    <p className="text-sm text-white/50 mt-1">This may take a minute</p>
                  </div>
                  
                  {/* Steps */}
                  <div className="space-y-3">
                    {generationSteps.map((step) => {
                      const status = getStepStatus(step.id);
                      const Icon = step.icon;
                      const isActive = status === 'active';
                      const isCompleted = status === 'completed';
                      
                      return (
                        <motion.div
                          key={step.id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300"
                          style={{
                            background: isActive 
                              ? 'rgba(255,255,255,0.1)'
                              : 'transparent',
                          }}
                        >
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
                            style={{
                              background: isCompleted 
                                ? 'rgba(255,255,255,0.9)'
                                : isActive 
                                  ? 'rgba(255,255,255,0.2)'
                                  : 'rgba(255,255,255,0.08)',
                            }}
                          >
                            {isCompleted ? (
                              <Check className="w-4 h-4 text-black" strokeWidth={3} />
                            ) : isActive ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                              >
                                <Loader2 className="w-4 h-4 text-white" />
                              </motion.div>
                            ) : (
                              <Icon className="w-4 h-4 text-white/30" />
                            )}
                          </div>
                          
                          <span className={`text-sm font-medium transition-colors duration-300 ${
                            isActive ? 'text-white' : isCompleted ? 'text-white/70' : 'text-white/30'
                          }`}>
                            {step.label}
                          </span>
                          
                          {isActive && (
                            <motion.div
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                            />
                          )}
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