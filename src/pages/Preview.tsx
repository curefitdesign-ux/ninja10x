import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import ShakyFrame from '@/components/frames/ShakyFrame';
import JournalFrame from '@/components/frames/JournalFrame';
import VogueFrame from '@/components/frames/VogueFrame';
import FitnessFrame from '@/components/frames/FitnessFrame';
import TicketFrame from '@/components/frames/TicketFrame';
import WheelPicker from '@/components/WheelPicker';
import { useActivityDataPoints } from '@/hooks/use-activity-data-points';

const FRAMES = ['shaky', 'journal', 'vogue', 'fitness', 'ticket'] as const;
type FrameType = typeof FRAMES[number];

// Background colors matched from each template - dark gradient shades
const FRAME_COLORS: Record<FrameType, { bg: string; gradient: string }> = {
  shaky: { 
    bg: 'rgba(20, 20, 30, 0.85)', 
    gradient: 'linear-gradient(180deg, rgba(30, 30, 40, 0.9) 0%, rgba(10, 10, 15, 0.95) 100%)'
  },
  journal: { 
    bg: 'rgba(15, 60, 50, 0.85)', 
    gradient: 'linear-gradient(180deg, rgba(25, 80, 65, 0.9) 0%, rgba(10, 40, 35, 0.95) 100%)'
  },
  vogue: { 
    bg: 'rgba(40, 40, 45, 0.85)', 
    gradient: 'linear-gradient(180deg, rgba(50, 50, 55, 0.9) 0%, rgba(20, 20, 25, 0.95) 100%)'
  },
  fitness: { 
    bg: 'rgba(50, 50, 20, 0.85)', 
    gradient: 'linear-gradient(180deg, rgba(60, 60, 25, 0.9) 0%, rgba(35, 35, 15, 0.95) 100%)'
  },
  ticket: { 
    bg: 'rgba(55, 50, 45, 0.85)', 
    gradient: 'linear-gradient(180deg, rgba(65, 60, 55, 0.9) 0%, rgba(40, 35, 30, 0.95) 100%)'
  },
};

type EditingField = 'duration' | 'pr' | null;

// Generate hour options from 0 to 24
const HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => i);

