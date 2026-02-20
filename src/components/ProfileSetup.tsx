import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Camera, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useProfile, Profile } from '@/hooks/use-profile';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import AvatarCropper from '@/components/AvatarCropper';


// New 3D character preset avatars
import presetOrange from '@/assets/avatars/preset-orange.png';
import presetRedgirl from '@/assets/avatars/preset-redgirl.png';
import presetEdgy from '@/assets/avatars/preset-edgy.png';

// Fallback to color avatars for remaining slots
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
  const [heroPhotoFile, setHeroPhotoFile] = useState<File | null>(null);
  const [heroPhotoPreview, setHeroPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill data in edit mode
  useEffect(() => {
    if (editMode && existingProfile) {
      setDisplayName(existingProfile.display_name);
      const storedUrl = existingProfile.avatar_url;
      const presetMatch = PRESET_AVATARS.find(a =>
        storedUrl === a.id || storedUrl === `avatar-${a.id}` || storedUrl.includes(`avatar-${a.id}`)
      );
      if (presetMatch) {
        setSelectedAvatar(presetMatch.id);
      } else if (storedUrl) {
        setCustomAvatarPreview(storedUrl);
        setHeroPhotoPreview(storedUrl);
      }
    }
  }, [editMode, existingProfile]);

  // Handle file selected from gallery/camera (for hero/avatar combined)
  const handleMediaSelected = (file: File | null, dataUrl: string) => {
    if (!file && !dataUrl) return;
    // Open cropper with the selected image
    setCropImageSrc(dataUrl || '');
    setShowPhotoSheet(false);
  };

  // Handle native file input for hero photo (gallery fallback)
  const handleHeroFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('Image must be less than 20MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target?.result as string;
      setCropImageSrc(imageData);
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
        setHeroPhotoPreview(croppedDataUrl);
        setHeroPhotoFile(file);
        setSelectedAvatar(null);
        setCropImageSrc(null);
      });
  };

  const handleCropCancel = () => setCropImageSrc(null);

  const selectPresetAvatar = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    setCustomAvatarFile(null);
    setCustomAvatarPreview(null);
    const preset = PRESET_AVATARS.find(a => a.id === avatarId);
    if (preset) {
      setHeroPhotoPreview(preset.src);
      setHeroPhotoFile(null);
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
        avatarUrl = selectedAvatar.startsWith('preset-') ? selectedAvatar : `avatar-${selectedAvatar}`;
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
      {/* ─── HERO PHOTO — full bleed top ~62% of screen, tappable to open camera/gallery ─── */}
      <div className="absolute inset-x-0 top-0" style={{ height: '62%' }}>

        {/* Hidden native file input (fallback) */}
        <input
          ref={heroInputRef}
          id="hero-upload-input"
          type="file"
          accept="image/*"
          onChange={handleHeroFileSelect}
          className="hidden"
        />

        {/* Full-bleed square photo area — tappable */}
        <label
          htmlFor="hero-upload-input"
          className="block w-full h-full cursor-pointer relative"
          onClick={(e) => {
            e.preventDefault();
            setShowPhotoSheet(true);
          }}
        >
          {heroImage ? (
            <img
              src={heroImage}
              alt="Profile photo"
              className="w-full h-full object-cover"
              style={{ display: 'block' }}
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-4"
              style={{ background: 'linear-gradient(180deg, #1e1040 0%, #0d0820 100%)' }}
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

          {/* Edit icon overlay when photo exists */}
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
        </label>

        {/* Glass gradient mask — bottom of hero */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: '50%',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(10,10,18,0.55) 45%, rgba(10,10,18,0.92) 80%, #0a0a12 100%)',
          }}
        />

        {/* Close button (edit mode only) */}
        {editMode && (
          <motion.button
            onClick={handleClose}
            whileTap={{ scale: 0.95 }}
            className="absolute w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              top: '48px',
              right: '16px',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.15)',
              zIndex: 5,
            }}
          >
            <X className="w-4 h-4 text-white" />
          </motion.button>
        )}
      </div>

      {/* ─── BOTTOM PANEL ─── */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col"
        style={{ top: '56%', zIndex: 10 }}
      >
        {/* Name input — large, centered */}
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

        {/* Preset Avatars — horizontal scrollable row, square tiles */}
        <div className="px-4 mb-5">
          <div
            className="flex gap-2.5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {PRESET_AVATARS.map((avatar) => (
              <motion.button
                key={avatar.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => selectPresetAvatar(avatar.id)}
                disabled={loading}
                className="relative flex-shrink-0"
                style={{ width: 60, height: 60 }}
              >
                {/* Square tile */}
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
                  <img
                    src={avatar.src}
                    alt={`Avatar ${avatar.id}`}
                    className="w-full h-full object-cover"
                  />
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

        {/* Submit CTA */}
        <div className="px-6 pb-10">
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
            }}
          >
            <motion.div
              className="absolute inset-0 opacity-25"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
            />
            <span className="relative z-10 text-base">
              {loading ? (editMode ? 'Saving...' : 'Creating Profile...') : (editMode ? 'Save Changes' : 'Continue')}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Inline Camera / Gallery picker sheet */}
      <AnimatePresence>
        {showPhotoSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setShowPhotoSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 p-5 pb-10"
              style={{
                background: 'rgba(18,14,32,0.96)',
                backdropFilter: 'blur(40px)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px 24px 0 0',
              }}
            >
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-2" />
              <p className="text-white/60 text-xs uppercase tracking-widest text-center mb-1">Add Profile Photo</p>

              {/* Camera option */}
              <label
                htmlFor="camera-capture-input"
                className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setShowPhotoSheet(false)}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.15)' }}>
                  <Camera className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Take Photo</p>
                  <p className="text-white/40 text-xs">Open camera</p>
                </div>
              </label>
              <input
                id="camera-capture-input"
                type="file"
                accept="image/*"
                capture="user"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setCropImageSrc(ev.target?.result as string);
                  reader.readAsDataURL(file);
                  if (e.target) e.target.value = '';
                }}
                className="hidden"
              />

              {/* Gallery option */}
              <label
                htmlFor="gallery-select-input"
                className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setShowPhotoSheet(false)}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Choose from Gallery</p>
                  <p className="text-white/40 text-xs">Pick from your photos</p>
                </div>
              </label>
              <input
                id="gallery-select-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setCropImageSrc(ev.target?.result as string);
                    setShowPhotoSheet(false);
                  };
                  reader.readAsDataURL(file);
                  if (e.target) e.target.value = '';
                }}
                className="hidden"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
