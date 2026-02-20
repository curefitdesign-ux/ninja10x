import type { LucideProps } from 'lucide-react';

/**
 * Custom sport-specific SVG icons matching Lucide style
 * (24x24 viewBox, stroke-based, 1.5px stroke)
 * These components explicitly forward stroke color via both `stroke` prop and `currentColor`.
 */

// Cricket — stumps with bails
export const CricketBatBall = ({ size = 24, strokeWidth = 1.5, className, color, stroke, style, ...props }: LucideProps & { color?: string; stroke?: string }) => {
  const strokeColor = stroke || color || 'currentColor';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} {...props}>
      <line x1="8" y1="5" x2="8" y2="20" />
      <line x1="12" y1="5" x2="12" y2="20" />
      <line x1="16" y1="5" x2="16" y2="20" />
      <path d="M7.5 5 C8.5 3.5 11.5 3.5 12.5 5" />
      <path d="M11.5 5 C12.5 3.5 15.5 3.5 16.5 5" />
      <line x1="5" y1="20" x2="19" y2="20" />
    </svg>
  );
};

// Boxing glove — angled punch view
export const BoxingGlove = ({ size = 24, strokeWidth = 1.5, className, color, stroke, style, ...props }: LucideProps & { color?: string; stroke?: string }) => {
  const strokeColor = stroke || color || 'currentColor';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} {...props}>
      <path d="M8 5 C5 5 4 7 4 9 C4 11 5 13 8 13" />
      <path d="M8 5 C8 3 10 2 12 2 C15 2 18 4 19 7 C20 10 19 13 16 14 L8 14" />
      <path d="M8 7 C6.5 7 6 8 6 9 C6 10 6.5 11 8 11" />
      <line x1="12" y1="4" x2="12" y2="6" />
      <line x1="15" y1="4.5" x2="15" y2="6.5" />
      <path d="M8 14 L8 18 C8 19 9 20 10 20 L16 20 C17 20 18 19 18 18 L18 14" />
      <line x1="8" y1="16" x2="18" y2="16" />
    </svg>
  );
};

// Football (soccer ball)
export const FootballIcon = ({ size = 24, strokeWidth = 1.5, className, color, stroke, style, ...props }: LucideProps & { color?: string; stroke?: string }) => {
  const strokeColor = stroke || color || 'currentColor';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7 L15 9.5 L14 13 L10 13 L9 9.5 Z" />
      <line x1="12" y1="2" x2="12" y2="7" />
      <line x1="15" y1="9.5" x2="21" y2="8" />
      <line x1="14" y1="13" x2="18" y2="18" />
      <line x1="10" y1="13" x2="6" y2="18" />
      <line x1="9" y1="9.5" x2="3" y2="8" />
    </svg>
  );
};

// Badminton — shuttlecock
export const Shuttlecock = ({ size = 24, strokeWidth = 1.5, className, color, stroke, style, ...props }: LucideProps & { color?: string; stroke?: string }) => {
  const strokeColor = stroke || color || 'currentColor';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} {...props}>
      <ellipse cx="12" cy="19" rx="2.5" ry="2" />
      <path d="M9.5 17.5 C8.5 14 7.5 10 9 5" />
      <path d="M14.5 17.5 C15.5 14 16.5 10 15 5" />
      <path d="M9 5 C10 3.5 14 3.5 15 5" />
      <line x1="12" y1="4" x2="12" y2="17" />
      <path d="M9.8 9 L14.2 9" />
      <path d="M9.5 13 L14.5 13" />
    </svg>
  );
};

// Basketball
export const BasketballIcon = ({ size = 24, strokeWidth = 1.5, className, color, stroke, style, ...props }: LucideProps & { color?: string; stroke?: string }) => {
  const strokeColor = stroke || color || 'currentColor';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M5.5 5.5 C8 8 8 16 5.5 18.5" />
      <path d="M18.5 5.5 C16 8 16 16 18.5 18.5" />
    </svg>
  );
};

// Tennis — racquet with ball
export const TennisBall = ({ size = 24, strokeWidth = 1.5, className, color, stroke, style, ...props }: LucideProps & { color?: string; stroke?: string }) => {
  const strokeColor = stroke || color || 'currentColor';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} {...props}>
      <ellipse cx="9" cy="9" rx="6" ry="7" transform="rotate(-15 9 9)" />
      <line x1="5" y1="5" x2="13" y2="13" />
      <line x1="5" y1="13" x2="13" y2="5" />
      <path d="M13.5 13.5 L18 18" />
      <path d="M18 18 L20 20" />
      <circle cx="19" cy="5" r="2.5" />
      <path d="M17 4.5 C18 5.5 18 5.5 17 6.5" />
      <path d="M21 3.5 C20 4.5 20 5.5 21 6.5" />
    </svg>
  );
};
