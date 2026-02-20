import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Camera, X, ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useProfile, Profile } from '@/hooks/use-profile';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import AvatarCropper from '@/components/AvatarCropper';

// Import Netflix-style preset avatars
import avatarRed from '@/assets/avatars/avatar-red.png';
import avatarBlue from '@/assets/avatars/avatar-blue.png';
import avatarPurple from '@/assets/avatars/avatar-purple.png';
import avatarGreen from '@/assets/avatars/avatar-green.png';
import avatarOrange from '@/assets/avatars/avatar-orange.png';
import avatarTeal from '@/assets/avatars/avatar-teal.png';
import avatarPink from '@/assets/avatars/avatar-pink.png';
import avatarYellow from '@/assets/avatars/avatar-yellow.png';

const PRESET_AVATARS = [
  { id: 'red', src: avatarRed },
  { id: 'blue', src: avatarBlue },
  { id: 'purple', src: avatarPurple },
  { id: 'green', src: avatarGreen },
  { id: 'orange', src: avatarOrange },
  { id: 'teal', src: avatarTeal },
  { id: 'pink', src: avatarPink },
  { id: 'yellow', src: avatarYellow },
];

const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters');

interface ProfileSetupProps {
  onComplete: () => void;
  editMode?: boolean;
  existingProfile?: Profile | null;
}

