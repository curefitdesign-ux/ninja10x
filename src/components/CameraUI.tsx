import { useState, useRef, useEffect, useCallback } from 'react';
import { X, SwitchCamera, Image as ImageIcon, Check, RotateCcw, Timer, Zap, ZapOff } from 'lucide-react';
import ImageCropper from './ImageCropper';
import VideoTrimmer from './VideoTrimmer';

interface CameraUIProps {
  activity: string;
  week: number;
  day: number;
  onCapture: (mediaDataUrl: string, isVideo?: boolean) => void;
  onClose: () => void;
  initialCaptureMode?: 'photo' | 'video';
}

type TimerOption = 0 | 5 | 10 | 15;

type CaptureMode = 'photo' | 'video';

const CameraUI = ({ activity, week, day, onCapture, onClose, initialCaptureMode = 'photo' }: CameraUIProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [recordingElapsed, setRecordingElapsed] = useState(0); // in milliseconds
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedVideo, setCapturedVideo] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showVideoTrimmer, setShowVideoTrimmer] = useState(false);
  const [videoToTrim, setVideoToTrim] = useState<string | null>(null);
  const [mediaToEdit, setMediaToEdit] = useState<{ src: string; isVideo: boolean } | null>(null);
  const [selectedTimer, setSelectedTimer] = useState<TimerOption>(0);
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0);
  const [captureMode, setCaptureMode] = useState<CaptureMode>(initialCaptureMode);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartRef = useRef<number>(0);
  const isLongPressRef = useRef(false);

  const timerOptions: TimerOption[] = [0, 5, 10, 15];
  
  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true // Enable audio for video recording
      });
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      // Fallback without audio if permission denied
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false
        });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr) {
        console.error('Error accessing camera without audio:', fallbackErr);
      }
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Start camera only when not in cropper mode and no captured media
  useEffect(() => {
    if (!showCropper && !capturedImage && !capturedVideo && !showVideoTrimmer) {
      startCamera();
    }
    
    return () => {
      // Cleanup on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, showCropper, capturedImage, capturedVideo, showVideoTrimmer]);

  // Auto disconnect camera when component becomes inactive/closes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      } else if (!showCropper && !capturedImage && !capturedVideo && !showVideoTrimmer) {
        startCamera();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Ensure camera is stopped when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream, showCropper, capturedImage, capturedVideo, showVideoTrimmer]);

  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Handle close with camera cleanup
  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Calculate 9:16 crop from center of video
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const targetRatio = 9 / 16;
      const videoRatio = videoWidth / videoHeight;
      
      let cropWidth: number, cropHeight: number, cropX: number, cropY: number;
      
      if (videoRatio > targetRatio) {
        // Video is wider - crop sides
        cropHeight = videoHeight;
        cropWidth = videoHeight * targetRatio;
        cropX = (videoWidth - cropWidth) / 2;
        cropY = 0;
      } else {
        // Video is taller - crop top/bottom
        cropWidth = videoWidth;
        cropHeight = videoWidth / targetRatio;
        cropX = 0;
        cropY = (videoHeight - cropHeight) / 2;
      }
      
      // Set canvas to 9:16 aspect ratio
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontally if using front camera to avoid mirror image
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          // Adjust cropX for mirrored image
          ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        } else {
          ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        }
        
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
    stopCamera(); // Ensure camera is stopped before navigation
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
    stopCamera(); // Ensure camera is stopped before navigation
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

  // Video trimmer handlers
  const handleVideoTrimConfirm = (trimmedVideoUrl: string) => {
    setShowVideoTrimmer(false);
    setVideoToTrim(null);
    stopCamera(); // Ensure camera is stopped before navigation
    // Pass trimmed video directly to parent
    onCapture(trimmedVideoUrl, true);
  };

  const handleVideoTrimCancel = () => {
    setShowVideoTrimmer(false);
    setVideoToTrim(null);
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
    if (!stream) {
      console.error('No stream available for recording');
      return;
    }
    
    setIsRecording(true);
    recordingStartRef.current = Date.now();
    setRecordingElapsed(0);
    recordedChunksRef.current = [];
    
    // Determine best supported MIME type
    // Prefer MP4 for broad playback compatibility (esp. iOS Safari), fallback to WebM.
    const mimeTypes = [
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    let selectedMimeType = '';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }
    
    // Setup MediaRecorder
    const options = selectedMimeType ? { mimeType: selectedMimeType } : undefined;
    const mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: selectedMimeType || 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);

      // IMPORTANT: don't send videos through ImageCropper — it intentionally outputs an image.
      // For hold-to-record, we want to keep the recorded 3s video.
      setCapturedVideo(videoUrl);

      // Stop camera to avoid green dot
      stopCamera();
    };
    
    mediaRecorder.start(100);
    
    // Update timer every 10ms for smooth display
    recordingTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - recordingStartRef.current;
      const progress = Math.min(elapsed / 3000, 1); // 3 sec max
      setRecordingProgress(progress);
      setRecordingElapsed(elapsed);
      
      if (progress >= 1) {
        stopRecording();
      }
    }, 10);
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
    setRecordingElapsed(0);
  };

  // Format elapsed time as MM:SS:ms
  const formatRecordingTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${centiseconds.toString().padStart(2, '0')}`;
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
    
    if (captureMode === 'video') {
      // Video mode - tap to start 3 second auto-recording
      if (!isRecording) {
        startCountdown(() => startRecording());
      }
    } else {
      // Photo mode - take photo immediately
      startCountdown(() => takePhoto());
    }
  };

  const handleShutterRelease = () => {
    // Don't stop on release anymore - let it run full 3 seconds for video
    // Only allow manual stop if user taps again while recording
  };

  const handleShutterClick = () => {
    if (capturedImage || capturedVideo || countdownActive) return;
    
    if (captureMode === 'video') {
      // Video mode - tap toggles recording
      if (isRecording) {
        // Second tap stops recording early
        stopRecording();
      } else {
        // First tap starts 3 second recording
        startCountdown(() => startRecording());
      }
    } else {
      // Photo mode - take photo
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
      
      if (isVideo) {
        // For videos, show the video trimmer instead of cropper
        const videoUrl = URL.createObjectURL(file);
        setVideoToTrim(videoUrl);
        setShowVideoTrimmer(true);
        // Stop camera
        stopCamera();
      } else {
        // For images, use the cropper
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setMediaToEdit({ src: dataUrl, isVideo: false });
          setShowCropper(true);
          // Stop camera
          stopCamera();
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  };

  const hasCapturedMedia = capturedImage || capturedVideo;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black overflow-hidden touch-none"
      style={{ 
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
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
            height: 'calc((100% - (100vw - 48px) * 16 / 9) / 2 + 24px)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 80%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 80%, transparent 100%)',
          }}
        />
        
        {/* CULT NINJA branding removed - now in header */}
        {/* Bottom blur section - smooth & translucent */}
        <div 
          className="absolute bottom-0 left-0 right-0 backdrop-blur-xl bg-black/15"
          style={{ 
            height: 'calc((100% - (100vw - 48px) * 16 / 9) / 2 + 24px)',
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

      {/* Camera Frame - positioned higher and slightly smaller */}
      <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '100px', bottom: '200px' }}>
        <div className="w-full h-full flex items-center justify-center">
          {/* Clear crop area with 9:16 aspect ratio and matching rounded corners */}
          <div 
            className="relative rounded-[28px] border-2 border-white/20 overflow-hidden"
            style={{ 
              width: 'calc(100% - 72px)',
              height: '100%',
              maxHeight: 'calc((100vw - 72px) * 16 / 9)',
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
            <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-white/80 rounded-tl-[28px]" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-white/80 rounded-tr-[28px]" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-white/80 rounded-bl-[28px]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-white/80 rounded-br-[28px]" />
          </div>
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

      {/* Timer Picker Overlay - Positioned between camera frame and bottom controls */}
      {showTimerPicker && (
        <div 
          className="absolute inset-0 z-40"
          onClick={() => setShowTimerPicker(false)}
        >
          {/* Timer picker positioned just above bottom controls */}
          <div 
            className="absolute left-0 right-0 flex justify-center"
            style={{ 
              bottom: 'calc(80px + 48px + 24px)', // Above the bottom controls area
            }}
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
        </div>
      )}

      {/* Header */}
      <div 
        className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 24px), 24px)' }}
      >
        <div>
          <h2 
            className="text-lg font-bold text-white tracking-[0.2em]"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
          >
            CULT NINJA
          </h2>
          <p className="text-white/70 text-sm mt-0.5">Week {week} • Day {day}</p>
        </div>
        
        <button
          onClick={handleClose}
          className="p-2 rounded-full backdrop-blur-md bg-white/10"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Bottom Controls */}
      <div 
        className="absolute bottom-0 left-0 right-0 px-6 z-10"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 24px)' }}
      >
        {/* Photo/Video Mode Toggle - Compact liquid glass design */}
        {!hasCapturedMedia && !countdownActive && (
          <div className="flex justify-center mb-4">
            <div 
              className="relative flex items-center rounded-full p-1 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 4px 24px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {/* Liquid sliding indicator */}
              <div 
                className="absolute top-1 bottom-1 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: 'calc(50% - 4px)',
                  left: captureMode === 'photo' ? '4px' : 'calc(50%)',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              />
              <button
                onClick={() => setCaptureMode('photo')}
                className={`relative z-10 px-5 py-2 rounded-full text-xs font-bold tracking-wider transition-all duration-300 ${
                  captureMode === 'photo' ? 'text-white' : 'text-white/40'
                }`}
              >
                PHOTO
              </button>
              <button
                onClick={() => setCaptureMode('video')}
                className={`relative z-10 px-5 py-2 rounded-full text-xs font-bold tracking-wider transition-all duration-300 ${
                  captureMode === 'video' ? 'text-white' : 'text-white/40'
                }`}
              >
                VIDEO
              </button>
            </div>
          </div>
        )}

        {/* Timer indicator removed - timer is shown on the timer button itself */}

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
              onClick={handleShutterClick}
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
            >
              <svg className="absolute w-20 h-20" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke={captureMode === 'video' ? 'rgba(255,59,48,0.4)' : 'rgba(255,255,255,0.3)'}
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
              {/* Shutter button inner - changes based on mode */}
              <div className={`transition-all duration-300 flex items-center justify-center ${
                isRecording 
                  ? 'w-7 h-7 rounded-sm bg-red-500' 
                  : captureMode === 'video'
                    ? 'w-16 h-16 rounded-full bg-red-500'
                    : 'w-16 h-16 rounded-full bg-white/90'
              }`}>
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

      {/* Video Trimmer for gallery videos */}
      {showVideoTrimmer && videoToTrim && (
        <VideoTrimmer
          videoSrc={videoToTrim}
          onConfirm={handleVideoTrimConfirm}
          onCancel={handleVideoTrimCancel}
          maxDuration={3}
        />
      )}
    </div>
  );
};

export default CameraUI;
