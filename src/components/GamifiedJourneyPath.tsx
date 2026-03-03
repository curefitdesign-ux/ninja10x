import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import startRampImg from '@/assets/progress/start-ramp.png';
import tileActiveImg from '@/assets/progress/tile-active-glow.png';
import tileInactiveImg from '@/assets/progress/tile-inactive-step.png';
import weekCrystalImg from '@/assets/progress/week-crystal.png';
import finalGoalImg from '@/assets/progress/final-goal.png';
import vmanImg from '@/assets/progress/vman.png';

interface GamifiedJourneyPathProps {
  /** Number of activities completed (0-12) */
  completedActivities: number;
}

/**
 * 12-tile gamified journey path.
 * - Tiles zigzag: odd rows go right, even rows go left (3 tiles per row = 1 week).
 * - V-man sits on the tile matching completedActivities (0 = start ramp).
 * - Every 3rd tile (end of week) shows a crystal milestone above the tile.
 * - Tile 12 shows the final goal instead of a crystal.
 * - Tiles behind V-man are active; ahead are inactive.
 */
export default function GamifiedJourneyPath({ completedActivities }: GamifiedJourneyPathProps) {
  const tileSize = 52;
  const gapX = 18;
  const rowGap = 28;
  const pathWidth = 3 * tileSize + 2 * gapX; // ~192px

  // Build tile positions in a zigzag pattern (4 rows of 3)
  const tiles = useMemo(() => {
    const result: { x: number; y: number; index: number; isWeekEnd: boolean; isFinal: boolean }[] = [];
    for (let row = 0; row < 4; row++) {
      const leftToRight = row % 2 === 0;
      for (let col = 0; col < 3; col++) {
        const actualCol = leftToRight ? col : 2 - col;
        const index = row * 3 + col; // 0-11
        result.push({
          x: actualCol * (tileSize + gapX),
          y: row * (tileSize + rowGap),
          index,
          isWeekEnd: (index + 1) % 3 === 0, // tiles 2,5,8,11
          isFinal: index === 11,
        });
      }
    }
    return result;
  }, []);

  // Start ramp position: above the first tile, offset to the left
  const startRampX = -30;
  const startRampY = -65;

  // V-man position
  const vmanTile = completedActivities > 0 ? tiles[completedActivities - 1] : null;
  const vmanX = vmanTile ? vmanTile.x + tileSize / 2 - 16 : tiles[0].x + tileSize / 2 - 16; // center 32px vman
  const vmanY = vmanTile ? vmanTile.y - 38 : startRampY - 10;
  const showVmanOnStart = completedActivities === 0;

  const totalHeight = 3 * (tileSize + rowGap) + tileSize + 60; // extra space for crystal/goal above last row

  return (
    <div className="w-full flex justify-center">
      <div
        className="relative"
        style={{ width: pathWidth, height: totalHeight + 80 }}
      >
        {/* Start ramp - always visible */}
        <motion.img
          src={startRampImg}
          alt="Start"
          className="absolute"
          style={{
            width: 120,
            height: 'auto',
            left: startRampX,
            top: startRampY,
            zIndex: 1,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        />

        {/* Connecting path lines between tiles */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: pathWidth, height: totalHeight + 80, zIndex: 0 }}
        >
          {tiles.map((tile, i) => {
            if (i === 0) return null;
            const prev = tiles[i - 1];
            const fromX = prev.x + tileSize / 2;
            const fromY = prev.y + tileSize / 2;
            const toX = tile.x + tileSize / 2;
            const toY = tile.y + tileSize / 2;
            const isActive = i < completedActivities;
            return (
              <line
                key={`line-${i}`}
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke={isActive ? 'rgba(160,120,255,0.5)' : 'rgba(255,255,255,0.08)'}
                strokeWidth={isActive ? 2.5 : 1.5}
                strokeDasharray={isActive ? 'none' : '4 4'}
              />
            );
          })}
        </svg>

        {/* Tiles */}
        {tiles.map((tile) => {
          const isActive = tile.index < completedActivities;
          const isCurrent = tile.index === completedActivities - 1;
          const showCrystal = tile.isWeekEnd && isActive && !tile.isFinal;
          const showFinalGoal = tile.isFinal && isActive;

          return (
            <div key={tile.index}>
              {/* Crystal milestone above week-end tiles */}
              <AnimatePresence>
                {showCrystal && (
                  <motion.img
                    src={weekCrystalImg}
                    alt="Week Complete"
                    className="absolute"
                    style={{
                      width: 48,
                      height: 'auto',
                      left: tile.x + tileSize / 2 - 24,
                      top: tile.y - 52,
                      zIndex: 5,
                    }}
                    initial={{ opacity: 0, y: 10, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  />
                )}
              </AnimatePresence>

              {/* Final goal on tile 12 */}
              <AnimatePresence>
                {showFinalGoal && (
                  <motion.img
                    src={finalGoalImg}
                    alt="Final Goal"
                    className="absolute"
                    style={{
                      width: 72,
                      height: 'auto',
                      left: tile.x + tileSize / 2 - 36,
                      top: tile.y - 60,
                      zIndex: 5,
                    }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.2 }}
                  />
                )}
              </AnimatePresence>

              {/* Tile image */}
              <motion.img
                src={isActive ? tileActiveImg : tileInactiveImg}
                alt={`Tile ${tile.index + 1}`}
                className="absolute"
                style={{
                  width: tileSize,
                  height: tileSize,
                  left: tile.x,
                  top: tile.y,
                  zIndex: 2,
                  filter: isCurrent ? 'drop-shadow(0 0 12px rgba(140,100,255,0.7))' : 'none',
                }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: tile.index * 0.04 }}
              />

              {/* Day number label */}
              <motion.span
                className="absolute text-[9px] font-bold tracking-wider text-center"
                style={{
                  left: tile.x,
                  top: tile.y + tileSize + 4,
                  width: tileSize,
                  color: isActive ? 'rgba(200,180,255,0.9)' : 'rgba(255,255,255,0.25)',
                  zIndex: 3,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: tile.index * 0.04 + 0.2 }}
              >
                DAY {tile.index + 1}
              </motion.span>
            </div>
          );
        })}

        {/* V-man */}
        <motion.img
          src={vmanImg}
          alt="You"
          className="absolute"
          style={{
            width: 32,
            height: 'auto',
            zIndex: 10,
          }}
          animate={{
            left: vmanX,
            top: vmanY,
          }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
        />
      </div>
    </div>
  );
}
