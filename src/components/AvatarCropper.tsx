import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, ZoomIn, ZoomOut } from 'lucide-react';

interface AvatarCropperProps {
  imageSrc: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

interface Transform {
  scale: number;
  x: number;
  y: number;
}

const AvatarCropper = ({ imageSrc, onConfirm, onCancel }: AvatarCropperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [cropSize, setCropSize] = useState(240);
  const [baseScale, setBaseScale] = useState(1);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomIndicatorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate crop size based on viewport
  useEffect(() => {
    const updateCropSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Make crop circle about 60% of screen width, max 280px
        const size = Math.min(containerWidth * 0.65, 280);
        setCropSize(size);
      }
    };
    
    updateCropSize();
    window.addEventListener('resize', updateCropSize);
    return () => window.removeEventListener('resize', updateCropSize);
  }, []);

  // Calculate base scale to cover crop area
  useEffect(() => {
    if (imageDimensions.width > 0 && imageDimensions.height > 0 && cropSize > 0) {
      // Scale to cover the circular crop area (use smaller dimension)
      const minDimension = Math.min(imageDimensions.width, imageDimensions.height);
      const newBaseScale = cropSize / minDimension;
      setBaseScale(newBaseScale);
      setTransform({ scale: 1, x: 0, y: 0 });
    }
  }, [imageDimensions, cropSize]);

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Constrain transform to keep image covering the crop area
  const constrainTransform = useCallback((t: Transform): Transform => {
    if (cropSize === 0 || imageDimensions.width === 0) return t;
    
    const effectiveScale = baseScale * t.scale;
    const scaledWidth = imageDimensions.width * effectiveScale;
    const scaledHeight = imageDimensions.height * effectiveScale;
    
    // Calculate max offset to keep crop area covered
    const maxX = Math.max(0, (scaledWidth - cropSize) / 2);
    const maxY = Math.max(0, (scaledHeight - cropSize) / 2);
    
    return {
      scale: Math.max(1, Math.min(4, t.scale)),
      x: Math.max(-maxX, Math.min(maxX, t.x)),
      y: Math.max(-maxY, Math.min(maxY, t.y)),
    };
  }, [baseScale, imageDimensions, cropSize]);

  // Touch handlers
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

  // Mouse handlers
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

  const showZoomIndicatorWithTimeout = useCallback(() => {
    setShowZoomIndicator(true);
    if (zoomIndicatorTimeout.current) {
      clearTimeout(zoomIndicatorTimeout.current);
    }
    zoomIndicatorTimeout.current = setTimeout(() => {
      setShowZoomIndicator(false);
    }, 1500);
  }, []);

  const handleZoomIn = () => {
    setTransform(prev => constrainTransform({ ...prev, scale: prev.scale * 1.25 }));
    showZoomIndicatorWithTimeout();
  };

  const handleZoomOut = () => {
    setTransform(prev => constrainTransform({ ...prev, scale: prev.scale / 1.25 }));
    showZoomIndicatorWithTimeout();
  };

  useEffect(() => {
    return () => {
      if (zoomIndicatorTimeout.current) {
        clearTimeout(zoomIndicatorTimeout.current);
      }
    };
  }, []);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
  };

  // Confirm crop - render circular crop to canvas
  const handleConfirm = async () => {
    if (!canvasRef.current || !imageRef.current || cropSize === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Output as square (will be displayed as circle)
    const outputSize = 400;
    canvas.width = outputSize;
    canvas.height = outputSize;
    
    const image = imageRef.current;
    const effectiveScale = baseScale * transform.scale;
    
    // Calculate source coordinates
    const scaledWidth = imageDimensions.width * effectiveScale;
    const scaledHeight = imageDimensions.height * effectiveScale;
    
    const cropCenterX = scaledWidth / 2 - transform.x;
    const cropCenterY = scaledHeight / 2 - transform.y;
    
    const srcCenterX = cropCenterX / effectiveScale;
    const srcCenterY = cropCenterY / effectiveScale;
    const srcSize = cropSize / effectiveScale;
    
    const srcX = srcCenterX - srcSize / 2;
    const srcY = srcCenterY - srcSize / 2;
    
    // Draw with circular clip
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    ctx.drawImage(
      image,
      srcX, srcY, srcSize, srcSize,
      0, 0, outputSize, outputSize
    );
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onConfirm(dataUrl);
  };

  const getImageStyle = () => {
    if (imageDimensions.width === 0) return {};
    
    const effectiveScale = baseScale * transform.scale;
    const displayWidth = imageDimensions.width * effectiveScale;
    const displayHeight = imageDimensions.height * effectiveScale;
    
    return {
      width: displayWidth,
      height: displayHeight,
      transform: `translate(${transform.x}px, ${transform.y}px)`,
      transition: isDragging ? 'none' : 'transform 0.15s ease-out',
    };
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden"
      style={{ 
        height: '100dvh', 
        maxHeight: '100dvh',
      }}
    >
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Blur Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={imageSrc}
          alt="Background"
          className="w-full h-full object-cover blur-2xl scale-110 opacity-40"
        />
      </div>
      
      {/* Main editing area */}
      <div
        className="absolute inset-0 overflow-hidden touch-none flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Edit"
          className="absolute pointer-events-none"
          style={getImageStyle()}
          onLoad={handleImageLoad}
        />
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
      
      {/* Circular crop overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Dark overlay with circular cutout */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle ${cropSize / 2}px at 50% 50%, transparent 100%, rgba(0, 0, 0, 0.7) 100%)`,
          }}
        />
        
        {/* Circle border */}
        <div 
          className="rounded-full border-4 border-white/80"
          style={{ 
            width: cropSize, 
            height: cropSize,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          }}
        />
      </div>
      
      {/* Header */}
      <div 
        className="absolute top-0 left-0 right-0 z-10"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)', padding: '0 20px' }}
      >
        <div className="flex items-center justify-between pt-3">
          <div className="flex-1" />
          <button onClick={onCancel} className="p-2 -mr-2 active:scale-95 transition-transform">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        <div className="flex justify-center mt-2">
          <span className="text-white/50 text-sm font-medium">Pinch to zoom • Drag to adjust</span>
        </div>
      </div>
      
      {/* Bottom controls */}
      <div 
        className="absolute bottom-0 left-0 right-0 px-6 z-10"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
      >
        {/* Zoom controls */}
        <div className="flex justify-center gap-4 mb-6">
          <button 
            onClick={handleZoomOut} 
            className="p-3 bg-white/10 backdrop-blur-sm rounded-full active:scale-95 transition-transform"
          >
            <ZoomOut className="w-6 h-6 text-white" />
          </button>
          <button 
            onClick={handleZoomIn} 
            className="p-3 bg-white/10 backdrop-blur-sm rounded-full active:scale-95 transition-transform"
          >
            <ZoomIn className="w-6 h-6 text-white" />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          {/* Cancel */}
          <button onClick={onCancel} className="p-4">
            <X className="w-8 h-8 text-white/80" />
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
          
          {/* Spacer */}
          <div className="p-4 w-16" />
        </div>
      </div>
    </div>
  );
};

export default AvatarCropper;

