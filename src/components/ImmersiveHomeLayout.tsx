import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import { useProfile } from '@/hooks/use-profile';
import ProfileAvatar from '@/components/ProfileAvatar';
import CircularProgressRing from '@/components/CircularProgressRing';
import MediaSourceSheet from '@/components/MediaSourceSheet';
import DayCardSheet from '@/components/DayCardSheet';
import TagembedWidget from '@/components/TagembedWidget';
import NotificationCenter from '@/components/NotificationCenter';
import type { PillState } from '@/components/ReelProgressPill';

interface Photo {
  id: string;
  storageUrl: string;
  originalUrl?: string;
  isVideo?: boolean;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';
  duration?: string;
  pr?: string;
  dayNumber: number;
}

interface ImmersiveHomeLayoutProps {
  photos: Photo[];
  onAddPhoto: () => void;
  onOpenCamera: () => void;
  currentDate: string;
  onGenerateReel?: (photos: Photo[]) => void;
  onRemovePhoto?: (photoId: string) => void;
  onEditPhoto?: (photo: Photo) => void;
  isGenerating?: boolean;
  isUploading?: boolean;
  weekTransitionAnimation?: boolean;
  reelPill?: {
    weekNumber: number;
    state: PillState;
    progress: number;
    totalReactions?: number;
    onPlay?: () => void;
    isActivelyGenerating?: boolean;
  } | null;
  onWeekReelTap?: (weekNumber: number) => void;
  cachedWeeks?: Set<number>;
}

// Day theme names per day slot
const DAY_THEMES = [
  'begin...', 'push...', 'rise',
  'grind...', 'level up', 'commit',
  'stretch', 'burn...', 'endure',
  'peak...', 'master', 'legend',
];

