import { useState, useRef, useEffect, useCallback, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { X, Share2, Pencil, ChevronUp } from 'lucide-react';
import SendReactionSheet from '@/components/SendReactionSheet';
import { createPortal } from 'react-dom';
import { usePortalContainer } from '@/hooks/use-portal-container';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { ReactionType, ActivityReaction, sendReaction } from '@/services/journey-service';
import { useJourneyActivities } from '@/hooks/use-journey-activities';
import MediaSourceSheet from '@/components/MediaSourceSheet';
import StoryFrameRenderer from '@/components/StoryFrameRenderer';

import ReactsSoFarSheet from '@/components/ReactsSoFarSheet';
import ProfileAvatar from '@/components/ProfileAvatar';
import Floating3DEmojis from '@/components/Floating3DEmojis';
import StoryEmojiRain from '@/components/StoryEmojiRain';
import { isVideoUrl } from '@/lib/media';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import fireEmoji from '@/assets/reactions/fire-3d.png';
import clapEmoji from '@/assets/reactions/clap-3d.png';

import deskBellImg from '@/assets/icons/desk-bell-3d.png';
import tileActiveSvg from '@/assets/progress/tile-active-svg.svg';
import tileInactiveSvg from '@/assets/progress/tile-inactive-svg.svg';

interface ReactorProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  reactionType?: ReactionType;
  createdAt?: string;
}

const DEFAULT_REACTIONS: Partial<Record<ReactionType, ActivityReaction>> = {};

export interface GalleryActivity {
  id: string;
  storageUrl: string;
  originalUrl?: string;
  isVideo?: boolean;
  activity?: string;
  frame?: string;
  duration?: string;
  pr?: string;
  dayNumber: number;
  reactionCount?: number;
  reactions?: Partial<Record<ReactionType, ActivityReaction>>;
  reactorProfiles?: ReactorProfile[];
  isPlaceholder?: boolean;
}

interface UserProfileInfo {
  displayName: string;
  avatarUrl: string;
  startDate?: string;
}

interface ActivityGalleryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activities: GalleryActivity[];
  initialIndex?: number;
  onLogActivity?: () => void;
  userProfile?: UserProfileInfo;
  isOwnProfile?: boolean;
  targetUserId?: string;
}

