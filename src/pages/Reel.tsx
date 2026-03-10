import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { createPortal } from 'react-dom';
import StoryFrameRenderer from '@/components/StoryFrameRenderer';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronUp, Pencil, Lock, ChevronRight, Volume2, VolumeX, RefreshCw, Share2, RotateCcw, Sparkles, Download, Play, Pause, History } from 'lucide-react';
import PullToRefresh from '@/components/PullToRefresh';
import ProfileMenu from '@/components/ProfileMenu';
import { ReactionType, toggleReaction, sendReaction, ActivityReaction } from '@/services/journey-service';
import { isVideoUrl } from '@/lib/media';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { usePortalContainer } from '@/hooks/use-portal-container';
import { fetchAllActivitiesGroupedByUser, fetchPublicFeed, UserStoryGroup, LocalActivity } from '@/hooks/use-journey-activities';
import { useJourneyActivities } from '@/hooks/use-journey-activities';
import DynamicBlurBackground from '@/components/DynamicBlurBackground';
import Floating3DEmojis from '@/components/Floating3DEmojis';
import StoryEmojiRain from '@/components/StoryEmojiRain';
import ReactsSoFarSheet from '@/components/ReactsSoFarSheet';
import SendReactionSheet from '@/components/SendReactionSheet';
import ProfileAvatar from '@/components/ProfileAvatar';
import ActivityGalleryOverlay, { GalleryActivity } from '@/components/ActivityGalleryOverlay';

import MakePublicSheet from '@/components/MakePublicSheet';
import MediaSourceSheet from '@/components/MediaSourceSheet';
import StoryHint, { useStoryNudgeAnimation } from '@/components/StoryHint';
import { ReelViewerSkeleton } from '@/components/SkeletonLoaders';
import { uploadToStorage } from '@/services/storage-service';
import { deleteRecapFromCache, clearAllRecapCache } from '@/hooks/use-recap-cache';
import { supabase } from '@/integrations/supabase/client';
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
// Removed bundled demo video - now only uses actual RunwayML-generated videos

// 3D reaction assets
import fireEmoji from '@/assets/reactions/fire-3d.png';
import clapEmoji from '@/assets/reactions/clap-3d.png';

const DEFAULT_REACTIONS: Partial<Record<ReactionType, ActivityReaction>> = {};

// Reactor profile type from activities - includes reactionType for removal
interface ReactorProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  reactionType?: ReactionType;
  createdAt?: string;
}

const SWIPE_THRESHOLD = 50;

