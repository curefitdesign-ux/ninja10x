import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BrutalistCardProps {
  videoUrl: string;
  dayNumber: number;
  activityName: string;
}

export function BrutalistCard({ videoUrl, dayNumber, activityName }: BrutalistCardProps) {
  const [phase, setPhase] = useState<1 | 2>(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Phase transition after 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase(2);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Play video when entering phase 2
  useEffect(() => {
    if (phase === 2 && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [phase]);

  return (
    <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-black">
      {/* Noise overlay - always visible */}
      <div
        className="absolute inset-0 z-40 pointer-events-none opacity-30 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <AnimatePresence mode="wait">
        {phase === 1 ? (
          /* Phase 1: Paper texture with brown "DAY X" text */
          <motion.div
            key="phase1"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }} // Hard cut
            className="absolute inset-0 flex items-center justify-center z-30"
            style={{
              background: `
                linear-gradient(135deg, #d4c4a8 0%, #c4b393 50%, #b8a67e 100%)
              `,
              backgroundImage: `
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' result='noise'/%3E%3CfeDiffuseLighting in='noise' lighting-color='%23d4c4a8' surfaceScale='2'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)'/%3E%3C/svg%3E"),
                linear-gradient(135deg, #d4c4a8 0%, #c4b393 50%, #b8a67e 100%)
              `,
            }}
          >
            <motion.h1
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="text-7xl md:text-8xl font-black tracking-tighter"
              style={{
                color: '#5c4033',
                textShadow: '2px 2px 0px rgba(0,0,0,0.1)',
              }}
            >
              DAY {dayNumber}
            </motion.h1>
          </motion.div>
        ) : (
          /* Phase 2: Black background with split-screen video */
          <motion.div
            key="phase2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.05 }} // Hard cut
            className="absolute inset-0 bg-black z-20"
          >
            {/* Scrolling marquee background */}
            <div className="absolute inset-0 overflow-hidden opacity-10">
              <div className="marquee-container h-full flex flex-col justify-center">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="whitespace-nowrap text-6xl font-black tracking-widest py-2"
                    style={{
                      WebkitTextStroke: '1px rgba(255,255,255,0.5)',
                      color: 'transparent',
                    }}
                    animate={{
                      x: i % 2 === 0 ? [0, -500] : [-500, 0],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    {activityName} • {activityName} • {activityName} • {activityName} • {activityName} •
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 3-column split-screen video */}
            <div className="absolute inset-0 flex">
              {[0, 1, 2].map((col) => (
                <div
                  key={col}
                  className="flex-1 overflow-hidden relative"
                  style={{
                    clipPath: `inset(0 ${col === 2 ? 0 : 2}px 0 ${col === 0 ? 0 : 2}px)`,
                  }}
                >
                  <video
                    ref={col === 1 ? videoRef : undefined}
                    src={videoUrl}
                    muted
                    loop
                    playsInline
                    className="absolute w-[300%] h-full object-cover"
                    style={{
                      left: `-${col * 100}%`,
                      filter: 'contrast(1.2) saturate(0.9)',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Vertical divider lines */}
            <div className="absolute inset-0 flex pointer-events-none z-30">
              <div className="flex-1 border-r border-white/20" />
              <div className="flex-1 border-r border-white/20" />
              <div className="flex-1" />
            </div>

            {/* Text overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none">
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-6xl md:text-7xl font-black text-white tracking-tighter drop-shadow-lg"
                style={{
                  textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                }}
              >
                DAY {dayNumber}
              </motion.h2>
              
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-4xl md:text-5xl font-black tracking-widest mt-2"
                style={{
                  color: '#FFFF00',
                  textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                }}
              >
                {activityName}
              </motion.h3>
            </div>

            {/* Vignette effect */}
            <div
              className="absolute inset-0 pointer-events-none z-35"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
