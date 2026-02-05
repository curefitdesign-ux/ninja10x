import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { generateLocalRecap, type RecapPhoto } from '@/lib/local-recap-generator';
import type { GenerationStep } from '@/components/ReelGenerationOverlay';

interface PhotoData {
  id: string;
  imageUrl: string;
  activity: string;
  duration?: string;
  distance?: string;
  pr?: string;
  uploadDate: string;
  dayNumber: number;
  isVideo?: boolean;
}

export interface ReelResult {
  id: string;
  success: boolean;
  narration: string;
  videoUrl?: string;
  message: string;
  style: string;
  createdAt: number;
}

const STORAGE_KEY = 'cn_reels_history';

export const useFitnessReel = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<GenerationStep>('narration');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [reelHistory, setReelHistory] = useState<ReelResult[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Persist reel history
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reelHistory));
  }, [reelHistory]);

  const generateReel = useCallback(async (photos: PhotoData[]) => {
    console.log('[useFitnessReel] generateReel called with', photos.length, 'photos');
    
    if (photos.length < 3) {
      toast.error('Need at least 3 photos to generate a reel');
      return null;
    }

     // CRITICAL: Set all state synchronously before any async work
     console.log('[useFitnessReel] Setting isGenerating=true IMMEDIATELY');
    // Set generating state FIRST before any async work
    setIsGenerating(true);
    setError(null);
    setCurrentStep('narration');
    setGenerationProgress(5);
    
     // Force a re-render by using a microtask
     await Promise.resolve();
     console.log('[useFitnessReel] State should now be: isGenerating=true');

    try {
      // Convert PhotoData to RecapPhoto format
      const recapPhotos: RecapPhoto[] = photos.map(p => ({
        imageUrl: p.imageUrl,
        activity: p.activity || 'Workout',
        duration: p.duration,
        distance: p.distance,
        pr: p.pr,
        dayNumber: p.dayNumber,
        isVideo: p.isVideo,
      }));

       // Small delay to ensure React has rendered the overlay
       await new Promise(resolve => setTimeout(resolve, 200));
      
      // Step 2: Generate video locally
      setCurrentStep('video');
      setGenerationProgress(10);
      console.log('[useFitnessReel] Starting local video generation');
      
      const videoUrl = await generateLocalRecap({
        photos: recapPhotos,
        onProgress: (percent, phase) => {
          setGenerationProgress(percent);
          console.log(`[LocalRecap] ${phase}: ${percent}%`);
        },
      });

      console.log('[useFitnessReel] Video generated:', videoUrl?.slice(0, 50) + '...');

      // Step 3: Complete
      setCurrentStep('complete');
      setGenerationProgress(100);

      const reelId = `reel-${Date.now()}`;
      const newReel: ReelResult = {
        id: reelId,
        success: true,
        narration: `Week ${Math.ceil(photos[0].dayNumber / 3)} fitness journey`,
        videoUrl,
        message: 'Ready to play!',
        style: 'minimal',
        createdAt: Date.now(),
      };

      setReelHistory((prev) => [newReel, ...prev]);
      setCurrentReelIndex(0);

      toast.success('Your recap video is ready!');
      return newReel;
    } catch (err) {
      console.error('[useFitnessReel] Generation failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate reel';
      setError(message);
      toast.error(message);
       setIsGenerating(false);
      return null;
    } finally {
      // Don't reset progress immediately - let complete state show
      setTimeout(() => {
         console.log('[useFitnessReel] Resetting isGenerating to false');
        setIsGenerating(false);
       }, 2000);
    }
  }, []);

  return {
    generateReel,
    isGenerating,
    currentStep,
    generationProgress,
    reelHistory,
    currentReel: reelHistory[currentReelIndex] || null,
    currentReelIndex,
    setCurrentReelIndex,
    error,
    clearHistory: () => {
      setReelHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    },
  };
};
