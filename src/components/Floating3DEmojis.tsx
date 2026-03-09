import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { ReactionType } from '@/services/journey-service';
import { ALL_REACTION_IMAGES } from '@/lib/reaction-images';

interface Floating3DEmojisProps {
  reactions: ReactionType[];
  newReaction: ReactionType | null;
  isPaused?: boolean;
}

const EMOJI_ASSETS = ALL_REACTION_IMAGES;


interface FloatingBubble {
  id: number;
  type: ReactionType;
  x: number;       // % from left (10-90)
  size: number;     // px
  duration: number; // seconds for full rise
  delay: number;    // stagger delay
  drift: number;    // horizontal sway amplitude px
  rotateStart: number;
  rotateEnd: number;
  opacity: number;
}

function generateBubbles(reactions: ReactionType[], seed: number): FloatingBubble[] {
  const count = Math.min(reactions.length, 8);
  const bubbles: FloatingBubble[] = [];
  
  for (let i = 0; i < count; i++) {
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 10000) / 10000;
    };
    
    bubbles.push({
      id: i,
      type: reactions[i],
      x: 8 + rand() * 84,
      size: 32 + rand() * 16,
      duration: 6 + rand() * 4,
      delay: i * 0.6 + rand() * 0.8,
      drift: 12 + rand() * 20,
      rotateStart: -15 + rand() * 30,
      rotateEnd: -10 + rand() * 20,
      opacity: 0.55 + rand() * 0.35,
    });
  }
  return bubbles;
}

export default function Floating3DEmojis({ reactions, newReaction, isPaused = false }: Floating3DEmojisProps) {
  // Regenerate bubbles when reaction list changes
  const bubbles = useMemo(
    () => generateBubbles(reactions, reactions.length * 7919 + Date.now() % 10000),
    [reactions.join(',')]
  );

  return (
    <>
      {/* Continuous gentle bottom-to-top floating bubbles */}
      {bubbles.map((b) => {
        const asset = EMOJI_ASSETS[b.type];
        
        return (
          <motion.div
            key={`float-${b.id}-${b.type}`}
            className="absolute pointer-events-none"
            style={{
              left: `${b.x}%`,
              bottom: -50,
              width: b.size,
              height: b.size,
              zIndex: 50,
            }}
            initial={{ y: 0, opacity: 0, scale: 0.3 }}
            animate={isPaused ? { y: 0, opacity: b.opacity * 0.5 } : {
              y: [0, -300, -600],
              opacity: [0, b.opacity, 0],
              scale: [0.4, 1, 0.6],
              x: [0, b.drift, -b.drift * 0.5],
              rotate: [b.rotateStart, b.rotateEnd, b.rotateStart],
            }}
            transition={{
              duration: b.duration,
              delay: b.delay,
              repeat: Infinity,
              repeatDelay: 1.5 + b.delay * 0.3,
              ease: 'easeOut',
              y: { duration: b.duration, ease: [0.25, 0.46, 0.45, 0.94] },
              opacity: { duration: b.duration, times: [0, 0.15, 0.85] },
              x: { duration: b.duration, ease: 'easeInOut' },
            }}
          >
            <img
              src={asset}
              alt={b.type}
              className="w-full h-full object-contain"
              style={{
                filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))',
              }}
            />
          </motion.div>
        );
      })}

      {/* New reaction burst — rises from bottom center */}
      <AnimatePresence>
        {newReaction && (
          <motion.div
            className="absolute left-1/2 bottom-[15%] -translate-x-1/2 pointer-events-none"
            style={{ zIndex: 60 }}
            initial={{ scale: 0, opacity: 1, y: 0 }}
            animate={{
              scale: [0, 1.6, 1.2, 0.8],
              opacity: [1, 1, 0.8, 0],
              y: [0, -120, -200, -280],
              rotate: [0, -10, 5, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={EMOJI_ASSETS[newReaction]}
              alt={newReaction}
              className="w-20 h-20 object-contain"
              style={{ filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5))' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
