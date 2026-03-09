import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMorphTransition } from '@/hooks/use-morph-transition';

const MORPH_DURATION = 0.45; // seconds

const MorphTransitionOverlay = () => {
  const navigate = useNavigate();
  const { morphData, clearMorph, isMorphing } = useMorphTransition();
  const [phase, setPhase] = useState<'idle' | 'expanding' | 'navigated'>('idle');
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!morphData || !isMorphing) {
      setPhase('idle');
      hasNavigated.current = false;
      return;
    }

    // Start expansion
    setPhase('expanding');
    hasNavigated.current = false;

    // Navigate after morph completes
    const timer = setTimeout(() => {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        navigate(morphData.targetRoute, { state: morphData.targetState });
        // Keep overlay visible briefly for seamless handoff
        setTimeout(() => {
          setPhase('navigated');
          clearMorph();
        }, 100);
      }
    }, MORPH_DURATION * 1000);

    return () => clearTimeout(timer);
  }, [morphData, isMorphing, navigate, clearMorph]);

  if (!morphData || phase === 'idle') return null;

  const { rect, imageUrl, isVideo } = morphData;

  return (
    <AnimatePresence>
      {phase === 'expanding' && (
        <>
          {/* Background scale-down + blur effect on underlying content */}
          <motion.div
            className="fixed inset-0 z-[998] pointer-events-none"
            initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
            animate={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            transition={{ duration: MORPH_DURATION, ease: [0.32, 0.72, 0, 1] }}
          />

          {/* Morphing card */}
          <motion.div
            className="fixed z-[999] overflow-hidden"
            initial={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              borderRadius: 16,
            }}
            animate={{
              top: 0,
              left: 0,
              width: window.innerWidth,
              height: window.innerHeight,
              borderRadius: 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
          >
            {isVideo ? (
              <video
                src={imageUrl}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MorphTransitionOverlay;
