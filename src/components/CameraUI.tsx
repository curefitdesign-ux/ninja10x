import { useState, useRef, useEffect, useCallback } from 'react';
import { X, SwitchCamera, Image as ImageIcon, Check, RotateCcw, Timer, Zap, ZapOff } from 'lucide-react';
import ImageCropper from './ImageCropper';

interface CameraUIProps {
  activity: string;
  week: number;
  day: number;
  onCapture: (mediaDataUrl: string, isVideo?: boolean) => void;
  onClose: () => void;
}

type TimerOption = 0 | 5 | 10 | 15;

const CameraUI = ({ activity, week, day, onCapture, onClose }: CameraUIProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(3);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedVideo, setCapturedVideo] = useState<string | null>(null);
  const [showHoldTip, setShowHoldTip] = useState(true);
  const [showCropper, setShowCropper] = useState(false);
  const [mediaToEdit, setMediaToEdit] = useState<{ src: string; isVideo: boolean } | null>(null);
  const [selectedTimer, setSelectedTimer] = useState<TimerOption>(0);
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartRef = useRef<number>(0);
  const isLongPressRef = useRef(false);

  const timerOptions: TimerOption[] = [0, 5, 10, 15];

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

  // Start camera only when not in cropper mode and no captured media
  useEffect(() => {
    if (!showCropper && !capturedImage && !capturedVideo) {
      startCamera();
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, showCropper, capturedImage, capturedVideo]);

  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontally if using front camera to avoid mirror image
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        // Open cropper instead of directly setting captured image
        setMediaToEdit({ src: dataUrl, isVideo: false });
        setShowCropper(true);
        // Stop camera to avoid green dot
        stopCamera();
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage, false);
    } else if (capturedVideo) {
      // Pass the video URL directly
      onCapture(capturedVideo, true);
    }
  };

  const handleCropConfirm = (croppedDataUrl: string, isVideo: boolean) => {
    setShowCropper(false);
    setMediaToEdit(null);
    // Directly pass to parent - skip confirmation screen
    onCapture(croppedDataUrl, isVideo);
  };

  const handleCropRetake = () => {
    setShowCropper(false);
    setMediaToEdit(null);
    // Restart camera
    startCamera();
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setMediaToEdit(null);
    // Restart camera
    startCamera();
  };

  const handleRetake = () => {
    // Clear captured media
    setCapturedImage(null);
    setCapturedVideo(null);
    recordedChunksRef.current = [];
    // Restart camera with same facing mode
    startCamera();
  };

  const startRecording = () => {
    if (!stream) return;
    
    setIsRecording(true);
    recordingStartRef.current = Date.now();
    recordedChunksRef.current = [];
    
    // Setup MediaRecorder
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      // Open cropper for video too
      setMediaToEdit({ src: videoUrl, isVideo: true });
      setShowCropper(true);
      // Stop camera to avoid green dot
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    };
    
    mediaRecorder.start(100);
    
    recordingTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - recordingStartRef.current;
      const progress = Math.min(elapsed / 3000, 1); // 3 sec max
      const remaining = Math.ceil((3000 - elapsed) / 1000);
      setRecordingProgress(progress);
      setRecordingSeconds(Math.max(remaining, 0));
      
      if (progress >= 1) {
        stopRecording();
      }
    }, 100);
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingProgress(0);
    setRecordingSeconds(3);
  };

  const startCountdown = (callback: () => void) => {
    if (selectedTimer === 0) {
      callback();
      return;
    }
    
    setCountdownActive(true);
    setCountdownValue(selectedTimer);
    
    countdownTimerRef.current = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          setCountdownActive(false);
          callback();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdownActive(false);
    setCountdownValue(0);
  };

  const handleShutterPress = () => {
    if (capturedImage || capturedVideo || countdownActive) return;
    
    isLongPressRef.current = false;
    
    // Start timer to detect long press
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      startCountdown(() => startRecording());
    }, 300);
  };

  const handleShutterRelease = () => {
    if (capturedImage || capturedVideo) return;
    
    // Clear the long press timer
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    
    if (countdownActive) return;
    
    if (isRecording) {
      stopRecording();
    } else if (!isLongPressRef.current) {
      startCountdown(() => takePhoto());
    }
  };

  const handleTimerSelect = (timer: TimerOption) => {
    setSelectedTimer(timer);
    setShowTimerPicker(false);
  };

  const toggleFlash = () => {
    setFlashEnabled(prev => !prev);
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Open cropper for gallery uploads
        setMediaToEdit({ src: dataUrl, isVideo });
        setShowCropper(true);
        // Stop camera
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const hasCapturedMedia = capturedImage || capturedVideo;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Hidden elements */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Camera Feed, Captured Image, or Captured Video */}
      {capturedVideo ? (
        <video
          key={capturedVideo}
          ref={playbackVideoRef}
          src={capturedVideo}
          autoPlay
          loop
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          onLoadedData={(e) => {
            const video = e.target as HTMLVideoElement;
            video.play().catch(() => {});
          }}
        />
      ) : capturedImage ? (
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

      {/* Gradient masked blur overlay - uniform rectangular */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top blur section - smooth & translucent */}
        <div 
          className="absolute top-0 left-0 right-0 backdrop-blur-xl bg-black/15"
          style={{ 
            height: 'calc((100% - (100vw - 48px) * 4 / 3) / 2 + 24px)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 80%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 80%, transparent 100%)',
          }}
        />
        {/* Bottom blur section - smooth & translucent */}
        <div 
          className="absolute bottom-0 left-0 right-0 backdrop-blur-xl bg-black/15"
          style={{ 
            height: 'calc((100% - (100vw - 48px) * 4 / 3) / 2 + 24px)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 80%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 80%, transparent 100%)',
          }}
        />
        {/* Left blur section - full height, smooth & translucent */}
        <div 
          className="absolute left-0 top-0 bottom-0 backdrop-blur-xl bg-black/15"
          style={{ 
            width: '48px',
            maskImage: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
          }}
        />
        {/* Right blur section - full height, smooth & translucent */}
        <div 
          className="absolute right-0 top-0 bottom-0 backdrop-blur-xl bg-black/15"
          style={{ 
            width: '48px',
            maskImage: 'linear-gradient(to left, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
          }}
        />
      </div>

      {/* Camera Frame - matches 3:4 aspect ratio of preview frames */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Clear crop area with 3:4 aspect ratio and matching rounded corners */}
        <div 
          className="relative rounded-[32px] border-2 border-white/20 overflow-hidden"
          style={{ 
            width: 'calc(100% - 48px)', 
            aspectRatio: '3/4',
          }}
        >
          {/* Subtle vignette effect inside capture area */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(0,0,0,0.15) 100%)',
            }}
          />
          {/* Corner brackets - matching the outer rounded corners */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white/80 rounded-tl-[32px]" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white/80 rounded-tr-[32px]" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white/80 rounded-bl-[32px]" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white/80 rounded-br-[32px]" />
        </div>
      </div>

      {/* iOS-style Countdown Overlay */}
      {countdownActive && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="relative">
            {/* Countdown number with liquid animation */}
            <div 
              key={countdownValue}
              className="text-[120px] font-bold text-white animate-liquid-bounce"
              style={{
                textShadow: '0 0 60px rgba(255,255,255,0.5), 0 0 120px rgba(255,255,255,0.3)',
              }}
            >
              {countdownValue}
            </div>
            {/* Expanding ring animation */}
            <div 
              key={`ring-${countdownValue}`}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div 
                className="w-40 h-40 rounded-full border-4 border-white/40 animate-ping"
                style={{ animationDuration: '1s' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Timer Picker Overlay - iOS Liquid Glass Style */}
      {showTimerPicker && (
        <div 
          className="absolute inset-0 z-40 flex items-center justify-center"
          onClick={() => setShowTimerPicker(false)}
        >
          <div 
            className="backdrop-blur-2xl bg-white/10 rounded-3xl p-4 border border-white/20 shadow-2xl animate-liquid-enter"
            onClick={e => e.stopPropagation()}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
            }}
          >
            <div className="text-white/60 text-xs font-medium text-center mb-3 uppercase tracking-wider">Timer</div>
            <div className="flex gap-2">
              {timerOptions.map((timer) => (
                <button
                  key={timer}
                  onClick={() => handleTimerSelect(timer)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-semibold text-lg transition-all duration-300 tap-bounce ${
                    selectedTimer === timer
                      ? 'bg-white text-black scale-105'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  style={{
                    boxShadow: selectedTimer === timer 
                      ? '0 10px 30px -5px rgba(255,255,255,0.3)' 
                      : 'none',
                  }}
                >
                  {timer === 0 ? 'Off' : `${timer}s`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
      <div className="absolute bottom-0 left-0 right-0 pb-12 px-6 z-10">
        {/* Hold for video tip */}
        <div 
          className={`flex justify-center mb-4 transition-all duration-500 ${
            showHoldTip && !hasCapturedMedia && !countdownActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <div className="px-4 py-2 rounded-full backdrop-blur-md bg-white/20 border border-white/10">
            <span className="text-white/90 text-sm font-medium">Hold for video</span>
          </div>
        </div>

        {/* Timer indicator when selected */}
        {selectedTimer > 0 && !hasCapturedMedia && !countdownActive && (
          <div className="flex justify-center mb-3">
            <div className="px-3 py-1.5 rounded-full backdrop-blur-md bg-yellow-500/20 border border-yellow-500/30">
              <span className="text-yellow-400 text-xs font-medium">{selectedTimer}s timer active</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          {/* Left side controls */}
          <div className="flex items-center gap-2">
            {hasCapturedMedia ? (
              <button
                onClick={handleRetake}
                className="p-3 rounded-full backdrop-blur-md bg-white/10 border border-white/10 tap-bounce"
              >
                <RotateCcw className="w-6 h-6 text-white/80" />
              </button>
            ) : (
              <>
                {/* Timer Button */}
                <button
                  onClick={() => setShowTimerPicker(true)}
                  className={`p-3 rounded-full backdrop-blur-md border tap-bounce transition-all duration-300 ${
                    selectedTimer > 0 
                      ? 'bg-yellow-500/20 border-yellow-500/40' 
                      : 'bg-white/10 border-white/10'
                  }`}
                >
                  <div className="relative">
                    <Timer className={`w-6 h-6 ${selectedTimer > 0 ? 'text-yellow-400' : 'text-white/80'}`} />
                    {selectedTimer > 0 && (
                      <span className="absolute -bottom-1 -right-1 text-[10px] font-bold text-yellow-400">
                        {selectedTimer}
                      </span>
                    )}
                  </div>
                </button>
                {/* Flip Camera */}
                <button
                  onClick={handleFlipCamera}
                  className="p-3 rounded-full backdrop-blur-md bg-white/10 border border-white/10 tap-bounce"
                >
                  <SwitchCamera className="w-6 h-6 text-white/80" />
                </button>
              </>
            )}
          </div>

          {/* Shutter Button / Confirm Button */}
          {hasCapturedMedia ? (
            <button
              onClick={handleConfirm}
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
            >
              <div className="absolute w-20 h-20 rounded-full border-4 border-white/30" />
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                <Check className="w-8 h-8 text-black" strokeWidth={3} />
              </div>
            </button>
          ) : countdownActive ? (
            <button
              onClick={cancelCountdown}
              className="relative w-20 h-20 rounded-full flex items-center justify-center tap-bounce"
            >
              <div className="absolute w-20 h-20 rounded-full border-4 border-white/30 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-red-500/80 flex items-center justify-center">
                <X className="w-8 h-8 text-white" strokeWidth={3} />
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
              <div className={`w-16 h-16 rounded-full transition-all duration-150 flex items-center justify-center ${
                isRecording ? 'bg-red-500 scale-75' : 'bg-white/90'
              }`}>
                {isRecording && (
                  <span className="text-white font-bold text-xl">{recordingSeconds}</span>
                )}
              </div>
            </button>
          )}

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {hasCapturedMedia ? (
              <div className="p-3 w-12" />
            ) : (
              <>
                {/* Flash Button */}
                <button
                  onClick={toggleFlash}
                  className={`p-3 rounded-full backdrop-blur-md border tap-bounce transition-all duration-300 ${
                    flashEnabled 
                      ? 'bg-yellow-500/20 border-yellow-500/40' 
                      : 'bg-white/10 border-white/10'
                  }`}
                >
                  {flashEnabled ? (
                    <Zap className="w-6 h-6 text-yellow-400" fill="currentColor" />
                  ) : (
                    <ZapOff className="w-6 h-6 text-white/80" />
                  )}
                </button>
                {/* Gallery */}
                <button
                  onClick={handleGalleryClick}
                  className="p-3 rounded-full backdrop-blur-md bg-white/10 border border-white/10 tap-bounce"
                >
                  <ImageIcon className="w-6 h-6 text-white/80" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image/Video Cropper */}
      {showCropper && mediaToEdit && (
        <ImageCropper
          mediaSrc={mediaToEdit.src}
          isVideo={mediaToEdit.isVideo}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          onRetake={handleCropRetake}
        />
      )}
    </div>
  );
};

export default CameraUI;
