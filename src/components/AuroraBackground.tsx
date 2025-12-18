import backgroundImage from '@/assets/background.png';

const AuroraBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Background Image */}
      <img 
        src={backgroundImage} 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
};

export default AuroraBackground;
