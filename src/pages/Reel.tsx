import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, ChevronUp, Trash2, Lock } from 'lucide-react';
import { ReactionType, toggleReaction, sendReaction, ActivityReaction } from '@/services/journey-service';
import { isVideoUrl } from '@/lib/media';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { fetchAllActivitiesGroupedByUser, fetchPublicFeed, UserStoryGroup, LocalActivity } from '@/hooks/use-journey-activities';
import { useJourneyActivities } from '@/hooks/use-journey-activities';
import DynamicBlurBackground from '@/components/DynamicBlurBackground';
import Floating3DEmojis from '@/components/Floating3DEmojis';
import ReactsSoFarSheet from '@/components/ReactsSoFarSheet';
import SendReactionSheet from '@/components/SendReactionSheet';
import ProfileAvatar from '@/components/ProfileAvatar';
import ReelToProgressTransition from '@/components/ReelToProgressTransition';
import MakePublicSheet from '@/components/MakePublicSheet';
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

// 3D reaction assets
import fireEmoji from '@/assets/reactions/fire-3d.png';
import clapEmoji from '@/assets/reactions/clap-3d.png';

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

// Reactor profile type from activities - includes reactionType for removal
interface ReactorProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  reactionType?: ReactionType;
}

const SWIPE_THRESHOLD = 50;

