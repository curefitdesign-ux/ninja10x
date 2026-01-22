import { X, Download, Link, MessageCircle, Check, Copy } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import { useState } from 'react';

interface ShareSheetProps {
  imageUrl: string;
  isVideo?: boolean;
  onClose: () => void;
  onSaveWithTemplate?: () => void;
}

// Social platform icons with brand colors and deep linking
const socialApps = [
  { 
    name: 'WhatsApp', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: '#25D366',
    share: (text: string) => `whatsapp://send?text=${encodeURIComponent(text)}`
  },
  { 
    name: 'Instagram', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    color: '#E4405F',
    share: () => `instagram://` // Opens Instagram app
  },
  { 
    name: 'X', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    color: '#000000',
    share: (text: string) => `twitter://post?message=${encodeURIComponent(text)}`
  },
  { 
    name: 'Facebook', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: '#1877F2',
    share: (text: string) => `fb://publish/profile/me?text=${encodeURIComponent(text)}`
  },
  { 
    name: 'Telegram', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    color: '#0088cc',
    share: (text: string) => `tg://msg?text=${encodeURIComponent(text)}`
  },
  { 
    name: 'Messages', 
    icon: <MessageCircle className="w-7 h-7" />,
    color: '#34C759',
    share: (text: string) => `sms:?body=${encodeURIComponent(text)}`
  },
  { 
    name: 'Snapchat', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.076-.375-.09-.84-.195-1.455-.195-.405 0-.84.045-1.29.135-.63.135-1.2.57-1.815 1.035-.855.63-1.725 1.29-2.91 1.29h-.075c-1.2-.015-2.055-.66-2.91-1.275-.615-.465-1.185-.9-1.815-1.035-.435-.09-.87-.135-1.29-.135-.66 0-1.11.105-1.455.195-.24.06-.42.076-.54.076h-.03c-.285 0-.48-.135-.555-.42-.06-.181-.105-.375-.135-.554-.029-.196-.104-.464-.165-.555-1.858-.284-2.895-.702-3.135-1.275-.03-.074-.045-.149-.045-.224 0-.24.18-.465.435-.509 3.27-.539 4.737-3.878 4.792-4.014l.016-.03c.18-.33.195-.63.119-.855-.195-.465-.884-.689-1.333-.824-.135-.045-.255-.09-.344-.119-.809-.315-1.214-.705-1.214-1.154 0-.33.27-.659.689-.808.15-.061.33-.09.509-.09.12 0 .285.016.435.09.391.165.72.27 1.02.286.315 0 .435-.06.465-.075l-.015-.226c-.105-1.627-.225-3.654.3-4.832C6.32 1.071 9.676.793 10.664.793h1.542z"/>
      </svg>
    ),
    color: '#FFFC00',
    share: () => `snapchat://`
  },
  { 
    name: 'LinkedIn', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    color: '#0A66C2',
    share: (text: string) => `linkedin://shareArticle?mini=true&summary=${encodeURIComponent(text)}`
  },
];

const ShareSheet = ({ imageUrl, isVideo, onClose, onSaveWithTemplate }: ShareSheetProps) => {
  const [copied, setCopied] = useState(false);
  
  const shareText = '🏃 Check out my fitness activity! #FitnessJourney #HealthyLifestyle';
  const shareUrl = window.location.href;
  const fullShareText = `${shareText}\n\n${shareUrl}`;
  
  const handleShare = async (app: typeof socialApps[0]) => {
    triggerHaptic('medium');
    
    // Try native share first (works best on mobile)
    if (navigator.share) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `activity.${isVideo ? 'mp4' : 'png'}`, { type: blob.type });
        
        await navigator.share({
          title: 'My Fitness Activity',
          text: shareText,
          files: [file],
        });
        onClose();
        return;
      } catch (err) {
        console.log('Native share failed, trying deep link');
      }
    }
    
    // Try deep link to open the app
    const deepLink = app.share(fullShareText);
    if (deepLink) {
      // Create a hidden iframe to try deep link first
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Try deep link
      const start = Date.now();
      window.location.href = deepLink;
      
      // Fallback to web URL if app doesn't open
      setTimeout(() => {
        if (Date.now() - start < 2000) {
          // App didn't open, fallback to web
          const webFallbacks: Record<string, string> = {
            'WhatsApp': `https://wa.me/?text=${encodeURIComponent(fullShareText)}`,
            'X': `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            'Facebook': `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
            'Telegram': `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
            'LinkedIn': `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
          };
          
          if (webFallbacks[app.name]) {
            window.open(webFallbacks[app.name], '_blank', 'noopener,noreferrer');
          }
        }
        document.body.removeChild(iframe);
      }, 1500);
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
      await navigator.clipboard.writeText(fullShareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <>
      {/* Full Screen Glassmorphic Overlay */}
      <div className="fixed inset-0 z-50 animate-fade-in flex flex-col overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-black to-blue-900/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,80,200,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(60,120,220,0.3),transparent_50%)]" />
        
        {/* Floating orbs for liquid effect */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-40 right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-float-slower" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow" />
        
        {/* Glassmorphic content container */}
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-6 pb-4">
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/20 tap-bounce shadow-lg"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-white/90 text-lg font-semibold drop-shadow-lg">Share</h2>
            <button 
              onClick={onSaveWithTemplate}
              className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm tap-bounce shadow-lg"
            >
              <span className="text-black font-semibold text-sm">Done</span>
            </button>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 overflow-hidden">
            {/* Glassmorphic Preview Card */}
            <div 
              className="w-full max-w-[260px] aspect-[3/4] rounded-3xl overflow-hidden mb-6 backdrop-blur-sm"
              style={{ 
                boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(120,80,200,0.2)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              {isVideo ? (
                <video 
                  src={imageUrl} 
                  className="w-full h-full object-contain bg-black/50"
                  muted
                  playsInline
                  autoPlay
                  loop
                />
              ) : (
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-contain bg-black/50"
                />
              )}
            </div>
            
            {/* Share Title - Glassmorphic */}
            <div className="text-center mb-5">
              <h3 className="text-white font-semibold text-xl drop-shadow-lg">Share your activity</h3>
              <p className="text-white/60 text-sm mt-1">Choose where to share</p>
            </div>
            
            {/* Glassmorphic Social Apps Container */}
            <div 
              className="w-full rounded-3xl p-5 mb-5 backdrop-blur-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
            >
              {/* Scrollable Social Apps Row */}
              <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
                <div className="flex gap-5 pb-2 min-w-max">
                  {socialApps.map((app) => (
                    <button
                      key={app.name}
                      onClick={() => handleShare(app)}
                      className="flex flex-col items-center gap-2 tap-bounce flex-shrink-0"
                    >
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-lg"
                        style={{ 
                          backgroundColor: app.color,
                          boxShadow: `0 4px 20px ${app.color}40`
                        }}
                      >
                        {app.icon}
                      </div>
                      <span className="text-white/80 text-[11px] font-medium">{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Glassmorphic Action Buttons */}
            <div className="w-full flex gap-3">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl backdrop-blur-xl tap-bounce transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-white/80" />
                )}
                <span className="text-white/90 font-medium">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl backdrop-blur-xl tap-bounce transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                <Download className="w-5 h-5 text-white/80" />
                <span className="text-white/90 font-medium">Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShareSheet;
