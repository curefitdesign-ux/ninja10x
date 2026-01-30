import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Upload, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
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

interface ProfileSetupProps {
  onComplete: () => void;
}

const ProfileSetup = ({ onComplete }: ProfileSetupProps) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const hasAvatarSelected = selectedAvatar !== null || customAvatarFile !== null;

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
      } else {
        // Use preset avatar - store the preset ID as a marker
        const preset = PRESET_AVATARS.find(a => a.id === selectedAvatar);
        avatarUrl = preset?.src || '';
      }

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
      onComplete();
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast.error(error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col bg-gradient-to-br from-black via-gray-900 to-black p-4"
    >
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
          >
            <User className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-white/60 text-sm">Add your name and choose an avatar</p>
        </div>

        {/* Name Input */}
        <div className="mb-6">
          <Label htmlFor="displayName" className="text-white/80 mb-2 block">
            Your Name *
          </Label>
          <Input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="Enter your name"
            className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
            disabled={loading}
            maxLength={50}
          />
          {nameError && (
            <p className="text-red-400 text-xs mt-1">{nameError}</p>
          )}
        </div>

        {/* Avatar Selection */}
        <div className="mb-8">
          <Label className="text-white/80 mb-3 block">Choose Avatar *</Label>
          
          {/* Custom Upload Option */}
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 transition-colors flex items-center justify-center gap-3"
              disabled={loading}
            >
              {customAvatarPreview ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-green-500">
                    <img src={customAvatarPreview} alt="Custom avatar" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-white/80">Custom photo selected</span>
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-white/60" />
                  <span className="text-white/60">Upload your own photo</span>
                </>
              )}
            </button>
          </div>

          {/* Or Divider */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/40 text-sm">or choose a preset</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Preset Avatars Grid */}
          <div className="grid grid-cols-3 gap-3">
            {PRESET_AVATARS.map((avatar) => (
              <motion.button
                key={avatar.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectPresetAvatar(avatar.id)}
                disabled={loading}
                className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                  selectedAvatar === avatar.id
                    ? 'border-green-500 ring-2 ring-green-500/30'
                    : 'border-white/10 hover:border-white/30'
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
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={loading || !displayName.trim() || !hasAvatarSelected}
          className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50"
          style={{
            background: hasAvatarSelected && displayName.trim()
              ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          {loading ? 'Creating Profile...' : 'Continue'}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProfileSetup;
