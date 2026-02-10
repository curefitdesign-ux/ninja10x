import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Camera, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import { useProfile } from '@/hooks/use-profile';
import ProfileAvatar from '@/components/ProfileAvatar';
import NotificationCenter from '@/components/NotificationCenter';
import ReelProgressPill, { type PillState } from '@/components/ReelProgressPill';
import MediaSourceSheet from '@/components/MediaSourceSheet';

// Frame renderers
import ShakyFrame from '@/components/frames/ShakyFrame';
import JournalFrame from '@/components/frames/JournalFrame';
import VogueFrame from '@/components/frames/VogueFrame';
import FitnessFrame from '@/components/frames/FitnessFrame';
import TicketFrame from '@/components/frames/TicketFrame';

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

// Activity color themes matching the reference aesthetic
const ACTIVITY_THEMES: Record<string, { bg: string; accent: string }> = {
  Running: { bg: 'linear-gradient(160deg, #1a3a5c 0%, #0d2137 40%, #0a1929 100%)', accent: '#60a5fa' },
  Cycling: { bg: 'linear-gradient(160deg, #1a3c2a 0%, #0d2118 40%, #0a1912 100%)', accent: '#34d399' },
  Trekking: { bg: 'linear-gradient(160deg, #3a2a1a 0%, #21180d 40%, #19120a 100%)', accent: '#d4a574' },
  Basketball: { bg: 'linear-gradient(160deg, #4a2a0a 0%, #2d1a06 40%, #1a0f03 100%)', accent: '#fb923c' },
  Yoga: { bg: 'linear-gradient(160deg, #2a1a3a 0%, #180d21 40%, #120a19 100%)', accent: '#c084fc' },
  Football: { bg: 'linear-gradient(160deg, #1a3a1a 0%, #0d210d 40%, #0a190a 100%)', accent: '#4ade80' },
  Cricket: { bg: 'linear-gradient(160deg, #2a3a1a 0%, #18210d 40%, #12190a 100%)', accent: '#a3e635' },
  Badminton: { bg: 'linear-gradient(160deg, #1a2a3a 0%, #0d1821 40%, #0a1219 100%)', accent: '#38bdf8' },
  Boxing: { bg: 'linear-gradient(160deg, #3a1a1a 0%, #210d0d 40%, #190a0a 100%)', accent: '#f87171' },
  default: { bg: 'linear-gradient(160deg, #252535 0%, #1a1a2e 40%, #0f0f1f 100%)', accent: '#818cf8' },
};

const getTheme = (activity?: string) => {
  if (!activity) return ACTIVITY_THEMES.default;
  return ACTIVITY_THEMES[activity] || ACTIVITY_THEMES.default;
};

const isVideoUrl = (url: string) => {
  return url.startsWith('data:video') || /\.(mp4|webm|mov|avi)$/i.test(url);
};

