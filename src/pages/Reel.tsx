import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronUp, Trash2, Lock, ChevronRight, Volume2, VolumeX, RefreshCw, Share2, RotateCcw, Sparkles, Download, Play, Pause } from 'lucide-react';
import PullToRefresh from '@/components/PullToRefresh';
import { ReactionType, toggleReaction, sendReaction, ActivityReaction } from '@/services/journey-service';
import { isVideoUrl } from '@/lib/media';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { fetchAllActivitiesGroupedByUser, fetchPublicFeed, UserStoryGroup, LocalActivity } from '@/hooks/use-journey-activities';
import { useJourneyActivities } from '@/hooks/use-journey-activities';
import DynamicBlurBackground from '@/components/DynamicBlurBackground';
import Floating3DEmojis from '@/components/Floating3DEmojis';
import StoryEmojiRain from '@/components/StoryEmojiRain';
import ReactsSoFarSheet from '@/components/ReactsSoFarSheet';
import SendReactionSheet from '@/components/SendReactionSheet';
import ProfileAvatar from '@/components/ProfileAvatar';
import ReelToProgressTransition from '@/components/ReelToProgressTransition';
import MakePublicSheet from '@/components/MakePublicSheet';
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
  createdAt?: string;
}

const SWIPE_THRESHOLD = 50;

