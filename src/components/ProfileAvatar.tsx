import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

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
  
  const handleError = () => {
    if (!retried && src) {
      // Retry with cache-busting query
      setRetried(true);
    } else {
      setImageError(true);
    }
  };

  const showFallback = !src || imageError;
  
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
          src={retried ? `${src}?t=${Date.now()}` : src}
          alt={name || 'User avatar'}
          className="w-full h-full object-cover"
          onError={handleError}
        />
      )}
    </div>
  );
};

export default ProfileAvatar;
