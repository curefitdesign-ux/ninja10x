import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Lock, Users, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';

interface MakePublicSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onMakePublic: () => void;
  onKeepPrivate: () => void;
}

export default function MakePublicSheet({ 
  isOpen, 
  onClose, 
  onMakePublic,
  onKeepPrivate,
}: MakePublicSheetProps) {
  if (!isOpen) return null;

  const handleMakePublic = () => {
    triggerHaptic('success');
    onMakePublic();
  };

  const handleKeepPrivate = () => {
    triggerHaptic('light');
    onKeepPrivate();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50"
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              background: 'linear-gradient(180deg, rgba(45, 42, 50, 0.98) 0%, rgba(30, 28, 35, 0.98) 100%)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-6 pb-6">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-white text-xl font-semibold text-center mb-2">
                Share with the Community?
              </h2>

              {/* Description */}
              <p className="text-white/60 text-center text-sm mb-6 leading-relaxed">
                Make your activity public to receive reactions from others and see their workouts too!
              </p>

              {/* Benefits */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-white text-sm font-medium">Get reactions</span>
                    <p className="text-white/50 text-xs">Friends can cheer you on</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-white text-sm font-medium">See others' progress</span>
                    <p className="text-white/50 text-xs">Unlock the community feed</p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleMakePublic}
                  className="w-full py-4 rounded-2xl font-semibold text-white text-base active:scale-[0.98] transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Globe className="w-5 h-5" />
                    Make Public
                  </div>
                </button>

                <button
                  onClick={handleKeepPrivate}
                  className="w-full py-4 rounded-2xl font-medium text-white/60 text-base active:scale-[0.98] transition-transform bg-white/5"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    Keep Private
                  </div>
                </button>
              </div>

              <p className="text-white/40 text-xs text-center mt-4">
                You can change this later in activity settings
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
