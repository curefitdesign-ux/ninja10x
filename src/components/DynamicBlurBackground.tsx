interface DynamicBlurBackgroundProps {
  imageUrl: string;
  children: React.ReactNode;
}

export default function DynamicBlurBackground({ imageUrl, children }: DynamicBlurBackgroundProps) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#1a1a2e]" style={{ height: '100dvh' }}>
      {/* Children content - background is now applied directly to story card */}
      {children}
    </div>
  );
}
