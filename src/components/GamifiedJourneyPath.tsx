import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import startRampImg from '@/assets/progress/start-ramp.png';
import tileActiveImg from '@/assets/progress/tile-active-glow.png';
import tileInactiveImg from '@/assets/progress/tile-inactive-step.png';
import weekCrystalImg from '@/assets/progress/week-crystal.png';
import finalGoalImg from '@/assets/progress/final-goal.png';
import vmanImg from '@/assets/progress/vman.png';

interface GamifiedJourneyPathProps {
  completedActivities: number;
}

/**
 * 12-tile gamified journey path matching the reference design.
 * Bottom-to-top diagonal zigzag staircase:
 *   Week 1 (tiles 1-3): steps up-right
 *   Week 2 (tiles 4-6): steps up-left
 *   Week 3 (tiles 7-9): steps up-right
 *   Week 4 (tiles 10-12): steps up-left
 * Crystals at every 3rd tile, final goal at tile 12.
 */
export default function GamifiedJourneyPath({ completedActivities }: GamifiedJourneyPathProps) {
  const tileW = 56;
  const tileH = 56;
  const stepX = 48; // horizontal offset per step
  const stepY = 64; // vertical offset per step (going up)

  // Build tile positions bottom-to-top zigzag
  const tiles = useMemo(() => {
    const positions: { x: number; y: number; index: number; isWeekEnd: boolean; isFinal: boolean }[] = [];

    // We place tiles from bottom (y high) to top (y low)
    // Total height: 12 steps * stepY = 768, plus padding
    const baseY = 11 * stepY; // bottom-most tile y
    const centerX = 150; // center reference

    for (let i = 0; i < 12; i++) {
      const week = Math.floor(i / 3); // 0-3
      const posInWeek = i % 3; // 0-2
      const goingRight = week % 2 === 0;

      // Each week starts from where the previous ended
      // Week 0: starts center-left, goes right
      // Week 1: continues from right, goes left
      // Week 2: continues from left, goes right
      // Week 3: continues from right, goes left

      let x: number;
      if (goingRight) {
        // Start from left side of the zigzag
        x = centerX - stepX + posInWeek * stepX;
      } else {
        // Start from right side, go left
        x = centerX + stepX - posInWeek * stepX;
      }

      const y = baseY - i * stepY;

      positions.push({
        x,
        y,
        index: i,
        isWeekEnd: (i + 1) % 3 === 0,
        isFinal: i === 11,
      });
    }

    return positions;
  }, []);

  const totalHeight = 12 * stepY + 120;
  const totalWidth = 320;

  // Start ramp position: below first tile
  const rampX = tiles[0].x - 32;
  const rampY = tiles[0].y + 20;

  // V-man position
  const vmanTile = completedActivities > 0 ? tiles[completedActivities - 1] : null;
  const vmanX = vmanTile ? vmanTile.x + tileW / 2 - 18 : tiles[0].x + tileW / 2 - 18;
  const vmanY = vmanTile ? vmanTile.y - 36 : rampY - 30;

  return (
    <div className="w-full flex justify-center">
      <div
        className="relative"
        style={{ width: totalWidth, height: totalHeight }}
      >
        {/* Connecting path lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: totalWidth, height: totalHeight, zIndex: 0 }}
        >
          {tiles.map((tile, i) => {
            if (i === 0) return null;
            const prev = tiles[i - 1];
            const fromX = prev.x + tileW / 2;
            const fromY = prev.y + tileH / 2;
            const toX = tile.x + tileW / 2;
            const toY = tile.y + tileH / 2;
            const isActive = i < completedActivities;
            return (
              <line
                key={`line-${i}`}
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke={isActive ? 'rgba(160,120,255,0.45)' : 'rgba(255,255,255,0.06)'}
                strokeWidth={isActive ? 2 : 1.5}
                strokeDasharray={isActive ? 'none' : '5 5'}
              />
            );
          })}
        </svg>

        {/* Start ramp */}
        <motion.img
          src={startRampImg}
          alt="Start"
          className="absolute"
          style={{
            width: 120,
            height: 'auto',
            left: rampX,
            top: rampY,
            zIndex: 1,
          }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        />

        {/* Tiles */}
        {tiles.map((tile) => {
          const isActive = tile.index < completedActivities;
          const isCurrent = tile.index === completedActivities - 1;
          const showCrystal = tile.isWeekEnd && isActive && !tile.isFinal;
          const showFinalGoal = tile.isFinal && isActive;

          return (
            <div key={tile.index}>
              {/* Crystal milestone */}
              <AnimatePresence>
                {showCrystal && (
                  <motion.img
                    src={weekCrystalImg}
                    alt="Week Complete"
                    className="absolute"
                    style={{
                      width: 44,
                      height: 'auto',
                      left: tile.x + tileW / 2 - 22,
                      top: tile.y - 48,
                      zIndex: 5,
                    }}
                    initial={{ opacity: 0, y: 8, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  />
                )}
              </AnimatePresence>

              {/* Final goal */}
              <AnimatePresence>
                {showFinalGoal && (
                  <motion.img
                    src={finalGoalImg}
                    alt="Final Goal"
                    className="absolute"
                    style={{
                      width: 80,
                      height: 'auto',
                      left: tile.x + tileW / 2 - 40,
                      top: tile.y - 70,
                      zIndex: 5,
                    }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.2 }}
                  />
                )}
              </AnimatePresence>

              {/* Tile */}
              <motion.img
                src={isActive ? tileActiveImg : tileInactiveImg}
                alt={`Day ${tile.index + 1}`}
                className="absolute"
                style={{
                  width: tileW,
                  height: tileH,
                  left: tile.x,
                  top: tile.y,
                  zIndex: 2,
                  filter: isCurrent
                    ? 'drop-shadow(0 0 14px rgba(140,100,255,0.6))'
                    : 'none',
                }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: tile.index * 0.035 }}
              />

              {/* Day label */}
              <motion.span
                className="absolute text-[8px] font-semibold tracking-widest text-center uppercase"
                style={{
                  left: tile.x,
                  top: tile.y + tileH + 3,
                  width: tileW,
                  color: isActive
                    ? 'rgba(200,180,255,0.85)'
                    : 'rgba(255,255,255,0.2)',
                  zIndex: 3,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: tile.index * 0.035 + 0.15 }}
              >
                Day {tile.index + 1}
              </motion.span>
            </div>
          );
        })}

        {/* V-man avatar */}
        <motion.img
          src={vmanImg}
          alt="You"
          className="absolute"
          style={{
            width: 36,
            height: 'auto',
            zIndex: 10,
          }}
          animate={{ left: vmanX, top: vmanY }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
        />
      </div>
    </div>
  );
}
