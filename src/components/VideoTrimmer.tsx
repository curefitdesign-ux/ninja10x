import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, Play, Pause } from 'lucide-react';

interface VideoTrimmerProps {
  videoSrc: string;
  onConfirm: (trimmedVideoUrl: string) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds, default 3
}

const VideoTrimmer = ({ videoSrc, onConfirm, onCancel, maxDuration = 3 }: VideoTrimmerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const animationRef = useRef<number>();

  // Generate video thumbnails
  useEffect(() => {
    const video = document.createElement('video');
    video.src = videoSrc;
    video.crossOrigin = 'anonymous';
    video.muted = true;

    video.onloadedmetadata = () => {
      const videoDuration = video.duration;
      setDuration(videoDuration);
      
      // Generate ~10 thumbnails
      const numThumbnails = Math.min(10, Math.floor(videoDuration));
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 60;
      canvas.height = 100;
      
      const thumbs: string[] = [];
      let currentThumb = 0;
      
      const captureFrame = () => {
        if (currentThumb >= numThumbnails) {
          setThumbnails(thumbs);
          return;
        }
        
        const time = (videoDuration / numThumbnails) * currentThumb;
        video.currentTime = time;
      };
      
      video.onseeked = () => {
        if (ctx && currentThumb < numThumbnails) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbs.push(canvas.toDataURL('image/jpeg', 0.5));
          currentThumb++;
          captureFrame();
        }
      };
      
      captureFrame();
    };
  }, [videoSrc]);

  // Video time update
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);
      
      // Loop within selected range
      if (current >= startTime + maxDuration || current < startTime) {
        video.currentTime = startTime;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [startTime, maxDuration]);

  // Handle timeline drag
  const handleTimelineInteraction = useCallback((clientX: number) => {
    if (!timelineRef.current || duration === 0) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newStartTime = percentage * (duration - maxDuration);
    
    setStartTime(Math.max(0, Math.min(newStartTime, duration - maxDuration)));
    
    if (videoRef.current) {
      videoRef.current.currentTime = newStartTime;
    }
  }, [duration, maxDuration]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleTimelineInteraction(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleTimelineInteraction(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleTimelineInteraction(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleTimelineInteraction(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.currentTime = startTime;
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Trim and confirm video
  const handleConfirm = async () => {
    const video = videoRef.current;
    if (!video) return;

    // For now, we'll pass the full video with start time info
    // In production, you'd use MediaRecorder or server-side trimming
    // Create a trimmed version by recording the playback
    
    try {
      // Create a canvas to capture video frames
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Use video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Set video to start time
      video.currentTime = startTime;
      video.muted = true;
      
      // Create MediaRecorder from canvas stream
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        onConfirm(url);
      };
      
      // Start recording
      mediaRecorder.start();
      await video.play();
      
      // Draw frames to canvas
      const drawFrame = () => {
        if (ctx && video.currentTime < startTime + maxDuration) {
          ctx.drawImage(video, 0, 0);
          animationRef.current = requestAnimationFrame(drawFrame);
        } else {
          video.pause();
          cancelAnimationFrame(animationRef.current!);
          mediaRecorder.stop();
        }
      };
      
      drawFrame();
    } catch (error) {
      console.error('Error trimming video:', error);
      // Fallback: just pass the original video URL with timing metadata
      onConfirm(videoSrc);
    }
  };

  const selectionStart = duration > 0 ? (startTime / duration) * 100 : 0;
  const selectionWidth = duration > 0 ? (maxDuration / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <button onClick={onCancel} className="p-2">
          <X className="w-6 h-6 text-white" />
        </button>
        <span className="text-white font-medium">Select {maxDuration}s clip</span>
        <div className="w-10" />
      </div>
      
      {/* Video Preview */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div 
          className="relative rounded-[24px] overflow-hidden bg-black"
          style={{ 
            width: 'calc(100% - 48px)', 
            aspectRatio: '9/16',
            maxHeight: '60vh'
          }}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-cover"
            playsInline
            muted
            loop
          />
          
          {/* Play/Pause overlay */}
          <button 
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </div>
          </button>
        </div>
      </div>
      
      {/* Timeline Scrubber */}
      <div className="px-4 pb-8">
        <div className="mb-4 text-center">
          <span className="text-white/60 text-sm">
            Drag to select {maxDuration} seconds
          </span>
        </div>
        
        <div 
          ref={timelineRef}
          className="relative h-16 bg-white/10 rounded-xl overflow-hidden touch-none cursor-pointer"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Thumbnail strip */}
          <div className="absolute inset-0 flex">
            {thumbnails.map((thumb, i) => (
              <div 
                key={i} 
                className="flex-1 h-full"
                style={{
                  backgroundImage: `url(${thumb})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            ))}
          </div>
          
          {/* Dimmed overlay outside selection */}
          <div 
            className="absolute inset-y-0 left-0 bg-black/60"
            style={{ width: `${selectionStart}%` }}
          />
          <div 
            className="absolute inset-y-0 right-0 bg-black/60"
            style={{ width: `${100 - selectionStart - selectionWidth}%` }}
          />
          
          {/* Selection box */}
          <div 
            className="absolute inset-y-0 border-2 border-white rounded-lg"
            style={{ 
              left: `${selectionStart}%`, 
              width: `${selectionWidth}%`,
              boxShadow: '0 0 20px rgba(255,255,255,0.3)'
            }}
          >
            {/* Left handle */}
            <div className="absolute left-0 inset-y-0 w-3 bg-white rounded-l-lg flex items-center justify-center">
              <div className="w-0.5 h-6 bg-black/30 rounded-full" />
            </div>
            {/* Right handle */}
            <div className="absolute right-0 inset-y-0 w-3 bg-white rounded-r-lg flex items-center justify-center">
              <div className="w-0.5 h-6 bg-black/30 rounded-full" />
            </div>
          </div>
          
          {/* Current time indicator */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        
        {/* Time display */}
        <div className="flex justify-between mt-2 text-white/60 text-xs">
          <span>{formatTime(startTime)}</span>
          <span>{formatTime(startTime + maxDuration)}</span>
        </div>
      </div>
      
      {/* Confirm Button */}
      <div className="px-4 pb-12">
        <button
          onClick={handleConfirm}
          className="w-full py-4 rounded-2xl bg-white flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5 text-black" />
          <span className="text-black font-bold">Use this clip</span>
        </button>
      </div>
    </div>
  );
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default VideoTrimmer;
