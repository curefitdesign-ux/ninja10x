import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AvatarCropper from '@/components/AvatarCropper';

const AvatarCrop = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const state = location.state as {
    imageData?: string;
    returnTo?: string;
  } | null;
  
  const imageData = state?.imageData;
  const returnTo = state?.returnTo || '/profile-setup';

  const handleConfirm = useCallback((croppedDataUrl: string) => {
    // Store cropped image in session storage for retrieval
    sessionStorage.setItem('croppedAvatarImage', croppedDataUrl);
    navigate(returnTo, { replace: true });
  }, [navigate, returnTo]);

  const handleCancel = useCallback(() => {
    navigate(returnTo, { replace: true });
  }, [navigate, returnTo]);

  // If no image data, redirect back
  if (!imageData) {
    navigate(returnTo, { replace: true });
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black overflow-hidden touch-none"
      style={{ 
        height: '100dvh',
        minHeight: '-webkit-fill-available',
      }}
    >
      <AvatarCropper
        imageSrc={imageData}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AvatarCrop;