const ProfileSetup = ({ onComplete, editMode = false, existingProfile }: ProfileSetupProps) => {
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  // Hero photo — the full-bleed background image
  const [heroPhotoFile, setHeroPhotoFile] = useState<File | null>(null);
  const [heroPhotoPreview, setHeroPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<'avatar' | 'hero'>('avatar');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill data in edit mode
  useEffect(() => {
    if (editMode && existingProfile) {
      setDisplayName(existingProfile.display_name);
      const storedUrl = existingProfile.avatar_url;
      const presetMatch = PRESET_AVATARS.find(a =>
        storedUrl === `avatar-${a.id}` || storedUrl.includes(`avatar-${a.id}`)
      );
      if (presetMatch) {
        setSelectedAvatar(presetMatch.id);
      } else if (storedUrl) {
        setCustomAvatarPreview(storedUrl);
        // Also use as hero if no dedicated hero
        setHeroPhotoPreview(storedUrl);
      }
    }
  }, [editMode, existingProfile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be less than 10MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target?.result as string;
      setCropMode('avatar');
      setCropImageSrc(imageData);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleHeroFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('Image must be less than 20MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target?.result as string;
      // Use directly without crop for hero photo (full bleed)
      setHeroPhotoPreview(imageData);
      // Convert blob to File
      fetch(imageData).then(r => r.blob()).then(blob => {
        setHeroPhotoFile(new File([blob], 'hero.jpg', { type: 'image/jpeg' }));
      });
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleCropConfirm = (croppedDataUrl: string) => {
    fetch(croppedDataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        setCustomAvatarFile(file);
        setCustomAvatarPreview(croppedDataUrl);
        // Also set as hero if none chosen
        if (!heroPhotoPreview) {
          setHeroPhotoPreview(croppedDataUrl);
          setHeroPhotoFile(file);
        }
        setSelectedAvatar(null);
        setCropImageSrc(null);
      });
  };

  const handleCropCancel = () => setCropImageSrc(null);

  const selectPresetAvatar = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    setCustomAvatarFile(null);
    setCustomAvatarPreview(null);
    // Use preset as hero background too if no dedicated hero
    const preset = PRESET_AVATARS.find(a => a.id === avatarId);
    if (preset && !heroPhotoFile) {
      setHeroPhotoPreview(preset.src);
    }
  };

  const hasAvatarSelected = selectedAvatar !== null || customAvatarFile !== null || customAvatarPreview !== null;

  const getCurrentAvatarPreview = () => {
    if (customAvatarPreview) return customAvatarPreview;
    if (selectedAvatar) {
      const preset = PRESET_AVATARS.find(a => a.id === selectedAvatar);
      return preset?.src;
    }
    return null;
  };

  const currentAvatar = getCurrentAvatarPreview();
  const heroImage = heroPhotoPreview || currentAvatar;

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
        avatarUrl = `avatar-${selectedAvatar}`;
      } else {
        avatarUrl = customAvatarPreview || '';
      }

      if (editMode) {
        await updateProfile({ display_name: displayName.trim(), avatar_url: avatarUrl });
        toast.success('Profile updated!');
      } else {
        const { error: insertError } = await supabase.from('profiles').insert({
          user_id: user.id,
          display_name: displayName.trim(),
          avatar_url: avatarUrl,
        });
        if (insertError) throw insertError;
        toast.success('Profile created!');
      }
      onComplete();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (editMode) navigate(-1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: '#0a0a12', height: '100dvh' }}
    >
      {/* ─── HERO PHOTO — full bleed, top ~58% of screen ─── */}
      <div className="absolute inset-x-0 top-0" style={{ height: '60%' }}>
        {heroImage ? (
          <img
            src={heroImage}
            alt="Profile hero"
            className="w-full h-full object-cover"
          />
        ) : (
          /* Empty state — tap to add cover photo */
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-3"
            style={{ background: 'linear-gradient(180deg, #1a1030 0%, #0d0818 100%)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px dashed rgba(255,255,255,0.2)' }}
            >
              <ImageIcon className="w-7 h-7 text-white/30" />
            </div>
            <p className="text-white/30 text-sm">Add a cover photo</p>
          </div>
        )}

        {/* Glass gradient mask at the bottom of hero image */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: '55%',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(10,10,18,0.6) 50%, rgba(10,10,18,0.95) 85%, #0a0a12 100%)',
          }}
        />

        {/* Change cover photo button — top right of image */}
        <div className="absolute top-safe-top right-4" style={{ top: '48px' }}>
          <input
            ref={heroInputRef}
            id="hero-upload-input"
            type="file"
            accept="image/*"
            onChange={handleHeroFileSelect}
            className="hidden"
          />
          {editMode && (
            <motion.button
              onClick={handleClose}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <X className="w-4 h-4 text-white" />
            </motion.button>
          )}
        </div>
      </div>

      {/* ─── BOTTOM GLASS PANEL ─── */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col"
        style={{ top: '52%', zIndex: 10 }}
      >
        {/* Small circular avatar — sits at the very top of the panel, overlapping the hero */}
        <div className="flex justify-center" style={{ marginTop: '-36px' }}>
          <div className="relative">
            <div
              className="w-[72px] h-[72px] rounded-full overflow-hidden flex items-center justify-center"
              style={{
                border: '3px solid rgba(255,255,255,0.3)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                background: currentAvatar ? 'transparent' : 'rgba(255,255,255,0.08)',
              }}
            >
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-7 h-7 text-white/40" />
              )}
            </div>
            {/* Upload avatar tap target */}
            <input
              ref={fileInputRef}
              id="avatar-upload-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={loading}
            />
            <label
              htmlFor="avatar-upload-input"
              className="absolute inset-0 rounded-full cursor-pointer"
              style={{ zIndex: 2 }}
            />
          </div>
        </div>

        {/* Name + Upload hint */}
        <div className="flex flex-col items-center mt-3 px-6">
          {/* Name input — large, centered */}
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

          {/* Upload photo label */}
          <label
            htmlFor="hero-upload-input"
            className="mt-1 text-white/40 text-sm cursor-pointer active:text-white/70 transition-colors"
          >
            {heroImage ? 'Change cover photo' : 'Add cover photo'}
          </label>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-6 mt-4 mb-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs tracking-wide uppercase">Choose avatar</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Preset Avatars — horizontal scrollable row */}
        <div className="px-4 mb-5">
          <div className="flex gap-3 overflow-x-auto pb-1 justify-center" style={{ scrollbarWidth: 'none' }}>
            {PRESET_AVATARS.map((avatar) => (
              <motion.button
                key={avatar.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => selectPresetAvatar(avatar.id)}
                disabled={loading}
                className="relative flex-shrink-0"
                style={{ width: 52, height: 52 }}
              >
                <div
                  className="w-full h-full rounded-full overflow-hidden"
                  style={{
                    border: selectedAvatar === avatar.id
                      ? '2.5px solid #34d399'
                      : '2px solid rgba(255,255,255,0.12)',
                    boxShadow: selectedAvatar === avatar.id ? '0 0 12px rgba(52,211,153,0.4)' : 'none',
                  }}
                >
                  <img src={avatar.src} alt={`Avatar ${avatar.id}`} className="w-full h-full object-cover" />
                </div>
                <AnimatePresence>
                  {selectedAvatar === avatar.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Upload Photo button */}
        <div className="px-6 mb-4">
          <label
            htmlFor="avatar-upload-input"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
            style={{
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)',
              opacity: loading ? 0.5 : 1,
              pointerEvents: loading ? 'none' : 'auto',
            }}
          >
            <Camera className="w-4 h-4 text-white/60" />
            <span className="text-white/70 text-sm font-medium">Upload custom photo</span>
          </label>
        </div>

        {/* Submit CTA */}
        <div className="px-6 pb-8">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading || !displayName.trim() || !hasAvatarSelected}
            className="w-full py-4 rounded-2xl font-semibold text-white transition-all duration-200 disabled:opacity-40 relative overflow-hidden"
            style={{
              background: hasAvatarSelected && displayName.trim()
                ? 'linear-gradient(135deg, hsl(160, 84%, 39%) 0%, hsl(172, 66%, 50%) 100%)'
                : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: hasAvatarSelected && displayName.trim()
                ? '0 8px 24px rgba(52,211,153,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'
                : 'inset 0 1px 1px rgba(255,255,255,0.1)',
            }}
          >
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
            />
            <span className="relative z-10">
              {loading ? (editMode ? 'Saving...' : 'Creating Profile...') : (editMode ? 'Save Changes' : 'Continue')}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Inline Avatar Cropper overlay */}
      <AnimatePresence>
        {cropImageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <AvatarCropper
              imageSrc={cropImageSrc}
              onConfirm={handleCropConfirm}
              onCancel={handleCropCancel}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfileSetup;
