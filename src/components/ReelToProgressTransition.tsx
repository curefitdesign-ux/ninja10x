import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { X, Plus, Lock } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import ActivityGalleryOverlay from '@/components/ActivityGalleryOverlay';
import { isVideoUrl } from '@/lib/media';
import { ReactionType, ActivityReaction } from '@/services/journey-service';
import GamifiedJourneyPath from '@/components/GamifiedJourneyPath';
import plusIconImg from '@/assets/icons/plus-icon.png';
import cultNinjaText from '@/assets/progress/cult-ninja-text.svg';
import finalGoalImg from '@/assets/progress/final-goal.png';


interface Activity {
  id: string;
  storageUrl: string;
  originalUrl?: string;
  isVideo?: boolean;
  dayNumber: number;
  avatarUrl?: string;
  displayName?: string;
  userId?: string;
  createdAt?: string;
}

interface ReelToProgressTransitionProps {
  isOpen: boolean;
  onClose: () => void;
  currentActivity: Activity | null;
  publicFeed: Activity[];
  myActivities: { id?: string; dayNumber: number; storageUrl?: string; originalUrl?: string; isVideo?: boolean; activity?: string; frame?: string; duration?: string; pr?: string; createdAt?: string; reactionCount?: number; reactions?: Partial<Record<ReactionType, ActivityReaction>>; reactorProfiles?: { userId: string; displayName: string; avatarUrl?: string; reactionType?: ReactionType; createdAt?: string }[] }[];
  onStoryTap: (index: number, userId?: string, activityId?: string) => void;
  onLogActivity?: () => void;
  onCrystalTap?: (weekNum: number) => void;
  isInline?: boolean;
  highlightDayNumber?: number;
  openGalleryAtDay?: number;
}

