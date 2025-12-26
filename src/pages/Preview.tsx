import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import ShakyFrame from '@/components/frames/ShakyFrame';
import JournalFrame from '@/components/frames/JournalFrame';
import VogueFrame from '@/components/frames/VogueFrame';
import WheelPicker from '@/components/WheelPicker';

const FRAMES = ['shaky', 'journal', 'vogue'] as const;
type FrameType = typeof FRAMES[number];

type EditingField = 'duration' | 'pr' | null;

// Generate hour options from 0 to 24
const HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => i);

const Preview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [activity, setActivity] = useState<string | null>(null);
  const [duration, setDuration] = useState('2hrs');
  const [pr, setPr] = useState('');
  const [currentFrame, setCurrentFrame] = useState<FrameType>('shaky');
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1.2);
  
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

  // Create extended frames for infinite loop effect (duplicate frames at start and end)
  const extendedFrames = [...FRAMES, ...FRAMES, ...FRAMES];

  useEffect(() => {
    const state = location.state as { imageUrl?: string; activity?: string } | null;
    if (state?.imageUrl) {
      setImageUrl(state.imageUrl);
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
          imageUrl: framedImageUrl,
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
    
    // Handle infinite loop - map extended index back to original frame
    const normalizedIndex = ((frameIndex % FRAMES.length) + FRAMES.length) % FRAMES.length;
    const newFrame = FRAMES[normalizedIndex];
    
    if (newFrame !== currentFrame) {
      setCurrentFrame(newFrame);
    }
    
    setScrollProgress(scrollLeft);
  }, [currentFrame]);

  // Scroll to center on mount
  useEffect(() => {
    if (containerRef.current && isLoaded) {
      const container = containerRef.current;
      const itemWidth = container.offsetWidth * 0.75;
      // Start at the middle set of frames
      const startIndex = FRAMES.length;
      const targetScroll = startIndex * itemWidth - (container.offsetWidth - itemWidth) / 2;
      container.scrollLeft = targetScroll;
    }
  }, [isLoaded]);

  // Calculate scale for each frame based on distance from center
  const getFrameScale = (index: number): { scale: number; opacity: number } => {
    if (!containerRef.current) return { scale: index === FRAMES.length ? 1 : 0.85, opacity: index === FRAMES.length ? 1 : 0.6 };
    
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
    activity: activity || '',
    week: 1,
    day: 1,
    duration,
    pr,
    imagePosition,
    imageScale,
  };

  const renderFrame = () => {
    switch (currentFrame) {
      case 'shaky':
        return <ShakyFrame {...frameProps} />;
      case 'journal':
        return <JournalFrame {...frameProps} />;
      case 'vogue':
        return <VogueFrame {...frameProps} />;
    }
  };

  const currentIndex = FRAMES.indexOf(currentFrame);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Blurred background image */}
      <div 
        className="absolute inset-0 scale-150"
        style={{
          backgroundImage: `url("${imageUrl}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(50px)',
        }}
      />
      <div className="absolute inset-0 bg-black/20" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen px-5">
        {/* Header */}
        <div className="h-12" />
        <button 
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm mb-4"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Frame carousel - horizontal scroll with infinite loop effect */}
        <div className={`flex-1 flex items-center overflow-hidden -mx-5 ${isLoaded ? 'animate-frame-entrance' : 'opacity-0'}`}>
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full items-center"
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {extendedFrames.map((frame, index) => {
              const { scale, opacity } = getFrameScale(index);
              const isCurrentFrame = frame === currentFrame && Math.abs(scale - 1) < 0.05;
              
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
                  <div ref={isCurrentFrame ? frameRef : undefined} className="w-full">
                    {frame === 'shaky' && <ShakyFrame {...frameProps} />}
                    {frame === 'journal' && <JournalFrame {...frameProps} />}
                    {frame === 'vogue' && <VogueFrame {...frameProps} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom section */}
        <div className="space-y-4 pb-6">
          {/* Editable data points - now tappable */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4">
            <button 
              onClick={() => openEditSheet('duration')}
              className="w-full flex justify-between items-center py-2 border-b border-white/10"
            >
              <span className="text-white/80">Duration</span>
              <span className="text-white font-semibold text-lg">{duration || 'e.g. 2hrs'}</span>
            </button>
            <button 
              onClick={() => openEditSheet('pr')}
              className="w-full flex justify-between items-center py-2"
            >
              <span className="text-white/80">PR <span className="text-white/40">(Optional)</span></span>
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

          {/* Save button */}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#FF4D4D] py-4 rounded-2xl disabled:opacity-50"
          >
            <span className="text-white font-bold text-lg">
              {isSaving ? 'Saving...' : 'Save Activity'}
            </span>
          </button>
        </div>

        <div className="h-6" />
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
                {editingField === 'duration' ? 'Select Duration' : 'Personal Record (PR)'}
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
                      placeholder="e.g. 100kg bench press"
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