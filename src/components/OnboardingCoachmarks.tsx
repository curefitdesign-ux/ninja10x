import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CircularProgressRing from '@/components/CircularProgressRing';

interface OnboardingCoachmarksProps {
  onComplete: () => void;
}

const STORAGE_KEY = 'ninja10x_onboarding_seen';

const RevealWord = memo(function RevealWord({
  children,
  delay = 0,
}: {
  children: string;
  delay?: number;
}) {
  return (
    <motion.span
      className="inline-block mr-[0.3em]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.span>
  );
});

function RevealLine({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <RevealWord key={`${text}-${i}`} delay={delay + i * 0.25}>
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
  const [ringDay, setRingDay] = useState(0);
  const ringTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    setTimeout(onComplete, 400);
  }, [onComplete]);

  useEffect(() => {
    if (!visible) return;
    if (phase === 0) {
      timerRef.current = setTimeout(() => setPhase(1), 8000);
    }
    if (phase === 2) {
      timerRef.current = setTimeout(() => finish(), 12000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, visible, finish]);

  // Animate ring bars starting immediately with phase 1 (parallel with text)
  useEffect(() => {
    if (phase !== 1) {
      setRingDay(0);
      ringTimersRef.current.forEach(clearTimeout);
      ringTimersRef.current = [];
      return;
    }
    // Start ring immediately (delay 0 for first bar) so it loads in parallel with text
    const schedule = [
      { day: 1, ms: 200 },
      { day: 2, ms: 600 },
      { day: 3, ms: 1000 },
      { day: 4, ms: 1800 },
      { day: 5, ms: 2100 },
      { day: 6, ms: 2400 },
      { day: 7, ms: 2700 },
      { day: 8, ms: 3000 },
      { day: 9, ms: 3300 },
      { day: 10, ms: 3600 },
      { day: 11, ms: 3900 },
      { day: 12, ms: 4200 },
    ];
    const timers = schedule.map(({ day, ms }) =>
      setTimeout(() => setRingDay(day), ms)
    );
    ringTimersRef.current = timers;
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  if (!visible) return null;

  const textColor = 'rgba(255, 255, 255, 0.80)';
  const mutedColor = 'rgba(255, 255, 255, 0.35)';
  const fontStack = '-apple-system, SF Pro Display, system-ui, sans-serif';

  // Shared cross-fade variants — no mode="wait" so no gap
  const fadeVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
    exit: { opacity: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[10000]"
          style={{ touchAction: 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Ambient gradient behind the blur */}
          <motion.div
            className="absolute inset-0 z-[0]"
            style={{
              background: 'radial-gradient(ellipse at 30% 20%, hsla(200, 25%, 35%, 0.6) 0%, transparent 50%), radial-gradient(ellipse at 70% 15%, hsla(260, 40%, 25%, 0.7) 0%, transparent 45%), radial-gradient(ellipse at 20% 60%, hsla(15, 30%, 35%, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, hsla(270, 30%, 30%, 0.5) 0%, transparent 50%), radial-gradient(ellipse at 50% 90%, hsla(240, 20%, 20%, 0.6) 0%, transparent 50%), linear-gradient(160deg, hsl(215, 30%, 18%) 0%, hsl(250, 35%, 15%) 30%, hsl(270, 25%, 20%) 60%, hsl(220, 30%, 15%) 100%)',
            }}
            initial={{ top: 0, borderRadius: '0px' }}
            animate={{
              top: phase === 2 ? '18%' : 0,
              borderRadius: phase === 2 ? '24px 24px 0px 0px' : '0px',
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Liquid glass background — slides down 7% on phase 2 to reveal top */}
          <motion.div
            className="absolute inset-0 z-[1]"
            style={{
              background: 'rgba(255, 255, 255, 0.01)',
              backdropFilter: 'blur(60px) saturate(180%)',
              WebkitBackdropFilter: 'blur(60px) saturate(180%)',
            }}
            initial={{ top: 0, borderRadius: '0px' }}
            animate={{
              top: phase === 2 ? '18%' : 0,
              borderRadius: phase === 2 ? '24px 24px 0px 0px' : '0px',
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Hand-drawn arrow now inside phase 2 content below */}

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

          {/* Content — crossfade (no mode="wait") */}
          <AnimatePresence>
            {/* ═══ PHASE 0 ═══ */}
            {phase === 0 && (
              <motion.div
                key="phase0"
                className="absolute inset-0 z-10 flex items-center justify-center px-8 text-center"
                variants={fadeVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div>
                  <h2
                    className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.3]"
                    style={{ color: textColor, fontFamily: fontStack }}
                  >
                    <RevealLine text="Every habit starts" delay={0.3} />
                    <br />
                    <RevealLine text="with a single move." delay={1.8} />
                  </h2>
                  <p
                    className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.3] mt-8"
                    style={{ color: mutedColor, fontFamily: fontStack }}
                  >
                    <RevealLine text="Snap a photo or video." delay={3.2} />
                    <br />
                    <RevealLine text="That's your log. Done." delay={4.8} />
                  </p>
                </div>
              </motion.div>
            )}

            {/* ═══ PHASE 1 ═══ */}
            {phase === 1 && (
              <motion.div
                key="phase1"
                className="absolute inset-0 z-10 flex flex-col items-center"
                variants={fadeVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {/* Centered content */}
                <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                  {/* Ring — no separate animation, inherits parent fade */}
                  <div className="mb-4">
                    <CircularProgressRing
                      currentDay={ringDay}
                      currentWeek={Math.min(Math.floor((ringDay > 0 ? ringDay - 1 : 0) / 3) + 1, 4)}
                      hideDecorations
                    />
                  </div>

                  <h2
                    className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.3]"
                    style={{ color: textColor, fontFamily: fontStack }}
                  >
                    <RevealLine text="Log 3 times a week." delay={0.3} />
                    <br />
                    <RevealLine text="Do it for 4 weeks." delay={2.4} />
                  </h2>

                  <motion.div
                    className="mt-5"
                    initial={{ opacity: 0, transform: 'scale(1.04)' }}
                    animate={{ opacity: 1, transform: 'scale(1)' }}
                    transition={{ duration: 1.6, delay: 4.6, ease: [0.16, 1, 0.3, 1] }}
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

                  {/* NEXT CTA — directly below content */}
                  <motion.button
                    className="mt-10 w-[260px] rounded-2xl uppercase"
                    style={{
                      height: 44,
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow:
                        'inset 0 1px 1px rgba(255, 255, 255, 0.12), 0 4px 20px rgba(0, 0, 0, 0.15)',
                      color: 'rgba(255, 255, 255, 0.90)',
                    }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 5.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    onClick={(e) => { e.stopPropagation(); setPhase(2); }}
                    whileTap={{ scale: 0.97 }}
                  >
                    NEXT
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ═══ PHASE 2: Community ═══ */}
            {phase === 2 && (
              <motion.div
                key="phase2"
                className="absolute inset-0 z-10 flex flex-col items-center"
                variants={fadeVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                  {/* Small hand-drawn arrow pointing up — above text */}
                  <motion.div
                    className="mb-5"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 5.0, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <motion.svg
                      width="24"
                      height="32"
                      viewBox="0 0 48 64"
                      fill="none"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <motion.path
                        d="M24 58 C23 50, 25 42, 24 34 C23 26, 25 18, 24 12"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 5.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                      <motion.path
                        d="M16 20 C18 16, 21 10, 24 6 C27 10, 30 16, 32 20"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 5.6, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </motion.svg>
                  </motion.div>

                  <h2
                    className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.3]"
                    style={{ color: textColor, fontFamily: fontStack }}
                  >
                    <RevealLine text="You won't walk alone." delay={1.0} />
                  </h2>
                  <p
                    className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.3] mt-6"
                    style={{ color: mutedColor, fontFamily: fontStack }}
                  >
                    <RevealLine text="Cheer each other." delay={2.8} />
                    <br />
                    <RevealLine text="Move together." delay={4.4} />
                  </p>

                  {/* GOT IT CTA */}
                  <motion.button
                    className="mt-10 w-[260px] rounded-2xl uppercase flex items-center justify-center"
                    style={{
                      height: 44,
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
                      background: '#FFFFFF',
                      border: 'none',
                      boxShadow: '0 8px 32px rgba(255, 255, 255, 0.15)',
                    }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 5.8, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    onClick={(e) => { e.stopPropagation(); finish(); }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span style={{
                      backgroundImage: 'linear-gradient(135deg, #F97316, #EC4899)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      GOT IT
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress dots */}
          {(phase === 0 || phase === 1) && (
            <div className="absolute bottom-12 left-0 right-0 z-20 flex items-center justify-center gap-1.5">
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
