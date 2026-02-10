import { useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CameraUI from '@/components/CameraUI';
import ImageCropper from '@/components/ImageCropper';

const Camera = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const state = location.state as {
    dayNumber?: number;
    returnTo?: string;
  } | null;
  
  const dayNumber = state?.dayNumber ?? 1;
  const week = Math.ceil(dayNumber / 3);

  // Crop state - show cropper after capture
  const [capturedMedia, setCapturedMedia] = useState<{ url: string; isVideo: boolean } | null>(null);

  const handleCapture = useCallback((mediaDataUrl: string, isVideo?: boolean) => {
    // Show cropper before going to preview
    setCapturedMedia({ url: mediaDataUrl, isVideo: isVideo || false });
  }, []);

  const handleCropConfirm = (croppedDataUrl: string) => {
    if (!capturedMedia) return;
    navigate('/preview', {
      state: {
        imageUrl: croppedDataUrl,
        originalUrl: capturedMedia.url,
        isVideo: capturedMedia.isVideo,
        dayNumber,
        fromCamera: true,
      },
      replace: true,
    });
  };

  const handleCropCancel = () => {
    // Go back to camera
    setCapturedMedia(null);
  };

  const handleClose = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  // Show cropper after capture
  if (capturedMedia) {
    return (
      <ImageCropper
        mediaSrc={capturedMedia.url}
        isVideo={capturedMedia.isVideo}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
        onRetake={() => setCapturedMedia(null)}
      />
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black overflow-hidden touch-none"
      style={{ 
        height: '100dvh',
        minHeight: '-webkit-fill-available',
      }}
    >
      <CameraUI
        activity=""
        week={week}
        day={dayNumber}
        onCapture={handleCapture}
        onClose={handleClose}
        initialCaptureMode="photo"
      />
    </div>
  );
};

export default Camera;
