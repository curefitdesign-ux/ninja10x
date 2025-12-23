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
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const itemCenter = i * itemHeight + itemHeight / 2;
        const viewCenter = scrollY.current + containerHeight / 2;
        const distance = Math.abs(itemCenter - viewCenter);
        const maxDistance = containerHeight / 2;
        
        // Calculate opacity and scale based on distance from center
        const normalizedDistance = Math.min(distance / maxDistance, 1);
        const opacity = 1 - normalizedDistance * 0.7;
        const scale = 1 - normalizedDistance * 0.15;
        
        child.style.opacity = String(opacity);
        child.style.transform = `scale(${scale})`;
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
      
      {/* Gradient overlays for fade effect */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
      
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
