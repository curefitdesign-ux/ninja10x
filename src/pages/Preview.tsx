import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

const Preview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [activity, setActivity] = useState<string | null>(null);

  // Store state on mount
  useEffect(() => {
    const state = location.state as { imageUrl?: string; activity?: string } | null;
    if (state?.imageUrl) {
      setImageUrl(state.imageUrl);
      setActivity(state.activity || null);
    } else {
      // Only redirect if no image data
      navigate('/');
    }
  }, []);

  const handleSave = () => {
    if (imageUrl && activity) {
      navigate('/', { state: { savePhoto: true, imageUrl, activity } });
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Show nothing while checking state
  if (!imageUrl) {
    return null;
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Blurred background image - full screen, zoomed */}
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
        {/* Header with back button */}
        <div className="h-12" />
        <button 
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm mb-4"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Main image card - centered */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="w-full max-w-[335px] aspect-[3/4] rounded-3xl overflow-hidden bg-white shadow-2xl">
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={(e) => console.log('Image load error:', e)}
            />
          </div>
        </div>

        {/* Bottom section - Data points and Health sync */}
        <div className="space-y-4 pb-6">
          {/* Data points card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4">
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/80">Duration</span>
              <span className="text-white font-semibold text-lg">2hrs</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-white/80">PR <span className="text-white/40">(Optional)</span></span>
              <span className="text-white/40">-</span>
            </div>
          </div>

          {/* Health sync widget */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg">Auto sync with a device</h3>
              <p className="text-white/60 text-sm">Sync your health & fitness data to track your progress and get better insights</p>
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

        {/* Bottom safe area */}
        <div className="h-6" />
      </div>
    </div>
  );
};

export default Preview;
