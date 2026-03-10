import { useState, useRef, useEffect, useCallback, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { X, Share2, Pencil, ChevronUp } from 'lucide-react';
import SendReactionSheet from '@/components/SendReactionSheet';
import { createPortal } from 'react-dom';
import { usePortalContainer } from '@/hooks/use-portal-container';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { ReactionType, ActivityReaction, sendReaction } from '@/services/journey-service';
import { useJourneyActivities } from '@/hooks/use-journey-activities';
import MediaSourceSheet from '@/components/MediaSourceSheet';
import StoryFrameRenderer from '@/components/StoryFrameRenderer';
import DynamicBlurBackground from '@/components/DynamicBlurBackground';
import ReactsSoFarSheet from '@/components/ReactsSoFarSheet';
import ProfileAvatar from '@/components/ProfileAvatar';
import Floating3DEmojis from '@/components/Floating3DEmojis';
import StoryEmojiRain from '@/components/StoryEmojiRain';
import { isVideoUrl } from '@/lib/media';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import fireEmoji from '@/assets/reactions/fire-3d.png';
import clapEmoji from '@/assets/reactions/clap-3d.png';

interface ReactorProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  reactionType?: ReactionType;
  createdAt?: string;
}

const DEFAULT_REACTIONS: Partial<Record<ReactionType, ActivityReaction>> = {};

export interface GalleryActivity {
  id: string;
  storageUrl: string;
  originalUrl?: string;
  isVideo?: boolean;
  activity?: string;
  frame?: string;
  duration?: string;
  pr?: string;
  dayNumber: number;
  reactionCount?: number;
  reactions?: Partial<Record<ReactionType, ActivityReaction>>;
  reactorProfiles?: ReactorProfile[];
  isPlaceholder?: boolean;
}

interface UserProfileInfo {
  displayName: string;
  avatarUrl: string;
  startDate?: string; // ISO date string of first activity
}

interface ActivityGalleryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activities: GalleryActivity[];
  initialIndex?: number;
  onLogActivity?: () => void;
  userProfile?: UserProfileInfo;
  isOwnProfile?: boolean;
  targetUserId?: string; // user ID of the profile being viewed (for nudges)
}

