/**
 * Share-link utilities
 * 
 * Generates clean, contextual share URLs and text for activities.
 * Uses the app's published domain with short query params instead of
 * exposing raw storage/Supabase URLs.
 */

const APP_BASE_URL = 'https://ninja10x.lovable.app';

/**
 * Build a clean shareable URL for an activity.
 * Format: https://ninja10x.lovable.app/reel?s={activityId}
 * Short param "s" = story.
 */
export function buildShareUrl(activityId?: string, userId?: string): string {
  if (activityId) {
    return `${APP_BASE_URL}/reel?s=${activityId.slice(0, 8)}`;
  }
  if (userId) {
    return `${APP_BASE_URL}/reel?u=${userId.slice(0, 8)}`;
  }
  return APP_BASE_URL;
}

/**
 * Build contextual share text for an activity.
 */
export function buildShareText(opts: {
  activity?: string;
  dayNumber?: number;
  displayName?: string;
  isOwnStory?: boolean;
}): { title: string; text: string } {
  const { activity, dayNumber, displayName, isOwnStory = true } = opts;
  const activityName = activity || 'workout';
  const weekNum = dayNumber ? Math.ceil(dayNumber / 3) : null;

  const title = isOwnStory
    ? `${displayName ? displayName + "'s" : 'My'} ${activityName} — Cult Ninja Journey`
    : `${displayName || 'Someone'}'s ${activityName} 🔥`;

  const dayLabel = dayNumber ? `Day ${dayNumber}` : '';
  const weekLabel = weekNum ? `Week ${weekNum}` : '';
  const progressTag = dayLabel && weekLabel ? ` (${weekLabel}, ${dayLabel})` : '';

  const text = isOwnStory
    ? `💪 Just logged ${activityName}${progressTag} on my Cult Ninja Journey! #FitnessJourney`
    : `🔥 Check out ${displayName || 'this'} ${activityName}${progressTag}!`;

  return { title, text };
}

/**
 * Full share payload ready for navigator.share() or social deep links.
 */
export function buildFullSharePayload(opts: {
  activityId?: string;
  userId?: string;
  activity?: string;
  dayNumber?: number;
  displayName?: string;
  isOwnStory?: boolean;
}): { title: string; text: string; url: string } {
  const { title, text } = buildShareText(opts);
  const url = buildShareUrl(opts.activityId, opts.userId);
  return { title, text, url };
}
