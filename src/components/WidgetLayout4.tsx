import React, { useRef } from 'react';
import { Plus, Camera } from 'lucide-react';

interface WidgetLayout4Props {
  photos: { id: string; url: string; day: number; isVideo?: boolean }[];
  onPhotoUpload: (file: File) => void;
}

// Helper to detect if URL is a video
const isVideoUrl = (url: string) => {
  return url.startsWith('data:video') || /\.(mp4|webm|mov|avi)$/i.test(url);
};

const WidgetLayout4: React.FC<WidgetLayout4Props> = ({ photos, onPhotoUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filmStripRef = useRef<HTMLDivElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[320px] mx-auto">
      {/* Polaroid Camera */}
      <div className="relative z-10 mb-[-20px]">
        {/* Camera Body */}
        <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-xl p-4 pb-0 shadow-xl border border-gray-300">
          {/* Top Section */}
          <div className="flex items-start justify-between mb-3">
            {/* Flash */}
            <div className="w-16 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-md border border-gray-400 flex items-center justify-center">
              <div className="w-12 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-sm border border-gray-300">
                <div className="w-full h-full grid grid-cols-4 gap-px p-1">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="bg-gray-300/50 rounded-sm" />
                  ))}
                </div>
              </div>
            </div>

            {/* Power Button */}
            <div className="w-3 h-3 rounded-full bg-gray-400 border border-gray-500" />

            {/* Lens Section */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 p-1 shadow-inner">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-800 p-1">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-gray-900" />
                  </div>
                </div>
              </div>
            </div>

            {/* OneStep2 Text */}
            <div className="text-right">
              <div className="text-[10px] font-light text-gray-600">One</div>
              <div className="text-[10px] font-semibold text-gray-800">Step<span className="text-red-500">2</span></div>
            </div>

            {/* Flash Light */}
            <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-amber-500 shadow-md" />
          </div>

          {/* Red Button */}
          <div className="absolute left-6 top-[72px]">
            <button
              onClick={handleUploadClick}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-700 shadow-lg hover:from-red-400 hover:to-red-500 active:scale-95 transition-all"
            />
          </div>

          {/* Bottom Black Section */}
          <div className="bg-gray-900 rounded-b-lg mt-2 p-3 -mx-4">
            {/* Rainbow Stripe and Text */}
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5">
                <div className="w-2 h-4 bg-red-500" />
                <div className="w-2 h-4 bg-orange-500" />
                <div className="w-2 h-4 bg-yellow-400" />
                <div className="w-2 h-4 bg-green-500" />
                <div className="w-2 h-4 bg-blue-500" />
              </div>
              <span className="text-white text-xs font-bold tracking-wider">Polaroid</span>
              <span className="text-gray-400 text-[8px]">i-TYPE CAMERA</span>
            </div>

            {/* Photo Slot */}
            <div className="mt-2 h-2 bg-gray-800 rounded mx-4 border-t border-gray-700" />
          </div>
        </div>
      </div>

      {/* Film Strip - Scrollable */}
      <div 
        ref={filmStripRef}
        className="relative w-[200px] max-h-[400px] overflow-y-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="relative bg-[#1a1a1a] min-h-[300px]">
          {/* Left Sprocket Holes */}
          <div className="absolute left-0 top-0 bottom-0 w-6 flex flex-col justify-start py-2 gap-2">
            {Array(Math.max(20, photos.length * 6)).fill(0).map((_, i) => (
              <div key={i} className="w-3 h-4 bg-white rounded-sm mx-1.5" />
            ))}
          </div>

          {/* Right Sprocket Holes */}
          <div className="absolute right-0 top-0 bottom-0 w-6 flex flex-col justify-start py-2 gap-2">
            {Array(Math.max(20, photos.length * 6)).fill(0).map((_, i) => (
              <div key={i} className="w-3 h-4 bg-white rounded-sm mx-1.5" />
            ))}
          </div>

          {/* Frame Numbers - Left */}
          <div className="absolute left-7 top-0 bottom-0 w-4 flex flex-col justify-start py-4">
            {photos.length > 0 ? photos.map((_, i) => (
              <div key={i} className="text-amber-500 text-[10px] font-mono mb-[120px] first:mt-8">
                {photos.length - i}
              </div>
            )) : (
              <>
                <div className="text-amber-500 text-[10px] font-mono mt-8">4</div>
                <div className="text-amber-500 text-[10px] font-mono mt-[120px]">3</div>
              </>
            )}
          </div>

          {/* Frame Numbers - Right */}
          <div className="absolute right-7 top-0 bottom-0 w-4 flex flex-col justify-start py-4">
            {photos.length > 0 ? photos.map((_, i) => (
              <div key={i} className="text-amber-500 text-[10px] font-mono mb-[120px] first:mt-8 text-right">
                {photos.length - i}
              </div>
            )) : (
              <>
                <div className="text-amber-500 text-[10px] font-mono mt-8 text-right">4</div>
                <div className="text-amber-500 text-[10px] font-mono mt-[120px] text-right">3</div>
              </>
            )}
          </div>

          {/* Triangle Markers */}
          <div className="absolute right-7 top-[70px] text-amber-500 text-[8px]">▲ 3A</div>
          <div className="absolute right-7 top-[200px] text-amber-500 text-[8px]">▲ 2A</div>

          {/* Photos as Polaroids */}
          <div className="px-8 py-4 flex flex-col items-center gap-4">
            {photos.length > 0 ? (
              [...photos].reverse().map((photo, index) => (
                <div key={photo.id} className="relative">
                  {/* Polaroid Frame */}
                  <div className="bg-white p-2 pb-6 shadow-lg transform rotate-[-2deg] hover:rotate-0 transition-transform">
                    {photo.isVideo || isVideoUrl(photo.url) ? (
                      <video
                        src={photo.url}
                        className="w-[120px] h-[100px] object-cover"
                        muted
                        loop
                        autoPlay
                        playsInline
                      />
                    ) : (
                      <img
                        src={photo.url}
                        alt={`Photo ${index + 1}`}
                        className="w-[120px] h-[100px] object-cover"
                      />
                    )}
                    {/* Date stamp */}
                    <div className="absolute bottom-8 right-3 text-[8px] text-orange-600 font-mono">
                      {new Date().toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      }).replace(/\//g, '.')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Empty Polaroid Frames */}
                <div className="bg-white p-2 pb-6 shadow-lg transform rotate-[-2deg]">
                  <div className="w-[120px] h-[100px] bg-gray-100 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-300" />
                  </div>
                </div>
                <div className="bg-white p-2 pb-6 shadow-lg transform rotate-[1deg]">
                  <div className="w-[120px] h-[100px] bg-gray-100 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-300" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUploadClick}
        className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">Add Photo</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default WidgetLayout4;
