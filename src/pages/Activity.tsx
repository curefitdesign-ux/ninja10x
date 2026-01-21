import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Home, Dumbbell, Activity as ActivityIcon, ShoppingBag, Users, Flame, Footprints } from "lucide-react";
import CircularProgressRing from "@/components/CircularProgressRing";
import GradientMeshBackground from "@/components/GradientMeshBackground";
import PullToRefresh from "@/components/PullToRefresh";
import PhotoLoggingWidget, { LoggedPhoto } from "@/components/PhotoLoggingWidget";
import CameraUI from "@/components/CameraUI";
import { uploadToStorage } from "@/services/storage-service";
import { toast } from "sonner";
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

// Activity icons for selection
import footballIcon from '@/assets/activities/football.png';
import cricketIcon from '@/assets/activities/cricket.png';
import racquetIcon from '@/assets/activities/racquet.png';
import basketballIcon from '@/assets/activities/basketball.png';
import cyclingIcon from '@/assets/activities/cycling.png';
import runningIcon from '@/assets/activities/running.png';
import trekkingIcon from '@/assets/activities/trekking.png';
import boxingIcon from '@/assets/activities/boxing.png';
import yogaIcon from '@/assets/activities/yoga.png';

const STORAGE_KEY = 'activity_photos_v1';

const activityOptions = [
  { name: 'Running', icon: runningIcon },
  { name: 'Cycling', icon: cyclingIcon },
  { name: 'Trekking', icon: trekkingIcon },
  { name: 'Basketball', icon: basketballIcon },
  { name: 'Yoga', icon: yogaIcon },
  { name: 'Football', icon: footballIcon },
  { name: 'Cricket', icon: cricketIcon },
  { name: 'Badminton', icon: racquetIcon },
  { name: 'Boxing', icon: boxingIcon },
];

