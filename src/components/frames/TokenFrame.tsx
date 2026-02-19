import { useRef, useEffect } from 'react';

interface TokenFrameProps {
  imageUrl: string;
  isVideo?: boolean;
  activity: string;
  week: number;
  day: number;
  duration: string;
  pr: string;
  imagePosition: { x: number; y: number };
  imageScale: number;
  label1?: string;
  label2?: string;
}

const TokenFrame = ({
  imageUrl,
  isVideo,
  activity,
  week,
  day,
  duration,
  pr,
  imagePosition,
  imageScale,
  label1,
  label2,
}: TokenFrameProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const durationLabel = label2 || 'Duration';
  const metricLabel = label1 || 'Metric';

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  // Formatted metrics line
  const metricsLine = [duration, pr ? `${pr} ${metricLabel}` : '']
    .filter(Boolean)
    .join(' | ');

  // Circular stamp text
  const stampText = `WEEK ${week} · DAY ${day} · WEEK ${week} · DAY ${day} · `;

  return (
    <div
      className="w-[90%] mx-auto relative overflow-visible"
      style={{ aspectRatio: '9/16' }}
    >
      {/* Google Fonts for Montserrat + Playfair */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400&family=Montserrat:wght@700&display=swap"
        rel="stylesheet"
      />

      {/* Stamp card — white bg with perforated edges */}
      <div
        className="w-full h-full relative flex flex-col"
        style={{
          backgroundColor: '#e8e8e8',
          // Perforated stamp edges: punch semi-circles along all 4 borders
          WebkitMaskImage: `
            radial-gradient(circle at 0% 0%, transparent 8px, white 8px),
            radial-gradient(circle at 100% 0%, transparent 8px, white 8px),
            radial-gradient(circle at 0% 100%, transparent 8px, white 8px),
            radial-gradient(circle at 100% 100%, transparent 8px, white 8px),
            repeating-linear-gradient(
              to right,
              white,
              white calc(50% - 8px),
              transparent calc(50% - 8px),
              transparent calc(50% + 8px),
              white calc(50% + 8px)
            ),
            repeating-linear-gradient(
              to bottom,
              white,
              white calc(50% - 8px),
              transparent calc(50% - 8px),
              transparent calc(50% + 8px),
              white calc(50% + 8px)
            )
          `,
          maskImage: `
            radial-gradient(circle at 0% 0%, transparent 8px, white 8px),
            radial-gradient(circle at 100% 0%, transparent 8px, white 8px),
            radial-gradient(circle at 0% 100%, transparent 8px, white 8px),
            radial-gradient(circle at 100% 100%, transparent 8px, white 8px),
            repeating-linear-gradient(
              to right,
              white,
              white calc(50% - 8px),
              transparent calc(50% - 8px),
              transparent calc(50% + 8px),
              white calc(50% + 8px)
            ),
            repeating-linear-gradient(
              to bottom,
              white,
              white calc(50% - 8px),
              transparent calc(50% - 8px),
              transparent calc(50% + 8px),
              white calc(50% + 8px)
            )
          `,
          // Use mask composite instead — simpler approach with box-shadow punch-outs:
          boxShadow: '0 8px 40px rgba(0,0,0,0.28)',
        }}
      >
        {/* Simpler perforation approach: outer container clips, inner shows white with radial holes */}
        <StampCard
          imageUrl={imageUrl}
          isVideo={isVideo}
          videoRef={videoRef}
          activity={activity}
          week={week}
          day={day}
          duration={duration}
          pr={pr}
          imagePosition={imagePosition}
          imageScale={imageScale}
          metricsLine={metricsLine}
          stampText={stampText}
        />
      </div>
    </div>
  );
};

interface StampCardProps {
  imageUrl: string;
  isVideo?: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  activity: string;
  week: number;
  day: number;
  duration: string;
  pr: string;
  imagePosition: { x: number; y: number };
  imageScale: number;
  metricsLine: string;
  stampText: string;
}

const StampCard = ({
  imageUrl,
  isVideo,
  videoRef,
  activity,
  week,
  day,
  imagePosition,
  imageScale,
  metricsLine,
  stampText,
}: StampCardProps) => {
  const HOLE = 7; // radius of each perforation hole in px
  const GAP = 18; // spacing between holes

  return (
    <div
      className="w-full h-full relative flex flex-col overflow-hidden"
      style={{ backgroundColor: '#f0f0f0' }}
    >
      {/* SVG perforation overlay — punches holes along all 4 edges */}
      <PerforationBorder holeRadius={HOLE} gap={GAP} />

      {/* Inner content with padding to clear holes */}
      <div className="flex flex-col h-full" style={{ padding: `${HOLE * 2 + 4}px` }}>
        {/* ── HEADER ─────────────────────────────────── */}
        <div className="text-center mb-2" style={{ lineHeight: 1 }}>
          <div
            style={{
              fontFamily: "'Montserrat', 'Arial Black', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(26px, 9vw, 38px)',
              color: '#0a5278',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            CULTNINJA
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 400,
              fontStyle: 'italic',
              fontSize: 'clamp(18px, 6vw, 26px)',
              color: '#1a1a1a',
              marginTop: '-2px',
              lineHeight: 1.1,
            }}
          >
            Journey
          </div>
        </div>

        {/* ── PHOTO ──────────────────────────────────── */}
        <div
          className="relative overflow-hidden flex-1"
          style={{
            border: '2px solid rgba(10,82,120,0.15)',
            minHeight: 0,
          }}
        >
          {isVideo ? (
            <video
              ref={videoRef}
              src={imageUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
              }}
            />
          ) : (
            <img
              src={imageUrl}
              alt="Activity"
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
              }}
            />
          )}

          {/* Stamp seal — bottom-left of photo */}
          <div
            className="absolute"
            style={{ bottom: 10, left: 10, width: 80, height: 80 }}
          >
            <CircularStampSeal week={week} day={day} text={stampText} />
          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────── */}
        <div className="text-center mt-2">
          <div
            style={{
              fontFamily: "'Montserrat', 'Arial Black', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(20px, 7vw, 30px)',
              color: '#0a5278',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}
          >
            {activity || 'Activity'}
          </div>
          {metricsLine ? (
            <div
              style={{
                fontFamily: "'Montserrat', Arial, sans-serif",
                fontWeight: 500,
                fontSize: 'clamp(9px, 3vw, 13px)',
                color: '#808080',
                letterSpacing: '0.05em',
                marginTop: 4,
                lineHeight: 1.3,
              }}
            >
              {metricsLine}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// Inline SVG that draws circular perforation holes along the 4 edges of the card
const PerforationBorder = ({
  holeRadius,
  gap,
}: {
  holeRadius: number;
  gap: number;
}) => {
  // We render this as an absolutely-positioned SVG that covers the card.
  // We'll use a foreignObject-free approach: just render multiple small circles
  // in an SVG with a white fill on #f0f0f0 background.
  // The parent clips, so the SVG sizes to the parent via CSS.
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      style={{ zIndex: 2 }}
    >
      <PerforationRows holeRadius={holeRadius} gap={gap} />
    </svg>
  );
};

// Renders perforation holes using a pattern element
const PerforationRows = ({
  holeRadius,
  gap,
}: {
  holeRadius: number;
  gap: number;
}) => {
  const step = holeRadius * 2 + gap;
  const offset = holeRadius;

  // We use SVG pattern: horizontal strip at top and bottom, vertical at left and right
  // Since SVG units are %, we use a viewBox-less approach with userSpaceOnUse
  return (
    <g fill="#f0f0f0">
      {/* Top row */}
      <TopBottomHoles holeRadius={holeRadius} step={step} offset={offset} side="top" />
      {/* Bottom row */}
      <TopBottomHoles holeRadius={holeRadius} step={step} offset={offset} side="bottom" />
      {/* Left col */}
      <LeftRightHoles holeRadius={holeRadius} step={step} offset={offset} side="left" />
      {/* Right col */}
      <LeftRightHoles holeRadius={holeRadius} step={step} offset={offset} side="right" />
    </g>
  );
};

// Renders a row of circles along top or bottom edge
const TopBottomHoles = ({
  holeRadius,
  step,
  offset,
  side,
}: {
  holeRadius: number;
  step: number;
  offset: number;
  side: 'top' | 'bottom';
}) => {
  // We render ~25 holes across; SVG % won't work for cx, so we use viewBox trick:
  // Instead we use a percentage-based cx that the browser respects in SVG
  const count = 20;
  const cy = side === 'top' ? `${holeRadius}px` : `calc(100% - ${holeRadius}px)`;

  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const xPct = (i / (count - 1)) * 100;
        return (
          <circle
            key={i}
            cx={`${xPct}%`}
            cy={cy}
            r={holeRadius}
          />
        );
      })}
    </>
  );
};

