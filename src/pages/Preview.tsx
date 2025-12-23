import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
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
  
  // Swipe handling
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const state = location.state as { imageUrl?: string; activity?: string } | null;
    if (state?.imageUrl) {
      setImageUrl(state.imageUrl);
      setActivity(state.activity || null);
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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > 50) {
      const currentIndex = FRAMES.indexOf(currentFrame);
      if (diff > 0 && currentIndex < FRAMES.length - 1) {
        // Swipe left - next frame
        setCurrentFrame(FRAMES[currentIndex + 1]);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe right - previous frame
        setCurrentFrame(FRAMES[currentIndex - 1]);
      }
    }
  };

  const goToFrame = (direction: 'prev' | 'next') => {
    const currentIndex = FRAMES.indexOf(currentFrame);
    if (direction === 'next' && currentIndex < FRAMES.length - 1) {
      setCurrentFrame(FRAMES[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentFrame(FRAMES[currentIndex - 1]);
    }
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

        {/* Frame carousel - horizontal scroll */}
        <div className="flex-1 flex items-center overflow-hidden -mx-5">
          <div 
            ref={containerRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-full items-center px-3"
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {FRAMES.map((frame, index) => (
              <div 
                key={frame}
                className="flex-shrink-0 snap-center h-fit flex items-center justify-center"
                style={{ width: 'calc(85vw)', transform: 'scale(0.95)' }}
                onClick={() => setCurrentFrame(frame)}
              >
                <div ref={index === currentIndex ? frameRef : undefined} className="w-full">
                  {frame === 'shaky' && <ShakyFrame {...frameProps} />}
                  {frame === 'journal' && <JournalFrame {...frameProps} />}
                  {frame === 'vogue' && <VogueFrame {...frameProps} />}
                </div>
              </div>
            ))}
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
            className="fixed inset-0 z-40 backdrop-blur-md bg-black/40"
            onClick={closeSheet}
          />
          
          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
            <div className="bg-white/10 backdrop-blur-2xl border-t border-white/20 rounded-t-3xl p-6 pb-10">
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