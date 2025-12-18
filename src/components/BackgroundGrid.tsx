const BackgroundGrid = () => {
  const columns = 6;
  const rows = 8;
  const totalCells = columns * rows;

  return (
    <div 
      className="absolute inset-0 grid opacity-30 pointer-events-none"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {Array.from({ length: totalCells }).map((_, index) => (
        <div
          key={index}
          className="border border-foreground/20"
        />
      ))}
    </div>
  );
};

export default BackgroundGrid;
