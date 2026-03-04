import { useMemo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import startRampImg from '@/assets/progress/start-ramp-new.png';

import tileActiveImg from '@/assets/progress/tile-active-glow.png';
import tileInactiveImg from '@/assets/progress/tile-inactive-step.png';
import crystal5Img from '@/assets/progress/crystal-5.png';
import finalGoalImg from '@/assets/progress/final-goal.png';
import vmanImg from '@/assets/progress/vman.png';
import journeyBgPattern from '@/assets/progress/journey-bg-pattern.png';
import level1Img from '@/assets/progress/level-1.png';
import level2Img from '@/assets/progress/level-2.png';
import level3Img from '@/assets/progress/level-3.png';
import level4Img from '@/assets/progress/level-4.png';

interface GamifiedJourneyPathProps {
  completedActivities: number;
  onCrystalTap?: (weekNum: number) => void;
}

const PATH_W = 380;
const PATH_H = 543;
const TILE_W = 50;
const TILE_H = 50;

const GamifiedJourneyPath = forwardRef<HTMLDivElement, GamifiedJourneyPathProps>(function GamifiedJourneyPath({ completedActivities, onCrystalTap }, ref) {
  const tiles = useMemo(() => {
    const STEP_X = 50;
    const STEP_Y = 28;
    const startX = 148;
    const startY = 390;

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
        const stepX = nextWeek === 3 ? STEP_X - 10 : STEP_X;
        cx += goingRight ? stepX : -stepX;
        cy -= STEP_Y;
      }
    }

    return positions;
  }, []);

  // Ramp: positioned behind and below tile 0
  const rampX = tiles[0].x - 45;
  const rampY = tiles[0].y - 8;

  // V-man: sits on top of the current tile (or on ramp if 0 completed)
  const vmanTileIdx = completedActivities > 0 ? Math.min(completedActivities - 1, 11) : -1;
  const vmanTile = vmanTileIdx >= 0 ? tiles[vmanTileIdx] : null;
  const vmanX = vmanTile ? vmanTile.x + TILE_W / 2 - 18 : tiles[0].x + TILE_W / 2 - 18;
  const vmanY = vmanTile ? vmanTile.y - 22 : rampY - 14;

  // Lines removed per user request
  return (
    <div className="w-full flex justify-center" ref={ref}>
      <div
        className="relative overflow-hidden"
        style={{ width: PATH_W, height: PATH_H }}
      >
        {/* Background pattern overlay */}

        {/* Start ramp – bottom left */}
        <img
          src={startRampImg}
          alt=""
          className="absolute pointer-events-none"
          style={{
            width: 205,
            height: 'auto',
            left: -60,
            bottom: -145,
            zIndex: 0,
            opacity: 0.9,
          }}
        />


        {/* Tiles + milestones */}
        {tiles.map((tile) => {
          const isActive = tile.index < completedActivities;
          const isCurrent = tile.index === completedActivities - 1;
          const isWeekEnd = tile.isWeekEnd;
          const showFinalGoal = tile.isFinal;

          return (
            <div key={tile.index}>
              {/* Final goal – treasure chest */}
              {showFinalGoal && (
                <motion.img
                  src={finalGoalImg}
                  alt="Final Goal"
                  className="absolute pointer-events-none"
                  style={{
                    width: 100,
                    height: 'auto',
                    left: tile.x + TILE_W / 2 - 90,
                    top: tile.y - 85,
                    zIndex: 6,
                    opacity: isActive ? 1 : 0.85,
                    filter: isActive ? 'drop-shadow(0 0 14px rgba(255,200,50,0.4))' : 'none',
                  }}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: isActive ? 1 : 0.85, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 14, delay: 0.25 }}
                />
              )}

              {/* Tile: use crystal for every 3rd activity (week-end), normal tile otherwise */}
              {isWeekEnd && !showFinalGoal ? (
                <>
                  {/* Base tile matching inactive/active style */}
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
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.18, delay: tile.index * 0.03 }}
                  />
                  {/* Diamond floating above the tile — tappable */}
                  <motion.img
                    src={crystal5Img}
                    alt={`Week milestone`}
                    className="absolute cursor-pointer"
                    style={{
                      width: 36,
                      height: 'auto',
                      left: tile.x + TILE_W / 2 - 18,
                      top: tile.y - 28,
                      zIndex: 5,
                      filter: isActive
                        ? 'drop-shadow(0 0 10px rgba(100,220,255,0.6))'
                        : 'none',
                    }}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 16, delay: tile.index * 0.03 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                      const weekNum = Math.floor(tile.index / 3) + 1;
                      onCrystalTap?.(weekNum);
                    }}
                  />
                </>
              ) : (
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
                    opacity: 1,
                    filter: isCurrent
                      ? 'drop-shadow(0 0 12px rgba(130,100,255,0.6))'
                      : 'none',
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.18, delay: tile.index * 0.03 }}
                />
              )}
            </div>
          );
        })}

        {/* Level labels */}
        {[
          { img: level1Img, tileIdx: 2, yOffset: -25, z: 1 },
          { img: level2Img, tileIdx: 5, yOffset: -25, z: 1 },
          { img: level3Img, tileIdx: 8, yOffset: -25, z: 1 },
          { img: level4Img, tileIdx: 11, yOffset: -60, z: 0 },
        ].map(({ img, tileIdx, yOffset, z }) => {
          const tile = tiles[tileIdx];
          const weekNum = Math.floor(tileIdx / 3);
          // W0,W2 go right, so label on left; W1,W3 go left, so label on right
          const onRight = weekNum % 2 === 1;
          return (
            <motion.img
              key={`level-${tileIdx}`}
              src={img}
              alt={`Level ${Math.floor(tileIdx / 3) + 1}`}
              className="absolute pointer-events-none"
              style={{
                width: 350,
                height: 'auto',
                left: (PATH_W - 350) / 2,
                top: tile.y + TILE_H / 2 - 22 + yOffset,
                zIndex: z,
                imageRendering: 'auto',
              }}
              initial={{ opacity: 0, x: onRight ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + tileIdx * 0.05 }}
            />
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
            left: vmanX,
            top: vmanY,
            zIndex: 10,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>
    </div>
  );
});

export default GamifiedJourneyPath;
