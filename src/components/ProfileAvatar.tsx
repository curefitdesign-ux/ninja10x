import { useState, useMemo, memo } from 'react';
import { cn } from '@/lib/utils';

// Curo mascot avatars
import curoBoxing from '@/assets/avatars/curo-boxing.png';
import curoCool from '@/assets/avatars/curo-cool.png';
import curoHappy from '@/assets/avatars/curo-happy.png';
import curoFire from '@/assets/avatars/curo-fire.png';
import curoFierce from '@/assets/avatars/curo-fierce.png';
import curoShy from '@/assets/avatars/curo-shy.png';
import curoZen from '@/assets/avatars/curo-zen.png';
import curoShocked from '@/assets/avatars/curo-shocked.png';
import curoMusic from '@/assets/avatars/curo-music.png';

// Primary avatar map (mascots - always needed)
const AVATAR_MAP: Record<string, string> = {
  'curo-boxing': curoBoxing,
  'curo-cool': curoCool,
  'curo-happy': curoHappy,
  'curo-fire': curoFire,
  'curo-fierce': curoFierce,
  'curo-shy': curoShy,
  'curo-zen': curoZen,
  'curo-shocked': curoShocked,
  'curo-music': curoMusic,
};

// Legacy avatars - lazy loaded only when needed (reduces initial bundle by ~200KB)
let _legacyAvatarsLoaded = false;
let _legacyAvatarMap: Record<string, string> = {};

async function loadLegacyAvatars(): Promise<Record<string, string>> {
  if (_legacyAvatarsLoaded) return _legacyAvatarMap;
  
  const [
    charOrangeBoy, charGlassesGirl, charEdgyGirl,
    avatarBoxer, avatarCyclist, avatarRunner, avatarSwimmer, avatarWeightlifter, avatarYogi,
    avatarRed, avatarBlue, avatarPurple, avatarGreen, avatarOrange, avatarTeal, avatarPink, avatarYellow,
    presetOrangeChar, presetRedgirlChar, presetEdgyChar,
  ] = await Promise.all([
    import('@/assets/avatars/char-orange-boy.jpg'),
    import('@/assets/avatars/char-glasses-girl.jpg'),
    import('@/assets/avatars/char-edgy-girl.jpg'),
    import('@/assets/avatars/boxer.png'),
    import('@/assets/avatars/cyclist.png'),
    import('@/assets/avatars/runner.png'),
    import('@/assets/avatars/swimmer.png'),
    import('@/assets/avatars/weightlifter.png'),
    import('@/assets/avatars/yogi.png'),
    import('@/assets/avatars/avatar-red.png'),
    import('@/assets/avatars/avatar-blue.png'),
    import('@/assets/avatars/avatar-purple.png'),
    import('@/assets/avatars/avatar-green.png'),
    import('@/assets/avatars/avatar-orange.png'),
    import('@/assets/avatars/avatar-teal.png'),
    import('@/assets/avatars/avatar-pink.png'),
    import('@/assets/avatars/avatar-yellow.png'),
    import('@/assets/avatars/preset-orange.png'),
    import('@/assets/avatars/preset-redgirl.png'),
    import('@/assets/avatars/preset-edgy.png'),
  ]);

  _legacyAvatarMap = {
    'char-orange-boy': charOrangeBoy.default,
    'char-glasses-girl': charGlassesGirl.default,
    'char-edgy-girl': charEdgyGirl.default,
    'boxer': avatarBoxer.default,
    'cyclist': avatarCyclist.default,
    'runner': avatarRunner.default,
    'swimmer': avatarSwimmer.default,
    'weightlifter': avatarWeightlifter.default,
    'yogi': avatarYogi.default,
    'avatar-red': avatarRed.default,
    'avatar-blue': avatarBlue.default,
    'avatar-purple': avatarPurple.default,
    'avatar-green': avatarGreen.default,
    'avatar-orange': avatarOrange.default,
    'avatar-teal': avatarTeal.default,
    'avatar-pink': avatarPink.default,
    'avatar-yellow': avatarYellow.default,
    'preset-orange': presetOrangeChar.default,
    'preset-redgirl': presetRedgirlChar.default,
    'preset-edgy': presetEdgyChar.default,
  };
  _legacyAvatarsLoaded = true;
  return _legacyAvatarMap;
}

// Resolve avatar URL - handles Vite-hashed paths stored in DB
const resolveAvatarUrl = (src: string | null | undefined): string | null => {
  if (!src) return null;
  
  // If it's a full URL (Supabase storage, http, https), use as-is
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')) {
    return src;
  }
  
  // Check primary mascot map first
  for (const [key, importedPath] of Object.entries(AVATAR_MAP)) {
    if (src.includes(key)) {
      return importedPath;
    }
  }

  // Check legacy map if loaded
  if (_legacyAvatarsLoaded) {
    for (const [key, importedPath] of Object.entries(_legacyAvatarMap)) {
      if (src.includes(key)) {
        return importedPath;
      }
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

const ProfileAvatar = memo(({ src, name, size = 40, className, style }: ProfileAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const [retried, setRetried] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => resolveAvatarUrl(src));
  
  const initials = useMemo(() => getInitials(name), [name]);
  const gradient = useMemo(() => getGradient(name), [name]);
  
  // Re-resolve when src changes; if it's a legacy key, load legacy avatars
  useMemo(() => {
    const resolved = resolveAvatarUrl(src);
    setResolvedSrc(resolved);
    setImageError(false);
    setRetried(false);
    
    // If src looks like a legacy key and wasn't resolved, try loading legacy avatars
    if (src && !src.startsWith('http') && !src.startsWith('blob:') && resolved === src && !AVATAR_MAP[src]) {
      loadLegacyAvatars().then(() => {
        const legacyResolved = resolveAvatarUrl(src);
        if (legacyResolved !== src) {
          setResolvedSrc(legacyResolved);
        }
      });
    }
  }, [src]);
  
  const handleError = () => {
    if (!retried && resolvedSrc) {
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
          loading="lazy"
          decoding="async"
          onError={handleError}
        />
      )}
    </div>
  );
});

ProfileAvatar.displayName = 'ProfileAvatar';

export default ProfileAvatar;
