import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import { useProfile } from '@/hooks/use-profile';
import { useMorphTransition } from '@/hooks/use-morph-transition';
import ProfileAvatar from '@/components/ProfileAvatar';
import CircularProgressRing from '@/components/CircularProgressRing';
import ReelProgressPill, { type PillState } from '@/components/ReelProgressPill';
import MediaSourceSheet from '@/components/MediaSourceSheet';
import DayCardSheet from '@/components/DayCardSheet';

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
  createdAt?: string;
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

const isVideoUrl = (url: string) => {
  return url.startsWith('data:video') || /\.(mp4|webm|mov|avi)$/i.test(url);
};

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
  const { triggerMorph } = useMorphTransition();
  const [showMediaSheet, setShowMediaSheet] = useState(false);
  const todayCardRef = useRef<HTMLButtonElement>(null);

  // Day card sheet state
  const [daySheetOpen, setDaySheetOpen] = useState(false);
  const [daySheetPhoto, setDaySheetPhoto] = useState<Photo | null>(null);
  const [daySheetDayNumber, setDaySheetDayNumber] = useState(1);
  const [daySheetLayoutId, setDaySheetLayoutId] = useState('');

  const firstName = profile?.display_name?.split(' ')[0] || 'there';
  const completedWeeks = Math.floor(photos.length / 3);
  const currentWeek = completedWeeks + 1;
  const photosInWeek = photos.length % 3;
  const remaining = photosInWeek === 0 && photos.length > 0 ? 0 : 3 - photosInWeek;

  // Only show today's activity — no past activities on home
  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  const loggedToday = latestPhoto?.createdAt
    ? new Date(latestPhoto.createdAt).toDateString() === new Date().toDateString()
    : false;
  const todayPhoto = loggedToday ? latestPhoto : null;

  const openDaySheet = (photo: Photo | null, dayNum: number, layoutId: string) => {
    triggerHaptic('medium');
    setDaySheetPhoto(photo);
    setDaySheetDayNumber(dayNum);
    setDaySheetLayoutId(layoutId);
    setDaySheetOpen(true);
  };

  const handlePhotoTap = (photo: Photo) => {
    openDaySheet(photo, photo.dayNumber, `day-card-${photo.id}`);
  };

  // Get pill data for the current completed week
  const getFocusedPill = () => {
    const targetWeek = completedWeeks > 0 ? completedWeeks : null;
    if (!targetWeek) return null;

    const isCached = cachedWeeks.has(targetWeek);
    const state: PillState = isCached ? 'complete' : 'idle';

    return {
      weekNumber: targetWeek,
      state,
      progress: 0,
      totalReactions: 0,
      onPlay: () => onWeekReelTap?.(targetWeek),
      isActivelyGenerating: false,
    };
  };

  const activePill = getFocusedPill() || reelPill;

  return (
    <div className="relative flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* Deep purple gradient background */}
      <div
        className="fixed inset-0"
        style={{
          background: 'linear-gradient(180deg, #2a1b4e 0%, #1e1245 25%, #160d3a 50%, #0f0a2e 75%, #0a0720 100%)',
        }}
      />

      {/* Subtle radial glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 35%, rgba(120, 80, 200, 0.2) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-5"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 12px)' }}
        >
          <div className="w-11 h-11" /> {/* spacer */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/profile-setup', { state: { isEditing: true } })}
            className="rounded-full"
            style={{
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              border: '2px solid rgba(255,255,255,0.15)',
            }}
          >
            <ProfileAvatar
              src={profile?.avatar_url}
              name={profile?.display_name}
              size={44}
            />
          </motion.button>
        </div>

        {/* Hero area - ring + mascot */}
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          {/* Circular progress ring with mascot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <CircularProgressRing
              currentDay={photos.length}
              currentWeek={currentWeek > 4 ? 4 : currentWeek}
              onMascotTap={() => {
                triggerHaptic('medium');
                setShowMediaSheet(true);
              }}
            />
          </motion.div>

          {/* Motivational text */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 text-center px-6"
          >
            <h2
              className="text-white font-bold leading-tight"
              style={{
                fontSize: 'clamp(22px, 6vw, 28px)',
                textShadow: '0 2px 20px rgba(0,0,0,0.3)',
              }}
            >
              {photos.length === 0
                ? `Hey ${firstName}! 👋`
                : remaining === 0
                  ? `Great week, ${firstName}! 🔥`
                  : `Nice one, ${firstName}!`}
            </h2>
            <p
              className="text-white/60 font-medium mt-1"
              style={{
                fontSize: 'clamp(18px, 5vw, 24px)',
                textShadow: '0 2px 12px rgba(0,0,0,0.2)',
              }}
            >
              {photos.length === 0
                ? 'Tap + to log your first workout.'
                : remaining === 0
                  ? 'Week complete — reel time!'
                  : `${remaining} more to complete this week.`}
            </p>
          </motion.div>

          {/* Today's activity or log placeholder only */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex items-center gap-3 mt-10"
          >
            {todayPhoto && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePhotoTap(todayPhoto)}
                className="relative rounded-2xl overflow-hidden"
                style={{ width: 100, height: 120 }}
              >
                {todayPhoto.isVideo || isVideoUrl(todayPhoto.storageUrl) ? (
                  <video
                    src={todayPhoto.storageUrl}
                    className="w-full h-full object-cover"
                    muted playsInline preload="metadata"
                  />
                ) : (
                  <img
                    src={todayPhoto.storageUrl}
                    alt={todayPhoto.activity || 'Activity'}
                    className="w-full h-full object-cover"
                  />
                )}
                <div
                  className="absolute bottom-1.5 left-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-center"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
                >
                  <span className="text-white/90 text-[10px] font-semibold truncate block">
                    {todayPhoto.activity || `Day ${todayPhoto.dayNumber}`}
                  </span>
                </div>
              </motion.button>
            )}
            {!loggedToday && photos.length < 12 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMediaSheet(true)}
                className="flex flex-col items-center justify-center rounded-2xl"
                style={{
                  width: 100,
                  height: 120,
                  border: '1.5px dashed rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                <Plus className="w-7 h-7 text-white/50 mb-1" />
                <span className="text-white/40 text-xs font-medium">Log Activity</span>
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Bottom section */}
        <div className="relative z-10 pb-28 px-5">
          <AnimatePresence>
            {!!activePill && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <ReelProgressPill
                  weekNumber={activePill.weekNumber}
                  state={activePill.state}
                  progress={activePill.progress}
                  totalReactions={activePill.totalReactions}
                  onPlay={activePill.onPlay}
                  isActivelyGenerating={activePill.isActivelyGenerating}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Media Source Sheet */}
      <MediaSourceSheet
        isOpen={showMediaSheet}
        onClose={() => setShowMediaSheet(false)}
        dayNumber={photos.length + 1}
      />

      {/* Day Card → Bottom Sheet morph */}
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
