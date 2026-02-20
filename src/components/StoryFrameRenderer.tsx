/**
 * StoryFrameRenderer
 * Renders the live frame component in the Reel/story viewer — pixel-perfect at any size.
 * Uses the raw original media + saved frame/activity metadata instead of a JPEG screenshot.
 */
import { lazy, Suspense, useEffect } from 'react';
import { buildTemplateContext } from '@/lib/activity-context';

const ShakyFrame = lazy(() => import('@/components/frames/ShakyFrame'));
const VogueFrame = lazy(() => import('@/components/frames/VogueFrame'));
const JournalFrame = lazy(() => import('@/components/frames/JournalFrame'));
const Journal2Frame = lazy(() => import('@/components/frames/Journal2Frame'));
const FitnessFrame = lazy(() => import('@/components/frames/FitnessFrame'));
const TicketFrame = lazy(() => import('@/components/frames/TicketFrame'));
const TokenFrame = lazy(() => import('@/components/frames/TokenFrame'));
const HolographicFrame = lazy(() => import('@/components/frames/HolographicFrame'));

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

export default function StoryFrameRenderer({
  imageUrl,
  isVideo,
  activity = '',
  frame = 'shaky',
  duration = '',
  pr = '',
  dayNumber = 1,
  onLoad,
}: StoryFrameRendererProps) {
  const ctx = buildTemplateContext({ activity, dayNumber, duration, pr });

  const sharedProps = {
    imageUrl,
    isVideo,
    activity: ctx.activity,
    week: ctx.week,
    day: ctx.dayInWeek,
    duration: ctx.duration,
    pr: ctx.pr,
    imagePosition: { x: 0, y: 0 },
    imageScale: 1,
    label1: ctx.metricLabel,
    label2: ctx.durationLabel,
  };

  // Signal that the frame is "loaded" immediately on mount — React renders synchronously
  // so there's no network load event like <img onLoad>. We use a short delay to let
  // the frame's inner <img> tag finish painting before notifying the parent.
  useEffect(() => {
    if (!onLoad) return;
    // Use rAF so the frame's inner <img> has had a chance to layout
    const id = requestAnimationFrame(() => onLoad());
    return () => cancelAnimationFrame(id);
  }, [imageUrl, onLoad]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        {(() => {
          switch ((frame || 'shaky').toLowerCase()) {
            case 'shaky':       return <ShakyFrame {...sharedProps} />;
            case 'vogue':       return <VogueFrame {...sharedProps} />;
            case 'journal':     return <JournalFrame {...sharedProps} />;
            case 'journal2':
            case 'journal 2':   return <Journal2Frame {...sharedProps} />;
            case 'fitness':     return <FitnessFrame {...sharedProps} />;
            case 'ticket':      return <TicketFrame {...sharedProps} />;
            case 'token':       return <TokenFrame {...sharedProps} />;
            case 'holographic': return (
              <HolographicFrame
                {...sharedProps}
                label1={ctx.metricUnit}
                label2={ctx.durationLabel === 'Duration' ? 'min' : ''}
                label1Name={ctx.metricLabel}
                label2Name={ctx.durationLabel}
              />
            );
            default:            return <ShakyFrame {...sharedProps} />;
          }
        })()}
      </Suspense>
    </div>
  );
}
