import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Camera, X, Eye, EyeOff, LogOut } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { z } from 'zod';

// Import preset avatars - color + sport themed
import avatarRed from '@/assets/avatars/avatar-red.png';
import avatarBlue from '@/assets/avatars/avatar-blue.png';
import avatarPurple from '@/assets/avatars/avatar-purple.png';
import avatarGreen from '@/assets/avatars/avatar-green.png';
import avatarOrange from '@/assets/avatars/avatar-orange.png';
import avatarTeal from '@/assets/avatars/avatar-teal.png';
import avatarPink from '@/assets/avatars/avatar-pink.png';
import avatarYellow from '@/assets/avatars/avatar-yellow.png';
import avatarBoxer from '@/assets/avatars/boxer.png';
import avatarCyclist from '@/assets/avatars/cyclist.png';
import avatarRunner from '@/assets/avatars/runner.png';
import avatarSwimmer from '@/assets/avatars/swimmer.png';
import avatarWeightlifter from '@/assets/avatars/weightlifter.png';
import avatarYogi from '@/assets/avatars/yogi.png';

const PRESET_AVATARS = [
  { id: 'red', src: avatarRed },
  { id: 'blue', src: avatarBlue },
  { id: 'purple', src: avatarPurple },
  { id: 'green', src: avatarGreen },
  { id: 'orange', src: avatarOrange },
  { id: 'teal', src: avatarTeal },
  { id: 'pink', src: avatarPink },
  { id: 'yellow', src: avatarYellow },
  { id: 'boxer', src: avatarBoxer },
  { id: 'cyclist', src: avatarCyclist },
  { id: 'runner', src: avatarRunner },
  { id: 'swimmer', src: avatarSwimmer },
  { id: 'weightlifter', src: avatarWeightlifter },
  { id: 'yogi', src: avatarYogi },
];

