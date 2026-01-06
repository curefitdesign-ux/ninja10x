import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, RotateCcw, RotateCw, ZoomIn } from 'lucide-react';

interface ImageCropperProps {
  mediaSrc: string;
  isVideo: boolean;
  onConfirm: (croppedDataUrl: string, isVideo: boolean) => void;
  onCancel: () => void;
  onRetake?: () => void;
}

interface Transform {
  scale: number;
  x: number;
  y: number;
  rotation: number;
}

const ImageCropper = ({ mediaSrc, isVideo, onConfirm, onCancel, onRetake }: ImageCropperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0, rotation: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);
  const [mediaDimensions, setMediaDimensions] = useState({ width: 0, height: 0 });
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomIndicatorTimeout = useRef<NodeJS.Timeout | null>(null);

  // Calculate distance between two touch points
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Constrain transform to keep media covering the crop area
  const constrainTransform = useCallback((t: Transform, mediaWidth: number, mediaHeight: number): Transform => {
    if (!containerRef.current) return t;
    
    const container = containerRef.current;
    const cropWidth = container.clientWidth - 48; // 24px padding each side
    const cropHeight = cropWidth * (16 / 9); // 9:16 aspect ratio
    
    const scaledWidth = mediaWidth * t.scale;
    const scaledHeight = mediaHeight * t.scale;
    
    // Calculate max allowed offset
    const maxX = Math.max(0, (scaledWidth - cropWidth) / 2);
    const maxY = Math.max(0, (scaledHeight - cropHeight) / 2);
    
    return {
      scale: Math.max(1, Math.min(3, t.scale)),
      x: Math.max(-maxX, Math.min(maxX, t.x)),
      y: Math.max(-maxY, Math.min(maxY, t.y)),
      rotation: t.rotation,
    };
  }, []);

  // Touch handlers for pinch-to-zoom and pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialDistance(distance);
      setInitialScale(transform.scale);
    } else if (e.touches.length === 1) {
      // Pan start
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - transform.x, y: e.touches[0].clientY - transform.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2 && initialDistance !== null) {
      // Pinch zoom
      const distance = getDistance(e.touches[0], e.touches[1]);
      const newScale = initialScale * (distance / initialDistance);
      
      setTransform(prev => constrainTransform(
        { ...prev, scale: newScale },
        mediaDimensions.width,
        mediaDimensions.height
      ));
    } else if (e.touches.length === 1 && isDragging) {
      // Pan
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      
      setTransform(prev => constrainTransform(
        { ...prev, x: newX, y: newY },
        mediaDimensions.width,
        mediaDimensions.height
      ));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setInitialDistance(null);
  };

  // Mouse handlers for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setTransform(prev => constrainTransform(
      { ...prev, x: newX, y: newY },
      mediaDimensions.width,
      mediaDimensions.height
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Show zoom indicator with auto-hide
  const showZoomIndicatorWithTimeout = useCallback(() => {
    setShowZoomIndicator(true);
    if (zoomIndicatorTimeout.current) {
      clearTimeout(zoomIndicatorTimeout.current);
    }
    zoomIndicatorTimeout.current = setTimeout(() => {
      setShowZoomIndicator(false);
    }, 1500);
  }, []);

  // Zoom buttons
  const handleZoomIn = () => {
    setTransform(prev => constrainTransform(
      { ...prev, scale: prev.scale + 0.25 },
      mediaDimensions.width,
      mediaDimensions.height
    ));
    showZoomIndicatorWithTimeout();
  };

  const handleZoomOut = () => {
    setTransform(prev => constrainTransform(
      { ...prev, scale: prev.scale - 0.25 },
      mediaDimensions.width,
      mediaDimensions.height
    ));
    showZoomIndicatorWithTimeout();
  };

  // Rotation controls
  const handleRotateLeft = () => {
    setTransform(prev => ({ ...prev, rotation: prev.rotation - 90 }));
  };

  const handleRotateRight = () => {
    setTransform(prev => ({ ...prev, rotation: prev.rotation + 90 }));
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (zoomIndicatorTimeout.current) {
        clearTimeout(zoomIndicatorTimeout.current);
      }
    };
  }, []);

  // Handle media load
  const handleMediaLoad = (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
    const media = e.currentTarget;
    const width = media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth;
    const height = media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight;
    setMediaDimensions({ width, height });
  };

  // Confirm crop - render to canvas
  const handleConfirm = async () => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const container = containerRef.current;
    const cropWidth = container.clientWidth - 48;
    const cropHeight = cropWidth * (16 / 9);
    
    // Set canvas to crop dimensions
    canvas.width = cropWidth * 2; // 2x for quality
    canvas.height = cropHeight * 2;
    
    // Get media element
    const media = mediaRef.current;
    if (!media) return;
    
    // Calculate source and destination rectangles
    const mediaWidth = isVideo 
      ? (media as HTMLVideoElement).videoWidth 
      : (media as HTMLImageElement).naturalWidth;
    const mediaHeight = isVideo
      ? (media as HTMLVideoElement).videoHeight
      : (media as HTMLImageElement).naturalHeight;
    
    // Create blur background
    ctx.filter = 'blur(20px)';
    ctx.drawImage(media, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
    
    // Draw the cropped portion
    const displayedWidth = container.clientWidth;
    const displayedHeight = container.clientHeight;
    const scaleFactor = mediaWidth / displayedWidth;
    
    // Calculate visible crop area in source coordinates
    const cropLeft = (displayedWidth / 2 - cropWidth / 2 - transform.x) / transform.scale;
    const cropTop = (displayedHeight / 2 - cropHeight / 2 - transform.y) / transform.scale;
    const srcWidth = cropWidth / transform.scale;
    const srcHeight = cropHeight / transform.scale;
    
    // Convert to actual media coordinates
    const srcX = (cropLeft / displayedWidth) * mediaWidth;
    const srcY = (cropTop / displayedHeight) * mediaHeight;
    const srcW = (srcWidth / displayedWidth) * mediaWidth;
    const srcH = (srcHeight / displayedHeight) * mediaHeight;
    
    ctx.drawImage(
      media,
      srcX, srcY, srcW, srcH,
      0, 0, canvas.width, canvas.height
    );
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onConfirm(dataUrl, false); // Always return as image after cropping
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Blur Background */}
      <div className="absolute inset-0 overflow-hidden">
        {isVideo ? (
          <video
            src={mediaSrc}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover blur-2xl scale-110 opacity-60"
          />
        ) : (
          <img
            src={mediaSrc}
            alt="Background"
            className="w-full h-full object-cover blur-2xl scale-110 opacity-60"
          />
        )}
      </div>
      
      {/* Main editing area */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Media with transform */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          {isVideo ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={mediaSrc}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              onLoadedMetadata={handleMediaLoad}
            />
          ) : (
            <img
              ref={mediaRef as React.RefObject<HTMLImageElement>}
              src={mediaSrc}
              alt="Edit"
              className="w-full h-full object-cover"
              onLoad={handleMediaLoad}
            />
          )}
        </div>
      </div>
      
      {/* Zoom indicator */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none transition-opacity duration-300 ${showZoomIndicator ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full">
          <ZoomIn className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-lg">{Math.round(transform.scale * 100)}%</span>
        </div>
      </div>
      
      {/* Crop overlay with blur edges */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top blur section */}
        <div 
          className="absolute top-0 left-0 right-0 backdrop-blur-xl bg-black/40"
          style={{ 
            height: 'calc((100% - (100vw - 48px) * 16 / 9) / 2)',
          }}
        />
        {/* Bottom blur section */}
        <div 
          className="absolute bottom-0 left-0 right-0 backdrop-blur-xl bg-black/40"
          style={{ 
            height: 'calc((100% - (100vw - 48px) * 16 / 9) / 2)',
          }}
        />
        {/* Left blur section */}
        <div 
          className="absolute left-0 backdrop-blur-xl bg-black/40"
          style={{ 
            width: '24px',
            top: 'calc((100% - (100vw - 48px) * 16 / 9) / 2)',
            bottom: 'calc((100% - (100vw - 48px) * 16 / 9) / 2)',
          }}
        />
        {/* Right blur section */}
        <div 
          className="absolute right-0 backdrop-blur-xl bg-black/40"
          style={{ 
            width: '24px',
            top: 'calc((100% - (100vw - 48px) * 16 / 9) / 2)',
            bottom: 'calc((100% - (100vw - 48px) * 16 / 9) / 2)',
          }}
        />
      </div>
      
      {/* Crop frame indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="relative rounded-[24px] border-2 border-white/40 overflow-hidden"
          style={{ 
            width: 'calc(100% - 48px)', 
            aspectRatio: '9/16',
          }}
        >
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-[24px]" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-[24px]" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-[24px]" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-[24px]" />
        </div>
      </div>
      
      {/* Header with instructions */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-12 z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <button onClick={onCancel} className="p-2">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        {/* Centered hint text */}
        <div className="flex justify-center mt-4">
          <span className="text-white/50 text-sm font-medium">Pinch to zoom • Drag to adjust</span>
        </div>
      </div>
      
      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-12 px-8 z-10">
        {/* Rotation controls - only for images */}
        {!isVideo && (
          <div className="flex justify-center gap-6 mb-6">
            <button 
              onClick={handleRotateLeft} 
              className="p-3 bg-white/10 backdrop-blur-sm rounded-full active:scale-95 transition-transform"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>
            <button 
              onClick={handleRotateRight}
              className="p-3 bg-white/10 backdrop-blur-sm rounded-full active:scale-95 transition-transform"
            >
              <RotateCw className="w-6 h-6 text-white" />
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          {/* Retake button */}
          <button onClick={onRetake || onCancel} className="p-4">
            <RotateCcw className="w-8 h-8 text-white/80" />
          </button>
          
          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            className="relative w-20 h-20 rounded-full flex items-center justify-center"
          >
            <div className="absolute w-20 h-20 rounded-full border-4 border-white/30" />
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <Check className="w-8 h-8 text-black" strokeWidth={3} />
            </div>
          </button>
          
          {/* Empty space for balance */}
          <div className="p-4 w-16" />
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
