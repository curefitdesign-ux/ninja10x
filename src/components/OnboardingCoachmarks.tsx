import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingCoachmarksProps {
  onComplete: () => void;
}

const STORAGE_KEY = 'ninja10x_onboarding_seen';

/**
 * Cinematic onboarding: 4-phase flow
 * Phase 0: Inspiring fitness text (auto-advance)
 * Phase 1: Journey challenge text (auto-advance)  
 * Phase 2: Blur fades → highlight first card → NEXT CTA
 * Phase 3: Blur returns → community text → blur fades → highlight avatars → LOG NOW CTA
 */

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

type Phase = 0 | 1 | 2 | 3 | 4 | 5;

export default function OnboardingCoachmarks({ onComplete }: OnboardingCoachmarksProps) {
  const [phase, setPhase] = useState<Phase>(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    } else {
      onComplete();
    }
  }, [onComplete]);

  // Auto-advance from phase 0 → 1 after text reveals
  useEffect(() => {
    if (!visible) return;
    if (phase === 0) {
      timerRef.current = setTimeout(() => setPhase(1), 3200);
    } else if (phase === 1) {
      timerRef.current = setTimeout(() => setPhase(2), 3800);
    } else if (phase === 3) {
      timerRef.current = setTimeout(() => setPhase(4), 3500);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, visible]);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    setTimeout(onComplete, 350);
  }, [onComplete]);

  if (!visible) return null;

  // Phase 0: Inspiring fitness text (full blur bg, auto-advance)
  // Phase 1: Journey "3 × 4 = Ninja" text (full blur bg, auto-advance)
  // Phase 2: Blur fades → reveal card beneath → NEXT CTA
  // Phase 3: Blur returns → community text (auto-advance)
  // Phase 4: Blur fades → reveal top avatar strip → LOG NOW CTA
  // Phase 5: dismissed

  const showBlur = phase === 0 || phase === 1 || phase === 3;
  const showDimOverlay = phase === 2 || phase === 4; // dim but semi-transparent

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ touchAction: 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Blur background layer */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(0, 0, 0, 0.92)' }}
            animate={{ opacity: showBlur ? 1 : showDimOverlay ? 0.55 : 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />

          {/* Skip button */}
          {phase < 5 && (
            <motion.button
              className="absolute right-5 z-50 text-[11px] font-medium tracking-wider uppercase"
              style={{
                top: 'calc(max(env(safe-area-inset-top, 12px), 12px) + 8px)',
                color: 'rgba(255, 255, 255, 0.25)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                finish();
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              Skip
            </motion.button>
          )}

          {/* ═══ PHASE 0: Inspiring fitness text ═══ */}
          <AnimatePresence mode="wait">
            {phase === 0 && (
              <motion.div
                key="phase0"
                className="relative z-10 flex flex-col items-center justify-center px-10 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4 }}
              >
                <h2
                  className="text-[28px] font-semibold text-white tracking-tight leading-[1.3] mb-2"
                  style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="Capture every workout." delay={0.2} />
                </h2>
                <h2
                  className="text-[28px] font-semibold text-white tracking-tight leading-[1.3] mb-2"
                  style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="Every run. Every game." delay={0.9} />
                </h2>
                <h2
                  className="text-[22px] font-medium tracking-tight leading-[1.3]"
                  style={{ color: 'rgba(255, 255, 255, 0.45)', fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="Cricket. Swimming. Yoga. Anything." delay={1.6} />
                </h2>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ PHASE 1: Journey challenge text ═══ */}
          <AnimatePresence mode="wait">
            {phase === 1 && (
              <motion.div
                key="phase1"
                className="relative z-10 flex flex-col items-center justify-center px-10 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4 }}
              >
                <h2
                  className="text-[32px] font-bold text-white tracking-tight leading-[1.25] mb-2"
                  style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="3 activities." delay={0.15} />
                </h2>
                <h2
                  className="text-[32px] font-bold text-white tracking-tight leading-[1.25] mb-2"
                  style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="4 weeks." delay={0.7} />
                </h2>
                <h2
                  className="text-[26px] font-semibold tracking-tight leading-[1.3]"
                  style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <motion.span
                    className="inline-block"
                    initial={{ filter: 'blur(12px)', opacity: 0, scale: 0.9 }}
                    animate={{ filter: 'blur(0px)', opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span
                      style={{
                        backgroundImage: 'linear-gradient(90deg, #F97316, #EC4899)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      Become a Cult Ninja.
                    </span>
                  </motion.span>
                </h2>
                <motion.span
                  className="text-[48px] mt-4 block"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 2.0, type: 'spring', stiffness: 200, damping: 12 }}
                >
                  🥷
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ PHASE 2: Blur faded, highlight card, NEXT CTA ═══ */}
          <AnimatePresence>
            {phase === 2 && (
              <motion.div
                key="phase2"
                className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center pb-16"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {/* Pointing text */}
                <motion.p
                  className="text-[15px] font-medium text-white/70 mb-5 text-center px-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Your journey lives here — every photo tells a story
                </motion.p>

                <motion.button
                  className="px-10 py-3.5 rounded-2xl text-[15px] font-semibold tracking-wide active:scale-[0.97]"
                  style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhase(3);
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
                    Next
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ PHASE 3: Community text (blur bg returns) ═══ */}
          <AnimatePresence mode="wait">
            {phase === 3 && (
              <motion.div
                key="phase3"
                className="relative z-10 flex flex-col items-center justify-center px-10 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4 }}
              >
                <h2
                  className="text-[28px] font-semibold text-white tracking-tight leading-[1.3] mb-2"
                  style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="You're not alone." delay={0.2} />
                </h2>
                <h2
                  className="text-[22px] font-medium tracking-tight leading-[1.3]"
                  style={{ color: 'rgba(255, 255, 255, 0.5)', fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="React. Cheer. Get inspired." delay={0.9} />
                </h2>
                <h2
                  className="text-[18px] font-normal tracking-tight leading-[1.4] mt-2"
                  style={{ color: 'rgba(255, 255, 255, 0.35)', fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="Swipe through your crew's stories." delay={1.6} />
                </h2>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ PHASE 4: Blur faded, highlight top profiles, LOG NOW CTA ═══ */}
          <AnimatePresence>
            {phase === 4 && (
              <motion.div
                key="phase4"
                className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center pb-16"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {/* Pointing to top profiles */}
                <motion.div
                  className="absolute top-0 left-0 right-0 flex justify-center"
                  style={{ top: 'calc(max(env(safe-area-inset-top, 8px), 8px) + 90px)' }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-[14px] font-medium text-white/60 text-center px-6">
                    ↑ Your crew's stories live here
                  </p>
                </motion.div>

                <motion.button
                  className="px-10 py-3.5 rounded-2xl text-[15px] font-semibold tracking-wide active:scale-[0.97]"
                  style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    finish();
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
                    Log Now
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress dots */}
          {(phase <= 3) && (
            <div className="absolute bottom-12 z-20 flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === (phase <= 1 ? phase : phase - 1 + 1) ? 20 : 5,
                    height: 5,
                    background:
                      i === (phase <= 1 ? phase : phase - 1 + 1)
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