export default function ReelToProgressTransition({
  isOpen,
  onClose,
  currentActivity,
  publicFeed,
  myActivities,
  onStoryTap,
  onLogActivity,
  onCrystalTap,
  isInline = false,
  highlightDayNumber,
  openGalleryAtDay,
}: ReelToProgressTransitionProps) {
  const [showTiles, setShowTiles] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [expandingCardId, setExpandingCardId] = useState<string | null>(null);
  // Open gallery immediately on mount when coming from notification
  const [galleryOpen, setGalleryOpen] = useState(!!openGalleryAtDay);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const openGalleryHandledRef = useRef(!!openGalleryAtDay);
  const [showCertPopup, setShowCertPopup] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine current activity with public feed and sort by latest first
  const allStories = (() => {
    const stories: Activity[] = [];
    
    // Add public feed items first
    publicFeed.forEach(item => {
      if (!stories.some(s => s.id === item.id)) {
        stories.push(item);
      }
    });
    
    // Add current activity if not already in list
    if (currentActivity && !stories.some(s => s.id === currentActivity.id)) {
      stories.unshift(currentActivity);
    }
    
    // Sort by createdAt or dayNumber (latest first)
    return stories.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return b.dayNumber - a.dayNumber;
    });
  })();

  // Show content immediately when opening - no delays for instant feel
  useEffect(() => {
    if (isOpen) {
      // Show everything immediately for instant transition
      setShowStories(true);
      setShowTiles(true);
    } else {
      setShowTiles(false);
      setShowStories(false);
      setExpandingCardId(null);
    }
  }, [isOpen]);

  const handleStoryTap = useCallback((story: Activity, index: number) => {
    // Set expanding card for animation
    setExpandingCardId(story.id);
    
    // Slight delay to show expansion animation before closing
    setTimeout(() => {
      onStoryTap(index, story.userId, story.id);
    }, 250);
  }, [onStoryTap]);

  // Set correct gallery index when activities load (gallery already open from initial state)
  useEffect(() => {
    if (!openGalleryAtDay || myActivities.length === 0) return;
    if (openGalleryHandledRef.current) {
      // Already set index, just ensure gallery stays open
      return;
    }
    openGalleryHandledRef.current = true;
    const uploaded = myActivities.filter(a => a.storageUrl);
    const idx = uploaded.findIndex(a => a.dayNumber === openGalleryAtDay);
    setGalleryInitialIndex(Math.max(0, idx));
    setGalleryOpen(true);
  }, [openGalleryAtDay, myActivities]);


  // Build week stacks data
  const WEEK_LOCK_COLORS = ['rgba(180,160,220,0.8)', '#F59E0B', '#D946EF', '#22C55E'];
  const weekStacks = useMemo(() => {
    return [1, 2, 3, 4].map(week => {
      const startDay = (week - 1) * 3 + 1;
      const days = [startDay, startDay + 1, startDay + 2];
      const activitiesInWeek = days.map(d => myActivities.find(a => a.dayNumber === d));
      const completedCount = activitiesInWeek.filter(Boolean).length;
      const totalActivities = myActivities.length;
      const isCurrentWeek = totalActivities >= startDay - 1 && totalActivities < startDay + 3;
      const isLocked = totalActivities < startDay - 1;
      return { week, days, activitiesInWeek, completedCount, isCurrentWeek, isLocked };
    });
  }, [myActivities]);

  if (isInline) {
    // Inline mode: render content directly without fixed overlay
    return (
      <div className="flex flex-col h-full overflow-y-auto overflow-x-clip">
        <div className="flex flex-col h-full">
            {/* Week Progress Stacks */}
            {showStories && (
              <div
                className="flex-shrink-0 w-full overflow-x-auto scrollbar-hide overscroll-x-contain"
                style={{
                  paddingTop: "8px",
                  paddingInline: "20px",
                  paddingBottom: "12px",
                  minHeight: "160px",
                }}
              >
                <div className="relative flex items-start" style={{ minWidth: "max-content", gap: "80px" }}>
                  {/* Dashed thread connecting stacks */}
                  <svg
                    className="absolute pointer-events-none"
                    style={{ top: "30px", left: "45px", width: "calc(100% - 90px)", height: "60px", zIndex: 0 }}
                    preserveAspectRatio="none"
                    viewBox="0 0 400 60"
                    fill="none"
                  >
                    <path
                      d="M0,30 C40,55 70,5 100,30 C130,55 160,5 200,30 C230,55 260,5 300,30 C330,55 360,5 400,30"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                      fill="none"
                    />
                  </svg>
                  {weekStacks.map((ws, wIdx) => {
                    const lockColor = WEEK_LOCK_COLORS[wIdx];
                    const isGlowing = ws.isCurrentWeek;

                    return (
                      <motion.div
                        key={ws.week}
                        className="flex flex-col items-center gap-2 flex-shrink-0"
                        style={{ width: "90px" }}
                        initial={{ opacity: 0, y: 20, scale: 0.85 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28, delay: wIdx * 0.06 }}
                      >

                        {/* Fanned card stack */}
                        {(() => {
                          const hasPhotos = ws.activitiesInWeek.some(a => a?.storageUrl);
                          const spreadWidth = hasPhotos ? "105px" : "80px";
                          // Spread positions when photos exist
                          const card1Pos = hasPhotos
                            ? { top: "10px", left: "0px", rotate: "-4deg" }
                            : { top: "12px", left: "13px", rotate: "1deg" };
                          const card2Pos = hasPhotos
                            ? { top: "6px", left: "26px", rotate: "2deg" }
                            : { top: "6px", left: "-2px", rotate: "-6deg" };
                          const card3Pos = hasPhotos
                            ? { top: "10px", left: "52px", rotate: "6deg" }
                            : { top: "8px", left: "30px", rotate: "8deg" };

                          return (
                            <motion.button
                              className="relative cursor-pointer"
                              style={{
                                width: spreadWidth,
                                height: "100px",
                                paddingLeft: "20px",
                                ...(isGlowing ? {
                                  filter: "drop-shadow(0 0 20px rgba(140,100,220,0.5))",
                                } : {}),
                              }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                const hasPhotos = ws.activitiesInWeek.some(a => a?.storageUrl);
                                if (hasPhotos) {
                                  // Find index of first activity in this week within all uploaded activities
                                  const uploaded = myActivities.filter(a => a.storageUrl);
                                  const firstInWeek = ws.activitiesInWeek.find(a => a?.storageUrl);
                                  const idx = firstInWeek ? uploaded.findIndex(a => a.dayNumber === firstInWeek.dayNumber) : 0;
                                  setGalleryInitialIndex(Math.max(0, idx));
                                  setGalleryOpen(true);
                                } else if (isGlowing && onLogActivity) {
                                  onLogActivity();
                                }
                              }}
                            >
                              {/* Card 3 (back-right / rightmost when spread) */}
                              <div
                                className="absolute rounded-xl overflow-hidden"
                                style={{
                                  width: "52px", height: "72px",
                                  top: card3Pos.top, left: card3Pos.left,
                                  transform: `rotate(${card3Pos.rotate})`,
                                  boxShadow: "0 0 0 1.5px rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.3)",
                                  background: ws.activitiesInWeek[2]?.storageUrl
                                    ? '#000'
                                    : ws.isLocked
                                      ? "linear-gradient(135deg, rgba(40,35,55,0.9), rgba(20,18,30,0.95))"
                                      : isGlowing
                                        ? "linear-gradient(135deg, rgba(120,90,180,0.4), rgba(80,60,140,0.3))"
                                        : "linear-gradient(135deg, rgba(60,55,75,0.6), rgba(30,28,40,0.7))",
                                }}
                              >
                                {ws.activitiesInWeek[2]?.storageUrl ? (
                                  <img src={ws.activitiesInWeek[2].originalUrl || ws.activitiesInWeek[2].storageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
                                ) : isGlowing ? (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Plus size={14} className="text-white/50" />
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Lock size={14} style={{ color: lockColor, opacity: 0.7 }} />
                                  </div>
                                )}
                              </div>

                              {/* Card 2 (middle when spread) */}
                              <div
                                className="absolute rounded-xl overflow-hidden"
                                style={{
                                  width: "52px", height: "72px",
                                  top: card2Pos.top, left: card2Pos.left,
                                  transform: `rotate(${card2Pos.rotate})`,
                                  boxShadow: "0 0 0 1.5px rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.3)",
                                  zIndex: 1,
                                  background: ws.activitiesInWeek[1]?.storageUrl
                                    ? '#000'
                                    : ws.isLocked
                                      ? "linear-gradient(135deg, rgba(40,35,55,0.9), rgba(20,18,30,0.95))"
                                      : isGlowing
                                        ? "linear-gradient(135deg, rgba(120,90,180,0.4), rgba(80,60,140,0.3))"
                                        : "linear-gradient(135deg, rgba(60,55,75,0.6), rgba(30,28,40,0.7))",
                                }}
                              >
                                {ws.activitiesInWeek[1]?.storageUrl ? (
                                  <img src={ws.activitiesInWeek[1].originalUrl || ws.activitiesInWeek[1].storageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
                                ) : isGlowing ? (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Plus size={14} className="text-white/50" />
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Lock size={14} style={{ color: lockColor, opacity: 0.7 }} />
                                  </div>
                                )}
                              </div>

                              {/* Card 1 (front-left / leftmost when spread) */}
                              <div
                                className="absolute rounded-xl overflow-hidden"
                                style={{
                                  width: "54px", height: "74px",
                                  top: card1Pos.top, left: card1Pos.left,
                                  transform: `rotate(${card1Pos.rotate})`,
                                  boxShadow: isGlowing
                                    ? "0 0 0 1.5px rgba(180,150,240,0.4), 0 4px 12px rgba(0,0,0,0.3)"
                                    : "0 0 0 1.5px rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.3)",
                                  background: ws.activitiesInWeek[0]?.storageUrl
                                    ? '#000'
                                    : ws.isLocked
                                      ? "linear-gradient(135deg, rgba(40,35,55,0.9), rgba(20,18,30,0.95))"
                                      : isGlowing
                                        ? "linear-gradient(135deg, rgba(120,90,180,0.5), rgba(90,70,160,0.4))"
                                        : "linear-gradient(135deg, rgba(60,55,75,0.6), rgba(30,28,40,0.7))",
                                  zIndex: 2,
                                }}
                              >
                                {ws.activitiesInWeek[0]?.storageUrl ? (
                                  <img src={ws.activitiesInWeek[0].originalUrl || ws.activitiesInWeek[0].storageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
                                ) : isGlowing ? (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Plus size={18} className="text-white/60" />
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Lock size={16} style={{ color: lockColor }} />
                                  </div>
                                )}
                              </div>

                              {/* Plus icon for current week with incomplete photos */}
                              {isGlowing && ws.completedCount > 0 && ws.completedCount < 3 && (
                                <div
                                  className="absolute z-10"
                                  style={{
                                    bottom: '-10px',
                                    right: hasPhotos ? '-8px' : '-4px',
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onLogActivity?.();
                                  }}
                                >
                                  <img src={plusIconImg} alt="Add" className="drop-shadow-lg" style={{ width: '34px', height: '34px' }} />
                                </div>
                              )}
                            </motion.button>
                          );
                        })()}

                        {/* Week label */}
                        <span className="text-[9px] font-bold tracking-widest text-white/40 uppercase">
                          WEEK {String(ws.week).padStart(2, '0')} | {String(ws.completedCount).padStart(2, '0')}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gamified Journey Path */}
            {showTiles && (
              <div className="w-full mx-auto" style={{ maxWidth: "400px", marginTop: -20 }}>
                <GamifiedJourneyPath completedActivities={myActivities.length} onCrystalTap={onCrystalTap} onFinalGoalTap={() => setShowCertPopup(true)} highlightDayNumber={highlightDayNumber} />
              </div>
            )}

            {/* Certificate Popup */}
            {createPortal(
              <AnimatePresence>
                {showCertPopup && (
                  <>
                    <motion.div
                      className="fixed inset-0"
                      style={{ zIndex: 90, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowCertPopup(false)}
                    />
                    <motion.div
                      className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] flex flex-col items-center"
                      style={{
                        zIndex: 91,
                        borderRadius: 20,
                        background: 'rgba(10, 10, 10, 0.85)',
                        backdropFilter: 'blur(60px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: '0 0 40px rgba(130, 100, 255, 0.2), 0 24px 80px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
                        padding: '28px 24px 24px',
                      }}
                      initial={{ opacity: 0, scale: 0.9, y: '-45%', x: '-50%' }}
                      animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
                      exit={{ opacity: 0, scale: 0.9, y: '-45%', x: '-50%' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      {/* Certificate image */}
                      <motion.img
                        src={finalGoalImg}
                        alt="Certificate"
                        style={{
                          width: 100,
                          height: 'auto',
                          transform: 'rotate(12deg)',
                          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.4))',
                          marginBottom: 20,
                        }}
                      />

                      {/* Title */}
                      <p className="text-center text-white/90 text-[16px] leading-snug font-medium" style={{ marginBottom: 6 }}>
                        You are <span className="text-white font-bold">{Math.max(0, 12 - myActivities.length)} activities</span> away
                        from becoming
                      </p>

                      {/* CULT NINJA */}
                      <div className="flex justify-center" style={{ marginBottom: 14 }}>
                        <img src={cultNinjaText} alt="CULT NINJA" style={{ width: 150, height: 'auto' }} />
                      </div>

                      {/* Subtext */}
                      <p className="text-center text-white/40 text-[12px] leading-relaxed" style={{ marginBottom: 20 }}>
                        Inspire & Help Build India's<br />Ultimate Habit Building Product
                      </p>

                      {/* CTA */}
                      <motion.button
                        className="w-full py-3 rounded-2xl text-[15px] font-semibold active:scale-[0.97] transition-transform"
                        style={{
                          background: 'linear-gradient(135deg, rgba(130, 100, 255, 0.25) 0%, rgba(130, 100, 255, 0.1) 100%)',
                          border: '1px solid rgba(130, 100, 255, 0.3)',
                          color: 'rgba(180, 160, 220, 1)',
                        }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowCertPopup(false)}
                      >
                        Got it
                      </motion.button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>,
              document.body
            )}
          </div>

        {/* Activity Gallery Overlay */}
        <ActivityGalleryOverlay
          isOpen={galleryOpen}
          onClose={() => {
            setGalleryOpen(false);
            // If opened from notification, go back to reel instead of showing progress page
            if (openGalleryAtDay) {
              navigate('/reel', { replace: true });
            }
          }}
          activities={[
            ...myActivities
              .filter(a => a.storageUrl)
              .map(a => ({
                id: a.id || `day-${a.dayNumber}`,
                storageUrl: a.storageUrl!,
                originalUrl: a.originalUrl,
                isVideo: a.isVideo,
                activity: a.activity,
                frame: a.frame,
                duration: a.duration,
                pr: a.pr,
                dayNumber: a.dayNumber,
                reactionCount: a.reactionCount,
                reactions: a.reactions,
                reactorProfiles: a.reactorProfiles,
              })),
            // Append empty state placeholder only if journey isn't complete AND no activity logged in last 24h
            ...(() => {
              if (myActivities.length >= 12) return [];
              const latest = myActivities
                .filter(a => a.storageUrl)
                .sort((a, b) => b.dayNumber - a.dayNumber)[0];
              if (latest) {
                // Check if the latest activity was created within the last 24 hours
                const createdAt = latest.createdAt;
                if (createdAt) {
                  const hoursSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
                  if (hoursSince < 24) return [];
                }
              }
              return [{
                id: 'log-next',
                storageUrl: '',
                dayNumber: myActivities.length + 1,
                isPlaceholder: true,
              }];
            })(),
          ]}
          initialIndex={galleryInitialIndex}
          onLogActivity={onLogActivity}
        />
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden touch-manipulation"
          style={{
            background: "linear-gradient(180deg, #3A2A63 0%, #1A1530 45%, #060608 100%)",
            height: '100dvh',
            minHeight: '-webkit-fill-available',
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.15 }}
        >
          <LayoutGroup>
            <motion.div className="flex-1 flex flex-col">
              {/* Background aurora effect */}
              <div 
                className="absolute pointer-events-none"
                style={{ left: "-53px", top: "-40px", width: "131vw", height: "auto" }}
              >
                <div 
                  className="w-full h-[400px] opacity-40 mix-blend-screen"
                  style={{ background: "radial-gradient(ellipse at center, rgba(138, 100, 200, 0.4) 0%, transparent 70%)" }}
                />
              </div>

              {/* Header - minimal, just close button */}
              <motion.div
                className="flex-shrink-0 w-full flex items-center justify-end px-4"
                style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <motion.button
                  onClick={onClose}
                  className="flex items-center justify-center text-white/80 active:scale-95 transition-transform"
                  style={{ width: '36px', height: '36px' }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6" strokeWidth={1.5} />
                </motion.button>
              </motion.div>

              {/* Story strip - all stories sorted by latest */}
              <AnimatePresence>
                {showStories && (
                  <motion.div
                    className="flex-shrink-0 w-full overflow-x-auto scrollbar-hide overscroll-x-contain"
                    style={{
                      paddingTop: "12px",
                      paddingInline: "4vw",
                      paddingBottom: "16px",
                      minHeight: "130px",
                    }}
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -60, transition: { duration: 0.15 } }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  >
                    <div className="flex items-end gap-3">
                      {allStories.slice(0, 8).map((story, index) => {
                        const isExpanding = expandingCardId === story.id;
                        const storyMediaUrl = story.originalUrl || story.storageUrl;
                        const storyIsVideo = story.isVideo || isVideoUrl(storyMediaUrl);
                        
                        return (
                          <motion.button
                            key={story.id}
                            layoutId={`story-card-${story.id}`}
                            className="relative flex-shrink-0 overflow-hidden cursor-pointer"
                            style={{
                              width: isExpanding ? "100vw" : "72px",
                              height: isExpanding ? "70vh" : "100px",
                              borderRadius: isExpanding ? "24px" : "14px",
                              boxShadow: isExpanding 
                                ? "0 24px 60px rgba(100, 70, 180, 0.6)"
                                : index === 0 
                                  ? "0 12px 40px rgba(100, 70, 180, 0.5)"
                                  : "0 4px 16px rgba(0,0,0,0.25)",
                              border: isExpanding 
                                ? "3px solid rgba(160, 120, 220, 0.5)"
                                : index === 0 
                                  ? "2px solid rgba(160, 120, 220, 0.35)"
                                  : "1px solid rgba(255,255,255,0.1)",
                              zIndex: isExpanding ? 100 : 10 - index,
                              position: isExpanding ? 'fixed' : 'relative',
                              left: isExpanding ? '50%' : 'auto',
                              top: isExpanding ? '50%' : 'auto',
                              x: isExpanding ? '-50%' : 0,
                              y: isExpanding ? '-50%' : 0,
                            }}
                            onClick={() => handleStoryTap(story, index)}
                            initial={{ opacity: 0, x: 40, scale: 0.8 }}
                            animate={{ 
                              opacity: 1, 
                              x: 0, 
                              scale: isExpanding ? 1.02 : 1,
                            }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileTap={{ scale: isExpanding ? 1 : 0.95 }}
                            transition={{ 
                              type: "spring", 
                              stiffness: 350, 
                              damping: 35,
                              delay: isExpanding ? 0 : index * 0.03,
                            }}
                          >
                            {storyIsVideo ? (
                              <video
                                src={storyMediaUrl}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                loop
                                autoPlay
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={storyMediaUrl}
                                alt={`Day ${story.dayNumber}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                            
                            {/* Avatar - hide when expanding */}
                            {story.avatarUrl && !isExpanding && (
                              <motion.div 
                                className="absolute bottom-1.5 left-1.5"
                                animate={{ opacity: isExpanding ? 0 : 1 }}
                              >
                                <ProfileAvatar
                                  src={story.avatarUrl}
                                  name={story.displayName || ''}
                                  size={24}
                                  style={{ border: '2px solid rgba(255,255,255,0.6)' }}
                                />
                              </motion.div>
                            )}
                            
                            {/* Day badge - hide when expanding */}
                            {!isExpanding && (
                              <motion.div 
                                className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-white font-semibold text-[9px]"
                                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                                animate={{ opacity: isExpanding ? 0 : 1 }}
                              >
                                D{story.dayNumber}
                              </motion.div>
                            )}
                            
                            {/* Tap to view text when expanding */}
                            {isExpanding && (
                              <motion.div
                                className="absolute inset-0 flex items-center justify-center bg-black/20"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <span className="text-white text-lg font-semibold tracking-wide">Opening...</span>
                              </motion.div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Gamified Journey Path */}
              <motion.div
                className="w-full mx-auto px-4"
                style={{ maxWidth: "370px" }}
                animate={{ opacity: expandingCardId ? 0.3 : 1 }}
              >
                {showTiles && (
                  <GamifiedJourneyPath completedActivities={myActivities.length} onCrystalTap={onCrystalTap} highlightDayNumber={highlightDayNumber} />
                )}
              </motion.div>
            </motion.div>
          </LayoutGroup>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
