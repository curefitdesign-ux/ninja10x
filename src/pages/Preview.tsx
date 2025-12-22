import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import ShakyFrame from '@/components/frames/ShakyFrame';
import JournalFrame from '@/components/frames/JournalFrame';
import VogueFrame from '@/components/frames/VogueFrame';

const FRAMES = ['shaky', 'journal', 'vogue'] as const;
type FrameType = typeof FRAMES[number];

type EditingField = 'duration' | 'pr' | null;

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
  const inputRef = useRef<HTMLInputElement>(null);
  
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

  const handleSave = () => {
    if (imageUrl && activity) {
      navigate('/', { state: { savePhoto: true, imageUrl, activity } });
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
      setTempValue(duration);
    } else if (field === 'pr') {
      setTempValue(pr);
    }
    setEditingField(field);
  };

  const handleInputChange = (value: string) => {
    setTempValue(value);
    // Live update the preview
    if (editingField === 'duration') {
      setDuration(value);
    } else if (editingField === 'pr') {
      setPr(value);
    }
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

        {/* Frame carousel */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="relative w-full max-w-[335px]">
            {/* Navigation arrows */}
            {currentIndex > 0 && (
              <button 
                onClick={() => goToFrame('prev')}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            )}
            {currentIndex < FRAMES.length - 1 && (
              <button 
                onClick={() => goToFrame('next')}
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            )}

            {/* Swipeable frame container */}
            <div 
              ref={containerRef}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="transition-transform duration-300"
            >
              {renderFrame()}
            </div>

            {/* Frame indicator dots */}
            <div className="flex justify-center gap-2 mt-4">
              {FRAMES.map((frame, index) => (
                <button
                  key={frame}
                  onClick={() => setCurrentFrame(frame)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-white w-6' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
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
            className="w-full bg-[#FF4D4D] py-4 rounded-2xl"
          >
            <span className="text-white font-bold text-lg">Save Activity</span>
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
              <p className="text-white/60 text-sm mb-2">
                {editingField === 'duration' ? 'Duration' : 'Personal Record (PR)'}
              </p>
              
              {/* Input with confirm button */}
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={tempValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={editingField === 'duration' ? 'e.g. 2hrs 30min' : 'e.g. 100kg bench press'}
                  className="flex-1 bg-white/10 backdrop-blur-sm text-white text-xl font-semibold px-4 py-4 rounded-2xl outline-none border border-white/20 focus:border-white/40 placeholder:text-white/30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      confirmEdit();
                    }
                  }}
                />
                <button
                  onClick={confirmEdit}
                  className="w-14 h-14 flex items-center justify-center rounded-2xl bg-green-500"
                >
                  <Check className="w-6 h-6 text-white" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Preview;