const Activity = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("activity");
  
  // Success animation state
  const [showSuccessBar, setShowSuccessBar] = useState(false);
  
  // Camera and activity selection state
  const [showCamera, setShowCamera] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{ url: string; isVideo: boolean } | null>(null);
  const [pendingDayNumber, setPendingDayNumber] = useState<number | null>(null);
  const [initialCaptureMode, setInitialCaptureMode] = useState<'photo' | 'video'>('photo');
  const [cameraEntering, setCameraEntering] = useState(false);
  const [sheetPhase, setSheetPhase] = useState<'select' | 'acknowledge' | 'exit'>('select');
  const [acknowledgedActivity, setAcknowledgedActivity] = useState<{ name: string; icon: string } | null>(null);
  
  // Load photos from localStorage
  const [photos, setPhotos] = useState<LoggedPhoto[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((p: LoggedPhoto) => p.storageUrl) : [];
    } catch {
      return [];
    }
  });

  // Persist photos to localStorage
  useEffect(() => {
    try {
      const validPhotos = photos.filter(p => p.storageUrl);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validPhotos));
    } catch (e) {
      console.error('Failed to save photos:', e);
    }
  }, [photos]);

  // Calculate current week and day based on photos
  const currentWeek = Math.min(Math.floor(photos.length / 3) + 1, 4);
  const currentDay = photos.length + 1; // Next day to fill

  // Handle save from preview page
  useEffect(() => {
    if (location.state?.savePhoto && location.state?.activity) {
      const originalUrl = location.state.originalUrl || location.state.imageUrl;
      const isVideo = location.state.isVideo || false;
      const dayNumber = location.state.dayNumber || photos.length + 1;

      if (!originalUrl) {
        toast.error('No media to save');
        navigate('/', { replace: true, state: null });
        return;
      }

      const uploadAndSave = async () => {
        let storageUrl: string | null = null;
        
        if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) {
          storageUrl = await uploadToStorage(originalUrl, `activity-${Date.now()}`, isVideo);
          
          if (!storageUrl) {
            toast.error('Upload failed. Please try again.');
            navigate('/', { replace: true, state: null });
            return;
          }
        } else if (originalUrl.startsWith('http')) {
          storageUrl = originalUrl;
        } else {
          toast.error('Invalid media format');
          navigate('/', { replace: true, state: null });
          return;
        }

        const existingPhoto = photos.find(p => p.dayNumber === dayNumber);
        
        if (existingPhoto) {
          // Update existing
          setPhotos(prev => prev.map(p => 
            p.dayNumber === dayNumber
              ? { ...p, storageUrl: storageUrl!, activity: location.state.activity, frame: location.state.frame }
              : p
          ));
          toast.success(`Day ${dayNumber} updated!`);
          // Trigger success bar animation
          setShowSuccessBar(true);
          setTimeout(() => setShowSuccessBar(false), 2500);
        } else {
          // Add new
          const newPhoto: LoggedPhoto = {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            storageUrl: storageUrl!,
            isVideo,
            activity: location.state.activity,
            frame: location.state.frame || 'shaky',
            duration: location.state.duration,
            pr: location.state.pr,
            dayNumber,
          };
          setPhotos(prev => [...prev, newPhoto]);
          toast.success(`Day ${dayNumber} added!`);
          // Trigger success bar animation
          setShowSuccessBar(true);
          setTimeout(() => setShowSuccessBar(false), 2500);
        }
      };

      uploadAndSave();
      navigate('/', { replace: true, state: null });
    }
  }, [location.state?.savePhoto]);

  // Handle photo tap - open preview to edit
  const handlePhotoTap = (photo: LoggedPhoto) => {
    navigate('/preview', {
      state: {
        imageUrl: photo.storageUrl,
        originalUrl: photo.storageUrl,
        isVideo: photo.isVideo,
        activity: photo.activity,
        frame: photo.frame,
        duration: photo.duration,
        pr: photo.pr,
        isReview: true,
        photoId: photo.id,
        dayNumber: photo.dayNumber,
      },
    });
  };

  const activities = [
    { id: "book", label: "book a cult\nclass", icon: bookClassIcon },
    { id: "checkin", label: "checkin at\ngym", icon: checkinGymIcon },
    { id: "play", label: "play a\nsport", icon: playSportsIcon },
    { id: "workout", label: "workout\nat home", icon: workoutAtHomeIcon },
  ];

  const handleRefresh = useCallback(async () => {
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Could refetch data here
  }, []);

  // Handle camera trigger from location state (retake flow)
  useEffect(() => {
    if (location.state?.openCameraWithActivity) {
      const activityName = location.state.openCameraWithActivity;
      const captureMode = location.state.captureMode || 'photo';
      const dayNum = location.state.dayNumber || photos.length + 1;
      
      setSelectedActivity(activityName);
      setInitialCaptureMode(captureMode);
      setPendingDayNumber(dayNum);
      setShowCamera(true);
      
      if (!location.state.instantCamera) {
        setCameraEntering(true);
        setTimeout(() => setCameraEntering(false), 500);
      }
      
      navigate('/', { replace: true, state: null });
    }
  }, [location.state?.openCameraWithActivity, navigate, photos.length]);

  // Handle camera capture - show activity sheet
  const handleCapture = useCallback((mediaDataUrl: string, isVideo?: boolean) => {
    setShowCamera(false);
    setPendingMedia({ url: mediaDataUrl, isVideo: isVideo || false });
    // If activity was already selected (from widget), go directly to preview
    if (selectedActivity && pendingDayNumber) {
      navigate('/preview', {
        state: {
          imageUrl: mediaDataUrl,
          isVideo: isVideo || false,
          activity: selectedActivity,
          dayNumber: pendingDayNumber,
        },
      });
      setSelectedActivity(null);
      setPendingMedia(null);
      setPendingDayNumber(null);
    } else {
      // Show activity selection
      setShowActivitySheet(true);
    }
  }, [selectedActivity, pendingDayNumber, navigate]);

  // Handle camera close
  const handleCameraClose = useCallback(() => {
    setShowCamera(false);
    setSelectedActivity(null);
    setPendingMedia(null);
    setPendingDayNumber(null);
  }, []);

  // Handle activity selection from sheet - then open camera
  const handleActivitySelect = useCallback((activity: string) => {
    const activityData = activityOptions.find(a => a.name === activity);
    if (!activityData) return;
    
    setSelectedActivity(activity);
    setAcknowledgedActivity(activityData);
    setSheetPhase('acknowledge');
    
    setTimeout(() => {
      setSheetPhase('exit');
    }, 1200);
    
    setTimeout(() => {
      setShowActivitySheet(false);
      setSheetPhase('select');
      setAcknowledgedActivity(null);
      
      // If we have pending media (from camera), go to preview
      if (pendingMedia) {
        const dayNum = pendingDayNumber || photos.length + 1;
        navigate('/preview', {
          state: {
            imageUrl: pendingMedia.url,
            isVideo: pendingMedia.isVideo,
            activity,
            dayNumber: dayNum,
          },
        });
        setPendingMedia(null);
        setPendingDayNumber(null);
        setSelectedActivity(null);
      } else {
        // No media yet - open camera with activity pre-selected
        setShowCamera(true);
        setCameraEntering(true);
        setTimeout(() => setCameraEntering(false), 500);
      }
    }, 1600);
  }, [pendingMedia, pendingDayNumber, navigate, photos.length]);

  // Handle overlay click to close sheet
  const handleOverlayClick = useCallback(() => {
    setShowActivitySheet(false);
    setSelectedActivity(null);
    setPendingMedia(null);
    setPendingDayNumber(null);
  }, []);

  // Handle card tap from PhotoLoggingWidget - show activity sheet first
  const handlePhotoAdd = useCallback((weekIndex: number, dayIndex: number) => {
    const dayNum = weekIndex * 3 + dayIndex + 1;
    setPendingDayNumber(dayNum);
    // Show activity selection first, then camera
    setShowActivitySheet(true);
  }, []);

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
      {/* Gradient Mesh Background */}
      <GradientMeshBackground />
      
      {/* Pull to Refresh Wrapper */}
      <PullToRefresh onRefresh={handleRefresh}>
        {/* Scrollable Content */}
        <div className="relative z-10 pb-28 pt-2">
          {/* Stats Header - Glassmorphic */}
          <div className="px-4 pt-4 relative">
            {/* Success Bar Overlay */}
            <AnimatePresence>
              {showSuccessBar && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 25,
                  }}
                  className="absolute inset-x-4 top-4 z-20"
                >
                  <div className="relative">
                    {/* Animated glow */}
                    <motion.div 
                      className="absolute -inset-1 bg-gradient-to-r from-emerald-500/50 via-green-400/40 to-emerald-500/50 rounded-3xl blur-xl"
                      animate={{ 
                        opacity: [0.6, 0.9, 0.6],
                        scale: [1, 1.02, 1],
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    />
                    {/* Success bar content */}
                    <div className="relative bg-gradient-to-r from-emerald-500/90 via-green-500/90 to-emerald-500/90 backdrop-blur-xl rounded-3xl p-4 border border-emerald-400/40 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                      <div className="flex items-center justify-center gap-3">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                        >
                          <motion.svg 
                            className="w-5 h-5 text-white" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                          >
                            <motion.path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={3} 
                              d="M5 13l4 4L19 7"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.4, delay: 0.2 }}
                            />
                          </motion.svg>
                        </motion.div>
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 }}
                          className="text-white font-semibold text-lg drop-shadow-md"
                        >
                          Activity Logged!
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          <div className="flex gap-3">
            {/* Days Streak */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 relative group"
            >
              {/* Liquid glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-orange-500/30 via-red-500/20 to-transparent rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="relative bg-white/[0.08] backdrop-blur-xl rounded-3xl p-4 border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-white drop-shadow-lg">4</span>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider mt-1">DAYS STREAK</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                    <Flame className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Weekly Activity */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-1 relative group"
            >
              {/* Liquid glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-transparent rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="relative bg-white/[0.08] backdrop-blur-xl rounded-3xl p-4 border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-white drop-shadow-lg">5<span className="text-white/40">/3</span></span>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider mt-1">WEEKLY ACTIVITY</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                    <Footprints className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
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
            {/* Pixel-perfect Circular Progress Ring - synced with photos */}
            <CircularProgressRing 
              currentDay={photos.length > 0 ? photos.length : 1} 
              currentWeek={currentWeek}
            />
            {/* Chat Bubble - Enhanced glassmorphic */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-4 relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-60" />
              <div className="relative bg-white/[0.1] backdrop-blur-xl rounded-2xl px-6 py-3 text-center border border-white/[0.15] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <p className="text-sm text-white/90">
                  Hey, I'm Curo.<br />
                  Let's build a workout together!
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Photo Logging Widget - 12 cards in 4 clusters */}
        <div className="mt-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <PhotoLoggingWidget 
              photos={photos}
              currentWeek={currentWeek}
              currentDay={currentDay}
              onPhotoTap={handlePhotoTap}
              onPhotoAdd={handlePhotoAdd}
            />
          </motion.div>
        </div>

        {/* Activities Section - Glassmorphic */}
        <div className="px-4 mt-10">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-center text-white/70 text-sm mb-4"
          >
            Do any of the following<br />
            activities today
          </motion.p>
          
          <div className="grid grid-cols-4 gap-3">
            {activities.map((activity, idx) => (
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
                  <img 
                    src={activity.icon} 
                    alt={activity.label}
                    className="w-16 h-16 object-contain"
                  />
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
            {/* Connect Fitness Device */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="relative rounded-3xl overflow-hidden"
            >
              <img 
                src={connectFitnessDevice}
                alt="Connect Fitness device"
                className="w-full h-auto object-contain"
              />
            </motion.button>

            {/* Workout With Friends */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="relative rounded-3xl overflow-hidden"
            >
              <img 
                src={workoutWithFriends}
                alt="Workout With Friends"
                className="w-full h-auto object-contain"
              />
            </motion.button>
          </div>
        </div>

        {/* Smart Workout Plan */}
        <div className="px-4 mt-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="relative w-full rounded-3xl overflow-hidden"
          >
            <img 
              src={smartWorkoutPlan}
              alt="Smart workout plan"
              className="w-full h-auto object-contain"
            />
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
              <motion.button
                key={program.id}
                whileTap={{ scale: 0.98 }}
                className="relative aspect-[4/5] rounded-2xl overflow-hidden"
              >
                <img 
                  src={program.image} 
                  alt={`Fitness program ${program.id}`}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>
        </div>
        </div>
      </PullToRefresh>

      {/* Bottom Navigation - Glassmorphic Liquid */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Glow effect behind nav */}
        <div className="absolute inset-x-0 -top-4 h-8 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div className="relative bg-white/[0.08] backdrop-blur-2xl border-t border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_-8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-around py-2 px-2" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)' }}>
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-2 px-4 rounded-2xl transition-all duration-200 ${
                  item.isCenter && activeTab === item.id
                    ? ''
                    : ''
                }`}
              >
                {item.isCenter && activeTab === item.id ? (
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-rose-500/50 to-pink-500/50 rounded-full blur-lg" />
                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center shadow-[0_0_24px_rgba(244,63,94,0.5)]">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <>
                    <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-white/40'}`} />
                    <span className={`text-[10px] mt-1 ${activeTab === item.id ? 'text-white' : 'text-white/40'}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Camera UI */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              duration: 0.35, 
              ease: [0.32, 0.72, 0, 1],
              scale: { type: "spring", stiffness: 300, damping: 30 }
            }}
          >
            <CameraUI
              activity={selectedActivity || 'Activity'}
              week={currentWeek}
              day={pendingDayNumber || currentDay}
              onCapture={handleCapture}
              onClose={handleCameraClose}
              initialCaptureMode={initialCaptureMode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Selection Bottom Sheet */}
      <AnimatePresence>
        {showActivitySheet && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={handleOverlayClick}
            />
            
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: sheetPhase === 'exit' ? '100%' : 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)' }}
            >
              {sheetPhase === 'acknowledge' && acknowledgedActivity ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  >
                    <img 
                      src={acknowledgedActivity.icon} 
                      alt={acknowledgedActivity.name}
                      className="w-20 h-20 object-contain mb-4"
                    />
                  </motion.div>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl font-semibold text-white"
                  >
                    {acknowledgedActivity.name}
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-white/60 mt-1"
                  >
                    Let's log it!
                  </motion.p>
                </motion.div>
              ) : (
                <div className="py-6 px-4">
                  <h3 className="text-lg font-semibold text-white text-center mb-6">
                    Select Activity
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {activityOptions.map((activity) => (
                      <motion.button
                        key={activity.name}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleActivitySelect(activity.name)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <img 
                          src={activity.icon} 
                          alt={activity.name}
                          className="w-12 h-12 object-contain"
                        />
                        <span className="text-xs text-white/70">{activity.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Activity;
