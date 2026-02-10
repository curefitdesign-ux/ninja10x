import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import { useProfile } from '@/hooks/use-profile';
import ProfileAvatar from '@/components/ProfileAvatar';
import CircularProgressRing from '@/components/CircularProgressRing';
import ReelProgressPill, { type PillState } from '@/components/ReelProgressPill';
import MediaSourceSheet from '@/components/MediaSourceSheet';

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
}: ImmersiveHomeLayoutProps) => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [showMediaSheet, setShowMediaSheet] = useState(false);

  const firstName = profile?.display_name?.split(' ')[0] || 'there';
  const currentWeek = Math.floor(photos.length / 3) + 1;
  const photosInWeek = photos.length % 3;
  const remaining = photosInWeek === 0 && photos.length > 0 ? 0 : 3 - photosInWeek;

  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;

  // Last completed week's photos (3 photos)
  const completedWeeks = Math.floor(photos.length / 3);
  const lastWeekPhotos = completedWeeks > 0
    ? photos.slice((completedWeeks - 1) * 3, completedWeeks * 3)
    : [];

  const handlePhotoTap = (photo: Photo) => {
    triggerHaptic('medium');
    navigate('/reel', {
      state: { activityId: photo.id, dayNumber: photo.dayNumber },
    });
  };

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

        {/* Last week's photos — animated horizontal strip */}
        {lastWeekPhotos.length === 3 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-2.5 px-5 mt-3"
          >
            {lastWeekPhotos.map((photo, idx) => (
              <motion.button
                key={photo.id}
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.1, type: 'spring', stiffness: 300 }}
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
                  <video
                    src={photo.storageUrl}
                    className="w-full h-full object-cover"
                    muted playsInline preload="metadata"
                  />
                ) : (
                  <img
                    src={photo.storageUrl}
                    alt={photo.activity || 'Activity'}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Activity label */}
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
            {/* Week label */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute -bottom-5 left-0 right-0 text-center"
            >
            </motion.div>
          </motion.div>
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
                if (latestPhoto) handlePhotoTap(latestPhoto);
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
                  : `Nice one,${firstName}!`}
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
          {/* Reel pill */}
          <AnimatePresence>
            {!!reelPill && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <ReelProgressPill
                  weekNumber={reelPill.weekNumber}
                  state={reelPill.state}
                  progress={reelPill.progress}
                  totalReactions={reelPill.totalReactions}
                  onPlay={reelPill.onPlay}
                  isActivelyGenerating={reelPill.isActivelyGenerating}
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
    </div>
  );
};

export default ImmersiveHomeLayout;
