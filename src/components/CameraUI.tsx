import { useState, useRef, useEffect, useCallback } from 'react';
import { X, SwitchCamera, Image as ImageIcon, Check, RotateCcw } from 'lucide-react';

interface CameraUIProps {
  activity: string;
  week: number;
  day: number;
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

const CameraUI = ({ activity, week, day, onCapture, onClose }: CameraUIProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showHoldTip, setShowHoldTip] = useState(true);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartRef = useRef<number>(0);
  const isLongPressRef = useRef(false);

  // Hide the "Hold for video" tip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHoldTip(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false
      });
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const startRecording = () => {
    setIsRecording(true);
    recordingStartRef.current = Date.now();
    
    recordingTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - recordingStartRef.current;
      const progress = Math.min(elapsed / 4000, 1);
      setRecordingProgress(progress);
      
      if (progress >= 1) {
        stopRecording();
      }
    }, 100);
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);
    setRecordingProgress(0);
    // For now, take a photo at end of recording
    takePhoto();
  };

  const handleShutterPress = () => {
    if (capturedImage) return; // Don't allow if already captured
    
    isLongPressRef.current = false;
    
    // Start timer to detect long press
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      startRecording();
    }, 300); // 300ms to trigger long press
  };

  const handleShutterRelease = () => {
    if (capturedImage) return; // Don't allow if already captured
    
    // Clear the long press timer
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    
    if (isRecording) {
      // Was recording, stop it
      stopRecording();
    } else if (!isLongPressRef.current) {
      // Quick tap, take photo
      takePhoto();
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setCapturedImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Hidden elements */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Camera Feed or Captured Image */}
      {capturedImage ? (
        <img
          src={capturedImage}
          alt="Captured"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Gradient masked blur overlay - rectangular with equal margins */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Calculate clear area: 24px from sides, centered vertically with 3:4 aspect ratio */}
        {/* Blur layer */}
        <div 
          className="absolute inset-0 backdrop-blur-2xl bg-black/30"
          style={{
            maskImage: `
              radial-gradient(
                calc(50% - 24px) calc((50vw - 24px) * 4 / 3 / 2) at 50% 50%,
                transparent 85%,
                black 100%
              )
            `,
            WebkitMaskImage: `
              radial-gradient(
                calc(50% - 24px) calc((50vw - 24px) * 4 / 3 / 2) at 50% 50%,
                transparent 85%,
                black 100%
              )
            `,
          }}
        />
      </div>

      {/* Camera Frame - matches 3:4 aspect ratio of preview frames */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Clear crop area with 3:4 aspect ratio and matching rounded corners */}
        <div 
          className="relative rounded-[32px] border-2 border-white/20"
          style={{ 
            width: 'calc(100% - 48px)', 
            aspectRatio: '3/4',
          }}
        >
          {/* Corner brackets - matching the outer rounded corners */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white/80 rounded-tl-[32px]" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white/80 rounded-tr-[32px]" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white/80 rounded-bl-[32px]" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white/80 rounded-br-[32px]" />
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-start z-10">
        <div>
          <h2 className="text-2xl font-bold text-white">{activity}</h2>
          <p className="text-white/80 text-sm">Week {week} • Day {day}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-12 px-8 z-10">
        {/* Hold for video tip */}
        <div 
          className={`flex justify-center mb-4 transition-all duration-500 ${
            showHoldTip && !capturedImage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <div className="px-4 py-2 rounded-full backdrop-blur-md bg-white/20 border border-white/10">
            <span className="text-white/90 text-sm font-medium">Hold for video</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Left Button - Retake (when captured) or Flip Camera */}
          {capturedImage ? (
            <button
              onClick={handleRetake}
              className="p-4"
            >
              <RotateCcw className="w-8 h-8 text-white/80" />
            </button>
          ) : (
            <button
              onClick={handleFlipCamera}
              className="p-4"
            >
              <SwitchCamera className="w-8 h-8 text-white/80" />
            </button>
          )}

          {/* Shutter Button / Confirm Button */}
          {capturedImage ? (
            <button
              onClick={handleConfirm}
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
            >
              {/* Outer ring */}
              <div className="absolute w-20 h-20 rounded-full border-4 border-white/30" />
              {/* Inner button with check */}
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </button>
          ) : (
            <button
              onMouseDown={handleShutterPress}
              onMouseUp={handleShutterRelease}
              onMouseLeave={() => {
                if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
                if (isRecording) stopRecording();
              }}
              onTouchStart={handleShutterPress}
              onTouchEnd={handleShutterRelease}
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
            >
              {/* Outer ring with progress */}
              <svg className="absolute w-20 h-20" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="4"
                />
                {isRecording && (
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="#FF3B30"
                    strokeWidth="4"
                    strokeDasharray={`${recordingProgress * 226} 226`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />
                )}
              </svg>
              {/* Inner button */}
              <div className={`w-16 h-16 rounded-full transition-all duration-150 ${
                isRecording ? 'bg-red-500 scale-75' : 'bg-white/90'
              }`} />
            </button>
          )}

          {/* Gallery */}
          <button
            onClick={handleGalleryClick}
            className="p-4"
            disabled={!!capturedImage}
          >
            <ImageIcon className={`w-8 h-8 ${capturedImage ? 'text-white/30' : 'text-white/80'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraUI;
