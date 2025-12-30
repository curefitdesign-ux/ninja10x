import { X, Download, Link, MessageCircle } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';

interface ShareSheetProps {
  imageUrl: string;
  isVideo?: boolean;
  onClose: () => void;
}

// Social platform icons with brand colors
const socialApps = [
  { 
    name: 'WhatsApp', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: '#25D366',
    share: (url: string) => `https://wa.me/?text=${encodeURIComponent('Check out my activity! ' + url)}`
  },
  { 
    name: 'Instagram', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    color: '#E4405F',
    share: () => null // Instagram doesn't support direct web sharing
  },
  { 
    name: 'X', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    color: '#000000',
    share: (url: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out my activity!')}&url=${encodeURIComponent(url)}`
  },
  { 
    name: 'Facebook', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: '#1877F2',
    share: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  },
  { 
    name: 'Telegram', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    color: '#0088cc',
    share: (url: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Check out my activity!')}`
  },
  { 
    name: 'Messages', 
    icon: <MessageCircle className="w-7 h-7" />,
    color: '#34C759',
    share: (url: string) => `sms:?body=${encodeURIComponent('Check out my activity! ' + url)}`
  },
];

const ShareSheet = ({ imageUrl, isVideo, onClose }: ShareSheetProps) => {
  
  const handleShare = async (app: typeof socialApps[0]) => {
    triggerHaptic('medium');
    
    // Try native share if available
    if (navigator.share) {
      try {
        // Convert data URL to blob for sharing
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `activity.${isVideo ? 'mp4' : 'png'}`, { type: blob.type });
        
        await navigator.share({
          title: 'My Activity',
          text: 'Check out my activity!',
          files: [file],
        });
        onClose();
        return;
      } catch (err) {
        // Fall back to URL sharing
        console.log('Native share failed, falling back to URL');
      }
    }
    
    // Open share URL
    const shareUrl = app.share(window.location.href);
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = async () => {
    triggerHaptic('success');
    
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `activity-${Date.now()}.${isVideo ? 'mp4' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleCopyLink = async () => {
    triggerHaptic('light');
    
    try {
      await navigator.clipboard.writeText(window.location.href);
      // Could show a toast here
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Share Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
        <div 
          className="bg-background/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl overflow-hidden"
          style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>
          
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 tap-bounce"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
          
          {/* Preview */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-20 h-28 rounded-xl overflow-hidden bg-white/5 flex-shrink-0"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
              >
                {isVideo ? (
                  <video 
                    src={imageUrl} 
                    className="w-full h-full object-contain bg-black"
                    muted
                    playsInline
                  />
                ) : (
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain bg-black"
                  />
                )}
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Share your activity</h3>
                <p className="text-white/50 text-sm">Choose where to share</p>
              </div>
            </div>
          </div>
          
          {/* Social Apps Grid */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-6 gap-3">
              {socialApps.map((app) => (
                <button
                  key={app.name}
                  onClick={() => handleShare(app)}
                  className="flex flex-col items-center gap-1.5 tap-bounce"
                >
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-transform hover:scale-105"
                    style={{ backgroundColor: app.color }}
                  >
                    {app.icon}
                  </div>
                  <span className="text-white/70 text-[10px] font-medium">{app.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="px-6 pb-8 pt-2 flex gap-3">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 tap-bounce"
            >
              <Link className="w-5 h-5 text-white/70" />
              <span className="text-white/80 font-medium text-sm">Copy Link</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 tap-bounce"
            >
              <Download className="w-5 h-5 text-white/70" />
              <span className="text-white/80 font-medium text-sm">Save Image</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShareSheet;
