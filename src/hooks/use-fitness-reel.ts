import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { GenerationStep } from '@/components/ReelGenerationOverlay';

interface PhotoData {
  id: string;
  imageUrl: string;
  activity: string;
  duration?: string;
  pr?: string;
  uploadDate: string;
  dayNumber: number;
}

export interface ReelResult {
  id: string;
  success: boolean;
  narration: string;
  audioBase64?: string;
  audioSize?: number;
  videoTaskId?: string;
  videoUrl?: string;
  message: string;
  style: string;
  createdAt: number;
}

const REEL_STYLES = [
  { id: 'brutalist', name: 'Brutalist', prompt: 'brutalist graphic design, high contrast black and white with bright yellow flashes, heavy film grain, noise textures, split-screen collage, glitch transitions' },
  { id: 'neon', name: 'Neon Nights', prompt: 'cyberpunk neon aesthetic, vibrant pink and cyan colors, lens flares, chromatic aberration, dark urban backdrop, glowing edges' },
  { id: 'vintage', name: 'Vintage Film', prompt: 'vintage 8mm film look, warm sepia tones, light leaks, scratches and dust particles, vignette, nostalgic documentary style' },
  { id: 'minimal', name: 'Clean Minimal', prompt: 'clean minimalist aesthetic, lots of white space, subtle shadows, elegant typography overlay, soft neutral colors' },
  { id: 'grunge', name: 'Street Grunge', prompt: 'raw street photography style, desaturated colors, harsh shadows, urban decay textures, spray paint elements, rebellious energy' },
];

const STORAGE_KEY = 'cn_reels_history';

export const useFitnessReel = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<GenerationStep>('narration');
  const [reelHistory, setReelHistory] = useState<ReelResult[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Persist reel history
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reelHistory));
  }, [reelHistory]);

  const getNextStyle = useCallback(() => {
    const usedStyles = reelHistory.map(r => r.style);
    const availableStyles = REEL_STYLES.filter(s => !usedStyles.includes(s.id));
    if (availableStyles.length > 0) {
      return availableStyles[Math.floor(Math.random() * availableStyles.length)];
    }
    return REEL_STYLES[Math.floor(Math.random() * REEL_STYLES.length)];
  }, [reelHistory]);

  const generateReel = useCallback(async (photos: PhotoData[]) => {
    if (photos.length < 3) {
      toast.error('Need at least 3 photos to generate a reel');
      return null;
    }

    const style = getNextStyle();
    setIsGenerating(true);
    setError(null);
    setCurrentStep('narration');

    try {
      setCurrentStep('narration');
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-fitness-reel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ photos, stylePrompt: style.prompt, styleId: style.id }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) throw new Error('Rate limit exceeded. Please try again later.');
        if (response.status === 402) throw new Error('Please add credits to continue using AI features.');
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate reel');
      }

      setCurrentStep('voiceover');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep('video');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = await response.json();
      const newReel: ReelResult = {
        ...result,
        id: `reel-${Date.now()}`,
        style: style.id,
        createdAt: Date.now(),
      };
      
      setReelHistory(prev => [newReel, ...prev]);
      setCurrentReelIndex(0);
      setCurrentStep('complete');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`${style.name} reel ready! 🎬`);
      return newReel;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate reel';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [getNextStyle]);

  return {
    generateReel,
    isGenerating,
    currentStep,
    reelHistory,
    currentReel: reelHistory[currentReelIndex] || null,
    currentReelIndex,
    setCurrentReelIndex,
    error,
    clearHistory: () => { setReelHistory([]); localStorage.removeItem(STORAGE_KEY); },
  };
};
