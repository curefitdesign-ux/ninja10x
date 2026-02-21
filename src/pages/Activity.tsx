import { useState, useCallback, useEffect, useRef } from "react";
import TagembedWidget from "@/components/TagembedWidget";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Trash2, Globe, Lock } from "lucide-react";
import CircularProgressRing from "@/components/CircularProgressRing";
import GradientMeshBackground from "@/components/GradientMeshBackground";
import PullToRefresh from "@/components/PullToRefresh";
import { LoggedPhoto } from "@/components/PhotoLoggingWidget";
import CommunityJourneyFeed from "@/components/CommunityJourneyFeed";
import ProfileMenu from "@/components/ProfileMenu";
import MediaSourceSheet from "@/components/MediaSourceSheet";
import NotificationSheet, { Notification } from "@/components/NotificationSheet";
import MakePublicSheet from "@/components/MakePublicSheet";
import { ActivityPageSkeleton } from "@/components/SkeletonLoaders";
import { useJourneyActivities } from "@/hooks/use-journey-activities";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { JourneyActivity } from "@/services/journey-service";
import { toast } from "sonner";

// Reaction assets
import fireImg from '@/assets/reactions/fire-new.png';
import clapImg from '@/assets/reactions/clap-hands.png';
import fistbumpImg from '@/assets/reactions/fistbump-hands.png';
import wowImg from '@/assets/reactions/wow.png';
import flexImg from '@/assets/reactions/flex.png';
import trophyImg from '@/assets/reactions/dumbbells.png';
import runnerImg from '@/assets/reactions/runner.png';
import energyImg from '@/assets/reactions/energy.png';
import timerImg from '@/assets/reactions/stopwatch.png';
import heartImg from '@/assets/reactions/heart-workout.png';

