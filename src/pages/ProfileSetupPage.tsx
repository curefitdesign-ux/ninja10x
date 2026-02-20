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


// New 3D character preset avatars
import presetOrange from '@/assets/avatars/preset-orange.png';
import presetRedgirl from '@/assets/avatars/preset-redgirl.png';
import presetEdgy from '@/assets/avatars/preset-edgy.png';

// Fallback color avatars
import avatarRed from '@/assets/avatars/avatar-red.png';
import avatarBlue from '@/assets/avatars/avatar-blue.png';
import avatarPurple from '@/assets/avatars/avatar-purple.png';
import avatarGreen from '@/assets/avatars/avatar-green.png';
import avatarOrange from '@/assets/avatars/avatar-orange.png';
import avatarTeal from '@/assets/avatars/avatar-teal.png';
import avatarPink from '@/assets/avatars/avatar-pink.png';
import avatarYellow from '@/assets/avatars/avatar-yellow.png';

const PRESET_AVATARS = [
  { id: 'preset-orange', src: presetOrange },
  { id: 'preset-redgirl', src: presetRedgirl },
  { id: 'preset-edgy', src: presetEdgy },
  { id: 'red', src: avatarRed },
  { id: 'blue', src: avatarBlue },
  { id: 'purple', src: avatarPurple },
  { id: 'green', src: avatarGreen },
  { id: 'orange', src: avatarOrange },
  { id: 'teal', src: avatarTeal },
  { id: 'pink', src: avatarPink },
  { id: 'yellow', src: avatarYellow },
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
      navigate('/', { replace: true });
    }
  }, [editMode, needsSetup, profile, navigate, profileLoading]);

  // Pre-fill data in edit mode
  useEffect(() => {
    if (isInitialized) return;
    if (editMode && profile) {
      setDisplayName(profile.display_name);
      setStoriesPublic(profile.stories_public ?? true);
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
    if (selectedAvatar) return PRESET_AVATARS.find(a => a.id === selectedAvatar)?.src ?? null;
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
        avatarUrl = selectedAvatar.startsWith('preset-') ? selectedAvatar : `avatar-${selectedAvatar}`;
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
        navigate('/', { replace: true });
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
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: '#0a0a12', height: '100dvh' }}
    >
      {/* ── Ambient blurred background (shows when avatar/photo selected) ── */}
      <AnimatePresence>
        {heroImage && (
          <motion.div
            key={heroImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-0"
          >
            <img
              src={heroImage}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: 'blur(72px) saturate(1.6)', transform: 'scale(1.25)' }}
            />
            {/* No black overlay — just a soft bottom-fade into the dark panel */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(10,10,18,0.55) 55%, rgba(10,10,18,0.92) 100%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden camera file input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleHeroFileSelect}
        className="hidden"
      />

      {/* ── HERO — full-bleed top 62%, tap to open camera ── */}
      <div className="absolute inset-x-0 top-0 z-10" style={{ height: '62%' }}>
        <div className="block w-full h-full cursor-pointer relative" onClick={handleHeroTap}>
          {heroImage ? (
            <img src={heroImage} alt="Profile photo" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-4"
              style={{ background: 'linear-gradient(180deg, rgba(42,27,78,0.9) 0%, rgba(10,7,32,0.95) 100%)' }}
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

        {/* iOS-style progressive blur — pure blur only, no color overlay */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '80%' }}>
          <div className="absolute inset-0" style={{
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
          }} />
          <div className="absolute inset-x-0 bottom-0" style={{ height: '82%',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
          }} />
          <div className="absolute inset-x-0 bottom-0" style={{ height: '62%',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
          }} />
          <div className="absolute inset-x-0 bottom-0" style={{ height: '42%',
            backdropFilter: 'blur(38px)',
            WebkitBackdropFilter: 'blur(38px)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)',
          }} />
          <div className="absolute inset-x-0 bottom-0" style={{ height: '22%',
            backdropFilter: 'blur(60px)',
            WebkitBackdropFilter: 'blur(60px)',
          }} />
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

      {/* ── BOTTOM PANEL ── */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col z-10" style={{ top: '56%' }}>
        {/* Name input */}
        <div className="flex flex-col items-center px-6 mt-4">
          <input
            type="text"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); if (nameError) setNameError(null); }}
            placeholder="Your Name"
            disabled={loading}
            maxLength={50}
            className="w-full text-center text-white text-3xl font-bold bg-transparent outline-none placeholder:text-white/25 border-0"
            style={{ caretColor: 'white' }}
          />
          {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-6 mt-5 mb-3">
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