const Preview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const [duration, setDuration] = useState('2hrs');
  const [pr, setPr] = useState('');
  const [currentFrame, setCurrentFrame] = useState<FrameType>('shaky');
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1.2);

  const { label1, label2 } = useActivityDataPoints(activity || '');
  
  // Bottom sheet keyboard state
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [tempValue, setTempValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  
  // Carousel state
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Single set of frames - no duplicates

  useEffect(() => {
    const state = location.state as { imageUrl?: string; isVideo?: boolean; activity?: string } | null;
    if (state?.imageUrl) {
      setImageUrl(state.imageUrl);
      setIsVideo(state.isVideo || false);
      setActivity(state.activity || null);
      // Trigger entrance animation after a brief delay
      setTimeout(() => setIsLoaded(true), 100);
    } else {
      navigate('/');
    }
  }, []);

  // Focus input when bottom sheet opens
  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingField]);

  const handleSave = async () => {
    if (!imageUrl || !activity || !frameRef.current) return;
    
    setIsSaving(true);
    
    try {
      // Capture the frame as an image
      const canvas = await html2canvas(frameRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      const framedImageUrl = canvas.toDataURL('image/png', 1.0);
      
      navigate('/', { 
        state: { 
          savePhoto: true, 
          imageUrl: isVideo ? imageUrl : framedImageUrl,
          isVideo,
          activity, 
          frame: currentFrame,
          duration,
          pr,
        } 
      });
    } catch (error) {
      console.error('Error capturing frame:', error);
      navigate('/', { 
        state: { 
          savePhoto: true, 
          imageUrl, 
          isVideo,
          activity, 
          frame: currentFrame,
          duration,
          pr,
        } 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Handle scroll to update current frame and calculate scale
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.offsetWidth * 0.75;
    const centerOffset = (container.offsetWidth - itemWidth) / 2;
    
    // Calculate which frame is in center
    const centerPosition = scrollLeft + container.offsetWidth / 2;
    const frameIndex = Math.round((centerPosition - centerOffset) / itemWidth);
    
    // Map index to original frame
    const clampedIndex = Math.max(0, Math.min(frameIndex, FRAMES.length - 1));
    const newFrame = FRAMES[clampedIndex];
    
    if (newFrame !== currentFrame) {
      setCurrentFrame(newFrame);
    }
    
    setScrollProgress(scrollLeft);
  }, [currentFrame]);

  // Scroll to first frame on mount
  useEffect(() => {
    if (containerRef.current && isLoaded) {
      const container = containerRef.current;
      const itemWidth = container.offsetWidth * 0.75;
      const targetScroll = (container.offsetWidth - itemWidth) / 2;
      container.scrollLeft = 0;
    }
  }, [isLoaded]);

  // Calculate scale for each frame based on distance from center
  const getFrameScale = (index: number): { scale: number; opacity: number } => {
    if (!containerRef.current) return { scale: index === 0 ? 1 : 0.85, opacity: index === 0 ? 1 : 0.6 };
    
    const container = containerRef.current;
    const itemWidth = container.offsetWidth * 0.75;
    const centerOffset = (container.offsetWidth - itemWidth) / 2;
    const frameCenter = index * itemWidth + itemWidth / 2 - centerOffset;
    const viewCenter = scrollProgress + container.offsetWidth / 2;
    
    const distance = Math.abs(frameCenter - viewCenter);
    const maxDistance = itemWidth;
    const scale = Math.max(0.85, 1 - (distance / maxDistance) * 0.15);
    const opacity = Math.max(0.6, 1 - (distance / maxDistance) * 0.4);
    
    return { scale, opacity };
  };

  const openEditSheet = (field: EditingField) => {
    if (field === 'duration') {
      // Extract just the number from duration (remove 'hrs')
      const numValue = parseInt(duration.replace(/[^0-9]/g, '')) || 0;
      setTempValue(String(numValue));
    } else if (field === 'pr') {
      setTempValue(pr);
    }
    setEditingField(field);
  };

  const handleWheelChange = (value: string | number) => {
    const numValue = Number(value);
    setTempValue(String(numValue));
    setDuration(numValue > 0 ? `${numValue}hrs` : '');
  };

  const handleInputChange = (value: string) => {
    setTempValue(value);
    setPr(value);
  };

  const confirmEdit = () => {
    setEditingField(null);
  };

  const closeSheet = () => {
    setEditingField(null);
  };

  if (!imageUrl) {
    return null;
  }

  const frameProps = {
    imageUrl,
    isVideo,
    activity: activity || '',
    week: 1,
    day: 1,
    duration,
    pr,
    imagePosition,
    imageScale,
    label1,
    label2,
  };

  const renderFrame = () => {
    switch (currentFrame) {
      case 'shaky':
        return <ShakyFrame {...frameProps} />;
      case 'journal':
        return <JournalFrame {...frameProps} />;
      case 'vogue':
        return <VogueFrame {...frameProps} />;
      case 'fitness':
        return <FitnessFrame {...frameProps} />;
      case 'ticket':
        return <TicketFrame {...frameProps} />;
    }
  };

  const currentIndex = FRAMES.indexOf(currentFrame);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Blurred background image with dynamic color overlay */}
      <div 
        className="absolute inset-0 scale-150 transition-all duration-500 animate-bg-drift"
        style={{
          backgroundImage: `url("${imageUrl}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(80px) brightness(0.7)',
        }}
      />
      {/* Subtle floating orbs for motion */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-64 h-64 rounded-full animate-orb-float-1"
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
            top: '10%',
            left: '-10%',
          }}
        />
        <div 
          className="absolute w-48 h-48 rounded-full animate-orb-float-2"
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
            top: '60%',
            right: '-5%',
          }}
        />
        <div 
          className="absolute w-32 h-32 rounded-full animate-orb-float-3"
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
            bottom: '20%',
            left: '20%',
          }}
        />
      </div>
      {/* Dynamic gradient overlay based on current frame */}
      <div 
        className="absolute inset-0 transition-all duration-500 animate-color-pulse"
        style={{ 
          backgroundColor: FRAME_COLORS[currentFrame].bg,
          backgroundImage: FRAME_COLORS[currentFrame].gradient 
        }}
      />
      <div className="absolute inset-0 bg-black/20 animate-subtle-pulse" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header with title aligned with arrow */}
        <div className="h-12" />
        <div className="flex items-center gap-3 mb-4 px-5">
          <button 
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-white/80 text-lg font-semibold">Select your frame</h2>
        </div>
        
        {/* Frame carousel - horizontal scroll with infinite loop effect */}
        <div className={`flex-1 flex items-center overflow-hidden ${isLoaded ? 'animate-frame-entrance' : 'opacity-0'}`}>
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="flex gap-0 overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full items-center px-[12.5vw]"
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {FRAMES.map((frame, index) => {
              const { scale, opacity } = getFrameScale(index);
              const isActiveFrame = frame === currentFrame;
              
              return (
                <div 
                  key={`${frame}-${index}`}
                  className="flex-shrink-0 snap-center h-fit flex items-center justify-center transition-all duration-150 ease-out"
                  style={{ 
                    width: 'calc(75vw)',
                    transform: `scale(${scale})`,
                    opacity,
                  }}
                >
                  <div ref={isActiveFrame ? frameRef : undefined} className="w-full">
                    {frame === 'shaky' && <ShakyFrame {...frameProps} />}
                    {frame === 'journal' && <JournalFrame {...frameProps} />}
                    {frame === 'vogue' && <VogueFrame {...frameProps} />}
                    {frame === 'fitness' && <FitnessFrame {...frameProps} />}
                    {frame === 'ticket' && <TicketFrame {...frameProps} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom section - Sticky */}
        <div className="sticky bottom-0 left-0 right-0 space-y-4 pb-6 pt-4 px-5 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
          {/* Editable data points - now tappable */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4">
            <button 
              onClick={() => openEditSheet('duration')}
              className="w-full flex justify-between items-center py-2 border-b border-white/10"
            >
              <span className="text-white/80">{label2}</span>
              <span className="text-white font-semibold text-lg">{duration || `e.g. ${label2.toLowerCase()}`}</span>
            </button>
            <button 
              onClick={() => openEditSheet('pr')}
              className="w-full flex justify-between items-center py-2"
            >
              <span className="text-white/80">{label1} <span className="text-white/40">(Optional)</span></span>
              <span className="text-white font-semibold text-lg">{pr || '-'}</span>
            </button>
          </div>

          {/* Health sync widget */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg">Auto sync with a device</h3>
              <p className="text-white/60 text-sm">Sync your health & fitness data</p>
            </div>
            <button className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="text-white font-semibold text-sm">CONNECT</span>
            </button>
          </div>

          {/* Save button - White CTA with black text */}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-white py-4 rounded-2xl disabled:opacity-50"
          >
            <span className="text-black font-bold text-lg">
              {isSaving ? 'Saving...' : 'Save Activity'}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Sheet Keyboard Overlay */}
      {editingField && (
        <>
          {/* Backdrop with blur */}
          <div 
            className="fixed inset-0 z-40 backdrop-blur-md bg-black/70"
            onClick={closeSheet}
          />
          
          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300 focus:outline-none focus-visible:outline-none" tabIndex={-1}>
            <div className="bg-white/10 backdrop-blur-2xl border-t border-white/20 rounded-t-3xl p-6 pb-10 focus:outline-none focus-visible:outline-none" tabIndex={-1}>
              {/* Handle bar */}
              <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-6" />
              
              {/* Label */}
              <p className="text-white text-lg font-semibold text-center mb-4">
                {editingField === 'duration' ? `Select ${label2}` : `Enter ${label1}`}
              </p>
              
              {editingField === 'duration' ? (
                /* Wheel Picker for Duration */
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex-1 max-w-[200px]">
                    <WheelPicker
                      items={HOUR_OPTIONS}
                      value={parseInt(tempValue) || 0}
                      onChange={handleWheelChange}
                      itemHeight={50}
                      visibleItems={5}
                    />
                  </div>
                  <span className="text-white text-2xl font-semibold">hrs</span>
                </div>
              ) : (
                /* Text Input for PR */
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 flex items-center bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 focus-within:border-white/40">
                    <input
                      ref={inputRef}
                      type="text"
                      value={tempValue}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={`e.g. ${label1}`}
                      className="flex-1 bg-transparent text-white text-xl font-semibold px-4 py-4 outline-none placeholder:text-white/30"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          confirmEdit();
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Confirm button - small white pill */}
              <button
                onClick={confirmEdit}
                className="mx-auto px-8 py-2 flex items-center justify-center rounded-full bg-white"
              >
                <span className="text-black font-semibold text-sm">Confirm</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Preview;