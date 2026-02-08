import type { LucideProps } from 'lucide-react';

/**
 * Custom sport-specific SVG icons matching Lucide style
 * (24x24 viewBox, stroke-based, 1.5px stroke)
 */

// Cricket — bat and ball
export const CricketBatBall = ({ size = 24, strokeWidth = 1.5, className, ...props }: LucideProps) => (
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
    {/* Bat handle */}
    <line x1="4" y1="20" x2="8" y2="16" />
    {/* Bat blade */}
    <path d="M8 16 L14 10 L16 12 L10 18 Z" />
    {/* Ball */}
    <circle cx="18" cy="6" r="3" />
    {/* Ball seam */}
    <path d="M16.5 4.5 C17.5 5.5 18.5 6.5 19.5 7.5" />
  </svg>
);

// Boxing gloves
export const BoxingGlove = ({ size = 24, strokeWidth = 1.5, className, ...props }: LucideProps) => (
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
    {/* Glove body */}
    <path d="M7 8 C7 4 10 3 13 3 C16 3 19 5 19 9 C19 12 17 14 15 14 L9 14 C7 14 5 12 5 10" />
    {/* Thumb */}
    <path d="M7 8 C5 8 4 9 4 10.5 C4 12 5 13 7 13" />
    {/* Wrist */}
    <path d="M9 14 L9 18 C9 19.5 10.5 21 12 21 C13.5 21 15 19.5 15 18 L15 14" />
    {/* Wrist strap */}
    <line x1="9" y1="16.5" x2="15" y2="16.5" />
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

// Shuttlecock for badminton
export const Shuttlecock = ({ size = 24, strokeWidth = 1.5, className, ...props }: LucideProps) => (
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
    {/* Cork base */}
    <ellipse cx="12" cy="18" rx="3" ry="2.5" />
    {/* Feather skirt */}
    <path d="M9 16 C8 12 7 8 9 4" />
    <path d="M15 16 C16 12 17 8 15 4" />
    <path d="M9 4 C10 3 14 3 15 4" />
    {/* Middle feather line */}
    <line x1="12" y1="4" x2="12" y2="15.5" />
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

// Tennis ball with racquet feel
export const TennisBall = ({ size = 24, strokeWidth = 1.5, className, ...props }: LucideProps) => (
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
    {/* Tennis ball seam curves */}
    <path d="M2.5 9 C6 11 6 13 2.5 15" />
    <path d="M21.5 9 C18 11 18 13 21.5 15" />
  </svg>
);
