import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Play, Loader2, CheckCircle, AlertCircle, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BrutalistCard } from '@/components/BrutalistCard';
import { generateRunwayVideo, pollTaskStatus } from '@/services/runway-service';

// Configuration data for 3 days
const DAYS_CONFIG = [
  { day: 1, activity: 'BOXING' },
  { day: 2, activity: 'SPRINTS' },
  { day: 3, activity: 'LIFTING' },
];

interface DayStatus {
  status: 'idle' | 'generating' | 'polling' | 'complete' | 'error';
  taskId?: string;
  videoUrl?: string;
  error?: string;
}

export default function BrutalistGenerator() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [dayStatuses, setDayStatuses] = useState<Record<number, DayStatus>>({
    1: { status: 'idle' },
    2: { status: 'idle' },
    3: { status: 'idle' },
  });
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const updateDayStatus = useCallback((day: number, update: Partial<DayStatus>) => {
    setDayStatuses(prev => ({
      ...prev,
      [day]: { ...prev[day], ...update },
    }));
  }, []);

  const generateForDay = useCallback(async (day: number, activity: string) => {
    if (!apiKey.trim()) {
      toast.error('Please enter your RunwayML API key');
      return;
    }

    updateDayStatus(day, { status: 'generating', error: undefined });

    try {
      // Step 1: Submit to RunwayML
      const taskId = await generateRunwayVideo(activity, apiKey);
      updateDayStatus(day, { status: 'polling', taskId });

      // Step 2: Poll for completion
      const videoUrl = await pollTaskStatus(taskId, apiKey, (status) => {
        console.log(`Day ${day} status: ${status}`);
      });

      updateDayStatus(day, { status: 'complete', videoUrl });
      toast.success(`Day ${day} video ready!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      updateDayStatus(day, { status: 'error', error: message });
      toast.error(`Day ${day}: ${message}`);
    }
  }, [apiKey, updateDayStatus]);

  const generateAll = useCallback(async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your RunwayML API key');
      return;
    }

    setIsGeneratingAll(true);

    // Generate all days in parallel
    await Promise.all(
      DAYS_CONFIG.map(({ day, activity }) => generateForDay(day, activity))
    );

    setIsGeneratingAll(false);
  }, [apiKey, generateForDay]);

  const allComplete = Object.values(dayStatuses).every(s => s.status === 'complete');
  const anyGenerating = Object.values(dayStatuses).some(s => 
    s.status === 'generating' || s.status === 'polling'
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Noise overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-50 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-2">
            BRUTALIST
          </h1>
          <p className="text-xl text-yellow-400 font-mono tracking-widest">
            FITNESS VIDEO GENERATOR
          </p>
        </motion.div>

        {/* API Key Input */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-xl mx-auto mb-12"
        >
          <label className="block text-sm font-mono text-neutral-400 mb-2">
            RUNWAY API KEY
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="rl_xxxxxxxxxxxx"
                className="pl-11 bg-neutral-900 border-neutral-700 text-white font-mono"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowApiKey(!showApiKey)}
              className="border-neutral-700 text-neutral-400 hover:text-white"
            >
              {showApiKey ? 'HIDE' : 'SHOW'}
            </Button>
          </div>
        </motion.div>

        {/* Days Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {DAYS_CONFIG.map(({ day, activity }, index) => {
            const status = dayStatuses[day];
            
            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="relative"
              >
                {status.videoUrl ? (
                  <BrutalistCard
                    videoUrl={status.videoUrl}
                    dayNumber={day}
                    activityName={activity}
                  />
                ) : (
                  <div className="aspect-[9/16] bg-neutral-900 border-2 border-neutral-800 rounded-lg flex flex-col items-center justify-center p-6">
                    {/* Day indicator */}
                    <div className="absolute top-4 left-4 font-mono text-sm text-neutral-500">
                      DAY {day}
                    </div>

                    {/* Status indicator */}
                    <AnimatePresence mode="wait">
                      {status.status === 'idle' && (
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center"
                        >
                          <Video className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                          <h3 className="text-2xl font-black text-yellow-400 mb-2">
                            {activity}
                          </h3>
                          <p className="text-sm text-neutral-500 font-mono">
                            Ready to generate
                          </p>
                        </motion.div>
                      )}

                      {(status.status === 'generating' || status.status === 'polling') && (
                        <motion.div
                          key="generating"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center"
                        >
                          <Loader2 className="w-12 h-12 text-yellow-400 mx-auto mb-4 animate-spin" />
                          <h3 className="text-xl font-bold text-white mb-2">
                            {status.status === 'generating' ? 'SUBMITTING...' : 'RENDERING...'}
                          </h3>
                          <p className="text-sm text-neutral-400 font-mono">
                            {activity}
                          </p>
                        </motion.div>
                      )}

                      {status.status === 'complete' && (
                        <motion.div
                          key="complete"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center"
                        >
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-white mb-2">
                            COMPLETE
                          </h3>
                        </motion.div>
                      )}

                      {status.status === 'error' && (
                        <motion.div
                          key="error"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center"
                        >
                          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-red-400 mb-2">
                            ERROR
                          </h3>
                          <p className="text-xs text-neutral-500 font-mono max-w-[200px]">
                            {status.error}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Individual generate button */}
                    {status.status === 'idle' || status.status === 'error' ? (
                      <Button
                        onClick={() => generateForDay(day, activity)}
                        disabled={!apiKey.trim() || anyGenerating}
                        className="mt-6 bg-yellow-400 text-black hover:bg-yellow-300 font-bold"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        GENERATE
                      </Button>
                    ) : null}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Generate All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Button
            onClick={generateAll}
            disabled={!apiKey.trim() || isGeneratingAll || anyGenerating || allComplete}
            size="lg"
            className="bg-yellow-400 text-black hover:bg-yellow-300 font-black text-xl px-12 py-6 h-auto"
          >
            {isGeneratingAll || anyGenerating ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                GENERATING...
              </>
            ) : allComplete ? (
              <>
                <CheckCircle className="w-6 h-6 mr-3" />
                ALL COMPLETE
              </>
            ) : (
              <>
                <Play className="w-6 h-6 mr-3" />
                GENERATE ALL
              </>
            )}
          </Button>

          <p className="mt-4 text-sm text-neutral-500 font-mono">
            Each video takes ~60-90 seconds to render
          </p>
        </motion.div>
      </div>
    </div>
  );
}
