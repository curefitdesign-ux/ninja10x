import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingCoachmarksProps {
  onComplete: () => void;
}

const STORAGE_KEY = 'ninja10x_onboarding_seen';

const steps = [
  {
    id: 'log-activity',
    // Highlight zone: the center card area
    highlight: { top: '18%', left: '10%', width: '80%', height: '58%', borderRadius: '16px' },
    title: 'Log Any Activity',
    emoji: '🏏',
    description: 'Cricket, badminton, swimming, trekking, yoga — any sport or physical activity counts.',
    subtext: 'Log 12 activities (3 per week × 4 weeks) to become a Cult Ninja.',
    buttonText: 'Next',
  },
  {
    id: 'community',
    // Highlight zone: top avatar strip
    highlight: { top: 'calc(max(env(safe-area-inset-top, 8px), 8px) + 12px)', left: '4%', width: '92%', height: '78px', borderRadius: '40px' },
    title: 'You\'re Not Alone',
    emoji: '🤝',
    description: 'See other people on the same journey. React to their activities, nudge them, and get inspired.',
    subtext: 'Motivate each other and become Ninjas together.',
    buttonText: 'Get Started',
  },
];

export default function OnboardingCoachmarks({ onComplete }: OnboardingCoachmarksProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem(STORAGE_KEY, 'true');
      setVisible(false);
      setTimeout(onComplete, 400);
    }
  }, [currentStep, onComplete]);

  if (!visible) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{ touchAction: 'none' }}
        >
          {/* Dark overlay with cutout */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            <defs>
              <mask id={`coachmark-mask-${currentStep}`}>
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={step.highlight.left}
                  y={step.highlight.top}
                  width={step.highlight.width}
                  height={step.highlight.height}
                  rx="16"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.78)"
              mask={`url(#coachmark-mask-${currentStep})`}
              style={{ backdropFilter: 'blur(6px)' }}
            />
          </svg>

          {/* Highlight border glow */}
          <motion.div
            key={step.id}
            className="absolute"
            style={{
              top: step.highlight.top,
              left: step.highlight.left,
              width: step.highlight.width,
              height: step.highlight.height,
              borderRadius: step.highlight.borderRadius,
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 0 30px rgba(196, 161, 255, 0.2), inset 0 0 20px rgba(196, 161, 255, 0.05)',
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Content card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              className="absolute left-0 right-0 flex flex-col items-center px-6"
              style={{
                bottom: currentStep === 0 ? '10%' : '22%',
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              {/* Glass card */}
              <div
                className="w-full max-w-[340px] rounded-3xl p-6 flex flex-col items-center text-center gap-3"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 20px 50px rgba(0, 0, 0, 0.3)',
                }}
              >
                {/* Emoji */}
                <motion.span
                  className="text-4xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                >
                  {step.emoji}
                </motion.span>

                {/* Title */}
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(180, 160, 220, 0.85)' }}>
                  {step.description}
                </p>

                {/* Subtext */}
                <p className="text-xs font-medium" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  {step.subtext}
                </p>

                {/* Step indicator dots */}
                <div className="flex items-center gap-2 mt-1">
                  {steps.map((_, i) => (
                    <motion.div
                      key={i}
                      className="rounded-full"
                      style={{
                        width: i === currentStep ? 20 : 6,
                        height: 6,
                        background: i === currentStep
                          ? 'linear-gradient(90deg, #F97316, #EC4899)'
                          : 'rgba(255, 255, 255, 0.2)',
                        borderRadius: 999,
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </div>

                {/* Glass CTA button */}
                <motion.button
                  onClick={handleNext}
                  className="mt-2 w-full py-3.5 rounded-2xl text-sm font-bold tracking-wide active:scale-[0.97]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: 'transparent',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundImage: 'linear-gradient(90deg, #F97316, #EC4899)',
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Wrapper to have both bg and gradient text */}
                  <span className="relative">
                    {step.buttonText}
                  </span>
                </motion.button>
                {/* Actual visible button with white bg */}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Skip button */}
          {currentStep < steps.length - 1 && (
            <motion.button
              className="absolute top-0 right-4 text-xs font-medium active:scale-95"
              style={{
                top: 'calc(max(env(safe-area-inset-top, 8px), 8px) + 4px)',
                color: 'rgba(255, 255, 255, 0.4)',
              }}
              onClick={() => {
                localStorage.setItem(STORAGE_KEY, 'true');
                setVisible(false);
                setTimeout(onComplete, 400);
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Skip
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
