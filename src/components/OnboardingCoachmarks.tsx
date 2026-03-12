import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingCoachmarksProps {
  onComplete: () => void;
}

const STORAGE_KEY = 'ninja10x_onboarding_seen';

/**
 * Cinematic onboarding — large text, slow blur-to-sharp reveal
 * Phase 0: "Your body moves. Capture it." + subtext
 * Phase 1: "3 activities. 4 weeks. Become a Cult Ninja." — pauses
 * Phase 2: Glassmorphic highlight of log card
 */

function RevealWord({
  children,
  delay = 0,
}: {
  children: string;
  delay?: number;
}) {
  return (
    <motion.span
      className="inline-block mr-[0.3em]"
      initial={{ filter: 'blur(24px)', opacity: 0, scale: 1.08 }}
      animate={{ filter: 'blur(0px)', opacity: 1, scale: 1 }}
      transition={{
        duration: 1.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.span>
  );
}

function RevealLine({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <RevealWord key={i} delay={delay + i * 0.45}>
          {word}
        </RevealWord>
      ))}
    </>
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
      // Total reveal time ~8s, then hold 1.5s before advancing
      timerRef.current = setTimeout(() => setPhase(1), 9500);
    }
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
          transition={{ duration: 0.6 }}
        >
          {/* Background: 10% white, fully blurred — NOT blue */}
          <motion.div
            className="absolute inset-0"
            style={{
              backdropFilter: 'blur(60px) saturate(200%)',
              WebkitBackdropFilter: 'blur(60px) saturate(200%)',
              background: isTextPhase
                ? 'rgba(255, 255, 255, 0.10)'
                : 'rgba(255, 255, 255, 0.08)',
            }}
            animate={{
              background: isTextPhase
                ? 'rgba(255, 255, 255, 0.10)'
                : 'rgba(255, 255, 255, 0.08)',
            }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />

          {/* Skip */}
          <motion.button
            className="absolute right-5 z-50 text-[11px] font-medium tracking-[0.12em] uppercase"
            style={{
              top: 'calc(max(env(safe-area-inset-top, 12px), 12px) + 8px)',
              color: 'rgba(255, 255, 255, 0.18)',
            }}
            onClick={(e) => { e.stopPropagation(); finish(); }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
          >
            Skip
          </motion.button>

          {/* ═══ PHASE 0 ═══ */}
          <AnimatePresence mode="wait">
            {phase === 0 && (
              <motion.div
                key="phase0"
                className="relative z-10 flex flex-col items-center justify-center px-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 1.0 } }}
              >
                <h2
                  className="text-[32px] font-semibold text-white tracking-[-0.03em] leading-[1.3]"
                  style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="Your body moves." delay={0.4} />
                  <br />
                  <RevealLine text="Capture it." delay={2.4} />
                </h2>
                <p
                  className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.3] mt-8"
                  style={{
                    color: 'rgba(255, 255, 255, 0.30)',
                    fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif',
                  }}
                >
                  <RevealLine text="Running. Cricket. Yoga." delay={4.2} />
                  <br />
                  <RevealLine text="Whatever moves you." delay={6.2} />
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ PHASE 1 — pauses here ═══ */}
          <AnimatePresence mode="wait">
            {phase === 1 && (
              <motion.div
                key="phase1"
                className="relative z-10 flex flex-col items-center justify-center px-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 1.0 } }}
              >
                <h2
                  className="text-[32px] font-semibold text-white tracking-[-0.03em] leading-[1.3]"
                  style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="3 activities." delay={0.3} />
                  <br />
                  <RevealLine text="4 weeks." delay={1.8} />
                </h2>
                <motion.div
                  className="mt-6"
                  initial={{ filter: 'blur(24px)', opacity: 0, scale: 1.05 }}
                  animate={{ filter: 'blur(0px)', opacity: 1, scale: 1 }}
                  transition={{ duration: 2.0, delay: 3.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span
                    className="text-[32px] font-semibold tracking-[-0.03em]"
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

                {/* CTA — appears after full reveal */}
                <motion.button
                  className="mt-14 px-10 py-3.5 rounded-2xl text-[15px] font-semibold tracking-wide active:scale-[0.97]"
                  style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 6.0, duration: 0.8 }}
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

          {/* ═══ PHASE 2: Highlight log card ═══ */}
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
                <motion.p
                  className="text-[32px] font-semibold text-center px-8 mb-8 tracking-[-0.03em] leading-[1.3]"
                  style={{
                    color: 'rgba(255, 255, 255, 0.35)',
                    fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 1.0 }}
                >
                  This is your canvas.
                  <br />
                  Every workout, framed.
                </motion.p>

                <motion.button
                  className="px-10 py-3.5 rounded-2xl text-[15px] font-semibold tracking-wide active:scale-[0.97]"
                  style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
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

          {/* Progress dots */}
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
