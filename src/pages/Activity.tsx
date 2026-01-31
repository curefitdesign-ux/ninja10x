import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Home, Dumbbell, Activity as ActivityIcon, ShoppingBag, Users, Flame, Footprints, Trash2 } from "lucide-react";
import CircularProgressRing from "@/components/CircularProgressRing";
import GradientMeshBackground from "@/components/GradientMeshBackground";
import PullToRefresh from "@/components/PullToRefresh";
import PhotoLoggingWidget, { LoggedPhoto } from "@/components/PhotoLoggingWidget";
import AIReelViewer from "@/components/AIReelViewer";
import CuroSpeechBubble from "@/components/CuroSpeechBubble";
import ProfileMenu from "@/components/ProfileMenu";
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
  }));
  
  // Gallery picker state
  // (migrated to /gallery route)
  
  // Success animation states
  const [celebrateSuccess, setCelebrateSuccess] = useState(false);
  const [showWeekCelebration, setShowWeekCelebration] = useState(false);
  const [completedWeekNumber, setCompletedWeekNumber] = useState(0);
  
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
  
  // Trigger celebration when new activities are detected
  useEffect(() => {
    if (photos.length === 0) return;
    
    const latestDay = Math.max(...photos.map(p => p.dayNumber));
    const weekIndex = Math.floor((latestDay - 1) / 3);
    const weekStartDay = weekIndex * 3 + 1;
    const weekPhotos = photos.filter(
      p => p.dayNumber >= weekStartDay && p.dayNumber <= weekStartDay + 2
    );
    
    // Check if week just completed (3 photos in current week)
    if (weekPhotos.length === 3 && !showWeekCelebration) {
      // Only celebrate if we haven't already
      const celebratedWeeksKey = 'celebrated_weeks';
      const celebratedWeeks = JSON.parse(localStorage.getItem(celebratedWeeksKey) || '[]');
      const weekNum = weekIndex + 1;
      
      if (!celebratedWeeks.includes(weekNum)) {
        // Mark as celebrated
        localStorage.setItem(celebratedWeeksKey, JSON.stringify([...celebratedWeeks, weekNum]));
        
        setTimeout(() => {
          setCompletedWeekNumber(weekNum);
          setShowWeekCelebration(true);
          if (weekIndex === 0) {
            const duration = 3000;
            const end = Date.now() + duration;
            const frame = () => {
              confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
              });
              confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
              });
              if (Date.now() < end) {
                requestAnimationFrame(frame);
              }
            };
            frame();
          }
          setTimeout(() => setShowWeekCelebration(false), 3500);
        }, 500);
      }
    }
  }, [photos, showWeekCelebration]);

  // Derived stats
  const currentWeek = Math.min(Math.floor(photos.length / 3) + 1, 4);
  const currentDay = photos.length + 1;
  const daysStreak = photos.length;
  const weeklyCompleted = photos.length === 0 ? 0 : ((photos.length - 1) % 3) + 1;
  const dayInWeek = ((currentDay - 1) % 3) + 1;
  
  const mascot = (() => {
    if (showWeekCelebration) return { src: curoParty, alt: "Celebration mascot" };
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
    // Open dedicated Gallery page (no overlay)
    navigate('/gallery', {
      state: { dayNumber: dayNum },
    });
  }, [navigate]);

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
      
      {/* Week Celebration Overlay */}
      <AnimatePresence>
        {showWeekCelebration && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div 
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: 'radial-gradient(circle at center, rgba(52, 211, 153, 0.25) 0%, rgba(16, 185, 129, 0.15) 30%, rgba(0,0,0,0.9) 70%)',
              }}
            />
            <motion.div
              className="absolute w-80 h-80 rounded-full"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.5, 2], opacity: [0.8, 0.4, 0] }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ background: 'radial-gradient(circle, rgba(52, 211, 153, 0.5) 0%, transparent 70%)' }}
            />
            <motion.div
              className="relative z-10 bg-white/[0.1] backdrop-blur-2xl rounded-3xl px-10 py-8 border border-emerald-400/30 shadow-[0_0_60px_rgba(52,211,153,0.3)]"
              initial={{ scale: 0.5, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
            >
              <motion.div className="absolute -top-4 -left-4 w-8 h-8 text-yellow-400" animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>✨</motion.div>
              <motion.div className="absolute -top-2 -right-6 w-6 h-6 text-emerald-400" animate={{ rotate: [360, 0], scale: [1, 1.3, 1] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}>⭐</motion.div>
              <motion.div className="absolute -bottom-3 -right-4 w-7 h-7 text-cyan-400" animate={{ rotate: [0, -360], scale: [1, 1.2, 1] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.5 }}>🎉</motion.div>
              <div className="text-center">
                <motion.div className="text-5xl mb-3" animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 0.8, delay: 0.3 }}>🏆</motion.div>
                <motion.h2 className="text-2xl font-bold text-white mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  Week {completedWeekNumber} Complete!
                </motion.h2>
                <motion.p className="text-emerald-400/90 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                  Amazing progress! Keep it up! 💪
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="relative z-10 pb-28 pt-2">
          {/* Profile Menu - Top Right */}
          <div className="px-4 pt-3 flex justify-end">
            <ProfileMenu />
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
                currentDay={photos.length > 0 ? photos.length : 1} 
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
          <div className="px-4 mt-10">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.35 }} className="text-center text-white/70 text-sm mb-4">
              Do any of the following<br />activities today
            </motion.p>
            <div className="grid grid-cols-4 gap-3">
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
          <div className="px-4 mt-10">
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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="absolute inset-x-0 -top-4 h-8 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div className="relative bg-white/[0.08] backdrop-blur-2xl border-t border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_-8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-around py-2 px-2" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)' }}>
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center py-2 px-4 rounded-2xl transition-all duration-200"
              >
                {item.isCenter ? (
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-rose-500/50 to-pink-500/50 rounded-full blur-lg" />
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center shadow-[0_0_24px_rgba(244,63,94,0.5)]">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <>
                    <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-white/40'}`} />
                    <span className={`text-[10px] mt-1 ${activeTab === item.id ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
                  </>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
      
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
      
    </div>
  );
};

export default Activity;
