import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactionType } from '@/services/journey-service';

// 3D reaction assets
import clapImg from '@/assets/reactions/clap-hands.png';
import fireImg from '@/assets/reactions/fire-new.png';
import fistbumpImg from '@/assets/reactions/fistbump-hands.png';
import wowImg from '@/assets/reactions/wow.png';
import flexImg from '@/assets/reactions/flex.png';
import trophyImg from '@/assets/reactions/dumbbells.png';
import runnerImg from '@/assets/reactions/runner.png';
import energyImg from '@/assets/reactions/energy.png';
import timerImg from '@/assets/reactions/stopwatch.png';
import heartImg from '@/assets/reactions/heart-workout.png';

const EMOJI_ASSETS: Record<ReactionType, string> = {
  heart: heartImg,
  fire: fireImg,
  clap: clapImg,
  fistbump: fistbumpImg,
  wow: wowImg,
  flex: flexImg,
  trophy: trophyImg,
  runner: runnerImg,
  energy: energyImg,
  timer: timerImg,
};

interface EmojiParticle {
  id: number;
  type: ReactionType;
  x: number; // % from left
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  opacity: number;
}

interface StoryEmojiRainProps {
  /** Trigger key — changes trigger a new burst */
  triggerKey: string;
  /** Reaction types that exist on this story */
  reactions: ReactionType[];
  /** Whether to show the effect */
  active: boolean;
}

/**
 * iMessage-style emoji rain that plays once when a story loads.
 * Emojis gently fall from top to bottom with soft physics.
 */
export default function StoryEmojiRain({ triggerKey, reactions, active }: StoryEmojiRainProps) {
  const [particles, setParticles] = useState<EmojiParticle[]>([]);

  // Generate particles when triggerKey changes and we have reactions
  useEffect(() => {
    if (!active || reactions.length === 0) {
      setParticles([]);
      return;
    }

    // Generate 6-10 particles based on reaction count
    const count = Math.min(Math.max(reactions.length * 2, 6), 10);
    const newParticles: EmojiParticle[] = [];

    for (let i = 0; i < count; i++) {
      const reactionType = reactions[i % reactions.length];
      newParticles.push({
        id: Date.now() + i,
        type: reactionType,
        x: 8 + Math.random() * 84, // 8-92% from left
        delay: i * 0.12 + Math.random() * 0.2,
        duration: 2.2 + Math.random() * 1.0,
        size: 20 + Math.random() * 14, // 20-34px
        rotation: -30 + Math.random() * 60,
        opacity: 0.25 + Math.random() * 0.25, // subtle: 0.25-0.5
      });
    }

    setParticles(newParticles);

    // Clear after animation completes
    const timer = setTimeout(() => setParticles([]), 4000);
    return () => clearTimeout(timer);
  }, [triggerKey, active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 rounded-2xl">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: -40,
              width: p.size,
              height: p.size,
            }}
            initial={{
              y: -40,
              opacity: 0,
              rotate: p.rotation - 20,
              scale: 0.6,
            }}
            animate={{
              y: [0, 200, 500],
              opacity: [0, p.opacity, 0],
              rotate: [p.rotation - 15, p.rotation + 15, p.rotation],
              scale: [0.6, 1, 0.7],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: [0.25, 0.46, 0.45, 0.94],
              y: { duration: p.duration, ease: 'easeIn' },
              opacity: { duration: p.duration, times: [0, 0.2, 1] },
            }}
          >
            <img
              src={EMOJI_ASSETS[p.type]}
              alt=""
              className="w-full h-full object-contain"
              style={{
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3)) blur(0.5px)',
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
