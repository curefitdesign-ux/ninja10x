import { useMemo } from 'react';
import { motion } from 'framer-motion';

import startRampImg from '@/assets/progress/start-ramp.png';
import tileActiveImg from '@/assets/progress/tile-active-glow.png';
import tileInactiveImg from '@/assets/progress/tile-inactive-step.png';
import weekCrystalImg from '@/assets/progress/week-crystal.png';
import finalGoalImg from '@/assets/progress/final-goal.png';
import vmanImg from '@/assets/progress/vman.png';
import journeyBgPattern from '@/assets/progress/journey-bg-pattern.png';

interface GamifiedJourneyPathProps {
  completedActivities: number;
}

const PATH_W = 380;
const PATH_H = 543;
const TILE_W = 50;
const TILE_H = 50;

export default function GamifiedJourneyPath({ completedActivities }: GamifiedJourneyPathProps) {
  const tiles = useMemo(() => {
    const STEP_X = 50;
    const STEP_Y = 28;
    const startX = 28;
    const startY = 440;

    const positions: { x: number; y: number; index: number; isWeekEnd: boolean; isFinal: boolean }[] = [];

    let cx = startX;
    let cy = startY;

    for (let i = 0; i < 12; i++) {
      positions.push({
        x: cx,
        y: cy,
        index: i,
        isWeekEnd: (i + 1) % 3 === 0,
        isFinal: i === 11,
      });

      // Move to next position
      if (i < 11) {
        const nextWeek = Math.floor((i + 1) / 3);
        const goingRight = nextWeek % 2 === 0;
        cx += goingRight ? STEP_X : -STEP_X;
        cy -= STEP_Y;
      }
    }

    return positions;
  }, []);

  // Ramp: positioned behind and below tile 0
  const rampX = tiles[0].x - 55;
  const rampY = tiles[0].y - 8;

  // V-man: sits on top of the current tile (or on ramp if 0 completed)
  const vmanTileIdx = completedActivities > 0 ? Math.min(completedActivities - 1, 11) : -1;
  const vmanTile = vmanTileIdx >= 0 ? tiles[vmanTileIdx] : null;
  const vmanX = vmanTile ? vmanTile.x + TILE_W / 2 - 18 : tiles[0].x + TILE_W / 2 - 18;
  const vmanY = vmanTile ? vmanTile.y - 38 : rampY - 28;

  // SVG connecting lines between tiles
  const lines = useMemo(() => {
    const result: { x1: number; y1: number; x2: number; y2: number; active: boolean }[] = [];
    for (let i = 0; i < tiles.length - 1; i++) {
      const from = tiles[i];
      const to = tiles[i + 1];
      result.push({
        x1: from.x + TILE_W / 2,
        y1: from.y + TILE_H / 2,
        x2: to.x + TILE_W / 2,
        y2: to.y + TILE_H / 2,
        active: i < completedActivities - 1,
      });
    }
    return result;
  }, [tiles, completedActivities]);

  return (
    <div className="w-full flex justify-center">
      <div
        className="relative"
        style={{ width: PATH_W, height: PATH_H }}
      >
        {/* Background pattern overlay */}
        <img
          src={journeyBgPattern}
          alt=""
          className="absolute pointer-events-none"
          style={{
            width: PATH_W,
            height: PATH_H,
            left: 0,
            top: 0,
            objectFit: 'contain',
            opacity: 0.12,
            zIndex: 0,
          }}
        />

        {/* SVG connecting lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={PATH_W}
          height={PATH_H}
          style={{ zIndex: 1 }}
        >
          {lines.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.active ? 'rgba(160,120,255,0.5)' : 'rgba(255,255,255,0.1)'}
              strokeWidth={line.active ? 2 : 1.5}
              strokeDasharray={line.active ? 'none' : '5 4'}
            />
          ))}
        </svg>

        {/* Start ramp */}
        <motion.img
          src={startRampImg}
          alt="Start"
          className="absolute pointer-events-none"
          style={{
            width: 180,
            height: 'auto',
            left: rampX,
            top: rampY,
            zIndex: 1,
          }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Tiles + milestones */}
        {tiles.map((tile) => {
          const isActive = tile.index < completedActivities;
          const isCurrent = tile.index === completedActivities - 1;
          const showCrystal = tile.isWeekEnd && !tile.isFinal;
          const showFinalGoal = tile.isFinal;

          return (
            <div key={tile.index}>
              {/* Week crystal milestone */}
              {showCrystal && (
                <motion.img
                  src={weekCrystalImg}
                  alt="Week milestone"
                  className="absolute pointer-events-none"
                  style={{
                    width: 36,
                    height: 'auto',
                    left: tile.x + TILE_W / 2 - 18,
                    top: tile.y - 38,
                    zIndex: 6,
                    opacity: isActive ? 1 : 0.4,
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(100,220,255,0.5))' : 'none',
                  }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: isActive ? 1 : 0.4, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 16, delay: tile.index * 0.03 }}
                />
              )}

              {/* Final goal – treasure chest */}
              {showFinalGoal && (
                <motion.img
                  src={finalGoalImg}
                  alt="Final Goal"
                  className="absolute pointer-events-none"
                  style={{
                    width: 130,
                    height: 'auto',
                    left: tile.x + TILE_W / 2 - 65,
                    top: tile.y - 105,
                    zIndex: 6,
                    opacity: isActive ? 1 : 0.55,
                    filter: isActive ? 'drop-shadow(0 0 14px rgba(255,200,50,0.4))' : 'none',
                  }}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: isActive ? 1 : 0.55, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 14, delay: 0.25 }}
                />
              )}

              {/* Tile */}
              <motion.img
                src={isActive ? tileActiveImg : tileInactiveImg}
                alt={`Day ${tile.index + 1}`}
                className="absolute pointer-events-none"
                style={{
                  width: TILE_W,
                  height: TILE_H,
                  left: tile.x,
                  top: tile.y,
                  zIndex: 3,
                  filter: isCurrent
                    ? 'drop-shadow(0 0 12px rgba(130,100,255,0.6))'
                    : 'none',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.18, delay: tile.index * 0.03 }}
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
            width: 36,
            height: 'auto',
            zIndex: 10,
          }}
          initial={{ opacity: 0, scale: 0.5, left: vmanX, top: vmanY }}
          animate={{ opacity: 1, scale: 1, left: vmanX, top: vmanY }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>
    </div>
  );
}
