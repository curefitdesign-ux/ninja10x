import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CameraUI from '@/components/CameraUI';

const Camera = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const state = location.state as {
    dayNumber?: number;
    returnTo?: string;
  } | null;
  
  const dayNumber = state?.dayNumber ?? 1;
  const week = Math.ceil(dayNumber / 3);

  const handleCapture = useCallback((mediaDataUrl: string, isVideo?: boolean) => {
    // Navigate to preview with captured media
    navigate('/preview', {
      state: {
        imageUrl: mediaDataUrl,
        originalUrl: mediaDataUrl,
        isVideo: isVideo || false,
        activity: 'Running', // Default activity
        dayNumber,
        fromCamera: true,
      },
      replace: true,
    });
  }, [navigate, dayNumber]);

  const handleClose = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

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
