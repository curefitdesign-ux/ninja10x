import { useState, useRef, useEffect, useCallback } from 'react';
import { X, SwitchCamera, Image as ImageIcon } from 'lucide-react';

interface CameraUIProps {
  activity: string;
  week: number;
  day: number;
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraUI = ({ activity, week, day, onCapture, onClose }: CameraUIProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true
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

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `${activity}-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const startRecording = () => {
    if (!stream) return;
    
    setIsRecording(true);
    recordingStartRef.current = Date.now();
    chunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `${activity}-video-${Date.now()}.webm`, { type: 'video/webm' });
      onCapture(file);
    };
    
    mediaRecorder.start();
    
    // Update progress every 100ms
    recordingTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - recordingStartRef.current;
      const progress = Math.min(elapsed / 4000, 1); // 4 seconds max
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
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setRecordingProgress(0);
  };

  const handleShutterPress = () => {
    startRecording();
  };

  const handleShutterRelease = () => {
    if (isRecording) {
      stopRecording();
    } else {
      handleTakePhoto();
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
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
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Top Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/80 to-transparent" />

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-start">
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

      {/* Camera Frame */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[280px] h-[420px]">
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white/80 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white/80 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white/80 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white/80 rounded-br-2xl" />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-12 px-8">
        <div className="flex items-center justify-between">
          {/* Flip Camera */}
          <button
            onClick={handleFlipCamera}
            className="p-4"
          >
            <SwitchCamera className="w-8 h-8 text-white/80" />
          </button>

          {/* Shutter Button */}
          <button
            onMouseDown={handleShutterPress}
            onMouseUp={handleShutterRelease}
            onMouseLeave={() => isRecording && stopRecording()}
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

          {/* Gallery */}
          <button
            onClick={handleGalleryClick}
            className="p-4"
          >
            <ImageIcon className="w-8 h-8 text-white/80" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraUI;