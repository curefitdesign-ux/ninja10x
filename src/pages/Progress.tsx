import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useJourneyActivities, fetchPublicFeed, LocalActivity } from "@/hooks/use-journey-activities";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import MakePublicSheet, { hasUserChosenPublic } from "@/components/MakePublicSheet";
import ReelToProgressTransition from "@/components/ReelToProgressTransition";
import MediaSourceSheet from "@/components/MediaSourceSheet";
import SharedImageTransition from "@/components/SharedImageTransition";

const Progress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();

  const { activities: myActivities, loading, hasPublicActivity, makeActivityPublic } = useJourneyActivities();

  // Public feed for story strip inside ReelToProgressTransition
  const [publicFeed, setPublicFeed] = useState<LocalActivity[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // Sheet states
  const [showMakePublicSheet, setShowMakePublicSheet] = useState(false);
  const [showMediaSourceSheet, setShowMediaSourceSheet] = useState(false);
  const [pendingDayNumber, setPendingDayNumber] = useState<number | null>(null);

  // Transition state
  const [showTransitionIn, setShowTransitionIn] = useState(false);

  // Navigation state
  const transitionImage = location.state?.transitionImage;
  const transitionDayNumber = location.state?.dayNumber || 1;
  const transitionToProgress = location.state?.transitionToProgress;

  useEffect(() => {
    const loadFeed = async () => {
      setFeedLoading(true);
      const feed = await fetchPublicFeed(true);
      setPublicFeed(feed);
      setFeedLoading(false);
    };
    loadFeed();
  }, []);

  // Handle transition from share
  useEffect(() => {
    if (transitionToProgress && transitionImage) {
      setShowTransitionIn(true);
      setTimeout(() => setShowTransitionIn(false), 300);

      const currentActivity = myActivities.find(a => a.dayNumber === transitionDayNumber);
      if (currentActivity && !currentActivity.isPublic) {
        const isProfilePublic = profile?.stories_public === true;
        if (isProfilePublic || hasUserChosenPublic()) {
          makeActivityPublic(transitionDayNumber);
        } else {
          setTimeout(() => {
            setPendingDayNumber(transitionDayNumber);
            setShowMakePublicSheet(true);
          }, 400);
        }
      }
    }
  }, [transitionToProgress, transitionImage, transitionDayNumber, myActivities, makeActivityPublic, profile?.stories_public]);

  const handleMakePublic = async () => {
    try {
      if (profile?.stories_public === false) {
        await updateProfile({ stories_public: true });
      }
    } catch (e) {
      console.error('Failed to set profile public:', e);
    }
    if (pendingDayNumber) {
      await makeActivityPublic(pendingDayNumber);
    }
    setShowMakePublicSheet(false);
    setPendingDayNumber(null);
  };

  const handleKeepPrivate = () => {
    setShowMakePublicSheet(false);
    setPendingDayNumber(null);
  };

  const handleStoryTap = (index: number, userId?: string, activityId?: string) => {
    navigate('/reel', {
      state: {
        userId,
        activityId,
        fromProgress: true,
      }
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden touch-manipulation"
      style={{
        background: "linear-gradient(180deg, #3A2A63 0%, #1A1530 45%, #060608 100%)",
        height: '100dvh',
        minHeight: '-webkit-fill-available',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Background aurora */}
      <div
        className="absolute pointer-events-none"
        style={{ left: "-53px", top: "-40px", width: "131vw", height: "auto" }}
      >
        <div
          className="w-full h-[400px] opacity-40 mix-blend-screen"
          style={{ background: "radial-gradient(ellipse at center, rgba(138, 100, 200, 0.4) 0%, transparent 70%)" }}
        />
      </div>

      {/* Transition-in animation */}
      <AnimatePresence>
        {showTransitionIn && transitionImage && (
          <motion.div key="shared-image-transition">
            <SharedImageTransition
              imageUrl={transitionImage}
              targetSelector='[data-shared-element="progress-hero-card"]'
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        className="flex-shrink-0 w-full flex items-center justify-center px-4"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 16px)', paddingBottom: 8 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <span className="text-white font-bold text-[17px] tracking-tight">My Progress</span>
      </motion.div>

      {/* Main content — ReelToProgressTransition in inline mode */}
      <div
        className="flex-1 overflow-hidden"
        style={{ paddingBottom: 'calc(max(env(safe-area-inset-bottom, 10px), 10px) + 70px)' }}
      >
        <ReelToProgressTransition
          isOpen={true}
          onClose={() => navigate(-1)}
          currentActivity={null}
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
          myActivities={myActivities.map(a => ({ id: a.id, dayNumber: a.dayNumber, storageUrl: a.storageUrl, originalUrl: a.originalUrl, isVideo: a.isVideo, activity: a.activity, duration: a.duration, pr: a.pr, reactionCount: a.reactionCount, reactions: a.reactions }))}
          onStoryTap={handleStoryTap}
          onLogActivity={() => setShowMediaSourceSheet(true)}
          isInline={true}
        />
      </div>

      {/* Make Public Sheet */}
      <MakePublicSheet
        isOpen={showMakePublicSheet}
        onClose={() => setShowMakePublicSheet(false)}
        onMakePublic={handleMakePublic}
        onKeepPrivate={handleKeepPrivate}
        thumbnailUrl={pendingDayNumber ? myActivities.find(a => a.dayNumber === pendingDayNumber)?.storageUrl : undefined}
      />

      {/* Media Source Sheet for logging new activity */}
      <MediaSourceSheet
        isOpen={showMediaSourceSheet}
        onClose={() => setShowMediaSourceSheet(false)}
        dayNumber={myActivities.length + 1}
      />
    </motion.div>
  );
};

export default Progress;
