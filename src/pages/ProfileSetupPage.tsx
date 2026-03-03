import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Camera, X, Eye, EyeOff, LogOut } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { z } from 'zod';


// Curo mascot preset avatars (thumbnails)
import curoBoxing from '@/assets/avatars/curo-boxing.png';
import curoCool from '@/assets/avatars/curo-cool.png';
import curoHappy from '@/assets/avatars/curo-happy.png';
import curoFire from '@/assets/avatars/curo-fire.png';
import curoFierce from '@/assets/avatars/curo-fierce.png';
import curoShy from '@/assets/avatars/curo-shy.png';
import curoZen from '@/assets/avatars/curo-zen.png';
import curoShocked from '@/assets/avatars/curo-shocked.png';
import curoMusic from '@/assets/avatars/curo-music.png';

// HD versions for hero display
import curoBoxingHd from '@/assets/avatars/curo-boxing-hd.png';
import curoCoolHd from '@/assets/avatars/curo-cool-hd.png';
import curoHappyHd from '@/assets/avatars/curo-happy-hd.png';
import curoFireHd from '@/assets/avatars/curo-fire-hd.png';
import curoFierceHd from '@/assets/avatars/curo-fierce-hd.png';
import curoShyHd from '@/assets/avatars/curo-shy-hd.png';
import curoZenHd from '@/assets/avatars/curo-zen-hd.png';
import curoShockedHd from '@/assets/avatars/curo-shocked-hd.png';
import curoMusicHd from '@/assets/avatars/curo-music-hd.png';

const PRESET_AVATARS = [
  { id: 'curo-boxing', src: curoBoxing, hd: curoBoxingHd },
  { id: 'curo-cool', src: curoCool, hd: curoCoolHd },
  { id: 'curo-happy', src: curoHappy, hd: curoHappyHd },
  { id: 'curo-fire', src: curoFire, hd: curoFireHd },
  { id: 'curo-fierce', src: curoFierce, hd: curoFierceHd },
  { id: 'curo-shy', src: curoShy, hd: curoShyHd },
  { id: 'curo-zen', src: curoZen, hd: curoZenHd },
  { id: 'curo-shocked', src: curoShocked, hd: curoShockedHd },
  { id: 'curo-music', src: curoMusic, hd: curoMusicHd },
];

