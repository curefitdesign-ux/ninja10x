/**
 * StoryFrameRenderer
 * Renders the live frame component in the Reel/story viewer — pixel-perfect at any size.
 * Uses the raw original media + saved frame/activity metadata instead of a JPEG screenshot.
 *
 * IMPORTANT: Props passed to each frame component MUST match exactly what Preview.tsx passes.
 * Preview passes raw duration/pr strings (no formatting), and uses getActivityConfig for labels.
 *
 * Frame components are lazy-loaded to reduce initial bundle size.
 */
import { useEffect, lazy, Suspense, memo } from 'react';
import { getActivityConfig } from '@/lib/activity-context';

// Lazy-load frame components — they are only needed when viewing stories
const ShakyFrame = lazy(() => import('@/components/frames/ShakyFrame'));
const VogueFrame = lazy(() => import('@/components/frames/VogueFrame'));
const JournalFrame = lazy(() => import('@/components/frames/JournalFrame'));
const Journal2Frame = lazy(() => import('@/components/frames/Journal2Frame'));
const FitnessFrame = lazy(() => import('@/components/frames/FitnessFrame'));
const TicketFrame = lazy(() => import('@/components/frames/TicketFrame'));
const TokenFrame = lazy(() => import('@/components/frames/TokenFrame'));
const HolographicFrame = lazy(() => import('@/components/frames/HolographicFrame'));
const ScrapbookFrame = lazy(() => import('@/components/frames/ScrapbookFrame'));
const ArcadeFrame = lazy(() => import('@/components/frames/ArcadeFrame'));
const BoldFrame = lazy(() => import('@/components/frames/BoldFrame'));

interface StoryFrameRendererProps {
  imageUrl: string;         // originalUrl — raw media
  isVideo?: boolean;
  activity?: string;
  frame?: string;
  duration?: string;
  pr?: string;
  dayNumber?: number;
  onLoad?: () => void;
}

function StoryFrameRendererInner({
  imageUrl,
  isVideo,
  activity = '',
  frame = 'shaky',
  duration = '',
  pr = '',
  dayNumber = 1,
  onLoad,
}: StoryFrameRendererProps) {
  // Use the SAME config lookup as Preview.tsx (getActivityConfig)
  const config = getActivityConfig(activity);
  const week = Math.ceil(dayNumber / 3);

  // Match Preview.tsx frameProps exactly:
  //   label1: config.secondaryMetric   (e.g. 'Distance', 'Sets')
  //   label2: config.primaryMetric     (e.g. 'Duration')
  const sharedProps = {
    imageUrl,
    isVideo,
    activity: activity || 'Activity',
    week,
    day: dayNumber,
    duration,          // RAW value — no formatting (matches Preview)
    pr,                // RAW value — no formatting (matches Preview)
    imagePosition: { x: 0, y: 0 },
    imageScale: 1.02,  // Slight overscale to prevent sub-pixel black gaps
    label1: config.secondaryMetric,
    label2: config.primaryMetric,
  };

  // Signal that the frame is "loaded" immediately on mount
  useEffect(() => {
    if (!onLoad) return;
    const id = requestAnimationFrame(() => onLoad());
    return () => cancelAnimationFrame(id);
  }, [imageUrl, onLoad]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center story-frame-fullbleed"
      style={{ background: 'transparent' }}
    >
      <style>{`
        .story-frame-fullbleed > div > div > div {
          width: 100% !important;
          max-width: 100% !important;
          border-radius: 0px !important;
        }
      `}</style>
      <Suspense fallback={<div className="absolute inset-0" />}>
        {(() => {
          switch ((frame || 'shaky').toLowerCase()) {
            case 'shaky':       return <ShakyFrame {...sharedProps} />;
            case 'vogue':       return <VogueFrame {...sharedProps} />;
            case 'journal':     return <JournalFrame {...sharedProps} />;
            case 'journal2':
            case 'journal 2':   return <Journal2Frame {...sharedProps} />;
            case 'fitness':     return <FitnessFrame {...sharedProps} />;
            case 'ticket':      return <TicketFrame {...sharedProps} />;
            case 'token':       return (
              <TokenFrame
                {...sharedProps}
                label1={config.secondaryUnit}
                label2={config.primaryUnit}
              />
            );
            case 'holographic': return (
              <HolographicFrame
                {...sharedProps}
                label1={config.secondaryUnit}
                label2={config.primaryUnit}
                label1Name={config.secondaryMetric}
                label2Name={config.primaryMetric}
              />
            );
            case 'scrapbook':   return <ScrapbookFrame {...sharedProps} />;
            case 'arcade':      return <ArcadeFrame {...sharedProps} />;
            case 'bold':        return <BoldFrame {...sharedProps} />;
            default:            return <ShakyFrame {...sharedProps} />;
          }
        })()}
      </Suspense>
    </div>
  );
}

export default memo(StoryFrameRendererInner);