const ActivityGalleryOverlay = forwardRef<HTMLDivElement, ActivityGalleryOverlayProps>(function ActivityGalleryOverlay({
  isOpen,
  onClose,
  activities,
  initialIndex = 0,
  onLogActivity,
  userProfile,
  isOwnProfile,
  targetUserId,
}, _ref) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const portalContainer = usePortalContainer();
  const { user } = useAuth();

  // Sheets
  const [showReactsSheet, setShowReactsSheet] = useState(false);
  const [showSendReactionSheet, setShowSendReactionSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Local reactions state
  const [localReactions, setLocalReactions] = useState<Record<string, {
    total: number;
    reactions: Partial<Record<ReactionType, ActivityReaction>>;
    reactorProfiles: ReactorProfile[];
  }>>({});

  // Auto-advance timer
  const AUTO_ADVANCE_MS = 10000;
  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);
  const progressStartTimer = useRef<number | null>(null);
  const [progressRunKey, setProgressRunKey] = useState(0);
  const isPaused = showReactsSheet || showSendReactionSheet || showEditSheet;

  // Check if user has logged an activity today (placeholder presence means they haven't)
  const hasLoggedToday = useMemo(() => {
    if (!isOwnProfile) return true;
    return !activities.some(a => a.isPlaceholder);
  }, [activities, isOwnProfile]);

  // Generate dynamic user description from activity data
  const userDescription = useMemo((): { diary: string; varietyLine: string; durationLine: string; count: number } | null => {
    if (!userProfile || activities.length === 0) return null;
    
    const realActivities = activities.filter(a => !a.isPlaceholder && a.dayNumber < 1001);
    if (realActivities.length === 0) return null;
    
    let totalDurationMins = 0;
    const activityCounts: Record<string, number> = {};
    for (const a of realActivities) {
      if (a.duration) {
        const minMatch = a.duration.match(/(\d+)\s*min/i);
        const hrMatch = a.duration.match(/(\d+)\s*h/i);
        if (minMatch) totalDurationMins += parseInt(minMatch[1]);
        if (hrMatch) totalDurationMins += parseInt(hrMatch[1]) * 60;
      }
      const type = a.activity || 'workout';
      activityCounts[type] = (activityCounts[type] || 0) + 1;
    }

    const count = realActivities.length;
    const name = userProfile.displayName?.split(' ')[0] || 'This one';
    
    // Format duration naturally
    let durationStr = '';
    if (totalDurationMins > 0) {
      const hrs = Math.floor(totalDurationMins / 60);
      const mins = totalDurationMins % 60;
      durationStr = hrs > 0 ? (mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`) : `${mins} min`;
    }

    // Get top activities sorted by frequency
    const sorted = Object.entries(activityCounts).sort((a, b) => b[1] - a[1]);
    const topActivity = sorted[0]?.[0]?.toLowerCase() || 'working out';
    const variety = sorted.length;

    // Build diary-style narrative
    const parts: string[] = [];

    if (count >= 12) {
      parts.push(`🏆 ${name} crushed all 12 days!`);
    } else if (count >= 9) {
      parts.push(`🔥 ${name}'s on fire, almost there!`);
    } else if (count >= 6) {
      parts.push(`💪 Halfway beast mode.`);
    } else if (count >= 3) {
      parts.push(`⚡ ${name}'s building momentum.`);
    } else {
      parts.push(`🚀 ${name} just started the journey!`);
    }

    let varietyLine = '';
    if (variety >= 3) {
      const top3 = sorted.slice(0, 3).map(([k]) => k.toLowerCase());
      varietyLine = `Mixing it up with ${top3.join(', ')} & more ✨`;
    } else if (variety === 2) {
      varietyLine = `Loves ${sorted[0][0].toLowerCase()} & ${sorted[1][0].toLowerCase()} 🎯`;
    } else if (count > 1) {
      varietyLine = `All-in on ${topActivity} 🎯`;
    }

    const mainLine = parts.join(' · ');
    const durationLine = durationStr ? `⏱️ ${durationStr} of pure grind so far` : '';

    return { diary: mainLine, varietyLine, durationLine, count };
  }, [activities, userProfile]);

  // Media loading
  const [loadedMediaUrl, setLoadedMediaUrl] = useState('');

  // Initialize index only when overlay opens (avoid resets on activity array refreshes)
  useEffect(() => {
    if (!isOpen) return;
    setCurrentIndex(initialIndex);
  }, [isOpen, initialIndex]);

  // Keep local reactions in sync with incoming activities
  useEffect(() => {
    if (!isOpen) return;
    const map: Record<string, { total: number; reactions: Partial<Record<ReactionType, ActivityReaction>>; reactorProfiles: ReactorProfile[] }> = {};
    for (const a of activities) {
      map[a.id] = {
        total: a.reactionCount || 0,
        reactions: a.reactions || { ...DEFAULT_REACTIONS },
        reactorProfiles: a.reactorProfiles || [],
      };
    }
    setLocalReactions(map);
  }, [activities, isOpen]);

  // Reset progress on index change/open, then trigger fill after paint
  useEffect(() => {
    if (!isOpen) return;

    if (progressStartTimer.current !== null) {
      window.clearTimeout(progressStartTimer.current);
      progressStartTimer.current = null;
    }

    setAutoAdvanceProgress(0);
    setProgressRunKey((k) => k + 1);

    progressStartTimer.current = window.setTimeout(() => {
      setAutoAdvanceProgress(1);
      progressStartTimer.current = null;
    }, 50);

    return () => {
      if (progressStartTimer.current !== null) {
        window.clearTimeout(progressStartTimer.current);
        progressStartTimer.current = null;
      }
    };
  }, [currentIndex, isOpen]);

  // Auto-advance timer
  useEffect(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    if (!isOpen || isPaused || activities.length <= 1) return;

    const current = activities[currentIndex];
    if (!current || current.isPlaceholder) return;

    autoAdvanceTimer.current = setTimeout(() => {
      if (currentIndex < activities.length - 1) {
        setCurrentIndex(i => i + 1);
      }
    }, AUTO_ADVANCE_MS);

    return () => { if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current); };
  }, [currentIndex, isOpen, isPaused, activities.length]);

  // Preload ALL gallery images on open for instant transitions
  useEffect(() => {
    if (!isOpen) return;
    for (const act of activities) {
      if (act && !act.isPlaceholder && !act.isVideo) {
        const url = act.originalUrl || act.storageUrl;
        if (url) {
          const img = new Image();
          img.src = url;
        }
      }
    }
  }, [isOpen, activities]);

  // Derive activity type tags from all activities
  const activityTags = useMemo(() => {
    const types = new Set<string>();
    for (const a of activities) {
      if (!a.isPlaceholder && a.activity) types.add(a.activity.toLowerCase());
    }
    return Array.from(types).slice(0, 4);
  }, [activities]);

  // Duration summary
  const totalDurationStr = useMemo(() => {
    let totalMins = 0;
    for (const a of activities) {
      if (a.isPlaceholder || !a.duration) continue;
      const minMatch = a.duration.match(/(\d+)\s*min/i);
      const hrMatch = a.duration.match(/(\d+)\s*h/i);
      if (minMatch) totalMins += parseInt(minMatch[1]);
      if (hrMatch) totalMins += parseInt(hrMatch[1]) * 60;
    }
    if (totalMins === 0) return null;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0 ? (mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`) : `${mins}m`;
  }, [activities]);

  if (!isOpen || activities.length === 0) return null;

  const current = activities[currentIndex];
  const totalActivities = activities.filter(a => !a.isPlaceholder).length;
  const currentReactions = localReactions[current.id] || { total: 0, reactions: { ...DEFAULT_REACTIONS }, reactorProfiles: [] };

  // Media URL logic (same as Reel page)
  const hasLiveFrame = !!(current.frame && current.frame !== 'recap' && current.originalUrl);
  const mediaUrl = hasLiveFrame
    ? (current.originalUrl || current.storageUrl || '')
    : (current.storageUrl || current.originalUrl || '');
  const isVideo = isVideoUrl(mediaUrl);

  const activeReactionTypes = Object.entries(currentReactions.reactions)
    .filter(([, r]) => r.count > 0)
    .map(([type]) => type as ReactionType);

  const week = Math.ceil(current.dayNumber / 3);
  const dayInWeek = ((current.dayNumber - 1) % 3) + 1;

  // Edit is available on all non-placeholder activities
  const canShare = !current.isPlaceholder;
  const canEdit = !current.isPlaceholder;

  const goNext = () => setCurrentIndex(i => Math.min(i + 1, activities.length - 1));
  const goPrev = () => setCurrentIndex(i => Math.max(i - 1, 0));

  const handleReact = async (type: ReactionType) => {
    if (!user || !current || isOwnProfile) return;
    setShowSendReactionSheet(false);

    // Optimistic update
    setLocalReactions(prev => {
      const curr = prev[current.id] || { total: 0, reactions: { ...DEFAULT_REACTIONS }, reactorProfiles: [] };
      const existing = curr.reactions[type];
      const newCount = (existing?.count || 0) + 1;
      return {
        ...prev,
        [current.id]: {
          ...curr,
          total: curr.total + 1,
          reactions: { ...curr.reactions, [type]: { count: newCount, reacted: true } },
          reactorProfiles: [...curr.reactorProfiles, { userId: user.id, displayName: 'You', reactionType: type }],
        },
      };
    });

    try {
      await sendReaction(current.id, type);
    } catch (err) {
      console.error('Reaction failed', err);
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    if (tapX < rect.width * 0.35) goPrev();
    else goNext();
  };

  const buildSharePayload = () => {
    const activityName = current?.activity || 'workout';
    const shareText = `Check out my ${activityName} on my fitness journey! 💪`;
    const url = mediaUrl && mediaUrl.startsWith('http') ? mediaUrl : window.location.href;
    return { title: 'My Fitness Story', text: shareText, url };
  };

  const shareToChannel = (channel: 'whatsapp' | 'instagram' | 'messages') => {
    const payload = buildSharePayload();
    const shareText = `${payload.text}\n\n${payload.url}`;

    setTimeout(() => {
      if (channel === 'whatsapp') {
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
        const webFallback = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => { window.location.href = webFallback; }, 1500);
        return;
      }
      if (channel === 'messages') {
        window.location.href = `sms:&body=${encodeURIComponent(shareText)}`;
        return;
      }
      if (channel === 'instagram') {
        if (navigator.share) {
          navigator.share(payload).catch(() => {});
        } else {
          navigator.clipboard.writeText(shareText).then(() => {
            toast.success('Link copied! Paste it in Instagram.');
          }).catch(() => {
            toast.error('Unable to copy link');
          });
        }
        return;
      }
    }, 100);
  };



  const prevActivity = currentIndex > 0 ? activities[currentIndex - 1] : null;
  const nextActivity = currentIndex < activities.length - 1 ? activities[currentIndex + 1] : null;

  const renderCardContent = (act: GalleryActivity) => {
    if (act.isPlaceholder) {
      return (
        <div className="w-full h-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, rgba(28,28,32,1) 0%, rgba(18,18,22,1) 100%)',
          }}
        >
          <div className="text-center px-4">
            <p className="text-white/60 text-xs font-medium tracking-widest uppercase">Day {act.dayNumber}</p>
          </div>
        </div>
      );
    }
    if (act.frame) {
      return (
        <StoryFrameRenderer
          imageUrl={act.originalUrl || act.storageUrl}
          isVideo={act.isVideo}
          activity={act.activity}
          frame={act.frame}
          duration={act.duration}
          pr={act.pr}
          dayNumber={act.dayNumber}
        />
      );
    }
    if (act.isVideo) {
      return <video src={act.originalUrl || act.storageUrl} className="absolute inset-0 w-full h-full object-cover" muted playsInline loop autoPlay />;
    }
    return <img src={act.originalUrl || act.storageUrl} alt={`Day ${act.dayNumber}`} className="absolute inset-0 w-full h-full object-cover" />;
  };

  const overlay = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0"
          style={{ zIndex: 60 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
        <DynamicBlurBackground imageUrl={mediaUrl}>
          <div
            className="absolute inset-0 flex flex-col"
            style={{ overflow: 'hidden', touchAction: 'none' }}
          >
            {/* TOP ZONE: progress segments | close */}
            <div
              className="z-50 flex items-center justify-between px-4 shrink-0"
              style={{
                paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)',
                height: 56,
              }}
            >
              <div className="flex items-center gap-1 flex-1 mx-3">
                {activities.map((a, i) => {
                  if (a.isPlaceholder) return null;
                  const isCurrent = i === currentIndex;
                  const isPast = i < currentIndex;
                  return (
                    <div key={a.id} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div
                        key={isCurrent ? `${a.id}-${progressRunKey}` : `${a.id}-static`}
                        className="h-full rounded-full"
                        style={{
                          background: (isPast || isCurrent) ? 'rgba(255,255,255,0.9)' : 'transparent',
                          width: isPast ? '100%' : isCurrent ? `${autoAdvanceProgress * 100}%` : '0%',
                          transition: isCurrent ? (autoAdvanceProgress > 0 ? `width ${AUTO_ADVANCE_MS}ms linear` : 'none') : 'none',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <motion.button
                className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={onClose}
                whileTap={{ scale: 0.85 }}
              >
                <X className="w-5 h-5 text-white/80" />
              </motion.button>
            </div>



            <div
              className="relative z-30 flex-shrink-0"
              style={{ height: '46%', marginTop: 8 }}
              onClick={handleTap}
            >
              <div className="relative w-full h-full flex items-center justify-center" style={{ gap: '10px' }}>
                {/* Previous card (left, rotated) */}
                {prevActivity && !prevActivity.isPlaceholder && (
                  <motion.div
                    className="absolute overflow-hidden"
                    style={{
                      width: '46%',
                      aspectRatio: '9/16',
                      left: '-4%',
                      top: '10%',
                      borderRadius: 14,
                      transform: 'rotate(-10deg)',
                      zIndex: 5,
                      filter: 'brightness(0.55)',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                    }}
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    {prevActivity.frame ? (
                      <StoryFrameRenderer
                        imageUrl={prevActivity.originalUrl || prevActivity.storageUrl}
                        isVideo={prevActivity.isVideo}
                        activity={prevActivity.activity}
                        frame={prevActivity.frame}
                        duration={prevActivity.duration}
                        pr={prevActivity.pr}
                        dayNumber={prevActivity.dayNumber}
                      />
                    ) : (
                      <img src={prevActivity.originalUrl || prevActivity.storageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
                    )}
                  </motion.div>
                )}

                {/* Next card (right, rotated) */}
                {nextActivity && !nextActivity.isPlaceholder && (
                  <motion.div
                    className="absolute overflow-hidden"
                    style={{
                      width: '46%',
                      aspectRatio: '9/16',
                      right: '-4%',
                      top: '10%',
                      borderRadius: 14,
                      transform: 'rotate(10deg)',
                      zIndex: 5,
                      filter: 'brightness(0.55)',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                    }}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    {nextActivity.frame ? (
                      <StoryFrameRenderer
                        imageUrl={nextActivity.originalUrl || nextActivity.storageUrl}
                        isVideo={nextActivity.isVideo}
                        activity={nextActivity.activity}
                        frame={nextActivity.frame}
                        duration={nextActivity.duration}
                        pr={nextActivity.pr}
                        dayNumber={nextActivity.dayNumber}
                      />
                    ) : (
                      <img src={nextActivity.originalUrl || nextActivity.storageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
                    )}
                  </motion.div>
                )}

                {/* Current card (center, front) — no border/padding */}
                <motion.div
                  className="relative overflow-hidden"
                  style={{
                    width: '62%',
                    aspectRatio: '9/16',
                    borderRadius: 4,
                    zIndex: 10,
                    boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={current.id}
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {current.isPlaceholder ? (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
                          onClick={(e) => { e.stopPropagation(); onClose(); onLogActivity?.(); }}
                          style={{
                            background: 'linear-gradient(180deg, rgba(28,28,32,1) 0%, rgba(18,18,22,1) 100%)',
                            borderRadius: 4,
                          }}
                        >
                          <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                          }} />
                          <div className="text-center px-4 mb-8 relative z-10">
                            <h2 className="text-foreground font-black text-lg tracking-tight uppercase leading-tight">Log Today's</h2>
                            <h2 className="text-foreground font-black text-lg tracking-tight uppercase leading-tight">Activity</h2>
                            <p className="text-muted-foreground text-xs mt-2 tracking-[0.2em] uppercase">Day {current.dayNumber}</p>
                          </div>
                          <div className="relative flex items-center justify-center z-10" style={{ width: 48, height: 48 }}>
                            <div className="absolute inset-0 rounded-full" style={{
                              background: 'radial-gradient(circle, rgba(15,228,152,0.4) 0%, transparent 65%)',
                              filter: 'blur(12px)',
                              transform: 'scale(2.5)',
                            }} />
                            <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                              <rect x="20" y="6" width="8" height="36" rx="4" fill="#0FE498" />
                              <rect x="6" y="20" width="36" height="8" rx="4" fill="#0FE498" />
                            </svg>
                          </div>
                        </div>
                      ) : current.frame ? (
                        <StoryFrameRenderer
                          imageUrl={current.originalUrl || current.storageUrl}
                          isVideo={current.isVideo}
                          activity={current.activity}
                          frame={current.frame}
                          duration={current.duration}
                          pr={current.pr}
                          dayNumber={current.dayNumber}
                        />
                      ) : current.isVideo ? (
                        <video src={current.originalUrl || current.storageUrl} className="absolute inset-0 w-full h-full object-cover" muted playsInline loop autoPlay />
                      ) : (
                        <img src={current.originalUrl || current.storageUrl} alt={`Day ${current.dayNumber}`} className="absolute inset-0 w-full h-full object-cover" />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Reaction stickers around the card edges */}
                  {activeReactionTypes.length > 0 && (
                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 25, overflow: 'visible' }}>
                      <Floating3DEmojis reactions={activeReactionTypes} newReaction={null} isPaused={isPaused} />
                    </div>
                  )}
                </motion.div>
              </div>
            </div>

            {/* PROFILE SECTION — avatar overlapping cards bottom, name, description, stats */}
            <div className="flex-1 min-h-0 flex flex-col items-center z-50 overflow-y-auto" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)', marginTop: 60 }}>
              {/* Avatar — above name */}
              {userProfile && (
                <div className="shrink-0 flex justify-center">
                  <div
                    className="rounded-full overflow-hidden"
                    style={{
                      width: 68,
                      height: 68,
                      border: '3px solid rgba(255,255,255,0.3)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    }}
                  >
                    <ProfileAvatar
                      src={userProfile.avatarUrl}
                      name={userProfile.displayName}
                      size={68}
                    />
                  </div>
                </div>
              )}

              {/* Name */}
              {userProfile && (
                <h2
                  className="text-white font-bold text-center mt-1.5 px-6 truncate w-full"
                  style={{ fontSize: 22, letterSpacing: '-0.02em' }}
                >
                  {userProfile.displayName}
                </h2>
              )}

              {/* Description */}
              {userDescription && (
                <p className="text-white/50 text-xs text-center mt-1.5 px-8 leading-relaxed" style={{ maxWidth: 300 }}>
                  {userDescription.diary}
                  {userDescription.varietyLine ? ` ${userDescription.varietyLine}` : ''}
                </p>
              )}

              {/* Stats pills */}
              <div className="flex items-center justify-center gap-2 mt-3 px-4">
                <div
                  className="rounded-full px-4 py-1.5 flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <span className="text-white text-xs font-semibold">{totalActivities}/12 Days</span>
                </div>
                {totalDurationStr && (
                  <div
                    className="rounded-full px-4 py-1.5 flex items-center justify-center"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <span className="text-white text-xs font-semibold">{totalDurationStr} Total</span>
                  </div>
                )}
                <div
                  className="rounded-full px-4 py-1.5 flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <span className="text-white text-xs font-semibold">W{week}</span>
                </div>
              </div>

              {/* Bottom action row */}
              <div className="shrink-0 flex items-center justify-center gap-3 px-4" style={{ marginTop: 30 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); isOwnProfile ? setShowReactsSheet(true) : setShowSendReactionSheet(true); }}
                  className="relative overflow-hidden active:scale-[0.97] transition-transform"
                  style={{
                    minWidth: currentReactions.total > 0 ? 170 : 150,
                    height: 42,
                    borderRadius: 21,
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="flex items-center justify-center gap-3 h-full px-4">
                    {currentReactions.total > 0 ? (
                      <>
                        <div className="flex -space-x-1">
                          <img src={fireEmoji} alt="fire" className="w-5 h-5 object-contain" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                          <img src={clapEmoji} alt="clap" className="w-5 h-5 object-contain" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold text-sm">{currentReactions.total}</span>
                          <span className="text-white/50 text-xs">reacts</span>
                        </div>
                        <ChevronUp className="w-3.5 h-3.5 text-white/40" />
                      </>
                    ) : !isOwnProfile ? (
                      <>
                        <img src={fireEmoji} alt="fire" className="w-4 h-4 object-contain opacity-60" />
                        <span className="text-white/60 text-xs font-medium">Tap to react</span>
                      </>
                    ) : (
                      <>
                        <img src={fireEmoji} alt="fire" className="w-4 h-4 object-contain opacity-40" />
                        <span className="text-white/50 text-xs font-medium">No reacts yet</span>
                      </>
                    )}
                  </div>
                </button>

                {((!isOwnProfile && !current.isPlaceholder) || (isOwnProfile && !hasLoggedToday)) && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (isOwnProfile) {
                        onClose();
                        onLogActivity?.();
                      } else if (user && targetUserId) {
                        const { error } = await supabase.from('nudges').insert({ from_user_id: user.id, to_user_id: targetUserId });
                        if (!error) toast('👋 Poke sent!', { description: `You nudged ${userProfile?.displayName?.split(' ')[0] || 'them'} to keep going!` });
                        else toast.error('Could not send nudge');
                      } else {
                        toast('👋 Poke sent!', { description: `You nudged ${userProfile?.displayName?.split(' ')[0] || 'them'} to keep going!` });
                      }
                    }}
                    className="shrink-0 active:scale-95 transition-transform"
                    style={{
                      width: 42, height: 42, borderRadius: 21,
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(40px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span className="text-base leading-none">{isOwnProfile ? '➕' : '👋'}</span>
                  </button>
                )}
                {canShare && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowShareOptions(true); }}
                    className="shrink-0 active:scale-95 transition-transform"
                    style={{
                      width: 42, height: 42, borderRadius: 21,
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(40px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Share2 className="w-[16px] h-[16px] text-white/70" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Reacts So Far Sheet */}
          {showReactsSheet &&
            createPortal(
              <div style={{ position: 'relative', zIndex: 70 }}>
                <ReactsSoFarSheet
                  activityId={current.id}
                  total={currentReactions.total}
                  reactions={currentReactions.reactions}
                  reactorProfiles={currentReactions.reactorProfiles}
                  onClose={() => setShowReactsSheet(false)}
                />
              </div>,
              document.body,
            )}

          {/* Send Reaction Sheet */}
          {showSendReactionSheet &&
            createPortal(
              <div style={{ position: 'relative', zIndex: 70 }}>
                <SendReactionSheet
                  activityId={current.id}
                  currentUserId={user?.id}
                  activityType={current.activity || undefined}
                  onReact={handleReact}
                  onClose={() => setShowSendReactionSheet(false)}
                  onViewReactions={() => {
                    setShowSendReactionSheet(false);
                    setShowReactsSheet(true);
                  }}
                  onReactionRemoved={(reactionType) => {
                    setLocalReactions(prev => {
                      const curr = prev[current.id];
                      if (!curr) return prev;
                      const existing = curr.reactions[reactionType];
                      const newCount = Math.max((existing?.count || 0) - 1, 0);
                      return {
                        ...prev,
                        [current.id]: {
                          ...curr,
                          total: Math.max(curr.total - 1, 0),
                          reactions: { ...curr.reactions, [reactionType]: { count: newCount, reacted: newCount > 0 } },
                          reactorProfiles: curr.reactorProfiles.filter(r => !(r.userId === user?.id && r.reactionType === reactionType)),
                        },
                      };
                    });
                  }}
                  totalReactions={currentReactions.total}
                  reactorProfiles={currentReactions.reactorProfiles}
                />
              </div>,
              document.body,
            )}

          {/* Share Options Sheet */}
          {createPortal(
            <AnimatePresence>
              {showShareOptions && (
                <>
                  <motion.div
                    className="fixed inset-0"
                    style={{ zIndex: 90, background: 'rgba(0,0,0,0.5)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowShareOptions(false)}
                  />
                  <motion.div
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] rounded-3xl p-5 flex flex-col gap-3"
                    style={{
                      zIndex: 91,
                      background: 'linear-gradient(180deg, rgba(60, 55, 70, 0.92) 0%, rgba(40, 38, 50, 0.95) 100%)',
                      backdropFilter: 'blur(60px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <h3 className="text-white font-semibold text-base text-center mb-1">Share via</h3>
                    <button
                      onClick={() => { setShowShareOptions(false); shareToChannel('whatsapp'); }}
                      className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white/90 active:scale-[0.97] transition-transform flex items-center gap-3"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      <MessageCircle className="w-5 h-5 text-green-400" />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => { setShowShareOptions(false); shareToChannel('instagram'); }}
                      className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white/90 active:scale-[0.97] transition-transform flex items-center gap-3"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      <Share2 className="w-5 h-5 text-pink-400" />
                      Instagram
                    </button>
                    <button
                      onClick={() => { setShowShareOptions(false); shareToChannel('messages'); }}
                      className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white/90 active:scale-[0.97] transition-transform flex items-center gap-3"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      <MessageCircle className="w-5 h-5 text-blue-400" />
                      Messages
                    </button>
                    <button
                      onClick={() => setShowShareOptions(false)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white/50 active:scale-[0.97] transition-transform mt-1"
                    >
                      Cancel
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body,
          )}

          {/* Edit/Replace Sheet */}
        </DynamicBlurBackground>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const editSheet = (
    <MediaSourceSheet
      isOpen={showEditSheet}
      onClose={() => setShowEditSheet(false)}
      dayNumber={current.dayNumber}
      activity={current.activity}
      preserveActivity={true}
      zIndex={80}
    />
  );

  return (
    <>
      {createPortal(overlay, portalContainer)}
      {showEditSheet && editSheet}
    </>
  );
});

export default ActivityGalleryOverlay;