const ActivityGalleryOverlay = forwardRef<HTMLDivElement, ActivityGalleryOverlayProps>(function ActivityGalleryOverlay({
  isOpen,
  onClose,
  activities,
  initialIndex = 0,
  onLogActivity,
  userProfile,
  isOwnProfile,
  targetUserId,
}, _ref) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isScrolled, setIsScrolled] = useState(false);
  const [collapsedWeeks, setCollapsedWeeks] = useState<Record<number, boolean>>({});
  const [nudgeBellAnim, setNudgeBellAnim] = useState(false);
  const [nudgeCount, setNudgeCount] = useState(0);
  const [nudgeRotation, setNudgeRotation] = useState(0);
  const [nudgeNumberBehind, setNudgeNumberBehind] = useState(false);
  const nudgeAudioRef = useRef<HTMLAudioElement | null>(null);
  const nudgeHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preload nudge sound for instant playback
  useEffect(() => {
    const audio = new Audio('/sounds/nudge-bell.mp3');
    audio.volume = 0.7;
    audio.preload = 'auto';
    audio.load();
    nudgeAudioRef.current = audio;
    return () => { nudgeAudioRef.current = null; };
  }, []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const portalContainer = usePortalContainer();
  const { user } = useAuth();

  // Hide bottom nav on open, show on close
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('gallery-overlay', { detail: { visible: true } }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('gallery-overlay', { detail: { visible: false } }));
    };
  }, [isOpen]);

  const [showReactsSheet, setShowReactsSheet] = useState(false);
  const [showSendReactionSheet, setShowSendReactionSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [cardReactId, setCardReactId] = useState<string | null>(null);

  const [localReactions, setLocalReactions] = useState<Record<string, {
    total: number;
    reactions: Partial<Record<ReactionType, ActivityReaction>>;
    reactorProfiles: ReactorProfile[];
  }>>({});

  const isPaused = showReactsSheet || showSendReactionSheet || showEditSheet;

  const hasLoggedToday = useMemo(() => {
    if (!isOwnProfile) return true;
    return !activities.some(a => a.isPlaceholder);
  }, [activities, isOwnProfile]);

  const userBioLine = useMemo((): string | null => {
    if (!userProfile || activities.length === 0) return null;
    const realActivities = activities.filter(a => !a.isPlaceholder && a.dayNumber < 1001);
    if (realActivities.length === 0) return null;
    let totalDurationMins = 0;
    const activitySet = new Set<string>();
    for (const a of realActivities) {
      if (a.duration) {
        const minMatch = a.duration.match(/(\d+)\s*min/i);
        const hrMatch = a.duration.match(/(\d+)\s*h/i);
        if (minMatch) totalDurationMins += parseInt(minMatch[1]);
        if (hrMatch) totalDurationMins += parseInt(hrMatch[1]) * 60;
      }
      if (a.activity) activitySet.add(a.activity.toLowerCase());
    }
    const count = realActivities.length;
    const weeksCompleted = Math.ceil(count / 3);

    // Title based on progress
    let title = 'Fitness Rookie 🌱';
    if (count >= 12) title = 'Cult Ninja 🥷';
    else if (count >= 9) title = 'Fitness Beast 🔥';
    else if (count >= 6) title = 'Grind Machine ⚡';
    else if (count >= 3) title = 'Rising Warrior 💪';

    const activityNames = Array.from(activitySet).join(', ') || 'fitness';
    const minsStr = totalDurationMins > 0 ? `${totalDurationMins}` : '0';

    // Dynamic middle phrases
    const midPhrases = [
      `Spent ${minsStr} minutes sharpening skills`,
      `Put in ${minsStr} minutes of pure effort`,
      `Clocked ${minsStr} minutes of hustle`,
      `Dedicated ${minsStr} minutes to the craft`,
      `Grinded for ${minsStr} minutes straight`,
    ];
    const endPhrases = [
      `in ${activityNames} 🎯 over ${weeksCompleted} ${weeksCompleted === 1 ? 'week' : 'weeks'} 🗓️`,
      `across ${activityNames} 💥 spanning ${weeksCompleted} ${weeksCompleted === 1 ? 'week' : 'weeks'} 📈`,
      `doing ${activityNames} 🏆 for ${weeksCompleted} ${weeksCompleted === 1 ? 'week' : 'weeks'} 🔥`,
    ];
    // Seed from name length for consistency per user
    const seed = (userProfile?.displayName?.length || 3);
    const mid = midPhrases[seed % midPhrases.length];
    const end = endPhrases[seed % endPhrases.length];

    return `A ${title}\n${mid} ${end}`;
  }, [activities, userProfile]);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentIndex(initialIndex);
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const map: Record<string, { total: number; reactions: Partial<Record<ReactionType, ActivityReaction>>; reactorProfiles: ReactorProfile[] }> = {};
    for (const a of activities) {
      map[a.id] = {
        total: a.reactionCount || 0,
        reactions: a.reactions || { ...DEFAULT_REACTIONS },
        reactorProfiles: a.reactorProfiles || [],
      };
    }
    setLocalReactions(map);
  }, [activities, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    for (const act of activities) {
      if (act && !act.isPlaceholder && !act.isVideo) {
        const url = act.originalUrl || act.storageUrl;
        if (url) { const img = new Image(); img.src = url; }
      }
    }
  }, [isOpen, activities]);

  const totalActivities = useMemo(() => activities.filter(a => !a.isPlaceholder).length, [activities]);

  const totalDurationStr = useMemo(() => {
    let totalMins = 0;
    for (const a of activities) {
      if (a.isPlaceholder || !a.duration) continue;
      const minMatch = a.duration.match(/(\d+)\s*min/i);
      const hrMatch = a.duration.match(/(\d+)\s*h/i);
      if (minMatch) totalMins += parseInt(minMatch[1]);
      if (hrMatch) totalMins += parseInt(hrMatch[1]) * 60;
    }
    if (totalMins === 0) return null;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0 ? (mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`) : `${mins}m`;
  }, [activities]);

  if (!isOpen || activities.length === 0) return null;

  const current = activities[currentIndex];
  const currentReactions = localReactions[current.id] || { total: 0, reactions: { ...DEFAULT_REACTIONS }, reactorProfiles: [] };
  const mediaUrl = (current.frame && current.frame !== 'recap' && current.originalUrl)
    ? (current.originalUrl || current.storageUrl || '')
    : (current.storageUrl || current.originalUrl || '');
  const week = Math.ceil(current.dayNumber / 3);
  const canShare = !current.isPlaceholder;

  const handleReact = async (type: ReactionType) => {
    if (!user || !current || isOwnProfile) return;
    setShowSendReactionSheet(false);
    setLocalReactions(prev => {
      const curr = prev[current.id] || { total: 0, reactions: { ...DEFAULT_REACTIONS }, reactorProfiles: [] };
      const existing = curr.reactions[type];
      const newCount = (existing?.count || 0) + 1;
      return { ...prev, [current.id]: { ...curr, total: curr.total + 1, reactions: { ...curr.reactions, [type]: { count: newCount, reacted: true } }, reactorProfiles: [...curr.reactorProfiles, { userId: user.id, displayName: 'You', reactionType: type }] } };
    });
    try { await sendReaction(current.id, type); } catch (err) { console.error('Reaction failed', err); }
  };

  const buildSharePayload = () => {
    const activityName = current?.activity || 'workout';
    const shareText = `Check out my ${activityName} on my fitness journey! 💪`;
    const url = mediaUrl && mediaUrl.startsWith('http') ? mediaUrl : window.location.href;
    return { title: 'My Fitness Story', text: shareText, url };
  };

  const shareToChannel = (channel: 'whatsapp' | 'instagram' | 'messages') => {
    const payload = buildSharePayload();
    const shareText = `${payload.text}\n\n${payload.url}`;
    setTimeout(() => {
      if (channel === 'whatsapp') {
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
        const webFallback = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        const link = document.createElement('a'); link.href = whatsappUrl; link.style.display = 'none';
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        setTimeout(() => { window.location.href = webFallback; }, 1500);
        return;
      }
      if (channel === 'messages') { window.location.href = `sms:&body=${encodeURIComponent(shareText)}`; return; }
      if (channel === 'instagram') {
        if (navigator.share) { navigator.share(payload).catch(() => {}); }
        else { navigator.clipboard.writeText(shareText).then(() => toast.success('Link copied! Paste it in Instagram.')).catch(() => toast.error('Unable to copy link')); }
      }
    }, 100);
  };

  const overlay = (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0" style={{ zIndex: 60 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
        {/* Journal-style warm background */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, #F5F0E8 0%, #EDE7DA 40%, #E8E0D0 100%)',
        }}>
          {/* Subtle ruled lines */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 31px, rgba(180,160,130,0.12) 31px, rgba(180,160,130,0.12) 32px)',
            backgroundPosition: '0 0',
          }} />
          {/* Left margin line */}
          <div className="absolute top-0 bottom-0 pointer-events-none" style={{
            left: 52,
            width: 1.5,
            background: 'rgba(210, 140, 130, 0.18)',
          }} />
        </div>
          <div className="absolute inset-0 flex flex-col" style={{ overflow: 'hidden' }}>
            {/* TOP HEADER — collapses on scroll */}
            <div
              className="shrink-0 z-50"
              style={{
                paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)',
                background: isScrolled ? 'rgba(245, 240, 232, 0.92)' : 'transparent',
                backdropFilter: isScrolled ? 'blur(20px)' : 'none',
                WebkitBackdropFilter: isScrolled ? 'blur(20px)' : 'none',
                borderBottom: isScrolled ? '1px solid rgba(180,160,130,0.2)' : '1px solid transparent',
                boxShadow: isScrolled ? '0 4px 16px rgba(0, 0, 0, 0.06)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Compact header (scrolled) */}
              <AnimatePresence mode="wait">
                {isScrolled && userProfile ? (
                  <motion.div
                    key="compact"
                    className="flex items-center justify-between px-4 pb-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-full overflow-hidden" style={{ width: 32, height: 32, border: '1.5px solid rgba(0,0,0,0.1)' }}>
                        <ProfileAvatar src={userProfile.avatarUrl} name={userProfile.displayName} size={32} />
                      </div>
                      <div>
                        <h2 className="font-bold truncate" style={{ fontSize: 14, letterSpacing: '-0.02em', maxWidth: 160, color: '#3A3028', fontFamily: "'Caveat', cursive" }}>{userProfile.displayName}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(58,48,40,0.4)' }}>{totalActivities}/12 Days</span>
                          {totalDurationStr && <span style={{ fontSize: 10, color: 'rgba(58,48,40,0.25)' }}>·</span>}
                          {totalDurationStr && <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(58,48,40,0.4)' }}>{totalDurationStr}</span>}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      className="w-8 h-8 flex items-center justify-center rounded-full active:scale-90"
                      style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)' }}
                      onClick={onClose} whileTap={{ scale: 0.85 }}
                    >
                      <X className="w-4 h-4" style={{ color: '#3A3028' }} />
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="full"
                    className="flex items-center justify-end px-4"
                    style={{ height: 40 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.button
                      className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90"
                      style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)' }}
                      onClick={onClose} whileTap={{ scale: 0.85 }}
                    >
                      <X className="w-5 h-5" style={{ color: '#3A3028' }} />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FULL PROFILE — journal header style */}
            <AnimatePresence>
              {!isScrolled && userProfile && (
                <motion.div
                  className="shrink-0 flex flex-col items-center z-40 px-4 pb-3"
                  initial={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, paddingBottom: 0 }}
                  transition={{ duration: 0.25 }}
                >
                   <div className="rounded-full overflow-hidden" style={{ width: 56, height: 56, border: '2.5px solid rgba(58,48,40,0.15)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                     <ProfileAvatar src={userProfile.avatarUrl} name={userProfile.displayName} size={56} />
                   </div>
                   <h2 className="text-center mt-2 px-4 w-full" style={{ fontFamily: "'Caveat', cursive", fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em', color: '#3A3028' }}>{userProfile.displayName}</h2>
                   {userBioLine && (
                     <p className="text-center mt-1 px-5 leading-[1.5]" style={{ 
                        fontFamily: "'Inter', -apple-system, system-ui, sans-serif", 
                        fontSize: 12, 
                        fontWeight: 400,
                        color: 'rgba(58,48,40,0.55)',
                        maxWidth: 280,
                        letterSpacing: '0.01em',
                        whiteSpace: 'pre-line',
                      }}>
                       {userBioLine}
                     </p>
                   )}
                   {/* Decorative divider */}
                   <div className="flex items-center gap-3 mt-3" style={{ width: '70%' }}>
                     <div style={{ flex: 1, height: 1, background: 'rgba(58,48,40,0.12)' }} />
                     <span style={{ fontSize: 10, color: 'rgba(58,48,40,0.3)', fontFamily: "'Caveat', cursive", fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>My Journal</span>
                     <div style={{ flex: 1, height: 1, background: 'rgba(58,48,40,0.12)' }} />
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* JOURNAL TIMELINE */}
            <div
              ref={scrollRef}
              className="flex-1 min-h-0 z-30 overflow-y-auto overflow-x-hidden"
              style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 120, paddingTop: 16 }}
              onScroll={(e) => {
                const scrollTop = (e.target as HTMLDivElement).scrollTop;
                setIsScrolled(scrollTop > 30);
              }}
            >
              <div className="relative" style={{ minHeight: '100%' }}>

                {(() => {
                  const sortedActivities = [...activities].filter(a => !a.isPlaceholder);
                  const remainingDays = 12 - sortedActivities.length;
                  const getCardStyle = (index: number, dayNumber: number) => {
                    const seed = dayNumber * 7 + index * 13;
                    return { rotation: ((seed % 11) - 5) * 1.2, offsetX: ((seed * 3) % 7) - 2, decorType: seed % 5 };
                  };

                  // Group activities by week (week 1 = days 1-3, week 2 = days 4-6, etc.)
                  const weekGroups: Record<number, typeof sortedActivities> = {};
                  for (const act of sortedActivities) {
                    const wk = Math.ceil(act.dayNumber / 3);
                    if (!weekGroups[wk]) weekGroups[wk] = [];
                    weekGroups[wk].push(act);
                  }
                  // Sort each week's activities by dayNumber
                  for (const wk of Object.keys(weekGroups)) {
                    weekGroups[Number(wk)].sort((a, b) => a.dayNumber - b.dayNumber);
                  }

                  const WEEK_THEMES: Record<number, string> = {
                    1: 'CONQUER WILL POWER',
                    2: 'BUILD ENERGY',
                    3: 'INCREASE STAMINA',
                    4: 'BUILD STRENGTH',
                  };

                  // Determine which weeks exist (1-4), reversed order (latest first)
                  const allWeeks = [4, 3, 2, 1];
                  const highestCompletedWeek = Math.max(0, ...Object.keys(weekGroups).map(Number));

                  return (
                    <>
                      {/* CERTIFICATE — top of timeline */}
                      <div className="relative flex items-center gap-3" style={{ padding: '16px 20px 20px 20px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: sortedActivities.length >= 12 ? '#8B7355' : 'rgba(138,120,90,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>🏆</div>
                        <div>
                          <p style={{ fontFamily: "'Caveat', cursive", fontSize: 16, fontWeight: 700, color: sortedActivities.length >= 12 ? '#3A3028' : 'rgba(58,48,40,0.3)', letterSpacing: '0.02em' }}>
                            Certificate
                          </p>
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 400, color: sortedActivities.length >= 12 ? 'rgba(58,48,40,0.5)' : 'rgba(58,48,40,0.2)', marginTop: 1 }}>
                            {sortedActivities.length >= 12 ? 'Journey Complete — You crushed it!' : `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} to go`}
                          </p>
                        </div>
                      </div>

                      {/* Weeks: 4 → 3 → 2 → 1 */}
                      {allWeeks.map((weekNum) => {
                        const weekActs = weekGroups[weekNum] || [];
                        const isWeekComplete = weekActs.length >= 3;
                        const hasAnyActivity = weekActs.length > 0;
                        const weekTheme = WEEK_THEMES[weekNum] || '';
                        const isCollapsed = !!collapsedWeeks[weekNum];
                        const weekActsDesc = [...weekActs].sort((a, b) => b.dayNumber - a.dayNumber);

                        return (
                          <div key={`week-${weekNum}`}>
                            {/* REEL GENERATION row */}
                            {isWeekComplete && isOwnProfile && (
                              <div className="flex flex-col items-center" style={{ padding: '4px 20px 12px 20px' }}>
                                <button
                                  onClick={() => {
                                    const weekActivities = weekActs.map(a => ({
                                      id: a.id, storageUrl: a.storageUrl, originalUrl: a.originalUrl,
                                      isVideo: a.isVideo, activity: a.activity, frame: a.frame,
                                      duration: a.duration, pr: a.pr, dayNumber: a.dayNumber,
                                    }));
                                    window.dispatchEvent(new CustomEvent('navigate-reel-gen', { detail: { week: weekNum, activities: weekActivities } }));
                                  }}
                                  className="active:scale-95 transition-transform"
                                  style={{
                                    fontFamily: "'Caveat', cursive", fontSize: 14, fontWeight: 700,
                                    color: '#6B5B45', background: 'rgba(138,120,90,0.08)',
                                    border: '1px dashed rgba(138,120,90,0.25)', borderRadius: 20,
                                    padding: '7px 18px', letterSpacing: '0.02em',
                                  }}
                                >
                                  ✨ Generate Week {weekNum} Reel
                                </button>
                              </div>
                            )}

                            {/* WEEK HEADER */}
                            <div
                              className="flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                              style={{ padding: '8px 20px 12px 20px' }}
                              onClick={() => setCollapsedWeeks(prev => ({ ...prev, [weekNum]: !prev[weekNum] }))}
                            >
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                background: isWeekComplete ? '#8B7355' : 'rgba(138,120,90,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 800, color: isWeekComplete ? '#F5F0E8' : 'rgba(58,48,40,0.25)',
                                fontFamily: "'Inter', sans-serif",
                              }}>
                                W{weekNum}
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{
                                  fontFamily: "'Caveat', cursive", fontSize: 16, fontWeight: 700,
                                  color: isWeekComplete ? '#3A3028' : 'rgba(58,48,40,0.3)',
                                }}>
                                  Week {weekNum} — {weekTheme}
                                </p>
                                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 400, color: isWeekComplete ? 'rgba(58,48,40,0.45)' : 'rgba(58,48,40,0.18)', marginTop: 1 }}>
                                  {isWeekComplete ? 'Completed ✓' : hasAnyActivity ? `${weekActs.length}/3 entries` : 'Not started yet'}
                                </p>
                              </div>
                              <motion.div
                                animate={{ rotate: isCollapsed ? 0 : 180 }}
                                transition={{ duration: 0.2 }}
                                style={{ opacity: 0.35 }}
                              >
                                <ChevronUp className="w-4 h-4" style={{ color: '#3A3028' }} />
                              </motion.div>
                            </div>

                            {/* COLLAPSIBLE CONTENT */}
                            <AnimatePresence initial={false}>
                              {!isCollapsed && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                  style={{ overflow: 'hidden' }}
                                >
                                  {[3, 2, 1].map((slot, idx) => {
                                    const dayNum = (weekNum - 1) * 3 + slot;
                                    const act = weekActsDesc.find(a => a.dayNumber === dayNum);

                                    if (!act) {
                                      return (
                                        <div key={`slot-${weekNum}-${dayNum}`} className="relative flex items-center gap-3" style={{ padding: '8px 20px 8px 28px', marginBottom: 4 }}>
                                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(138,120,90,0.15)', flexShrink: 0 }} />
                                          <div>
                                            <p style={{ fontFamily: "'Caveat', cursive", fontSize: 15, fontWeight: 600, color: 'rgba(58,48,40,0.22)' }}>
                                              Activity {dayNum}
                                            </p>
                                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 400, color: 'rgba(58,48,40,0.15)', marginTop: 1 }}>
                                              Coming soon
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    }

                                    const globalIdx = sortedActivities.findIndex(a => a.id === act.id);
                                    const { rotation, offsetX } = getCardStyle(globalIdx, act.dayNumber);
                                    const subtitle = act.activity || 'Workout';
                                    const durationSubtitle = act.duration ? ` · ${act.duration}` : '';

                                    return (
                                      <motion.div
                                        key={act.id} className="relative"
                                        style={{ padding: '8px 20px 8px 20px', marginBottom: 16 }}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: globalIdx * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
                                      >
                                        <div className="flex items-center gap-3" style={{ marginBottom: 8, paddingLeft: 8 }}>
                                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B7355', flexShrink: 0 }} />
                                          <div>
                                            <p style={{ fontFamily: "'Caveat', cursive", fontSize: 15, fontWeight: 700, color: '#3A3028' }}>
                                              Activity {act.dayNumber}
                                            </p>
                                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 400, color: 'rgba(58,48,40,0.45)', marginTop: 1 }}>
                                              {subtitle}{durationSubtitle}
                                            </p>
                                          </div>
                                        </div>

                                        <motion.div
                                          className="relative overflow-visible cursor-pointer"
                                          style={{
                                            width: '62%', aspectRatio: '9/16', borderRadius: 4,
                                            transform: `rotate(${rotation}deg) translateX(${offsetX}px)`,
                                            marginLeft: idx % 2 === 0 ? '16%' : '22%',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)',
                                          }}
                                          onClick={() => { const ri = activities.findIndex(a => a.id === act.id); if (ri >= 0) setCurrentIndex(ri); }}
                                          whileTap={{ scale: 0.97 }}
                                        >
                                          <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 4, containerType: 'inline-size' }}>
                                            {act.frame ? (
                                              <StoryFrameRenderer imageUrl={act.originalUrl || act.storageUrl} isVideo={act.isVideo} activity={act.activity} frame={act.frame} duration={act.duration} pr={act.pr} dayNumber={act.dayNumber} />
                                            ) : act.isVideo ? (
                                              <video src={act.originalUrl || act.storageUrl} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
                                            ) : (
                                              <img src={act.originalUrl || act.storageUrl} alt={`Day ${act.dayNumber}`} className="absolute inset-0 w-full h-full object-cover" />
                                            )}
                                          </div>

                                          {(() => {
                                            const ar = localReactions[act.id];
                                            const total = ar?.total || 0;
                                            return (
                                              <div className="absolute flex items-center gap-1" style={{
                                                bottom: -10, left: -6, zIndex: 30,
                                                transform: `rotate(${-rotation * 0.6}deg)`,
                                              }}>
                                                {total > 0 && (
                                                  <span style={{
                                                    fontFamily: "'Caveat', cursive", fontSize: 16,
                                                    color: 'rgba(58,48,40,0.55)',
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                  }}>
                                                    {total} ❤️
                                                  </span>
                                                )}
                                                {!isOwnProfile && (
                                                  <button
                                                    className="flex items-center gap-0.5 active:scale-90 transition-transform"
                                                    style={{
                                                      background: 'rgba(58,48,40,0.08)', backdropFilter: 'blur(10px)',
                                                      borderRadius: 14, padding: '3px 8px',
                                                      border: '1px solid rgba(58,48,40,0.1)',
                                                    }}
                                                    onClick={(e) => { e.stopPropagation(); setCardReactId(act.id); setCurrentIndex(activities.findIndex(a => a.id === act.id)); setShowSendReactionSheet(true); }}
                                                  >
                                                    <span style={{ fontSize: 12 }}>🔥</span>
                                                    <span style={{ fontFamily: "'Caveat', cursive", fontSize: 13, color: 'rgba(58,48,40,0.5)' }}>React</span>
                                                  </button>
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </motion.div>
                                      </motion.div>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}

                      {/* Journey start — bottom */}
                      <div className="relative flex items-center gap-3" style={{ padding: '16px 20px 24px 20px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(138,120,90,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>🌱</div>
                        <div>
                          <p style={{ fontFamily: "'Caveat', cursive", fontSize: 16, fontWeight: 700, color: 'rgba(58,48,40,0.35)' }}>
                            Journey begins here
                          </p>
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 400, color: 'rgba(58,48,40,0.2)', marginTop: 1 }}>
                            Day 1 of your transformation
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Bottom action row */}
            <div className="shrink-0 flex items-center justify-center gap-3 px-4 z-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)', paddingTop: 8, background: 'linear-gradient(to top, #EDE7DA 60%, transparent)' }}>
              {/* Nudge button — shown for other users' profiles */}
              {!isOwnProfile && !current.isPlaceholder && (
                <div className="relative">
                  {nudgeCount > 0 && (
                    <motion.span
                      key={nudgeCount}
                      initial={{ scale: 0, y: 20, opacity: 0, rotate: nudgeRotation }}
                      animate={nudgeNumberBehind
                        ? { scale: 0.5, y: 10, opacity: 0 }
                        : { scale: 1, y: 0, opacity: 1 }
                      }
                      transition={nudgeNumberBehind
                        ? { duration: 0.3, ease: 'easeIn' }
                        : { type: 'spring', stiffness: 400, damping: 12 }
                      }
                      className="absolute pointer-events-none"
                      style={{
                        top: -22, left: 14,
                        zIndex: nudgeNumberBehind ? 0 : 60,
                        fontSize: nudgeCount >= 10 ? 28 : 34,
                        fontWeight: 900, fontStyle: 'normal',
                        color: '#3A3028',
                        WebkitTextStroke: '3px #F5F0E8',
                        paintOrder: 'stroke fill',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        lineHeight: 1,
                        fontFamily: "'Caveat', cursive",
                        rotate: nudgeRotation,
                      }}
                    >
                      x{nudgeCount}
                    </motion.span>
                  )}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setNudgeBellAnim(true);
                      setNudgeNumberBehind(false);
                      setNudgeRotation(Math.floor(Math.random() * 31) - 15);
                      setNudgeCount(prev => prev + 1);
                      try {
                        if (nudgeAudioRef.current) {
                          nudgeAudioRef.current.currentTime = 0;
                          nudgeAudioRef.current.play().catch(() => {});
                        }
                      } catch {}
                      if (nudgeHideTimerRef.current) clearTimeout(nudgeHideTimerRef.current);
                      nudgeHideTimerRef.current = setTimeout(() => setNudgeNumberBehind(true), 750);
                      if (user && targetUserId) {
                        await supabase.from('nudges').insert({ from_user_id: user.id, to_user_id: targetUserId });
                      }
                    }}
                    className="active:scale-[0.95] transition-transform"
                    style={{
                      height: 52, borderRadius: 26, paddingLeft: 18, paddingRight: 24,
                      background: 'rgba(138,120,90,0.08)',
                      border: '1px solid rgba(138,120,90,0.2)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-3 h-full">
                      <motion.img
                        src={deskBellImg}
                        alt="bell"
                        className="w-9 h-9 object-contain"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))', transformOrigin: 'bottom center' }}
                        animate={nudgeBellAnim ? { rotate: [0, -25, 20, -15, 10, -5, 0], scale: [1, 1.2, 1.15, 1.1, 1.05, 1] } : {}}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                        onAnimationComplete={() => setNudgeBellAnim(false)}
                      />
                      <span style={{ color: 'rgba(58,48,40,0.7)', fontSize: 14, fontWeight: 500 }}>Nudge to log activity</span>
                    </div>
                  </button>
                </div>
              )}

              {isOwnProfile && !hasLoggedToday && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); onLogActivity?.(); }}
                  className="shrink-0 active:scale-95 transition-transform"
                  style={{
                    width: 42, height: 42, borderRadius: 21,
                    background: 'rgba(138,120,90,0.08)',
                    border: '1px solid rgba(138,120,90,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <span className="text-base leading-none">➕</span>
                </button>
              )}

              {canShare && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowShareOptions(true); }}
                  className="shrink-0 active:scale-95 transition-transform"
                  style={{
                    width: 42, height: 42, borderRadius: 21,
                    background: 'rgba(138,120,90,0.08)',
                    border: '1px solid rgba(138,120,90,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Share2 className="w-[16px] h-[16px]" style={{ color: 'rgba(58,48,40,0.6)' }} strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>

          {/* Sheets */}
          {showReactsSheet && createPortal(
            <div style={{ position: 'relative', zIndex: 70 }}>
              <ReactsSoFarSheet activityId={current.id} total={currentReactions.total} reactions={currentReactions.reactions} reactorProfiles={currentReactions.reactorProfiles} onClose={() => setShowReactsSheet(false)} />
            </div>, document.body
          )}

          {showSendReactionSheet && createPortal(
            <div style={{ position: 'relative', zIndex: 70 }}>
              <SendReactionSheet
                activityId={current.id} currentUserId={user?.id} activityType={current.activity || undefined}
                onReact={handleReact} onClose={() => setShowSendReactionSheet(false)}
                onViewReactions={() => { setShowSendReactionSheet(false); setShowReactsSheet(true); }}
                onReactionRemoved={(reactionType) => {
                  setLocalReactions(prev => {
                    const curr = prev[current.id]; if (!curr) return prev;
                    const existing = curr.reactions[reactionType];
                    const newCount = Math.max((existing?.count || 0) - 1, 0);
                    return { ...prev, [current.id]: { ...curr, total: Math.max(curr.total - 1, 0), reactions: { ...curr.reactions, [reactionType]: { count: newCount, reacted: newCount > 0 } }, reactorProfiles: curr.reactorProfiles.filter(r => !(r.userId === user?.id && r.reactionType === reactionType)) } };
                  });
                }}
                totalReactions={currentReactions.total} reactorProfiles={currentReactions.reactorProfiles}
              />
            </div>, document.body
          )}

          {/* Share Options */}
          {createPortal(
            <AnimatePresence>
              {showShareOptions && (
                <>
                  <motion.div className="fixed inset-0" style={{ zIndex: 90, background: 'rgba(0,0,0,0.5)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowShareOptions(false)} />
                  <motion.div
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] rounded-3xl p-5 flex flex-col gap-3"
                    style={{
                      zIndex: 91, background: 'linear-gradient(180deg, rgba(60, 55, 70, 0.92) 0%, rgba(40, 38, 50, 0.95) 100%)',
                      backdropFilter: 'blur(60px) saturate(200%)', WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                      border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
                    }}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <h3 className="text-white font-semibold text-base text-center mb-1">Share via</h3>
                    <button onClick={() => { setShowShareOptions(false); shareToChannel('whatsapp'); }} className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white/90 active:scale-[0.97] transition-transform flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <MessageCircle className="w-5 h-5 text-green-400" /> WhatsApp
                    </button>
                    <button onClick={() => { setShowShareOptions(false); shareToChannel('instagram'); }} className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white/90 active:scale-[0.97] transition-transform flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <Share2 className="w-5 h-5 text-pink-400" /> Instagram
                    </button>
                    <button onClick={() => { setShowShareOptions(false); shareToChannel('messages'); }} className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white/90 active:scale-[0.97] transition-transform flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <MessageCircle className="w-5 h-5 text-blue-400" /> Messages
                    </button>
                    <button onClick={() => setShowShareOptions(false)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white/50 active:scale-[0.97] transition-transform mt-1">Cancel</button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>, document.body
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const editSheet = (
    <MediaSourceSheet isOpen={showEditSheet} onClose={() => setShowEditSheet(false)} dayNumber={current.dayNumber} activity={current.activity} preserveActivity={true} zIndex={80} />
  );

  return (
    <>
      {createPortal(overlay, portalContainer)}
      {showEditSheet && editSheet}
    </>
  );
});

export default ActivityGalleryOverlay;