const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters');

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if profile already exists and not in edit mode - only after loading is done
  useEffect(() => {
    if (profileLoading) return;
    if (!editMode && !needsSetup && profile) {
      navigate('/', { replace: true });
    }
  }, [editMode, needsSetup, profile, navigate, profileLoading]);

  // Pre-fill data in edit mode - only once
  useEffect(() => {
    if (isInitialized) return;
    if (editMode && profile) {
      setDisplayName(profile.display_name);
      setStoriesPublic(profile.stories_public ?? true);
      const presetMatch = PRESET_AVATARS.find(a => profile.avatar_url.includes(a.id) || profile.avatar_url === a.src);
      if (presetMatch) {
        setSelectedAvatar(presetMatch.id);
      } else if (profile.avatar_url) {
        setCustomAvatarPreview(profile.avatar_url);
      }
      setIsInitialized(true);
    } else if (!editMode) {
      setIsInitialized(true);
    }
  }, [editMode, profile, isInitialized]);

  // Check for cropped image from avatar cropper on mount only
  useEffect(() => {
    const checkForCroppedImage = () => {
      const croppedImage = sessionStorage.getItem('croppedAvatarImage');
      if (croppedImage) {
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

    checkForCroppedImage();
    window.addEventListener('focus', checkForCroppedImage);
    return () => window.removeEventListener('focus', checkForCroppedImage);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;

    setSelectedAvatar(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const imageData = evt.target?.result as string;
      navigate('/avatar-crop', { 
        state: { 
          imageData,
          returnTo: '/profile-setup' + (editMode ? '?edit=true' : ''),
        }
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const selectPresetAvatar = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    setCustomAvatarFile(null);
    setCustomAvatarPreview(null);
  };

  const hasAvatarSelected = selectedAvatar !== null || customAvatarFile !== null || customAvatarPreview !== null;
  
  const avatarPreview = useMemo(() => {
    if (customAvatarPreview) return customAvatarPreview;
    if (selectedAvatar) {
      const preset = PRESET_AVATARS.find(a => a.id === selectedAvatar);
      return preset?.src;
    }
    return null;
  }, [customAvatarPreview, selectedAvatar]);

  const handleSubmit = async () => {
    const nameResult = nameSchema.safeParse(displayName);
    if (!nameResult.success) {
      setNameError(nameResult.error.errors[0].message);
      return;
    }

    if (!hasAvatarSelected || !user) return;

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
          stories_public: storiesPublic,
        });
        navigate(-1);
      } else {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: displayName.trim(),
            avatar_url: avatarUrl,
            stories_public: storiesPublic,
          });

        if (insertError) throw insertError;
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show nothing while checking profile status
  if (profileLoading) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: '#0a0a12' }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-auto"
      style={{
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        background: '#0a0a12',
      }}
    >
      {/* Static gradient background - no animations for performance */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 10% 20%, hsla(160, 84%, 39%, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 90% 80%, hsla(280, 60%, 50%, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 80% 30%, hsla(200, 80%, 50%, 0.15) 0%, transparent 40%)
          `,
        }}
      />

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
          <button
            onClick={() => navigate('/', { replace: true })}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-20 active:scale-95 transition-transform"
            style={{
              marginTop: 'max(env(safe-area-inset-top), 12px)',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {editMode ? 'Edit your profile' : 'Choose profile picture'}
          </h1>
          <p className="text-white/50 text-sm">
            Choose a photo that represents you!
          </p>
        </div>

        {/* Avatar Display + Upload Button */}
        <div className="flex flex-col items-center mb-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0 }}
          />
          
          {/* Avatar Display Circle - clickable to upload */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }}
            className="relative w-28 h-28 rounded-full overflow-hidden mb-3 cursor-pointer active:scale-95 transition-transform"
            style={{
              background: avatarPreview 
                ? 'transparent' 
                : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
              border: avatarPreview 
                ? '3px solid rgba(255, 255, 255, 0.2)' 
                : '2px solid rgba(255, 255, 255, 0.15)',
              boxShadow: avatarPreview 
                ? '0 12px 40px rgba(0,0,0,0.5)' 
                : 'inset 0 2px 4px rgba(255,255,255,0.05)',
            }}
          >
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt="Avatar preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-10 h-10 text-white/25" strokeWidth={1.5} />
              </div>
            )}
          </button>

          {/* Upload Photo Button */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }}
            className="relative flex items-center gap-2 px-5 py-2.5 rounded-full overflow-hidden active:scale-95 transition-transform cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2)',
              opacity: loading ? 0.5 : 1,
              pointerEvents: loading ? 'none' as const : 'auto' as const,
            }}
          >
            <Camera className="w-4 h-4 text-white/90" strokeWidth={2} />
            <span className="text-white font-medium text-sm">Upload Photo</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/40 text-xs">or choose a preset</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Preset Avatars - Horizontal Scroll */}
        <div className="mb-6 -mx-6">
          <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            {PRESET_AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => selectPresetAvatar(avatar.id)}
                disabled={loading}
                className="relative flex-shrink-0 w-16 h-16 rounded-full overflow-hidden active:scale-95 transition-transform"
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
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/30"
                    >
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, hsl(160, 84%, 39%) 0%, hsl(172, 66%, 50%) 100%)',
                        }}
                      >
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>
        </div>

        {/* Name Input - centered single line */}
        <div className="flex flex-col items-center mb-6">
          <input
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="Enter your name"
            className="w-full h-12 bg-transparent text-white text-lg text-center placeholder:text-white/30 focus:outline-none border-b border-white/15 focus:border-white/40 transition-colors"
            disabled={loading}
            maxLength={50}
          />
          {nameError && (
            <p className="text-red-400 text-xs mt-2">{nameError}</p>
          )}
        </div>

        {editMode && (
          <div 
            className="rounded-2xl p-4 mb-6"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {storiesPublic ? (
                  <Eye className="w-5 h-5 text-emerald-400" />
                ) : (
                  <EyeOff className="w-5 h-5 text-white/50" />
                )}
                <div>
                  <p className="text-white font-medium text-sm">Stories Visibility</p>
                  <p className="text-white/50 text-xs mt-0.5">
                    {storiesPublic ? 'Visible to community' : 'Only you can see'}
                  </p>
                </div>
              </div>
              <Switch
                checked={storiesPublic}
                onCheckedChange={setStoriesPublic}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !displayName.trim() || !hasAvatarSelected}
          className="w-full py-4 rounded-2xl font-semibold text-white transition-all duration-200 disabled:opacity-40 relative overflow-hidden active:scale-98"
          style={{
            background: hasAvatarSelected && displayName.trim()
              ? 'linear-gradient(135deg, hsl(160, 84%, 39%) 0%, hsl(172, 66%, 50%) 100%)'
              : 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: hasAvatarSelected && displayName.trim()
              ? '0 8px 32px rgba(52, 211, 153, 0.3)'
              : 'none',
          }}
        >
          <span className="text-lg">
            {loading ? 'Saving...' : (editMode ? 'Save Changes' : 'Continue')}
          </span>
        </button>

        {/* Back to Login - only in setup mode */}
        {!editMode && (
          <div className="flex justify-center mt-4">
            <button
              onClick={async () => {
                await signOut();
                navigate('/auth', { replace: true });
              }}
              disabled={loading}
              className="flex items-center gap-2 text-white/40 hover:text-white/70 active:scale-95 transition-all py-2 text-sm"
            >
              <LogOut size={15} />
              <span>Back to Login</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSetupPage;