const Reel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  // State for user story groups
  const [userGroups, setUserGroups] = useState<UserStoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Current user index (horizontal swipe between users)
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  // Current activity index within current user (tap to cycle)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  
  const [showReactsSheet, setShowReactsSheet] = useState(false);
  const [showSendReactionSheet, setShowSendReactionSheet] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState<ReactionType | null>(null);
  const [localReactions, setLocalReactions] = useState<Record<string, {
    total: number;
    reactions: Record<ReactionType, ActivityReaction>;
    reactorProfiles: ReactorProfile[];
  }>>({});
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bottom sheet states and transition animations
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showProgressOverlay, setShowProgressOverlay] = useState(false);
  const bottomSheetY = useMotionValue(0);
  const bottomSheetOpacity = useTransform(bottomSheetY, [-200, 0], [0, 1]);
  const contentScale = useTransform(bottomSheetY, [-200, 0], [0.75, 1]);
  const contentOpacity = useTransform(bottomSheetY, [-100, 0], [0, 1]);
  const contentY = useTransform(bottomSheetY, [-200, 0], [50, 0]);

  // Data for progress overlay
  const { activities: myActivities, deleteActivity, hasPublicActivity, makeActivityPublic } = useJourneyActivities();
  const [publicFeed, setPublicFeed] = useState<LocalActivity[]>([]);
  
  // Privacy sheet state
  const [showMakePublicSheet, setShowMakePublicSheet] = useState(false);

  // Load public feed for progress overlay
  useEffect(() => {
    const loadFeed = async () => {
      const feed = await fetchPublicFeed();
      setPublicFeed(feed);
    };
    loadFeed();
  }, []);

  // Load all activities grouped by user
  const loadActivities = useCallback(async () => {
    setLoading(true);
    const groups = await fetchAllActivitiesGroupedByUser();
    setUserGroups(groups);
    
    // Initialize reactions state with reactor profiles
    const map: Record<string, { 
      total: number; 
      reactions: Record<ReactionType, ActivityReaction>;
      reactorProfiles: ReactorProfile[];
    }> = {};
    for (const group of groups) {
      for (const a of group.activities) {
        map[a.id] = {
          total: a.reactionCount || 0,
          reactions: a.reactions || { ...DEFAULT_REACTIONS },
          reactorProfiles: a.reactorProfiles || [],
        };
      }
    }
    setLocalReactions(map);
    
    // Check if we should start at a specific user (from navigation state)
    if (location.state?.userId && groups.length > 0) {
      const idx = groups.findIndex(g => g.userId === location.state.userId);
      if (idx >= 0) setCurrentUserIndex(idx);
    }
    
    setLoading(false);
  }, [location.state?.userId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const currentGroup = userGroups[currentUserIndex];
  const currentActivity = currentGroup?.activities[currentActivityIndex];
  const isOwnStory = user && currentGroup?.userId === user.id;
  
  // Check if activity was created within the last 24 hours
  const isWithin24Hours = currentActivity ? 
    (Date.now() - new Date(currentActivity.createdAt).getTime()) < 24 * 60 * 60 * 1000 : false;
  const canEdit = isOwnStory && isWithin24Hours;

  // Navigate between activities within current user (tap to cycle)
  const cycleActivity = useCallback(() => {
    if (!currentGroup) return;
    
    if (currentActivityIndex < currentGroup.activities.length - 1) {
      // More activities in this user's story
      setCurrentActivityIndex(prev => prev + 1);
    } else {
      // Finished this user's stories, move to next user
      if (currentUserIndex < userGroups.length - 1) {
        setCurrentUserIndex(prev => prev + 1);
        setCurrentActivityIndex(0);
      }
    }
  }, [currentGroup, currentActivityIndex, currentUserIndex, userGroups.length]);

  // Navigate to previous activity
  const prevActivity = useCallback(() => {
    if (currentActivityIndex > 0) {
      setCurrentActivityIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      // Go to previous user's last activity
      const prevUser = userGroups[currentUserIndex - 1];
      setCurrentUserIndex(prev => prev - 1);
      setCurrentActivityIndex(prevUser ? prevUser.activities.length - 1 : 0);
    }
  }, [currentActivityIndex, currentUserIndex, userGroups]);

  // Navigate between users (horizontal swipe)
  const goNextUser = useCallback(() => {
    if (userGroups.length === 0) return;
    setCurrentActivityIndex(0);
    setCurrentUserIndex(prev => (prev + 1) % userGroups.length);
  }, [userGroups.length]);

  const goPrevUser = useCallback(() => {
    if (userGroups.length === 0) return;
    setCurrentActivityIndex(0);
    setCurrentUserIndex(prev => (prev - 1 + userGroups.length) % userGroups.length);
  }, [userGroups.length]);

  // Swipe gesture handling for horizontal navigation
  const dragX = useMotionValue(0);
  const cardOpacity = useTransform(dragX, [-150, 0, 150], [0.6, 1, 0.6]);
  const cardRotate = useTransform(dragX, [-150, 0, 150], [-8, 0, 8]);
  const cardScale = useTransform(dragX, [-150, 0, 150], [0.95, 1, 0.95]);
  
  const handleHorizontalDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    
    // Horizontal swipe between users
    if (Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > 500) {
      if (offset.x < 0) {
        goNextUser();
      } else {
        goPrevUser();
      }
    }
  }, [goNextUser, goPrevUser]);

  // Bottom sheet drag handling - opens progress overlay instead of navigating
  const handleBottomSheetDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -100 || info.velocity.y < -500) {
      setIsTransitioning(true);
      // Open progress overlay with animation
      setTimeout(() => {
        setShowProgressOverlay(true);
        setIsTransitioning(false);
      }, 150);
    }
  }, []);

  const [lastTap, setLastTap] = useState(0);
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap -> heart reaction
      if (!isOwnStory) {
        handleReact('heart');
      }
    } else {
      // Single tap -> cycle to next activity
      cycleActivity();
    }
    setLastTap(now);
  }, [lastTap, cycleActivity, isOwnStory]);

  const handleNavigateToProgress = () => {
    setIsTransitioning(true);
    // Open progress overlay with smooth transition
    setTimeout(() => {
      setShowProgressOverlay(true);
      setIsTransitioning(false);
    }, 150);
  };

  const handleCloseProgressOverlay = () => {
    setShowProgressOverlay(false);
  };

  const handleProgressStoryTap = (index: number, userId?: string) => {
    setShowProgressOverlay(false);
    if (userId) {
      const idx = userGroups.findIndex(g => g.userId === userId);
      if (idx >= 0) {
        setCurrentUserIndex(idx);
        setCurrentActivityIndex(0);
      }
    }
  };

  const handleReact = async (type: ReactionType) => {
    if (!currentActivity || isOwnStory) return; // Owners cannot react to their own activities

    setFloatingReaction(type);
    setTimeout(() => setFloatingReaction(null), 1200);
    setShowSendReactionSheet(false);

    setLocalReactions(prev => {
      const existing = prev[currentActivity.id] || { total: 0, reactions: { ...DEFAULT_REACTIONS }, reactorProfiles: [] };
      const newReactions = { ...existing.reactions };
      newReactions[type] = {
        ...newReactions[type],
        count: newReactions[type].count + 1,
        userReacted: true,
      };
      // Add current user to reactor profiles if not already there
      const newReactorProfiles = [...existing.reactorProfiles];
      if (profile && !newReactorProfiles.some(p => p.userId === user?.id)) {
        newReactorProfiles.unshift({
          userId: user?.id || '',
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
        });
      }
      return {
        ...prev,
        [currentActivity.id]: {
          total: existing.total + 1,
          reactions: newReactions,
          reactorProfiles: newReactorProfiles,
        },
      };
    });

    await sendReaction(currentActivity.id, type);
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleDeleteActivity = async () => {
    if (!currentActivity) return;
    
    setIsDeleting(true);
    const success = await deleteActivity(currentActivity.dayNumber);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    
    if (success) {
      // Refresh the data
      const groups = await fetchAllActivitiesGroupedByUser();
      setUserGroups(groups);
      
      // If no more activities, go back
      if (groups.length === 0 || !groups.some(g => g.activities.length > 0)) {
        navigate(-1);
        return;
      }
      
      // If current user has no more activities, move to next user
      const updatedGroup = groups[currentUserIndex];
      if (!updatedGroup || updatedGroup.activities.length === 0) {
        if (currentUserIndex > 0) {
          setCurrentUserIndex(prev => prev - 1);
        } else if (groups.length > 0) {
          setCurrentUserIndex(0);
        }
        setCurrentActivityIndex(0);
      } else if (currentActivityIndex >= updatedGroup.activities.length) {
        setCurrentActivityIndex(Math.max(0, updatedGroup.activities.length - 1));
      }
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') goNextUser();
      if (e.key === 'ArrowLeft') goPrevUser();
      if (e.key === ' ') cycleActivity();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNextUser, goPrevUser, cycleActivity]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white/60">Loading stories...</div>
      </div>
    );
  }

  if (!userGroups.length || !currentGroup || !currentActivity) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4">
        <div className="text-white/60">No stories yet</div>
        <button
          onClick={handleClose}
          className="px-4 py-2 rounded-full text-white/80 bg-white/10"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Use templated/framed image (storageUrl) for display
  // storageUrl is always the templated PNG screenshot - check the actual URL extension
  const mediaUrl = currentActivity.storageUrl;
  const isVideo = isVideoUrl(mediaUrl); // Only check URL, not the isVideo flag
  const currentReactions = localReactions[currentActivity.id] || { total: 0, reactions: { ...DEFAULT_REACTIONS }, reactorProfiles: [] };
  
  const activeReactionTypes = Object.entries(currentReactions.reactions)
    .filter(([, r]) => r.count > 0)
    .map(([type]) => type as ReactionType);

  // Calculate week and day
  const week = Math.ceil(currentActivity.dayNumber / 3);
  const dayInWeek = ((currentActivity.dayNumber - 1) % 3) + 1;

  // Fixed zone heights for layout
  const HEADER_HEIGHT = 100; // Row: delete + avatars + close + user name
  const BOTTOM_HEIGHT = 100; // Reaction pill + view progress

  return (
    <DynamicBlurBackground imageUrl={mediaUrl}>
      {/* Fixed height container - no vertical scroll */}
      <div 
        className="fixed inset-0 flex flex-col"
        style={{ 
          height: '100dvh',
          minHeight: '-webkit-fill-available',
          overflow: 'hidden',
        }}
      >
        {/* Floating 3D emojis around edges */}
        <Floating3DEmojis 
          reactions={activeReactionTypes}
          newReaction={floatingReaction}
        />

        {/* FIXED HEADER ZONE - Single row: delete, avatars, close + user name below */}
        <div 
          className="shrink-0 z-50 flex flex-col"
          style={{ 
            paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)',
          }}
        >
          {/* Row 1: Delete + Avatars + Close - all in one row */}
          <motion.div
            className="flex items-center justify-between px-3 shrink-0"
            style={{ height: 56 }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Left side - Delete button */}
            <div className="w-10 shrink-0">
              {canEdit && (
                <motion.button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 transition-colors rounded-full text-white/80 hover:text-red-400 min-w-[40px] min-h-[40px] flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                </motion.button>
              )}
            </div>

            {/* Center - User avatars strip - ALWAYS show clear profile photos */}
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-2">
                {userGroups.slice(0, 5).map((group, idx) => {
                  const isActive = idx === currentUserIndex;
                  const activityCount = group.activities.length;
                  const currentIdx = idx === currentUserIndex ? currentActivityIndex : 0;
                  const isOwnProfile = user && group.userId === user.id;
                  // Stories are locked, but profile photos are ALWAYS visible
                  const isStoryLocked = !isOwnProfile && !hasPublicActivity;
                  const avatarSize = isActive ? 48 : 40;
                  
                  return (
                    <motion.button
                      key={group.userId}
                      onClick={() => {
                        setCurrentUserIndex(idx);
                        setCurrentActivityIndex(0);
                      }}
                      className="relative"
                      whileTap={{ scale: 0.9 }}
                      animate={{ scale: isActive ? 1 : 0.9 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      {/* Instagram-style story ring - dim if story is locked */}
                      <svg
                        className="absolute inset-0"
                        style={{
                          width: avatarSize,
                          height: avatarSize,
                          transform: 'rotate(-90deg)',
                        }}
                        viewBox="0 0 100 100"
                      >
                        {Array.from({ length: activityCount }).map((_, segIdx) => {
                          const gapAngle = activityCount > 1 ? 10 : 0;
                          const totalGap = gapAngle * activityCount;
                          const segmentAngle = (360 - totalGap) / activityCount;
                          const startAngle = segIdx * (segmentAngle + gapAngle);
                          const isSegmentViewed = segIdx <= currentIdx;
                          
                          const radius = 44;
                          const circumference = 2 * Math.PI * radius;
                          const segmentLength = (segmentAngle / 360) * circumference;
                          const offset = (startAngle / 360) * circumference;
                          
                          return (
                            <circle
                              key={segIdx}
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              strokeWidth="6"
                              stroke={isStoryLocked ? 'rgba(255,255,255,0.15)' : (isActive && isSegmentViewed ? 'url(#storyGradient)' : 'rgba(255,255,255,0.25)')}
                              strokeDasharray={`${segmentLength} ${circumference}`}
                              strokeDashoffset={-offset}
                              strokeLinecap="round"
                              style={{
                                filter: !isStoryLocked && isActive && isSegmentViewed ? 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.5))' : 'none',
                              }}
                            />
                          );
                        })}
                        <defs>
                          <linearGradient id="storyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FEDA75" />
                            <stop offset="25%" stopColor="#FA7E1E" />
                            <stop offset="50%" stopColor="#D62976" />
                            <stop offset="75%" stopColor="#962FBF" />
                            <stop offset="100%" stopColor="#4F5BD5" />
                          </linearGradient>
                        </defs>
                      </svg>
                      
                      {/* Avatar - ALWAYS visible and clear (never locked/blurred) */}
                      <div
                        className="relative"
                        style={{
                          width: avatarSize,
                          height: avatarSize,
                          padding: 4,
                        }}
                      >
                        <div className="w-full h-full rounded-full overflow-hidden">
                          <ProfileAvatar
                            src={group.avatarUrl}
                            name={group.displayName}
                            size={avatarSize - 8}
                            style={{
                              opacity: isActive ? 1 : 0.7,
                              transition: 'all 0.2s ease',
                              // Profile photos are NEVER blurred - only stories are locked
                            }}
                          />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
            
            {/* Right side - Close button */}
            <div className="w-10 shrink-0 flex justify-end">
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white transition-colors p-2 min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <X className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>

          {/* Row 2: Current user name/info */}
          <div className="flex items-center justify-center gap-2 shrink-0 px-4 pb-2" style={{ height: 28 }}>
            <span className="text-white font-semibold text-sm">{currentGroup.displayName}</span>
            <span className="text-white/40">•</span>
            <span className="text-white/60 text-xs">Week {week} • Day {dayInWeek}</span>
          </div>
        </div>

        {/* MAIN CONTENT ZONE - flexible middle section */}
        <div
          className="flex-1 flex items-center justify-center z-30 overflow-hidden px-4"
        >
          <motion.div
            className="w-full h-full flex items-center justify-center"
            style={{ 
              scale: contentScale,
              opacity: contentOpacity,
              y: contentY,
            }}
          >
            {/* Card container with horizontal swipe */}
            <motion.div 
              className="relative w-full max-w-[340px] cursor-grab active:cursor-grabbing flex items-center justify-center"
              style={{ 
                maxHeight: '100%',
                x: dragX,
                opacity: cardOpacity,
                rotate: cardRotate,
                scale: cardScale,
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleHorizontalDragEnd}
              onClick={handleTap}
            >
              {/* Full templated image/video - with lock overlay for non-public users */}
              {(() => {
                const shouldShowLocked = !isOwnStory && !hasPublicActivity;
                
                return (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentActivity.id}
                      className="relative w-full flex items-center justify-center"
                      initial={{ opacity: 0, scale: 0.92, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                    >
                      {isVideo ? (
                        <video
                          src={mediaUrl}
                          className="w-full h-auto rounded-2xl"
                          style={{ 
                            maxHeight: 'calc(100dvh - 240px)',
                            objectFit: 'contain',
                            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.4)',
                            filter: shouldShowLocked ? 'blur(20px)' : 'none',
                          }}
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={`Day ${currentActivity.dayNumber}`}
                          className="w-full h-auto rounded-2xl"
                          style={{ 
                            maxHeight: 'calc(100dvh - 240px)',
                            objectFit: 'contain',
                            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.4)',
                            filter: shouldShowLocked ? 'blur(20px)' : 'none',
                          }}
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (!img.dataset.retried) {
                              img.dataset.retried = "true";
                              img.src = mediaUrl + "?t=" + Date.now();
                            }
                          }}
                        />
                      )}
                      
                      {/* Lock overlay for locked content */}
                      {shouldShowLocked && (
                        <motion.div
                          className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <motion.div
                            className="flex flex-col items-center gap-3"
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                          >
                            <div 
                              className="w-16 h-16 rounded-full flex items-center justify-center"
                              style={{
                                background: 'rgba(255,255,255,0.12)',
                                backdropFilter: 'blur(16px)',
                                border: '2px solid rgba(255,255,255,0.25)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                              }}
                            >
                              <Lock className="w-7 h-7 text-white" />
                            </div>
                            
                            <div className="text-center px-6">
                              <p className="text-white font-semibold text-lg">Share to see others</p>
                              <p className="text-white/60 text-sm mt-1">
                                Make your workout public to unlock
                              </p>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const latestActivity = myActivities[myActivities.length - 1];
                                if (latestActivity) {
                                  setShowMakePublicSheet(true);
                                }
                              }}
                              className="mt-2 px-6 py-2.5 rounded-full font-semibold text-sm active:scale-95 transition-transform"
                              style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,240,240,0.95) 100%)',
                                color: '#000',
                                boxShadow: '0 4px 20px rgba(255,255,255,0.2)',
                              }}
                            >
                              Share my progress
                            </button>
                          </motion.div>
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                );
              })()}
            </motion.div>
          </motion.div>
        </div>

        {/* FIXED BOTTOM ZONE - Reaction pill + View Progress - always visible */}
        <div 
          className="shrink-0 z-40 flex flex-col items-center"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)',
          }}
        >
          {(() => {
            const isContentLocked = !isOwnStory && !hasPublicActivity;
            
            return (
              <motion.div 
                className="w-full flex flex-col items-center"
                style={{
                  pointerEvents: isContentLocked ? 'none' : 'auto',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: (isTransitioning || isContentLocked) ? 0 : 1, y: isTransitioning ? -100 : 0 }}
                transition={{ delay: 0.4 }}
              >
                {/* Liquid glass reaction pill */}
                <motion.button
                  onClick={() => isOwnStory ? (currentReactions.total > 0 && setShowReactsSheet(true)) : setShowSendReactionSheet(true)}
                  className="relative overflow-hidden mb-2"
                  style={{
                    minWidth: currentReactions.total > 0 ? 200 : 180,
                    height: 48,
                    borderRadius: 24,
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  layout
                >
                  <AnimatePresence mode="wait">
                    {isOwnStory ? (
                      <motion.div
                        key="owner-pill"
                        className="flex items-center justify-center gap-3 h-full px-5"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      >
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
                      </motion.div>
                    ) : (
                      <motion.div
                        key="visitor-pill"
                        className="flex items-center justify-center gap-3 h-full px-5"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      >
                        {currentReactions.total > 0 ? (
                          <>
                            <div className="flex -space-x-1">
                              <img src={fireEmoji} alt="fire" className="w-5 h-5 object-contain" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                              <img src={clapEmoji} alt="clap" className="w-5 h-5 object-contain" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                            </div>
                            <span className="text-white font-bold text-sm">{currentReactions.total}</span>
                            <div className="w-px h-4 bg-white/20" />
                            <span className="text-white/70 text-sm">Tap to react</span>
                          </>
                        ) : (
                          <>
                            <ProfileAvatar
                              src={profile?.avatar_url}
                              name={profile?.display_name || 'You'}
                              size={26}
                              style={{
                                border: '2px solid rgba(255, 255, 255, 0.25)',
                              }}
                            />
                            <span className="text-white/80 text-sm font-medium">Be first to react!</span>
                            <div className="flex -space-x-1">
                              <img src={fireEmoji} alt="fire" className="w-4 h-4 object-contain opacity-60" />
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            );
          })()}

          {/* View Progress button - always visible sticky */}
          <motion.div
            className="w-full"
            style={{ y: bottomSheetY }}
            drag="y"
            dragConstraints={{ top: -200, bottom: 0 }}
            dragElastic={{ top: 0.3, bottom: 0 }}
            onDragEnd={handleBottomSheetDragEnd}
          >
            <div
              className="w-full flex flex-col items-center cursor-grab active:cursor-grabbing"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <div className="pt-2 pb-1 flex justify-center">
                <div 
                  className="w-9 h-1 rounded-full"
                  style={{ background: 'rgba(255, 255, 255, 0.3)' }}
                />
              </div>
              
              <button
                onClick={handleNavigateToProgress}
                className="w-full flex items-center justify-center gap-2 py-2.5 active:bg-white/5 transition-colors"
              >
                <ChevronUp className="w-5 h-5 text-white/60" />
                <span className="text-white/80 text-sm font-medium">View Progress</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reacts bottom sheet for own stories */}
      <AnimatePresence>
        {showReactsSheet && (
          <ReactsSoFarSheet
            activityId={currentActivity?.id || ''}
            total={currentReactions.total}
            reactions={currentReactions.reactions}
            reactorProfiles={currentReactions.reactorProfiles}
            onClose={() => setShowReactsSheet(false)}
            onReactionRemoved={loadActivities}
          />
        )}
      </AnimatePresence>

      {/* Send reaction sheet for all stories */}
      <AnimatePresence>
        {showSendReactionSheet && (
          <SendReactionSheet
            activityId={currentActivity?.id}
            currentUserId={user?.id}
            onReact={handleReact}
            onClose={() => setShowSendReactionSheet(false)}
            onViewReactions={() => {
              setShowSendReactionSheet(false);
              setShowReactsSheet(true);
            }}
            onReactionRemoved={loadActivities}
            totalReactions={currentReactions.total}
            reactorProfiles={currentReactions.reactorProfiles}
          />
        )}
      </AnimatePresence>

      {/* Progress overlay - inline transition without page navigation */}
      <ReelToProgressTransition
        isOpen={showProgressOverlay}
        onClose={handleCloseProgressOverlay}
        currentActivity={currentActivity ? {
          id: currentActivity.id,
          storageUrl: currentActivity.storageUrl,
          originalUrl: currentActivity.originalUrl,
          isVideo: currentActivity.isVideo,
          dayNumber: currentActivity.dayNumber,
          avatarUrl: currentGroup?.avatarUrl,
          displayName: currentGroup?.displayName,
          userId: currentGroup?.userId,
          createdAt: currentActivity.createdAt,
        } : null}
        publicFeed={publicFeed.map(p => ({
          id: p.id,
          storageUrl: p.storageUrl,
          originalUrl: p.originalUrl,
          isVideo: p.isVideo,
          dayNumber: p.dayNumber,
          avatarUrl: p.avatarUrl,
          displayName: p.displayName,
          userId: p.userId,
          createdAt: p.createdAt,
        }))}
        myActivities={myActivities.map(a => ({ dayNumber: a.dayNumber }))}
        onStoryTap={handleProgressStoryTap}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete this activity?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will permanently remove Day {currentActivity?.dayNumber} from your journey. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:justify-center">
            <AlertDialogCancel 
              className="flex-1 m-0 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteActivity}
              className="flex-1 m-0 bg-red-600 text-white hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Make Public Sheet */}
      <MakePublicSheet
        isOpen={showMakePublicSheet}
        onClose={() => setShowMakePublicSheet(false)}
        onMakePublic={async () => {
          const latestActivity = myActivities[myActivities.length - 1];
          if (latestActivity) {
            await makeActivityPublic(latestActivity.dayNumber);
          }
          setShowMakePublicSheet(false);
          loadActivities();
        }}
        onKeepPrivate={() => setShowMakePublicSheet(false)}
      />
    </DynamicBlurBackground>
  );
};

export default Reel;
