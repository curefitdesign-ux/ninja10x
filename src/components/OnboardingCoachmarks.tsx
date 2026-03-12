import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingCoachmarksProps {
  onComplete: () => void;
}

const STORAGE_KEY = 'ninja10x_onboarding_seen';

/**
 * Cinematic Apple-keynote-style onboarding.
 * Full-screen text reveals → final card swoops in.
 */

// Each "slide" is a full-screen text moment
const slides = [
  {
    id: 'hero',
    lines: ['Every rep counts.', 'Every step matters.'],
  },
  {
    id: 'challenge',
    lines: ['12 activities.', '4 weeks.', 'One transformation.'],
  },
  {
    id: 'community',
    lines: ['You\'re not doing this alone.'],
  },
];

// Word-by-word blur→clear reveal
function RevealLine({
  text,
  delay = 0,
  className = '',
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.32em]"
          initial={{ filter: 'blur(12px)', opacity: 0, y: 6 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: delay + i * 0.14,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export default function OnboardingCoachmarks({ onComplete }: OnboardingCoachmarksProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  const totalSteps = slides.length + 1; // slides + final CTA card

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const advance = useCallback(() => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      localStorage.setItem(STORAGE_KEY, 'true');
      setVisible(false);
      setTimeout(onComplete, 350);
    }
  }, [step, totalSteps, onComplete]);

  const skip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    setTimeout(onComplete, 350);
  }, [onComplete]);

  if (!visible) return null;

  const isTextSlide = step < slides.length;
  const isFinalCard = step === slides.length;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.92)', touchAction: 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={advance}
        >
          {/* Skip */}
          {step < totalSteps - 1 && (
            <motion.button
              className="absolute right-5 text-[11px] font-medium tracking-wider uppercase"
              style={{
                top: 'calc(max(env(safe-area-inset-top, 12px), 12px) + 8px)',
                color: 'rgba(255, 255, 255, 0.25)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                skip();
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              Skip
            </motion.button>
          )}

          {/* Text slides */}
          <AnimatePresence mode="wait">
            {isTextSlide && (
              <motion.div
                key={slides[step].id}
                className="flex flex-col items-center justify-center px-10 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.35 }}
              >
                {slides[step].lines.map((line, lineIdx) => (
                  <h2
                    key={lineIdx}
                    className="text-[28px] font-semibold text-white tracking-tight leading-[1.3] mb-1"
                    style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                  >
                    <RevealLine
                      text={line}
                      delay={0.15 + lineIdx * 0.55}
                    />
                  </h2>
                ))}

                {/* Subtle tap hint */}
                <motion.p
                  className="mt-10 text-[11px] tracking-widest uppercase"
                  style={{ color: 'rgba(255, 255, 255, 0.15)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.2 }}
                >
                  Tap to continue
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Final CTA card */}
          <AnimatePresence>
            {isFinalCard && (
              <motion.div
                key="final-card"
                className="flex flex-col items-center justify-center px-8 text-center"
                initial={{ opacity: 0, y: 80, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Glass card */}
                <motion.div
                  className="w-full max-w-[320px] rounded-3xl p-8 flex flex-col items-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow:
                      'inset 0 1px 1px rgba(255,255,255,0.08), 0 20px 60px rgba(0,0,0,0.4)',
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Emoji */}
                  <motion.span
                    className="text-[48px] mb-4"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 12 }}
                  >
                    🥷
                  </motion.span>

                  <h2
                    className="text-[22px] font-semibold text-white tracking-tight mb-2"
                    style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                  >
                    <RevealLine text="Become a Ninja." delay={0.5} />
                  </h2>

                  <p
                    className="text-[14px] leading-relaxed mb-7"
                    style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                  >
                    <RevealLine text="Log your first activity to begin." delay={0.9} />
                  </p>

                  {/* CTA button */}
                  <motion.button
                    className="w-full py-3.5 rounded-2xl text-[15px] font-semibold tracking-wide active:scale-[0.97]"
                    style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3, duration: 0.5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      advance();
                    }}
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
                      Let's Go
                    </span>
                  </motion.button>
                </motion.div>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5 mt-8">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === step ? 20 : 5,
                        height: 5,
                        background:
                          i === step
                            ? 'linear-gradient(90deg, #F97316, #EC4899)'
                            : 'rgba(255, 255, 255, 0.15)',
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress dots for text slides */}
          {isTextSlide && (
            <div className="absolute bottom-12 flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 20 : 5,
                    height: 5,
                    background:
                      i === step
                        ? 'linear-gradient(90deg, #F97316, #EC4899)'
                        : 'rgba(255, 255, 255, 0.15)',
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