const REACTION_IMAGES: Record<string, string> = {
  heart: heartImg, fire: fireImg, clap: clapImg, fistbump: fistbumpImg,
  wow: wowImg, flex: flexImg, trophy: trophyImg, runner: runnerImg,
  energy: energyImg, timer: timerImg,
};
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
  const [showMakePublicSheet, setShowMakePublicSheet] = useState(false);
  const isUserPublic = !!profile?.stories_public;
  
  // Media source sheet state for first-time upload
  const [showMediaSourceSheet, setShowMediaSourceSheet] = useState(false);
  const [pendingDayNumber, setPendingDayNumber] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [latestReactor, setLatestReactor] = useState<{
    name: string; avatarUrl: string; reactionType: string;
  } | null>(null);
  const { user } = useAuth();
  const myActivityIdsRef = useRef<Set<string>>(new Set());

  // Fetch user's activity IDs + subscribe for reactor info
  useEffect(() => {
    if (!user) return;
    const fetchIds = async () => {
      const { data } = await supabase
        .from('journey_activities').select('id').eq('user_id', user.id);
      if (data) myActivityIdsRef.current = new Set(data.map(a => a.id));
    };
    fetchIds();

    const ch = supabase.channel('header-reactor-pill')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_reactions' },
        async (payload) => {
          const r = payload.new as { activity_id: string; user_id: string; reaction_type: string };
          if (myActivityIdsRef.current.has(r.activity_id) && r.user_id !== user.id) {
            const { data: p } = await supabase
              .from('profiles').select('display_name, avatar_url').eq('user_id', r.user_id).maybeSingle();
            setLatestReactor({
              name: p?.display_name || 'Someone',
              avatarUrl: p?.avatar_url || '',
              reactionType: r.reaction_type,
            });
            setNotificationCount(prev => prev + 1);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);
  
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
          {/* Header Row: Profile Left - Pill Center - Notification Right */}
          <div className="px-4 pt-3 flex items-center justify-between gap-2">
            {/* Profile Menu - Left */}
            <ProfileMenu />
            
            {/* Center: Glassmorphic reactor pill */}
            <div className="flex-1 flex justify-center">
              <AnimatePresence>
                {notificationCount > 0 && latestReactor && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -6 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    onClick={() => { setShowNotifications(true); setNotificationCount(0); setLatestReactor(null); }}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full"
                    style={{
                      background: 'rgba(255, 255, 255, 0.10)',
                      backdropFilter: 'blur(40px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12), 0 6px 20px rgba(0,0,0,0.25)',
                    }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {/* Reactor avatar */}
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0"
                      style={{
                        border: '1.5px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      <img
                        src={latestReactor.avatarUrl}
                        alt={latestReactor.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>

                    {/* Name */}
                    <span className="text-[11px] font-semibold text-white/90 truncate max-w-[80px]">
                      {latestReactor.name}
                    </span>

                    {/* Reaction emoji */}
                    <motion.img
                      src={REACTION_IMAGES[latestReactor.reactionType] || fireImg}
                      alt={latestReactor.reactionType}
                      className="w-5 h-5 object-contain flex-shrink-0"
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.1 }}
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                    />

                    {/* Count badge if > 1 */}
                    {notificationCount > 1 && (
                      <span className="text-[9px] font-bold rounded-full px-1.5 py-0.5"
                        style={{
                          background: 'linear-gradient(135deg, rgba(249,115,22,0.4), rgba(236,72,153,0.4))',
                          color: 'white',
                        }}
                      >
                        +{notificationCount - 1}
                      </span>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            
            {/* Notification Bell - Right */}
            <motion.button
              onClick={() => { setShowNotifications(true); setNotificationCount(0); setLatestReactor(null); }}
              className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
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
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </motion.span>
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

          {/* Community Journey Feed */}
          <div className="mt-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}>
              <CommunityJourneyFeed
                myPhotos={photos}
                onPhotoTap={handlePhotoTap}
                onLogActivity={() => {
                  setPendingDayNumber(photos.length + 1);
                  setShowMediaSourceSheet(true);
                }}
              />
            </motion.div>
          </div>

          {/* Wall of Ninjas */}
          <div className="px-4 mt-10 pb-28">
            {/* Centered heading */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
              className="flex flex-col items-center mb-6"
            >
              <h2 className="text-2xl font-bold text-white tracking-tight text-center">Wall of Ninja's</h2>
              <div
                className="mt-1.5 h-0.5 w-12 rounded-full"
                style={{ background: "linear-gradient(90deg, #F97316, #EC4899)" }}
              />
            </motion.div>

            {/* Tagembed widget */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.24 }}
            >
              <TagembedWidget />
            </motion.div>


            {/* VIEW MORE glass CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
              className="flex justify-center mt-5"
            >
              <motion.a
                href="https://one-million-habits.lovable.app"
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold tracking-widest uppercase select-none"
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(48px) saturate(190%)",
                  WebkitBackdropFilter: "blur(48px) saturate(190%)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 4px 24px rgba(0,0,0,0.25)",
                  color: "rgba(255,255,255,0.92)",
                  letterSpacing: "0.12em",
                }}
              >
                <span
                  style={{
                    background: "linear-gradient(90deg, #F97316, #EC4899)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontWeight: 700,
                  }}
                >
                  VIEW MORE
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="arrow-grad" x1="0" y1="0" x2="14" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F97316"/>
                      <stop offset="1" stopColor="#EC4899"/>
                    </linearGradient>
                  </defs>
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="url(#arrow-grad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.a>
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

      {/* Sticky Make Public CTA — always visible when profile is private */}
      {!isUserPublic && (
        <motion.div
          className="fixed left-0 right-0 z-40 px-5 pb-2"
          style={{ bottom: 80 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          <button
            onClick={() => setShowMakePublicSheet(true)}
            className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              boxShadow: '0 4px 24px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <Globe className="w-4.5 h-4.5" />
            Make Profile Public to See Others
          </button>
        </motion.div>
      )}

      {/* Make Public Sheet */}
      <MakePublicSheet
        isOpen={showMakePublicSheet}
        onClose={() => setShowMakePublicSheet(false)}
        onMakePublic={() => {
          setShowMakePublicSheet(false);
        }}
        onKeepPrivate={() => setShowMakePublicSheet(false)}
      />
    </div>
  );
};

export default Activity;
