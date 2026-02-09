import { useEffect, useState } from 'react';
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
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  opacity: number;
  drift: number;
}

interface StoryEmojiRainProps {
  triggerKey: string;
  reactions: ReactionType[];
  active: boolean;
}

/**
 * Subtle bottom-to-top emoji rise when a story loads.
 * Emojis gently float upward with soft sway physics.
 */
export default function StoryEmojiRain({ triggerKey, reactions, active }: StoryEmojiRainProps) {
  const [particles, setParticles] = useState<EmojiParticle[]>([]);

  useEffect(() => {
    if (!active || reactions.length === 0) {
      setParticles([]);
      return;
    }

    const count = Math.min(Math.max(reactions.length * 2, 6), 10);
    const newParticles: EmojiParticle[] = [];

    for (let i = 0; i < count; i++) {
      const reactionType = reactions[i % reactions.length];
      newParticles.push({
        id: Date.now() + i,
        type: reactionType,
        x: 6 + Math.random() * 88,
        delay: i * 0.15 + Math.random() * 0.25,
        duration: 2.5 + Math.random() * 1.2,
        size: 22 + Math.random() * 14,
        rotation: -25 + Math.random() * 50,
        opacity: 0.3 + Math.random() * 0.3,
        drift: -18 + Math.random() * 36,
      });
    }

    setParticles(newParticles);

    const timer = setTimeout(() => setParticles([]), 5000);
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
              bottom: -40,
              width: p.size,
              height: p.size,
            }}
            initial={{
              y: 0,
              opacity: 0,
              rotate: p.rotation - 15,
              scale: 0.4,
            }}
            animate={{
              y: [0, -250, -550],
              opacity: [0, p.opacity, 0],
              rotate: [p.rotation - 10, p.rotation + 10, p.rotation],
              scale: [0.5, 1, 0.6],
              x: [0, p.drift, p.drift * -0.5],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: [0.25, 0.46, 0.45, 0.94],
              y: { duration: p.duration, ease: 'easeOut' },
              opacity: { duration: p.duration, times: [0, 0.2, 0.9] },
              x: { duration: p.duration, ease: 'easeInOut' },
            }}
          >
            <img
              src={EMOJI_ASSETS[p.type]}
              alt=""
              className="w-full h-full object-contain"
              style={{
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))',
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
