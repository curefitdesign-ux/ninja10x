import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Plus, UserPen, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useJourneyActivities, fetchPublicFeed, LocalActivity } from "@/hooks/use-journey-activities";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import MakePublicSheet, { hasUserChosenPublic } from "@/components/MakePublicSheet";
import ReelToProgressTransition from "@/components/ReelToProgressTransition";
import MediaSourceSheet from "@/components/MediaSourceSheet";
import SharedImageTransition from "@/components/SharedImageTransition";
import ProfileAvatar from "@/components/ProfileAvatar";
import snackbarCrystal from "@/assets/progress/snackbar-crystal.png";
import snackbarBg from "@/assets/progress/snackbar-bg.png";

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
  const [showEllipsisMenu, setShowEllipsisMenu] = useState(false);

  // Transition state
  const [showTransitionIn, setShowTransitionIn] = useState(false);
  const transitionHandledRef = useRef(false);

  // Week-complete snackbar
  const [showWeekSnackbar, setShowWeekSnackbar] = useState(false);
  const [completedWeekNum, setCompletedWeekNum] = useState(0);

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

  // Handle transition from share — run only once per navigation
  useEffect(() => {
    if (!transitionToProgress || !transitionImage || transitionHandledRef.current) return;
    if (myActivities.length === 0 && loading) return; // wait for activities to load

    transitionHandledRef.current = true;
    setShowTransitionIn(true);
    setTimeout(() => setShowTransitionIn(false), 300);

    // Show week-complete snackbar for days 3, 6, 9, 12
    if ([3, 6, 9, 12].includes(transitionDayNumber)) {
      const weekNum = Math.ceil(transitionDayNumber / 3);
      setCompletedWeekNum(weekNum);
      setTimeout(() => setShowWeekSnackbar(true), 500);
      setTimeout(() => setShowWeekSnackbar(false), 10500);
    }

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
  }, [transitionToProgress, transitionImage, transitionDayNumber, myActivities, loading, makeActivityPublic, profile?.stories_public]);

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

      {/* Week-complete snackbar */}
      <AnimatePresence>
        {showWeekSnackbar && (
          <motion.div
            key="week-snackbar"
            className="absolute left-0 right-0 z-[60] flex justify-center"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 12px) + 74px)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          >
            <button
              onClick={() => {
                setShowWeekSnackbar(false);
                navigate('/reel-generation', { state: { week: completedWeekNum } });
              }}
              className="relative flex items-center active:scale-[0.97] transition-transform"
              style={{ height: 52 }}
            >
              {/* Background pill */}
              <img
                src={snackbarBg}
                alt=""
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: 'fill' }}
              />
              {/* Crystal — overlapping left edge */}
              <img
                src={snackbarCrystal}
                alt=""
                className="relative z-10 flex-shrink-0"
                style={{ width: 64, height: 64, marginLeft: -6, marginRight: 4, marginTop: -8, objectFit: 'contain' }}
              />
              {/* Text */}
              <span
                className="relative z-10 font-semibold tracking-tight whitespace-nowrap"
                style={{ fontSize: 13, color: '#ffffff', marginRight: 6 }}
              >
                Week {completedWeekNum} reel is ready, Click here to view
              </span>
              {/* Chevron */}
              <ChevronRight
                className="relative z-10 flex-shrink-0"
                style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.6)', marginRight: 12 }}
                strokeWidth={2}
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
        className="flex-shrink-0 w-full flex items-center justify-between px-4"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 16px)', paddingBottom: 8 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/reel')}
          className="flex items-center justify-center active:scale-[0.95] transition-transform"
          style={{
            width: 36, height: 36, borderRadius: 18,
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          }}
        >
          <ChevronLeft className="w-5 h-5 text-white/80" strokeWidth={2} />
        </button>
        <span className="text-white font-bold text-[17px] tracking-tight">My Progress</span>
        {/* Right side - Ellipsis menu */}
        <div className="flex items-center shrink-0 relative">
          <button
            onClick={() => setShowEllipsisMenu(prev => !prev)}
            className="active:scale-[0.95] transition-transform flex items-center justify-center"
            style={{
              width: 36, height: 36, borderRadius: 18,
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            }}
          >
            <MoreVertical className="w-[18px] h-[18px] text-white/80" strokeWidth={1.5} />
          </button>

          <AnimatePresence>
            {showEllipsisMenu && (
              <>
                <motion.div
                  className="fixed inset-0 z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowEllipsisMenu(false)}
                />
                <motion.div
                  className="absolute right-0 top-full mt-2 w-52 z-50 rounded-2xl overflow-hidden"
                  style={{
                    background: 'rgba(20, 20, 30, 0.95)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                  }}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="py-1">
                    <motion.button
                      onClick={() => { setShowEllipsisMenu(false); setShowMediaSourceSheet(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                      whileHover={{ x: 2 }}
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm">Log Activity</span>
                    </motion.button>
                    <motion.button
                      onClick={() => { setShowEllipsisMenu(false); navigate('/profile-setup?edit=true'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                      whileHover={{ x: 2 }}
                    >
                      <UserPen className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm">Edit Profile</span>
                    </motion.button>
                    <motion.button
                      onClick={async () => {
                        setShowEllipsisMenu(false);
                        try {
                          await supabase.auth.signOut();
                          navigate('/auth');
                        } catch { /* ignore */ }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-white/80 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                      whileHover={{ x: 2 }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Log Out</span>
                    </motion.button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main content — ReelToProgressTransition in inline mode */}
      <div
        className="flex-1 overflow-hidden overflow-x-clip"
        style={{ paddingBottom: '0px' }}
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
          myActivities={myActivities.map(a => ({ id: a.id, dayNumber: a.dayNumber, storageUrl: a.storageUrl, originalUrl: a.originalUrl, isVideo: a.isVideo, activity: a.activity, frame: a.frame, duration: a.duration, pr: a.pr, createdAt: a.createdAt, reactionCount: a.reactionCount, reactions: a.reactions, reactorProfiles: a.reactorProfiles }))}
          onStoryTap={handleStoryTap}
          onLogActivity={() => setShowMediaSourceSheet(true)}
          onCrystalTap={(weekNum) => {
            setCompletedWeekNum(weekNum);
            setShowWeekSnackbar(true);
            setTimeout(() => setShowWeekSnackbar(false), 10000);
          }}
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
