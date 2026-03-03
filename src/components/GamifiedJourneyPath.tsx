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

const PATH_W = 380;
const PATH_H = 543;
const TILE_SIZE = 52;
const STEP_X = 52;   // horizontal distance between tiles
const STEP_Y = 38;   // vertical distance between tiles (going up)

/**
 * 12-tile gamified journey path – pixel-perfect replica of the reference design.
 *
 * Layout (bottom → top, zigzag staircase):
 *   Week 1 (tiles 1-3): steps up-right
 *   Week 2 (tiles 4-6): steps up-left
 *   Week 3 (tiles 7-9): steps up-right
 *   Week 4 (tiles 10-12): steps up-left
 */
export default function GamifiedJourneyPath({ completedActivities }: GamifiedJourneyPathProps) {
  const tiles = useMemo(() => {
    const positions: { x: number; y: number; index: number; isWeekEnd: boolean; isFinal: boolean }[] = [];

    // Anchor: tile 0 sits on the ramp at bottom-left area
    const startX = 118;
    const startY = PATH_H - 120; // bottom area, leaving room for ramp below

    for (let i = 0; i < 12; i++) {
      const week = Math.floor(i / 3); // 0-3
      const posInWeek = i % 3;        // 0-2
      const goingRight = week % 2 === 0;

      // Calculate cumulative position
      // Each tile steps up by STEP_Y and left/right by STEP_X
      // At week boundaries, direction reverses but continues from last position
      let x = startX;
      let y = startY;

      // Walk through each tile to get position
      for (let j = 0; j <= i; j++) {
        if (j === 0) continue; // first tile is at start
        const w = Math.floor(j / 3);
        const right = w % 2 === 0;
        x += right ? STEP_X : -STEP_X;
        y -= STEP_Y;
      }

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

  // Ramp positioned below & behind tile 0
  const rampX = tiles[0].x - 50;
  const rampY = tiles[0].y + 10;

  // V-man sits on top of the current tile
  const vmanTile = completedActivities > 0 ? tiles[Math.min(completedActivities - 1, 11)] : null;
  const vmanX = vmanTile ? vmanTile.x + TILE_SIZE / 2 - 20 : tiles[0].x + TILE_SIZE / 2 - 20;
  const vmanY = vmanTile ? vmanTile.y - 40 : rampY - 30;

  return (
    <div className="w-full flex justify-center">
      <div
        className="relative"
        style={{ width: PATH_W, height: PATH_H }}
      >
        {/* Start ramp – large purple gradient platform */}
        <motion.img
          src={startRampImg}
          alt="Start"
          className="absolute pointer-events-none"
          style={{
            width: 200,
            height: 'auto',
            left: rampX,
            top: rampY,
            zIndex: 1,
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        />

        {/* Tiles */}
        {tiles.map((tile) => {
          const isActive = tile.index < completedActivities;
          const isCurrent = tile.index === completedActivities - 1;
          const showCrystal = tile.isWeekEnd && !tile.isFinal;
          const showFinalGoal = tile.isFinal;

          return (
            <div key={tile.index}>
              {/* Week-end crystal milestone – always shown at week boundaries, glows when active */}
              {showCrystal && (
                <motion.img
                  src={weekCrystalImg}
                  alt="Week milestone"
                  className="absolute pointer-events-none"
                  style={{
                    width: 40,
                    height: 'auto',
                    left: tile.x + TILE_SIZE / 2 - 20,
                    top: tile.y - 42,
                    zIndex: 5,
                    opacity: isActive ? 1 : 0.35,
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(100,220,255,0.5))' : 'none',
                  }}
                  initial={{ opacity: 0, y: 6, scale: 0.6 }}
                  animate={{ opacity: isActive ? 1 : 0.35, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 16, delay: tile.index * 0.04 }}
                />
              )}

              {/* Final goal – treasure chest */}
              {showFinalGoal && (
                <motion.img
                  src={finalGoalImg}
                  alt="Final Goal"
                  className="absolute pointer-events-none"
                  style={{
                    width: 120,
                    height: 'auto',
                    left: tile.x + TILE_SIZE / 2 - 60,
                    top: tile.y - 95,
                    zIndex: 5,
                    opacity: isActive ? 1 : 0.5,
                    filter: isActive ? 'drop-shadow(0 0 12px rgba(255,200,50,0.4))' : 'none',
                  }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: isActive ? 1 : 0.5, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 14, delay: 0.3 }}
                />
              )}

              {/* Tile image */}
              <motion.img
                src={isActive ? tileActiveImg : tileInactiveImg}
                alt={`Day ${tile.index + 1}`}
                className="absolute pointer-events-none"
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  left: tile.x,
                  top: tile.y,
                  zIndex: 2,
                  filter: isCurrent
                    ? 'drop-shadow(0 0 10px rgba(100,200,255,0.5))'
                    : 'none',
                }}
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: tile.index * 0.035 }}
              />
            </div>
          );
        })}

        {/* V-man avatar */}
        <motion.img
          src={vmanImg}
          alt="You"
          className="absolute pointer-events-none"
          style={{
            width: 40,
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
