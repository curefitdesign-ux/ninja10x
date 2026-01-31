import { motion, useReducedMotion } from "framer-motion";
import { useLayoutEffect, useState, useEffect } from "react";

type Rect = { top: number; left: number; width: number; height: number };

interface SharedImageTransitionProps {
  imageUrl: string;
  targetSelector: string;
  onComplete?: () => void;
  zIndex?: number;
}

/**
 * Lightweight shared-element transition:
 * animates a 9:16 image from a centered "hero" rect into the real DOM target rect.
 */
export default function SharedImageTransition({
  imageUrl,
  targetSelector,
  onComplete,
  zIndex = 60,
}: SharedImageTransitionProps) {
  const reduceMotion = useReducedMotion();
  const [target, setTarget] = useState<Rect | null>(null);
  const [from, setFrom] = useState<Rect | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  useLayoutEffect(() => {
    // Start from center of screen (where share sheet card was)
    const startWidth = Math.min(window.innerWidth * 0.72, 280);
    const startHeight = (startWidth * 16) / 9;
    setFrom({
      left: (window.innerWidth - startWidth) / 2,
      top: (window.innerHeight - startHeight) / 2 - 60, // Slightly above center
      width: startWidth,
      height: startHeight,
    });

    // Wait for target element to be rendered
    const findTarget = () => {
      const el = document.querySelector(targetSelector) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        setTarget({ top: r.top, left: r.left, width: r.width, height: r.height });
        return true;
      }
      return false;
    };

    // Try immediately, then retry a few times if needed
    if (!findTarget()) {
      const retryIntervals = [50, 100, 200];
      retryIntervals.forEach((delay) => {
        setTimeout(() => {
          if (!target) findTarget();
        }, delay);
      });
    }
  }, [targetSelector, target]);

  // Complete animation after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onComplete?.();
    }, reduceMotion ? 100 : 500);
    return () => clearTimeout(timer);
  }, [reduceMotion, onComplete]);

  if (!from) return null;

  // If target not found, animate to estimated position (top-left of story strip)
  const to: Rect = target ?? {
    top: 100,
    left: 20,
    width: 72,
    height: 100,
  };

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex }}
      initial={{ opacity: 1 }}
      animate={{ opacity: isAnimating ? 1 : 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
    >
      <motion.div
        className="fixed overflow-hidden rounded-2xl shadow-2xl"
        style={{
          boxShadow: '0 25px 80px rgba(100, 70, 180, 0.4), 0 12px 40px rgba(0,0,0,0.3)',
          border: '2px solid rgba(160, 120, 220, 0.4)',
        }}
        initial={{ 
          top: from.top, 
          left: from.left, 
          width: from.width, 
          height: from.height, 
          opacity: 1,
          borderRadius: 20,
        }}
        animate={{
          top: to.top,
          left: to.left,
          width: to.width,
          height: to.height,
          opacity: 1,
          borderRadius: 14,
        }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.7,
              }
        }
      >
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </motion.div>
    </motion.div>
  );
}
