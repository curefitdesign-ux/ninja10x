import { useRef, useEffect, useState } from 'react';

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
  itemHeight = 50,
  visibleItems = 5 
}: WheelPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const scrollY = useRef(0);
  const lastY = useRef(0);
  const velocity = useRef(0);
  const animationFrame = useRef<number>();

  const centerOffset = Math.floor(visibleItems / 2) * itemHeight;
  const containerHeight = visibleItems * itemHeight;

  const getSelectedIndex = () => {
    const index = items.indexOf(value);
    return index >= 0 ? index : 0;
  };

  useEffect(() => {
    const index = getSelectedIndex();
    scrollY.current = index * itemHeight;
    updateTransform();
  }, [value, items]);

  const updateTransform = () => {
    if (containerRef.current) {
      const children = containerRef.current.children;
      const selectedIndex = Math.round(scrollY.current / itemHeight);
      
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const isSelected = i === selectedIndex;
        
        // Selected item is big and white, others are smaller and dimmed
        if (isSelected) {
          child.style.opacity = '1';
          child.style.transform = 'scale(1.3)';
          child.style.color = 'white';
          child.style.fontWeight = '700';
        } else {
          const distance = Math.abs(i - selectedIndex);
          const opacity = Math.max(0.3, 1 - distance * 0.25);
          child.style.opacity = String(opacity);
          child.style.transform = 'scale(1)';
          child.style.color = 'rgba(255,255,255,0.5)';
          child.style.fontWeight = '500';
        }
      }
    }
  };

  const snapToItem = () => {
    let index = Math.round(scrollY.current / itemHeight);
    index = Math.max(0, Math.min(items.length - 1, index));
    scrollY.current = index * itemHeight;
    updateTransform();
    onChange(items[index]);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    lastY.current = e.touches[0].clientY;
    velocity.current = 0;
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = lastY.current - currentY;
    velocity.current = deltaY;
    lastY.current = currentY;
    
    scrollY.current = Math.max(
      0,
      Math.min((items.length - 1) * itemHeight, scrollY.current + deltaY)
    );
    
    updateTransform();
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Apply momentum
    const decelerate = () => {
      if (Math.abs(velocity.current) > 0.5) {
        scrollY.current = Math.max(
          0,
          Math.min((items.length - 1) * itemHeight, scrollY.current + velocity.current)
        );
        velocity.current *= 0.92;
        updateTransform();
        animationFrame.current = requestAnimationFrame(decelerate);
      } else {
        snapToItem();
      }
    };
    
    if (Math.abs(velocity.current) > 2) {
      animationFrame.current = requestAnimationFrame(decelerate);
    } else {
      snapToItem();
    }
  };

  const handleItemClick = (index: number) => {
    scrollY.current = index * itemHeight;
    updateTransform();
    onChange(items[index]);
  };

  return (
    <div 
      className="relative overflow-hidden select-none"
      style={{ height: containerHeight }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Selection indicator */}
      <div 
        className="absolute left-0 right-0 pointer-events-none border-y border-white/30 bg-white/5"
        style={{ 
          top: centerOffset,
          height: itemHeight,
        }}
      />
      
      {/* Removed gradient overlays */}
      
      {/* Items container */}
      <div
        ref={containerRef}
        className="absolute left-0 right-0 transition-transform"
        style={{
          transform: `translateY(${centerOffset - scrollY.current}px)`,
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-center text-white text-2xl font-semibold cursor-pointer transition-all duration-75"
            style={{ height: itemHeight }}
            onClick={() => handleItemClick(index)}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WheelPicker;
