import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useProfile, Profile } from '@/hooks/use-profile';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import AvatarCropper from '@/components/AvatarCropper';


// HD hero image for default state
import curoBoxingHd from '@/assets/avatars/curo-boxing-hd.png';

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
  
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [heroPhotoFile, setHeroPhotoFile] = useState<File | null>(null);
  const [heroPhotoPreview, setHeroPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill data in edit mode
  useEffect(() => {
    if (editMode && existingProfile) {
      setDisplayName(existingProfile.display_name);
      const storedUrl = existingProfile.avatar_url;
      if (storedUrl) {
        setCustomAvatarPreview(storedUrl);
        setHeroPhotoPreview(storedUrl);
      }
    }
  }, [editMode, existingProfile]);

  // Tap the hero → directly open camera
  const handleHeroTap = () => {
    cameraInputRef.current?.click();
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
        
        setCropImageSrc(null);
      });
  };

  const handleCropCancel = () => setCropImageSrc(null);

  const hasAvatarSelected = customAvatarFile !== null || customAvatarPreview !== null;

  const heroImage = heroPhotoPreview || customAvatarPreview;

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
      {/* ─── BLURRED BACKGROUND — shows selected avatar/photo with blur + 10% black overlay ─── */}
      <AnimatePresence>
        {heroImage && (
          <motion.div
            key={heroImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-0"
          >
            <img
              src={heroImage}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: 'blur(48px)', transform: 'scale(1.15)' }}
            />
            {/* 10% black overlay */}
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HERO PHOTO — full bleed top ~62% of screen, tap to open camera directly ─── */}
      <div className="absolute inset-x-0 top-0 z-10" style={{ height: '62%' }}>

        {/* Hidden camera file input — opens native camera directly */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleHeroFileSelect}
          className="hidden"
        />

        {/* Full-bleed square photo area — tappable → opens camera */}
        <div
          className="block w-full h-full cursor-pointer relative"
          onClick={handleHeroTap}
        >
          {heroImage ? (
            <img
              src={heroImage}
              alt="Profile photo"
              className="w-full h-full object-cover"
              style={{ display: 'block' }}
            />
          ) : (
            /* Default empty state */
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
        </div>

        {/* Glass gradient mask — bottom of hero fades into content */}
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
        className="absolute inset-x-0 bottom-0 flex flex-col z-10"
        style={{ top: '56%' }}
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

        {/* Add Photo buttons */}
        <div className="px-6 mt-5 mb-5">
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => cameraInputRef.current?.click()}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Camera className="w-5 h-5 text-white/60" />
              <span className="text-white/70 text-sm font-medium">Camera</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
                  if (file.size > 20 * 1024 * 1024) { toast.error('Image must be less than 20MB'); return; }
                  const reader = new FileReader();
                  reader.onload = (ev) => setCropImageSrc(ev.target?.result as string);
                  reader.readAsDataURL(file);
                };
                input.click();
              }}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              <span className="text-white/70 text-sm font-medium">Gallery</span>
            </motion.button>
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