// Renders a column of circles along left or right edge
const LeftRightHoles = ({
  holeRadius,
  step,
  offset,
  side,
}: {
  holeRadius: number;
  step: number;
  offset: number;
  side: 'left' | 'right';
}) => {
  const count = 30;
  const cx = side === 'left' ? `${holeRadius}px` : `calc(100% - ${holeRadius}px)`;

  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const yPct = (i / (count - 1)) * 100;
        return (
          <circle
            key={i}
            cx={cx}
            cy={`${yPct}%`}
            r={holeRadius}
          />
        );
      })}
    </>
  );
};

// Circular stamp seal with rotating text + bird icon in center
const CircularStampSeal = ({
  week,
  day,
  text,
}: {
  week: number;
  day: number;
  text: string;
}) => {
  const r = 34; // radius of text path
  const cx = 40;
  const cy = 40;
  const circumference = 2 * Math.PI * r;

  return (
    <svg
      viewBox="0 0 80 80"
      width="80"
      height="80"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Semi-transparent circle background */}
      <circle cx={cx} cy={cy} r={38} fill="rgba(0,0,0,0.55)" />

      {/* Dashed border ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />

      {/* Circular text path */}
      <defs>
        <path
          id="stamp-circle-path"
          d={`M ${cx},${cy - r} A ${r},${r} 0 1,1 ${cx - 0.01},${cy - r}`}
        />
      </defs>
      <text
        style={{
          fontSize: 7.5,
          fontFamily: "'Montserrat', Arial, sans-serif",
          fontWeight: 700,
          letterSpacing: 1.2,
          fill: 'white',
        }}
      >
        <textPath href="#stamp-circle-path" startOffset="0%">
          {text}
        </textPath>
      </text>

      {/* Bird / dove icon in center (simple SVG path) */}
      <g transform={`translate(${cx - 10}, ${cy - 8}) scale(1.25)`}>
        <path
          d="M8 4 C6 2, 2 3, 1 5 C0 7, 1 9, 3 9 C2 11, 0 13, 0 14 C2 13, 5 12, 6 10 C7 12, 9 13, 12 13 C11 11, 9 9, 8 8 C10 7, 12 5, 12 3 C10 4, 9 5, 8 4 Z"
          fill="white"
          fillOpacity={0.9}
        />
      </g>

      {/* Week / day text below bird */}
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        style={{
          fontSize: 6.5,
          fontFamily: "'Montserrat', Arial, sans-serif",
          fontWeight: 700,
          fill: 'rgba(255,255,255,0.85)',
          letterSpacing: 0.5,
        }}
      >
        {`W${week} D${day}`}
      </text>
    </svg>
  );
};

export default TokenFrame;
