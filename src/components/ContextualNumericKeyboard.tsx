import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Check } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';

interface ContextualNumericKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  label: string;
  unit: string;
  presets?: number[];
  allowDecimal?: boolean;
  maxLength?: number;
}

const ContextualNumericKeyboard = ({
  value,
  onChange,
  onConfirm,
  onClose,
  label,
  unit,
  presets = [],
  allowDecimal = false,
  maxLength = 5,
}: ContextualNumericKeyboardProps) => {
  const handleKeyPress = (key: string) => {
    triggerHaptic('light');
    
    if (key === 'delete') {
      onChange(value.slice(0, -1));
      return;
    }
    
    if (key === '.' && allowDecimal) {
      if (!value.includes('.') && value.length < maxLength) {
        onChange(value + '.');
      }
      return;
    }
    
    if (value.length < maxLength) {
      // Prevent leading zeros except for decimal
      if (value === '0' && key !== '.') {
        onChange(key);
      } else {
        onChange(value + key);
      }
    }
  };
  
  const handlePreset = (preset: number) => {
    triggerHaptic('medium');
    onChange(String(preset));
  };
  
  const handleConfirm = () => {
    triggerHaptic('success');
    onConfirm();
  };
  
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', allowDecimal ? '.' : '', '0', 'delete'];
  
  return (
    <>
      {/* Backdrop */}
      <motion.div 
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        onClick={onClose}
      />
      
      {/* Keyboard Sheet */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 z-50"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      >
        <div 
          className="rounded-t-[28px] overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(60, 60, 67, 0.85) 0%, rgba(45, 45, 48, 0.92) 100%)',
            backdropFilter: 'blur(60px) saturate(200%)',
            WebkitBackdropFilter: 'blur(60px) saturate(200%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 -10px 40px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div 
              className="w-9 h-1 rounded-full"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
            />
          </div>
          
          {/* Display area */}
          <div className="px-6 pb-4">
            <p className="text-white/60 text-sm text-center mb-2">{label}</p>
            <div 
              className="flex items-center justify-center gap-2 py-3 rounded-2xl"
              style={{
                background: 'rgba(120, 120, 128, 0.24)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span className="text-white text-4xl font-bold tracking-tight">
                {value || '0'}
              </span>
              {unit && (
                <span className="text-white/50 text-xl font-medium">{unit}</span>
              )}
            </div>
          </div>
          
          {/* Quick presets - horizontal scroll */}
          {presets.length > 0 && (
            <div className="pb-3">
              <div 
                className="flex gap-2 overflow-x-auto scrollbar-hide px-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {presets.map((preset) => (
                  <motion.button
                    key={preset}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePreset(preset)}
                    className="flex-shrink-0 px-4 py-2 rounded-full"
                    style={{
                      background: value === String(preset) 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'rgba(255, 255, 255, 0.08)',
                      border: value === String(preset) 
                        ? '1px solid rgba(255, 255, 255, 0.3)' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                    }}
                  >
                    <span 
                      className="text-sm font-semibold whitespace-nowrap"
                      style={{ 
                        color: value === String(preset) ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)' 
                      }}
                    >
                      {preset} {unit}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          
          {/* Numeric keypad - translucent liquid glass */}
          <div className="px-3 pb-2">
            <div className="grid grid-cols-3 gap-1.5">
              {keys.map((key, index) => (
                <motion.button
                  key={index}
                  whileTap={{ scale: 0.95, backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                  onClick={() => key && handleKeyPress(key)}
                  disabled={!key}
                  className="h-14 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    background: key 
                      ? 'rgba(255, 255, 255, 0.06)' 
                      : 'transparent',
                    border: key ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                    backdropFilter: key ? 'blur(12px)' : 'none',
                    WebkitBackdropFilter: key ? 'blur(12px)' : 'none',
                  }}
                >
                  {key === 'delete' ? (
                    <Delete className="w-6 h-6 text-white/60" />
                  ) : (
                    <span className="text-white text-2xl font-semibold">{key}</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* Confirm button - white CTA */}
          <div 
            className="px-4 pt-2"
            style={{ 
              paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' 
            }}
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Check className="w-5 h-5 text-black" />
              <span className="text-black font-bold text-base">Confirm</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ContextualNumericKeyboard;
