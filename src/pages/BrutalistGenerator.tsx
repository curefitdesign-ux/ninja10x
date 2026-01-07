import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Play, Loader2, CheckCircle, AlertCircle, Image, X, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BrutalistCard } from '@/components/BrutalistCard';
import { 
  generateVideosForAllDays, 
  type DayData,
  type GenerationResult 
} from '@/services/runway-service';

// Configuration data for 3 days
const DAYS_CONFIG = [
  { day: 1, activity: 'BOXING', defaultDistance: 0, defaultDuration: 45, defaultCalories: 400 },
  { day: 2, activity: 'SPRINTS', defaultDistance: 2, defaultDuration: 30, defaultCalories: 350 },
  { day: 3, activity: 'LIFTING', defaultDistance: 0, defaultDuration: 60, defaultCalories: 300 },
];

interface DayStatus {
  status: 'idle' | 'generating' | 'complete' | 'error';
  image: { url: string; name: string; file?: File } | null;
  distanceKm: number;
  durationMinutes: number;
  calories: number;
  videoResult: GenerationResult | null;
  error?: string;
}

const createInitialDayStatus = (config: typeof DAYS_CONFIG[0]): DayStatus => ({
  status: 'idle',
  image: null,
  distanceKm: config.defaultDistance,
  durationMinutes: config.defaultDuration,
  calories: config.defaultCalories,
  videoResult: null,
});