const ImmersiveHomeLayout = ({
  photos,
  onAddPhoto,
  onOpenCamera,
  onGenerateReel,
  onRemovePhoto,
  onEditPhoto,
  isGenerating = false,
  isUploading = false,
  weekTransitionAnimation = false,
  reelPill = null,
}: ImmersiveHomeLayoutProps) => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showMediaSheet, setShowMediaSheet] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  const pastPhotos = photos.length > 1 ? photos.slice(0, -1).reverse() : [];
  const hasThreePhotos = photos.length >= 3;
  const allPhotosUploaded = photos.every(p => p.storageUrl);
  const canCreateReel = hasThreePhotos && allPhotosUploaded && !isGenerating && !isUploading;
  const theme = getTheme(latestPhoto?.activity);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const handlePhotoTap = (photo: Photo) => {
    triggerHaptic('medium');
    navigate('/reel', {
      state: { activityId: photo.id, dayNumber: photo.dayNumber },
    });
  };

  const handleGenerateReel = () => {
    triggerHaptic('medium');
    if (onGenerateReel && photos.length >= 3) {
      onGenerateReel(photos.slice(-3));
    }
  };

  const firstName = profile?.display_name?.split(' ')[0] || 'there';

  return (
    <div className="relative flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* Full-bleed background */}
      <div className="fixed inset-0" style={{ background: theme.bg }} />

      {/* Hero background image - blurred ambient */}
      {latestPhoto && (
        <div className="fixed inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${latestPhoto.storageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(80px) saturate(140%) brightness(0.35)',
              transform: 'scale(1.3)',
            }}
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      {/* Grain texture */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Top bar */}
        <div 
          className="flex items-center justify-between px-5"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 12px)' }}
        >
          {/* AI / Sparkle button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <Sparkles className="w-5 h-5 text-white/80" />
          </motion.button>

          {/* Profile avatar */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/profile-setup', { state: { isEditing: true } })}
            className="rounded-full"
            style={{
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            <ProfileAvatar
              src={profile?.avatar_url}
              name={profile?.display_name}
              size={44}
            />
          </motion.button>
        </div>

        {/* Hero content area */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 relative">
          {latestPhoto ? (
            <>
              {/* Bold activity name */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center font-black uppercase leading-[0.9] tracking-tight mb-6 relative z-20"
                style={{
                  fontSize: 'clamp(48px, 14vw, 72px)',
                  color: 'white',
                  textShadow: '0 4px 30px rgba(0,0,0,0.5)',
                }}
              >
                {latestPhoto.activity || 'Workout'}
              </motion.h1>

              {/* Hero photo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative cursor-pointer"
                onClick={() => handlePhotoTap(latestPhoto)}
                style={{ width: '260px', maxWidth: '70vw' }}
              >
                <div
                  className="rounded-3xl overflow-hidden shadow-2xl"
                  style={{
                    aspectRatio: '3/4',
                    boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 80px ${theme.accent}20`,
                  }}
                >
                  {latestPhoto.isVideo || isVideoUrl(latestPhoto.storageUrl) ? (
                    <video
                      src={latestPhoto.storageUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      autoPlay
                      loop
                    />
                  ) : (
                    <img
                      src={latestPhoto.storageUrl}
                      alt={latestPhoto.activity || 'Activity'}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Floating glass reflection spheres - decorative */}
                <div
                  className="absolute -right-4 top-1/3 w-8 h-8 rounded-full pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), ${theme.accent}40, transparent)`,
                    filter: 'blur(1px)',
                  }}
                />
                <div
                  className="absolute -left-6 bottom-1/4 w-5 h-5 rounded-full pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), ${theme.accent}30, transparent)`,
                    filter: 'blur(0.5px)',
                  }}
                />
              </motion.div>

              {/* Glass CTA pill */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-8 flex items-center gap-3"
              >
                {/* Duration / Day pill */}
                <button
                  onClick={() => setShowMediaSheet(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-full active:scale-95 transition-transform"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                >
                  <span className="text-white/90 font-semibold text-sm tracking-wide">
                    Day {latestPhoto.dayNumber}
                  </span>
                  {latestPhoto.duration && (
                    <>
                      <div className="w-px h-4 bg-white/20" />
                      <span className="text-white/60 text-sm">{latestPhoto.duration}</span>
                    </>
                  )}
                </button>

                {/* Add new button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowMediaSheet(true)}
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  <Plus className="w-5 h-5 text-white/90" />
                </motion.button>
              </motion.div>
            </>
          ) : (
            /* Empty state - no photos yet */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-8"
            >
              {/* Large placeholder icon */}
              <div
                className="w-64 h-72 rounded-3xl flex items-center justify-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1.5px dashed rgba(255,255,255,0.15)',
                }}
              >
                <Camera className="w-16 h-16 text-white/20" />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.03) 0%, transparent 70%)',
                  }}
                />
              </div>

              <div className="text-center">
                <h2 className="text-white font-bold text-2xl mb-2">Start your journey</h2>
                <p className="text-white/40 text-sm">Capture your first workout</p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenCamera}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <Camera className="w-5 h-5 text-white/90" />
                  <span className="text-white/90 font-medium text-sm">Camera</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMediaSheet(true)}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <Plus className="w-5 h-5 text-white/90" />
                  <span className="text-white/90 font-medium text-sm">Gallery</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom section - greeting + horizontal scroll */}
        <div className="relative z-10 pb-24">
          {/* Personalized greeting */}
          {pastPhotos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="px-5 mb-3"
            >
              <h3 className="text-white/90 font-semibold text-base">
                {firstName}, your journey
              </h3>
            </motion.div>
          )}

          {/* Horizontal scroll of past activities */}
          {pastPhotos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-4"
            >
              {pastPhotos.map((photo, idx) => (
                <motion.button
                  key={photo.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePhotoTap(photo)}
                  className="flex-shrink-0 rounded-2xl overflow-hidden relative"
                  style={{
                    width: '120px',
                    height: '120px',
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  }}
                >
                  {photo.isVideo || isVideoUrl(photo.storageUrl) ? (
                    <video
                      src={photo.storageUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                      onLoadedData={(e) => { (e.target as HTMLVideoElement).currentTime = 0.1; }}
                    />
                  ) : (
                    <img
                      src={photo.storageUrl}
                      alt={photo.activity || ''}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Activity label overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-2" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                    <span className="text-white text-[10px] font-semibold tracking-wide uppercase block truncate">
                      {photo.activity || 'Workout'}
                    </span>
                    {photo.duration && (
                      <span className="text-white/50 text-[9px]">{photo.duration}</span>
                    )}
                  </div>
                </motion.button>
              ))}

              {/* Add more card */}
              <motion.button
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + pastPhotos.length * 0.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMediaSheet(true)}
                className="flex-shrink-0 rounded-2xl flex flex-col items-center justify-center gap-2"
                style={{
                  width: '120px',
                  height: '120px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px dashed rgba(255,255,255,0.15)',
                }}
              >
                <Plus className="w-6 h-6 text-white/30" />
                <span className="text-white/30 text-[10px] font-medium">Add</span>
              </motion.button>
            </motion.div>
          )}

          {/* Reel Progress Pill */}
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
