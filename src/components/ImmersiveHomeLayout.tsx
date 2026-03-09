import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import { useProfile } from '@/hooks/use-profile';
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
  // New: week-aware reel pill handler
  onWeekReelTap?: (weekNumber: number) => void;
  cachedWeeks?: Set<number>;
}

const isVideoUrl = (url: string) => {
  return url.startsWith('data:video') || /\.(mp4|webm|mov|avi)$/i.test(url);
};

const WEEK_THEMES = ['Conquer Will Power', 'Build Energy', 'Increase Stamina', 'Build Strength'];

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
  const [focusedWeek, setFocusedWeek] = useState<number | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

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

  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  const loggedToday = latestPhoto && new Date(latestPhoto.storageUrl ? latestPhoto.storageUrl : '').toDateString() === new Date().toDateString();
  // Check if the latest photo was logged today using createdAt from activities
  const todayPhoto = (() => {
    if (!latestPhoto) return null;
    // Photos are sorted by dayNumber, latest is last. Check if it was created today.
    // We need to find the matching activity's createdAt — use a simple heuristic:
    // If the photo's dayNumber equals photos.length, it's the latest one.
    return latestPhoto;
  })();

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

        {/* Journey photo strip — shows all weeks initially, zooms to focused week */}
        {weekGroups.length > 0 && (
          <div className="mt-3 px-4">
            <AnimatePresence mode="wait">
              {!focusedWeek ? (
                /* All weeks overview — compact thumbnails */
                <motion.div
                  key="all-weeks"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-wrap justify-center gap-1.5"
                >
                  {photos.map((photo, idx) => (
                    <motion.button
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleWeekTap(Math.ceil((idx + 1) / 3))}
                      className="relative rounded-lg overflow-hidden"
                      style={{
                        width: 52,
                        height: 64,
                        border: '1px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      {photo.isVideo || isVideoUrl(photo.storageUrl) ? (
                        <video src={photo.storageUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                      ) : (
                        <img src={photo.storageUrl} alt={photo.activity || ''} className="w-full h-full object-cover" />
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                /* Focused week — expanded cards */
                <motion.div
                  key={`week-${focusedWeek}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, type: 'spring', stiffness: 250 }}
                >
                  {/* Week selector tabs */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {weekGroups.map(({ weekNumber }) => (
                      <motion.button
                        key={weekNumber}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleWeekTap(weekNumber)}
                        className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: focusedWeek === weekNumber
                            ? 'rgba(255,255,255,0.15)'
                            : 'rgba(255,255,255,0.05)',
                          color: focusedWeek === weekNumber
                            ? 'rgba(255,255,255,0.95)'
                            : 'rgba(255,255,255,0.4)',
                          border: focusedWeek === weekNumber
                            ? '1px solid rgba(255,255,255,0.25)'
                            : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        W{weekNumber}
                      </motion.button>
                    ))}
                  </div>

                  {/* Expanded photos for focused week */}
                  <div className="flex items-center justify-center gap-2.5">
                    {focusedPhotos.map((photo, idx) => (
                      <motion.button
                        key={photo.id}
                        layoutId={`day-card-${photo.id}`}
                        initial={{ opacity: 0, scale: 0.85, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.1, type: 'spring', stiffness: 300 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePhotoTap(photo)}
                        className="relative rounded-xl overflow-hidden"
                        style={{
                          width: 90,
                          height: 110,
                          border: '1.5px solid rgba(255,255,255,0.15)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        }}
                      >
                        {photo.isVideo || isVideoUrl(photo.storageUrl) ? (
                          <video src={photo.storageUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                        ) : (
                          <img src={photo.storageUrl} alt={photo.activity || 'Activity'} className="w-full h-full object-cover" />
                        )}
                        <div
                          className="absolute bottom-1.5 left-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-center"
                          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
                        >
                          <span className="text-white/90 text-[10px] font-semibold truncate block">
                            {photo.activity || `Day ${photo.dayNumber}`}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                    {/* Empty slots for this week */}
                    {Array.from({ length: 3 - focusedPhotos.length }).map((_, i) => {
                      const emptyDayNum = (focusedWeek! - 1) * 3 + focusedPhotos.length + i + 1;
                      const isNext = emptyDayNum === photos.length + 1;
                      const slotLayoutId = `day-card-empty-${emptyDayNum}`;
                      return isNext ? (
                        <motion.button
                          key={slotLayoutId}
                          layoutId={slotLayoutId}
                          initial={{ opacity: 0, scale: 0.85, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: (focusedPhotos.length + i) * 0.1, type: 'spring', stiffness: 300 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openDaySheet(null, emptyDayNum, slotLayoutId)}
                          className="relative rounded-xl flex flex-col items-center justify-center"
                          style={{
                            width: 90,
                            height: 110,
                            border: '1.5px dashed rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.04)',
                          }}
                        >
                          <Plus className="w-6 h-6 text-white/40 mb-1" />
                          <span className="text-white/30 text-[10px] font-medium">Day {emptyDayNum}</span>
                        </motion.button>
                      ) : (
                        <div
                          key={slotLayoutId}
                          className="relative rounded-xl flex flex-col items-center justify-center"
                          style={{
                            width: 90,
                            height: 110,
                            border: '1.5px dashed rgba(255,255,255,0.07)',
                            background: 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <span className="text-white/20 text-[10px] font-medium">Day {emptyDayNum}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Week theme label */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center text-white/40 text-[11px] font-medium mt-2 tracking-wide"
                  >
                    {WEEK_THEMES[(focusedWeek - 1) % 4]}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

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

          {/* Motivational text - large & prominent, no box */}
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

          {/* Add photo actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex items-center gap-3 mt-10"
          >
            {latestPhoto && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePhotoTap(latestPhoto)}
                className="relative rounded-2xl overflow-hidden"
                style={{ width: 100, height: 120 }}
              >
                {latestPhoto.isVideo || isVideoUrl(latestPhoto.storageUrl) ? (
                  <video
                    src={latestPhoto.storageUrl}
                    className="w-full h-full object-cover"
                    muted playsInline preload="metadata"
                  />
                ) : (
                  <img
                    src={latestPhoto.storageUrl}
                    alt={latestPhoto.activity || 'Activity'}
                    className="w-full h-full object-cover"
                  />
                )}
                {photos.length > 1 && (
                  <div
                    className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-white text-xs font-bold"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
                  >
                    +{photos.length - 1}
                  </div>
                )}
              </motion.button>
            )}
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
              <span className="text-white/40 text-xs font-medium">Push</span>
            </motion.button>
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
              <span className="text-white/40 text-xs font-medium">Rise</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Bottom section */}
        <div className="relative z-10 pb-28 px-5">
          {/* Reel pill — context-aware per focused week */}
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
