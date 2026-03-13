import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Eye, EyeOff, ImagePlus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { z } from 'zod';
import AvatarCropper from '@/components/AvatarCropper';

const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name too long');

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';

  const { user, signOut } = useAuth();
  const { profile, updateProfile, needsSetup, loading: profileLoading } = useProfile();

  const [displayName, setDisplayName] = useState('');
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [storiesPublic, setStoriesPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
      if (storedUrl) {
        setCustomAvatarPreview(storedUrl);
      }
      setIsInitialized(true);
    } else if (!editMode) {
      setIsInitialized(true);
    }
  }, [editMode, profile, isInitialized]);

  // Tap hero → open gallery (more natural for profile photo)
  const handleHeroTap = () => galleryInputRef.current?.click();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('Image must be less than 20MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropImageSrc(ev.target?.result as string);
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
        setCropImageSrc(null);
      });
  };

  const handleCropCancel = () => setCropImageSrc(null);

  const hasPhoto = customAvatarFile !== null || customAvatarPreview !== null;
  const heroImage = customAvatarPreview;

  const handleSubmit = async () => {
    const nameResult = nameSchema.safeParse(displayName);
    if (!nameResult.success) { setNameError(nameResult.error.errors[0].message); return; }
    if (!hasPhoto) { toast.error('Please add your photo'); return; }
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
      {/* ── Ambient blurred background ── */}
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
        <div className="absolute inset-0" style={{ background: 'rgba(10,10,18,0.45)' }} />
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* ── HERO — tap to upload photo ── */}
      <div className="relative z-10 w-full flex-shrink-0" style={{ aspectRatio: '3 / 4', minHeight: '75vw' }}>
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
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '2px dashed rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(10px)',
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Camera className="w-10 h-10 text-white/40" />
              </motion.div>
              <p className="text-white/40 text-sm tracking-wide font-medium">Tap to add your photo</p>
            </div>
          )}

          {/* Edit overlay when photo exists */}
          {heroImage && editMode && (
            <div
              className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
              style={{ bottom: '70px' }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <Camera className="w-5 h-5 text-white" />
              </div>
              
            </div>
          )}
          {heroImage && !editMode && (
            <div
              className="absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <Camera className="w-4.5 h-4.5 text-white" />
            </div>
          )}
        </div>

        {/* ✕ Close / Back button */}
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
      <div className="relative z-10 flex flex-col flex-1">
        {/* Title + Subtitle */}
        <div className="flex flex-col items-center px-6 mb-2" style={{ marginTop: '-80px' }}>
          {!editMode && (
            <h1
              className="text-center font-black text-white uppercase leading-tight"
              style={{ fontSize: '2rem', letterSpacing: '-0.02em' }}
            >
              India's Ultimate{'\n'}Habit Builder.
            </h1>
          )}
          {!editMode && <p className="text-white/50 text-base mt-3 text-center">What should we call you?</p>}
        </div>

        {/* Name input */}
        <div className="flex flex-col items-center px-6 mt-2 mb-5">
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

        {/* Upload buttons — Camera + Gallery side by side (signup only) */}
        {!editMode && (
          <div className="px-6 mb-5">
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => cameraInputRef.current?.click()}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <Camera className="w-5 h-5 text-white/70" />
                <span className="text-white/70 text-sm font-medium">Camera</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => galleryInputRef.current?.click()}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <ImagePlus className="w-5 h-5 text-white/70" />
                <span className="text-white/70 text-sm font-medium">Gallery</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* Stories toggle */}
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

        {/* Submit CTA */}
        <div className="px-6 pb-safe">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading || !displayName.trim() || !hasPhoto}
            className="w-full py-4 rounded-2xl font-semibold text-white transition-all duration-200 disabled:opacity-40 relative overflow-hidden"
            style={{
              background: hasPhoto && displayName.trim()
                ? 'linear-gradient(135deg, #F97316 0%, #EC4899 100%)'
                : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: hasPhoto && displayName.trim()
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

export default ProfileSetupPage;