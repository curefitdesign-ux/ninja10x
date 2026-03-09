import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface MorphData {
  rect: DOMRect;
  imageUrl: string;
  isVideo?: boolean;
  targetRoute: string;
  targetState?: any;
}

interface MorphTransitionContextType {
  morphData: MorphData | null;
  triggerMorph: (el: HTMLElement, imageUrl: string, targetRoute: string, targetState?: any, isVideo?: boolean) => void;
  clearMorph: () => void;
  isMorphing: boolean;
}

const MorphTransitionContext = createContext<MorphTransitionContextType>({
  morphData: null,
  triggerMorph: () => {},
  clearMorph: () => {},
  isMorphing: false,
});

export const useMorphTransition = () => useContext(MorphTransitionContext);

export const MorphTransitionProvider = ({ children }: { children: React.ReactNode }) => {
  const [morphData, setMorphData] = useState<MorphData | null>(null);
  const [isMorphing, setIsMorphing] = useState(false);
  const navigateRef = useRef<ReturnType<typeof useNavigate> | null>(null);

  const triggerMorph = useCallback((el: HTMLElement, imageUrl: string, targetRoute: string, targetState?: any, isVideo?: boolean) => {
    const rect = el.getBoundingClientRect();
    setMorphData({ rect, imageUrl, isVideo, targetRoute, targetState });
    setIsMorphing(true);
  }, []);

  const clearMorph = useCallback(() => {
    setMorphData(null);
    setIsMorphing(false);
  }, []);

  return (
    <MorphTransitionContext.Provider value={{ morphData, triggerMorph, clearMorph, isMorphing }}>
      {children}
    </MorphTransitionContext.Provider>
  );
};
