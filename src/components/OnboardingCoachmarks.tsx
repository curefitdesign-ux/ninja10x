import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingCoachmarksProps {
  onComplete: () => void;
}

const STORAGE_KEY = 'ninja10x_onboarding_seen';

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

  // Auto-advance phase 0 → 1
  useEffect(() => {
    if (!visible) return;
    if (phase === 0) {
      timerRef.current = setTimeout(() => setPhase(1), 9500);
    }
    // Auto-advance phase 1 → 2 after text reveals
    if (phase === 1) {
      timerRef.current = setTimeout(() => setPhase(2), 8500);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, visible]);

  // Elevate the log card above the overlay in phase 2
  useEffect(() => {
    const card = document.getElementById('log-activity-card');
    if (!card) return;
    if (phase === 2) {
      card.style.position = 'relative';
      card.style.zIndex = '10001';
    } else {
      card.style.position = '';
      card.style.zIndex = '';
    }
    return () => {
      if (card) {
        card.style.position = '';
        card.style.zIndex = '';
      }
    };
  }, [phase]);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    setTimeout(onComplete, 400);
  }, [onComplete]);

  if (!visible) return null;

  const textColor = 'rgba(255, 255, 255, 0.80)';
  const mutedColor = 'rgba(255, 255, 255, 0.35)';
  const fontStack = '-apple-system, SF Pro Display, system-ui, sans-serif';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center"
          style={{ touchAction: 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Background: translucent blur — no white tint */}
          <motion.div
            className="absolute inset-0"
            style={{
              backdropFilter: 'blur(60px) saturate(200%)',
              WebkitBackdropFilter: 'blur(60px) saturate(200%)',
              background: 'rgba(0, 0, 0, 0.15)',
            }}
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
                  className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.3]"
                  style={{ color: textColor, fontFamily: fontStack }}
                >
                  <RevealLine text="Your body moves." delay={0.4} />
                  <br />
                  <RevealLine text="Capture it." delay={2.4} />
                </h2>
                <p
                  className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.3] mt-8"
                  style={{ color: mutedColor, fontFamily: fontStack }}
                >
                  <RevealLine text="Running. Cricket. Yoga." delay={4.2} />
                  <br />
                  <RevealLine text="Whatever moves you." delay={6.2} />
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ PHASE 1 — auto-advances to phase 2 ═══ */}
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
                  className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.3]"
                  style={{ color: textColor, fontFamily: fontStack }}
                >
                  <RevealLine text="3 workouts a week." delay={0.3} />
                  <br />
                  <RevealLine text="4 weeks straight." delay={2.6} />
                </h2>
                <motion.div
                  className="mt-6"
                  initial={{ filter: 'blur(24px)', opacity: 0, scale: 1.05 }}
                  animate={{ filter: 'blur(0px)', opacity: 1, scale: 1 }}
                  transition={{ duration: 2.0, delay: 4.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span
                    className="text-[32px] font-semibold tracking-[-0.03em]"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #F97316, #EC4899)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontFamily: fontStack,
                    }}
                  >
                    Become a Ninja. 🥷
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ PHASE 2: Highlight log card — no text, just CTA ═══ */}
          <AnimatePresence>
            {phase === 2 && (
              <motion.div
                key="phase2"
                className="fixed left-0 right-0 z-[10001] flex justify-center"
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Glassmorphic "NEXT" CTA */}
                <motion.button
                  className="w-[calc(100%-48px)] rounded-2xl uppercase active:scale-[0.97]"
                  style={{
                    height: 40,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    boxShadow:
                      'inset 0 1px 1px rgba(255, 255, 255, 0.15), inset 0 -1px 1px rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.2)',
                    color: 'rgba(255, 255, 255, 0.90)',
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => { e.stopPropagation(); finish(); }}
                  whileTap={{ scale: 0.97 }}
                >
                  NEXT
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress dots — text phases only */}
          {(phase === 0 || phase === 1) && (
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