const ImmersiveHomeLayout = ({
  photos,
  onAddPhoto,
  onOpenCamera,
  onGenerateReel,
  reelPill = null,
  onWeekReelTap,
  cachedWeeks = new Set(),
}: ImmersiveHomeLayoutProps) => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [showMediaSheet, setShowMediaSheet] = useState(false);
  // NotificationCenter manages its own open state internally

  // Day card sheet state
  const [daySheetOpen, setDaySheetOpen] = useState(false);
  const [daySheetPhoto, setDaySheetPhoto] = useState<Photo | null>(null);
  const [daySheetDayNumber, setDaySheetDayNumber] = useState(1);
  const [daySheetLayoutId, setDaySheetLayoutId] = useState('');

  const firstName = profile?.display_name?.split(' ')[0] || 'there';
  const completedCount = photos.length; // 0-12
  const currentWeek = Math.min(Math.floor(completedCount / 3) + 1, 4);
  const photosInWeek = completedCount % 3;
  const remaining = photosInWeek === 0 && completedCount > 0 ? 0 : 3 - photosInWeek;
  const nextDayNumber = Math.min(completedCount + 1, 12);

  const openDaySheet = (photo: Photo | null, dayNum: number, layoutId: string) => {
    triggerHaptic('medium');
    setDaySheetPhoto(photo);
    setDaySheetDayNumber(dayNum);
    setDaySheetLayoutId(layoutId);
    setDaySheetOpen(true);
  };

  const handleDayCardTap = (dayNum: number) => {
    const photo = photos.find(p => p.dayNumber === dayNum);
    if (photo) {
      // View existing activity
      openDaySheet(photo, dayNum, `day-card-${photo.id}`);
    } else if (dayNum === nextDayNumber) {
      // Unlock and log new activity
      triggerHaptic('medium');
      setShowMediaSheet(true);
    }
  };

  // Motivational greeting
  const greeting = completedCount === 0
    ? `Hey ${firstName}! 👋`
    : remaining === 0
      ? `Great week, ${firstName}! 🔥`
      : `Nice one, ${firstName}! 💪`;

  const subtext = completedCount === 0
    ? 'Tap + to log your first workout.'
    : remaining === 0
      ? 'Week complete — reel time!'
      : `${remaining} more to complete this week.`;

  // Build exactly 3 day cards for the current week display
  const weekStart = (currentWeek - 1) * 3; // 0-indexed start of current week
  const currentWeekCards = Array.from({ length: 3 }, (_, i) => {
    const dayNum = weekStart + i + 1; // 1-indexed
    const photo = photos.find(p => p.dayNumber === dayNum);
    const isCompleted = !!photo;
    const isNext = dayNum === nextDayNumber && completedCount < 12;
    const isLocked = !isCompleted && !isNext;
    return { dayNum, photo, isCompleted, isNext, isLocked };
  });

  return (
    <div
      className="relative flex flex-col"
      style={{
        minHeight: '100dvh',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 40%, #1a1a2e 100%)',
      }}
    >
      {/* Subtle top glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(80, 60, 160, 0.18) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        {/* ── TOP BAR ── */}
        <div
          className="flex items-center justify-between px-5"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 16px) + 16px)' }}
        >
          {/* Avatar */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('/profile-setup', { state: { isEditing: true } })}
            className="rounded-full"
            style={{
              boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
              border: '2px solid rgba(255,255,255,0.15)',
            }}
          >
            <ProfileAvatar
              src={profile?.avatar_url}
              name={profile?.display_name}
              size={42}
            />
          </motion.button>

          {/* Bell — NotificationCenter manages its own open state */}
          <NotificationCenter />
        </div>

        {/* ── HERO: RING + MASCOT ── */}
        <div className="flex justify-center mt-6">
          <CircularProgressRing
            currentDay={completedCount}
            currentWeek={currentWeek > 4 ? 4 : currentWeek}
          />
        </div>

        {/* ── MOTIVATIONAL TEXT ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center px-6 mt-6"
        >
          <h2
            className="text-white font-bold"
            style={{ fontSize: 'clamp(24px, 6.5vw, 30px)', letterSpacing: '-0.3px' }}
          >
            {greeting}
          </h2>
          <p
            className="mt-1"
            style={{
              fontSize: 'clamp(17px, 4.5vw, 21px)',
              color: 'rgba(160,150,200,0.85)',
              fontWeight: 500,
            }}
          >
            {subtext}
          </p>
        </motion.div>

        {/* ── DAY CARDS ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-8 px-5 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
            {currentWeekCards.map(({ dayNum, photo, isCompleted, isNext, isLocked }, idx) => {
              const theme = DAY_THEMES[dayNum - 1] || 'go...';
              const isActive = isNext; // The next-to-log card is "active" styled

              return (
                <motion.button
                  key={dayNum}
                  initial={{ opacity: 0, scale: 0.88, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.08, type: 'spring', stiffness: 280, damping: 20 }}
                  whileTap={!isLocked ? { scale: 0.96 } : {}}
                  onClick={() => handleDayCardTap(dayNum)}
                  disabled={isLocked}
                  className="relative flex flex-col items-center justify-between rounded-2xl"
                  style={{
                    width: 130,
                    height: 165,
                    padding: '14px 10px',
                    background: isCompleted
                      ? 'rgba(15,228,152,0.08)'
                      : isActive
                        ? 'rgba(15,228,152,0.06)'
                        : 'rgba(255,255,255,0.04)',
                    border: isCompleted || isActive
                      ? '1.5px solid rgba(15,228,152,0.55)'
                      : '1.5px solid rgba(255,255,255,0.08)',
                    boxShadow: isActive
                      ? '0 0 24px rgba(15,228,152,0.18), inset 0 1px 0 rgba(255,255,255,0.06)'
                      : isCompleted
                        ? '0 0 16px rgba(15,228,152,0.12)'
                        : 'none',
                  }}
                >
                  {/* Day label top */}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      fontStyle: 'italic',
                      color: isCompleted || isActive
                        ? 'rgba(15,228,152,0.9)'
                        : 'rgba(180,170,210,0.5)',
                      letterSpacing: '0.01em',
                    }}
                  >
                    day {dayNum}
                  </span>

                  {/* Center icon */}
                  {isCompleted ? (
                    // Show thumbnail of the completed activity
                    <div
                      className="relative rounded-xl overflow-hidden"
                      style={{ width: 72, height: 72 }}
                    >
                      {photo && (
                        <img
                          src={photo.storageUrl}
                          alt={photo.activity || ''}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'rgba(15,228,152,0.25)' }}
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(15,228,152,0.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </div>
                  ) : isActive ? (
                    // Upload button
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: 64,
                        height: 64,
                        background: 'rgba(15,228,152,0.18)',
                        border: '2px solid rgba(15,228,152,0.6)',
                        boxShadow: '0 0 20px rgba(15,228,152,0.25)',
                      }}
                    >
                      <Upload
                        style={{ color: 'rgba(15,228,152,0.95)', width: 26, height: 26, strokeWidth: 2 }}
                      />
                    </div>
                  ) : (
                    // Locked
                    <div
                      className="flex items-center justify-center"
                      style={{ width: 64, height: 64 }}
                    >
                      <Lock
                        style={{ color: 'rgba(180,170,210,0.3)', width: 28, height: 28, strokeWidth: 1.5 }}
                      />
                    </div>
                  )}

                  {/* Theme label bottom */}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      fontStyle: 'italic',
                      color: isCompleted || isActive
                        ? 'rgba(15,228,152,0.8)'
                        : 'rgba(180,170,210,0.4)',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {isCompleted ? photo?.activity || theme : theme}
                  </span>
                </motion.button>
              );
            })}

            {/* Peek of next week / future card */}
            {completedCount < 12 && (
              <div
                className="rounded-2xl opacity-30 flex-shrink-0"
                style={{
                  width: 40,
                  height: 165,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1.5px solid rgba(255,255,255,0.06)',
                  alignSelf: 'center',
                }}
              />
            )}
          </div>
        </motion.div>

        {/* ── WALL OF NINJA'S ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 px-5 pb-32"
        >
          <h2
            className="text-white font-bold mb-4"
            style={{ fontSize: 22, letterSpacing: '-0.2px' }}
          >
            Wall of Ninja's
          </h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <TagembedWidget />
          </div>
        </motion.div>
      </div>

      {/* ── MEDIA SOURCE SHEET ── */}
      <MediaSourceSheet
        isOpen={showMediaSheet}
        onClose={() => setShowMediaSheet(false)}
        dayNumber={nextDayNumber}
      />

      {/* ── DAY CARD SHEET ── */}
      <DayCardSheet
        isOpen={daySheetOpen}
        photo={daySheetPhoto}
        dayNumber={daySheetDayNumber}
        layoutId={daySheetLayoutId}
        onClose={() => setDaySheetOpen(false)}
        onCamera={() => { setDaySheetOpen(false); setShowMediaSheet(true); }}
        onGallery={() => { setDaySheetOpen(false); setShowMediaSheet(true); }}
        onViewActivity={(photo) => {
          navigate('/reel', { state: { activityId: photo.id, dayNumber: photo.dayNumber } });
        }}
      />

    </div>
  );
};

export default ImmersiveHomeLayout;
