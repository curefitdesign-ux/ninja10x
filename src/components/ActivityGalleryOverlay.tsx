import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, Share2, Trash2, ChevronUp } from 'lucide-react';
import { createPortal } from 'react-dom';
import { usePortalContainer } from '@/hooks/use-portal-container';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { ReactionType, ActivityReaction, sendReaction } from '@/services/journey-service';
import { useJourneyActivities } from '@/hooks/use-journey-activities';
import StoryFrameRenderer from '@/components/StoryFrameRenderer';
import DynamicBlurBackground from '@/components/DynamicBlurBackground';
import ReactsSoFarSheet from '@/components/ReactsSoFarSheet';
import ProfileAvatar from '@/components/ProfileAvatar';
import Floating3DEmojis from '@/components/Floating3DEmojis';
import StoryEmojiRain from '@/components/StoryEmojiRain';
import { isVideoUrl } from '@/lib/media';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import fireEmoji from '@/assets/reactions/fire-3d.png';
import clapEmoji from '@/assets/reactions/clap-3d.png';

interface ReactorProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  reactionType?: ReactionType;
  createdAt?: string;
}

const DEFAULT_REACTIONS: Record<ReactionType, ActivityReaction> = {
  heart: { type: 'heart', count: 0, userReacted: false },
  clap: { type: 'clap', count: 0, userReacted: false },
  fistbump: { type: 'fistbump', count: 0, userReacted: false },
  wow: { type: 'wow', count: 0, userReacted: false },
  fire: { type: 'fire', count: 0, userReacted: false },
  flex: { type: 'flex', count: 0, userReacted: false },
  trophy: { type: 'trophy', count: 0, userReacted: false },
  runner: { type: 'runner', count: 0, userReacted: false },
  energy: { type: 'energy', count: 0, userReacted: false },
  timer: { type: 'timer', count: 0, userReacted: false },
};

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
  reactions?: Record<ReactionType, ActivityReaction>;
  reactorProfiles?: ReactorProfile[];
  isPlaceholder?: boolean;
}

interface ActivityGalleryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activities: GalleryActivity[];
  initialIndex?: number;
  onLogActivity?: () => void;
}

