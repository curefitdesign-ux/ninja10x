import type { LucideProps } from 'lucide-react';

/**
 * Custom sport-specific SVG icons matching Lucide style
 * (24x24 viewBox, stroke-based, 1.5px stroke)
 */

// Cricket — bat and stumps
export const CricketBatBall = ({ size = 24, strokeWidth = 1.5, className, ...props }: LucideProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    {/* Bat */}
    <path d="M5 21 L9 17" />
    <path d="M9 17 L10 16 C10 16 11.5 14.5 11 13 L8 10 L10.5 7.5 C11.5 6.5 13 6.5 14 7.5 L16.5 10 C17.5 11 17.5 12.5 16.5 13.5 L14 16 L11 13" />
    {/* Stumps */}
    <line x1="19" y1="3" x2="19" y2="10" />
    <line x1="21" y1="3" x2="21" y2="10" />
    <line x1="18" y1="4" x2="22" y2="4" />
  </svg>
);

// Boxing glove — punching fist
export const BoxingGlove = ({ size = 24, strokeWidth = 1.5, className, ...props }: LucideProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    {/* Glove shape */}
    <path d="M6 11 C6 7 8 4 12 4 C16 4 18 6 18 9 C18 11 17 12.5 15.5 13.5 L15.5 14 L8.5 14 L8.5 13.5 C7 12.5 6 11.5 6 11Z" />
    {/* Thumb */}
    <path d="M6 11 C4.5 10.5 4 9 4.5 7.5 C5 6.5 6 6 7 6.5" />
    {/* Wrist guard */}
    <rect x="8" y="14" width="8" height="3" rx="0.5" />
    {/* Wrist strap detail */}
    <line x1="8" y1="15.5" x2="16" y2="15.5" />
    {/* Arm */}
    <path d="M10 17 L10 20 M14 17 L14 20" />
  </svg>
);

// Football (soccer ball)
export const FootballIcon = ({ size = 24, strokeWidth = 1.5, className, ...props }: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Ball outline */}
    <circle cx="12" cy="12" r="10" />
    {/* Pentagon pattern */}
    <path d="M12 7 L15 9.5 L14 13 L10 13 L9 9.5 Z" />
    {/* Lines to edge */}
    <line x1="12" y1="2" x2="12" y2="7" />
    <line x1="15" y1="9.5" x2="21" y2="8" />
    <line x1="14" y1="13" x2="18" y2="18" />
    <line x1="10" y1="13" x2="6" y2="18" />
    <line x1="9" y1="9.5" x2="3" y2="8" />
  </svg>
);

// Badminton — racquet and shuttlecock
export const Shuttlecock = ({ size = 24, strokeWidth = 1.5, className, ...props }: LucideProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    {/* Racquet head */}
    <ellipse cx="8" cy="8" rx="5" ry="6" />
    {/* Racquet strings */}
    <line x1="8" y1="2" x2="8" y2="14" />
    <line x1="3" y1="8" x2="13" y2="8" />
    {/* Racquet handle */}
    <line x1="11" y1="12" x2="14" y2="15" />
    <line x1="14" y1="15" x2="16" y2="17" />
    {/* Shuttlecock */}
    <circle cx="19" cy="5" r="1.5" />
    <path d="M18 6.5 L17 9 M19 6.5 L19 9 M20 6.5 L21 9" />
  </svg>
);

// Basketball
export const BasketballIcon = ({ size = 24, strokeWidth = 1.5, className, ...props }: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Ball */}
    <circle cx="12" cy="12" r="10" />
    {/* Vertical seam */}
    <line x1="12" y1="2" x2="12" y2="22" />
    {/* Horizontal seam */}
    <line x1="2" y1="12" x2="22" y2="12" />
    {/* Curved seams */}
    <path d="M5.5 5.5 C8 8 8 16 5.5 18.5" />
    <path d="M18.5 5.5 C16 8 16 16 18.5 18.5" />
  </svg>
);

// Tennis — racquet with ball
export const TennisBall = ({ size = 24, strokeWidth = 1.5, className, ...props }: LucideProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    {/* Racquet head */}
    <ellipse cx="10" cy="8" rx="6" ry="7" />
    {/* Racquet strings cross */}
    <line x1="10" y1="1" x2="10" y2="15" />
    <line x1="4" y1="8" x2="16" y2="8" />
    {/* Handle */}
    <line x1="14" y1="13" x2="18" y2="17" />
    <line x1="18" y1="17" x2="20" y2="19" />
    {/* Ball */}
    <circle cx="19" cy="5" r="2" />
    <path d="M17.5 4 C18.5 5 18.5 5 17.5 6" />
  </svg>
);
