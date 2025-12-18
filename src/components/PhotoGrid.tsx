import { useState, useRef } from 'react';
import { Plus, Image as ImageIcon } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
}

interface PhotoGridProps {
  photos: Photo[];
  onAddPhoto: (file: File) => void;
}

const PhotoGrid = ({ photos, onAddPhoto }: PhotoGridProps) => {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  // 10 columns x 10 rows grid
  const totalCells = 100;
  const columns = 10;
  const rows = 10;

  const handleCellClick = (index: number) => {
    if (!photos[index]) {
      setSelectedCell(index);
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddPhoto(file);
    }
    e.target.value = '';
  };

  return (
    <div className="w-full aspect-square">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div 
        className="grid gap-0 w-full h-full"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {Array.from({ length: totalCells }).map((_, index) => {
          const photo = photos[index];
          const isHovered = hoveredCell === index;
          
          return (
            <div
              key={index}
              className={`
                grid-cell relative cursor-pointer overflow-hidden
                transition-all duration-200
                ${photo ? 'filled' : ''}
                ${isHovered && !photo ? 'bg-foreground/10' : ''}
              `}
              onClick={() => handleCellClick(index)}
              onMouseEnter={() => setHoveredCell(index)}
              onMouseLeave={() => setHoveredCell(null)}
              style={{
                animationDelay: `${index * 10}ms`,
              }}
            >
              {photo ? (
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover animate-grid-appear"
                />
              ) : isHovered ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus className="w-3 h-3 text-foreground/50" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhotoGrid;
