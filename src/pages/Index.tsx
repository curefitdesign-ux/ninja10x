import AuroraBackground from '@/components/AuroraBackground';
import PhotoUploadCard from '@/components/PhotoUploadCard';

const Index = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Aurora Background */}
      <AuroraBackground />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Status Bar Space */}
        <div className="h-12" />
        
        {/* Spacer */}
        <div className="py-2" />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center py-6">
          <PhotoUploadCard />
        </main>
        
        {/* Bottom Safe Area */}
        <div className="h-8" />
      </div>
    </div>
  );
};

export default Index;
