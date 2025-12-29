import { User, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import cardBackground from '@/assets/card-background.png';
import shuttlecockIcon from '@/assets/frames/shuttlecock.png';

interface Photo {
  id: string;
  url: string;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue';
  duration?: string;
  pr?: string;
  uploadDate: string;
}

interface WidgetLayout3Props {
  photos: Photo[];
  onAddPhoto: () => void;
  currentDate: string;
}

const WidgetLayout3 = ({ 
  photos, 
  onAddPhoto,
}: WidgetLayout3Props) => {
  const navigate = useNavigate();
  
  // Get the latest photo for center display
  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;

  const handlePhotoTap = (photo: Photo) => {
    navigate('/preview', { 
      state: { 
        imageUrl: photo.url, 
        activity: photo.activity,
        frame: photo.frame,
        duration: photo.duration,
        pr: photo.pr,
        isReview: true
      } 
    });
  };

  return (
    <div className="px-5">
      {/* Ninja Widget */}
      <div 
        className="glass-card p-5 relative overflow-hidden w-full"
        style={{ backgroundImage: `url(${cardBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Cult Ninja Tag */}
        <div className="flex justify-center mb-4">
          <div className="px-4 py-2 rounded-full border border-foreground/30 bg-background/30 backdrop-blur-sm">
            <span className="text-sm font-semibold text-foreground tracking-wider">CULT NINJA</span>
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-bold text-foreground text-center mb-6 relative z-10">
          CONQUER WILL POWER
        </h2>
      
        {/* Single Center Photo Card */}
        <div className="relative z-10 mb-6 flex justify-center" style={{ minHeight: '220px' }}>
          {latestPhoto ? (
            <div 
              className="relative cursor-pointer"
              onClick={() => handlePhotoTap(latestPhoto)}
              style={{ transform: 'rotate(2deg)' }}
            >
              {/* Main Card */}
              <div 
                className="relative bg-white rounded-2xl overflow-hidden shadow-2xl"
                style={{ width: '180px' }}
              >
                {/* Card holes at top */}
                <div className="absolute top-2.5 left-0 right-0 flex justify-center gap-2 z-20">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-2 h-2 rounded-full"
                      style={{ background: '#4a4a6a' }}
                    />
                  ))}
                </div>

                {/* Photo */}
                <div className="relative pt-8 px-2">
                  <img
                    src={latestPhoto.url}
                    alt={latestPhoto.activity || 'Photo'}
                    className="w-full aspect-[4/3] object-cover rounded-lg"
                  />
                  
                  {/* Activity icon */}
                  <div className="absolute bottom-2 left-3 w-8 h-8">
                    <img src={shuttlecockIcon} alt="" className="w-full h-full object-contain" />
                  </div>
                </div>

                {/* Card Info Section */}
                <div className="px-2.5 py-2 bg-white">
                  {/* Week/Day and Location */}
                  <div className="flex justify-between items-center mb-1">
                    <div 
                      className="px-1.5 py-0.5 rounded text-[7px] font-bold text-white uppercase"
                      style={{ background: '#2dd4bf' }}
                    >
                      Photo #{photos.length}
                    </div>
                    <div 
                      className="px-1 py-0.5 rounded text-[7px] font-medium"
                      style={{ background: '#a7f3d0', color: '#047857' }}
                    >
                      {latestPhoto.uploadDate}
                    </div>
                  </div>

                  {/* Activity Name */}
                  <h3 
                    className="text-sm font-bold text-gray-800 mb-1"
                    style={{ fontStyle: 'italic' }}
                  >
                    {latestPhoto.activity || 'Activity'}
                  </h3>

                  {/* Horizontal lines */}
                  <div className="space-y-0.5 mb-1.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-px bg-gray-200" />
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between text-center">
                    <div>
                      <p className="text-[8px] text-gray-500">Duration</p>
                      <p className="text-xs font-bold text-gray-800">{latestPhoto.duration || '02hrs'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-500">Rounds</p>
                      <p className="text-xs font-bold text-gray-800">{latestPhoto.pr || '10'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-500">Calories</p>
                      <p className="text-xs font-bold text-gray-800">400</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State Card */
            <div 
              className="relative cursor-pointer"
              onClick={onAddPhoto}
            >
              <div 
                className="flex flex-col items-center justify-center rounded-2xl"
                style={{ 
                  width: '160px',
                  height: '200px',
                  background: 'rgba(70, 70, 90, 0.9)',
                  border: '2px solid rgba(255,255,255,0.25)',
                  boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
                }}
              >
                <div className="relative w-16 h-16">
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white/30 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white/30 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white/30 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white/30 rounded-br-lg" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User className="w-8 h-8 text-white/30" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-xs text-white/50 mt-3 font-medium">Add your first photo</p>
              </div>
            </div>
          )}
        </div>
      
        {/* Film Strip Section - 12 blocks */}
        <div className="relative z-10">
          <div className="grid grid-cols-6 gap-1.5">
            {[...Array(12)].map((_, index) => {
              const photo = photos[index];
              return (
                <div 
                  key={index}
                  className="aspect-[3/4] overflow-hidden cursor-pointer hover:ring-1 hover:ring-white/50 transition-all"
                  style={{ 
                    background: '#1a1a1a',
                    borderRadius: '10px'
                  }}
                  onClick={() => photo && handlePhotoTap(photo)}
                >
                  {photo ? (
                    <img
                      src={photo.url}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ borderRadius: '10px' }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upload Button Below Widget */}
      <div className="flex justify-center mt-4">
        <button
          onClick={onAddPhoto}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #FF4D4D 0%, #FF3333 100%)',
            boxShadow: '0 4px 15px rgba(255,77,77,0.4)'
          }}
        >
          <Plus className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm">Add Photo</span>
        </button>
      </div>
    </div>
  );
};

export default WidgetLayout3;
