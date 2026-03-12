import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CircularProgressRing from '@/components/CircularProgressRing';

// Avatar imports for community phase
import avatarBlue from '@/assets/avatars/avatar-blue.png';
import avatarGreen from '@/assets/avatars/avatar-green.png';
import avatarOrange from '@/assets/avatars/avatar-orange.png';
import avatarPink from '@/assets/avatars/avatar-pink.png';
import avatarPurple from '@/assets/avatars/avatar-purple.png';
import avatarRed from '@/assets/avatars/avatar-red.png';
import avatarTeal from '@/assets/avatars/avatar-teal.png';
import avatarYellow from '@/assets/avatars/avatar-yellow.png';

interface OnboardingCoachmarksProps {
  onComplete: () => void;
}

const STORAGE_KEY = 'ninja10x_onboarding_seen';

const COMMUNITY_AVATARS = [
  avatarOrange, avatarPink, avatarBlue, avatarGreen,
  avatarPurple, avatarRed, avatarTeal, avatarYellow,
];

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

type Phase = 0 | 1 | 2 | 3;

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

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    setTimeout(onComplete, 400);
  }, [onComplete]);

  // Auto-advance phases
  useEffect(() => {
    if (!visible) return;
    if (phase === 0) {
      timerRef.current = setTimeout(() => setPhase(1), 9500);
    }
    if (phase === 1) {
      timerRef.current = setTimeout(() => setPhase(3), 8500);
    }
    if (phase === 2) {
      timerRef.current = setTimeout(() => finish(), 8000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, visible, finish]);

  // Elevate the log card above the overlay in phase 3
  useEffect(() => {
    const targetIds = ['reel-log-activity-card', 'log-activity-card'];

    const resetCard = () => {
      targetIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.style.position = '';
          el.style.zIndex = '';
        }
      });
    };

    if (phase !== 3) {
      resetCard();
      return;
    }

    const applyElevation = () => {
      const card = targetIds
        .map((id) => document.getElementById(id))
        .find(Boolean) as HTMLElement | null;

      if (card) {
        card.style.position = 'relative';
        card.style.zIndex = '10001';
      }
    };

    applyElevation();
    const interval = window.setInterval(applyElevation, 120);

    return () => {
      window.clearInterval(interval);
      resetCard();
    };
  }, [phase]);

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
          {/* Background blur for phases 0 & 1 — full uniform blur */}
          {(phase === 0 || phase === 1) && (
            <motion.div
              className="absolute inset-0"
              style={{
                backdropFilter: 'blur(60px) saturate(200%)',
                WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                background: 'rgba(0, 0, 0, 0.15)',
              }}
            />
          )}

          {/* Phase 2: Full blur masked from top — clear at top for profiles, blurred rest */}
          {phase === 2 && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="absolute inset-0" style={{
                backdropFilter: 'blur(50px) saturate(200%)',
                WebkitBackdropFilter: 'blur(50px) saturate(200%)',
                background: 'rgba(0, 0, 0, 0.15)',
                maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 7%, rgba(0,0,0,0.15) 12%, black 20%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 7%, rgba(0,0,0,0.15) 12%, black 20%)',
              }} />
            </motion.div>
          )}

          {/* Phase 3: Vignette blur — heavy at edges, clear in center */}
          {phase === 3 && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="absolute top-0 left-0 right-0 h-[35%]" style={{
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                background: 'rgba(0, 0, 0, 0.18)',
                maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
              }} />
              <div className="absolute bottom-0 left-0 right-0 h-[35%]" style={{
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                background: 'rgba(0, 0, 0, 0.18)',
                maskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
              }} />
              <div className="absolute top-0 bottom-0 left-0 w-[25%]" style={{
                backdropFilter: 'blur(20px) saturate(150%)',
                WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                background: 'rgba(0, 0, 0, 0.12)',
                maskImage: 'linear-gradient(to right, black 30%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, black 30%, transparent 100%)',
              }} />
              <div className="absolute top-0 bottom-0 right-0 w-[25%]" style={{
                backdropFilter: 'blur(20px) saturate(150%)',
                WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                background: 'rgba(0, 0, 0, 0.12)',
                maskImage: 'linear-gradient(to left, black 30%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 100%)',
              }} />
            </motion.div>
          )}

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
                exit={{ opacity: 0, y: -40, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }}
              >
                <h2
                  className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.3]"
                  style={{ color: textColor, fontFamily: fontStack }}
                >
                  <RevealLine text="Every habit starts" delay={0.4} />
                  <br />
                  <RevealLine text="with a single move." delay={2.4} />
                </h2>
                <p
                  className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.3] mt-8"
                  style={{ color: mutedColor, fontFamily: fontStack }}
                >
                  <RevealLine text="Running. Cricket. Yoga." delay={4.2} />
                  <br />
                  <RevealLine text="Pick yours. Show up." delay={6.2} />
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ PHASE 1 — fade in place, no move ═══ */}
          <AnimatePresence mode="wait">
            {phase === 1 && (
              <motion.div
                key="phase1"
                className="relative z-10 flex flex-col items-center justify-center px-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 1.0, ease: 'easeOut' } }}
              >
                <h2
                  className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.3]"
                  style={{ color: textColor, fontFamily: fontStack }}
                >
                  <RevealLine text="Log 3 times a week." delay={0.3} />
                  <br />
                  <RevealLine text="Do it for 4 weeks." delay={2.6} />
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

          {/* ═══ PHASE 2: Community — profiles at top, text centered, LOG NOW CTA ═══ */}
          <AnimatePresence mode="wait">
            {phase === 2 && (
              <motion.div
                key="phase2-community"
                className="absolute inset-0 z-10 flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.8 } }}
              >

                {/* Centered community text */}
                <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                  <h2
                    className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.3]"
                    style={{ color: textColor, fontFamily: fontStack }}
                  >
                    <RevealLine text="You won't walk alone." delay={1.2} />
                  </h2>
                  <p
                    className="text-[32px] font-semibold tracking-[-0.03em] leading-[1.3] mt-6"
                    style={{ color: mutedColor, fontFamily: fontStack }}
                  >
                    <RevealLine text="Cheer each other." delay={3.2} />
                    <br />
                    <RevealLine text="Move together." delay={5.0} />
                  </p>
                </div>

                {/* GOT IT CTA — white with gradient text, moved up */}
                <div className="flex justify-center pb-32">
                  <motion.button
                    className="w-[calc(100%-48px)] rounded-2xl uppercase active:scale-[0.97] flex items-center justify-center"
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 6.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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

          {/* ═══ PHASE 3: Highlight log card — vignette + NEXT CTA ═══ */}
          <AnimatePresence>
            {phase === 3 && (
              <motion.div
                key="phase3"
                className="fixed left-0 right-0 z-[10001] flex justify-center"
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
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
                  onClick={(e) => { e.stopPropagation(); setPhase(2); }}
                  whileTap={{ scale: 0.97 }}
                >
                  NEXT
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress dots — phases 0 & 1 only */}
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
