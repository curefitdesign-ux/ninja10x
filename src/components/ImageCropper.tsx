import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

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

const CROP_ASPECT_RATIO = 9 / 16; // 9:16 aspect ratio

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
  const [cropDimensions, setCropDimensions] = useState({ width: 0, height: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomIndicatorTimeout = useRef<NodeJS.Timeout | null>(null);

  // Calculate crop area dimensions
  useEffect(() => {
    const updateCropDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        // Calculate crop area to fit 9:16 aspect ratio within container
        const cropWidth = containerWidth - 48; // 24px padding each side
        const cropHeight = cropWidth / CROP_ASPECT_RATIO;
        
        setCropDimensions({ width: cropWidth, height: cropHeight });
      }
    };
    
    updateCropDimensions();
    window.addEventListener('resize', updateCropDimensions);
    return () => window.removeEventListener('resize', updateCropDimensions);
  }, []);

  // Calculate base scale when media loads to ensure it covers the crop area
  useEffect(() => {
    if (mediaDimensions.width > 0 && mediaDimensions.height > 0 && cropDimensions.width > 0) {
      const mediaAspect = mediaDimensions.width / mediaDimensions.height;
      const cropAspect = CROP_ASPECT_RATIO;
      
      let newBaseScale: number;
      
      // Calculate scale needed to cover the crop area completely
      if (mediaAspect > cropAspect) {
        // Image is wider than crop area - scale based on height to cover
        newBaseScale = cropDimensions.height / mediaDimensions.height;
      } else {
        // Image is taller than crop area - scale based on width to cover
        newBaseScale = cropDimensions.width / mediaDimensions.width;
      }
      
      setBaseScale(newBaseScale);
      setTransform({ scale: 1, x: 0, y: 0, rotation: 0 });
    }
  }, [mediaDimensions, cropDimensions]);

  // Calculate distance between two touch points
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Constrain transform to keep media covering the crop area
  const constrainTransform = useCallback((t: Transform): Transform => {
    if (cropDimensions.width === 0 || mediaDimensions.width === 0) return t;
    
    const effectiveScale = baseScale * t.scale;
    const scaledWidth = mediaDimensions.width * effectiveScale;
    const scaledHeight = mediaDimensions.height * effectiveScale;
    
    // Calculate max allowed offset to keep crop area covered
    const maxX = Math.max(0, (scaledWidth - cropDimensions.width) / 2);
    const maxY = Math.max(0, (scaledHeight - cropDimensions.height) / 2);
    
    return {
      scale: Math.max(1, Math.min(4, t.scale)), // 1x to 4x relative to base
      x: Math.max(-maxX, Math.min(maxX, t.x)),
      y: Math.max(-maxY, Math.min(maxY, t.y)),
      rotation: t.rotation,
    };
  }, [baseScale, mediaDimensions, cropDimensions]);

  // Touch handlers for pinch-to-zoom and pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialDistance(distance);
      setInitialScale(transform.scale);
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - transform.x, y: e.touches[0].clientY - transform.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2 && initialDistance !== null) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      const newScale = initialScale * (distance / initialDistance);
      setTransform(prev => constrainTransform({ ...prev, scale: newScale }));
      showZoomIndicatorWithTimeout();
    } else if (e.touches.length === 1 && isDragging) {
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      setTransform(prev => constrainTransform({ ...prev, x: newX, y: newY }));
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
    setTransform(prev => constrainTransform({ ...prev, x: newX, y: newY }));
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
    setTransform(prev => constrainTransform({ ...prev, scale: prev.scale * 1.25 }));
    showZoomIndicatorWithTimeout();
  };

  const handleZoomOut = () => {
    setTransform(prev => constrainTransform({ ...prev, scale: prev.scale / 1.25 }));
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

  // Confirm crop - render to canvas with proper aspect ratio
  const handleConfirm = async () => {
    if (!canvasRef.current || !mediaRef.current || cropDimensions.width === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Output dimensions - 9:16 aspect ratio at good resolution
    const outputWidth = 540;
    const outputHeight = 960;
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    
    const media = mediaRef.current;
    
    // Calculate the effective scale (base scale * user zoom)
    const effectiveScale = baseScale * transform.scale;
    
    // The crop area dimensions in screen pixels
    const cropWidth = cropDimensions.width;
    const cropHeight = cropDimensions.height;
    
    // The media is displayed at: mediaDimensions * effectiveScale
    // The media is centered in the container, then offset by transform.x/y
    // The crop area is centered in the container
    
    // Convert crop area bounds to source image coordinates:
    // 1. The media's center is at (scaledMediaWidth/2, scaledMediaHeight/2) in its own coordinate system
    // 2. On screen, the media center is offset by transform.x, transform.y from the crop center
    // 3. So the crop center in scaled media coords is: (scaledMediaWidth/2 - transform.x, scaledMediaHeight/2 - transform.y)
    
    const scaledMediaWidth = mediaDimensions.width * effectiveScale;
    const scaledMediaHeight = mediaDimensions.height * effectiveScale;
    
    // Crop center in scaled media coordinates
    const cropCenterInScaledX = scaledMediaWidth / 2 - transform.x;
    const cropCenterInScaledY = scaledMediaHeight / 2 - transform.y;
    
    // Convert to original media coordinates by dividing by effectiveScale
    const srcCenterX = cropCenterInScaledX / effectiveScale;
    const srcCenterY = cropCenterInScaledY / effectiveScale;
    
    // The crop dimensions in original media coordinates
    const srcWidth = cropWidth / effectiveScale;
    const srcHeight = cropHeight / effectiveScale;
    
    // Source rectangle top-left
    const srcX = srcCenterX - srcWidth / 2;
    const srcY = srcCenterY - srcHeight / 2;
    
    // Fill background (in case of any gaps)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, outputWidth, outputHeight);
    
    // Apply rotation if needed
    if (transform.rotation !== 0) {
      ctx.save();
      ctx.translate(outputWidth / 2, outputHeight / 2);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.translate(-outputWidth / 2, -outputHeight / 2);
    }
    
    // Draw the cropped portion - maintaining aspect ratio perfectly
    ctx.drawImage(
      media,
      srcX, srcY, srcWidth, srcHeight,
      0, 0, outputWidth, outputHeight
    );
    
    if (transform.rotation !== 0) {
      ctx.restore();
    }
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onConfirm(dataUrl, false);
  };

  // Calculate display dimensions for the media element
  const getMediaStyle = () => {
    if (mediaDimensions.width === 0 || mediaDimensions.height === 0) {
      return {};
    }
    
    const effectiveScale = baseScale * transform.scale;
    const displayWidth = mediaDimensions.width * effectiveScale;
    const displayHeight = mediaDimensions.height * effectiveScale;
    
    return {
      width: displayWidth,
      height: displayHeight,
      transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}deg)`,
      transition: isDragging ? 'none' : 'transform 0.15s ease-out',
    };
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
        className="absolute inset-0 overflow-hidden touch-none flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Media with transform - positioned absolutely for precise control */}
        {isVideo ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={mediaSrc}
            autoPlay
            loop
            muted
            playsInline
            className="absolute pointer-events-none"
            style={getMediaStyle()}
            onLoadedMetadata={handleMediaLoad}
          />
        ) : (
          <img
            ref={mediaRef as React.RefObject<HTMLImageElement>}
            src={mediaSrc}
            alt="Edit"
            className="absolute pointer-events-none"
            style={getMediaStyle()}
            onLoad={handleMediaLoad}
          />
        )}
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
            height: `calc((100% - ${cropDimensions.height}px) / 2)`,
          }}
        />
        {/* Bottom blur section */}
        <div 
          className="absolute bottom-0 left-0 right-0 backdrop-blur-xl bg-black/40"
          style={{ 
            height: `calc((100% - ${cropDimensions.height}px) / 2)`,
          }}
        />
        {/* Left blur section */}
        <div 
          className="absolute left-0 backdrop-blur-xl bg-black/40"
          style={{ 
            width: '24px',
            top: `calc((100% - ${cropDimensions.height}px) / 2)`,
            height: cropDimensions.height,
          }}
        />
        {/* Right blur section */}
        <div 
          className="absolute right-0 backdrop-blur-xl bg-black/40"
          style={{ 
            width: '24px',
            top: `calc((100% - ${cropDimensions.height}px) / 2)`,
            height: cropDimensions.height,
          }}
        />
      </div>
      
      {/* Crop frame indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="relative rounded-[24px] border-2 border-white/40 overflow-hidden"
          style={{ 
            width: cropDimensions.width, 
            height: cropDimensions.height,
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
        {/* Zoom and rotation controls - only for images */}
        {!isVideo && (
          <div className="flex justify-center gap-4 mb-6">
            <button 
              onClick={handleZoomOut} 
              className="p-3 bg-white/10 backdrop-blur-sm rounded-full active:scale-95 transition-transform"
            >
              <ZoomOut className="w-6 h-6 text-white" />
            </button>
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
            <button 
              onClick={handleZoomIn} 
              className="p-3 bg-white/10 backdrop-blur-sm rounded-full active:scale-95 transition-transform"
            >
              <ZoomIn className="w-6 h-6 text-white" />
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
