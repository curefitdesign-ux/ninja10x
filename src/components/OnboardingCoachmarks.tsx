import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingCoachmarksProps {
  onComplete: () => void;
}

const STORAGE_KEY = 'ninja10x_onboarding_seen';

/**
 * Cinematic onboarding — 5-phase flow, Tobias van Schneider × Apple tone
 * Phase 0: "Your body moves. Capture it." (auto-advance, slow)
 * Phase 1: "3 activities. 4 weeks. Cult Ninja." (auto-advance, slow)
 * Phase 2: Blur fades → highlight first card → NEXT CTA
 * Phase 3: Community text (auto-advance, slow)
 * Phase 4: Blur dims everything except top profile strip → LOG NOW CTA
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
          initial={{ filter: 'blur(14px)', opacity: 0, y: 8 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{
            duration: 0.75,
            delay: delay + i * 0.22,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

type Phase = 0 | 1 | 2 | 3 | 4;

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

  // Auto-advance — slower, more breathing room
  useEffect(() => {
    if (!visible) return;
    if (phase === 0) {
      timerRef.current = setTimeout(() => setPhase(1), 5000);
    } else if (phase === 1) {
      timerRef.current = setTimeout(() => setPhase(2), 5500);
    } else if (phase === 3) {
      timerRef.current = setTimeout(() => setPhase(4), 5000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, visible]);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    setTimeout(onComplete, 400);
  }, [onComplete]);

  if (!visible) return null;

  const showBlur = phase === 0 || phase === 1 || phase === 3;
  // Phase 4: only dim below the top profile strip area
  const showDimOverlay = phase === 2 || phase === 4;

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
          {/* Blur / dim background layer */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(0, 0, 0, 0.93)' }}
            animate={{ opacity: showBlur ? 1 : showDimOverlay ? 0.6 : 0 }}
            transition={{ duration: 1.0, ease: 'easeInOut' }}
          />

          {/* Phase 4: cutout — keep top profile strip visible, blur everything else */}
          {phase === 4 && (
            <>
              {/* Dark overlay below the profile strip */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, transparent 0px, transparent 120px, rgba(0,0,0,0.88) 160px, rgba(0,0,0,0.88) 100%)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </>
          )}

          {/* Skip */}
          <motion.button
            className="absolute right-5 z-50 text-[11px] font-medium tracking-[0.12em] uppercase"
            style={{
              top: 'calc(max(env(safe-area-inset-top, 12px), 12px) + 8px)',
              color: 'rgba(255, 255, 255, 0.2)',
            }}
            onClick={(e) => { e.stopPropagation(); finish(); }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            Skip
          </motion.button>

          {/* ═══ PHASE 0: The hook — van Schneider minimalism ═══ */}
          <AnimatePresence mode="wait">
            {phase === 0 && (
              <motion.div
                key="phase0"
                className="relative z-10 flex flex-col items-center justify-center px-10 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.6 }}
              >
                <h2
                  className="text-[30px] font-semibold text-white tracking-[-0.02em] leading-[1.28]"
                  style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="Your body moves." delay={0.3} />
                </h2>
                <h2
                  className="text-[30px] font-semibold text-white tracking-[-0.02em] leading-[1.28] mt-1"
                  style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="Capture it." delay={1.6} />
                </h2>
                <p
                  className="text-[17px] font-normal tracking-[-0.01em] leading-[1.5] mt-5 max-w-[280px]"
                  style={{ color: 'rgba(255, 255, 255, 0.4)', fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="Running. Cricket. Swimming. Yoga. Whatever makes you feel alive." delay={2.4} />
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ PHASE 1: The challenge ═══ */}
          <AnimatePresence mode="wait">
            {phase === 1 && (
              <motion.div
                key="phase1"
                className="relative z-10 flex flex-col items-center justify-center px-10 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.6 }}
              >
                <h2
                  className="text-[34px] font-bold text-white tracking-[-0.025em] leading-[1.2]"
                  style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="3 activities." delay={0.2} />
                </h2>
                <h2
                  className="text-[34px] font-bold text-white tracking-[-0.025em] leading-[1.2] mt-1"
                  style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="4 weeks." delay={1.2} />
                </h2>
                <motion.div
                  className="mt-4"
                  initial={{ filter: 'blur(16px)', opacity: 0, scale: 0.92 }}
                  animate={{ filter: 'blur(0px)', opacity: 1, scale: 1 }}
                  transition={{ duration: 0.9, delay: 2.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span
                    className="text-[28px] font-semibold tracking-[-0.02em]"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #F97316, #EC4899)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif',
                    }}
                  >
                    Become a Cult Ninja.
                  </span>
                </motion.div>
                <motion.span
                  className="text-[52px] mt-3 block"
                  initial={{ scale: 0, rotate: -25 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 3.2, type: 'spring', stiffness: 160, damping: 14 }}
                >
                  🥷
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ PHASE 2: Card reveal — NEXT CTA ═══ */}
          <AnimatePresence>
            {phase === 2 && (
              <motion.div
                key="phase2"
                className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center pb-16"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <motion.p
                  className="text-[15px] font-medium mb-5 text-center px-8"
                  style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  This is your canvas. Every workout, framed.
                </motion.p>

                <motion.button
                  className="px-10 py-3.5 rounded-2xl text-[15px] font-semibold tracking-wide active:scale-[0.97]"
                  style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                  onClick={(e) => { e.stopPropagation(); setPhase(3); }}
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

          {/* ═══ PHASE 3: Community — van Schneider warmth ═══ */}
          <AnimatePresence mode="wait">
            {phase === 3 && (
              <motion.div
                key="phase3"
                className="relative z-10 flex flex-col items-center justify-center px-10 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.6 }}
              >
                <h2
                  className="text-[30px] font-semibold text-white tracking-[-0.02em] leading-[1.28]"
                  style={{ fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="You don't train alone." delay={0.3} />
                </h2>
                <p
                  className="text-[17px] font-normal tracking-[-0.01em] leading-[1.5] mt-4 max-w-[260px]"
                  style={{ color: 'rgba(255, 255, 255, 0.45)', fontFamily: '-apple-system, SF Pro Display, system-ui, sans-serif' }}
                >
                  <RevealLine text="React to friends. Cheer them on. Get inspired by their sweat." delay={1.4} />
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ PHASE 4: Profile strip highlight — LOG NOW CTA ═══ */}
          <AnimatePresence>
            {phase === 4 && (
              <motion.div
                key="phase4"
                className="absolute inset-x-0 z-10 flex flex-col items-center"
                style={{ bottom: 0, top: 0 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Arrow pointing up to profiles */}
                <motion.div
                  className="flex flex-col items-center"
                  style={{ marginTop: 'calc(max(env(safe-area-inset-top, 8px), 8px) + 110px)' }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <span className="text-[20px] mb-1">↑</span>
                  <p
                    className="text-[14px] font-medium text-center px-6"
                    style={{ color: 'rgba(255, 255, 255, 0.55)' }}
                  >
                    Your crew's stories live here
                  </p>
                </motion.div>

                {/* LOG NOW at bottom */}
                <div className="absolute bottom-16 inset-x-0 flex justify-center">
                  <motion.button
                    className="px-10 py-3.5 rounded-2xl text-[15px] font-semibold tracking-wide active:scale-[0.97]"
                    style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress dots */}
          {phase <= 3 && (
            <div className="absolute bottom-12 z-20 flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => {
                const activeIndex = phase <= 1 ? phase : phase === 2 ? 2 : 3;
                return (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-500"
                    style={{
                      width: i === activeIndex ? 22 : 5,
                      height: 5,
                      background:
                        i === activeIndex
                          ? 'linear-gradient(90deg, #F97316, #EC4899)'
                          : 'rgba(255, 255, 255, 0.12)',
                    }}
                  />
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
