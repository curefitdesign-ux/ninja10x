import { useState, useCallback, useEffect, useRef } from "react";
import TagembedWidget from "@/components/TagembedWidget";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Trash2 } from "lucide-react";
import CircularProgressRing from "@/components/CircularProgressRing";
import GradientMeshBackground from "@/components/GradientMeshBackground";
import PullToRefresh from "@/components/PullToRefresh";
import PhotoLoggingWidget, { LoggedPhoto } from "@/components/PhotoLoggingWidget";
import ProfileMenu from "@/components/ProfileMenu";
import MediaSourceSheet from "@/components/MediaSourceSheet";
import NotificationSheet, { Notification } from "@/components/NotificationSheet";
import { ActivityPageSkeleton } from "@/components/SkeletonLoaders";
import { useJourneyActivities } from "@/hooks/use-journey-activities";
import { useProfile } from "@/hooks/use-profile";
import { JourneyActivity } from "@/services/journey-service";
import { toast } from "sonner";
import confetti from "canvas-confetti";

// Activity icons
import bookClassIcon from "@/assets/activity-icons/book-class.png";
import checkinGymIcon from "@/assets/activity-icons/checkin-gym.png";
import playSportsIcon from "@/assets/activity-icons/play-sports.png";
import workoutAtHomeIcon from "@/assets/activity-icons/workout-home.png";

// Mascot states
import curoHappy from "@/assets/mascot/curo-happy.png";
import curoThumbs from "@/assets/mascot/curo-thumbs.png";
import curoParty from "@/assets/mascot/curo-party.png";


