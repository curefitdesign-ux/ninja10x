import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingCoachmarksProps {
  onComplete: () => void;
}

const STORAGE_KEY = 'ninja10x_onboarding_seen';

const steps = [
  {
    id: 'log-activity',
    highlight: { top: '18%', left: '10%', width: '80%', height: '58%', borderRadius: '16px' },
    title: 'Log any activity.',
    description: '12 activities. 4 weeks. Become a Ninja.',
    buttonText: 'Next',
  },
  {
    id: 'community',
    highlight: { top: 'calc(max(env(safe-area-inset-top, 8px), 8px) + 12px)', left: '4%', width: '92%', height: '78px', borderRadius: '40px' },
    title: 'You\'re not alone.',
    description: 'React, nudge, and rise together.',
    buttonText: 'Get Started',
  },
];

// Text reveal: blur → clear, word by word
function RevealText({ text, delay = 0, className = '' }: { text: string; delay?: number; className?: string }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.3em]"
          initial={{ filter: 'blur(8px)', opacity: 0 }}
          animate={{ filter: 'blur(0px)', opacity: 1 }}
          transition={{ duration: 0.5, delay: delay + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export default function OnboardingCoachmarks({ onComplete }: OnboardingCoachmarksProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
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

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    setTimeout(onComplete, 400);
  }, [onComplete]);

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
          {/* Overlay with cutout */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            <defs>
              <mask id={`cm-${currentStep}`}>
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
              fill="rgba(0, 0, 0, 0.8)"
              mask={`url(#cm-${currentStep})`}
            />
          </svg>

          {/* Highlight ring */}
          <motion.div
            key={step.id + '-ring'}
            className="absolute pointer-events-none"
            style={{
              top: step.highlight.top,
              left: step.highlight.left,
              width: step.highlight.width,
              height: step.highlight.height,
              borderRadius: step.highlight.borderRadius,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 0 24px rgba(196, 161, 255, 0.15)',
            }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              className="absolute left-0 right-0 flex flex-col items-center px-8"
              style={{ bottom: currentStep === 0 ? '12%' : '24%' }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Title - blur reveal */}
              <h3 className="text-[22px] font-semibold text-white tracking-tight text-center mb-2">
                <RevealText text={step.title} delay={0.15} />
              </h3>

              {/* Description - blur reveal, staggered */}
              <p className="text-[15px] text-center mb-6" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                <RevealText text={step.description} delay={0.45} />
              </p>

              {/* Dots */}
              <div className="flex items-center gap-1.5 mb-5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === currentStep ? 18 : 5,
                      height: 5,
                      background: i === currentStep
                        ? 'linear-gradient(90deg, #F97316, #EC4899)'
                        : 'rgba(255, 255, 255, 0.2)',
                    }}
                  />
                ))}
              </div>

              {/* CTA */}
              <motion.button
                onClick={handleNext}
                className="w-full max-w-[280px] py-3 rounded-2xl text-[15px] font-semibold tracking-wide"
                style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                whileTap={{ scale: 0.97 }}
              >
                <span
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #F97316, #EC4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {step.buttonText}
                </span>
              </motion.button>
            </motion.div>
          </AnimatePresence>

          {/* Skip */}
          {currentStep < steps.length - 1 && (
            <motion.button
              className="absolute right-5 text-xs font-medium active:scale-95"
              style={{
                top: 'calc(max(env(safe-area-inset-top, 8px), 8px) + 4px)',
                color: 'rgba(255, 255, 255, 0.35)',
              }}
              onClick={dismiss}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Skip
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
