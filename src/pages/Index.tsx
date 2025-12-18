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
        
        {/* Header Badge */}
        <header className="flex justify-center py-4">
          <div className="px-4 py-2 rounded-full border border-foreground/30 bg-background/30 backdrop-blur-sm">
            <span className="text-sm font-semibold text-foreground tracking-wider">CULT NINJA</span>
          </div>
        </header>
        
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
