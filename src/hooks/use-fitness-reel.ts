import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useFitnessReel = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<GenerationStep>('narration');
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

  // Prevent duplicate polling loops
  const pollingTasksRef = useRef<Set<string>>(new Set());

  // Persist reel history
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reelHistory));
  }, [reelHistory]);

  const getNextStyle = useCallback(() => {
    const usedStyles = reelHistory.map((r) => r.style);
    const availableStyles = REEL_STYLES.filter((s) => !usedStyles.includes(s.id));
    if (availableStyles.length > 0) {
      return availableStyles[Math.floor(Math.random() * availableStyles.length)];
    }
    return REEL_STYLES[Math.floor(Math.random() * REEL_STYLES.length)];
  }, [reelHistory]);

  const fetchTaskStatus = useCallback(async (taskId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-fitness-reel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'status', taskId }),
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Session expired. Please sign in again.');
      }
      const txt = await res.text().catch(() => '');
      throw new Error(txt || 'Failed to fetch render status');
    }

    return res.json() as Promise<{ success: boolean; status: string; videoUrl: string | null }>;
  }, []);

  const startPollingIfNeeded = useCallback((reelId: string, taskId: string) => {
    if (!taskId) return;
    if (pollingTasksRef.current.has(taskId)) return;
    pollingTasksRef.current.add(taskId);

    (async () => {
      try {
        // ~2.5 min max (30 * 5s)
        for (let attempt = 0; attempt < 30; attempt++) {
          await sleep(5000);
          const status = await fetchTaskStatus(taskId);

          if (status?.videoUrl) {
            setReelHistory((prev) =>
              prev.map((r) => (r.id === reelId ? { ...r, videoUrl: status.videoUrl, message: 'Ready' } : r))
            );
            return;
          }

          if (['FAILED', 'CANCELED'].includes((status?.status || '').toUpperCase())) {
            setReelHistory((prev) =>
              prev.map((r) => (r.id === reelId ? { ...r, message: 'Video failed to render' } : r))
            );
            return;
          }
        }

        // Timed out
        setReelHistory((prev) =>
          prev.map((r) => (r.id === reelId ? { ...r, message: 'Still rendering… open again soon' } : r))
        );
      } catch (e) {
        console.error('Polling error:', e);
      }
    })();
  }, [fetchTaskStatus]);

  // Resume polling after refresh if we have pending tasks
  useEffect(() => {
    for (const r of reelHistory) {
      if (r.videoTaskId && !r.videoUrl) startPollingIfNeeded(r.id, r.videoTaskId);
    }
  }, [reelHistory, startPollingIfNeeded]);

  const generateReel = useCallback(async (photos: PhotoData[]) => {
    if (photos.length < 3) {
      toast.error('Need at least 3 photos to generate a reel');
      return null;
    }

    // Get authenticated session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error('Please sign in to generate reels');
      return null;
    }

    const style = getNextStyle();
    setIsGenerating(true);
    setError(null);
    setCurrentStep('narration');

    try {
      setCurrentStep('narration');
      await sleep(500);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-fitness-reel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ photos, stylePrompt: style.prompt, styleId: style.id, action: 'create' }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) throw new Error('Session expired. Please sign in again.');
        if (response.status === 429) throw new Error('Rate limit exceeded. Please try again later.');
        if (response.status === 402) throw new Error('Please add credits to continue using AI features.');
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate reel');
      }

      setCurrentStep('voiceover');
      await sleep(1200);
      setCurrentStep('video');

      const result = await response.json();
      const reelId = `reel-${Date.now()}`;
      const newReel: ReelResult = {
        ...result,
        id: reelId,
        style: style.id,
        createdAt: Date.now(),
        message: result?.videoUrl ? 'Ready' : 'Video rendering…',
      };

      setReelHistory((prev) => [newReel, ...prev]);
      setCurrentReelIndex(0);

      // Start background polling
      if (newReel.videoTaskId && !newReel.videoUrl) {
        startPollingIfNeeded(reelId, newReel.videoTaskId);
      }

      setCurrentStep('complete');
      await sleep(300);

      toast.success(`${style.name} reel ${newReel.videoUrl ? 'ready' : 'rendering'}!`);
      return newReel;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate reel';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [getNextStyle, startPollingIfNeeded]);

  return {
    generateReel,
    isGenerating,
    currentStep,
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
