import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingCoachmarksProps {
  onComplete: () => void;
}

const STORAGE_KEY = 'ninja10x_onboarding_seen';

/**
 * Cinematic onboarding — 3-phase flow
 * Phase 0: "Your body moves. Capture it." — slow word reveal, auto-advance
 * Phase 1: "3 activities. 4 weeks. Become a Cult Ninja." — pauses, tap to continue
 * Phase 2: Glassmorphic blur overlay, highlight log card, LOG NOW CTA
 */

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
          className="inline-block mr-[0.34em]"
          initial={{ filter: 'blur(18px)', opacity: 0 }}
          animate={{ filter: 'blur(0px)', opacity: 1 }}
          transition={{
            duration: 1.2,
            delay: delay + i * 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

type Phase = 0 | 1 | 2;

export default function OnboardingCoachmarks({ onComplete }: OnboardingCoachmarksProps) {
  const [phase, setPhase] = useState<Phase>(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    } else {
      onComplete();
    }
  }, [onComplete]);

  // Auto-advance only phase 0 → 1
  useEffect(() => {
    if (!visible) return;
    if (phase === 0) {
      timerRef.current = setTimeout(() => setPhase(1), 6500);
    }
    // Phase 1 pauses — user taps to continue
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, visible]);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    setTimeout(onComplete, 400);
  }, [onComplete]);

  if (!visible) return null;

  const isTextPhase = phase === 0 || phase === 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ touchAction: 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Full blur overlay — always on from start */}
          <motion.div
            className="absolute inset-0"
            style={{
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              background: isTextPhase
                ? 'rgba(10, 7, 32, 0.88)'
                : 'rgba(10, 7, 32, 0.72)',
            }}
            animate={{
              background: isTextPhase
                ? 'rgba(10, 7, 32, 0.88)'
                : 'rgba(10, 7, 32, 0.72)',
            }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />

          {/* Skip */}
          <motion.button
            className="absolute right-5 z-50 text-[11px] font-medium tracking-[0.12em] uppercase"
            style={{
              top: 'calc(max(env(safe-area-inset-top, 12px), 12px) + 8px)',
              color: 'rgba(255, 255, 255, 0.15)',
            }}
            onClick={(e) => { e.stopPropagation(); finish(); }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            Skip
          </motion.button>

          {/* ═══ PHASE 0: Opening — one font size ═══ */}
          <AnimatePresence mode="wait">
            {phase === 0 && (
              <motion.div
                key="phase0"
                className="relative z-10 flex flex-col items-center justify-center px-10 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.8 } }}
              >
                <h2
                  className="text-[26px] font-medium text-white tracking-[-0.02em] leading-[1.4]"
                  style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="Your body moves." delay={0.5} />
                  <br />
                  <RevealLine text="Capture it." delay={2.0} />
                </h2>
                <p
                  className="text-[26px] font-medium tracking-[-0.02em] leading-[1.4] mt-6"
                  style={{ color: 'rgba(255, 255, 255, 0.35)', fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="Running. Cricket. Yoga." delay={3.4} />
                  <br />
                  <RevealLine text="Whatever makes you feel alive." delay={4.6} />
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ PHASE 1: The challenge — pauses here ═══ */}
          <AnimatePresence mode="wait">
            {phase === 1 && (
              <motion.div
                key="phase1"
                className="relative z-10 flex flex-col items-center justify-center px-10 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.8 } }}
              >
                <h2
                  className="text-[26px] font-medium text-white tracking-[-0.02em] leading-[1.4]"
                  style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="3 activities. 4 weeks." delay={0.3} />
                </h2>
                <motion.div
                  className="mt-4"
                  initial={{ filter: 'blur(18px)', opacity: 0 }}
                  animate={{ filter: 'blur(0px)', opacity: 1 }}
                  transition={{ duration: 1.4, delay: 2.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span
                    className="text-[26px] font-medium tracking-[-0.02em]"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #F97316, #EC4899)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif',
                    }}
                  >
                    Become a Cult Ninja. 🥷
                  </span>
                </motion.div>

                {/* Tap to continue — appears after text reveals */}
                <motion.button
                  className="mt-12 px-10 py-3.5 rounded-2xl text-[15px] font-semibold tracking-wide active:scale-[0.97]"
                  style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 4.5, duration: 0.7 }}
                  onClick={(e) => { e.stopPropagation(); setPhase(2); }}
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
            )}
          </AnimatePresence>

          {/* ═══ PHASE 2: Highlight log card with glassmorphic overlay ═══ */}
          <AnimatePresence>
            {phase === 2 && (
              <motion.div
                key="phase2"
                className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Hint text */}
                <motion.p
                  className="text-[26px] font-medium text-center px-10 mb-6 tracking-[-0.02em]"
                  style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif',
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  This is your canvas.
                  <br />
                  Every workout, framed.
                </motion.p>

                {/* LOG NOW CTA */}
                <motion.button
                  className="px-10 py-3.5 rounded-2xl text-[15px] font-semibold tracking-wide active:scale-[0.97]"
                  style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  onClick={(e) => { e.stopPropagation(); finish(); }}
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

          {/* Progress dots — only during text phases */}
          {isTextPhase && (
            <div className="absolute bottom-12 z-20 flex items-center gap-1.5">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-700"
                  style={{
                    width: i === phase ? 22 : 5,
                    height: 5,
                    background:
                      i === phase
                        ? 'linear-gradient(90deg, #F97316, #EC4899)'
                        : 'rgba(255, 255, 255, 0.12)',
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
