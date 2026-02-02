import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Gallery page - Opens native file picker directly
 * This is a wrapper that triggers the native gallery picker on mount
 * and navigates to Preview with the selected media.
 */
const Gallery = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredRef = useRef(false);
  
  const dayNumber = (location.state as { dayNumber?: number })?.dayNumber || 1;

  useEffect(() => {
    // Trigger file picker immediately on mount (only once)
    if (!hasTriggeredRef.current && fileInputRef.current) {
      hasTriggeredRef.current = true;
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        fileInputRef.current?.click();
      });
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);
      navigate('/preview', {
        state: {
          imageUrl: url,
          originalUrl: url,
          isVideo,
          dayNumber,
          fromGallery: true,
          file,
        },
        replace: true,
      });
    } else {
      // User cancelled - go back home
      navigate('/', { replace: true });
    }
  };

  const handleCancel = () => {
    // If user doesn't select anything, go back
    navigate('/', { replace: true });
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ 
        background: 'rgba(0,0,0,0.95)',
        height: '100dvh',
        minHeight: '-webkit-fill-available',
      }}
    >
      {/* Hidden file input that's triggered on mount */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        capture={undefined} // Allow gallery selection
        className="hidden"
        onChange={handleFileChange}
        onBlur={handleCancel}
      />
      
      {/* Loading indicator while picker is open */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
        <p className="text-white/50 text-sm">Select a photo or video...</p>
        <button
          onClick={handleCancel}
          className="mt-4 px-6 py-2 rounded-full text-white/60 text-sm hover:text-white/80 transition-colors"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Gallery;