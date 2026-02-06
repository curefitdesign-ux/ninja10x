import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

// Import preset avatars to create a mapping for Vite-hashed paths
import avatarRed from '@/assets/avatars/avatar-red.png';
import avatarBlue from '@/assets/avatars/avatar-blue.png';
import avatarPurple from '@/assets/avatars/avatar-purple.png';
import avatarGreen from '@/assets/avatars/avatar-green.png';
import avatarOrange from '@/assets/avatars/avatar-orange.png';
import avatarTeal from '@/assets/avatars/avatar-teal.png';
import avatarPink from '@/assets/avatars/avatar-pink.png';
import avatarYellow from '@/assets/avatars/avatar-yellow.png';

// Map avatar color names to their imported paths
const AVATAR_MAP: Record<string, string> = {
  'avatar-red': avatarRed,
  'avatar-blue': avatarBlue,
  'avatar-purple': avatarPurple,
  'avatar-green': avatarGreen,
  'avatar-orange': avatarOrange,
  'avatar-teal': avatarTeal,
  'avatar-pink': avatarPink,
  'avatar-yellow': avatarYellow,
};

// Resolve avatar URL - handles Vite-hashed paths stored in DB
const resolveAvatarUrl = (src: string | null | undefined): string | null => {
  if (!src) return null;
  
  // If it's a full URL (Supabase storage, http, https), use as-is
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')) {
    return src;
  }
  
  // Check if this is a Vite-hashed preset avatar path
  // These look like: /assets/avatar-blue-D18a8su-.png
  for (const [key, importedPath] of Object.entries(AVATAR_MAP)) {
    if (src.includes(key)) {
      return importedPath;
    }
  }
  
  // Return original path for other cases
  return src;
};

interface ProfileAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getGradient = (name: string | null | undefined): string => {
  const gradients = [
    'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
    'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
    'linear-gradient(135deg, #34d399 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #f472b6 0%, #fb923c 100%)',
    'linear-gradient(135deg, #818cf8 0%, #e879f9 100%)',
    'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
  ];
  
  if (!name) return gradients[0];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

const ProfileAvatar = ({ src, name, size = 40, className, style }: ProfileAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const [retried, setRetried] = useState(false);
  
  const initials = useMemo(() => getInitials(name), [name]);
  const gradient = useMemo(() => getGradient(name), [name]);
  
  // Resolve the avatar URL to handle Vite-hashed paths
  const resolvedSrc = useMemo(() => resolveAvatarUrl(src), [src]);
  
  const handleError = () => {
    if (!retried && resolvedSrc) {
      // Retry with cache-busting query
      setRetried(true);
    } else {
      setImageError(true);
    }
  };

  const showFallback = !resolvedSrc || imageError;
  
  return (
    <div
      className={cn(
        'rounded-full overflow-hidden flex items-center justify-center',
        className
      )}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        background: showFallback ? gradient : undefined,
        ...style,
      }}
    >
      {showFallback ? (
        <span 
          className="text-white font-bold select-none"
          style={{ 
            fontSize: size * 0.4,
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        >
          {initials}
        </span>
      ) : (
        <img
          src={retried ? `${resolvedSrc}?t=${Date.now()}` : resolvedSrc}
          alt={name || 'User avatar'}
          className="w-full h-full object-cover"
          onError={handleError}
        />
      )}
    </div>
  );
};

export default ProfileAvatar;
