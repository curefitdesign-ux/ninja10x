import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Home, Dumbbell, Activity as ActivityIcon, ShoppingBag, Users, Flame, Footprints, Trash2, Bell } from "lucide-react";
import CircularProgressRing from "@/components/CircularProgressRing";
import GradientMeshBackground from "@/components/GradientMeshBackground";
import PullToRefresh from "@/components/PullToRefresh";
import PhotoLoggingWidget, { LoggedPhoto } from "@/components/PhotoLoggingWidget";
import AIReelViewer from "@/components/AIReelViewer";
import CuroSpeechBubble from "@/components/CuroSpeechBubble";
import ProfileMenu from "@/components/ProfileMenu";
import MediaSourceSheet from "@/components/MediaSourceSheet";
import { useJourneyActivities } from "@/hooks/use-journey-activities";
import { useProfile } from "@/hooks/use-profile";
import { JourneyActivity } from "@/services/journey-service";
import { toast } from "sonner";
import confetti from "canvas-confetti";

// Import new activity icons
import bookClassIcon from "@/assets/activity-icons/book-class.png";
import checkinGymIcon from "@/assets/activity-icons/checkin-gym.png";
import playSportsIcon from "@/assets/activity-icons/play-sports.png";
import workoutAtHomeIcon from "@/assets/activity-icons/workout-home.png";
// Import feature assets
import connectFitnessDevice from "@/assets/activity-page/connect-fitness-device.png";
import workoutWithFriends from "@/assets/activity-page/workout-with-friends.png";
import smartWorkoutPlan from "@/assets/activity-page/smart-workout-plan.png";
// Fitness program images
import yogaBeginners from "@/assets/programs/yoga-beginners.png";
import workoutBeginners from "@/assets/programs/workout-beginners.png";
import bellyBurn from "@/assets/programs/belly-burn.png";
import walkFitness from "@/assets/programs/walk-fitness.png";
import cultJunior from "@/assets/programs/cult-junior.png";
import prenatalYoga from "@/assets/programs/prenatal-yoga.png";

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
  
  // Reel viewer state
  const [showReelViewer, setShowReelViewer] = useState(false);
  const [reelPhotos, setReelPhotos] = useState<LoggedPhoto[]>([]);
  
  
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
    
    // If first photo (no photos yet), show the MediaSourceSheet with onboarding
    if (photos.length === 0) {
      setPendingDayNumber(dayNum);
      setShowMediaSourceSheet(true);
    } else {
      // For subsequent uploads, directly open native gallery picker
      navigate('/gallery', {
        state: { dayNumber: dayNum, autoOpenPicker: true },
      });
    }
  }, [navigate, photos.length]);
  
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
      setReelPhotos(weekPhotos);
      setShowReelViewer(true);
    } else {
      toast.info('Complete 3 days to create an AI reel!');
    }
  }, []);

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

  const fitnessPrograms = [
    { id: 1, image: yogaBeginners },
    { id: 2, image: workoutBeginners },
    { id: 3, image: bellyBurn },
    { id: 4, image: walkFitness },
    { id: 5, image: cultJunior },
    { id: 6, image: prenatalYoga },
  ];

  const navItems = [
    { id: "home", icon: Home, label: "HOME" },
    { id: "fitness", icon: Dumbbell, label: "FITNESS" },
    { id: "activity", icon: ActivityIcon, label: "ACTIVITY", isCenter: true },
    { id: "store", icon: ShoppingBag, label: "STORE" },
    { id: "social", icon: Users, label: "SOCIAL" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white overflow-x-hidden relative">
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
            
            {/* Notification Bell - Right */}
            <motion.button
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
            </motion.button>
          </div>
          
          {/* Stats Header */}
          <div className="px-4 pt-2 relative">
            <div className="flex gap-3">
              {/* Days Streak */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, scale: celebrateSuccess ? [1, 1.08, 1] : 1 }}
                transition={{ duration: 0.5, scale: { duration: 0.6, ease: "easeOut" } }}
                className="flex-1 relative group"
              >
                <motion.div 
                  className="absolute -inset-0.5 bg-gradient-to-br from-orange-500/30 via-red-500/20 to-transparent rounded-3xl blur-xl transition-opacity"
                  animate={{ opacity: celebrateSuccess ? [0.6, 1, 0.6] : 0.6, scale: celebrateSuccess ? [1, 1.15, 1] : 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
                <div className="relative bg-white/[0.08] backdrop-blur-xl rounded-3xl p-4 border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <motion.span 
                        className="text-3xl font-bold text-white drop-shadow-lg inline-block"
                        animate={celebrateSuccess ? { scale: [1, 1.2, 1], textShadow: ["0 0 0px rgba(249,115,22,0)", "0 0 20px rgba(249,115,22,0.8)", "0 0 0px rgba(249,115,22,0)"] } : {}}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        {daysStreak}
                      </motion.span>
                      <p className="text-[10px] text-white/60 uppercase tracking-wider mt-1">DAYS STREAK</p>
                    </div>
                    <motion.div 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.5)]"
                      animate={celebrateSuccess ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <Flame className="w-5 h-5 text-white drop-shadow-md" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
              
              {/* Weekly Activity */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, scale: celebrateSuccess ? [1, 1.08, 1] : 1 }}
                transition={{ duration: 0.5, delay: 0.1, scale: { duration: 0.6, delay: 0.1, ease: "easeOut" } }}
                className="flex-1 relative group"
              >
                <motion.div 
                  className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-transparent rounded-3xl blur-xl transition-opacity"
                  animate={{ opacity: celebrateSuccess ? [0.6, 1, 0.6] : 0.6, scale: celebrateSuccess ? [1, 1.15, 1] : 1 }}
                  transition={{ duration: 1.2, delay: 0.1, ease: "easeInOut" }}
                />
                <div className="relative bg-white/[0.08] backdrop-blur-xl rounded-3xl p-4 border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <motion.span 
                        className="text-3xl font-bold text-white drop-shadow-lg inline-block"
                        animate={celebrateSuccess ? { scale: [1, 1.2, 1], textShadow: ["0 0 0px rgba(34,211,238,0)", "0 0 20px rgba(34,211,238,0.8)", "0 0 0px rgba(34,211,238,0)"] } : {}}
                        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                      >
                        {weeklyCompleted}
                        <span className="text-white/40">/3</span>
                      </motion.span>
                      <p className="text-[10px] text-white/60 uppercase tracking-wider mt-1">WEEKLY ACTIVITY</p>
                    </div>
                    <motion.div 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                      animate={celebrateSuccess ? { rotate: [0, 360], scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                    >
                      <Footprints className="w-5 h-5 text-white drop-shadow-md" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Mascot Section with Circular Progress */}
          <div className="relative px-4 mt-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
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
              <CuroSpeechBubble photosCount={photos.length} currentWeek={currentWeek} userName={profile?.display_name} />
            </motion.div>
          </div>

          {/* Photo Logging Widget */}
          <div className="mt-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
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

          {/* Activities Section */}
          <div className="px-4 mt-12">
            <motion.div
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 0.5, delay: 0.35 }} 
              className="mb-6"
            >
              <h2 className="text-xl font-semibold text-white">Stay Active</h2>
              <p className="text-sm text-white/50 mt-1">Pick an activity & log it above</p>
            </motion.div>
            <div className="grid grid-cols-4 gap-4">
              {activities_grid.map((activity, idx) => (
                <motion.button
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + idx * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col items-center group"
                >
                  <div className="relative w-20 h-20 flex items-center justify-center mb-2">
                    <img src={activity.icon} alt={activity.label} className="w-16 h-16 object-contain" />
                  </div>
                  <span className="text-[10px] text-white/60 text-center whitespace-pre-line leading-tight group-hover:text-white/80 transition-colors">
                    {activity.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Feature Cards Row */}
          <div className="px-4 mt-8">
            <div className="grid grid-cols-2 gap-3">
              <motion.button whileTap={{ scale: 0.98 }} className="relative rounded-3xl overflow-hidden">
                <img src={connectFitnessDevice} alt="Connect Fitness device" className="w-full h-auto object-contain" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.98 }} className="relative rounded-3xl overflow-hidden">
                <img src={workoutWithFriends} alt="Workout With Friends" className="w-full h-auto object-contain" />
              </motion.button>
            </div>
          </div>

          {/* Smart Workout Plan */}
          <div className="px-4 mt-4">
            <motion.button whileTap={{ scale: 0.98 }} className="relative w-full rounded-3xl overflow-hidden">
              <img src={smartWorkoutPlan} alt="Smart workout plan" className="w-full h-auto object-contain" />
            </motion.button>
          </div>

          {/* Fitness Programs Section */}
          <div className="px-4 mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Fitness Programs</h2>
              <ArrowRight className="w-5 h-5 text-white/60" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {fitnessPrograms.map((program) => (
                <motion.button key={program.id} whileTap={{ scale: 0.98 }} className="relative aspect-[4/5] rounded-2xl overflow-hidden">
                  <img src={program.image} alt={`Fitness program ${program.id}`} className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Clear All Activities Option */}
          {photos.length > 0 && (
            <div className="px-4 mt-10 mb-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  if (isClearing) return;
                  const confirm = window.confirm('Are you sure you want to clear all logged activities? This cannot be undone.');
                  if (!confirm) return;
                  setIsClearing(true);
                  const success = await clearAllActivities();
                  setIsClearing(false);
                  if (success) {
                    toast.success('All activities cleared');
                  } else {
                    toast.error('Failed to clear activities');
                  }
                }}
                disabled={isClearing}
                className="w-full py-3 px-4 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] flex items-center justify-center gap-2 text-red-400/80 hover:bg-red-500/10 hover:border-red-500/20 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">{isClearing ? 'Clearing...' : 'Clear All Activities'}</span>
              </motion.button>
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Bottom Navigation - Premium Liquid Glass Bar */}
      {(() => {
        const nav = (
          <nav
            className="fixed bottom-0 left-0 right-0"
            style={{
              zIndex: 9999,
              position: "fixed",
            }}
          >
            {/* Premium liquid glass container - clear translucent */}
            <div
              className="relative mx-0"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
                borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow: `
                  0 -4px 30px rgba(0, 0, 0, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `,
              }}
            >
              {/* Micro-texture noise overlay */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
              />
              
              {/* Top edge refraction glow */}
              <div
                className="absolute inset-x-0 top-0 h-[2px] pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 70%, transparent 95%)",
                }}
              />
              
              {/* Inner glow along top */}
              <div
                className="absolute inset-x-0 top-0 h-8 pointer-events-none"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)",
                }}
              />
              

              <div 
                className="relative flex items-center justify-around py-2.5 px-2"
                style={{ paddingBottom: "max(calc(env(safe-area-inset-bottom, 8px) + 4px), 12px)" }}
              >
                {navItems.map((item) => {
                  if (item.isCenter) {
                    return (
                      <motion.button
                        key={item.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setActiveTab(item.id)}
                        className="relative -mt-8 flex flex-col items-center"
                      >
                        {/* Bloom halo effect */}
                        <motion.div 
                          className="absolute -inset-4 rounded-full pointer-events-none"
                          animate={{ 
                            opacity: [0.4, 0.6, 0.4],
                            scale: [1, 1.1, 1],
                          }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                          style={{ 
                            background: "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(96, 165, 250, 0.2) 40%, transparent 70%)",
                            filter: "blur(8px)",
                          }}
                        />
                        {/* Secondary glow ring */}
                        <div 
                          className="absolute -inset-2 rounded-full opacity-60"
                          style={{ 
                            background: "radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 60%)",
                            filter: "blur(6px)",
                          }}
                        />
                        {/* Main glossy liquid glass button - solid blue, no cutout */}
                        <div 
                          className="relative w-14 h-14 rounded-full flex items-center justify-center"
                          style={{
                            background: "linear-gradient(145deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)",
                            boxShadow: `
                              0 6px 24px rgba(59, 130, 246, 0.6),
                              0 2px 8px rgba(0, 0, 0, 0.4),
                              inset 0 2px 4px rgba(255, 255, 255, 0.3),
                              inset 0 -2px 6px rgba(0, 0, 0, 0.15)
                            `,
                            border: "1px solid rgba(255, 255, 255, 0.25)",
                          }}
                        >
                          {/* Specular highlight */}
                          <div 
                            className="absolute top-1.5 left-3 right-3 h-3 rounded-full pointer-events-none"
                            style={{
                              background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)",
                            }}
                          />
                          <item.icon className="w-6 h-6 text-white drop-shadow-lg relative z-10" />
                        </div>
                        {/* Label below center button */}
                        <span className="text-[8px] mt-2 font-semibold tracking-wider text-white/90">
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  }
                  
                  const isActive = activeTab === item.id;
                  
                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setActiveTab(item.id)}
                      className="flex flex-col items-center py-1 px-3 transition-all duration-300 relative"
                    >
                      {/* Active glow behind icon */}
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute top-0 w-10 h-10 rounded-full pointer-events-none"
                          style={{
                            background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
                            filter: "blur(4px)",
                          }}
                        />
                      )}
                      <item.icon
                        className={`w-5 h-5 transition-all duration-300 ${
                          isActive 
                            ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                            : "text-white/35"
                        }`}
                      />
                      <span
                        className={`text-[9px] mt-1.5 font-medium tracking-wider transition-all duration-300 ${
                          isActive ? "text-white/95" : "text-white/35"
                        }`}
                      >
                        {item.label}
                      </span>
                      {/* Active indicator line with glow */}
                      {isActive && (
                        <motion.div
                          layoutId="navIndicator"
                          className="absolute -bottom-0.5 w-8 h-[3px] rounded-full"
                          style={{ 
                            background: "linear-gradient(90deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)",
                            boxShadow: "0 0 10px rgba(16, 185, 129, 0.6), 0 0 20px rgba(52, 211, 153, 0.3)",
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
              
              {/* Bottom vignette effect */}
              <div
                className="absolute inset-x-0 bottom-0 h-4 pointer-events-none"
                style={{
                  background: "linear-gradient(0deg, rgba(0,0,0,0.2) 0%, transparent 100%)",
                }}
              />
            </div>
          </nav>
        );

        return typeof document !== "undefined" ? createPortal(nav, document.body) : nav;
      })()}
      
      {/* AI Reel Viewer */}
      <AIReelViewer
        isOpen={showReelViewer}
        onClose={() => setShowReelViewer(false)}
        photos={reelPhotos.map(p => ({
          id: p.id,
          storageUrl: p.storageUrl,
          originalUrl: p.originalUrl,
          activity: p.activity,
          dayNumber: p.dayNumber,
          duration: p.duration,
          pr: p.pr,
        }))}
      />
      
      {/* MediaSourceSheet for first-time upload */}
      <MediaSourceSheet
        isOpen={showMediaSourceSheet}
        onClose={() => setShowMediaSourceSheet(false)}
        dayNumber={pendingDayNumber}
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