const Reel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  
  // Navigation state - extract once
  const navState = location.state || {};
  const deepLinkActivityId = navState.activityId as string | undefined;
  const deepLinkDayNumber = navState.dayNumber as number | undefined;
  const weekRecapVideoFromNav = navState.weekRecapVideo as string | undefined;
  const weekRecapNumber = navState.weekNumber as number | undefined;
  
  // Determine navigation intent:
  // - hasDeepLink: user tapped a specific story card (should open THAT story, never recap)
  // - hasWeekRecap: user tapped PLAY NOW pill (should open week recap)
  const hasDeepLink = !!(deepLinkActivityId || (typeof deepLinkDayNumber === 'number' && deepLinkDayNumber > 0));
  const hasWeekRecap = !hasDeepLink && typeof weekRecapVideoFromNav === 'string' && weekRecapVideoFromNav.length > 0;
  
  // State for user story groups
  const [userGroups, setUserGroups] = useState<UserStoryGroup[]>([]);
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
    reactions: Record<ReactionType, ActivityReaction>;
    reactorProfiles: ReactorProfile[];
  }>>({});
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Auto-advance timer state — dynamic duration based on media type
  const DEFAULT_ADVANCE_DURATION = 10000; // 10 seconds for images
  const [autoAdvanceDuration, setAutoAdvanceDuration] = useState(DEFAULT_ADVANCE_DURATION);
  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceStartRef = useRef<number>(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Media loading state - timer only starts after media loads
  const [mediaLoaded, setMediaLoaded] = useState(false);
  
  // Audio state for video playback
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarStripRef = useRef<HTMLDivElement>(null);
  const activeAvatarRef = useRef<HTMLButtonElement>(null);

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
  
  // Recap viewer state
  const [isAddingToStories, setIsAddingToStories] = useState(false);
  const [showDeleteRecapConfirm, setShowDeleteRecapConfirm] = useState(false);
  const [recapPlaying, setRecapPlaying] = useState(true);

  // Story nudge animation for inactivity hint
  const { triggerShake, shakeAnimation, shakeTransition } = useStoryNudgeAnimation();

  // Create a unique key for this navigation to detect re-navigation
  const currentNavKey = `${deepLinkActivityId || ''}-${deepLinkDayNumber || ''}-${weekRecapVideoFromNav || ''}`;
  
  // Reset navigation state when navigation changes
  useEffect(() => {
    if (currentNavKey !== navigationKeyRef.current) {
      navigationKeyRef.current = currentNavKey;
      setNavigationInitialized(false);
    }
  }, [currentNavKey]);

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
    // Add week recap entries for all users with completed weeks
    for (const group of groups) {
      const completedWeekCount = Math.floor(group.activities.length / 3);
      if (completedWeekCount > 0) {
        map[`week-recap-${group.userId}`] = {
          total: 0,
          reactions: { ...DEFAULT_REACTIONS },
          reactorProfiles: [],
        };
      }
    }
    setLocalReactions(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // No longer auto-inject week recaps into stories
  // User must explicitly share/upload their recap before it appears in stories
  const effectiveUserGroups = useMemo(() => {
    return userGroups;
  }, [userGroups]);

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
    
    // CASE 2: Default navigation - ALWAYS start with current user's own stories only
    if (user) {
      const myIdx = effectiveUserGroups.findIndex(g => g.userId === user.id);
      if (myIdx >= 0) {
        setCurrentUserIndex(myIdx);
        setCurrentActivityIndex(0);
      } else {
        // User has no activities — show empty state by keeping index 0
        setCurrentUserIndex(0);
        setCurrentActivityIndex(0);
      }
    }
    
    setNavigationInitialized(true);
  }, [loading, effectiveUserGroups, navigationInitialized, hasDeepLink, deepLinkActivityId, deepLinkDayNumber, user]);

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

  // Navigate between activities within current user (tap to cycle)
  const cycleActivity = useCallback(() => {
    if (!currentGroup) return;
    
    if (currentActivityIndex < currentGroup.activities.length - 1) {
      // More activities in this user's story
      setCurrentActivityIndex(prev => prev + 1);
    } else {
      // Finished this user's stories, move to next user
      if (currentUserIndex < effectiveUserGroups.length - 1) {
        setCurrentUserIndex(prev => prev + 1);
        setCurrentActivityIndex(0);
      }
    }
  }, [currentGroup, currentActivityIndex, currentUserIndex, effectiveUserGroups.length]);

  // Navigate to previous activity
  const prevActivity = useCallback(() => {
    if (currentActivityIndex > 0) {
      setCurrentActivityIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      // Go to previous user's last activity
      const prevUser = effectiveUserGroups[currentUserIndex - 1];
      setCurrentUserIndex(prev => prev - 1);
      setCurrentActivityIndex(prevUser ? prevUser.activities.length - 1 : 0);
    }
  }, [currentActivityIndex, currentUserIndex, effectiveUserGroups]);

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
  const [userTransitionFlash, setUserTransitionFlash] = useState(false);
  const prevUserIndexRef = useRef(currentUserIndex);
  
  // Flash highlight and scroll active avatar into view when switching users
  useEffect(() => {
    if (currentUserIndex !== prevUserIndexRef.current) {
      setUserTransitionFlash(true);
      setTimeout(() => setUserTransitionFlash(false), 600);
      prevUserIndexRef.current = currentUserIndex;
    }
    // Scroll active avatar into view
    if (activeAvatarRef.current) {
      activeAvatarRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentUserIndex, currentActivityIndex]);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
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
  }, [lastTap, cycleActivity, prevActivity, isOwnStory]);

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
      const idx = effectiveUserGroups.findIndex(g => g.userId === userId);
      if (idx >= 0) {
        setCurrentUserIndex(idx);
        setCurrentActivityIndex(0);
      }
    }
  };

  const handleReact = async (type: ReactionType) => {
    if (!currentActivity || isOwnStory) return; // Owners cannot react to their own activities

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
    navigate('/', { replace: true });
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

  // Auto-advance timer - pause when modals are open OR content is locked
  // Determine if story should be locked (user's profile is private OR they haven't shared any public activity)
  const isStoryLocked = !isOwnStory && (!profile?.stories_public || !hasPublicActivity);
  const isPaused = showReactsSheet || showSendReactionSheet || showDeleteConfirm || showMakePublicSheet || showProgressOverlay || isStoryLocked;
  
  // Reset mediaLoaded and duration when activity changes
  useEffect(() => {
    setMediaLoaded(false);
    setAutoAdvanceProgress(0);
    setAutoAdvanceDuration(DEFAULT_ADVANCE_DURATION); // Reset to default, will be updated when video loads
  }, [currentUserIndex, currentActivityIndex]);
  
  useEffect(() => {
    // Clear any existing timer
    if (autoAdvanceTimerRef.current) {
      clearInterval(autoAdvanceTimerRef.current);
    }
    
    // Don't run auto-advance in recap viewer mode
    if (hasWeekRecap) return;
    
    // Don't start timer until media is loaded
    if (isPaused || loading || !currentActivity || !mediaLoaded) {
      return;
    }
    
    // Reset progress when starting timer
    setAutoAdvanceProgress(0);
    autoAdvanceStartRef.current = Date.now();
    
    // Update progress every 50ms for smooth animation
    autoAdvanceTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - autoAdvanceStartRef.current;
      const progress = Math.min(elapsed / autoAdvanceDuration, 1);
      setAutoAdvanceProgress(progress);
      
      if (progress >= 1) {
        // Auto-advance to next story
        cycleActivity();
      }
    }, 50);
    
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearInterval(autoAdvanceTimerRef.current);
      }
    };
  }, [currentUserIndex, currentActivityIndex, isPaused, loading, currentActivity, cycleActivity, mediaLoaded, hasWeekRecap, autoAdvanceDuration]);

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
    navigate('/', { replace: true });
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

  // Handler: Share current story via Web Share API
  const handleShareStory = useCallback(async () => {
    try {
      const mediaUrl = currentActivity?.storageUrl || currentActivity?.originalUrl;
      const userName = currentGroup?.displayName || 'Someone';
      const activityName = currentActivity?.activity || 'workout';
      const shareText = isOwnStory 
        ? `Check out my ${activityName} on my fitness journey! 💪`
        : `Check out ${userName}'s ${activityName}! 🔥`;

      if (navigator.share) {
        const shareData: ShareData = {
          title: `${isOwnStory ? 'My' : `${userName}'s`} Fitness Story`,
          text: shareText,
        };

        // Try to share the media file if possible
        if (mediaUrl) {
          try {
            const response = await fetch(mediaUrl);
            const blob = await response.blob();
            const ext = currentActivity?.isVideo ? 'mp4' : 'jpg';
            const file = new File([blob], `story.${ext}`, { type: blob.type });
            if (navigator.canShare?.({ files: [file] })) {
              shareData.files = [file];
            }
          } catch {
            if (mediaUrl.startsWith('http')) {
              shareData.url = mediaUrl;
            }
          }
        }

        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Copied to clipboard!');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error('Failed to share');
      }
    }
  }, [currentActivity, currentGroup, isOwnStory]);

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
        <div className="relative z-10 flex-1 flex flex-col px-6 pb-3 min-h-0">
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

  // Use storageUrl (templated/framed screenshot) for display, fall back to originalUrl
  const mediaUrl = currentActivity.storageUrl || currentActivity.originalUrl || '';
  const isVideo = currentActivity.isVideo || isVideoUrl(mediaUrl); // Check both flag and URL
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
        {/* Story Hint - one-time tutorial with shake nudge */}
        <StoryHint 
          hasMultipleStories={currentGroup?.activities.length > 1}
          hasMultipleUsers={effectiveUserGroups.length > 1}
          onNudge={triggerShake}
        />

        {/* FIXED HEADER ZONE - Single row: delete, avatars, close + user name below */}
        <div 
          className="shrink-0 z-50 flex flex-col"
          style={{ 
            paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)',
          }}
        >
          {/* Row 1: Delete + Avatars + Close - all in one row */}
          <div
            className="flex items-center justify-between px-3 shrink-0"
            style={{ height: 56 }}
          >
            {/* Left side - Delete button */}
            <div className="w-10 shrink-0">
              {canEdit && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 transition-colors rounded-full text-white/80 hover:text-red-400 min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95"
                >
                  <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Center - User avatars strip - SCROLLABLE horizontally */}
            <div className="flex-1 overflow-hidden mx-2">
              <div 
                ref={avatarStripRef}
                className={`flex items-center gap-2 overflow-x-auto scrollbar-hide ${effectiveUserGroups.length === 1 ? 'justify-center' : ''}`}
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <div className="flex items-center gap-2 px-1">
                  {effectiveUserGroups.map((group, idx) => {
                    const isActive = idx === currentUserIndex;
                    const activityCount = group.activities.length;
                    const currentIdx = idx === currentUserIndex ? currentActivityIndex : 0;
                    const isOwnProfile = user && group.userId === user.id;
                    // Stories are locked, but profile photos are ALWAYS visible
                    const isStoryLocked = !isOwnProfile && !hasPublicActivity;
                    const avatarSize = isActive ? 48 : 40;
                    
                      return (
                      <button
                        key={group.userId}
                        ref={isActive ? activeAvatarRef : undefined}
                        onClick={() => {
                          setCurrentUserIndex(idx);
                          setCurrentActivityIndex(0);
                        }}
                        className="relative active:scale-95 flex-shrink-0"
                        style={{ 
                          transform: isActive ? 'scale(1)' : 'scale(0.85)',
                          opacity: isActive ? 1 : 0.5,
                          transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                          filter: isActive && userTransitionFlash ? 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.6))' : 'none',
                        }}
                      >
                        {/* Instagram-style story ring with auto-advance progress */}
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
                            const isCurrentSegment = isActive && segIdx === currentIdx;
                            const isSegmentViewed = segIdx < currentIdx;
                            const isSegmentUnviewed = segIdx > currentIdx;
                            
                            const radius = 44;
                            const circumference = 2 * Math.PI * radius;
                            const segmentLength = (segmentAngle / 360) * circumference;
                            const offset = (startAngle / 360) * circumference;
                            
                            // For the current segment, show progress animation
                            const progressLength = isCurrentSegment 
                              ? segmentLength * autoAdvanceProgress 
                              : segmentLength;
                            
                            return (
                              <g key={segIdx}>
                                {/* Background track for current segment */}
                                {isCurrentSegment && (
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    fill="none"
                                    strokeWidth="6"
                                    stroke="rgba(255,255,255,0.15)"
                                    strokeDasharray={`${segmentLength} ${circumference}`}
                                    strokeDashoffset={-offset}
                                    strokeLinecap="round"
                                  />
                                )}
                                {/* Segment fill */}
                                <circle
                                  cx="50"
                                  cy="50"
                                  r={radius}
                                  fill="none"
                                  strokeWidth="6"
                                  stroke={
                                    isStoryLocked 
                                      ? 'rgba(255,255,255,0.15)' 
                                      : isSegmentUnviewed 
                                        ? 'rgba(255,255,255,0.25)'
                                        : 'url(#storyGradient)'
                                  }
                                  strokeDasharray={`${isCurrentSegment ? progressLength : segmentLength} ${circumference}`}
                                  strokeDashoffset={-offset}
                                  strokeLinecap="round"
                                  style={{
                                    filter: !isStoryLocked && (isSegmentViewed || isCurrentSegment) 
                                      ? 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.5))' 
                                      : 'none',
                                    transition: isCurrentSegment ? 'none' : 'stroke-dasharray 0.3s ease',
                                  }}
                                />
                              </g>
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
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Right side - Close button */}
            <div className="flex items-center shrink-0">
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white transition-colors p-2 min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <X className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Row 2: Current user name/info */}
          <div className="shrink-0 px-4 pb-2">
            {/* User name and info */}
            <div className="flex items-center justify-center gap-2" style={{ height: 20 }}>
              <span className="text-white font-semibold text-sm">{currentGroup.displayName}</span>
              <span className="text-white/40">•</span>
              {isWeekRecapStory || isRecapActivity ? (
                <span className="text-white/60 text-xs">Week {weekRecapNumber || 1} Recap</span>
              ) : currentActivity.dayNumber < 1000 ? (
                <span className="text-white/60 text-xs">Week {week} • Day {dayInWeek}</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT ZONE - flexible middle section */}
        <div
          className="flex-1 flex items-center justify-center z-30 overflow-hidden relative"
        >
          {/* Card container with shake animation - single wrapper */}
          <motion.div 
            className="relative w-full h-full flex items-center justify-center"
            style={{ 
              maxHeight: '100%',
              x: dragX,
              opacity: cardOpacity,
              rotateY: cardRotate,
              scale: cardScale,
            }}
            animate={shakeAnimation}
            transition={shakeTransition}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleHorizontalDragEnd}
            onClick={handleTap}
          >
              {/* Full templated image/video - with lock overlay for non-public users */}
              {(() => {
                // Lock content if user's profile is private OR they haven't shared any public activity
                const shouldShowLocked = !isOwnStory && (!profile?.stories_public || !hasPublicActivity);
                
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
                    {/* Card — 9:16 aspect ratio, contained within zone, no rounded corners to avoid black edges */}
                    <div
                      className="relative overflow-hidden"
                      style={{
                        aspectRatio: '9/16',
                        height: '100%',
                        maxWidth: '100%',
                        borderRadius: '0px',
                        background: 'transparent',
                      }}
                    >
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        key={contentKey}
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ 
                          duration: 0.15, 
                          ease: 'easeOut',
                        }}
                      >
                        {isRecapGenerating ? (
                          // Show generating placeholder for week recap
                          <div 
                            className="w-full h-full rounded-3xl flex flex-col items-center justify-center gap-6"
                            style={{
                              background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)',
                            }}
                          >
                            {/* Animated loading spinner */}
                            <div className="relative w-16 h-16">
                              <svg className="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 64 64">
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  fill="none"
                                  stroke="hsl(var(--foreground) / 0.1)"
                                  strokeWidth="4"
                                />
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  fill="none"
                                  stroke="hsl(var(--primary))"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  strokeDasharray={`${2 * Math.PI * 28 * 0.3} ${2 * Math.PI * 28 * 0.7}`}
                                />
                              </svg>
                            </div>
                            
                            <div className="text-center px-8">
                              <p className="text-foreground font-semibold text-lg mb-2">
                                Generating your AI recap...
                              </p>
                              <p className="text-muted-foreground text-sm">
                                This usually takes 1-2 minutes
                              </p>
                            </div>
                          </div>
                        ) : isVideo ? (
                          <video
                            ref={videoRef}
                            key={mediaUrl}
                            src={mediaUrl}
                            className="absolute inset-0 w-full h-full"
                            style={{ 
                              objectFit: 'cover',
                              filter: shouldShowLocked ? 'blur(20px)' : 'none',
                              opacity: mediaLoaded ? 1 : 0,
                              transition: 'opacity 0.2s ease',
                            }}
                            autoPlay
                            loop
                            muted={isMuted}
                            playsInline
                            onLoadedData={(e) => {
                              setMediaLoaded(true);
                              const vid = e.currentTarget;
                              if (vid.duration && isFinite(vid.duration) && vid.duration > 0) {
                                const videoDurationMs = Math.ceil(vid.duration * 1000);
                                setAutoAdvanceDuration(videoDurationMs);
                              }
                            }}
                          />
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
                            onLoad={() => setMediaLoaded(true)}
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
                    {/* Segmented progress bar at top of card - GPU accelerated */}
                    {currentGroup && currentGroup.activities.length > 0 && (
                      <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                        {currentGroup.activities.map((_, idx) => {
                          const isCurrentSegment = idx === currentActivityIndex;
                          const isViewed = idx < currentActivityIndex;
                          const progress = isViewed ? 1 : isCurrentSegment ? autoAdvanceProgress : 0;
                          
                          return (
                            <div
                              key={idx}
                              className="flex-1 h-[3px] rounded-full overflow-hidden"
                              style={{
                                background: 'rgba(255,255,255,0.25)',
                              }}
                            >
                              <div
                                className="h-full w-full rounded-full"
                                style={{
                                  background: 'rgba(255,255,255,0.9)',
                                  transform: `scaleX(${progress})`,
                                  transformOrigin: 'left',
                                  transition: isCurrentSegment ? 'none' : 'transform 0.3s ease',
                                  willChange: 'transform',
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    

                    {/* Audio toggle button for videos */}
                    {isVideo && !shouldShowLocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMuted(!isMuted);
                          if (videoRef.current) {
                            videoRef.current.muted = !isMuted;
                          }
                        }}
                        className="absolute bottom-3 right-3 z-20 p-2.5 rounded-full active:scale-95 transition-transform"
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5 text-white" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-white" />
                        )}
                      </button>
                    )}
                    
                    {/* Lock overlay for locked content */}
                    {shouldShowLocked && (
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl"
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
                        </div>
                      </div>
                    )}
                    
                    {/* Floating 3D emoji reactions - inside image container */}
                    {!shouldShowLocked && (
                      <Floating3DEmojis 
                        reactions={activeReactionTypes}
                        newReaction={null}
                        isPaused={isPaused}
                      />
                    )}
                    
                    {/* iMessage-style emoji rain on story load */}
                    {!shouldShowLocked && (
                      <StoryEmojiRain
                        triggerKey={contentKey}
                        reactions={activeReactionTypes}
                        active={mediaLoaded && activeReactionTypes.length > 0}
                      />
                    )}
                    
                    </div>{/* end 9:16 card */}
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

        {/* FIXED BOTTOM ZONE - Reaction pill + View Progress - compact sticky */}
        <div 
          className="shrink-0 z-40 flex flex-col items-center gap-2"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {(() => {
            // Lock content if user's profile is private OR they haven't shared any public activity
            const isContentLocked = !isOwnStory && (!profile?.stories_public || !hasPublicActivity);
            
            return (
              <div 
                className="w-full flex flex-col items-center"
                style={{
                  pointerEvents: isContentLocked ? 'none' : 'auto',
                  opacity: (isTransitioning || isContentLocked) ? 0 : 1,
                  transform: isTransitioning ? 'translateY(-100px)' : 'translateY(0)',
                  transition: 'opacity 0.2s ease, transform 0.2s ease',
                }}
              >
                {/* Share button - centered, just above reactions pill */}
                {!isContentLocked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareStory();
                    }}
                    className="mb-1.5 p-2.5 rounded-full active:scale-95 transition-transform"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                    }}
                  >
                    <Share2 className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </button>
                )}
                {/* Liquid glass reaction pill */}
                <button
                  onClick={() => isOwnStory ? (currentReactions.total > 0 && setShowReactsSheet(true)) : setShowSendReactionSheet(true)}
                  className="relative overflow-hidden mb-2 active:scale-[0.97] transition-transform"
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
              </div>
            );
          })()}


          <motion.div
            className="w-full"
            style={{ y: bottomSheetY }}
            drag="y"
            dragConstraints={{ top: -200, bottom: 0 }}
            dragElastic={{ top: 0.3, bottom: 0 }}
            onDragEnd={handleBottomSheetDragEnd}
          >
            <button
              onClick={handleNavigateToProgress}
              className="w-full flex items-center justify-center gap-2 py-3 cursor-grab active:cursor-grabbing active:bg-white/5 transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              }}
            >
              <ChevronUp className="w-5 h-5 text-white/60" />
              <span className="text-white/80 text-sm font-medium">View Progress</span>
            </button>
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

      {/* Delete confirmation dialog - Liquid glass design */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent 
          className="text-white max-w-[320px] rounded-3xl border-0 p-0 overflow-hidden"
          style={{
            background: 'transparent',
            boxShadow: 'none',
          }}
        >
          {/* Outer reflective border ring */}
          <div
            className="relative rounded-3xl p-px overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.18) 70%, rgba(255,255,255,0.04) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 32px 64px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            {/* Glass inner surface — neutral clear glass, no color tint */}
            <div
              className="relative rounded-[23px] overflow-hidden"
              style={{
                background: 'rgba(30,28,40,0.35)',
                backdropFilter: 'blur(60px) saturate(180%)',
                WebkitBackdropFilter: 'blur(60px) saturate(180%)',
              }}
            >
              {/* Inner top light beam highlight */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.55) 60%, transparent 95%)',
                }}
              />
              {/* Subtle inner glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 50% 0%, rgba(160,120,240,0.18) 0%, transparent 60%)',
                }}
              />

              <div className="px-6 pt-7 pb-6">
                <AlertDialogHeader className="mb-5">
                  <AlertDialogTitle className="text-white text-center text-[18px] font-bold tracking-tight">
                    Delete this activity?
                  </AlertDialogTitle>
                  <AlertDialogDescription
                    className="text-center text-sm leading-relaxed mt-2"
                    style={{ color: 'rgba(200,185,230,0.7)' }}
                  >
                    This will permanently remove Day {currentActivity?.dayNumber} from your journey. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex-row gap-3 sm:justify-center mt-1">
                  {/* Cancel — ghost glass button */}
                  <AlertDialogCancel
                    className="flex-1 m-0 h-12 rounded-2xl text-white font-semibold text-[15px] active:scale-[0.97] transition-transform border-0 hover:bg-transparent focus:ring-0"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 1px 3px rgba(0,0,0,0.2)',
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </AlertDialogCancel>

                  {/* Delete — danger red glass button */}
                  <AlertDialogAction
                    onClick={handleDeleteActivity}
                    className="flex-1 m-0 h-12 rounded-2xl text-white font-semibold text-[15px] active:scale-[0.97] transition-transform border-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(239,68,68,0.85) 0%, rgba(185,28,28,0.9) 100%)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
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
    </DynamicBlurBackground>
  );
};

export default Reel;
