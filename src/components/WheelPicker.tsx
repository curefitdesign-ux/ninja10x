import { useRef, useEffect, useState, useCallback } from 'react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';

interface WheelPickerProps {
  items: (string | number)[];
  value: string | number;
  onChange: (value: string | number) => void;
  itemHeight?: number;
  visibleItems?: number;
}

const WheelPicker = ({ 
  items, 
  value, 
  onChange, 
  itemHeight = 56, // Increased from 50
  visibleItems = 5 
}: WheelPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSelectedRef = useRef<number>(-1);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const centerOffset = Math.floor(visibleItems / 2) * itemHeight;
  const containerHeight = visibleItems * itemHeight;

  const getSelectedIndex = useCallback(() => {
    const index = items.indexOf(value);
    return index >= 0 ? index : 0;
  }, [items, value]);

  // Scroll to value when it changes externally
  useEffect(() => {
    if (!scrollRef.current || isScrollingRef.current) return;
    const index = getSelectedIndex();
    scrollRef.current.scrollTop = index * itemHeight;
  }, [value, items, itemHeight, getSelectedIndex]);

  // Handle scroll with snapping and haptic
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    isScrollingRef.current = true;
    
    const scrollTop = scrollRef.current.scrollTop;
    const selectedIndex = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, selectedIndex));
    
    // Trigger haptic when selection changes
    if (clampedIndex !== lastSelectedRef.current) {
      lastSelectedRef.current = clampedIndex;
      triggerHaptic('light');
    }
    
    // Snap after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return;
      
      const finalIndex = Math.round(scrollRef.current.scrollTop / itemHeight);
      const clampedFinal = Math.max(0, Math.min(items.length - 1, finalIndex));
      
      // Smooth snap to nearest item
      scrollRef.current.scrollTo({
        top: clampedFinal * itemHeight,
        behavior: 'smooth'
      });
      
      // Update value after snap
      setTimeout(() => {
        isScrollingRef.current = false;
        onChange(items[clampedFinal]);
      }, 100);
    }, 80);
  }, [items, itemHeight, onChange]);

  // Handle direct item click
  const handleItemClick = (index: number) => {
    if (!scrollRef.current) return;
    triggerHaptic('medium');
    
    scrollRef.current.scrollTo({
      top: index * itemHeight,
      behavior: 'smooth'
    });
    
    setTimeout(() => {
      onChange(items[index]);
    }, 150);
  };

  // Calculate item styles based on distance from center
  const getItemStyle = (index: number) => {
    if (!scrollRef.current) {
      const selectedIdx = getSelectedIndex();
      const isSelected = index === selectedIdx;
      return {
        opacity: isSelected ? 1 : 0.5,
        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
        fontWeight: isSelected ? 700 : 500,
        color: isSelected ? 'white' : 'rgba(255,255,255,0.6)',
      };
    }
    
    const scrollTop = scrollRef.current.scrollTop;
    const selectedIndex = Math.round(scrollTop / itemHeight);
    const distance = Math.abs(index - selectedIndex);
    const isSelected = distance === 0;
    
    // More visible non-selected items
    const opacity = isSelected ? 1 : Math.max(0.45, 0.9 - distance * 0.15);
    const scale = isSelected ? 1.15 : Math.max(0.9, 1 - distance * 0.03);
    
    return {
      opacity,
      transform: `scale(${scale})`,
      fontWeight: isSelected ? 700 : 500,
      color: isSelected ? 'white' : 'rgba(255,255,255,0.6)',
    };
  };

  const [, forceUpdate] = useState(0);
  
  // Force re-render on scroll for visual updates
  const handleScrollWithUpdate = useCallback(() => {
    handleScroll();
    forceUpdate(n => n + 1);
  }, [handleScroll]);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden select-none"
      style={{ height: containerHeight }}
    >
      {/* iOS-style selection indicator - frosted glass rounded rect */}
      <div 
        className="absolute left-2 right-2 pointer-events-none rounded-xl"
        style={{ 
          top: centerOffset,
          height: itemHeight,
          background: 'rgba(120, 120, 128, 0.24)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      />
      
      {/* Subtle gradient overlays for depth - matching iOS picker */}
      <div 
        className="absolute inset-x-0 top-0 h-20 pointer-events-none z-10"
        style={{ 
          background: 'linear-gradient(to bottom, rgba(45,45,48,0.95) 0%, rgba(45,45,48,0.5) 40%, transparent 100%)',
        }}
      />
      <div 
        className="absolute inset-x-0 bottom-0 h-20 pointer-events-none z-10"
        style={{ 
          background: 'linear-gradient(to top, rgba(45,45,48,0.95) 0%, rgba(45,45,48,0.5) 40%, transparent 100%)',
        }}
      />
      
      {/* Scrollable items container with native scroll snap */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto scrollbar-hide"
        onScroll={handleScrollWithUpdate}
        style={{
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          paddingTop: centerOffset,
          paddingBottom: centerOffset,
        }}
      >
        {items.map((item, index) => {
          const style = getItemStyle(index);
          return (
            <div
              key={index}
              className="flex items-center justify-center cursor-pointer transition-all duration-100 ease-out"
              style={{ 
                height: itemHeight,
                scrollSnapAlign: 'center',
                ...style,
              }}
              onClick={() => handleItemClick(index)}
            >
              <span className="text-2xl font-medium tabular-nums">
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WheelPicker;