const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name too long');

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';

  const { user, signOut } = useAuth();
  const { profile, updateProfile, needsSetup, loading: profileLoading } = useProfile();

  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [storiesPublic, setStoriesPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Redirect if profile already exists and not in edit mode
  useEffect(() => {
    if (profileLoading) return;
    if (!editMode && !needsSetup && profile) {
      navigate('/reel', { replace: true });
    }
  }, [editMode, needsSetup, profile, navigate, profileLoading]);

  // Pre-fill data in edit mode
  useEffect(() => {
    if (isInitialized) return;
    if (editMode && profile) {
      setDisplayName(profile.display_name);
      setStoriesPublic(profile.stories_public ?? false);
      const storedUrl = profile.avatar_url;
      const presetMatch = PRESET_AVATARS.find(a =>
        storedUrl === a.id || storedUrl.includes(a.id)
      );
      if (presetMatch) {
        setSelectedAvatar(presetMatch.id);
      } else if (storedUrl) {
        setCustomAvatarPreview(storedUrl);
      }
      setIsInitialized(true);
    } else if (!editMode) {
      setIsInitialized(true);
    }
  }, [editMode, profile, isInitialized]);

  // Tap hero → open native camera directly
  const handleHeroTap = () => cameraInputRef.current?.click();

  const handleHeroFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('Image must be less than 20MB'); return; }
    // Use image directly — no crop tool
    setCustomAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCustomAvatarPreview(ev.target?.result as string);
      setSelectedAvatar(null);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const selectPresetAvatar = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    setCustomAvatarFile(null);
    setCustomAvatarPreview(null);
  };

  const hasAvatarSelected = selectedAvatar !== null || customAvatarFile !== null || customAvatarPreview !== null;

  // What to show in the hero and blurred bg
  const getCurrentAvatarSrc = () => {
    if (customAvatarPreview) return customAvatarPreview;
    if (selectedAvatar) return PRESET_AVATARS.find(a => a.id === selectedAvatar)?.hd ?? null;
    return null;
  };
  const heroImage = getCurrentAvatarSrc();

  const handleSubmit = async () => {
    const nameResult = nameSchema.safeParse(displayName);
    if (!nameResult.success) { setNameError(nameResult.error.errors[0].message); return; }
    if (!hasAvatarSelected) { toast.error('Please select an avatar'); return; }
    if (!user) { toast.error('No user logged in'); return; }

    setLoading(true);
    try {
      let avatarUrl: string;

      if (customAvatarFile) {
        const fileExt = customAvatarFile.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('journey-uploads')
          .upload(fileName, customAvatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('journey-uploads').getPublicUrl(fileName);
        avatarUrl = urlData.publicUrl;
      } else if (selectedAvatar) {
        avatarUrl = selectedAvatar;
      } else {
        avatarUrl = customAvatarPreview || '';
      }

      if (editMode) {
        await updateProfile({ display_name: displayName.trim(), avatar_url: avatarUrl, stories_public: storiesPublic });
        toast.success('Profile updated!');
        navigate(-1);
      } else {
        const { error: insertError } = await supabase.from('profiles').insert({
          user_id: user.id,
          display_name: displayName.trim(),
          avatar_url: avatarUrl,
          stories_public: storiesPublic,
        });
        if (insertError) throw insertError;
        toast.success('Profile created!');
        navigate('/reel', { replace: true });
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0a0a12' }}>
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex flex-col overflow-y-auto"
      style={{ background: '#0a0a12', height: '100dvh', WebkitOverflowScrolling: 'touch' }}
    >
      {/* ── Ambient blurred background (always visible) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatePresence>
          {heroImage && (
            <motion.img
              key={heroImage}
              src={heroImage}
              alt=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(72px) saturate(1.6) brightness(0.55)', transform: 'scale(1.25)' }}
            />
          )}
        </AnimatePresence>
        {/* Dark veil so content is always readable */}
        <div className="absolute inset-0" style={{ background: 'rgba(10,10,18,0.45)' }} />
      </div>

      {/* Hidden camera file input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleHeroFileSelect}
        className="hidden"
      />

      {/* ── HERO — square format, tap to open camera ── */}
      <div className="relative z-10 w-full flex-shrink-0" style={{ aspectRatio: '3/4' }}>
        <div className="block w-full h-full cursor-pointer relative overflow-hidden" onClick={handleHeroTap}>
          {heroImage ? (
            <img
              src={heroImage}
              alt="Profile photo"
              className="w-full h-full object-cover"
              style={{
                maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
              }}
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-4"
              style={{ background: 'linear-gradient(180deg, rgba(42,27,78,0.6) 0%, rgba(10,7,32,0.3) 100%)' }}
            >
              <motion.div
                className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px dashed rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(10px)',
                }}
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Camera className="w-9 h-9 text-white/40" />
              </motion.div>
              <p className="text-white/35 text-sm tracking-wide">Tap to add your photo</p>
            </div>
          )}

          {/* Camera edit icon when photo selected */}
          {heroImage && (
            <div
              className="absolute bottom-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <Camera className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* ✕ Close / Back button — always visible (top-right) */}
        <motion.button
          onClick={async () => {
            if (editMode) {
              navigate(-1);
            } else {
              await signOut();
              navigate('/auth', { replace: true });
            }
          }}
          whileTap={{ scale: 0.95 }}
          className="absolute flex items-center justify-center"
          style={{
            top: 'max(env(safe-area-inset-top), 16px)',
            right: '16px',
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.15)',
            zIndex: 20,
          }}
        >
          <X className="w-4 h-4 text-white" />
        </motion.button>
      </div>

      {/* ── BOTTOM PANEL — flows naturally below hero ── */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Title + Subtitle */}
        <div className="flex flex-col items-center px-6 mb-2" style={{ marginTop: '-50px' }}>
          <h1
            className="text-center font-black text-white uppercase leading-tight"
            style={{ fontSize: '2rem', letterSpacing: '-0.02em' }}
          >
            India's Ultimate{'\n'}Habit Builder.
          </h1>
          <p className="text-white/50 text-base mt-3 text-center">What should we call you?</p>
        </div>

        {/* Name input */}
        <div className="flex flex-col items-center px-6 mt-2 mb-4">
          <div
            className="w-full rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <input
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); if (nameError) setNameError(null); }}
              placeholder="First Name"
              disabled={loading}
              maxLength={50}
              className="w-full px-5 py-4 text-white text-lg bg-transparent outline-none placeholder:text-white/30 border-0"
              style={{ caretColor: 'white' }}
            />
          </div>
          {nameError && <p className="text-red-400 text-xs mt-1.5">{nameError}</p>}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-6 mb-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs tracking-wide uppercase">Choose avatar</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Preset Avatars — horizontal scroll, square tiles */}
        <div className="px-4 mb-4">
          <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {PRESET_AVATARS.map((avatar) => (
              <motion.button
                key={avatar.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => selectPresetAvatar(avatar.id)}
                disabled={loading}
                className="relative flex-shrink-0"
                style={{ width: 60, height: 60 }}
              >
                <div
                  className="w-full h-full overflow-hidden"
                  style={{
                    borderRadius: 12,
                    border: selectedAvatar === avatar.id
                      ? '2.5px solid #34d399'
                      : '2px solid rgba(255,255,255,0.1)',
                    boxShadow: selectedAvatar === avatar.id
                      ? '0 0 14px rgba(52,211,153,0.45)'
                      : 'none',
                  }}
                >
                  <img src={avatar.src} alt={avatar.id} className="w-full h-full object-cover" />
                </div>
                <AnimatePresence>
                  {selectedAvatar === avatar.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/35"
                      style={{ borderRadius: 12 }}
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Stories toggle — edit mode only */}
        {editMode && (
          <div
            className="mx-6 rounded-2xl p-4 mb-4"
            style={{
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {storiesPublic ? <Eye className="w-5 h-5 text-emerald-400" /> : <EyeOff className="w-5 h-5 text-white/50" />}
                <div>
                  <p className="text-white font-medium text-sm">Stories Visibility</p>
                  <p className="text-white/50 text-xs mt-0.5">{storiesPublic ? 'Visible to community' : 'Only you can see'}</p>
                </div>
              </div>
              <Switch checked={storiesPublic} onCheckedChange={setStoriesPublic} disabled={loading} />
            </div>
          </div>
        )}

        {/* Submit CTA */}
        <div className="px-6 pb-safe">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading || !displayName.trim() || !hasAvatarSelected}
            className="w-full py-4 rounded-2xl font-semibold text-white transition-all duration-200 disabled:opacity-40 relative overflow-hidden"
            style={{
              background: hasAvatarSelected && displayName.trim()
                ? 'linear-gradient(135deg, #F97316 0%, #EC4899 100%)'
                : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: hasAvatarSelected && displayName.trim()
                ? '0 8px 28px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                : 'inset 0 1px 1px rgba(255,255,255,0.1)',
              marginBottom: 'max(env(safe-area-inset-bottom), 24px)',
            }}
          >
            <motion.div
              className="absolute inset-0 opacity-25"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
            />
            <span className="relative z-10 text-base">
              {loading ? (editMode ? 'Saving...' : 'Creating...') : (editMode ? 'Save Changes' : 'Continue')}
            </span>
          </motion.button>
        </div>
      </div>

    </motion.div>
  );
};

export default ProfileSetupPage;
