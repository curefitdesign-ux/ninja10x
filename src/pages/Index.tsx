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
        
        {/* Header */}
        <header className="px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground">Photo Challenge</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload your daily photos</p>
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
