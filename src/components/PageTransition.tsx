import { useEffect, useState, ReactNode, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [transitionStage, setTransitionStage] = useState<'idle' | 'enter'>('enter');
  const [showOverlay, setShowOverlay] = useState(false);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      // Initial mount animation
      isFirstMount.current = false;
      setTransitionStage('enter');
      setShowOverlay(true);
      
      const timer = setTimeout(() => {
        setTransitionStage('idle');
        setShowOverlay(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isFirstMount.current) {
      // Navigation occurred - trigger enter animation
      setTransitionStage('enter');
      setShowOverlay(true);
      
      const timer = setTimeout(() => {
        setTransitionStage('idle');
        setShowOverlay(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const getTransitionClass = () => {
    switch (transitionStage) {
      case 'enter':
        return 'animate-page-enter';
      default:
        return '';
    }
  };

  return (
    <>
      {/* Liquid glass blur overlay */}
      <div 
        className={`page-transition-overlay ${showOverlay ? 'active' : ''}`}
        style={{
          opacity: showOverlay ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
      />
      
      {/* Page content with transition */}
      <div 
        className={`page-transition-wrapper ${getTransitionClass()}`}
        style={{
          minHeight: '100vh',
        }}
      >
        {children}
      </div>
    </>
  );
};

export default PageTransition;
