import { motion, useReducedMotion } from "framer-motion";
import { useLayoutEffect, useState } from "react";

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

  useLayoutEffect(() => {
    // Wait a frame so the destination component can paint.
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector(targetSelector) as HTMLElement | null;

      if (el) {
        const r = el.getBoundingClientRect();
        setTarget({ top: r.top, left: r.left, width: r.width, height: r.height });
      }

      const startWidth = Math.min(window.innerWidth * 0.72, 320);
      const startHeight = (startWidth * 16) / 9;
      setFrom({
        left: (window.innerWidth - startWidth) / 2,
        top: (window.innerHeight - startHeight) / 2,
        width: startWidth,
        height: startHeight,
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [targetSelector]);

  if (!from) return null;

  // If target not found, just fade out in place (prevents “invisible” feeling).
  const to =
    target ??
    ({
      top: from.top + 48,
      left: from.left,
      width: from.width,
      height: from.height,
    } satisfies Rect);

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : 0.35 }}
    >
      <motion.div
        className="fixed overflow-hidden rounded-2xl border border-border bg-card/10 backdrop-blur-2xl shadow-lg"
        initial={{ top: from.top, left: from.left, width: from.width, height: from.height, opacity: 1 }}
        animate={{
          top: to.top,
          left: to.left,
          width: to.width,
          height: to.height,
          opacity: 1,
        }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                type: "spring",
                stiffness: 240,
                damping: 28,
                mass: 0.7,
              }
        }
        onAnimationComplete={onComplete}
      >
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </motion.div>
    </motion.div>
  );
}
