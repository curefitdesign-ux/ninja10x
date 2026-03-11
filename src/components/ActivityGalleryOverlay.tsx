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
import DynamicBlurBackground from '@/components/DynamicBlurBackground';
import ReactsSoFarSheet from '@/components/ReactsSoFarSheet';
import ProfileAvatar from '@/components/ProfileAvatar';
import Floating3DEmojis from '@/components/Floating3DEmojis';
import StoryEmojiRain from '@/components/StoryEmojiRain';
import { isVideoUrl } from '@/lib/media';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import fireEmoji from '@/assets/reactions/fire-3d.png';
import clapEmoji from '@/assets/reactions/clap-3d.png';
import paperclipImg from '@/assets/frames/paperclip-silver.png';
import deskBellImg from '@/assets/icons/desk-bell-3d.png';

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
  const [nudgeBellAnim, setNudgeBellAnim] = useState(false);
  const [nudgeCount, setNudgeCount] = useState(0);
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

  const userDescription = useMemo((): { diary: string; varietyLine: string; durationLine: string; count: number } | null => {
    if (!userProfile || activities.length === 0) return null;
    const realActivities = activities.filter(a => !a.isPlaceholder && a.dayNumber < 1001);
    if (realActivities.length === 0) return null;
    let totalDurationMins = 0;
    const activityCounts: Record<string, number> = {};
    for (const a of realActivities) {
      if (a.duration) {
        const minMatch = a.duration.match(/(\d+)\s*min/i);
        const hrMatch = a.duration.match(/(\d+)\s*h/i);
        if (minMatch) totalDurationMins += parseInt(minMatch[1]);
        if (hrMatch) totalDurationMins += parseInt(hrMatch[1]) * 60;
      }
      const type = a.activity || 'workout';
      activityCounts[type] = (activityCounts[type] || 0) + 1;
    }
    const count = realActivities.length;
    const name = userProfile.displayName?.split(' ')[0] || 'This one';
    let durationStr = '';
    if (totalDurationMins > 0) {
      const hrs = Math.floor(totalDurationMins / 60);
      const mins = totalDurationMins % 60;
      durationStr = hrs > 0 ? (mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`) : `${mins} min`;
    }
    const sorted = Object.entries(activityCounts).sort((a, b) => b[1] - a[1]);
    const topActivity = sorted[0]?.[0]?.toLowerCase() || 'working out';
    const variety = sorted.length;
    const parts: string[] = [];
    if (count >= 12) parts.push(`🏆 ${name} crushed all 12 days!`);
    else if (count >= 9) parts.push(`🔥 ${name}'s on fire, almost there!`);
    else if (count >= 6) parts.push(`💪 Halfway beast mode.`);
    else if (count >= 3) parts.push(`⚡ ${name}'s building momentum.`);
    else parts.push(`🚀 ${name} just started the journey!`);
    let varietyLine = '';
    if (variety >= 3) {
      const top3 = sorted.slice(0, 3).map(([k]) => k.toLowerCase());
      varietyLine = `Mixing it up with ${top3.join(', ')} & more ✨`;
    } else if (variety === 2) {
      varietyLine = `Loves ${sorted[0][0].toLowerCase()} & ${sorted[1][0].toLowerCase()} 🎯`;
    } else if (count > 1) {
      varietyLine = `All-in on ${topActivity} 🎯`;
    }
    const mainLine = parts.join(' · ');
    const durationLine = durationStr ? `⏱️ ${durationStr} of pure grind so far` : '';
    return { diary: mainLine, varietyLine, durationLine, count };
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
        <DynamicBlurBackground imageUrl={mediaUrl}>
          <div className="absolute inset-0 flex flex-col" style={{ overflow: 'hidden' }}>
            {/* TOP HEADER — collapses on scroll */}
            <div
              className="shrink-0 z-50"
              style={{
                paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)',
                background: isScrolled ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                backdropFilter: isScrolled ? 'blur(60px) saturate(200%)' : 'none',
                WebkitBackdropFilter: isScrolled ? 'blur(60px) saturate(200%)' : 'none',
                borderBottom: isScrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                boxShadow: isScrolled ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 -1px 0 rgba(255,255,255,0.05)' : 'none',
                transition: 'all 0.3s ease',
                ...(isScrolled ? {
                  maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                } : {}),
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
                      <div className="rounded-full overflow-hidden" style={{ width: 32, height: 32, border: '1.5px solid rgba(255,255,255,0.25)' }}>
                        <ProfileAvatar src={userProfile.avatarUrl} name={userProfile.displayName} size={32} />
                      </div>
                      <div>
                        <h2 className="text-white font-bold truncate" style={{ fontSize: 14, letterSpacing: '-0.02em', maxWidth: 160 }}>{userProfile.displayName}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-white/40 text-[10px] font-medium">{totalActivities}/12 Days</span>
                          {totalDurationStr && <span className="text-white/30 text-[10px]">·</span>}
                          {totalDurationStr && <span className="text-white/40 text-[10px] font-medium">{totalDurationStr}</span>}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      className="w-8 h-8 flex items-center justify-center rounded-full active:scale-90"
                      style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}
                      onClick={onClose} whileTap={{ scale: 0.85 }}
                    >
                      <X className="w-4 h-4 text-white/80" />
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
                      style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}
                      onClick={onClose} whileTap={{ scale: 0.85 }}
                    >
                      <X className="w-5 h-5 text-white/80" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FULL PROFILE — only when not scrolled */}
            <AnimatePresence>
              {!isScrolled && userProfile && (
                <motion.div
                  className="shrink-0 flex flex-col items-center z-40 px-4 pb-2"
                  initial={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, paddingBottom: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="rounded-full overflow-hidden" style={{ width: 56, height: 56, border: '2.5px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                    <ProfileAvatar src={userProfile.avatarUrl} name={userProfile.displayName} size={56} />
                  </div>
                  <h2 className="text-white font-bold text-center mt-1.5 px-6 truncate w-full" style={{ fontSize: 18, letterSpacing: '-0.02em' }}>{userProfile.displayName}</h2>
                  {userDescription && (
                    <p className="text-white/50 text-[13px] text-center mt-1.5 px-6 leading-relaxed" style={{ maxWidth: 300 }}>
                      {userDescription.diary}{userDescription.varietyLine ? ` ${userDescription.varietyLine}` : ''}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="rounded-full px-3 py-1" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <span className="text-white text-[11px] font-semibold">{totalActivities}/12 Days</span>
                    </div>
                    {totalDurationStr && (
                      <div className="rounded-full px-3 py-1" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                        <span className="text-white text-[11px] font-semibold">{totalDurationStr} Total</span>
                      </div>
                    )}
                    <div className="rounded-full px-3 py-1" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <span className="text-white text-[11px] font-semibold">W{week}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SCRAPBOOK TIMELINE */}
            <div
              ref={scrollRef}
              className="flex-1 min-h-0 z-30 overflow-y-auto overflow-x-hidden"
              style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: 120, paddingTop: 8 }}
              onScroll={(e) => {
                const scrollTop = (e.target as HTMLDivElement).scrollTop;
                setIsScrolled(scrollTop > 30);
              }}
            >
              <div className="relative" style={{ minHeight: '100%' }}>
                {/* Notebook lines */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 38px, rgba(255,255,255,0.03) 38px, rgba(255,255,255,0.03) 39px)',
                  backgroundPosition: '0 20px',
                }} />
                {/* Curved timeline SVG */}
                <svg className="absolute pointer-events-none" style={{ left: 0, top: 0, width: 60, height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
                  <path
                    d="M 29 0 C 45 80, 12 160, 29 240 C 46 320, 12 400, 29 480 C 46 560, 12 640, 29 720 C 46 800, 12 880, 29 960 C 46 1040, 12 1120, 29 1200 C 46 1280, 12 1360, 29 1440 C 46 1520, 12 1600, 29 1680 C 46 1760, 12 1840, 29 1920 C 46 2000, 12 2080, 29 2160 C 46 2240, 12 2320, 29 2400 C 46 2480, 12 2560, 29 2640 C 46 2720, 12 2800, 29 2880 C 46 2960, 12 3040, 29 3120 C 46 3200, 12 3280, 29 3360 C 46 3440, 12 3520, 29 3600 C 46 3680, 12 3760, 29 3840 C 46 3920, 12 4000, 29 4080"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    fill="none"
                  />
                </svg>

                {(() => {
                  const sortedActivities = [...activities].filter(a => !a.isPlaceholder);
                  const getCardStyle = (index: number, dayNumber: number) => {
                    const seed = dayNumber * 7 + index * 13;
                    return { rotation: ((seed % 11) - 5) * 1.2, offsetX: ((seed * 3) % 7) - 2, decorType: seed % 5 };
                  };
                  const handDates = ['just now ✨','yesterday','a few days ago','last week','feeling strong 💪','what a session!','crushed it 🔥','new PR day','getting better','consistency > all','momentum building','unstoppable 🚀'];
                  const handQuotes = ['→ keep showing up!','↓ the grind continues...','★ proud of this one','~ good vibes only','✓ done & dusted','♡ self care day'];

                  return sortedActivities.map((act, idx) => {
                    const { rotation, offsetX, decorType } = getCardStyle(idx, act.dayNumber);
                    const wk = Math.ceil(act.dayNumber / 3);
                    const dw = ((act.dayNumber - 1) % 3) + 1;
                    const isSelected = act.id === current.id;
                    const handDate = handDates[act.dayNumber - 1] || handDates[idx % handDates.length];
                    const handQuote = handQuotes[idx % handQuotes.length];

                    return (
                      <motion.div
                        key={act.id} className="relative"
                        style={{ padding: '12px 16px 12px 48px', marginBottom: idx < sortedActivities.length - 1 ? 16 : 0 }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
                      >
                        {/* Timeline dot */}
                        <div className="absolute rounded-full" style={{
                          left: 22, top: 28, width: 14, height: 14,
                          background: isSelected ? 'linear-gradient(135deg, #34D399, #10B981)' : 'rgba(255,255,255,0.15)',
                          border: `2px solid ${isSelected ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          boxShadow: isSelected ? '0 0 12px rgba(52,211,153,0.4)' : 'none', zIndex: 5,
                        }} />

                        {/* Handwritten date */}
                        <p style={{ fontFamily: "'Caveat', cursive", fontSize: 18, color: 'rgba(255,255,255,0.45)', marginBottom: 6, transform: `rotate(${rotation * 0.3}deg)`, marginLeft: offsetX }}>
                          W{wk} · Day {dw} — <span style={{ color: 'rgba(255,255,255,0.3)' }}>{handDate}</span>
                        </p>

                        {/* Card */}
                        <motion.div
                          className="relative overflow-visible cursor-pointer"
                          style={{
                            width: '55%', aspectRatio: '9/16', borderRadius: 6,
                            transform: `rotate(${rotation}deg) translateX(${offsetX}px)`,
                            marginLeft: idx % 2 === 0 ? '0%' : '12%',
                          }}
                          onClick={() => { const ri = activities.findIndex(a => a.id === act.id); if (ri >= 0) setCurrentIndex(ri); }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 6 }}>
                            {act.frame ? (
                              <StoryFrameRenderer imageUrl={act.originalUrl || act.storageUrl} isVideo={act.isVideo} activity={act.activity} frame={act.frame} duration={act.duration} pr={act.pr} dayNumber={act.dayNumber} />
                            ) : act.isVideo ? (
                              <video src={act.originalUrl || act.storageUrl} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
                            ) : (
                              <img src={act.originalUrl || act.storageUrl} alt={`Day ${act.dayNumber}`} className="absolute inset-0 w-full h-full object-cover" />
                            )}
                          </div>

                          

                          {/* Paperclip */}
                          {decorType === 0 && (
                            <img src={paperclipImg} alt="" className="absolute pointer-events-none" style={{
                              width: 32, height: 'auto', top: -8, right: 16,
                              transform: `rotate(${15 + rotation}deg)`, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))', opacity: 0.85,
                            }} />
                          )}
                          {/* Tape */}
                          {decorType === 3 && (
                            <div className="absolute pointer-events-none" style={{
                              width: 52, height: 18, top: -6, left: '30%',
                              background: 'rgba(255, 230, 180, 0.35)', transform: `rotate(${-3 + rotation * 0.5}deg)`, borderRadius: 2, backdropFilter: 'blur(2px)',
                            }} />
                          )}
                          {/* Activity sticker */}
                          {act.activity && decorType !== 4 && (
                            <div className="absolute pointer-events-none" style={{
                              bottom: -12, right: -8, background: 'rgba(255,255,255,0.1)',
                              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '4px 10px',
                              transform: `rotate(${-rotation * 0.5}deg)`,
                            }}>
                              <span style={{ fontFamily: "'Caveat', cursive", fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>{act.activity}</span>
                            </div>
                          )}
                          {/* Like count badge + react button */}
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
                                    color: 'rgba(255,255,255,0.55)',
                                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                                  }}>
                                    {total} ❤️
                                  </span>
                                )}
                                {!isOwnProfile && (
                                  <button
                                    className="flex items-center gap-0.5 active:scale-90 transition-transform"
                                    style={{
                                      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)',
                                      borderRadius: 14, padding: '3px 8px',
                                      border: '1px solid rgba(255,255,255,0.12)',
                                    }}
                                    onClick={(e) => { e.stopPropagation(); setCardReactId(act.id); setCurrentIndex(activities.findIndex(a => a.id === act.id)); setShowSendReactionSheet(true); }}
                                  >
                                    <span style={{ fontSize: 12 }}>🔥</span>
                                    <span style={{ fontFamily: "'Caveat', cursive", fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>React</span>
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </motion.div>

                        {/* Quote */}
                        {(decorType === 2 || decorType === 1) && (
                          <p style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color: 'rgba(255,255,255,0.3)', marginTop: 6, marginLeft: idx % 2 === 0 ? '60%' : '5%', transform: `rotate(${-rotation * 0.8}deg)` }}>{handQuote}</p>
                        )}
                        {/* Arrow */}
                        {idx < sortedActivities.length - 1 && decorType !== 4 && (
                          <svg className="absolute pointer-events-none" style={{ left: 20 + offsetX, bottom: -20, width: 24, height: 28, opacity: 0.2 }} viewBox="0 0 24 28" fill="none">
                            <path d="M12 2 C12 2 10 14 12 20 C13 14 15 18 12 20 M8 16 L12 24 L16 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                        )}
                      </motion.div>
                    );
                  });
                })()}

                {/* Journey start */}
                <div className="relative" style={{ padding: '16px 16px 24px 48px' }}>
                  <div className="absolute rounded-full" style={{ left: 24, top: 24, width: 10, height: 10, background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.1)' }} />
                  <p style={{ fontFamily: "'Caveat', cursive", fontSize: 21, color: 'rgba(255,255,255,0.2)', transform: 'rotate(-1deg)' }}>
                    the journey begins here... 🌱
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom action row */}
            <div className="shrink-0 flex items-center justify-center gap-3 px-4 z-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)', paddingTop: 8 }}>
              {/* Nudge button — shown for other users' profiles */}
              {!isOwnProfile && !current.isPlaceholder && (
                <div className="relative">
                  {/* Counter sitting on top of button */}
                  {nudgeCount > 0 && (
                    <motion.span
                      key={nudgeCount}
                      initial={{ scale: 0, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      className="absolute pointer-events-none"
                      style={{
                        top: -20,
                        left: 16,
                        zIndex: 60,
                        fontSize: nudgeCount >= 10 ? 24 : 28,
                        fontWeight: 900,
                        fontStyle: 'italic',
                        color: '#000',
                        WebkitTextStroke: '2.5px #fff',
                        paintOrder: 'stroke fill',
                        textShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        lineHeight: 1,
                        fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
                      }}
                    >
                      x{nudgeCount}
                    </motion.span>
                  )}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setNudgeBellAnim(true);
                      setNudgeCount(prev => prev + 1);
                      try {
                        const audio = new Audio('/sounds/nudge-bell.mp3');
                        audio.volume = 0.7;
                        audio.play().catch(() => {});
                      } catch {}
                      if (user && targetUserId) {
                        await supabase.from('nudges').insert({ from_user_id: user.id, to_user_id: targetUserId });
                      }
                    }}
                    className="active:scale-[0.95] transition-transform"
                    style={{
                      height: 52, borderRadius: 26, paddingLeft: 18, paddingRight: 24,
                      background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div className="flex items-center gap-3 h-full">
                      <motion.img
                        src={deskBellImg}
                        alt="bell"
                        className="w-9 h-9 object-contain"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))', transformOrigin: 'bottom center' }}
                        animate={nudgeBellAnim ? { rotate: [0, -25, 20, -15, 10, -5, 0], scale: [1, 1.2, 1.15, 1.1, 1.05, 1] } : {}}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                        onAnimationComplete={() => setNudgeBellAnim(false)}
                      />
                      <span className="text-white/80 text-sm font-medium">Nudge to log activity</span>
                    </div>
                  </button>
                </div>
              )}

              {/* Log activity for own profile */}
              {isOwnProfile && !hasLoggedToday && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); onLogActivity?.(); }}
                  className="shrink-0 active:scale-95 transition-transform"
                  style={{
                    width: 42, height: 42, borderRadius: 21,
                    background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.06)', boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
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
                    background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.06)', boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Share2 className="w-[16px] h-[16px] text-white/70" strokeWidth={1.5} />
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
        </DynamicBlurBackground>
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
