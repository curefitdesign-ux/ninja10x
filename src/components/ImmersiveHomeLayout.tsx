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

  const handlePhotoTap = (photo: Photo) => {
    triggerHaptic('medium');
    navigate('/reel', {
      state: { activityId: photo.id, dayNumber: photo.dayNumber },
    });
  };

  // Build action slots: first is latest photo thumb, rest are empty "+" slots
  const actionSlots = [];
  if (latestPhoto) {
    actionSlots.push({ type: 'photo' as const, photo: latestPhoto, extraCount: photos.length > 1 ? photos.length - 1 : 0 });
  }
  // Add 2 empty action slots
  actionSlots.push({ type: 'add' as const, label: 'Push' });
  actionSlots.push({ type: 'add' as const, label: 'Rise' });

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

          {/* Action slots row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex items-center gap-3 mt-10"
          >
            {actionSlots.map((slot, idx) => {
              if (slot.type === 'photo' && slot.photo) {
                return (
                  <motion.button
                    key="photo-thumb"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePhotoTap(slot.photo!)}
                    className="relative rounded-2xl overflow-hidden"
                    style={{ width: 100, height: 120 }}
                  >
                    {slot.photo.isVideo || isVideoUrl(slot.photo.storageUrl) ? (
                      <video
                        src={slot.photo.storageUrl}
                        className="w-full h-full object-cover"
                        muted playsInline preload="metadata"
                      />
                    ) : (
                      <img
                        src={slot.photo.storageUrl}
                        alt={slot.photo.activity || 'Activity'}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {slot.extraCount > 0 && (
                      <div
                        className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-white text-xs font-bold"
                        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
                      >
                        +{slot.extraCount}
                      </div>
                    )}
                  </motion.button>
                );
              }
              return (
                <motion.button
                  key={`add-${idx}`}
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
                  <span className="text-white/40 text-xs font-medium">{slot.label}</span>
                </motion.button>
              );
            })}
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