export default function ActivityGalleryOverlay({
  isOpen,
  onClose,
  activities,
  initialIndex = 0,
  onLogActivity,
}: ActivityGalleryOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const portalContainer = usePortalContainer();
  const { user } = useAuth();
  const { deleteActivity } = useJourneyActivities();

  // Sheets
  const [showReactsSheet, setShowReactsSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Local reactions state
  const [localReactions, setLocalReactions] = useState<Record<string, {
    total: number;
    reactions: Record<ReactionType, ActivityReaction>;
    reactorProfiles: ReactorProfile[];
  }>>({});

  // Auto-advance timer
  const AUTO_ADVANCE_MS = 10000;
  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);
  const isPaused = showReactsSheet || showDeleteConfirm;

  // Media loading
  const [loadedMediaUrl, setLoadedMediaUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      // Initialize local reactions
      const map: Record<string, { total: number; reactions: Record<ReactionType, ActivityReaction>; reactorProfiles: ReactorProfile[] }> = {};
      for (const a of activities) {
        map[a.id] = {
          total: a.reactionCount || 0,
          reactions: a.reactions || { ...DEFAULT_REACTIONS },
          reactorProfiles: a.reactorProfiles || [],
        };
      }
      setLocalReactions(map);
    }
  }, [isOpen, initialIndex, activities]);

  // Reset progress on index change
  useEffect(() => {
    setAutoAdvanceProgress(0);
  }, [currentIndex]);

  // Auto-advance
  useEffect(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    if (!isOpen || isPaused || activities.length <= 1) return;

    const current = activities[currentIndex];
    if (!current || current.isPlaceholder) return;

    setAutoAdvanceProgress(1);
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

  // Can edit: latest activity only, within 24h
  const maxDayNumber = Math.max(...activities.filter(a => !a.isPlaceholder).map(a => a.dayNumber));
  const isLatest = current.dayNumber === maxDayNumber;
  const isWithin24h = current.storageUrl ? true : false; // Activities in gallery are the user's own
  const canEdit = isLatest && !current.isPlaceholder;

  const goNext = () => setCurrentIndex(i => Math.min(i + 1, activities.length - 1));
  const goPrev = () => setCurrentIndex(i => Math.max(i - 1, 0));

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    if (tapX < rect.width * 0.35) goPrev();
    else goNext();
  };

  const handleShareStory = async () => {
    try {
      const activityName = current.activity || 'workout';
      const shareText = `Check out my ${activityName} on my fitness journey! 💪`;
      if (navigator.share) {
        const shareData: ShareData = { title: 'My Fitness Story', text: shareText };
        if (mediaUrl) {
          try {
            const response = await fetch(mediaUrl);
            const blob = await response.blob();
            const ext = current.isVideo ? 'mp4' : 'jpg';
            const file = new File([blob], `story.${ext}`, { type: blob.type });
            if (navigator.canShare?.({ files: [file] })) shareData.files = [file];
          } catch {
            if (mediaUrl.startsWith('http')) shareData.url = mediaUrl;
          }
        }
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Copied to clipboard!');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') toast.error('Failed to share');
    }
  };

  const handleDeleteActivity = async () => {
    setIsDeleting(true);
    const success = await deleteActivity(current.dayNumber);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    if (success) {
      if (activities.length <= 1) {
        onClose();
      } else if (currentIndex >= activities.length - 1) {
        setCurrentIndex(Math.max(0, activities.length - 2));
      }
    }
  };

  const overlay = (
    <AnimatePresence>
      {isOpen && (
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
                {activities.filter(a => !a.isPlaceholder).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-[3px] rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.15)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: i < currentIndex ? 'rgba(255,255,255,0.9)'
                          : i === currentIndex ? 'linear-gradient(90deg, #F97316, #EC4899)' 
                          : 'transparent',
                        width: i < currentIndex ? '100%'
                          : i === currentIndex ? '100%' : '0%',
                        transition: i === currentIndex && autoAdvanceProgress > 0
                          ? `width ${AUTO_ADVANCE_MS}ms linear`
                          : 'width 0.3s ease',
                      }}
                    />
                  </div>
                ))}
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

            {/* User name + week/day info */}
            <div className="shrink-0 pb-1 z-30">
              <div className="flex items-center justify-center gap-2" style={{ height: 20 }}>
                <span className="text-white/60 text-xs">
                  Week {week} • Day {dayInWeek}
                </span>
              </div>
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
              <div className="relative min-h-0 flex-1 flex items-center justify-center" onClick={handleTap}>
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
              </div>

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

                    {/* Share & Delete buttons */}
                    {canEdit && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleShareStory(); }}
                          className="shrink-0 active:scale-95 transition-transform"
                          style={{
                            width: 44, height: 44, borderRadius: 22,
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(40px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Share2 className="w-[18px] h-[18px] text-white/80" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                          className="shrink-0 active:scale-95 transition-transform"
                          style={{
                            width: 44, height: 44, borderRadius: 22,
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(40px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Trash2 className="w-[18px] h-[18px] text-white/60" strokeWidth={1.5} />
                        </button>
                      </div>
                    )}
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
              portalContainer,
            )}

          {/* Delete confirmation */}
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent
              className="text-white max-w-[320px] rounded-3xl border-0 p-0 overflow-hidden"
              style={{ background: 'transparent', boxShadow: 'none' }}
            >
              <div
                className="relative rounded-3xl p-px overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.18) 70%, rgba(255,255,255,0.04) 100%)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 32px 64px rgba(0,0,0,0.6)',
                }}
              >
                <div
                  className="relative rounded-[23px] overflow-hidden"
                  style={{
                    background: 'rgba(30,28,40,0.35)',
                    backdropFilter: 'blur(60px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(60px) saturate(180%)',
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-px" style={{
                    background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.55) 60%, transparent 95%)',
                  }} />
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(160,120,240,0.18) 0%, transparent 60%)',
                  }} />
                  <div className="px-6 pt-7 pb-6">
                    <AlertDialogHeader className="mb-5">
                      <AlertDialogTitle className="text-white text-center text-[18px] font-bold tracking-tight">
                        Delete this activity?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-center text-sm leading-relaxed mt-2" style={{ color: 'rgba(200,185,230,0.7)' }}>
                        This will permanently remove Day {current.dayNumber} from your journey. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-3 sm:justify-center mt-1">
                      <AlertDialogCancel
                        className="flex-1 m-0 h-12 rounded-2xl text-white font-semibold text-[15px] active:scale-[0.97] transition-transform border-0 hover:bg-transparent focus:ring-0"
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                        }}
                        disabled={isDeleting}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteActivity}
                        className="flex-1 m-0 h-12 rounded-2xl text-white font-semibold text-[15px] active:scale-[0.97] transition-transform border-0"
                        style={{
                          background: 'linear-gradient(135deg, rgba(239,68,68,0.85) 0%, rgba(185,28,28,0.9) 100%)',
                          boxShadow: 'inset 0 1px 0 rgba(255,150,150,0.3), 0 4px 16px rgba(239,68,68,0.35)',
                        }}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </div>
                </div>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </DynamicBlurBackground>
      )}
    </AnimatePresence>
  );

  return createPortal(overlay, portalContainer);
}
