import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Camera, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useProfile, Profile } from '@/hooks/use-profile';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

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
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill data in edit mode
  useEffect(() => {
    if (editMode && existingProfile) {
      setDisplayName(existingProfile.display_name);
      // Check if avatar is a preset key (e.g. 'avatar-red') or a custom upload URL
      const storedUrl = existingProfile.avatar_url;
      const presetMatch = PRESET_AVATARS.find(a => 
        storedUrl === `avatar-${a.id}` || storedUrl.includes(`avatar-${a.id}`)
      );
      if (presetMatch) {
        setSelectedAvatar(presetMatch.id);
      } else if (storedUrl) {
        setCustomAvatarPreview(storedUrl);
      }
    }
  }, [editMode, existingProfile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Read file and navigate to cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      // Navigate to avatar cropper with the image
      navigate('/avatar-crop', { 
        state: { 
          imageData,
          returnTo: '/profile-setup' + (editMode ? '?edit=true' : ''),
        }
      });
    };
    reader.readAsDataURL(file);
  };

  // Check for cropped image from camera/cropper
  useEffect(() => {
    const handleCroppedImage = () => {
      const croppedImage = sessionStorage.getItem('croppedAvatarImage');
      if (croppedImage) {
        // Convert base64 to file
        fetch(croppedImage)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
            setCustomAvatarFile(file);
            setCustomAvatarPreview(croppedImage);
            setSelectedAvatar(null);
            sessionStorage.removeItem('croppedAvatarImage');
          });
      }
    };

    handleCroppedImage();
    window.addEventListener('focus', handleCroppedImage);
    return () => window.removeEventListener('focus', handleCroppedImage);
  }, []);

  const selectPresetAvatar = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    setCustomAvatarFile(null);
    setCustomAvatarPreview(null);
  };

  const hasAvatarSelected = selectedAvatar !== null || customAvatarFile !== null || customAvatarPreview !== null;

  // Get current avatar preview
  const getCurrentAvatarPreview = () => {
    if (customAvatarPreview) return customAvatarPreview;
    if (selectedAvatar) {
      const preset = PRESET_AVATARS.find(a => a.id === selectedAvatar);
      return preset?.src;
    }
    return null;
  };

  const currentAvatar = getCurrentAvatarPreview();

  const handleSubmit = async () => {
    const nameResult = nameSchema.safeParse(displayName);
    if (!nameResult.success) {
      setNameError(nameResult.error.errors[0].message);
      return;
    }

    if (!hasAvatarSelected) {
      toast.error('Please select an avatar');
      return;
    }

    if (!user) {
      toast.error('No user logged in');
      return;
    }

    setLoading(true);

    try {
      let avatarUrl: string;

      if (customAvatarFile) {
        // Upload custom avatar to storage
        const fileExt = customAvatarFile.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('journey-uploads')
          .upload(fileName, customAvatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('journey-uploads')
          .getPublicUrl(fileName);

        avatarUrl = urlData.publicUrl;
      } else if (selectedAvatar) {
        // Save the stable key (e.g. 'avatar-red') not the Vite-hashed path.
        // ProfileAvatar resolves the key back to the correct hashed asset URL at render time.
        avatarUrl = `avatar-${selectedAvatar}`;
      } else {
        // Keep existing custom avatar
        avatarUrl = customAvatarPreview || '';
      }

      if (editMode) {
        // Update existing profile
        await updateProfile({
          display_name: displayName.trim(),
          avatar_url: avatarUrl,
        });
        toast.success('Profile updated!');
      } else {
        // Create profile in database
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
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
    if (editMode) {
      navigate(-1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col p-4 relative overflow-hidden"
      style={{ background: '#0a0a12' }}
    >
      {/* Animated gradient orbs background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(160, 84%, 39%) 0%, transparent 70%)',
            filter: 'blur(80px)',
            top: '-10%',
            left: '-15%',
            opacity: 0.35,
          }}
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[250px] h-[250px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(280, 60%, 50%) 0%, transparent 70%)',
            filter: 'blur(70px)',
            bottom: '10%',
            right: '-10%',
            opacity: 0.25,
          }}
          animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Close button for edit mode */}
      {editMode && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <X className="w-5 h-5 text-white/70" />
        </motion.button>
      )}

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full relative z-10 pt-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">
            {editMode ? 'Edit your profile' : 'Complete Your Profile'}
          </h1>
          <p className="text-white/50 text-sm">
            {editMode ? 'Choose a photo that represents you!' : 'Add your name and choose an avatar'}
          </p>
        </div>

        {/* Large Avatar Preview */}
        <div className="flex justify-center mb-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="relative"
          >
            <div 
              className="w-36 h-36 rounded-full overflow-hidden flex items-center justify-center"
              style={{
                background: currentAvatar ? 'transparent' : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                border: '3px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
            >
              {currentAvatar ? (
                <img 
                  src={currentAvatar} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white/40" />
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Name Input — below avatar pic */}
        <div className="mb-5">
          <Input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="Your name"
            className="h-12 text-white placeholder:text-white/30 rounded-xl focus:border-emerald-400/50 focus:ring-emerald-400/20 text-center bg-transparent border-0 border-b border-white/20 rounded-none text-lg font-medium"
            disabled={loading}
            maxLength={50}
          />
          {nameError && (
            <p className="text-red-400 text-xs mt-1 text-center">{nameError}</p>
          )}
        </div>

        {/* Upload Photo Button */}
        <div className="flex justify-center mb-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <Camera className="w-5 h-5 text-white/80" />
            <span className="text-white/80 font-medium">Upload Photo</span>
          </motion.button>
        </div>

        {/* Or Divider */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/40 text-sm">or choose a preset</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Preset Avatars Grid - 4 columns */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {PRESET_AVATARS.map((avatar) => (
            <motion.button
              key={avatar.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => selectPresetAvatar(avatar.id)}
              disabled={loading}
              className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all ${
                selectedAvatar === avatar.id
                  ? 'border-green-500 ring-2 ring-green-500/30'
                  : 'border-transparent hover:border-white/30'
              }`}
            >
              <img
                src={avatar.src}
                alt={`Avatar ${avatar.id}`}
                className="w-full h-full object-cover"
              />
              <AnimatePresence>
                {selectedAvatar === avatar.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/40"
                  >
                    <Check className="w-6 h-6 text-green-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {/* Submit Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={loading || !displayName.trim() || !hasAvatarSelected}
          className="w-full py-4 rounded-2xl font-semibold text-white transition-all duration-200 disabled:opacity-50 relative overflow-hidden"
          style={{
            background: hasAvatarSelected && displayName.trim()
              ? 'linear-gradient(135deg, hsl(160, 84%, 39%) 0%, hsl(172, 66%, 50%) 100%)'
              : 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: hasAvatarSelected && displayName.trim()
              ? '0 8px 24px rgba(52, 211, 153, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)'
              : 'inset 0 1px 1px rgba(255,255,255,0.1)',
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
          />
          <span className="relative z-10">
            {loading ? (editMode ? 'Saving...' : 'Creating Profile...') : (editMode ? 'Save Changes' : 'Continue')}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProfileSetup;
