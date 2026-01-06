import { useState } from 'react';
import { toast } from 'sonner';

interface PhotoData {
  id: string;
  imageUrl: string;
  activity: string;
  duration?: string;
  pr?: string;
  uploadDate: string;
  dayNumber: number;
}

interface ReelResult {
  success: boolean;
  narration: string;
  audioBase64?: string;
  audioSize?: number;
  videoTaskId?: string;
  videoUrl?: string;
  message: string;
}

export const useFitnessReel = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reelResult, setReelResult] = useState<ReelResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateReel = async (photos: PhotoData[]) => {
    if (photos.length < 3) {
      toast.error('Need at least 3 photos to generate a reel');
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setReelResult(null);

    try {
      toast.loading('Creating your AI fitness reel...', { id: 'reel-generation' });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-fitness-reel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ photos }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (response.status === 402) {
          throw new Error('Please add credits to continue using AI features.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate reel');
      }

      const result: ReelResult = await response.json();
      setReelResult(result);
      
      toast.success('Your fitness reel is ready! 🎬', { id: 'reel-generation' });
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate reel';
      setError(message);
      toast.error(message, { id: 'reel-generation' });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateVoiceover = async (text: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate voiceover');
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (err) {
      console.error('Voiceover error:', err);
      return null;
    }
  };

  return {
    generateReel,
    generateVoiceover,
    isGenerating,
    reelResult,
    error,
    clearResult: () => setReelResult(null),
  };
};