const Activity = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("activity");
  
  // Journey activities from DB (single source of truth)
  const { activities, loading, refresh, clearAllActivities } = useJourneyActivities();
  const { profile } = useProfile();
  const [isClearing, setIsClearing] = useState(false);
  
  // Media source sheet state for first-time upload
  const [showMediaSourceSheet, setShowMediaSourceSheet] = useState(false);
  const [pendingDayNumber, setPendingDayNumber] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Convert to LoggedPhoto shape for PhotoLoggingWidget
  const photos: LoggedPhoto[] = activities.map(a => ({
    id: a.id,
    storageUrl: a.storageUrl,
    originalUrl: a.originalUrl,
    isVideo: a.isVideo,
    activity: a.activity,
    frame: a.frame,
    duration: a.duration,
    pr: a.pr,
    dayNumber: a.dayNumber,
    reactionCount: a.reactionCount,
    topReaction: getTopReaction(a.reactions),
    allReactions: a.reactions ? Object.entries(a.reactions)
      .filter(([_, data]) => data.count > 0)
      .map(([type, data]) => ({ type, count: data.count })) : undefined,
  }));
  
  // Helper to get the top reaction type (key like "fire", "clap", etc.)
  function getTopReaction(reactions?: Record<string, { count: number }>): string | undefined {
    if (!reactions) return undefined;
    let topType: string | undefined;
    let topCount = 0;
    for (const [type, data] of Object.entries(reactions)) {
      if (data.count > topCount) {
        topCount = data.count;
        topType = type;
      }
    }
    return topType;
  }
  
  // Gallery picker state
  // (migrated to /gallery route)
  
  // Success animation states
  const [celebrateSuccess, setCelebrateSuccess] = useState(false);


  // Transition states
  const [transitionFromProgress, setTransitionFromProgress] = useState(false);
  const [transitionFromShare, setTransitionFromShare] = useState(false);
  const [transitionImage, setTransitionImage] = useState<string | null>(null);
  const [transitionDayNumber, setTransitionDayNumber] = useState<number | null>(null);

  // Handle transition from Progress page
  useEffect(() => {
    if (location.state?.fromProgress) {
      setTransitionFromProgress(true);
      setTransitionImage(location.state.transitionImage || null);
      setTransitionDayNumber(location.state.dayNumber || null);
      setTimeout(() => {
        setTransitionFromProgress(false);
        setTransitionImage(null);
        setTransitionDayNumber(null);
      }, 800);
      navigate('/', { replace: true, state: null });
    }
  }, [location.state?.fromProgress, navigate]);

  // Handle transition from Share page
  useEffect(() => {
    if (location.state?.fromShare && location.state?.transitionToWidget) {
      setTransitionFromShare(true);
      setTransitionImage(location.state.transitionImage || null);
      setTransitionDayNumber(location.state.dayNumber || null);
      setTimeout(() => {
        setTransitionFromShare(false);
        setTransitionImage(null);
        setTransitionDayNumber(null);
      }, 800);
      navigate('/', { replace: true, state: null });
    }
  }, [location.state?.fromShare, location.state?.transitionToWidget, navigate]);

  // Handle return from preview page (save already done in Preview)
  // Just refresh data and show celebration
  useEffect(() => {
    // No longer handle savePhoto - Preview now saves directly to backend
    // Just refresh activities on mount to get latest data
  }, []);
  
  // Week celebration is now handled in ActivityLoggedCelebration component
  // Just mark weeks as celebrated when detected to prevent duplicate celebrations on home page

  // Derived stats
  const currentWeek = Math.min(Math.floor(photos.length / 3) + 1, 4);
  const currentDay = photos.length + 1;
  const daysStreak = photos.length;
  const weeklyCompleted = photos.length === 0 ? 0 : ((photos.length - 1) % 3) + 1;
  const dayInWeek = ((currentDay - 1) % 3) + 1;
  
  const mascot = (() => {
    if (celebrateSuccess) return { src: curoThumbs, alt: "Great job mascot" };
    if (dayInWeek === 2) return { src: curoThumbs, alt: "Ready to go mascot" };
    if (dayInWeek === 3) return { src: curoParty, alt: "Let's finish strong mascot" };
    return { src: curoHappy, alt: "Hello mascot" };
  })();

  // Convert LoggedPhoto to JourneyActivity format for FullScreenReel
  const photosAsJourneyActivities: JourneyActivity[] = photos.map(p => ({
    id: p.id,
    user_id: '',
    storage_url: p.storageUrl,
    original_url: p.originalUrl || null,
    is_video: p.isVideo || false,
    activity: p.activity || null,
    frame: p.frame || null,
    duration: p.duration || null,
    pr: p.pr || null,
    day_number: p.dayNumber,
    is_public: false,
    created_at: '',
    updated_at: '',
    reaction_count: p.reactionCount || 0,
    user_reacted: false,
  }));

  const handlePhotoTap = (photo: LoggedPhoto) => {
    // Navigate to /reel page at the tapped photo
    const index = photos.findIndex(p => p.id === photo.id);
    navigate('/reel', {
      state: {
        activities: photosAsJourneyActivities,
        initialIndex: index >= 0 ? index : 0,
      },
    });
  };

  const handlePhotoAdd = useCallback((weekIndex: number, dayIndex: number) => {
    const dayNum = weekIndex * 3 + dayIndex + 1;
    
    // Always show the MediaSourceSheet bottom sheet
    setPendingDayNumber(dayNum);
    setShowMediaSourceSheet(true);
  }, []);
  
  // Handle file selection from hidden input (direct gallery trigger)
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);
      
      // Navigate to preview with the selected file
      navigate('/preview', {
        state: {
          image: url,
          isVideo,
          dayNumber: pendingDayNumber,
          fromGallery: true,
          file,
        },
      });
    }
    // Reset input
    if (e.target) e.target.value = '';
  }, [navigate, pendingDayNumber]);

  const handlePlayReel = useCallback((weekPhotos: LoggedPhoto[]) => {
    if (weekPhotos.length >= 3) {
      const mappedPhotos = weekPhotos.map(p => ({
        id: p.id,
        imageUrl: p.originalUrl || p.storageUrl,
        activity: p.activity || 'Workout',
        duration: p.duration,
        pr: p.pr,
        uploadDate: new Date().toISOString().split('T')[0],
        dayNumber: p.dayNumber,
        isVideo: p.isVideo,
      }));
      const weekNumber = Math.ceil(Math.max(...weekPhotos.map(p => p.dayNumber)) / 3);
      navigate('/reel-generation', {
        state: { weekPhotos: mappedPhotos, weekNumber, forceRegenerate: true },
      });
    } else {
      toast.info('Complete 3 days to create an AI reel!');
    }
  }, [navigate]);

  const handleMascotTap = useCallback(() => {
    // If we have any photos, navigate to /reel - otherwise navigate to progress
    if (photos.length >= 1) {
      navigate('/reel', {
        state: {
          activities: photosAsJourneyActivities,
          initialIndex: 0,
        },
      });
    } else {
      navigate('/progress');
    }
  }, [photos.length, navigate, photosAsJourneyActivities]);

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const activities_grid = [
    { id: "book", label: "book a cult\nclass", icon: bookClassIcon },
    { id: "checkin", label: "checkin at\ngym", icon: checkinGymIcon },
    { id: "play", label: "play a\nsport", icon: playSportsIcon },
    { id: "workout", label: "workout\nat home", icon: workoutAtHomeIcon },
  ];

  // Show skeleton during initial load
  if (loading && photos.length === 0) {
    return (
      <div className="min-h-screen text-white overflow-x-hidden relative" style={{ background: 'linear-gradient(180deg, #2a1b4e 0%, #1e1245 25%, #160d3a 50%, #0f0a2e 75%, #0a0720 100%)' }}>
        <GradientMeshBackground />
        <ActivityPageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative" style={{ background: 'linear-gradient(180deg, #2a1b4e 0%, #1e1245 25%, #160d3a 50%, #0f0a2e 75%, #0a0720 100%)' }}>
      <GradientMeshBackground />

      {/* Transition from Progress Page */}
      <AnimatePresence>
        {transitionFromProgress && transitionImage && (
          <motion.div
            className="fixed inset-0 z-[60] pointer-events-none flex items-start justify-center pt-40"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              className="relative w-28 h-40 rounded-xl overflow-hidden"
              initial={{ scale: 1.2, y: -100, x: 0 }}
              animate={{ scale: 0.3, y: 180, x: -60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 20 }}
              style={{
                boxShadow: '0 8px 32px rgba(138, 43, 226, 0.4)',
                border: '2px solid rgba(138, 43, 226, 0.5)',
              }}
            >
              <img src={transitionImage} alt="Transitioning" className="w-full h-full object-cover" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transition from Share Page */}
      <AnimatePresence>
        {transitionFromShare && transitionImage && (
          <motion.div
            className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <motion.div
              className="relative aspect-[9/16] rounded-2xl overflow-hidden"
              initial={{ width: '70vw', scale: 1, y: 0, x: 0 }}
              animate={{
                width: '18vw',
                scale: 0.4,
                y: 200,
                x: ((transitionDayNumber || 1) - 1) % 3 === 0 ? -100 :
                   ((transitionDayNumber || 1) - 1) % 3 === 1 ? 0 : 100,
                opacity: 0,
              }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              style={{
                boxShadow: '0 12px 48px rgba(138, 43, 226, 0.5)',
                border: '2px solid rgba(138, 43, 226, 0.6)',
              }}
            >
              <img src={transitionImage} alt="Transitioning to widget" className="w-full h-full object-cover" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Week Celebration is now handled in ActivityLoggedCelebration component */}
      
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="relative z-10 pb-32 pt-2">
          {/* Header Row: Profile Left - Notification Right */}
          <div className="px-4 pt-3 flex items-center justify-between">
            {/* Profile Menu - Left */}
            <ProfileMenu />
            
            {/* Spacer */}
            <div className="flex-1" />
            
            {/* Notification Bell - Right */}
            <motion.button
              onClick={() => setShowNotifications(true)}
              className="relative w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.2)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-5 h-5 text-white/70" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-[9px] font-bold text-white flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </motion.button>
          </div>
          
          {/* Stats Header - hidden for clean layout */}

          {/* Mascot Section with Circular Progress */}
          <div className="relative px-4 mt-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <CircularProgressRing 
                currentDay={photos.length} 
                currentWeek={currentWeek}
                highlight={celebrateSuccess}
                mascotSrc={mascot.src}
                mascotAlt={mascot.alt}
                onMascotTap={handleMascotTap}
              />
              {/* Prominent motivational text - no speech bubble */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
                className="mt-5 text-center px-6"
              >
                <h2
                  className="text-white font-bold leading-tight"
                  style={{
                    fontSize: 'clamp(22px, 6vw, 28px)',
                    textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                  }}
                >
                  {photos.length === 0
                    ? `Hey ${profile?.display_name?.split(' ')[0] || 'there'}! 👋`
                    : photos.length % 3 === 0 && photos.length > 0
                      ? `Great week, ${profile?.display_name?.split(' ')[0] || 'there'}! 🔥`
                      : `Nice one,${profile?.display_name?.split(' ')[0] || 'there'}!`}
                </h2>
                <p
                  className="font-medium mt-1"
                  style={{
                    fontSize: 'clamp(18px, 5vw, 24px)',
                    color: 'rgba(180, 160, 220, 0.7)',
                    textShadow: '0 2px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  {photos.length === 0
                    ? 'Tap + to log your first workout.'
                    : photos.length % 3 === 0 && photos.length > 0
                      ? 'Week complete — reel time!'
                      : `${3 - (photos.length % 3)} more to complete this week.`}
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* Photo Logging Widget */}
          <div className="mt-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}>
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                </div>
              ) : (
                <PhotoLoggingWidget 
                  photos={photos}
                  currentWeek={currentWeek}
                  currentDay={currentDay}
                  onPhotoTap={handlePhotoTap}
                  onPhotoAdd={handlePhotoAdd}
                  onPlayReel={handlePlayReel}
                />
              )}
            </motion.div>
          </div>

          {/* Wall of Ninjas */}
          <div className="px-4 mt-10 pb-28">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
              className="mb-5"
            >
              <h2 className="text-xl font-semibold text-white">Wall of Ninja's</h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.24 }}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                minHeight: "500px",
              }}
            >
              <TagembedWidget />
            </motion.div>
          </div>

        </div>
      </PullToRefresh>
      {/* Bottom Navigation is now rendered globally in App.tsx */}
      
      
      {/* MediaSourceSheet for upload */}
      <MediaSourceSheet
        isOpen={showMediaSourceSheet}
        onClose={() => setShowMediaSourceSheet(false)}
        dayNumber={pendingDayNumber}
      />
      
      {/* Notification Sheet */}
      <NotificationSheet
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNotificationCountChange={setNotificationCount}
      />
      
      {/* Hidden file input for direct gallery access */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default Activity;
