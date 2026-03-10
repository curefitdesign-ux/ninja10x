import { useState, useRef, useEffect, useCallback, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { X, Share2, Pencil, ChevronUp } from 'lucide-react';
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
}

const ActivityGalleryOverlay = forwardRef<HTMLDivElement, ActivityGalleryOverlayProps>(function ActivityGalleryOverlay({
  isOpen,
  onClose,
  activities,
  initialIndex = 0,
  onLogActivity,
  userProfile,
  isOwnProfile,
}, _ref) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const portalContainer = usePortalContainer();
  const { user } = useAuth();

  // Sheets
  const [showReactsSheet, setShowReactsSheet] = useState(false);
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
  const isPaused = showReactsSheet || showEditSheet;

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
            {/* TOP ZONE: counter | progress segments | close */}
            <div
              className="z-50 flex items-center justify-between px-4 shrink-0"
              style={{
                paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)',
                height: 56,
              }}
            >
              {/* Counter pill */}
              <div
                className="px-3 py-1.5 rounded-full text-white/70 text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                {currentIndex + 1} / {totalActivities}
              </div>

              {/* Progress segments */}
              <div className="flex-1 flex items-center gap-1 mx-3">
                {activities.map((a, i) => {
                  const isPlaceholder = !!a.isPlaceholder;
                  const isCurrent = i === currentIndex;
                  const isPast = i < currentIndex;

                  if (isPlaceholder) {
                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-center"
                        style={{ width: 8 }}
                      >
                        <div
                          className="rounded-full"
                          style={{
                            width: isCurrent ? 8 : 5,
                            height: isCurrent ? 8 : 5,
                            background: isCurrent ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
                            transition: 'all 0.3s ease',
                          }}
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={a.id}
                      className="flex-1 h-[3px] rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.15)' }}
                    >
                      <div
                        key={isCurrent ? `${a.id}-${progressRunKey}` : `${a.id}-static`}
                        className="h-full rounded-full"
                        style={{
                          background: (isPast || isCurrent) ? 'rgba(255,255,255,0.9)' : 'transparent',
                          width: isPast ? '100%'
                            : isCurrent ? `${autoAdvanceProgress * 100}%` : '0%',
                          transition: isCurrent
                            ? (autoAdvanceProgress > 0 ? `width ${AUTO_ADVANCE_MS}ms linear` : 'none')
                            : 'none',
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Close button */}
              <motion.button
                className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onClick={onClose}
                whileTap={{ scale: 0.85 }}
              >
                <X className="w-5 h-5 text-white/80" />
              </motion.button>
            </div>

            {/* User profile header + journey description */}
            <div className="shrink-0 z-30 px-4 pb-2">
              {userProfile ? (
                <div>
                  <div className="flex items-start gap-3">
                    <ProfileAvatar
                      src={userProfile.avatarUrl}
                      name={userProfile.displayName}
                      size={44}
                      style={{
                        border: '2px solid rgba(255, 255, 255, 0.25)',
                        flexShrink: 0,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-bold text-sm truncate">{userProfile.displayName}</p>
                        {userDescription && (
                          <span className="text-white/50 text-[11px] font-medium shrink-0">{userDescription.count}/12</span>
                        )}
                        <div
                          className="px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: 'rgba(255,255,255,0.08)' }}
                        >
                          <span className="text-white/60 text-[10px] font-medium">
                            W{week} • D{dayInWeek}
                          </span>
                        </div>
                      </div>
                      {userDescription && (
                        <>
                          <p className="mt-0.5 text-[11px] leading-snug text-white/60">
                            {userDescription.diary}
                          </p>
                          {userDescription.varietyLine && (
                            <p className="text-[11px] leading-snug text-white/60">
                              {userDescription.varietyLine}
                            </p>
                          )}
                          {userDescription.durationLine && (
                            <p className="text-[11px] leading-snug text-white/50">
                              {userDescription.durationLine}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2" style={{ height: 20 }}>
                  <span className="text-white/60 text-xs">
                    Week {week} • Day {dayInWeek}
                  </span>
                </div>
              )}
            </div>

            {/* MIDDLE CONTAINER — card fills available space */}
            <div
              className="relative z-30 flex-1 min-h-0 flex flex-col"
              style={{
                paddingTop: 0,
                marginTop: '-8px',
                paddingBottom: 'max(env(safe-area-inset-bottom, 6px), 6px)',
              }}
            >
              <motion.div
                className="relative min-h-0 flex-1 flex items-center justify-center"
                onClick={handleTap}
                onPanEnd={(_e, info: PanInfo) => {
                  const swipeThreshold = 50;
                  if (info.offset.x < -swipeThreshold) goNext();
                  else if (info.offset.x > swipeThreshold) goPrev();
                }}
                style={{ touchAction: 'pan-y' }}
              >
                <div
                  className="relative flex items-center justify-center"
                  style={{ width: '100%', height: '100%' }}
                >
                  {/* 9:16 Card */}
                  <motion.div
                    className="relative overflow-hidden"
                    style={{
                      aspectRatio: '9/16',
                      height: '90%',
                      maxWidth: '100%',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      background: 'transparent',
                    }}
                  >
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        key={current.id}
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 0, x: 60, scale: 0.97 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -60, scale: 0.97 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {current.isPlaceholder ? (
                          <div
                            className="w-[90%] aspect-[9/16] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden self-center"
                            onClick={(e) => { e.stopPropagation(); onClose(); onLogActivity?.(); }}
                            style={{
                              background: 'linear-gradient(180deg, rgba(28,28,32,1) 0%, rgba(18,18,22,1) 100%)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 20,
                            }}
                          >
                            <div className="absolute inset-0" style={{
                              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
                              backgroundSize: '20px 20px',
                            }} />
                            <div className="text-center px-6 mb-10 relative z-10">
                              <h2 className="text-foreground font-black text-2xl tracking-tight uppercase leading-tight">Log Your</h2>
                              <h2 className="text-foreground font-black text-2xl tracking-tight uppercase leading-tight">Today's Activity</h2>
                              <p className="text-muted-foreground text-sm mt-3 tracking-[0.2em] uppercase">Day {current.dayNumber}</p>
                            </div>
                            <div className="relative flex items-center justify-center z-10" style={{ width: 64, height: 64 }}>
                              <div className="absolute inset-0 rounded-full" style={{
                                background: 'radial-gradient(circle, rgba(15,228,152,0.4) 0%, transparent 65%)',
                                filter: 'blur(16px)',
                                transform: 'scale(2.5)',
                              }} />
                              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
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
                          <video
                            src={current.originalUrl || current.storageUrl}
                            className="absolute inset-0 w-full h-full object-cover"
                            muted playsInline loop autoPlay
                          />
                        ) : (
                          <img
                            src={current.originalUrl || current.storageUrl}
                            alt={`Day ${current.dayNumber}`}
                            className="absolute inset-0 w-full h-full object-cover"
                            onLoad={() => setLoadedMediaUrl(mediaUrl)}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>

                  {/* Floating emoji reactions */}
                  {activeReactionTypes.length > 0 && (
                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 25, overflow: 'hidden', borderRadius: '20px' }}>
                      <Floating3DEmojis
                        reactions={activeReactionTypes}
                        newReaction={null}
                        isPaused={isPaused}
                      />
                      <StoryEmojiRain
                        triggerKey={`${currentIndex}`}
                        reactions={activeReactionTypes}
                        active={activeReactionTypes.length > 0}
                      />
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Bottom action row: reaction pill + share + delete */}
              <div className="shrink-0 flex flex-col items-center justify-center pt-3 pb-2" style={{ minHeight: 56 }}>
                <div
                  className="w-full flex flex-col items-center"
                  style={{ transform: 'translateY(-32px)' }}
                >
                  <div className="flex items-center justify-center gap-3 px-4">
                    {/* Reaction pill — own stories show "Reacts So Far" */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowReactsSheet(true); }}
                      className="relative overflow-hidden active:scale-[0.97] transition-transform"
                      style={{
                        minWidth: currentReactions.total > 0 ? 180 : 160,
                        height: 44,
                        borderRadius: 22,
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(40px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <div className="flex items-center justify-center gap-3 h-full px-5">
                        {currentReactions.total > 0 ? (
                          <>
                            <div className="flex -space-x-1">
                              <img src={fireEmoji} alt="fire" className="w-6 h-6 object-contain" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                              <img src={clapEmoji} alt="clap" className="w-6 h-6 object-contain" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-bold text-base">{currentReactions.total}</span>
                              <span className="text-white/50 text-sm">reacts</span>
                            </div>
                            <ChevronUp className="w-4 h-4 text-white/40" />
                          </>
                        ) : (
                          <>
                            <img src={fireEmoji} alt="fire" className="w-5 h-5 object-contain opacity-40" />
                            <span className="text-white/50 text-sm font-medium">No reacts yet</span>
                          </>
                        )}
                      </div>
                    </button>

                    {/* Nudge & Share buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!isOwnProfile && !current.isPlaceholder && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toast('👋 Poke sent!', { description: `You nudged ${userProfile?.displayName?.split(' ')[0] || 'them'} to keep going!` });
                          }}
                          className="shrink-0 active:scale-95 transition-transform"
                          style={{
                            width: 44, height: 44, borderRadius: 22,
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(40px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <span className="text-lg leading-none">👋</span>
                        </button>
                      )}
                      {canShare && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowShareOptions(true); }}
                          className="shrink-0 active:scale-95 transition-transform"
                          style={{
                            width: 44, height: 44, borderRadius: 22,
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(40px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Share2 className="w-[18px] h-[18px] text-white/70" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reacts So Far Sheet */}
          {showReactsSheet &&
            createPortal(
              <ReactsSoFarSheet
                activityId={current.id}
                total={currentReactions.total}
                reactions={currentReactions.reactions}
                reactorProfiles={currentReactions.reactorProfiles}
                onClose={() => setShowReactsSheet(false)}
              />,
              document.body,
            )}

          {/* Share Options Sheet — portaled to body to avoid clipping */}
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

          {/* Edit/Replace Sheet — rendered outside the overlay via portal to document.body */}
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