const Reel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const portalContainer = usePortalContainer();
  
  
  // Navigation state - extract once
  const navState = location.state || {};
  const deepLinkActivityId = navState.activityId as string | undefined;
  const deepLinkDayNumber = navState.dayNumber as number | undefined;
  const weekRecapVideoFromNav = navState.weekRecapVideo as string | undefined;
  const weekRecapNumber = navState.weekNumber as number | undefined;
  const sourceUserId = navState.sourceUserId as string | undefined;
  const navTimestamp = navState._ts as number | undefined;
  // viewProfile removed — all activities shown on homepage // Determine navigation intent:
  // - hasDeepLink: user tapped a specific story card (should open THAT story, never recap)
  // - hasWeekRecap: user tapped PLAY NOW pill (should open week recap)
  const hasDeepLink = !!(deepLinkActivityId || (typeof deepLinkDayNumber === 'number' && deepLinkDayNumber > 0));
  const hasWeekRecap = !hasDeepLink && typeof weekRecapVideoFromNav === 'string' && weekRecapVideoFromNav.length > 0;
  
  // State for user story groups
  const [userGroups, setUserGroups] = useState<UserStoryGroup[]>([]);
  
  // Track which users' stories have been fully viewed (all activities cycled through)
  const [viewedUsers, setViewedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Current user index (horizontal swipe between users)
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  // Current activity index within current user (tap to cycle)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  
  // Track if we've completed initial navigation setup
  const [navigationInitialized, setNavigationInitialized] = useState(false);
  const navigationKeyRef = useRef<string>('');
  
  const [showReactsSheet, setShowReactsSheet] = useState(false);
  const [showSendReactionSheet, setShowSendReactionSheet] = useState(false);
  const [localReactions, setLocalReactions] = useState<Record<string, {
    total: number;
    reactions: Partial<Record<ReactionType, ActivityReaction>>;
    reactorProfiles: ReactorProfile[];
  }>>({});
  
  // Edit/replace sheet state
  const [showEditSheet, setShowEditSheet] = useState(false);
  
  // Auto-advance timer state — dynamic duration based on media type
  const DEFAULT_ADVANCE_DURATION = 7000; // 7 seconds for images (Instagram-like)
  const [autoAdvanceDuration, setAutoAdvanceDuration] = useState(DEFAULT_ADVANCE_DURATION);
  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);
  // Delayed mirror of autoAdvanceProgress for the own-profile ring (needs 2-frame render for CSS transition)
  const [ownRingProgress, setOwnRingProgress] = useState(0);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceStartRef = useRef<number>(0);
  
  
  // Media loading state - track by URL so cached images don't get overwritten by useEffect reset
  const [loadedMediaUrl, setLoadedMediaUrl] = useState<string>('');
  
  // Audio state for video playback
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarStripRef = useRef<HTMLDivElement>(null);
  const activeAvatarRef = useRef<HTMLButtonElement>(null);

  // Bottom sheet states and transition animations
  const [isTransitioning, setIsTransitioning] = useState(false);
  const bottomSheetY = useMotionValue(0);

  // Data for progress overlay
  const { activities: myActivities, hasPublicActivity, makeActivityPublic } = useJourneyActivities();
  
  // Privacy/share sheet state
  const [showMakePublicSheet, setShowMakePublicSheet] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Recap viewer state
  const [isAddingToStories, setIsAddingToStories] = useState(false);
  const [showDeleteRecapConfirm, setShowDeleteRecapConfirm] = useState(false);
  const [recapPlaying, setRecapPlaying] = useState(true);
  const [showHistoryGallery, setShowHistoryGallery] = useState(false);

  // Story nudge animation for inactivity hint
  const { triggerShake, shakeAnimation, shakeTransition } = useStoryNudgeAnimation();

  // Create a unique key for this navigation to detect re-navigation
  const currentNavKey = `${deepLinkActivityId || ''}-${deepLinkDayNumber || ''}-${weekRecapVideoFromNav || ''}-${navTimestamp || ''}-${sourceUserId || ''}`;
  
  // Reset navigation state when navigation changes
  useEffect(() => {
    if (currentNavKey !== navigationKeyRef.current) {
      navigationKeyRef.current = currentNavKey;
      setNavigationInitialized(false);
    }
  }, [currentNavKey]);

  // Derive public feed from userGroups instead of a separate fetch
  // This eliminates a duplicate network request for the same data
  const publicFeed = useMemo(() => {
    if (!userGroups.length) return [];
    return userGroups.flatMap(g => {
      const latest = g.activities[g.activities.length - 1];
      if (!latest) return [];
      return [{ ...latest, displayName: g.displayName, avatarUrl: g.avatarUrl }];
    });
  }, [userGroups]);

  // Load all activities grouped by user
  const loadActivities = useCallback(async () => {
    setLoading(true);
    const groups = await fetchAllActivitiesGroupedByUser();
    setUserGroups(groups);
    
    // Initialize reactions state with reactor profiles
    const map: Record<string, { 
      total: number; 
      reactions: Partial<Record<ReactionType, ActivityReaction>>;
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
    setLoading(false);
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);


  // Own user: show today's activity + week recaps; Others: show ALL activities (recent first)
  const effectiveUserGroups = useMemo(() => {
    if (!user) return userGroups;

    // Others: only show their most recent activity
    const othersGroups = userGroups
      .filter(g => g.userId !== user.id)
      .map(g => {
        const sorted = [...g.activities].sort((a, b) => b.dayNumber - a.dayNumber);
        return {
          ...g,
          activities: sorted.length > 0 ? [sorted[0]] : [],
        };
      });

    // Own user: show today's logged activity OR just the log placeholder (no past activities)
    // PLUS any published/virtual week recaps
    const allMyActivities = [...myActivities].sort((a, b) => b.dayNumber - a.dayNumber);
    const latestActivity = allMyActivities[0];
    const loggedToday = latestActivity && new Date(latestActivity.createdAt).toDateString() === new Date().toDateString();
    
    const ownActivities: any[] = [];
    
    if (loggedToday) {
      ownActivities.push(latestActivity);
    }

    // Add published recap entries from userGroups for own user
    const myGroup$ = userGroups.find(g => g.userId === user.id);
    if (myGroup$) {
      const recapsFromDb = myGroup$.activities.filter(a => a.dayNumber >= 1001);
      for (const recap of recapsFromDb) {
        if (!ownActivities.some(a => a.id === recap.id)) {
          ownActivities.push(recap);
        }
      }
    }


    if (allMyActivities.length < 12) {
      ownActivities.push({
        id: 'log-activity',
        dayNumber: allMyActivities.length + 1,
        storageUrl: '',
        originalUrl: '',
        activity: undefined,
        duration: undefined,
        pr: undefined,
        frame: undefined,
        isVideo: false,
        isPublic: false,
        createdAt: new Date().toISOString(),
      } as any);
    }

    // Sort own activities: recaps first (desc by dayNumber), then regular
    ownActivities.sort((a: any, b: any) => {
      const aIsRecap = a.dayNumber >= 1001;
      const bIsRecap = b.dayNumber >= 1001;
      if (aIsRecap && !bIsRecap) return -1;
      if (!aIsRecap && bIsRecap) return 1;
      if (aIsRecap && bIsRecap) return b.dayNumber - a.dayNumber;
      // log-activity always last
      if (a.id === 'log-activity') return 1;
      if (b.id === 'log-activity') return -1;
      return b.dayNumber - a.dayNumber;
    });

    // If deep-linking to a specific own activity that's not today's, create a temporary
    // dedicated group so we can navigate to it without polluting the normal own-user group
    let deepLinkGroup: UserStoryGroup | null = null;
    if (deepLinkActivityId) {
      const deepLinkedActivity = allMyActivities.find(a => a.id === deepLinkActivityId);
      if (deepLinkedActivity && !ownActivities.some(a => a.id === deepLinkedActivity.id)) {
        deepLinkGroup = {
          userId: user.id + '-deeplink',
          displayName: profile?.display_name || 'You',
          avatarUrl: profile?.avatar_url || '',
          activities: [deepLinkedActivity],
        };
      }
    }

    const myGroup: UserStoryGroup = {
      userId: user.id,
      displayName: profile?.display_name || 'You',
      avatarUrl: profile?.avatar_url || '',
      activities: ownActivities.length > 0 ? ownActivities : [{
        id: 'log-activity',
        dayNumber: 1,
        storageUrl: '',
        originalUrl: '',
        activity: null,
        duration: null,
        pr: null,
        frame: null,
        isVideo: false,
        isPublic: false,
        createdAt: new Date().toISOString(),
      }],
    };

    // Sort others: unseen users first, viewed users to the back
    const sortedOthers = [...othersGroups].sort((a, b) => {
      const aViewed = viewedUsers.has(a.userId) ? 1 : 0;
      const bViewed = viewedUsers.has(b.userId) ? 1 : 0;
      return aViewed - bViewed;
    });

    const allGroups = [myGroup, ...sortedOthers];

    // Insert deep-link group right after own group so navigation finds it
    if (deepLinkGroup) {
      allGroups.splice(1, 0, deepLinkGroup);
    }

    // Put source user first if specified
    if (sourceUserId) {
      const targetIdx = allGroups.findIndex(g => g.userId === sourceUserId);
      if (targetIdx > 0) {
        const [target] = allGroups.splice(targetIdx, 1);
        allGroups.unshift(target);
      }
    }

    return allGroups.filter(g => g.activities.length > 0);
  }, [userGroups, user, myActivities, profile, sourceUserId, deepLinkActivityId, viewedUsers]);

  // Stabilize currentUserIndex when groups reorder due to viewedUsers change
  const currentUserIdRef = useRef<string>('');
  useEffect(() => {
    if (effectiveUserGroups.length === 0) return;
    const currentGroup = effectiveUserGroups[currentUserIndex];
    if (currentGroup) {
      currentUserIdRef.current = currentGroup.userId;
    }
  }, [currentUserIndex, effectiveUserGroups]);

  // When groups reorder, find the correct index for the current user
  useEffect(() => {
    if (!currentUserIdRef.current || effectiveUserGroups.length === 0) return;
    const newIdx = effectiveUserGroups.findIndex(g => g.userId === currentUserIdRef.current);
    if (newIdx >= 0 && newIdx !== currentUserIndex) {
      setCurrentUserIndex(newIdx);
    }
  }, [effectiveUserGroups]);

  // MAIN NAVIGATION EFFECT: Determine where to land based on navigation intent
  // This runs once per navigation after data is loaded
  useEffect(() => {
    // Wait for data to load
    if (loading || effectiveUserGroups.length === 0) return;
    // Only run once per navigation
    if (navigationInitialized) return;
    
    console.log('[Reel] Initializing navigation:', { hasDeepLink, hasWeekRecap, deepLinkActivityId, deepLinkDayNumber });
    
    // CASE 1: Deep-link to specific story (from card tap)
    if (hasDeepLink) {
      let found = false;
      
      // Try exact ID match first
      if (deepLinkActivityId) {
        for (let gIdx = 0; gIdx < effectiveUserGroups.length; gIdx++) {
          const group = effectiveUserGroups[gIdx];
          const aIdx = group.activities.findIndex(a => a.id === deepLinkActivityId);
          if (aIdx >= 0) {
            console.log('[Reel] Found by activityId:', { gIdx, aIdx, activityId: deepLinkActivityId });
            setCurrentUserIndex(gIdx);
            setCurrentActivityIndex(aIdx);
            found = true;
            break;
          }
        }
      }
      
      // Fallback: find by dayNumber (excludes week-recap)
      if (!found && typeof deepLinkDayNumber === 'number' && deepLinkDayNumber > 0) {
        // Prioritize current user's group
        const groupOrder: number[] = [];
        const myIdx = user ? effectiveUserGroups.findIndex(g => g.userId === user.id) : -1;
        if (myIdx >= 0) groupOrder.push(myIdx);
        for (let i = 0; i < effectiveUserGroups.length; i++) {
          if (i !== myIdx) groupOrder.push(i);
        }
        
        for (const gIdx of groupOrder) {
          const group = effectiveUserGroups[gIdx];
          const aIdx = group.activities.findIndex(
            a => a.dayNumber === deepLinkDayNumber && !a.id.startsWith('week-recap')
          );
          if (aIdx >= 0) {
            console.log('[Reel] Found by dayNumber:', { gIdx, aIdx, dayNumber: deepLinkDayNumber });
            setCurrentUserIndex(gIdx);
            setCurrentActivityIndex(aIdx);
            found = true;
            break;
          }
        }
      }
      
      // Last resort: go to first real story (not recap) of current user
      if (!found && user) {
        const myIdx = effectiveUserGroups.findIndex(g => g.userId === user.id);
        if (myIdx >= 0) {
          const group = effectiveUserGroups[myIdx];
          const firstRealIdx = group.activities.findIndex(a => !a.id.startsWith('week-recap'));
          if (firstRealIdx >= 0) {
            console.log('[Reel] Fallback to first real story:', { myIdx, firstRealIdx });
            setCurrentUserIndex(myIdx);
            setCurrentActivityIndex(firstRealIdx);
          }
        }
      }
      
      setNavigationInitialized(true);
      return;
    }
    
    // CASE 2: sourceUserId — open specific user's stories (from stacked card tap)
    if (sourceUserId) {
      const targetIdx = effectiveUserGroups.findIndex(g => g.userId === sourceUserId);
      if (targetIdx >= 0) {
        setCurrentUserIndex(targetIdx);
        setCurrentActivityIndex(0);
        setNavigationInitialized(true);
        return;
      }
    }
    
    // CASE 3: Default navigation - start with current user's own stories
    if (user) {
      const myIdx = effectiveUserGroups.findIndex(g => g.userId === user.id);
      if (myIdx >= 0) {
        setCurrentUserIndex(myIdx);
        setCurrentActivityIndex(0);
      } else {
        setCurrentUserIndex(0);
        setCurrentActivityIndex(0);
      }
    }
    
    setNavigationInitialized(true);
  }, [loading, effectiveUserGroups, navigationInitialized, hasDeepLink, deepLinkActivityId, deepLinkDayNumber, sourceUserId, user]);

  const currentGroup = effectiveUserGroups[currentUserIndex];
  const currentActivity = currentGroup?.activities[currentActivityIndex];
  const isWeekRecapStory = currentActivity?.id?.startsWith('week-recap');
  const isRecapActivity = currentActivity?.activity?.toLowerCase().includes('recap') || currentActivity?.frame === 'recap';
  const isOwnStory = user && currentGroup?.userId === user.id;
  
  // Check if activity was created within the last 24 hours
  const isWithin24Hours = currentActivity ? 
    (Date.now() - new Date(currentActivity.createdAt).getTime()) < 24 * 60 * 60 * 1000 : false;
  
  // Only allow deletion of the latest (most recent) activity - no jumping
  // Week recap stories cannot be deleted
  const maxDayNumber = myActivities.length > 0 ? Math.max(...myActivities.map(a => a.dayNumber)) : 0;
  const isLatestActivity = currentActivity?.dayNumber === maxDayNumber;
  const canEdit = isOwnStory && isWithin24Hours && isLatestActivity && !isWeekRecapStory;

  // Navigate between activities within current user only (tap to cycle)
  // Auto-advance to next user when profile is public and all activities viewed
  const cycleActivity = useCallback(() => {
    if (!currentGroup) return;
    
    if (currentActivityIndex < currentGroup.activities.length - 1) {
      setCurrentActivityIndex(prev => prev + 1);
    } else {
      // Mark current user as fully viewed
      setViewedUsers(prev => new Set(prev).add(currentGroup.userId));
      
      if (profile?.stories_public && effectiveUserGroups.length > 1) {
        // Auto-advance to next user when public
        setCurrentActivityIndex(0);
        setCurrentUserIndex(prev => (prev + 1) % effectiveUserGroups.length);
      }
    }
  }, [currentGroup, currentActivityIndex, profile?.stories_public, effectiveUserGroups.length]);

  // Navigate to previous activity within current user only
  const prevActivity = useCallback(() => {
    if (currentActivityIndex > 0) {
      setCurrentActivityIndex(prev => prev - 1);
    }
    // Don't go to previous user — user must swipe to change users
  }, [currentActivityIndex]);

  // Navigate between users (horizontal swipe)
  const goNextUser = useCallback(() => {
    if (effectiveUserGroups.length === 0) return;
    setCurrentActivityIndex(0);
    setCurrentUserIndex(prev => (prev + 1) % effectiveUserGroups.length);
  }, [effectiveUserGroups.length]);

  const goPrevUser = useCallback(() => {
    if (effectiveUserGroups.length === 0) return;
    setCurrentActivityIndex(0);
    setCurrentUserIndex(prev => (prev - 1 + effectiveUserGroups.length) % effectiveUserGroups.length);
  }, [effectiveUserGroups.length]);

  // Swipe gesture handling for horizontal navigation - smooth scroll feel
  const dragX = useMotionValue(0);
  const cardOpacity = useTransform(dragX, [-200, -100, 0, 100, 200], [0.85, 0.95, 1, 0.95, 0.85]);
  const cardRotate = useMotionValue(0); // No rotation for smooth scroll feel
  const cardScale = useMotionValue(1); // No scale for smooth scroll feel
  
  const handleHorizontalDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    
    // Horizontal swipe between users - lower threshold for snappier feel
    if (Math.abs(offset.x) > 40 || Math.abs(velocity.x) > 300) {
      if (offset.x < 0) {
        setSwipeDirection('left');
        goNextUser();
      } else {
        setSwipeDirection('right');
        goPrevUser();
      }
    }

    // Always hard-reset drag offset so container never stays shifted
    dragX.set(0);
  }, [goNextUser, goPrevUser, dragX]);

  // Bottom sheet drag removed — progress is now a standalone page

  const [lastTap, setLastTap] = useState(0);
  const [userTransitionFlash, setUserTransitionFlash] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('left');
  const prevUserIndexRef = useRef(currentUserIndex);
  
  // Flash highlight + center active avatar ONLY when user changes
  useEffect(() => {
    if (currentUserIndex !== prevUserIndexRef.current) {
      setUserTransitionFlash(true);
      setTimeout(() => setUserTransitionFlash(false), 600);
      prevUserIndexRef.current = currentUserIndex;

      // Scroll avatar strip directly to avoid viewport-level horizontal shift
      if (activeAvatarRef.current && avatarStripRef.current) {
        const strip = avatarStripRef.current;
        const active = activeAvatarRef.current;
        const stripRect = strip.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();
        const delta = (activeRect.left + activeRect.width / 2) - (stripRect.left + stripRect.width / 2);
        strip.scrollTo({
          left: strip.scrollLeft + delta,
          behavior: 'smooth',
        });
      }
    }
  }, [currentUserIndex]);

  // Mark the current user as viewed AFTER their story finishes (handled by cycleActivity)
  // Don't mark immediately — let the progress ring complete first

  // Defensive reset on every story/user step to prevent residual x-offset drift
  useEffect(() => {
    dragX.set(0);
  }, [currentUserIndex, currentActivityIndex, dragX]);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // If story is locked, open Make Public sheet on any tap
    const locked = !isOwnStory && !profile?.stories_public;
    if (locked) {
      setShowMakePublicSheet(true);
      return;
    }

    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap -> heart reaction
      if (!isOwnStory) {
        handleReact('heart');
      }
    } else {
      // Single tap -> left side = prev, right side = next (Instagram-style)
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? rect.width / 2 : (e as React.MouseEvent).clientX;
      const tapX = clientX - rect.left;
      
      if (tapX < rect.width * 0.35) {
        // Left 35% - go back
        prevActivity();
      } else {
        // Right 65% - go forward
        cycleActivity();
      }
    }
    setLastTap(now);
  }, [lastTap, cycleActivity, prevActivity, isOwnStory, profile?.stories_public]);

  // Progress navigation removed — now a standalone page via bottom nav

  const handleReact = async (type: ReactionType) => {
    if (!currentActivity || isOwnStory) return;

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
    navigate('/reel', { replace: true });
  };


  // Auto-advance timer - pause when modals are open OR content is locked
  // Determine if story should be locked (user's profile is private OR they haven't shared any public activity)
  const isStoryLocked = !isOwnStory && !profile?.stories_public;
  const isPaused = showReactsSheet || showSendReactionSheet || showEditSheet || showMakePublicSheet || isStoryLocked;
  
  // Reset progress/duration when activity changes (NOT mediaLoaded — that's URL-keyed to avoid race condition)
  useEffect(() => {
    setAutoAdvanceProgress(0);
    setAutoAdvanceDuration(DEFAULT_ADVANCE_DURATION); // Reset to default, will be updated when video loads
  }, [currentUserIndex, currentActivityIndex]);

  // Mirror autoAdvanceProgress with a 1-frame delay for the own-profile ring CSS transition
  useEffect(() => {
    if (autoAdvanceProgress === 0) {
      setOwnRingProgress(0);
    } else {
      // Delay by 1 frame so DOM renders at 0 first, then animates to 1
      const raf = requestAnimationFrame(() => {
        setOwnRingProgress(1);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [autoAdvanceProgress]);
  
  // Auto-advance: only fire a SINGLE timeout to cycle, no interval for progress
  useEffect(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    
    if (hasWeekRecap) return;
    
    const activityHasLiveFrame = !!(currentActivity?.frame && currentActivity.frame !== 'recap' && currentActivity?.originalUrl);
    const currentMediaUrl = activityHasLiveFrame
      ? (currentActivity?.originalUrl || currentActivity?.storageUrl || '')
      : (currentActivity?.storageUrl || currentActivity?.originalUrl || '');
    if (isPaused || loading || !currentActivity || loadedMediaUrl !== currentMediaUrl || !currentMediaUrl) {
      setAutoAdvanceProgress(0);
      return;
    }
    
    // Signal CSS animation to start
    setAutoAdvanceProgress(1);
    autoAdvanceStartRef.current = Date.now();
    
    autoAdvanceTimerRef.current = setTimeout(() => {
      cycleActivity();
    }, autoAdvanceDuration);
    
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [currentUserIndex, currentActivityIndex, isPaused, loading, currentActivity, loadedMediaUrl, cycleActivity, hasWeekRecap, autoAdvanceDuration]);

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

  // Handler: Add recap to stories (upload video + create journey activity)
  const handleAddToStories = useCallback(async () => {
    if (!weekRecapVideoFromNav || !user) return;
    setIsAddingToStories(true);
    try {
      console.log('[Reel] Adding to stories, video URL type:', weekRecapVideoFromNav.substring(0, 30));
      
      let blob: Blob;
      try {
        const response = await fetch(weekRecapVideoFromNav);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        blob = await response.blob();
        if (blob.size === 0) throw new Error('Empty blob');
        console.log('[Reel] Fetched blob:', blob.size, 'bytes, type:', blob.type);
      } catch (fetchErr) {
        console.error('[Reel] Blob fetch failed:', fetchErr);
        toast.error('Video expired — please regenerate first');
        return;
      }

      // Ensure correct content type for upload
      if (!blob.type || !blob.type.startsWith('video/')) {
        blob = new Blob([blob], { type: 'video/webm' });
      }

      const storageUrl = await uploadToStorage(blob, `week-${weekRecapNumber}-recap`, true);
      if (!storageUrl) {
        toast.error('Upload failed — try again');
        return;
      }
      
      const weekNum = weekRecapNumber || 1;
      const dayNumber = 1000 + weekNum;
      const { error } = await supabase.from('journey_activities').upsert({
        user_id: user.id,
        storage_url: storageUrl,
        original_url: storageUrl,
        is_video: true,
        activity: `Week ${weekNum} Recap`,
        day_number: dayNumber,
        is_public: true,
        frame: 'recap',
      }, { onConflict: 'user_id,day_number' });
      if (error) throw error;
      toast.success('Recap added to your stories!');
      await loadActivities();
      navigate('/reel', { replace: true, state: { dayNumber } });
    } catch (err) {
      console.error('[Reel] Failed to add to stories:', err);
      toast.error('Failed to add to stories');
    } finally {
      setIsAddingToStories(false);
    }
  }, [weekRecapVideoFromNav, weekRecapNumber, user, loadActivities, navigate]);

  // Handler: Create own recap when viewing another user's recap story
  const handleCreateOwnRecap = useCallback(() => {
    if (!user || myActivities.length < 3) {
      toast.error(`Log at least 3 activities first (you have ${myActivities.length})`);
      return;
    }
    const latestWeek = Math.ceil(myActivities.length / 3);
    const weekStart = (latestWeek - 1) * 3;
    const weekPhotos = [...myActivities]
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .slice(weekStart, weekStart + 3)
      .map(a => ({
        id: a.id,
        imageUrl: a.originalUrl || a.storageUrl,
        activity: a.activity || 'Workout',
        duration: a.duration,
        pr: a.pr,
        uploadDate: new Date().toISOString().split('T')[0],
        dayNumber: a.dayNumber,
        isVideo: a.isVideo,
      }));
    if (weekPhotos.length < 3) {
      toast.error('Need 3 photos for your recap');
      return;
    }
    navigate('/reel-generation', {
      replace: true,
      state: { weekPhotos, weekNumber: latestWeek, forceRegenerate: true, regenerateTs: Date.now() },
    });
  }, [user, myActivities, navigate]);

  const handleRegenerate = useCallback(async () => {
    const weekNum = weekRecapNumber || 1;
    console.log('[Reel] 🔄 REGENERATE tapped — week:', weekNum, 'activities:', myActivities.length);
    
    // NUCLEAR CACHE CLEAR — wipe everything so nothing stale can be served
    try {
      // Clear ALL local IndexedDB recaps
      await clearAllRecapCache();
      // Clear cloud storage for this week
      if (user?.id) {
        const path = `reels/${user.id}/week-${weekNum}.webm`;
        await supabase.storage.from('journey-uploads').remove([path]);
        console.log('[Reel] ☁️ Cleared cloud cache:', path);
      }
    } catch (err) {
      console.warn('[Reel] Cache clear error (continuing anyway):', err);
    }
    
    // Build week photos from user's activities
    const sortedActivities = [...myActivities].sort((a, b) => a.dayNumber - b.dayNumber);
    const weekStart = (weekNum - 1) * 3;
    const weekPhotos = sortedActivities.slice(weekStart, weekStart + 3).map(a => ({
      id: a.id,
      imageUrl: a.originalUrl || a.storageUrl,
      activity: a.activity || 'Workout',
      duration: a.duration,
      pr: a.pr,
      uploadDate: new Date().toISOString().split('T')[0],
      dayNumber: a.dayNumber,
      isVideo: a.isVideo,
    }));
    
    console.log('[Reel] 📸 Built weekPhotos:', weekPhotos.length, weekPhotos.map(p => `${p.activity}(day${p.dayNumber})`));
    
    if (weekPhotos.length < 3) {
      console.error('[Reel] ❌ Not enough photos! Have:', weekPhotos.length, 'Need: 3');
      toast.error(`Need at least 3 photos (have ${weekPhotos.length})`);
      return;
    }
    
    // Navigate to generation page — forceRegenerate + unique timestamp guarantees fresh build
    const navState = { 
      weekPhotos, 
      weekNumber: weekNum, 
      forceRegenerate: true, 
      regenerateTs: Date.now() 
    };
    console.log('[Reel] 🚀 Navigating to /reel-generation with forceRegenerate=true, ts:', navState.regenerateTs);
    navigate('/reel-generation', { replace: true, state: navState });
  }, [weekRecapNumber, myActivities, navigate, user]);

  // Handler: Delete recap and go back to start
  const handleDeleteRecap = useCallback(async () => {
    const weekNum = weekRecapNumber || 1;
    await deleteRecapFromCache(weekNum, user?.id);
    
    // Also delete the recap record from the database so it's removed for other users
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('journey_activities')
          .delete()
          .eq('user_id', user.id)
          .eq('frame', 'recap')
          .gte('day_number', 1000 + (weekNum - 1) * 3)
          .lte('day_number', 1000 + weekNum * 3);
        if (error) console.error('Failed to delete recap from DB:', error);
      } catch (e) {
        console.error('Error deleting recap from DB:', e);
      }
    }
    
    setShowDeleteRecapConfirm(false);
    toast.success('Recap deleted');
    navigate('/reel', { replace: true });
  }, [weekRecapNumber, navigate, user?.id]);

  // Handler: Download recap video
  const handleDownloadRecap = useCallback(async () => {
    if (!weekRecapVideoFromNav) return;
    try {
      const response = await fetch(weekRecapVideoFromNav);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `week-${weekRecapNumber || 1}-recap.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download started!');
    } catch {
      toast.error('Failed to download');
    }
  }, [weekRecapVideoFromNav, weekRecapNumber]);

  const buildSharePayload = useCallback(() => {
    const mediaUrl = currentActivity?.storageUrl || currentActivity?.originalUrl;
    const userName = currentGroup?.displayName || 'Someone';
    const activityName = currentActivity?.activity || 'workout';
    const text = isOwnStory
      ? `Check out my ${activityName} on my fitness journey! 💪`
      : `Check out ${userName}'s ${activityName}! 🔥`;

    return {
      title: `${isOwnStory ? 'My' : `${userName}'s`} Fitness Story`,
      text,
      url: mediaUrl && mediaUrl.startsWith('http') ? mediaUrl : window.location.href,
    };
  }, [currentActivity, currentGroup, isOwnStory]);

  const handleSystemShare = useCallback(async () => {
    const payload = buildSharePayload();

    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else {
        await navigator.clipboard.writeText(`${payload.text}\n\n${payload.url}`);
        toast.success('Link copied to clipboard');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error('Unable to open share sheet');
      }
    }
  }, [buildSharePayload]);

  const shareToChannel = useCallback((channel: 'whatsapp' | 'instagram' | 'messages') => {
    const payload = buildSharePayload();
    const shareText = `${payload.text}\n\n${payload.url}`;

    // Use setTimeout to ensure the dialog has closed and the user gesture context is preserved
    setTimeout(() => {
      if (channel === 'whatsapp') {
        // Use whatsapp:// deep link for mobile, fallback to web
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
        const webFallback = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Fallback: if deep link doesn't work, open web version after a short delay
        setTimeout(() => {
          window.location.href = webFallback;
        }, 1500);
        return;
      }

      if (channel === 'messages') {
        window.location.href = `sms:&body=${encodeURIComponent(shareText)}`;
        return;
      }

      if (channel === 'instagram') {
        // Instagram doesn't have a direct share URL; use native share or copy
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
  }, [buildSharePayload]);

  // Handler: open share options picker
  const handleShareStory = useCallback(() => {
    setShowShareOptions(true);
  }, []);

  if (loading) {
    return <ReelViewerSkeleton />;
  }

  // WEEK RECAP VIDEO PLAYER — show generated recap video instead of stories
  if (hasWeekRecap && weekRecapVideoFromNav) {
    const handleRecapPullRefresh = async () => {
      handleRegenerate();
    };

    const toggleRecapPlayback = () => {
      const vid = videoRef.current;
      if (!vid) return;
      if (vid.paused) {
        vid.play();
        setRecapPlaying(true);
      } else {
        vid.pause();
        setRecapPlaying(false);
      }
    };

    return (
      <PullToRefresh onRefresh={handleRecapPullRefresh}>
      <div 
        className="flex flex-col"
        style={{ 
          height: '100dvh',
          minHeight: '-webkit-fill-available',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #0c0818 0%, #050208 100%)',
        }}
      >
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(139, 92, 246, 0.18) 0%, transparent 50%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 55%, rgba(59, 130, 246, 0.08) 0%, transparent 45%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 40%, rgba(236, 72, 153, 0.06) 0%, transparent 40%)' }} />
        </div>

        {/* Back button */}
        <div 
          className="relative z-50 px-4 pt-3"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
        >
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Video Player Card */}
        <div className="relative z-10 flex-1 flex flex-col px-6 pb-3 min-h-0" style={{ marginTop: '-20px' }}>
          <div
            className="flex-1 relative rounded-3xl overflow-hidden min-h-0 max-w-[323px] mx-auto w-full"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 0 80px rgba(139, 92, 246, 0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
              background: 'linear-gradient(180deg, rgba(20, 10, 40, 0.5) 0%, rgba(0, 0, 0, 0.85) 100%)',
            }}
          >
            {/* Light beam effect from top-right */}
            <div
              className="absolute pointer-events-none z-10"
              style={{
                top: '-20%',
                right: '5%',
                width: '50%',
                height: '70%',
                background: 'linear-gradient(200deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.03) 40%, transparent 70%)',
                filter: 'blur(30px)',
                transform: 'rotate(-15deg)',
              }}
            />

            {/* Inner card glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(139, 92, 246, 0.12) 0%, transparent 55%)' }} />

            {/* Video — key forces DOM element replacement on new URL */}
            <video
              key={weekRecapVideoFromNav}
              ref={videoRef}
              src={weekRecapVideoFromNav}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              playsInline
              controls={false}
              loop
              muted={isMuted}
              onClick={toggleRecapPlayback}
            />

            {/* Play/Pause overlay */}
            <AnimatePresence>
              {!recapPlaying && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.15 }}
                  onClick={toggleRecapPlayback}
                  className="absolute inset-0 z-15 flex items-center justify-center"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <Play className="w-7 h-7 text-white ml-1" fill="white" />
                  </div>
                </motion.button>
              )}
            </AnimatePresence>
            <button
              onClick={() => setIsMuted(prev => !prev)}
              className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full text-white/70"
              style={{
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Week label pill */}
            <div className="absolute top-4 left-4 z-20">
              <span
                className="text-white/90 font-semibold text-xs px-3 py-1.5 rounded-full"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                Week {weekRecapNumber || 1} Recap
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div 
          className="relative z-50 px-4 pb-4 flex flex-col gap-3"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}
        >
          {/* Regenerate + Download row */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Regenerate</span>
            </button>

            <button
              onClick={handleDownloadRecap}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Download</span>
            </button>
          </div>

          {/* ADD TO MY STORIES CTA */}
          <button
            onClick={handleAddToStories}
            disabled={isAddingToStories}
            className="w-full py-4 rounded-2xl font-bold tracking-wider text-[15px] active:scale-[0.97] transition-transform disabled:opacity-50"
            style={{
              background: 'rgba(255, 255, 255, 0.93)',
            }}
          >
            <span
              style={{
                background: 'linear-gradient(90deg, #F97316, #EC4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {isAddingToStories ? 'ADDING...' : 'ADD TO MY STORY'}
            </span>
          </button>
        </div>

        {/* Delete Recap Confirmation Dialog */}
        <AlertDialog open={showDeleteRecapConfirm} onOpenChange={setShowDeleteRecapConfirm}>
          <AlertDialogContent
            className="rounded-3xl border-0 max-w-[320px]"
            style={{
              background: 'linear-gradient(180deg, rgba(60, 55, 70, 0.85) 0%, rgba(40, 38, 50, 0.9) 100%)',
              backdropFilter: 'blur(60px) saturate(200%)',
              WebkitBackdropFilter: 'blur(60px) saturate(200%)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white text-center text-lg">Delete this reel?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/50 text-center text-sm">
                This will remove the cached video. You can always regenerate a fresh one with new transitions and music.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-3 sm:justify-center">
              <AlertDialogCancel
                className="flex-1 rounded-full border-0 text-white/80 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteRecap}
                className="flex-1 rounded-full border-0 text-white font-semibold"
                style={{ background: 'rgba(239, 68, 68, 0.7)' }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      </PullToRefresh>
    );
  }

  if (!effectiveUserGroups.length || !currentGroup || !currentActivity) {
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

  // For activities with a frame: use the raw originalUrl for live frame rendering (pixel-perfect).
  // For recap videos or activities without a frame: fall back to storageUrl (pre-rendered JPEG/video).
  const hasLiveFrame = !!(currentActivity.frame && currentActivity.frame !== 'recap' && currentActivity.originalUrl);
  const mediaUrl = hasLiveFrame
    ? (currentActivity.originalUrl || currentActivity.storageUrl || '')
    : (currentActivity.storageUrl || currentActivity.originalUrl || '');
  // Determine media type from actual URL extension — must not use is_video DB flag because
  // storageUrl for video activities is a .jpg screenshot (framed capture).
  const isVideo = isVideoUrl(mediaUrl);
  // Derived: media is "loaded" once the browser has fetched and decoded this specific URL
  const mediaLoaded = loadedMediaUrl === mediaUrl && mediaUrl.length > 0;
  const currentReactions = localReactions[currentActivity.id] || { total: 0, reactions: { ...DEFAULT_REACTIONS }, reactorProfiles: [] };
  
  // Week recap is generating if it's a recap story with no valid video URL
  const isRecapGenerating = isWeekRecapStory && (!mediaUrl || mediaUrl.length === 0);
  
  const activeReactionTypes = Object.entries(currentReactions.reactions)
    .filter(([, r]) => r.count > 0)
    .map(([type]) => type as ReactionType);

  // Calculate week and day
  const week = Math.ceil(currentActivity.dayNumber / 3);
  const dayInWeek = ((currentActivity.dayNumber - 1) % 3) + 1;

  // Fixed zone heights for layout
  const HEADER_HEIGHT = 100; // Row: delete + avatars + close + user name
  const BOTTOM_HEIGHT = 100; // Reaction pill + view progress

  const isLogActivityCard = currentActivity?.id === 'log-activity';

  return (
    <DynamicBlurBackground imageUrl={mediaUrl}>
      {/* Purple gradient background for log-activity empty state (matches Progress page) */}
      {isLogActivityCard && (
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(180deg, #3A2A63 0%, #1A1530 45%, #060608 100%)',
          }}
        />
      )}
      {/* Single viewport — no scroll */}
      <div 
        className="absolute inset-0 flex flex-col"
        style={{ 
          overflow: 'hidden',
          overflowX: 'clip',
          touchAction: 'none',
        }}
      >
        {/* Story Hint - one-time tutorial with shake nudge */}
        <StoryHint 
          hasMultipleStories={currentGroup?.activities.length > 1}
          hasMultipleUsers={effectiveUserGroups.length > 1}
          onNudge={triggerShake}
        />

        {/* TOP ZONE */}
        <div 
          className="z-50 flex flex-col justify-end shrink-0"
          style={{ 
            paddingTop: 'calc(max(env(safe-area-inset-top, 8px), 8px) + 12px)',
          }}
        >
          {/* Avatar strip: pinned own avatar + scrollable others */}
          <div
            className="shrink-0 overflow-hidden"
            style={{ height: 78 }}
          >
            <div className="flex items-start px-3 gap-2">
              {/* Pinned own avatar — always visible */}
              {(() => {
                const ownIdx = effectiveUserGroups.findIndex(g => user && g.userId === user.id);
                const isOwnActive = ownIdx >= 0 && ownIdx === currentUserIndex;
                const ownGroup = ownIdx >= 0 ? effectiveUserGroups[ownIdx] : null;
                const ownActivityCount = ownGroup?.activities.length || 0;
                const ownCurrentIdx = isOwnActive ? currentActivityIndex : 0;
                const avatarSize = 52;

                return (
                  <button
                    onClick={() => {
                      if (ownIdx >= 0) {
                        setCurrentUserIndex(ownIdx);
                        setCurrentActivityIndex(0);
                      }
                    }}
                    className="relative active:scale-95 flex-shrink-0 flex flex-col items-center"
                    style={{ 
                      width: avatarSize,
                      opacity: isOwnActive ? 1 : 0.5,
                      transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  >
                    <div className="relative" style={{ width: avatarSize, height: avatarSize }}>
                      {ownGroup && ownActivityCount > 0 && (!viewedUsers.has(user?.id || '') || isOwnActive) && (
                        <svg
                          className="absolute inset-0"
                          style={{ width: avatarSize, height: avatarSize, transform: 'rotate(-90deg)' }}
                          viewBox="0 0 100 100"
                        >
                          <defs>
                            <linearGradient id="storyGradientOwn" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#FEDA75" />
                              <stop offset="25%" stopColor="#FA7E1E" />
                              <stop offset="50%" stopColor="#D62976" />
                              <stop offset="75%" stopColor="#962FBF" />
                              <stop offset="100%" stopColor="#4F5BD5" />
                            </linearGradient>
                          </defs>
                          {/* Background track */}
                          <circle cx="50" cy="50" r={44} fill="none" strokeWidth="6"
                            stroke={isOwnActive ? 'rgba(255,255,255,0.15)' : 'url(#storyGradientOwn)'}
                            strokeLinecap="round"
                            style={{ filter: (!isOwnActive && !viewedUsers.has(user?.id || '')) ? 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.5))' : 'none' }}
                          />
                          {/* Progress fill — only when actively viewing */}
                          {isOwnActive && (
                            <circle cx="50" cy="50" r={44} fill="none" strokeWidth="6"
                              stroke={viewedUsers.has(user?.id || '') ? 'rgba(255,255,255,0.7)' : 'url(#storyGradientOwn)'}
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 44}`}
                              strokeDashoffset={ownRingProgress > 0 ? 0 : 2 * Math.PI * 44}
                              style={{
                                filter: !viewedUsers.has(user?.id || '') ? 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.5))' : 'none',
                                transition: ownRingProgress > 0 ? `stroke-dashoffset ${autoAdvanceDuration}ms linear` : 'none',
                              }}
                            />
                          )}
                        </svg>
                      )}
                      <div className="relative" style={{ width: avatarSize, height: avatarSize, padding: 4 }}>
                        <div className="w-full h-full rounded-full overflow-hidden">
                          <ProfileAvatar
                            src={profile?.avatar_url}
                            name={profile?.display_name}
                            size={avatarSize - 8}
                          />
                        </div>
                      </div>
                    </div>
                    <span className={`text-[11px] font-medium mt-1 max-w-[52px] truncate ${isOwnActive ? 'text-white font-semibold' : 'text-white/50'}`}>
                      You
                    </span>
                  </button>
                );
              })()}

              {/* Divider */}
              <div className="flex-shrink-0 self-center" style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.15)' }} />

              {/* Scrollable others */}
              <div
                ref={avatarStripRef}
                className="flex items-start gap-3 overflow-x-auto scrollbar-hide flex-1 min-w-0"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {effectiveUserGroups.map((group, idx) => {
                    // Skip own user — already shown above
                    if (user && group.userId === user.id) return null;
                    const isActive = idx === currentUserIndex;
                    const activityCount = group.activities.length;
                    const currentIdx = idx === currentUserIndex ? currentActivityIndex : 0;
                    const isOwnProfile = user && group.userId === user.id;
                    // Stories are locked, but profile photos are ALWAYS visible
                    const isStoryLocked = !isOwnProfile && !profile?.stories_public;
                    const isUserViewed = viewedUsers.has(group.userId);
                    const avatarSize = 52;
                    
                      return (
                      <button
                        key={group.userId}
                        ref={isActive ? activeAvatarRef : undefined}
                        onClick={() => {
                          const targetIdx = effectiveUserGroups.findIndex(g => g.userId === group.userId);
                          if (targetIdx >= 0) {
                            setCurrentUserIndex(targetIdx);
                            setCurrentActivityIndex(0);
                          }
                        }}
                    className="relative active:scale-95 flex-shrink-0 flex flex-col items-center"
                        style={{ 
                          width: avatarSize,
                          opacity: isActive ? 1 : 0.5,
                          transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                          filter: isActive && userTransitionFlash ? 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.6))' : 'none',
                        }}
                      >
                        <div className="relative" style={{ width: avatarSize, height: avatarSize }}>
                        {/* Story ring: gradient if unviewed, white progress if viewed & active */}
                        {(!isUserViewed || isActive) && (
                        <svg
                          className="absolute inset-0"
                          style={{
                            width: avatarSize,
                            height: avatarSize,
                            transform: 'rotate(-90deg)',
                          }}
                          viewBox="0 0 100 100"
                        >
                          <defs>
                            <linearGradient id={`storyGradient-${group.userId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#FEDA75" />
                              <stop offset="25%" stopColor="#FA7E1E" />
                              <stop offset="50%" stopColor="#D62976" />
                              <stop offset="75%" stopColor="#962FBF" />
                              <stop offset="100%" stopColor="#4F5BD5" />
                            </linearGradient>
                          </defs>
                          {/* Background track */}
                          <circle cx="50" cy="50" r={44} fill="none" strokeWidth="6"
                            stroke={isStoryLocked ? 'rgba(255,255,255,0.15)' : (isActive ? 'rgba(255,255,255,0.15)' : `url(#storyGradient-${group.userId})`)}
                            strokeLinecap="round"
                            style={{ filter: (!isStoryLocked && !isActive && !isUserViewed) ? 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.5))' : 'none' }}
                          />
                          {/* Progress fill — fills proportionally across ALL stories */}
                          {isActive && !isStoryLocked && (() => {
                            const totalActivities = group.activities.length;
                            const circumference = 2 * Math.PI * 44;
                            // Completed segments + current segment progress
                            const completedFraction = currentIdx / totalActivities;
                            const currentSegmentFraction = (autoAdvanceProgress > 0 ? 1 : 0) / totalActivities;
                            const totalFraction = completedFraction + currentSegmentFraction;
                            const targetOffset = circumference * (1 - totalFraction);
                            const startOffset = circumference * (1 - completedFraction);
                            return (
                              <circle cx="50" cy="50" r={44} fill="none" strokeWidth="6"
                                stroke={isUserViewed ? 'rgba(255,255,255,0.7)' : `url(#storyGradient-${group.userId})`}
                                strokeLinecap="round"
                                strokeDasharray={`${circumference}`}
                                strokeDashoffset={autoAdvanceProgress > 0 ? targetOffset : startOffset}
                                style={{
                                  filter: !isUserViewed ? 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.5))' : 'none',
                                  transition: autoAdvanceProgress > 0 ? `stroke-dashoffset ${autoAdvanceDuration}ms linear` : 'none',
                                }}
                              />
                            );
                          })()}
                        </svg>
                        )}
                        
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
                        </div>
                        <span className={`text-[11px] font-medium mt-1 max-w-[52px] truncate ${isActive ? 'text-white font-semibold' : 'text-white/50'}`}>
                          {group.displayName?.split(' ')[0] || 'User'}
                        </span>
                      </button>
                    );
                  })}
            </div>{/* end scrollable others */}
            </div>{/* end flex container */}
          </div>
        </div>{/* end top zone */}


        {/* Week/Day label for real activities + recap label */}
        {currentGroup && currentActivity && (
          <div className="z-40 text-center shrink-0" style={{ marginBottom: '2px' }}>
            {currentActivity.dayNumber >= 1001 ? (
              <span className="text-white/50 text-xs font-medium">
                Week {currentActivity.dayNumber - 1000} Recap
              </span>
            ) : currentActivity.dayNumber >= 1 && currentActivity.dayNumber <= 12 ? (
              <span className="text-white/50 text-xs font-medium">
                Week {Math.ceil(currentActivity.dayNumber / 3)} • Day {((currentActivity.dayNumber - 1) % 3) + 1}
              </span>
            ) : null}
          </div>
        )}

        {/* MIDDLE CONTAINER — flexes between profile strip and bottom nav */}
        <div
          className="relative z-30 flex-1 min-h-0 flex flex-col"
          style={{
            paddingTop: '0px',
            marginTop: '-4px',
            paddingBottom: 'calc(max(env(safe-area-inset-bottom, 6px), 6px) + 80px)',
          }}
        >
          {/* Reel cards fill the available middle container space */}
          <div className="relative min-h-0 flex-1 flex items-center justify-center">
          {/* Previous user peek card - 12% visible on left */}
          {effectiveUserGroups.length > 1 && (() => {
            const prevIdx = (currentUserIndex - 1 + effectiveUserGroups.length) % effectiveUserGroups.length;
            const prevGroup = effectiveUserGroups[prevIdx];
            const prevActivity = prevGroup?.activities[prevGroup.activities.length - 1];
            const prevMedia = prevActivity?.storageUrl || prevActivity?.originalUrl;
            const isPrevOwnStory = user && prevGroup?.userId === user.id;
            const isPrevLocked = !isPrevOwnStory && !profile?.stories_public;
            if (!prevMedia) return null;
            return (
              <motion.div
                key={`peek-left-${prevIdx}`}
                className="absolute left-0 top-0 bottom-0 flex items-center cursor-pointer"
                style={{ width: '10%', zIndex: 20 }}
                onClick={goPrevUser}
                initial={{ opacity: 0, x: -10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.05, type: 'spring', stiffness: 180, damping: 22 }}
              >
                <div
                  className="w-full overflow-hidden"
                  style={{
                    height: 'calc(59% + 20px)',
                    borderRadius: '0 10px 10px 0',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderLeft: 'none',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  <img
                    src={prevMedia}
                    alt="Previous user"
                    className="w-full h-full object-cover"
                    style={{ 
                      opacity: isPrevLocked ? 0.35 : 0.5, 
                      filter: isPrevLocked ? 'blur(16px) brightness(0.5)' : 'brightness(0.75)',
                    }}
                  />
                </div>
              </motion.div>
            );
          })()}

          {/* Next user peek card - 20% visible on right */}
          {effectiveUserGroups.length > 1 && (() => {
            const nextIdx = (currentUserIndex + 1) % effectiveUserGroups.length;
            const nextGroup = effectiveUserGroups[nextIdx];
            const nextActivity = nextGroup?.activities[nextGroup.activities.length - 1];
            const nextMedia = nextActivity?.storageUrl || nextActivity?.originalUrl;
            const isNextOwnStory = user && nextGroup?.userId === user.id;
            const isNextLocked = !isNextOwnStory && !profile?.stories_public;
            if (!nextMedia) return null;
            return (
              <motion.div
                key={`peek-right-${nextIdx}`}
                className="absolute right-0 top-0 bottom-0 flex items-center cursor-pointer"
                style={{ width: '10%', zIndex: 20 }}
                onClick={goNextUser}
                initial={{ opacity: 0, x: 10, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.05, type: 'spring', stiffness: 180, damping: 22 }}
              >
                <div
                  className="w-full overflow-hidden"
                  style={{
                    height: 'calc(59% + 20px)',
                    borderRadius: '10px 0 0 10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRight: 'none',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  <img
                    src={nextMedia}
                    alt="Next user"
                    className="w-full h-full object-cover"
                    style={{ 
                      opacity: isNextLocked ? 0.35 : 0.5, 
                      filter: isNextLocked ? 'blur(16px) brightness(0.5)' : 'brightness(0.75)',
                    }}
                  />
                </div>
              </motion.div>
            );
          })()}

          {/* Card container with shake animation */}
          <motion.div 
            className="relative flex items-center justify-center"
            style={{ 
              width: '100%',
              height: '100%',
              x: dragX,
              opacity: cardOpacity,
              rotateY: cardRotate,
              scale: cardScale,
            }}
            animate={shakeAnimation}
            transition={shakeTransition}
            drag="x"
            dragMomentum={false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.35}
            onDragEnd={handleHorizontalDragEnd}
            onClick={handleTap}
          >
              {/* Full templated image/video - with lock overlay for non-public users */}
              {(() => {
                // Lock content if user's profile is private OR they haven't shared any public activity
                const shouldShowLocked = !isOwnStory && !profile?.stories_public;
                
                // Generate unique key for transitions
                const contentKey = `${currentUserIndex}-${currentActivityIndex}`;
                
                return (
                  <div
                    className="relative flex items-center justify-center"
                    style={{ 
                      width: '100%',
                      height: '100%',
                      background: 'transparent',
                    }}
                  >
                    {/* Card — 9:16 aspect ratio, constrained to available space */}
                    <motion.div
                      layoutId={sourceUserId ? `story-card-${currentGroup?.userId}` : undefined}
                      className="relative overflow-hidden"
                      style={{
                        aspectRatio: '9/16',
                        height: 'calc(95% - 20px)',
                        maxWidth: '100%',
                        borderRadius: '0px',
                        overflow: 'hidden',
                        background: 'transparent',
                        marginTop: '-10px',
                      }}
                      transition={{ type: 'spring', stiffness: 280, damping: 30, duration: 0.5 }}
                    >
                    {/* Progress bar removed — timing indicated via avatar ring */}
                    <AnimatePresence mode="popLayout" custom={swipeDirection}>
                      <motion.div
                        key={contentKey}
                        custom={swipeDirection}
                        className="absolute inset-0 flex items-center justify-center"
                        variants={{
                          enter: (dir: string) => ({ 
                            opacity: 0.4, 
                            x: dir === 'left' ? 80 : -80,
                          }),
                          center: { opacity: 1, x: 0 },
                          exit: (dir: string) => ({ 
                            opacity: 0.4, 
                            x: dir === 'left' ? -80 : 80,
                          }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ 
                          type: 'spring',
                          stiffness: 350,
                          damping: 35,
                          mass: 0.8,
                        }}
                      >
                        {currentActivity?.id === 'log-activity' ? (
                          // "Log Your Activity" placeholder card — dark with dot grid + green plus
                          <div 
                            className="flex flex-col items-center justify-center cursor-pointer relative overflow-hidden self-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/camera', { state: { dayNumber: currentActivity.dayNumber } });
                            }}
                            style={{
                              width: '90%',
                              aspectRatio: '9/16',
                              maxHeight: '100%',
                              background: 'rgba(255,255,255,0.10)',
                              backdropFilter: 'blur(40px)',
                              WebkitBackdropFilter: 'blur(40px)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 10,
                            }}
                          >
                            {/* Animated dot grid pattern */}
                            <motion.div 
                              className="absolute inset-0" 
                              style={{
                                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
                                backgroundSize: '20px 20px',
                              }}
                              animate={{
                                backgroundPosition: ['0px 0px', '20px 20px'],
                                opacity: [0.4, 0.7, 0.4],
                              }}
                              transition={{
                                backgroundPosition: { duration: 8, repeat: Infinity, ease: 'linear' },
                                opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                              }}
                            />
                            {/* Text */}
                            <div className="text-center px-6 mb-10 relative z-10">
                              <h2 className="text-foreground font-black text-2xl tracking-tight uppercase leading-tight">
                                Log Your
                              </h2>
                              <h2 className="text-foreground font-black text-2xl tracking-tight uppercase leading-tight">
                                Today's Activity
                              </h2>
                            </div>
                            {/* Glowing plus */}
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
                        ) : isRecapGenerating ? (
                          // Show generating placeholder for week recap
                          <div 
                            className="w-full h-full flex flex-col items-center justify-center gap-6"
                            style={{
                              background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)',
                            }}
                          >
                            <div className="relative w-16 h-16">
                              <svg className="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--foreground) / 0.1)" strokeWidth="4" />
                                <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
                                  strokeDasharray={`${2 * Math.PI * 28 * 0.3} ${2 * Math.PI * 28 * 0.7}`} />
                              </svg>
                            </div>
                            <div className="text-center px-8">
                              <p className="text-foreground font-semibold text-lg mb-2">Generating your AI recap...</p>
                              <p className="text-muted-foreground text-sm">This usually takes 1-2 minutes</p>
                            </div>
                          </div>
                        ) : hasLiveFrame ? (
                          // Live frame render — pixel-perfect at any resolution
                          <div style={{ 
                            width: '100%', height: '100%', 
                            filter: shouldShowLocked ? 'blur(20px)' : 'none',
                          }}>
                            <StoryFrameRenderer
                              imageUrl={mediaUrl}
                              isVideo={currentActivity.isVideo}
                              activity={currentActivity.activity}
                              frame={currentActivity.frame}
                              duration={currentActivity.duration}
                              pr={currentActivity.pr}
                              dayNumber={currentActivity.dayNumber}
                              onLoad={() => setLoadedMediaUrl(mediaUrl)}
                            />
                          </div>
                        ) : isVideo ? (
                          <div style={{
                            width: isRecapActivity ? '90%' : '100%',
                            height: isRecapActivity ? undefined : '100%',
                            aspectRatio: isRecapActivity ? '9/16' : undefined,
                            maxHeight: '100%',
                            position: isRecapActivity ? 'relative' : undefined,
                            margin: isRecapActivity ? '0 auto' : undefined,
                            overflow: 'hidden',
                          }}
                          className={isRecapActivity ? 'self-center flex items-center justify-center' : 'absolute inset-0'}
                          >
                          <video
                            ref={videoRef}
                            key={mediaUrl}
                            src={mediaUrl}
                            className="w-full h-full"
                            style={{ 
                              objectFit: 'cover',
                              filter: shouldShowLocked ? 'blur(20px)' : 'none',
                              opacity: mediaLoaded ? 1 : 0,
                              transition: 'opacity 0.2s ease',
                            }}
                            autoPlay
                            loop
                            muted={true}
                            playsInline
                            onLoadedData={(e) => {
                              setLoadedMediaUrl(mediaUrl);
                              const vid = e.currentTarget;
                              if (vid.duration && isFinite(vid.duration) && vid.duration > 0) {
                                const videoDurationMs = Math.ceil(vid.duration * 1000);
                                setAutoAdvanceDuration(videoDurationMs);
                              }
                            }}
                          />
                          </div>
                        ) : (
                          <img
                            key={mediaUrl}
                            src={mediaUrl}
                            alt={`Day ${currentActivity.dayNumber}`}
                            className="absolute inset-0 w-full h-full"
                            loading="eager"
                            decoding="async"
                            style={{ 
                              objectFit: 'cover',
                              filter: shouldShowLocked ? 'blur(20px)' : 'none',
                              opacity: mediaLoaded ? 1 : 0,
                              transition: 'opacity 0.2s ease',
                            }}
                            onLoad={() => setLoadedMediaUrl(mediaUrl)}
                            onError={(e) => {
                              const img = e.currentTarget;
                              if (!img.dataset.retried) {
                                img.dataset.retried = "true";
                                img.src = mediaUrl + "?t=" + Date.now();
                              }
                            }}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Share button removed from card — now in bottom zone */}
                    
                    {/* Lock overlay for locked content */}
                    {shouldShowLocked && (
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl cursor-pointer"
                        style={{
                          border: '1.5px solid rgba(255,255,255,0.15)',
                          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.2)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMakePublicSheet(true);
                        }}
                      >
                        <div
                          className="flex flex-col items-center gap-3"
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
                              setShowMakePublicSheet(true);
                            }}
                            className="mt-2 px-6 py-2.5 rounded-full font-semibold text-sm active:scale-95 transition-transform"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,240,240,0.95) 100%)',
                              color: '#000',
                              boxShadow: '0 4px 20px rgba(255,255,255,0.2)',
                            }}
                          >
                            View Post
                          </button>
                        </div>
                      </div>
                    )}
                    
                    </motion.div>{/* end 9:16 card */}

                    {/* Floating 3D emoji reactions - OUTSIDE overflow-hidden card so they aren't clipped */}
                    {!shouldShowLocked && (
                      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 25, overflow: 'hidden', borderRadius: '0px' }}>
                        <Floating3DEmojis 
                          reactions={activeReactionTypes}
                          newReaction={null}
                          isPaused={isPaused}
                        />
                        {/* iMessage-style emoji rain on story load */}
                        <StoryEmojiRain
                          triggerKey={contentKey}
                          reactions={activeReactionTypes}
                          active={mediaLoaded && activeReactionTypes.length > 0}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
          </motion.div>
          
          {/* Right arrow indicator - only on first story */}
          {effectiveUserGroups.length > 1 && currentUserIndex === 0 && currentActivityIndex === 0 && (
            <motion.button
              onClick={goNextUser}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              initial={{ opacity: 0, x: -5 }}
              animate={{ 
                opacity: [0.4, 1, 0.4],
                x: [0, 4, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <ChevronRight className="w-7 h-7 text-white drop-shadow-lg" />
            </motion.button>
          )}
            </div>

            {/* React row sits below the reel card with a fixed 10px gap */}
            <div className="shrink-0 flex flex-col items-center justify-center pt-3 pb-2" style={{ minHeight: 56 }}>
          {(() => {
            // Lock content if user's profile is private OR they haven't shared any public activity
            const isContentLocked = !isOwnStory && !profile?.stories_public;
            
            return (
              <div 
                className="w-full flex flex-col items-center"
                style={{
                  pointerEvents: isContentLocked ? 'none' : 'auto',
                  opacity: isTransitioning ? 0 : 1,
                  transform: isTransitioning ? 'translateY(-142px)' : 'translateY(-42px)',
                  transition: 'opacity 0.2s ease, transform 0.2s ease',
                }}
              >
                {/* Reaction pill + Share icon row — hidden for log-activity placeholder */}
                <div className="flex items-center justify-center gap-3 px-4" style={{ visibility: isLogActivityCard ? 'hidden' : 'visible' }}>
                  {/* Liquid glass reaction pill */}
                  <button
                    onClick={() => { isOwnStory ? setShowReactsSheet(true) : setShowSendReactionSheet(true); }}
                    className="relative overflow-hidden active:scale-[0.97] transition-transform"
                    style={{
                      minWidth: currentReactions.total > 0 ? 180 : 160,
                      height: 44,
                      borderRadius: 22,
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(40px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                    }}
                  >
                  {isOwnStory ? (
                    <div
                      className="flex items-center justify-center gap-3 h-full px-5"
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
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-center gap-3 h-full px-5"
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
                    </div>
                  )}
                  </button>

                  {/* Share & Edit buttons — aligned with reaction pill */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isOwnStory && !isWeekRecapStory && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareStory();
                        }}
                        className="shrink-0 active:scale-95 transition-transform"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          background: 'rgba(255, 255, 255, 0.08)',
                          backdropFilter: 'blur(40px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Share2 className="w-[18px] h-[18px] text-white/80" strokeWidth={1.5} />
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          
                          setShowEditSheet(true);
                        }}
                        className="shrink-0 active:scale-95 transition-transform"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          background: 'rgba(255, 255, 255, 0.08)',
                          backdropFilter: 'blur(40px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Pencil className="w-[18px] h-[18px] text-white/70" strokeWidth={1.5} />
                      </button>
                    )}
                    {/* History button — view all past activities of this user */}
                    {!isLogActivityCard && !isWeekRecapStory && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHistoryGallery(true);
                        }}
                        className="shrink-0 active:scale-95 transition-transform"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          background: 'rgba(255, 255, 255, 0.08)',
                          backdropFilter: 'blur(40px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <History className="w-[18px] h-[18px] text-white/70" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
            </div>
        </div>
      </div>{/* end overflow:hidden flex container */}

      {/* Progress drawer removed — now a standalone page via nav */}

      {/* Reacts bottom sheet for own stories */}
      {showReactsSheet &&
        createPortal(
          <ReactsSoFarSheet
            activityId={currentActivity?.id || ''}
            total={currentReactions.total}
            reactions={currentReactions.reactions}
            reactorProfiles={currentReactions.reactorProfiles}
            onClose={() => setShowReactsSheet(false)}
            onReactionRemoved={loadActivities}
          />,
          portalContainer,
        )}

      {/* Send reaction sheet for all stories */}
      {showSendReactionSheet &&
        createPortal(
          <SendReactionSheet
            activityId={currentActivity?.id}
            currentUserId={user?.id}
            activityType={currentActivity?.activity || undefined}
            onReact={handleReact}
            onClose={() => setShowSendReactionSheet(false)}
            onViewReactions={() => {
              setShowSendReactionSheet(false);
              setShowReactsSheet(true);
            }}
            onReactionRemoved={(reactionType) => {
              // Update local state without reloading
              setLocalReactions(prev => {
                const existing = prev[currentActivity!.id];
                if (!existing) return prev;

                const newReactions = { ...existing.reactions };
                if (newReactions[reactionType]) {
                  newReactions[reactionType] = {
                    ...newReactions[reactionType],
                    count: Math.max(0, newReactions[reactionType].count - 1),
                    userReacted: false,
                  };
                }

                return {
                  ...prev,
                  [currentActivity!.id]: {
                    total: Math.max(0, existing.total - 1),
                    reactions: newReactions,
                    reactorProfiles: existing.reactorProfiles.filter(p => p.userId !== user?.id),
                  },
                };
              });
            }}
            totalReactions={currentReactions.total}
            reactorProfiles={currentReactions.reactorProfiles}
          />,
          portalContainer,
        )}


      {/* History Gallery Overlay — shows all past activities of the currently viewed user */}
      {showHistoryGallery && currentGroup && (() => {
        // Get ALL activities for this user from userGroups (not filtered)
        const fullGroup = userGroups.find(g => g.userId === currentGroup.userId);
        const allUserActivities: GalleryActivity[] = (fullGroup?.activities || currentGroup.activities)
          .filter(a => a.dayNumber < 1001 && a.id !== 'log-activity')
          .sort((a, b) => b.dayNumber - a.dayNumber)
          .map(a => ({
            id: a.id,
            storageUrl: a.storageUrl,
            originalUrl: a.originalUrl || undefined,
            isVideo: a.isVideo || false,
            activity: a.activity || undefined,
            frame: a.frame || undefined,
            duration: a.duration || undefined,
            pr: a.pr || undefined,
            dayNumber: a.dayNumber,
            reactionCount: localReactions[a.id]?.total || a.reactionCount || 0,
            reactions: localReactions[a.id]?.reactions || a.reactions || {},
            reactorProfiles: localReactions[a.id]?.reactorProfiles || a.reactorProfiles || [],
          }));
        
        // Find earliest activity date for start date
        const sortedByDate = [...allUserActivities].sort((a, b) => {
          const aDate = (fullGroup?.activities.find(x => x.id === a.id) as any)?.createdAt;
          const bDate = (fullGroup?.activities.find(x => x.id === b.id) as any)?.createdAt;
          return new Date(aDate || 0).getTime() - new Date(bDate || 0).getTime();
        });
        const startDate = (fullGroup?.activities.find(x => x.id === sortedByDate[0]?.id) as any)?.createdAt;
        
        // Find current activity index in the full list
        const currentIdx = allUserActivities.findIndex(a => a.id === currentActivity?.id);
        
        return (
          <ActivityGalleryOverlay
            isOpen={true}
            onClose={() => setShowHistoryGallery(false)}
            activities={allUserActivities}
            initialIndex={currentIdx >= 0 ? currentIdx : 0}
            userProfile={{
              displayName: currentGroup.displayName,
              avatarUrl: currentGroup.avatarUrl,
              startDate: startDate || undefined,
            }}
          />
        );
      })()}

      {/* Edit/Replace Sheet */}
      <MediaSourceSheet
        isOpen={showEditSheet}
        onClose={() => setShowEditSheet(false)}
        dayNumber={currentActivity?.dayNumber || 1}
        activity={currentActivity?.activity || undefined}
        preserveActivity={true}
      />
      
      {/* Make Public Sheet */}
      <MakePublicSheet
        isOpen={showMakePublicSheet}
        onClose={() => setShowMakePublicSheet(false)}
        onMakePublic={async () => {
          // Ensure profile visibility is public so the community feed unlocks.
          try {
            if (profile?.stories_public === false) {
              await updateProfile({ stories_public: true });
            }
          } catch (e) {
            console.error('Failed to set profile public:', e);
          }

          const latestActivity = myActivities[myActivities.length - 1];
          if (latestActivity) {
            await makeActivityPublic(latestActivity.dayNumber);
          }
          setShowMakePublicSheet(false);
          loadActivities();
        }}
        onKeepPrivate={() => setShowMakePublicSheet(false)}
      />

      <AlertDialog open={showShareOptions} onOpenChange={setShowShareOptions}>
        <AlertDialogContent
          className="rounded-3xl border-0 max-w-[320px]"
          style={{
            background: 'rgba(20, 20, 30, 0.95)',
            backdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-center text-lg">Share Template</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60 text-center text-sm">
              How do you want to share this?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-2">
            <button
              onClick={() => {
                setShowShareOptions(false);
                shareToChannel('whatsapp');
              }}
              className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white/90 bg-white/10 hover:bg-white/15 transition-colors"
            >
              WhatsApp
            </button>
            <button
              onClick={() => {
                setShowShareOptions(false);
                shareToChannel('instagram');
              }}
              className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white/90 bg-white/10 hover:bg-white/15 transition-colors"
            >
              Instagram
            </button>
            <button
              onClick={() => {
                setShowShareOptions(false);
                shareToChannel('messages');
              }}
              className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white/90 bg-white/10 hover:bg-white/15 transition-colors"
            >
              Messages
            </button>
            <button
              onClick={async () => {
                setShowShareOptions(false);
                await handleSystemShare();
              }}
              className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white/90 bg-white/10 hover:bg-white/15 transition-colors"
            >
              More apps
            </button>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full border-0 text-white/80 hover:text-white" style={{ background: 'rgba(255,255,255,0.1)' }}>
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DynamicBlurBackground>
  );
};

export default Reel;
