import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Camera, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { z } from 'zod';

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

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get('edit') === 'true';
  
  const { user } = useAuth();
  const { profile, updateProfile, needsSetup } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if profile already exists and not in edit mode
  useEffect(() => {
    if (!editMode && !needsSetup && profile) {
      navigate('/', { replace: true });
    }
  }, [editMode, needsSetup, profile, navigate]);

  // Pre-fill data in edit mode
  useEffect(() => {
    if (editMode && profile) {
      setDisplayName(profile.display_name);
      const presetMatch = PRESET_AVATARS.find(a => profile.avatar_url.includes(a.id) || profile.avatar_url === a.src);
      if (presetMatch) {
        setSelectedAvatar(presetMatch.id);
      } else if (profile.avatar_url) {
        setCustomAvatarPreview(profile.avatar_url);
      }
    }
  }, [editMode, profile]);

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

    setCustomAvatarFile(file);
    setSelectedAvatar(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const selectPresetAvatar = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    setCustomAvatarFile(null);
    setCustomAvatarPreview(null);
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
        const preset = PRESET_AVATARS.find(a => a.id === selectedAvatar);
        avatarUrl = preset?.src || '';
      } else {
        avatarUrl = customAvatarPreview || '';
      }

      if (editMode) {
        await updateProfile({
          display_name: displayName.trim(),
          avatar_url: avatarUrl,
        });
        toast.success('Profile updated!');
        navigate(-1);
      } else {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: displayName.trim(),
            avatar_url: avatarUrl,
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

  const avatarPreview = getCurrentAvatarPreview();

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-auto"
      style={{
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        background: '#0a0a12',
      }}
    >
      {/* Animated gradient orbs background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[350px] h-[350px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(160, 84%, 39%) 0%, transparent 70%)',
            filter: 'blur(100px)',
            top: '-15%',
            left: '-20%',
            opacity: 0.3,
          }}
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(280, 60%, 50%) 0%, transparent 70%)',
            filter: 'blur(80px)',
            bottom: '5%',
            right: '-15%',
            opacity: 0.25,
          }}
          animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[200px] h-[200px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(200, 80%, 50%) 0%, transparent 70%)',
            filter: 'blur(60px)',
            top: '40%',
            right: '10%',
            opacity: 0.2,
          }}
          animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div 
        className="flex-1 flex flex-col px-6 relative z-10"
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top), 48px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 32px)',
        }}
      >
        {/* Close button for edit mode */}
        {editMode && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-20"
            style={{
              marginTop: 'max(env(safe-area-inset-top), 12px)',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <X className="w-5 h-5 text-white/70" />
          </motion.button>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {editMode ? 'Edit your profile' : 'Choose profile picture'}
          </h1>
          <p className="text-white/50 text-sm">
            Choose a photo that represents you!
          </p>
        </div>

        {/* Large Avatar Upload - Liquid Glass Hero */}
        <div className="flex flex-col items-center mb-8">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Outer glow container */}
          <motion.div
            className="relative"
            animate={!avatarPreview ? {
              boxShadow: [
                '0 0 40px 10px rgba(99, 102, 241, 0.15)',
                '0 0 60px 20px rgba(99, 102, 241, 0.25)',
                '0 0 40px 10px rgba(99, 102, 241, 0.15)',
              ],
            } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ borderRadius: '50%' }}
          >
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-44 h-44 rounded-full overflow-hidden"
              style={{
                background: avatarPreview 
                  ? 'transparent' 
                  : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
                backdropFilter: avatarPreview ? 'none' : 'blur(20px)',
                WebkitBackdropFilter: avatarPreview ? 'none' : 'blur(20px)',
                border: avatarPreview 
                  ? '3px solid rgba(255, 255, 255, 0.15)' 
                  : '2px solid rgba(255, 255, 255, 0.2)',
                boxShadow: avatarPreview 
                  ? '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)' 
                  : 'inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.2)',
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={loading}
            >
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  {/* Animated camera icon */}
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Camera className="w-12 h-12 text-white/50" strokeWidth={1.5} />
                  </motion.div>
                  <span className="text-white/40 text-xs font-medium">Tap to upload</span>
                </div>
              )}
              
              {/* Plus button overlay - Liquid glass style */}
              <motion.div 
                className="absolute bottom-2 right-2 w-11 h-11 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
              </motion.div>
              
              {/* Shimmer effect on empty state */}
              {!avatarPreview && (
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                />
              )}
            </motion.button>
          </motion.div>

          {/* Selected indicator */}
          <AnimatePresence>
            {hasAvatarSelected && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  background: 'rgba(52, 211, 153, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                }}
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">Photo selected</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/40 text-sm">or choose a preset avatar</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Preset Avatars Grid - 4x2 */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {PRESET_AVATARS.map((avatar) => (
            <motion.button
              key={avatar.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => selectPresetAvatar(avatar.id)}
              disabled={loading}
              className="relative aspect-square rounded-full overflow-hidden"
              style={{
                border: selectedAvatar === avatar.id 
                  ? '3px solid hsl(160, 84%, 50%)' 
                  : '2px solid rgba(255, 255, 255, 0.1)',
                boxShadow: selectedAvatar === avatar.id 
                  ? '0 0 20px rgba(52, 211, 153, 0.3)' 
                  : 'none',
              }}
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
                    className="absolute inset-0 flex items-center justify-center bg-black/30"
                  >
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, hsl(160, 84%, 39%) 0%, hsl(172, 66%, 50%) 100%)',
                      }}
                    >
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {/* Name Input - Liquid Glass */}
        <div 
          className="rounded-2xl p-4 mb-6"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)',
          }}
        >
          <label className="text-white/50 text-xs mb-2 block">Your Name</label>
          <Input
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="Enter your name"
            className="h-12 bg-transparent border-none text-white text-lg placeholder:text-white/30 focus-visible:ring-0 px-0"
            disabled={loading}
            maxLength={50}
          />
          {nameError && (
            <p className="text-red-400 text-xs mt-2">{nameError}</p>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Submit Button - Liquid Glass with Shimmer */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={loading || !displayName.trim() || !hasAvatarSelected}
          className="w-full py-4 rounded-2xl font-semibold text-white transition-all duration-200 disabled:opacity-40 relative overflow-hidden"
          style={{
            background: hasAvatarSelected && displayName.trim()
              ? 'linear-gradient(135deg, hsl(160, 84%, 39%) 0%, hsl(172, 66%, 50%) 100%)'
              : 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: hasAvatarSelected && displayName.trim()
              ? '0 8px 32px rgba(52, 211, 153, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
              : 'inset 0 1px 1px rgba(255,255,255,0.1)',
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
          />
          <span className="relative z-10 text-lg">
            {loading ? 'Saving...' : (editMode ? 'Save Changes' : 'Continue')}
          </span>
        </motion.button>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