export default function BrutalistGenerator() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [dayStatuses, setDayStatuses] = useState<Record<number, DayStatus>>(() => {
    const initial: Record<number, DayStatus> = {};
    DAYS_CONFIG.forEach(config => {
      initial[config.day] = createInitialDayStatus(config);
    });
    return initial;
  });
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ completed: number; total: number } | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const updateDayStatus = useCallback((day: number, update: Partial<DayStatus>) => {
    setDayStatuses(prev => ({
      ...prev,
      [day]: { ...prev[day], ...update },
    }));
  }, []);

  const handleImageUpload = useCallback((day: number, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Revoke previous URL if exists
    const prev = dayStatuses[day].image;
    if (prev?.url) {
      URL.revokeObjectURL(prev.url);
    }

    const url = URL.createObjectURL(file);
    updateDayStatus(day, { 
      image: { url, name: file.name, file },
      status: 'idle',
      videoResult: null,
    });
    toast.success(`Day ${day} image set`);
  }, [dayStatuses, updateDayStatus]);

  const removeImage = useCallback((day: number) => {
    const image = dayStatuses[day].image;
    if (image?.url) {
      URL.revokeObjectURL(image.url);
    }
    updateDayStatus(day, { 
      image: null, 
      status: 'idle', 
      videoResult: null 
    });
  }, [dayStatuses, updateDayStatus]);

  const updateMetadata = useCallback((day: number, field: 'distanceKm' | 'durationMinutes' | 'calories', value: number) => {
    updateDayStatus(day, { [field]: value });
  }, [updateDayStatus]);

  const generateAll = useCallback(async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your RunwayML API key');
      return;
    }

    // Collect days with images
    const daysWithImages: DayData[] = [];
    DAYS_CONFIG.forEach(({ day, activity }) => {
      const status = dayStatuses[day];
      if (status.image) {
        daysWithImages.push({
          dayNumber: day,
          activity,
          imageUrl: status.image.url,
          distanceKm: status.distanceKm,
          durationMinutes: status.durationMinutes,
          calories: status.calories,
        });
      }
    });

    if (daysWithImages.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setIsGeneratingAll(true);
    setGenerationProgress({ completed: 0, total: daysWithImages.length });

    // Mark all days with images as generating
    daysWithImages.forEach(d => {
      updateDayStatus(d.dayNumber, { status: 'generating', error: undefined });
    });

    try {
      const results = await generateVideosForAllDays(
        daysWithImages,
        apiKey,
        (completed, total, result) => {
          setGenerationProgress({ completed, total });
          if (result) {
            updateDayStatus(result.dayNumber, { 
              status: 'complete',
              videoResult: result,
            });
          }
        }
      );

      toast.success(`Generated ${results.length} video(s)!`);
      
      // Log all results with metadata for debugging
      console.log('All generation results with metadata:', results);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      toast.error(message);
      
      // Mark remaining generating days as error
      DAYS_CONFIG.forEach(({ day }) => {
        if (dayStatuses[day].status === 'generating') {
          updateDayStatus(day, { status: 'error', error: message });
        }
      });
    } finally {
      setIsGeneratingAll(false);
      setGenerationProgress(null);
    }
  }, [apiKey, updateDayStatus, dayStatuses]);

  const hasAnyImages = Object.values(dayStatuses).some(s => s.image !== null);
  const allComplete = Object.values(dayStatuses).every(s => 
    s.image === null || s.status === 'complete'
  );
  const hasAnyComplete = Object.values(dayStatuses).some(s => s.status === 'complete');

  // Collect all completed days for the final reel
  const allCompletedDays = DAYS_CONFIG
    .filter(({ day }) => dayStatuses[day].status === 'complete' && dayStatuses[day].videoResult)
    .map(({ day, activity }) => ({
      dayNumber: day,
      activityName: activity,
      videoUrl: dayStatuses[day].videoResult!.videoUrl,
      rawImageUrl: dayStatuses[day].image?.url,
    }));
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
                {/* Hidden file input - single file only */}
                <input
                  type="file"
                  ref={(el) => { fileInputRefs.current[day] = el; }}
                  onChange={(e) => handleImageUpload(day, e.target.files)}
                  accept="image/*"
                  className="hidden"
                />

                {status.videoResult ? (
                  <BrutalistCard
                    videoUrls={[status.videoResult.videoUrl]}
                    dayNumber={day}
                    activityName={activity}
                  />
                ) : (
                  <div className="aspect-[9/16] bg-neutral-900 border-2 border-neutral-800 rounded-lg flex flex-col p-4">
                    {/* Day indicator */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-mono text-sm text-neutral-500">DAY {day}</span>
                      <span className="text-yellow-400 font-bold">{activity}</span>
                    </div>

                    {/* Single image display */}
                    {status.image ? (
                      <div className="relative aspect-video mb-4 group">
                        <img
                          src={status.image.url}
                          alt={status.image.name}
                          className="w-full h-full object-cover rounded"
                        />
                        <button
                          onClick={() => removeImage(day)}
                          disabled={status.status === 'generating'}
                          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {status.status === 'generating' && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
                            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                          </div>
                        )}
                        {status.status === 'complete' && (
                          <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center rounded">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRefs.current[day]?.click()}
                        className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-neutral-700 rounded-lg hover:border-yellow-400 transition-colors mb-4"
                      >
                        <Image className="w-12 h-12 text-neutral-600 mb-2" />
                        <span className="text-sm text-neutral-500 font-mono">TAP TO ADD</span>
                      </button>
                    )}

                    {/* Metadata inputs */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-neutral-500 font-mono w-16">DIST</label>
                        <Input
                          type="number"
                          value={status.distanceKm}
                          onChange={(e) => updateMetadata(day, 'distanceKm', Number(e.target.value))}
                          className="h-8 bg-neutral-800 border-neutral-700 text-white font-mono text-sm"
                          placeholder="km"
                        />
                        <span className="text-xs text-neutral-500">km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-neutral-500 font-mono w-16">TIME</label>
                        <Input
                          type="number"
                          value={status.durationMinutes}
                          onChange={(e) => updateMetadata(day, 'durationMinutes', Number(e.target.value))}
                          className="h-8 bg-neutral-800 border-neutral-700 text-white font-mono text-sm"
                          placeholder="min"
                        />
                        <span className="text-xs text-neutral-500">min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-neutral-500 font-mono w-16">CALS</label>
                        <Input
                          type="number"
                          value={status.calories}
                          onChange={(e) => updateMetadata(day, 'calories', Number(e.target.value))}
                          className="h-8 bg-neutral-800 border-neutral-700 text-white font-mono text-sm"
                          placeholder="cal"
                        />
                        <span className="text-xs text-neutral-500">cal</span>
                      </div>
                    </div>

                    {/* Status indicator */}
                    <div className="flex-1 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {status.status === 'error' && (
                          <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                          >
                            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="text-xs text-neutral-500 font-mono">
                              {status.error}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Replace image button */}
                    {status.image && status.status !== 'generating' && (
                      <Button
                        onClick={() => fileInputRefs.current[day]?.click()}
                        variant="outline"
                        size="sm"
                        className="w-full border-neutral-700 text-neutral-400 hover:text-white"
                      >
                        REPLACE IMAGE
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Film strip preview of raw images */}
        {hasAnyImages && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Film className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-mono text-neutral-400">RAW IMAGES FOR REEL</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {DAYS_CONFIG.map(({ day, activity }) => {
                const status = dayStatuses[day];
                if (!status.image) return null;
                
                return (
                  <div 
                    key={day} 
                    className="flex-shrink-0 w-32 bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800"
                  >
                    <img
                      src={status.image.url}
                      alt={`Day ${day}`}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="p-2 text-center">
                      <p className="text-xs font-mono text-yellow-400">DAY {day}</p>
                      <p className="text-xs text-neutral-500">{activity}</p>
                      {status.distanceKm > 0 && (
                        <p className="text-xs text-neutral-600">{status.distanceKm} km</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Combined Final Reel - shows when any day is complete */}
        {hasAnyComplete && allCompletedDays.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <Play className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-mono text-neutral-400">
                FINAL REEL ({allCompletedDays.length} DAY{allCompletedDays.length > 1 ? 'S' : ''})
              </h3>
            </div>
            <div className="max-w-sm mx-auto">
              <BrutalistCard allDaysData={allCompletedDays} />
            </div>
          </motion.div>
        )}

        {/* Generate All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Button
            onClick={generateAll}
            disabled={!apiKey.trim() || isGeneratingAll || !hasAnyImages || allComplete}
            size="lg"
            className="bg-yellow-400 text-black hover:bg-yellow-300 font-black text-xl px-12 py-6 h-auto"
          >
            {isGeneratingAll ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                {generationProgress 
                  ? `GENERATING ${generationProgress.completed}/${generationProgress.total}...`
                  : 'GENERATING...'
                }
              </>
            ) : allComplete && hasAnyImages ? (
              <>
                <CheckCircle className="w-6 h-6 mr-3" />
                ALL COMPLETE
              </>
            ) : (
              <>
                <Play className="w-6 h-6 mr-3" />
                GENERATE ALL DAYS
              </>
            )}
          </Button>

          <p className="mt-4 text-sm text-neutral-500 font-mono">
            Each day generates a 5-second video (~60-90s per day)
          </p>
        </motion.div>
      </div>
    </div>
  );
}
