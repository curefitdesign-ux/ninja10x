import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import { useProfile } from '@/hooks/use-profile';
import ProfileAvatar from '@/components/ProfileAvatar';
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  const pastPhotos = photos.length > 1 ? photos.slice(0, -1).reverse() : [];

  const handlePhotoTap = (photo: Photo) => {
    triggerHaptic('medium');
    navigate('/reel', {
      state: { activityId: photo.id, dayNumber: photo.dayNumber },
    });
  };

  const firstName = profile?.display_name?.split(' ')[0] || 'there';

  return (
    <div className="relative flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* Warm ambient background */}
      <div
        className="fixed inset-0"
        style={{
          background: latestPhoto
            ? 'linear-gradient(180deg, #3a2a1a 0%, #2d1a0a 30%, #1a0f06 70%, #0f0a04 100%)'
            : 'linear-gradient(180deg, #252535 0%, #1a1a2e 50%, #0f0f1f 100%)',
        }}
      />

      {/* Blurred hero ambient from latest photo */}
      {latestPhoto && (
        <div className="fixed inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${latestPhoto.storageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(80px) saturate(160%) brightness(0.4)',
              transform: 'scale(1.4)',
            }}
          />
          {/* Warm color wash overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(180,120,60,0.15) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.5) 100%)',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-5"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 12px)' }}
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Sparkles className="w-5 h-5 text-white/70" />
          </motion.button>

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

        {/* Hero area */}
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          {latestPhoto ? (
            <>
              {/* Activity title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="text-center font-black uppercase leading-[0.85] tracking-tight mb-8"
                style={{
                  fontSize: 'clamp(44px, 13vw, 68px)',
                  color: 'white',
                  textShadow: '0 4px 40px rgba(0,0,0,0.4)',
                }}
              >
                {(latestPhoto.activity || 'Workout').split(' ').map((word, i) => (
                  <span key={i} className="block">{word}</span>
                ))}
              </motion.h1>

              {/* Hero photo card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative cursor-pointer"
                onClick={() => handlePhotoTap(latestPhoto)}
                style={{ width: '260px', maxWidth: '68vw' }}
              >
                <div
                  className="rounded-3xl overflow-hidden"
                  style={{
                    aspectRatio: '3/4',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
                  }}
                >
                  {latestPhoto.isVideo || isVideoUrl(latestPhoto.storageUrl) ? (
                    <video
                      src={latestPhoto.storageUrl}
                      className="w-full h-full object-cover"
                      muted playsInline autoPlay loop
                    />
                  ) : (
                    <img
                      src={latestPhoto.storageUrl}
                      alt={latestPhoto.activity || 'Activity'}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Glass reflection at bottom of photo */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
                    style={{
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.4))',
                    }}
                  />
                </div>

                {/* Glass orb decorations */}
                <div
                  className="absolute -right-5 top-[40%] w-7 h-7 rounded-full pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.45), rgba(200,160,100,0.2), transparent)',
                    filter: 'blur(0.5px)',
                  }}
                />
                <div
                  className="absolute -left-6 bottom-[30%] w-5 h-5 rounded-full pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), rgba(200,160,100,0.15), transparent)',
                    filter: 'blur(0.5px)',
                  }}
                />
              </motion.div>

              {/* Glass pill CTA */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.35 }}
                className="mt-8"
              >
                <button
                  onClick={() => setShowMediaSheet(true)}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-full active:scale-[0.96] transition-transform"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)',
                  }}
                >
                  <span className="text-white/85 font-semibold text-sm">
                    Day {latestPhoto.dayNumber}
                  </span>
                  {latestPhoto.duration && (
                    <>
                      <div className="w-px h-4 bg-white/15" />
                      <span className="text-white/50 text-sm">{latestPhoto.duration}</span>
                    </>
                  )}
                  <div className="w-px h-4 bg-white/15" />
                  <Plus className="w-4 h-4 text-white/60" />
                </button>
              </motion.div>
            </>
          ) : (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-8"
            >
              <div
                className="w-60 h-72 rounded-3xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)',
                  border: '1.5px dashed rgba(255,255,255,0.12)',
                }}
              >
                <Camera className="w-14 h-14 text-white/15" />
              </div>

              <div className="text-center">
                <h2 className="text-white font-bold text-2xl mb-2">Start your journey</h2>
                <p className="text-white/35 text-sm">Capture your first workout</p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenCamera}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl active:scale-[0.96] transition-transform"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.14)',
                  }}
                >
                  <Camera className="w-5 h-5 text-white/80" />
                  <span className="text-white/80 font-medium text-sm">Camera</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMediaSheet(true)}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl active:scale-[0.96] transition-transform"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.14)',
                  }}
                >
                  <Plus className="w-5 h-5 text-white/80" />
                  <span className="text-white/80 font-medium text-sm">Gallery</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom section */}
        <div className="relative z-10 pb-28">
          {/* Journey label */}
          {pastPhotos.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="px-5 mb-3 text-white/50 text-[13px] font-semibold tracking-wide"
            >
              {firstName}, your journey
            </motion.p>
          )}

          {/* Horizontal scroll cards */}
          {pastPhotos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-3"
            >
              {pastPhotos.map((photo, idx) => (
                <motion.button
                  key={photo.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.06 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePhotoTap(photo)}
                  className="flex-shrink-0 rounded-2xl overflow-hidden relative"
                  style={{
                    width: '110px',
                    height: '110px',
                    background: 'rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  }}
                >
                  {photo.isVideo || isVideoUrl(photo.storageUrl) ? (
                    <video
                      src={photo.storageUrl}
                      className="w-full h-full object-cover"
                      muted playsInline preload="metadata"
                      onLoadedData={(e) => { (e.target as HTMLVideoElement).currentTime = 0.1; }}
                    />
                  ) : (
                    <img
                      src={photo.storageUrl}
                      alt={photo.activity || ''}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div
                    className="absolute inset-x-0 bottom-0 p-2"
                    style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.65))' }}
                  >
                    <span className="text-white/90 text-[10px] font-semibold tracking-wide uppercase block truncate">
                      {photo.activity || 'Workout'}
                    </span>
                  </div>
                </motion.button>
              ))}

              {/* Add card */}
              <motion.button
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + pastPhotos.length * 0.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMediaSheet(true)}
                className="flex-shrink-0 rounded-2xl flex flex-col items-center justify-center gap-2"
                style={{
                  width: '110px',
                  height: '110px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px dashed rgba(255,255,255,0.1)',
                }}
              >
                <Plus className="w-5 h-5 text-white/25" />
                <span className="text-white/25 text-[10px] font-medium">Add</span>
              </motion.button>
            </motion.div>
          )}

          {/* Reel pill */}
          <AnimatePresence>
            {!!reelPill && (
              <div className="px-5 mt-2">
                <ReelProgressPill
                  weekNumber={reelPill.weekNumber}
                  state={reelPill.state}
                  progress={reelPill.progress}
                  totalReactions={reelPill.totalReactions}
                  onPlay={reelPill.onPlay}
                  isActivelyGenerating={reelPill.isActivelyGenerating}
                />
              </div>
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
