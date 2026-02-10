import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ImageCropper from '@/components/ImageCropper';

/**
 * Gallery page - Opens native file picker directly
 * After selection, shows ImageCropper for 9:16 crop before Preview.
 */
const Gallery = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredRef = useRef(false);
  
  const dayNumber = (location.state as { dayNumber?: number })?.dayNumber || 1;

  // Crop state
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; isVideo: boolean } | null>(null);

  useEffect(() => {
    // Trigger file picker immediately on mount (only once)
    if (!hasTriggeredRef.current && fileInputRef.current) {
      hasTriggeredRef.current = true;
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
      // Show cropper before going to preview
      setSelectedMedia({ url, isVideo });
    } else {
      navigate(-1);
    }
  };

  const handleCropConfirm = (croppedDataUrl: string) => {
    if (!selectedMedia) return;
    navigate('/preview', {
      state: {
        imageUrl: croppedDataUrl,
        originalUrl: selectedMedia.url,
        isVideo: selectedMedia.isVideo,
        dayNumber,
        fromGallery: true,
      },
      replace: true,
    });
  };

  const handleCropCancel = () => {
    // Reset and re-trigger picker
    setSelectedMedia(null);
    hasTriggeredRef.current = false;
    navigate(-1);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Show cropper if media selected
  if (selectedMedia) {
    return (
      <ImageCropper
        mediaSrc={selectedMedia.url}
        isVideo={selectedMedia.isVideo}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
        onRetake={() => {
          setSelectedMedia(null);
          hasTriggeredRef.current = false;
          requestAnimationFrame(() => {
            fileInputRef.current?.click();
          });
        }}
      />
    );
  }

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ 
        background: 'rgba(0,0,0,0.95)',
        height: '100dvh',
        minHeight: '-webkit-fill-available',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        capture={undefined}
        className="hidden"
        onChange={handleFileChange}
        onBlur={handleCancel}
      />
      
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
